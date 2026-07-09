
const { ethers, network } = require("hardhat");
const fs   = require("fs");
const path = require("path");


function buildDataString(cert) {
  return (
    cert.studentId     +
    cert.nationalId    +
    cert.fullName      +
    cert.degreeTitle   +
    cert.graduationYear
  );
}

/**
 * Computes the keccak256 hash of a credential data string.
 * Mirrors the NestJS service: ethers.keccak256(ethers.toUtf8Bytes(dataString))
 */
function computeDataHash(cert) {
  return ethers.keccak256(ethers.toUtf8Bytes(buildDataString(cert)));
}

function loadDeployment() {
  const deployFile = path.join(
    __dirname, `../deployments/${network.name}.json`
  );
  if (!fs.existsSync(deployFile)) {
    throw new Error(
      `No deployment found for "${network.name}". ` +
      `Run deploy.js first.`
    );
  }
  return JSON.parse(fs.readFileSync(deployFile, "utf8"));
}

// ─────────────────────────────────────────────────────────────────────────────
//  Actions
// ─────────────────────────────────────────────────────────────────────────────

async function issue(registry, operator) {
  // Sample certificate — replace with your actual data
  const cert = {
    studentId:      "STU-2024-001",
    nationalId:     "RW-NAT-123456",
    fullName:       "Alice Uwimana",
    degreeTitle:    "Bachelor of Science in Computer Science",
    graduationYear: "2024",
  };

  const issuerDid  = "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuias8zXZQmn";
  const dataHash   = computeDataHash(cert);

  console.log("Data string :", buildDataString(cert));
  console.log("Data hash   :", dataHash);
  console.log("Issuer DID  :", issuerDid);

  const tx = await registry.issueCredentials([dataHash], [issuerDid]);
  const receipt = await tx.wait();
  console.log("✅ Issued! Tx:", receipt.hash);
  return dataHash;
}

async function revoke(registry) {
  // Replace with your actual hash and DID
  const dataHash  = process.env.DATA_HASH  || "0x" + "a".repeat(64);
  const issuerDid = process.env.ISSUER_DID || "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuias8zXZQmn";

  console.log("Revoking hash:", dataHash);
  const tx = await registry.revokeCredential(dataHash, issuerDid);
  const receipt = await tx.wait();
  console.log("✅ Revoked! Tx:", receipt.hash);
}

async function query(registry) {
  const dataHash = process.env.DATA_HASH || "0x" + "a".repeat(64);
  console.log("Querying hash:", dataHash);

  const { issuerDid, blockTime, isRevoked, exists } =
    await registry.getCredential(dataHash);

  console.log("\n─── Credential Result ─────────────────────────");
  console.log("  exists    :", exists);
  if (exists) {
    console.log("  issuerDid :", issuerDid);
    console.log("  blockTime :", new Date(Number(blockTime) * 1000).toISOString());
    console.log("  isRevoked :", isRevoked);
  } else {
    console.log("  ❌ No credential found for this hash");
  }
}

async function batch(registry) {
  // Simulates a real NestJS batch mint
  const certificates = [
    { studentId: "STU-001", nationalId: "RW-001", fullName: "Alice",   degreeTitle: "BSc CS",   graduationYear: "2024" },
    { studentId: "STU-002", nationalId: "RW-002", fullName: "Bob",     degreeTitle: "BSc EE",   graduationYear: "2024" },
    { studentId: "STU-003", nationalId: "RW-003", fullName: "Carol",   degreeTitle: "MSc DS",   graduationYear: "2024" },
    { studentId: "STU-004", nationalId: "RW-004", fullName: "David",   degreeTitle: "BEng ME",  graduationYear: "2024" },
    { studentId: "STU-005", nationalId: "RW-005", fullName: "Eve",     degreeTitle: "MBA",      graduationYear: "2024" },
  ];

  const issuerDid = "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuias8zXZQmn";

  const dataHashes = certificates.map(computeDataHash);
  const issuerDids = certificates.map(() => issuerDid);

  console.log(`Issuing batch of ${certificates.length} credentials...`);
  certificates.forEach((c, i) => console.log(`  [${i}] ${c.fullName} → ${dataHashes[i]}`));

  const tx = await registry.issueCredentials(dataHashes, issuerDids);
  const receipt = await tx.wait();
  console.log("\n✅ Batch issued! Tx:", receipt.hash);
  console.log("   Gas used:", receipt.gasUsed.toString());
}


async function main() {
  const action = (process.env.ACTION || "query").toLowerCase();

  console.log(`\n─── CredentialRegistry :: interact.js [action=${action}] ───\n`);

  const { contractAddress } = loadDeployment();
  const [operator]          = await ethers.getSigners();
  const factory             = await ethers.getContractFactory("CredentialRegistry");
  const registry            = factory.attach(contractAddress);

  console.log("Contract :", contractAddress);
  console.log("Operator :", operator.address, "\n");

  switch (action) {
    case "issue":  await issue(registry, operator);  break;
    case "revoke": await revoke(registry);            break;
    case "query":  await query(registry);             break;
    case "batch":  await batch(registry);             break;
    default:
      console.error(`Unknown action "${action}". Use: issue | revoke | query | batch`);
      process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
  });
