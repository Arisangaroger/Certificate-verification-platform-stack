/**
 * CredentialRegistryModule.js
 * ────────────────────────────
 * Hardhat Ignition deployment module for CredentialRegistry.
 * Automatically reads OPERATOR_WALLET_ADDRESS from .env
 *
 * Usage:
 *   npx hardhat ignition deploy ./ignition/modules/CredentialRegistryModule.js --network optimism-sepolia
 */

const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
require("dotenv").config();

module.exports = buildModule("CredentialRegistryModule", (m) => {
  // Read operator address from .env file
  const operatorAddress = m.getParameter(
    "operatorAddress",
    process.env.OPERATOR_WALLET_ADDRESS
  );

  if (!operatorAddress || operatorAddress === "0xYOUR_OPERATOR_WALLET_ADDRESS_HERE") {
    throw new Error(
      "OPERATOR_WALLET_ADDRESS not set in .env file!\n" +
      "Please add: OPERATOR_WALLET_ADDRESS=0xYourActualAddress"
    );
  }

  console.log("Deploying with operator:", operatorAddress);

  const credentialRegistry = m.contract("CredentialRegistry", [operatorAddress]);

  return { credentialRegistry };
});
