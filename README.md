# Blockchain Certificate Verification Platform

A full-stack platform that lets universities **issue academic certificates**, anchor them on a **public blockchain (Optimism Sepolia L2)**, and lets **anyone verify** a certificate's authenticity in seconds — without exposing student personal data on-chain.

> **Issuance flow:** `University (Institution)` → `Create Certificate` → `Issue to Blockchain` → `Student owns & shares certificate` → `Public verifies`

---

## Table of Contents

1. [What this project delivers](#1-what-this-project-delivers)
2. [How it maps to the assessment requirements](#2-how-it-maps-to-the-assessment-requirements)
3. [Architecture](#3-architecture)
4. [The verification model (the core idea)](#4-the-verification-model-the-core-idea)
5. [Smart contract](#5-smart-contract)
6. [Tech stack](#6-tech-stack)
7. [Fixed ports (important)](#7-fixed-ports-important)
8. [Prerequisites](#8-prerequisites)
9. [Clone the project](#9-clone-the-project)
10. [PostgreSQL database setup](#10-postgresql-database-setup)
11. [Run the backend (port 3000)](#11-run-the-backend-port-3000)
12. [Run the frontend (port 3001)](#12-run-the-frontend-port-3001)
13. [Smart contract: test & deploy](#13-smart-contract-test--deploy)
14. [Roles, users, and how to use the platform](#14-roles-users-and-how-to-use-the-platform)
15. [API reference & Swagger](#15-api-reference--swagger)
16. [Project structure](#16-project-structure)
17. [Troubleshooting](#17-troubleshooting)

---

## 1. What this project delivers

This is **not** a single script — it is three coordinated sub-projects that together form a production-shaped platform:

- **Smart contract** (`blockchain-project/`) — Solidity `CredentialRegistry` deployed on Optimism Sepolia, plus a full Hardhat test suite.
- **Backend API** (`certificate-verification-backend/`) — NestJS REST API handling auth, Excel ingestion, hashing, on-chain minting, verification, and PDF/QR generation.
- **Frontend** (`certificate-verification-frontend/`) — Next.js app with an admin console, a student portal, and a public verification page.

Key capabilities:

- **Batch certificate creation** from an Excel/CSV upload (real registrar workflow, not one-by-one dummy data).
- **On-chain anchoring**: each certificate becomes a `keccak256` commitment stored on a public L2 blockchain.
- **Privacy by design**: student names / national IDs / degrees are **never** written on-chain — only a hash + the issuing university's DID.
- **Tamper-proof verification**: a three-way match (Database ↔ Recomputed hash ↔ Blockchain) instantly detects any altered record.
- **Revocation**: a university can revoke a credential on-chain; verification then fails.
- **PDF + QR**: every certificate generates a PDF with a QR code pointing to its public verification page.

---

## 2. How it maps to the assessment requirements

**Assessment brief:** *Digital Certificate Issuance Platform — Institution → Issue Certificate → Blockchain → Student owns certificate.*

**Required features (all done):**

- **Create certificate** — the `file-upload` module's `processBatch()` creates DB records with status `ISSUED`.
- **Issue certificate** — `POST /api/certificates/issue-to-blockchain/:universityId` mints the records on-chain and flips them to `VERIFIED`.
- **Transfer ownership disabled** — certificates are **hash commitments in a mapping**, not transferable tokens; there is no `transfer()` function, so ownership cannot be moved (disabled by design).
- **Verify certificate** — public `GET /api/verification/:id` and the `/verify/:id` page run the three-way match.
- **Dashboard** — an admin dashboard (`/admin/dashboard`) and a student portal (`/portal/dashboard`).

**Required tests / components (evidence):**

- **Solidity** — `blockchain-project/contracts/CredentialRegistry.sol`.
- **Smart Contracts** — deployed at `0xC244d92B2bdEE4f755734C601C156D9B67774ec3` (Optimism Sepolia) and consumed by the backend `BlockchainService`.
- **Metadata** — on-chain metadata is `issuerDid`, `blockTime`, and `isRevoked`; richer metadata (name, degree, award) is kept off-chain in PostgreSQL and the generated PDF.
- **IPFS (optional)** — intentionally **not** used; off-chain DB + generated PDF were chosen for privacy/GDPR reasons (IPFS is optional in the brief).
- **Backend** — a full NestJS backend (`certificate-verification-backend/`).
- **Events** — the contract emits `CredentialIssued` and `CredentialRevoked`, both covered by the Hardhat test suite.

**Note on "Student owns certificate":** Ownership in this platform is **portal-based, not wallet-based**. A student authenticates with their Registration Number + National ID (via OTP) and owns their credentials in the student portal: they can view them, download signed PDFs, and share verification links/QR codes. Integrity and issuer authenticity are guaranteed **on-chain** through a non-transferable hash commitment tied to the issuing university's DID. This model was chosen because it is more privacy-preserving and matches how real universities operate (students do not need a crypto wallet to prove their degree).

---

## 3. Architecture

### System architecture

![System architecture diagram](docs/diagrams/architecture.png)

### Database ERD

![Entity Relationship Diagram](docs/diagrams/erd.png)

**Certificate lifecycle:**

```
Excel upload ──► DB rows (verification_status = ISSUED, data_hash computed)
                     │
                     ▼
Admin clicks "Issue to Blockchain"
                     │
                     ▼
BlockchainService.issueCertificatesBatch(certs, universityDID)
                     │
                     ▼
CredentialRegistry.issueCredentials(hashes[], dids[])  ──► on-chain
                     │
                     ▼
DB updated (verification_status = VERIFIED, blockchain_transaction_hash set)
```

---

## 4. The verification model (the core idea)

When anyone verifies a certificate, the backend runs a **Three-Way Match** (`verification.service.ts`):

1. **Database resolution** — load the certificate + student + university by ID.
2. **Runtime hash recalculation** — recompute `keccak256(student_id + national_id + full_name + degree_title + graduation_year)` and compare it to the stored `data_hash`. *Mismatch = the database was tampered with.*
3. **On-chain validation (three gates):**
   - **Gate 1 — Exists:** the hash must exist in the on-chain registry.
   - **Gate 2 — Not revoked:** `isRevoked` must be `false`.
   - **Gate 3 — Issuer match:** the on-chain `issuerDid` must equal the university's `did_identifier` in the database.

Only if **all** checks pass is the certificate reported as authentic. This proves the record is genuine, unaltered, issued by the claimed university, and still valid — all without any personal data on the blockchain.

---

## 5. Smart contract

**File:** `blockchain-project/contracts/CredentialRegistry.sol`
**Network:** Optimism Sepolia (chainId `11155420`)
**Address:** `0xC244d92B2bdEE4f755734C601C156D9B67774ec3`

Storage is a mapping (not an array), giving O(1) lookups and cheap batch writes:

```solidity
struct RecordMetadata {
    string  issuerDid;   // e.g. "did:key:z6Mkp..."
    uint32  blockTime;
    bool    isRevoked;
}
mapping(bytes32 => RecordMetadata) public registry;
```

Highlights:

- `issueCredentials(bytes32[] hashes, string[] dids)` — operator-only batch mint (max 500), reverts on duplicates.

- `revokeCredential(bytes32 hash, string did)` — issuer-guarded revocation.

- `getCredential(bytes32 hash)` — read used by verification.

- Security: `Ownable`, `Pausable`, `ReentrancyGuard`, operator allow-list, custom errors.

- Events: `CredentialIssued`, `CredentialRevoked`, `OperatorAdded`, `OperatorRemoved`.

---

## 6. Tech stack

- **Blockchain:** Solidity 0.8.20, Hardhat, OpenZeppelin, ethers v6, Optimism Sepolia (L2)
- **Backend:** NestJS 11, TypeORM, PostgreSQL, JWT + OTP auth, Puppeteer (PDF), ethers v6
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, SWR, axios

- **Identity:** W3C `did:key` DIDs per university, AES-encrypted key storage

---

## 7. Fixed ports (important)

These ports are **fixed and required** — CORS rules and QR verification links depend on them:

- **Backend API** — http://localhost:3000 (port **3000**)

- **Backend Swagger docs** — http://localhost:3000/api/docs (port 3000)

- **Frontend** — http://localhost:3001 (port **3001**)

They are enforced in code:

- **Backend** listens on `3000` (`certificate-verification-backend/src/main.ts`) and its `.env` sets `PORT=3000`.
- **Frontend** dev/start scripts are pinned with `next -p 3001` (`certificate-verification-frontend/package.json`).
- **Frontend → Backend** calls use `NEXT_PUBLIC_API_URL=http://localhost:3000/api` (`.env.local`).
- Backend **CORS** already allows `http://localhost:3001`.

---

## 8. Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** 9+
- **PostgreSQL** 14+ running locally (or a hosted Postgres connection string)
- **Google Chrome** installed (used by Puppeteer for PDF generation)
- A funded **Optimism Sepolia** test wallet is only needed if you want to re-deploy the contract or mint new certificates (the contract is already deployed).

---

## 9. Clone the project

```bash
git clone https://github.com/Arisangaroger/Certificate-verification-platform-stack.git "Certificate verification platform"
cd "Certificate verification platform"
```

The repository contains three folders: `blockchain-project/`, `certificate-verification-backend/` (backend), and `certificate-verification-frontend/` (frontend).

---

## 10. PostgreSQL database setup

The backend uses **PostgreSQL** via TypeORM. You must have a running Postgres instance before starting the API.

### Option A — Local PostgreSQL (recommended for development)

**1. Install PostgreSQL 14+**  
Download from [postgresql.org](https://www.postgresql.org/download/) or install via package manager (e.g. `choco install postgresql` on Windows).

**2. Create the database**

Open **psql**, **pgAdmin**, or any SQL client and run:

```sql
CREATE DATABASE "CertificateVerificationDB";
```

You can use a different name — just match it in your `.env` file.

**3. Configure the backend `.env`**

Copy the example file and set your Postgres credentials:

```bash
cd certificate-verification-backend
copy .env.example .env       # Windows
# cp .env.example .env       # macOS / Linux
```

Edit `.env` with your local connection details:

```env
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=CertificateVerificationDB
```

**4. How the backend connects**

On startup, NestJS reads these variables in `src/app.module.ts` and opens a TypeORM connection to PostgreSQL. When `NODE_ENV=development`, TypeORM **`synchronize: true`** automatically creates/updates tables (`universities`, `student`, `certificates`, `institution_admins`) — you do not need to run migrations manually for local dev.

**5. Test the connection manually (optional)**

Using `psql`:

```bash
psql -h localhost -p 5432 -U postgres -d CertificateVerificationDB
```

Using a connection URI format (same values as above):

```text
postgresql://postgres:your_postgres_password@localhost:5432/CertificateVerificationDB
```

If this connects, the backend will connect too once the same values are in `.env`.

### Option B — Hosted PostgreSQL (Neon, Render, Supabase, etc.)

For cloud deployments, use a single connection string instead of individual `DB_*` variables:

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require
```

When `DATABASE_URL` is set, the backend uses it automatically and enables SSL in production mode.

### Tables created automatically

On first successful backend start, TypeORM creates:

- `universities` — institution records + blockchain DID
- `student` — student profiles
- `certificates` — credential records (`ISSUED` / `VERIFIED`)
- `institution_admins` — admin accounts (`SUPER_ADMIN`, `REGISTRAR`, `VIEWER`)

After the database is connected, create your first Super Admin — see [section 14](#14-roles-users-and-how-to-use-the-platform).

---

## 11. Run the backend (port 3000)

```bash
cd certificate-verification-backend

# 1. Install dependencies
npm install

# 2. Create your environment file
#    Copy the example and fill in the values (see notes below)
copy .env.example .env       # Windows PowerShell / CMD
# cp .env.example .env       # macOS / Linux

# 3. Start the API in watch mode
npm run start:dev
```

The backend starts on **http://localhost:3000** and Swagger docs are at **http://localhost:3000/api/docs**.

The backend also includes Jest unit tests (verification, blockchain hashing, certificates, file upload) in `certificate-verification-backend/src/**/*.spec.ts`. Run them with `npm test` from the backend folder.

**Required `.env` values** (see `certificate-verification-backend/.env.example`):

- `PORT` — must be `3000`.
- `FRONTEND_URL` — `http://localhost:3001` (for CORS + QR links).
- `DB_HOST` / `DB_PORT` / `DB_USERNAME` / `DB_PASSWORD` / `DB_NAME` — PostgreSQL connection (or use `DATABASE_URL`).
- `JWT_SECRET` — any strong secret.
- `SMTP_*` / `MAIL_FROM` — email/OTP delivery (Brevo SMTP).
- `OPTIMISM_SEPOLIA_RPC_URL` — `https://sepolia.optimism.io`.
- `OPERATOR_PRIVATE_KEY` — the wallet that pays gas for minting.
- `CREDENTIAL_REGISTRY_ADDRESS` — `0xC244d92B2bdEE4f755734C601C156D9B67774ec3`.
- `MASTER_AES_KEY` — key used to encrypt each university's private key.
- `PUPPETEER_EXECUTABLE_PATH` — path to Chrome (for PDF generation).

> **First run:** TypeORM auto-creates the tables (see [section 10](#10-postgresql-database-setup)). You then need one **Super Admin** account to log in — see [section 14](#14-roles-users-and-how-to-use-the-platform).

> **Security:** never commit a real `.env`. Use dedicated **testnet-only** keys.

---

## 12. Run the frontend (port 3001)

Open a **second terminal**:

```bash
cd certificate-verification-frontend

# 1. Install dependencies
npm install

# 2. Create the local env file
copy .env.local.example .env.local     # Windows
# cp .env.local.example .env.local      # macOS / Linux

# 3. Start the dev server (pinned to port 3001)
npm run dev
```

The frontend runs on **http://localhost:3001** and talks to the backend at `http://localhost:3000/api`.

`.env.local` only needs:

```
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 13. Smart contract: test & deploy

The contract is **already deployed**, so this is optional (useful to show the Solidity tests pass).

```bash
cd blockchain-project

# 1. Install dependencies
npm install

# 2. Run the full test suite (issuance, batch, revoke, events, verification gates)
npx hardhat test

# 3. (Optional) Re-deploy to Optimism Sepolia
#    Requires .env with DEPLOYER_PRIVATE_KEY + funded testnet wallet
copy .env.example .env
npx hardhat ignition deploy ./ignition/modules/CredentialRegistryModule.js --network optimism-sepolia
```

After a fresh deploy, copy the new address into the backend `.env` (`CREDENTIAL_REGISTRY_ADDRESS`).

---

## 14. Roles, users, and how to use the platform

The platform has **five types of users**. Each role sees different pages and can perform different actions.

### SUPER_ADMIN (platform owner)

- **Login:** http://localhost:3001/admin/login — email + password (JWT).
- **Scope:** entire platform; not tied to one university (`university_id` is null).
- **Typical actions:**
  - Create, update, and delete **universities**
  - Create **REGISTRAR** and **VIEWER** accounts for any university
  - View global dashboards and statistics
  - Upload certificate batches for any university (if needed)
- **Admin menu:** Dashboard, Universities, Admin Users, Upload Batch, Credential History.

### REGISTRAR (university admin / registrar)

- **Login:** http://localhost:3001/admin/login — email + password (JWT).
- **Scope:** one university only (`university_id` set on the account).
- **Typical actions:**
  - **Upload batch Excel/CSV** — create students and certificates (`ISSUED` status)
  - **Issue to Blockchain** — mint selected certificates on Optimism Sepolia (`VERIFIED` status)
  - **Provision blockchain identity** (DID + keys) for their university if missing
  - View and manage **students** and **certificates** for their university
  - Edit or delete certificates **only before** they are minted on-chain
  - Create **VIEWER** (and other registrar) accounts for their own university
  - Download certificate PDFs and view credential history
- **Admin menu:** Dashboard, Upload Batch, Blockchain, Credential History.

### VIEWER (read-only university staff)

- **Login:** http://localhost:3001/admin/login — email + password (JWT).
- **Scope:** one university only.
- **Typical actions:**
  - View dashboard and credential history
  - List admin users for their university
  - **Cannot** upload batches, issue to blockchain, or manage universities
- **Use case:** auditors or staff who need visibility without write access.

### Student (credential holder)

- **Login:** http://localhost:3001/portal/login — **no password** (see below).
- **Scope:** only their own certificates.
- **Typical actions:**
  - View all certificates issued to them
  - Download **PDF** copies with QR codes
  - Copy a **public verification link** or share the QR so employers can verify authenticity
- **Cannot** upload, mint on-chain, or access the admin console.

### Public verifier (anyone — no account)

- **Access:** http://localhost:3001/verify or `/verify/{certificate_id}` (also via QR on the PDF).
- **Typical actions:**
  - Enter a certificate ID and run the **three-way verification** (database + hash + blockchain)
  - See whether the credential is authentic, who issued it, and the on-chain transaction link
- **No login required.**

---

### Why students use OTP instead of a password

Students visit this platform **infrequently** — usually once after graduation to download their certificate, or occasionally when an employer asks them to share proof. A traditional password would mean:

- Students **forget passwords** because they rarely log in
- Support burden on the university for **password resets**
- Weak or reused passwords create **security risk**

Instead, students authenticate with data they already know:

1. **Registration number** (`student_id_number`)
2. **National ID** (16 digits)

The system sends a **one-time password (OTP)** to the **email address stored in the batch upload**. The OTP expires in **5 minutes**. After verification, the student receives a short-lived **JWT** for the portal session.

This is **passwordless login**: no account setup, no password to remember, and access is tied to identity records the university already registered.

---

### How the university admin uploads a batch file

**Who can upload:** `SUPER_ADMIN` or `REGISTRAR`  
**Where:** Admin → **Upload Batch** (`/admin/upload`)  
**Formats:** `.xlsx`, `.xls`, or `.csv`

#### Required columns (header row must match)

Each row is one certificate. Column names are case-insensitive but must match these fields:

- **`student_id_number`** — university registration / student ID (required)
- **`national_id`** — exactly **16 digits**; spaces are stripped automatically (required)
- **`full_name`** — student's full legal name (required)
- **`email`** — valid email; also used to send the student OTP at login (required)
- **`degree_title`** — e.g. `B.Sc. Computer Science` (required)
- **`graduation_year`** — integer between 2000 and the current year (required)
- **`class_award`** — e.g. `First Class Honours`, `Second Class Upper` (required)

#### Optional columns

- **`phone`** — contact number
- **`photo_url`** — URL to a student photo (if used in future PDF layouts)

#### Upload workflow

1. Select the Excel/CSV file.
2. The frontend **parses and validates** every row; errors are shown in a review table.
3. Fix any validation errors in the UI (or in the file and re-upload).
4. Submit — the backend:
   - Upserts **students** (deduplicated by `student_id_number` per university)
   - Creates **certificate** rows with status **`ISSUED`**
   - Computes a **`keccak256` data_hash** for each certificate (not minted yet)
5. Go to **Admin → Blockchain**, select the pending certificates, and click **Issue to Blockchain** to move them to **`VERIFIED`**.

**Important:** Re-uploading the **same student and degree data** creates **new DB rows** but the **same hash** on-chain. The contract rejects duplicate hashes (`CredentialAlreadyExists`). Do not re-mint the same credentials — use the certificates that are already **VERIFIED**.

---

### End-to-end workflow (step by step)

#### Step 0 — Create the first Super Admin (one-time)

The backend ships with a bootstrap SQL script: `certificate-verification-backend/create-super-admin.sql`.

1. Generate a bcrypt hash for your password:
   ```bash
   node -e "console.log(require('bcrypt').hashSync('YourPassword123!', 10))"
   ```
2. Paste the email + hash into `create-super-admin.sql`.
3. Run it against your database (e.g. with `psql` or any Postgres client).

#### Step 1 — Admin logs in

Go to **http://localhost:3001/admin/login** and sign in with Super Admin or Registrar credentials.

#### Step 2 — Register a university (Super Admin)

In **Admin → Universities**, create a university. The backend automatically provisions its blockchain identity (a `did:key` DID + wallet keypair).

#### Step 3 — Create a Registrar account (Super Admin)

In **Admin → Admin Users**, create a **REGISTRAR** user linked to that university. The registrar performs day-to-day uploads and blockchain issuance.

#### Step 4 — Upload certificates (Registrar)

Follow the batch upload steps above. Rows are saved as **ISSUED**.

#### Step 5 — Issue to blockchain (Registrar)

In **Admin → Blockchain**, ensure the university has a **DID**, select pending certificates, and click **Issue to Blockchain**. Status becomes **VERIFIED** and a transaction hash is stored.

#### Step 6 — Student portal

The student opens **http://localhost:3001/portal/login**, enters registration number + national ID, receives an **OTP by email**, and accesses their dashboard to download PDFs and share verification links.

#### Step 7 — Public verification

Anyone opens **http://localhost:3001/verify**, enters a certificate ID (or scans the QR), and sees the three-way-match result — no login required.

---

## 15. API reference & Swagger

### Interactive Swagger UI

Once the backend is running, open:

- **Swagger UI:** http://localhost:3000/api/docs
- **OpenAPI JSON:** http://localhost:3000/api/docs-json
- **Exported spec file:** `docs/swagger.json` (auto-generated on backend startup)

The Swagger UI documents every endpoint with request bodies, response schemas, and JWT authentication. To test protected routes:

1. Call `POST /api/auth/admin/login` with admin email and password.
2. Copy the `access_token` from the response.
3. Click **Authorize** (top right) and paste the token.
4. Try any admin route (upload, issue-to-blockchain, etc.).

Student routes use the token from `POST /api/auth/student/verify-otp`. Public verification (`GET /api/verification/:id`) requires no token.

Swagger is configured in `certificate-verification-backend/src/config/swagger.config.ts`. Response schemas live in `certificate-verification-backend/src/common/swagger/response.dto.ts`.

### Endpoint summary

Base URL: `http://localhost:3000/api`

**Authentication**

- `POST /auth/admin/login` — admin login returning a JWT (public).
- `POST /auth/student/request-otp` — request a student OTP (public).
- `POST /auth/student/verify-otp` — verify the OTP and return a JWT (public).

**Universities (admin)**

- `POST /universities` — create a university and provision its DID.
- `POST /universities/:id/provision-identity` — ensure the DID / keys exist.

**Certificates & upload**

- `POST /file-upload/batch` — upload an Excel file, creating `ISSUED` records (admin).
- `POST /file-upload/batch-data` — upload JSON rows, creating `ISSUED` records (admin).
- `POST /certificates/issue-to-blockchain/:universityId` — batch mint on-chain, moving records to `VERIFIED` (admin).
- `GET /certificates/university/:id` — list a university's certificates (admin).
- `GET /certificates/student/:studentId` — list a student's certificates (student).
- `GET /certificates/:id/download` — download the PDF with its QR code (student).

**Verification**

- `GET /verification/:certificate_id` — public three-way verification (public).

---

## 16. Project structure

```
Certificate verification platform/
├── README.md                        ← you are here
├── blockchain-project/              ← Solidity + Hardhat
│   ├── contracts/CredentialRegistry.sol
│   ├── test/CredentialRegistry.test.js
│   ├── ignition/modules/CredentialRegistryModule.js
│   └── hardhat.config.js
├── certificate-verification-backend/        ← NestJS backend (port 3000)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/                 JWT + student OTP
│   │   │   ├── universities/         DID provisioning
│   │   │   ├── students/
│   │   │   ├── certificates/         issue-to-blockchain
│   │   │   ├── file-upload/          Excel ingestion → ISSUED
│   │   │   ├── blockchain/           ethers + hashing + minting
│   │   │   ├── verification/         three-way match engine
│   │   │   ├── crypto/               AES key handling
│   │   │   └── pdf-generator/        PDF + QR
│   │   └── main.ts                   listens on 3000
│   ├── create-super-admin.sql
│   └── .env.example
└── certificate-verification-frontend/  ← Next.js frontend (port 3001)
    ├── app/
    │   ├── admin/                    dashboard, upload, blockchain, universities
    │   ├── portal/                   student login + dashboard
    │   └── verify/                   public verification
    ├── lib/api/                      axios client + endpoints
    └── package.json                  dev/start pinned to -p 3001
```

---

## 17. Troubleshooting

- **Frontend can't reach API / CORS error** — ensure the backend is on **3000**, the frontend on **3001**, and `NEXT_PUBLIC_API_URL=http://localhost:3000/api`.
- **Port already in use** — stop the process using the port, or free ports 3000/3001 (they are required).
- **PDF download fails** — set `PUPPETEER_EXECUTABLE_PATH` to your Chrome path in the backend `.env`.
- **DB connection error** — verify Postgres is running and the `DB_*` / `DATABASE_URL` values are correct.
- **Verification says "No on-chain record"** — the certificate is still `ISSUED`; run **Issue to Blockchain** first.
- **Minting fails** — ensure the `OPERATOR_PRIVATE_KEY` wallet has Optimism Sepolia test ETH and `CREDENTIAL_REGISTRY_ADDRESS` is set.

---

### One-line summary for the assessor

A privacy-preserving, production-shaped certificate platform: universities create certificates from Excel, the backend anchors a `keccak256` commitment + issuer DID on the Optimism Sepolia `CredentialRegistry` contract, and anyone can verify authenticity through a database + hash + on-chain three-way match — with credentials that are non-transferable by design.
