import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

/**
 * Query the admin address of the Voting contract
 * 
 * Usage:
 *   npx hardhat --network localhost task:admin
 *   npx hardhat --network sepolia task:admin
 */
task("task:admin", "Get the admin address of the Voting contract").setAction(
  async function (_taskArguments: TaskArguments, hre) {
    const { deployments } = hre;

    try {
      const voting = await deployments.get("Voting");
      const votingContract = await hre.ethers.getContractAt("Voting", voting.address);

      const adminAddress = await votingContract.admin();
      
      console.log("=".repeat(60));
      console.log("Voting Contract Admin Address");
      console.log("=".repeat(60));
      console.log(`Contract Address: ${voting.address}`);
      console.log(`Admin Address:   ${adminAddress}`);
      console.log("=".repeat(60));
    } catch (error) {
      console.error("Error:", error);
      console.log("Make sure the Voting contract is deployed.");
    }
  }
);


