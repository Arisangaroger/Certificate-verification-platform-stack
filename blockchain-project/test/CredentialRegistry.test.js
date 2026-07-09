const { expect }        = require("chai");
const { ethers }        = require("hardhat");
const { loadFixture }   = require("@nomicfoundation/hardhat-toolbox/network-helpers");

// ─────────────────────────────────────────────────────────────────────────────
//  Test helpers
// ─────────────────────────────────────────────────────────────────────────────

function buildDataString(cert) {
  return (
    cert.studentId + cert.nationalId + cert.fullName +
    cert.degreeTitle + cert.graduationYear
  );
}

function computeDataHash(cert) {
  return ethers.keccak256(ethers.toUtf8Bytes(buildDataString(cert)));
}

const SAMPLE_CERT = {
  studentId:      "STU-2024-001",
  nationalId:     "RW-NAT-123456",
  fullName:       "Alice Uwimana",
  degreeTitle:    "Bachelor of Science in Computer Science",
  graduationYear: "2024",
};

const SAMPLE_DID  = "did:key:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuias8zXZQmn";
const SAMPLE_DID2 = "did:key:z6MkhaXgBZDvotDkL5257faiztiGiC2QtKLGpbnnEGta2doK";

// ─────────────────────────────────────────────────────────────────────────────
//  Fixture
// ─────────────────────────────────────────────────────────────────────────────

async function deployRegistryFixture() {
  const [owner, operator, alice, bob, attacker] = await ethers.getSigners();

  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const registry = await CredentialRegistry.deploy(operator.address);
  await registry.waitForDeployment();

  return { registry, owner, operator, alice, bob, attacker };
}

// ─────────────────────────────────────────────────────────────────────────────
//  Test Suite
// ─────────────────────────────────────────────────────────────────────────────

describe("CredentialRegistry", function () {

  // ── Deployment ────────────────────────────────────────────────
  describe("Deployment", function () {
    it("should set the deployer as owner", async function () {
      const { registry, owner } = await loadFixture(deployRegistryFixture);
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("should grant operator role to initial operator", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      expect(await registry.authorizedOperators(operator.address)).to.be.true;
    });

    it("should NOT grant operator role to random address", async function () {
      const { registry, attacker } = await loadFixture(deployRegistryFixture);
      expect(await registry.authorizedOperators(attacker.address)).to.be.false;
    });

    it("should revert on zero-address operator in constructor", async function () {
      const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
      await expect(
        CredentialRegistry.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("CredentialRegistry: zero operator address");
    });
  });

  // ── issueCredentials ──────────────────────────────────────────
  describe("issueCredentials", function () {
    it("should issue a single credential successfully", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);

      await expect(
        registry.connect(operator).issueCredentials([hash], [SAMPLE_DID])
      ).to.emit(registry, "CredentialIssued")
        .withArgs(hash, SAMPLE_DID, (v) => v > 0n);
    });

    it("should store correct metadata after issuance", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);

      await registry.connect(operator).issueCredentials([hash], [SAMPLE_DID]);

      const { issuerDid, isRevoked, exists } = await registry.getCredential(hash);
      expect(exists).to.be.true;
      expect(issuerDid).to.equal(SAMPLE_DID);
      expect(isRevoked).to.be.false;
    });

    it("should issue a batch of credentials", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);

      const certs = Array.from({ length: 10 }, (_, i) => ({
        ...SAMPLE_CERT,
        studentId: `STU-${i}`,
        nationalId: `NAT-${i}`,
      }));

      const hashes = certs.map(computeDataHash);
      const dids   = certs.map(() => SAMPLE_DID);

      await registry.connect(operator).issueCredentials(hashes, dids);

      for (const hash of hashes) {
        const { exists } = await registry.getCredential(hash);
        expect(exists).to.be.true;
      }
    });

    it("should revert for empty batch", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      await expect(
        registry.connect(operator).issueCredentials([], [])
      ).to.be.revertedWithCustomError(registry, "EmptyBatch");
    });

    it("should revert when arrays have mismatched lengths", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);
      await expect(
        registry.connect(operator).issueCredentials([hash], [SAMPLE_DID, SAMPLE_DID2])
      ).to.be.revertedWithCustomError(registry, "ArrayLengthMismatch");
    });

    it("should revert when batch exceeds MAX_BATCH_SIZE", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const maxSize = await registry.MAX_BATCH_SIZE();
      const oversized = Number(maxSize) + 1;

      const hashes = Array.from({ length: oversized }, (_, i) =>
        ethers.keccak256(ethers.toUtf8Bytes(`cert_${i}`))
      );
      const dids = Array(oversized).fill(SAMPLE_DID);

      await expect(
        registry.connect(operator).issueCredentials(hashes, dids)
      ).to.be.revertedWithCustomError(registry, "BatchTooLarge");
    });

    it("should revert if credential hash already exists", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);

      await registry.connect(operator).issueCredentials([hash], [SAMPLE_DID]);

      await expect(
        registry.connect(operator).issueCredentials([hash], [SAMPLE_DID])
      ).to.be.revertedWithCustomError(registry, "CredentialAlreadyExists")
        .withArgs(hash);
    });

    it("should revert if issuerDid is empty string", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);

      await expect(
        registry.connect(operator).issueCredentials([hash], [""])
      ).to.be.revertedWithCustomError(registry, "InvalidIssuerDid");
    });

    it("should revert when called by non-operator", async function () {
      const { registry, attacker } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);

      await expect(
        registry.connect(attacker).issueCredentials([hash], [SAMPLE_DID])
      ).to.be.revertedWithCustomError(registry, "NotAuthorizedOperator");
    });

    it("should allow owner to issue even without explicit operator role", async function () {
      const { registry, owner } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);
      // Owner is also allowed (modifier: onlyOperator || owner)
      await expect(
        registry.connect(owner).issueCredentials([hash], [SAMPLE_DID])
      ).to.emit(registry, "CredentialIssued");
    });
  });

  // ── revokeCredential ──────────────────────────────────────────
  describe("revokeCredential", function () {
    async function issueSampleFixture() {
      const base = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);
      await base.registry.connect(base.operator).issueCredentials([hash], [SAMPLE_DID]);
      return { ...base, hash };
    }

    it("should revoke an existing credential", async function () {
      const { registry, operator, hash } = await issueSampleFixture();

      await expect(
        registry.connect(operator).revokeCredential(hash, SAMPLE_DID)
      ).to.emit(registry, "CredentialRevoked")
        .withArgs(hash, SAMPLE_DID, operator.address, (v) => v > 0n);

      const { isRevoked } = await registry.getCredential(hash);
      expect(isRevoked).to.be.true;
    });

    it("should revert when credential does not exist", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("nonexistent"));

      await expect(
        registry.connect(operator).revokeCredential(fakeHash, SAMPLE_DID)
      ).to.be.revertedWithCustomError(registry, "CredentialNotFound");
    });

    it("should revert when credential is already revoked", async function () {
      const { registry, operator, hash } = await issueSampleFixture();
      await registry.connect(operator).revokeCredential(hash, SAMPLE_DID);

      await expect(
        registry.connect(operator).revokeCredential(hash, SAMPLE_DID)
      ).to.be.revertedWithCustomError(registry, "CredentialAlreadyRevoked");
    });

    it("should revert when issuerDid does not match on-chain record", async function () {
      const { registry, operator, hash } = await issueSampleFixture();

      await expect(
        registry.connect(operator).revokeCredential(hash, SAMPLE_DID2)
      ).to.be.revertedWithCustomError(registry, "DIDMismatch");
    });

    it("should revert when called by non-operator", async function () {
      const { registry, attacker, hash } = await issueSampleFixture();

      await expect(
        registry.connect(attacker).revokeCredential(hash, SAMPLE_DID)
      ).to.be.revertedWithCustomError(registry, "NotAuthorizedOperator");
    });
  });

  // ── getCredential ─────────────────────────────────────────────
  describe("getCredential", function () {
    it("should return exists=false for unknown hash", async function () {
      const { registry } = await loadFixture(deployRegistryFixture);
      const unknownHash = ethers.keccak256(ethers.toUtf8Bytes("unknown"));
      const { exists } = await registry.getCredential(unknownHash);
      expect(exists).to.be.false;
    });

    it("should return correct blockTime", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);

      // Get block timestamp before transaction
      const blockBefore = await ethers.provider.getBlock('latest');
      const before = BigInt(blockBefore.timestamp);

      await registry.connect(operator).issueCredentials([hash], [SAMPLE_DID]);

      // Get block timestamp after transaction
      const blockAfter = await ethers.provider.getBlock('latest');
      const after = BigInt(blockAfter.timestamp);

      const { blockTime } = await registry.getCredential(hash);
      
      // blockTime should be between before and after block timestamps
      expect(blockTime).to.be.gte(before);
      expect(blockTime).to.be.lte(after);
    });
  });

  // ── getCredentialsBatch ───────────────────────────────────────
  describe("getCredentialsBatch", function () {
    it("should return batch metadata", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);

      const certs = [
        { ...SAMPLE_CERT, studentId: "S1" },
        { ...SAMPLE_CERT, studentId: "S2" },
      ];
      const hashes = certs.map(computeDataHash);
      await registry.connect(operator).issueCredentials(hashes, [SAMPLE_DID, SAMPLE_DID2]);

      const results = await registry.getCredentialsBatch(hashes);
      expect(results[0].issuerDid).to.equal(SAMPLE_DID);
      expect(results[1].issuerDid).to.equal(SAMPLE_DID2);
    });
  });

  // ── Operator Management ───────────────────────────────────────
  describe("Operator Management", function () {
    it("should allow owner to add an operator", async function () {
      const { registry, owner, alice } = await loadFixture(deployRegistryFixture);
      await registry.connect(owner).addOperator(alice.address);
      expect(await registry.authorizedOperators(alice.address)).to.be.true;
    });

    it("should allow owner to remove an operator", async function () {
      const { registry, owner, operator } = await loadFixture(deployRegistryFixture);
      await registry.connect(owner).removeOperator(operator.address);
      expect(await registry.authorizedOperators(operator.address)).to.be.false;
    });

    it("should revert if non-owner tries to add operator", async function () {
      const { registry, alice, bob } = await loadFixture(deployRegistryFixture);
      await expect(
        registry.connect(alice).addOperator(bob.address)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });

    it("should emit OperatorAdded event", async function () {
      const { registry, owner, alice } = await loadFixture(deployRegistryFixture);
      await expect(registry.connect(owner).addOperator(alice.address))
        .to.emit(registry, "OperatorAdded")
        .withArgs(alice.address);
    });
  });

  // ── Pause / Unpause ───────────────────────────────────────────
  describe("Pause / Unpause", function () {
    it("should pause and block issueCredentials", async function () {
      const { registry, owner, operator } = await loadFixture(deployRegistryFixture);
      await registry.connect(owner).pause();

      const hash = computeDataHash(SAMPLE_CERT);
      await expect(
        registry.connect(operator).issueCredentials([hash], [SAMPLE_DID])
      ).to.be.revertedWithCustomError(registry, "EnforcedPause");
    });

    it("should resume after unpause", async function () {
      const { registry, owner, operator } = await loadFixture(deployRegistryFixture);
      await registry.connect(owner).pause();
      await registry.connect(owner).unpause();

      const hash = computeDataHash(SAMPLE_CERT);
      await expect(
        registry.connect(operator).issueCredentials([hash], [SAMPLE_DID])
      ).to.emit(registry, "CredentialIssued");
    });

    it("should still allow reads while paused", async function () {
      const { registry, owner, operator } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);
      await registry.connect(operator).issueCredentials([hash], [SAMPLE_DID]);

      await registry.connect(owner).pause();
      const { exists } = await registry.getCredential(hash);
      expect(exists).to.be.true;
    });
  });

  // ── Three-Way Match (NestJS VerificationService simulation) ───
  describe("Three-Way Match Engine (Verification Flow)", function () {
    it("should pass all three verification gates for a valid credential", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);
      await registry.connect(operator).issueCredentials([hash], [SAMPLE_DID]);

      // Gate 1: record exists
      const { issuerDid, blockTime, isRevoked, exists } = await registry.getCredential(hash);
      expect(exists, "Gate 1: record must exist").to.be.true;

      // Gate 2: not revoked
      expect(isRevoked, "Gate 2: must not be revoked").to.be.false;

      // Gate 3: DID match (issuerDid from chain == did_identifier in DB)
      const localDid = SAMPLE_DID; // simulates PostgreSQL did_identifier column
      expect(issuerDid, "Gate 3: on-chain DID must match DB DID").to.equal(localDid);
    });

    it("should fail Gate 2 when credential is revoked", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);
      await registry.connect(operator).issueCredentials([hash], [SAMPLE_DID]);
      await registry.connect(operator).revokeCredential(hash, SAMPLE_DID);

      const { isRevoked } = await registry.getCredential(hash);
      expect(isRevoked, "Gate 2: should be revoked").to.be.true;
    });

    it("should fail Gate 3 when on-chain DID differs from DB DID (data tamper)", async function () {
      const { registry, operator } = await loadFixture(deployRegistryFixture);
      const hash = computeDataHash(SAMPLE_CERT);
      await registry.connect(operator).issueCredentials([hash], [SAMPLE_DID]);

      const { issuerDid } = await registry.getCredential(hash);

      // Simulate DB returning a different DID (tampered)
      const tamperedDid = SAMPLE_DID2;
      expect(issuerDid).to.not.equal(tamperedDid);
    });
  });
});
