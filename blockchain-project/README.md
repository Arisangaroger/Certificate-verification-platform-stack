# CredentialRegistry — Blockchain Layer

On-chain credential registry for the Academic Credential Verification Platform.  
Deployed on **Optimism Sepolia** testnet using **Hardhat**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    NestJS Backend                           │
│                                                             │
│  BlockchainModule          VerificationModule               │
│  ┌─────────────────┐       ┌──────────────────────────┐    │
│  │BlockchainService│       │VerificationService        │    │
│  │                 │       │  Three-Way Match Engine   │    │
│  │ 1. Build hash   │       │  Step 1: DB lookup        │    │
│  │ 2. Decrypt key  │       │  Step 2: Hash recompute   │    │
│  │ 3. Sign locally │       │  Step 3: On-chain query   │    │
│  │ 4. Call contract│       └──────────┬───────────────┘    │
│  └────────┬────────┘                  │                     │
└───────────┼───────────────────────────┼─────────────────────┘
            │                           │
            ▼                           ▼
┌───────────────────────────────────────────────────────────┐
│              CredentialRegistry.sol (Optimism Sepolia)    │
│                                                           │
│  issueCredentials(bytes32[], string[])                    │
│  revokeCredential(bytes32, string)                        │
│  getCredential(bytes32) → (did, time, revoked, exists)    │
└───────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
blockchain-project/
├── contracts/
│   └── CredentialRegistry.sol          # Main smart contract
├── scripts/
│   ├── deploy.js                       # Deployment script
│   ├── verify-setup.js                 # Post-deploy sanity checks
│   ├── interact.js                     # Issue / revoke / query helpers
│   └── blockchain.service.reference.js # NestJS integration reference
├── test/
│   └── CredentialRegistry.test.js      # Full test suite (~25 tests)
├── ignition/
│   └── modules/
│       └── CredentialRegistryModule.js # Hardhat Ignition module
├── deployments/                        # Auto-generated after deploy
│   └── optimism-sepolia.json
├── hardhat.config.js
├── .env.example
└── README.md
```

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| Git | any |

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DEPLOYER_PRIVATE_KEY` | Wallet that deploys the contract (must have Sepolia ETH) |
| `OPERATOR_WALLET_ADDRESS` | Platform gas wallet granted operator role |
| `OPERATOR_PRIVATE_KEY` | Same gas wallet's private key (for NestJS) |
| `OPTIMISM_SEPOLIA_RPC_URL` | JSON-RPC endpoint (see below) |
| `OPTIMISM_ETHERSCAN_API_KEY` | For contract source verification |

### 3. Get testnet ETH

Fund your **deployer** and **operator** wallets:
- **Alchemy Faucet**: https://www.alchemy.com/faucets/optimism-sepolia
- **Superchain Faucet**: https://app.optimism.io/faucet

### 4. Get an RPC URL (choose one)

| Provider | Free Tier | URL Pattern |
|----------|-----------|-------------|
| Public RPC | Yes | `https://sepolia.optimism.io` |
| Alchemy | Yes | `https://opt-sepolia.g.alchemy.com/v2/YOUR_KEY` |
| Infura | Yes | `https://optimism-sepolia.infura.io/v3/YOUR_KEY` |

---

## Deployment

### Compile

```bash
npx hardhat compile
```

### Run tests

```bash
npx hardhat test
```

With gas report:
```bash
REPORT_GAS=true npx hardhat test
```

With coverage:
```bash
npx hardhat coverage
```

### Deploy to Optimism Sepolia

```bash
npx hardhat run scripts/deploy.js --network optimism-sepolia
```

The script will:
1. Deploy `CredentialRegistry` with your operator wallet
2. Save deployment info to `deployments/optimism-sepolia.json`
3. Automatically verify the contract source on Etherscan

### Post-deploy verification

```bash
npx hardhat run scripts/verify-setup.js --network optimism-sepolia
```

This issues a test credential, reads it back, revokes it, and confirms all three verification gates pass.

---

## Contract Interaction

### Issue credentials (batch)

```bash
ACTION=batch npx hardhat run scripts/interact.js --network optimism-sepolia
```

### Query a credential

```bash
DATA_HASH=0xabc123... npx hardhat run scripts/interact.js --network optimism-sepolia
```

### Revoke a credential

```bash
ACTION=revoke DATA_HASH=0xabc123... ISSUER_DID=did:key:z6Mk... \
  npx hardhat run scripts/interact.js --network optimism-sepolia
```

---

## Smart Contract Reference

### `issueCredentials(bytes32[] _dataHashes, string[] _issuerDids)`

| | |
|--|--|
| **Caller** | Authorized operator (platform gas wallet) |
| **Purpose** | Registers a batch of credential hashes on-chain |
| **Reverts** | `EmptyBatch`, `ArrayLengthMismatch`, `BatchTooLarge`, `CredentialAlreadyExists`, `InvalidIssuerDid` |

### `revokeCredential(bytes32 _dataHash, string _issuerDid)`

| | |
|--|--|
| **Caller** | Authorized operator |
| **Purpose** | Marks a credential as revoked. DID must match on-chain record |
| **Reverts** | `CredentialNotFound`, `CredentialAlreadyRevoked`, `DIDMismatch` |

### `getCredential(bytes32 _dataHash)` ← gas-free read

Returns:

| Field | Type | Description |
|-------|------|-------------|
| `issuerDid` | `string` | W3C `did:key:z6Mk...` string |
| `blockTime` | `uint32` | Unix timestamp of issuance |
| `isRevoked` | `bool` | Revocation flag |
| `exists` | `bool` | Whether hash was ever registered |

---

## NestJS Integration

### Copy these values into your NestJS `.env`

After deployment, add to your NestJS project:

```env
# From deployments/optimism-sepolia.json
CREDENTIAL_REGISTRY_ADDRESS=0x...
OPTIMISM_SEPOLIA_RPC_URL=https://sepolia.optimism.io

# Gas wallet
OPERATOR_PRIVATE_KEY=0x...

# University key encryption
MASTER_AES_KEY=<32-byte hex or base64 secret>
```

### Data hash formula

The keccak256 input string **must** use this exact concatenation order:

```
dataString = student_id + national_id + full_name + degree_title + graduation_year
dataHash   = keccak256(toUtf8Bytes(dataString))
```

See `scripts/blockchain.service.reference.js` for the full NestJS integration pattern including:
- Provider and signer setup
- `mintBatch()` implementation
- `verifyCredential()` three-way match engine
- AES-256-GCM key decryption pattern

### Contract ABI

The minimal ABI needed by NestJS is in `blockchain.service.reference.js` as `REGISTRY_ABI`.  
The full ABI is generated at `artifacts/contracts/CredentialRegistry.sol/CredentialRegistry.json` after compiling.

---

## Three-Way Match Verification Engine

```
QR Code / URL  →  certificate_id
                      │
               ┌──────▼──────────────────────┐
               │  Step 1: PostgreSQL lookup   │
               │  Pull: student fields +      │
               │  university did_identifier   │
               └──────┬──────────────────────┘
                      │
               ┌──────▼──────────────────────┐
               │  Step 2: Hash recompute      │
               │  keccak256(data string)      │──► ≠ data_hash? → DataTamperedException
               └──────┬──────────────────────┘
                      │
               ┌──────▼──────────────────────┐
               │  Step 3: On-chain query      │
               │  getCredential(data_hash)    │
               │                             │
               │  Gate 1: exists == true      │──► false → CREDENTIAL_NOT_ON_CHAIN
               │  Gate 2: isRevoked == false  │──► true  → CREDENTIAL_REVOKED
               │  Gate 3: issuerDid == DB DID │──► ≠     → DID_MISMATCH
               └──────┬──────────────────────┘
                      │
               ✅  VERIFIED — return success packet
```

---

## Security Notes

- **Private keys**: Never stored in plaintext. University signing keys are encrypted at rest with AES-256-GCM and decrypted in-memory only during signing, then immediately wiped.
- **Operator role**: Only the platform gas wallet can write to the contract. Universities sign off-chain; signatures are verified in NestJS before any on-chain call.
- **Pause mechanism**: The contract owner can pause all write operations in an emergency without affecting public read access.
- **Re-entrancy**: All write functions use OpenZeppelin's `ReentrancyGuard`.
- **did:key**: DIDs are derived from public keys, not stored in any external registry. Verification is fully local and zero-cost.

---

## Network Details

| | Optimism Sepolia |
|--|--|
| **Chain ID** | 11155420 |
| **RPC** | https://sepolia.optimism.io |
| **Explorer** | https://sepolia-optimistic.etherscan.io |
| **Native token** | ETH (test) |
| **Block time** | ~2 seconds |
| **Gas** | Very low (L2) |
