/**
 * deploy.js
 * ---------
 * Deploys CredentialRegistry to the target network.
 *
 * Usage:
 *   npx hardhat run scripts/deploy.js --network optimism-sepolia
 *   npx hardhat run scripts/deploy.js --network localhost
 *
 * Required .env variables:
 *   DEPLOYER_PRIVATE_KEY        — wallet that pays gas & becomes contract owner
 *   OPERATOR_WALLET_ADDRESS     — platform gas wallet granted initial operator role
 *   OPTIMISM_SEPOLIA_RPC_URL    — JSON-RPC endpoint
 */

const { ethers, network, run } = require("hardhat");

async function main() {
  console.log("\n============================================================");
  console.log("  CredentialRegistry — Deployment Script");
  console.log("  Network:", network.name);
  console.log("============================================================\n");

  // ── Signers ──────────────────────────────────────────────────
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address :", deployer.address);

  const deployerBalance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance :", ethers.formatEther(deployerBalance), "ETH");

  if (deployerBalance === 0n) {
    throw new Error(
      "Deployer has zero balance. Fund the wallet with Optimism Sepolia ETH first.\n" +
      "Faucet: https://www.alchemy.com/faucets/optimism-sepolia"
    );
  }

  // ── Operator Wallet ───────────────────────────────────────────
  const operatorAddress =
    process.env.OPERATOR_WALLET_ADDRESS || deployer.address;

  console.log("\nInitial operator address:", operatorAddress);

  if (!ethers.isAddress(operatorAddress)) {
    throw new Error("OPERATOR_WALLET_ADDRESS is not a valid Ethereum address.");
  }

  // ── Deploy ────────────────────────────────────────────────────
  console.log("\nDeploying CredentialRegistry...");
  const CredentialRegistry = await ethers.getContractFactory("CredentialRegistry");
  const registry = await CredentialRegistry.deploy(operatorAddress);

  await registry.waitForDeployment();
  const contractAddress = await registry.getAddress();

  console.log("\n✅  CredentialRegistry deployed!");
  console.log("    Contract address :", contractAddress);
  console.log("    Transaction hash :", registry.deploymentTransaction().hash);

  // ── Write deployment artifacts ────────────────────────────────
  const deploymentInfo = {
    network:         network.name,
    chainId:         network.config.chainId,
    contractAddress,
    deployerAddress: deployer.address,
    operatorAddress,
    deployedAt:      new Date().toISOString(),
    transactionHash: registry.deploymentTransaction().hash,
    blockNumber:     (await ethers.provider.getBlockNumber()).toString(),
  };

  const fs   = require("fs");
  const path = require("path");

  const outDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const outFile = path.join(outDir, `${network.name}.json`);
  fs.writeFileSync(outFile, JSON.stringify(deploymentInfo, null, 2));
  console.log("\n    Deployment info saved to:", outFile);

  // ── Verify on Etherscan (non-local networks) ───────────────────
  if (network.name !== "hardhat" && network.name !== "localhost") {
    console.log("\nWaiting 30 seconds before contract verification...");
    await new Promise((r) => setTimeout(r, 30_000));

    console.log("Verifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [operatorAddress],
      });
      console.log("✅  Contract verified on Etherscan!");
    } catch (err) {
      if (err.message.toLowerCase().includes("already verified")) {
        console.log("ℹ️   Contract already verified.");
      } else {
        console.warn("⚠️   Verification failed:", err.message);
        console.warn("    You can retry manually:");
        console.warn(
          `    npx hardhat verify --network ${network.name} ${contractAddress} "${operatorAddress}"`
        );
      }
    }
  }

  // ── Post-deploy checklist ─────────────────────────────────────
  console.log("\n============================================================");
  console.log("  POST-DEPLOY CHECKLIST");
  console.log("============================================================");
  console.log(
    `  1. Copy CONTRACT_ADDRESS=${contractAddress} into your NestJS .env`
  );
  console.log(
    `  2. Ensure OPERATOR_WALLET_ADDRESS=${operatorAddress} matches`
  );
  console.log("     the gas wallet configured in BlockchainService.");
  console.log(
    "  3. Fund the operator wallet with Optimism Sepolia ETH for gas."
  );
  console.log("  4. Confirm with: npx hardhat run scripts/verify-setup.js");
  console.log("============================================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌  Deployment failed:", err);
    process.exit(1);
  });
