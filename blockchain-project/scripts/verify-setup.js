/**
 * verify-setup.js
 * ---------------
 * Checks your wallet setup and network connection BEFORE deployment.
 * Validates .env configuration and wallet balance.
 *
 * Usage:
 *   npx hardhat run scripts/verify-setup.js --network optimism-sepolia
 */

const { ethers, network } = require("hardhat");
require("dotenv").config();

async function main() {
  console.log("\n============================================================");
  console.log("  Pre-Deployment Setup Verification");
  console.log("  Network:", network.name);
  console.log("============================================================\n");

  // ── Check Network Configuration ───────────────────────────────
  console.log("─── Network Configuration ─────────────────────────────────");
  console.log("  Network name  :", network.name);
  console.log("  Chain ID      :", network.config.chainId);
  console.log("  RPC URL       :", network.config.url || "default");

  if (network.name === "optimism-sepolia" && network.config.chainId !== 11155420) {
    throw new Error("Chain ID mismatch! Expected 11155420 for Optimism Sepolia");
  }

  // ── Check Wallet ──────────────────────────────────────────────
  console.log("\n─── Wallet Configuration ──────────────────────────────────");
  
  const [deployer] = await ethers.getSigners();
  console.log("  Deployer address:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceEth = ethers.formatEther(balance);
  console.log("  Balance         :", balanceEth, "ETH");

  if (balance === 0n) {
    console.error("\n❌ FAIL: Wallet has ZERO balance!");
    console.error("   Get FREE test ETH: https://www.alchemy.com/faucets/optimism-sepolia");
    process.exit(1);
  }

  if (balance < ethers.parseEther("0.01")) {
    console.warn("\n⚠️  WARNING: Balance is very low (< 0.01 ETH)");
    console.warn("   Recommended: 0.1 ETH for deployment + operations");
  } else {
    console.log("  ✅ Sufficient balance for deployment");
  }

  // ── Check Operator Address ────────────────────────────────────
  console.log("\n─── Operator Configuration ────────────────────────────────");
  const operatorAddress = process.env.OPERATOR_WALLET_ADDRESS;

  if (!operatorAddress || operatorAddress === "0xYOUR_OPERATOR_WALLET_ADDRESS_HERE") {
    console.error("\n❌ FAIL: OPERATOR_WALLET_ADDRESS not set in .env!");
    process.exit(1);
  }

  if (!ethers.isAddress(operatorAddress)) {
    console.error("\n❌ FAIL: OPERATOR_WALLET_ADDRESS is not a valid address!");
    console.error("   Current value:", operatorAddress);
    process.exit(1);
  }

  console.log("  Operator address:", operatorAddress);
  console.log("  ✅ Valid operator address");

  // ── Check Block Connection ────────────────────────────────────
  console.log("\n─── Network Connection ────────────────────────────────────");
  try {
    const blockNumber = await ethers.provider.getBlockNumber();
    const block = await ethers.provider.getBlock(blockNumber);
    console.log("  Latest block    :", blockNumber);
    console.log("  Block timestamp :", new Date(block.timestamp * 1000).toISOString());
    console.log("  ✅ Successfully connected to network");
  } catch (error) {
    console.error("\n❌ FAIL: Cannot connect to network!");
    console.error("   Error:", error.message);
    process.exit(1);
  }

  // ── Summary ───────────────────────────────────────────────────
  console.log("\n============================================================");
  console.log("  ✅  All checks PASSED — Ready to deploy!");
  console.log("============================================================");
  console.log("\nNext step:");
  console.log("  npx hardhat ignition deploy ./ignition/modules/CredentialRegistryModule.js --network " + network.name);
  console.log("\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("\n❌  Verification failed:", err.message);
    process.exit(1);
  });
