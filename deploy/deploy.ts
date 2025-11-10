import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHECounter = await deploy("FHECounter", {
    from: deployer,
    log: true,
  });

  console.log(`FHECounter contract: `, deployedFHECounter.address);

  // Deploy SalaryAggregator with HR admin set to deployer by default
  const deployedSalaryAggregator = await deploy("SalaryAggregator", {
    from: deployer,
    args: [deployer],
    log: true,
  });

  console.log(`SalaryAggregator contract: `, deployedSalaryAggregator.address);

  // Deploy Voting contract with admin set to deployer by default
  const deployedVoting = await deploy("Voting", {
    from: deployer,
    args: [deployer],
    log: true,
  });

  console.log(`Voting contract: `, deployedVoting.address);
};
export default func;
func.id = "deploy_fheCounter"; // id required to prevent reexecution
func.tags = ["FHECounter", "SalaryAggregator", "Voting"];
