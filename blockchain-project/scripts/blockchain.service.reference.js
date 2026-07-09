/**
 * blockchain.service.reference.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reference implementation showing how your NestJS BlockchainService
 * should interact with the deployed CredentialRegistry contract.
 *
 * ALIGNED WITH BACKEND SCHEMA:
 *   - Uses student.student_id_number (NOT student_id)
 *   - Uses student.national_id
 *   - Works with Certificate + Student entities as they exist
 *
 * This is NOT a runnable NestJS file — it is a plain-JS reference so you can
 * study the exact ethers.js patterns before wiring them into your NestJS module.
 *
 * Key operations shown:
 *   1. Provider & signer setup (Optimism Sepolia)
 *   2. Deterministic data string + keccak256 hash (aligned with backend schema)
 *   3. Batch mint  → issueCredentials()
 *   4. Revoke      → revokeCredential()
 *   5. Verify      → getCredential()  (three-way match)
 * ─────────────────────────────────────────────────────────────────────────────
 */

const { ethers } = require("ethers");

// ── ABI (minimal — only the functions BlockchainService calls) ──────────────
const REGISTRY_ABI = [
  // Write
  "function issueCredentials(bytes32[] calldata _dataHashes, string[] calldata _issuerDids) external",
  "function revokeCredential(bytes32 _dataHash, string calldata _issuerDid) external",

  // Read
  "function getCredential(bytes32 _dataHash) external view returns (string memory issuerDid, uint32 blockTime, bool isRevoked, bool exists)",
  "function getCredentialsBatch(bytes32[] calldata _dataHashes) external view returns (tuple(string issuerDid, uint32 blockTime, bool isRevoked)[])",
  "function credentialExists(bytes32 _dataHash) external view returns (bool)",
  "function authorizedOperators(address) external view returns (bool)",

  // Events
  "event CredentialIssued(bytes32 indexed dataHash, string indexed issuerDid, uint32 blockTime)",
  "event CredentialRevoked(bytes32 indexed dataHash, string indexed issuerDid, address revokedBy, uint32 blockTime)",
];

// ── Configuration (mirrors your NestJS ConfigService / .env) ─────────────────
const CONFIG = {
  rpcUrl:           process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io",
  contractAddress:  process.env.CREDENTIAL_REGISTRY_ADDRESS,
  operatorKey:      process.env.OPERATOR_PRIVATE_KEY,   // gas wallet
  masterAesKey:     process.env.MASTER_AES_KEY,         // for decrypting university keys
};

// ─────────────────────────────────────────────────────────────────────────────
//  1. Provider & Signer Setup
// ─────────────────────────────────────────────────────────────────────────────

function createProvider() {
  return new ethers.JsonRpcProvider(CONFIG.rpcUrl);
}

function createOperatorSigner(provider) {
  // This is your platform's gas wallet — the only wallet that pays gas on-chain.
  return new ethers.Wallet(CONFIG.operatorKey, provider);
}

function createRegistryContract(signerOrProvider) {
  return new ethers.Contract(CONFIG.contractAddress, REGISTRY_ABI, signerOrProvider);
}

// ─────────────────────────────────────────────────────────────────────────────
//  2. Deterministic Data String & Hash (ALIGNED WITH BACKEND SCHEMA)
//     ⚠️  The concatenation order MUST exactly match this formula forever.
//     Changing it would invalidate all existing on-chain hashes.
//
//     Backend Schema Mapping:
//       - cert.student.student_id_number (from Student entity)
//       - cert.student.national_id (from Student entity)
//       - cert.student.full_name (from Student entity)
//       - cert.degree_title (from Certificate entity)
//       - cert.graduation_year (from Certificate entity)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds the canonical data string from a certificate record.
 * ALIGNED WITH YOUR BACKEND SCHEMA - uses student relationship fields.
 * 
 * @param {object} cert  Certificate row from PostgreSQL with populated student relation.
 * @returns {string}
 */
function buildDataString(cert) {
  // Formula: student_id_number + national_id + full_name + degree_title + graduation_year
  // Note: Access via cert.student.* because of TypeORM relationships
  return (
    (cert.student?.student_id_number || '') +
    (cert.student?.national_id || '') +
    (cert.student?.full_name || '') +
    (cert.degree_title || '') +
    String(cert.graduation_year || '')
  );
}

/**
 * Computes the keccak256 hash of a certificate's canonical data string.
 * This is stored in the Certificates.data_hash column and on-chain.
 * @param {object} cert
 * @returns {string}  0x-prefixed hex hash
 */
function computeDataHash(cert) {
  const dataString = buildDataString(cert);
  return ethers.keccak256(ethers.toUtf8Bytes(dataString));
}

// ─────────────────────────────────────────────────────────────────────────────
//  3. Batch Mint  (BlockchainService.mintBatch)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Issues a batch of PENDING certificates on-chain.
 *
 * NestJS equivalent:
 *   async mintBatch(certificates: Certificate[], university: University): Promise<string>
 *
 * @param {object[]} certificates  Array of PENDING certificate rows from PostgreSQL.
 * @param {string}   issuerDid     The university's did_identifier from the Universities table.
 * @returns {string} Transaction hash.
 */
async function mintBatch(certificates, issuerDid) {
  if (!certificates.length) throw new Error("Empty certificate batch");

  const provider = createProvider();
  const signer   = createOperatorSigner(provider);
  const registry = createRegistryContract(signer);

  // Step 1: Build hashes for each certificate
  const dataHashes = certificates.map(computeDataHash);
  const issuerDids = certificates.map(() => issuerDid);

  console.log(`[BlockchainService] Minting batch of ${certificates.length} credentials`);
  console.log(`[BlockchainService] Issuer DID: ${issuerDid}`);

  // Step 2: Estimate gas (optional but recommended for monitoring)
  const gasEstimate = await registry.issueCredentials.estimateGas(dataHashes, issuerDids);
  console.log(`[BlockchainService] Estimated gas: ${gasEstimate.toString()}`);

  // Step 3: Send transaction
  const tx = await registry.issueCredentials(dataHashes, issuerDids);
  console.log(`[BlockchainService] Tx submitted: ${tx.hash}`);

  // Step 4: Wait for confirmation (1 block on Optimism is ~2 seconds)
  const receipt = await tx.wait(1);
  console.log(`[BlockchainService] Tx confirmed in block ${receipt.blockNumber}`);

  // Step 5: Return tx hash → NestJS saves this to Certificates.transaction_hash
  //         and updates status from PENDING → ISSUED
  return receipt.hash;
}

// ─────────────────────────────────────────────────────────────────────────────
//  4. Revoke Credential  (BlockchainService.revokeCredential)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Revokes a single on-chain credential.
 *
 * The NestJS service MUST verify the off-chain ed25519/secp256k1 signature
 * against the university's public_key_hex BEFORE calling this function.
 * The contract enforces a DID string equality check as a second guard.
 *
 * @param {string} dataHash   Hex keccak256 hash (from Certificates.data_hash).
 * @param {string} issuerDid  The university's did_identifier.
 * @returns {string} Transaction hash.
 */
async function revokeCredential(dataHash, issuerDid) {
  const provider = createProvider();
  const signer   = createOperatorSigner(provider);
  const registry = createRegistryContract(signer);

  console.log(`[BlockchainService] Revoking: ${dataHash}`);

  const tx = await registry.revokeCredential(dataHash, issuerDid);
  const receipt = await tx.wait(1);

  console.log(`[BlockchainService] Revoked in tx: ${receipt.hash}`);
  return receipt.hash;
}

// ─────────────────────────────────────────────────────────────────────────────
//  5. Three-Way Match Verification  (VerificationService.verify)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Executes the three-way match engine as described in the spec.
 *
 * Call flow in NestJS VerificationService:
 *   Step 1 — Pull certificate row from PostgreSQL by certificate_id
 *   Step 2 — Recompute keccak256 hash and compare against DB data_hash
 *   Step 3 — Query on-chain and validate three gates
 *
 * This function implements Steps 2 & 3.
 *
 * @param {object} dbRecord   Certificate row + student + university from PostgreSQL.
 * @returns {object} Verification result packet.
 */
async function verifyCredential(dbRecord) {
  const provider = createProvider();
  const registry = createRegistryContract(provider); // read-only; no signer needed

  // ── Step 2: Runtime hash recalculation ───────────────────────
  const recomputedHash = computeDataHash(dbRecord);

  if (recomputedHash !== dbRecord.data_hash) {
    // SQL row was tampered — hash doesn't match stored value
    throw new Error("DataTamperedException: database record hash mismatch");
  }

  // ── Step 3: On-chain registry validation ─────────────────────
  const { issuerDid, blockTime, isRevoked, exists } =
    await registry.getCredential(dbRecord.data_hash);

  // Gate 1: Record must exist on-chain
  if (!exists) {
    return {
      valid:   false,
      reason:  "CREDENTIAL_NOT_ON_CHAIN",
      message: "No on-chain record found for this credential hash.",
    };
  }

  // Gate 2: Must not be revoked
  if (isRevoked) {
    return {
      valid:   false,
      reason:  "CREDENTIAL_REVOKED",
      message: "This credential has been revoked by the issuing university.",
    };
  }

  // Gate 3: On-chain issuerDid must exactly match local DB did_identifier
  if (issuerDid !== dbRecord.university.did_identifier) {
    return {
      valid:   false,
      reason:  "DID_MISMATCH",
      message: "Issuer DID on chain does not match database record.",
    };
  }

  // All three gates passed ✅
  return {
    valid:          true,
    reason:         "VERIFIED",
    message:        "Credential is authentic and has not been tampered with.",
    issuerDid,
    issuedAt:       new Date(Number(blockTime) * 1000).toISOString(),
    isRevoked:      false,
    dataHash:       dbRecord.data_hash,
    certificateId:  dbRecord.id,
    graduate: {
      fullName:       dbRecord.student.full_name,
      studentIdNumber: dbRecord.student.student_id_number,
      nationalId:     dbRecord.student.national_id,
      degreeTitle:    dbRecord.degree_title,
      graduationYear: dbRecord.graduation_year,
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Local Key Decryption Pattern (for reference only)
//  ⚠️  In NestJS, use Node.js crypto module; NEVER log the raw key.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Demonstrates the in-memory key decryption pattern described in the spec.
 * The university private key is decrypted, used to sign, then wiped.
 *
 * In production NestJS:
 *   - Use `crypto.createDecipheriv('aes-256-gcm', masterKey, iv)`
 *   - Sign with `@noble/ed25519` or `ethers.Wallet.signMessage()`
 *   - Assign null to rawKey variable immediately after signing
 */
function decryptAndSignExample() {
  // Pseudocode — do NOT implement crypto here; use NestJS CryptoService
  const pattern = `
    // 1. Fetch encrypted_private_key from Universities table
    const encryptedKey = university.encrypted_private_key;

    // 2. Decrypt in memory using master AES-256-GCM key from env
    const { iv, authTag, ciphertext } = parseEncryptedKey(encryptedKey);
    const decipher = crypto.createDecipheriv('aes-256-gcm', masterKeyBuffer, iv);
    decipher.setAuthTag(authTag);
    let rawKey = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    // 3. Sign the data hashes
    const signatures = await signHashes(dataHashes, rawKey);

    // 4. Immediately wipe from memory
    rawKey.fill(0);
    rawKey = null;

    // 5. Pass signatures to on-chain verification (or store off-chain)
    return signatures;
  `;
  return pattern;
}

// ─────────────────────────────────────────────────────────────────────────────
//  Export (if using as a module)
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  buildDataString,
  computeDataHash,
  mintBatch,
  revokeCredential,
  verifyCredential,
  REGISTRY_ABI,
};
