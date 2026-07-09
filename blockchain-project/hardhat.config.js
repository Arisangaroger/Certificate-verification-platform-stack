require("@nomicfoundation/hardhat-toolbox");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("dotenv").config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64);
const OPERATOR_PRIVATE_KEY  = process.env.OPERATOR_PRIVATE_KEY  || "0x" + "0".repeat(64);
const OPTIMISM_SEPOLIA_RPC  = process.env.OPTIMISM_SEPOLIA_RPC_URL || "https://sepolia.optimism.io";
const ETHERSCAN_API_KEY     = process.env.OPTIMISM_ETHERSCAN_API_KEY || "";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  // ─── Solidity Compiler ────────────────────────────────────────
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: false,
    },
  },

  // ─── Networks ─────────────────────────────────────────────────
  networks: {
   
    hardhat: {
      chainId: 31337,
    },

    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    
    "optimism-sepolia": {
      url: OPTIMISM_SEPOLIA_RPC,
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 11155420,
      gasPrice: "auto",
    },

    
    optimism: {
      url: process.env.OPTIMISM_MAINNET_RPC_URL || "https://mainnet.optimism.io",
      accounts: [DEPLOYER_PRIVATE_KEY],
      chainId: 10,
    },
  },

  // ─── Contract Verification ────────────────────────────────────
  etherscan: {
    apiKey: {
      
      "optimism-sepolia": ETHERSCAN_API_KEY,
      optimisticEthereum: ETHERSCAN_API_KEY,
    },
    customChains: [
      {
        network: "optimism-sepolia",
        chainId: 11155420,
        urls: {
          apiURL:    "https://api-sepolia-optimistic.etherscan.io/api",
          browserURL:"https://sepolia-optimistic.etherscan.io",
        },
      },
    ],
  },

  // ─── Source Paths ─────────────────────────────────────────────
  paths: {
    sources:   "./contracts",
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },

  // ─── Gas Reporter ─────────────────────────────────────────────
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    outputFile: "gas-report.txt",
    noColors: true,
  },
};
