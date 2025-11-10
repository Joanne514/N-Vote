import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  alice: HardhatEthersSigner;
  hr: HardhatEthersSigner;
};

describe("SalaryAggregatorSepolia", function () {
  let signers: Signers;
  let contract: any;
  let contractAddress: string;

  let step = 0;
  let steps = 0;
  const progress = (m: string) => console.log(`${++step}/${steps} ${m}`);

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const d = await deployments.get("SalaryAggregator");
      contractAddress = d.address;
      contract = await ethers.getContractAt("SalaryAggregator", d.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { alice: ethSigners[0], hr: ethSigners[1] };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("submit a salary and decrypt average as HR", async function () {
    steps = 7;
    this.timeout(4 * 40000);

    progress("Encrypting salary 7500...");
    const enc = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(7500)
      .encrypt();

    progress("submitSalary()...");
    let tx = await contract.connect(signers.alice).submitSalary(enc.handles[0], enc.inputProof);
    await tx.wait();

    progress("allowHrToDecryptAverage()...");
    tx = await contract.connect(signers.hr).allowHrToDecryptAverage();
    await tx.wait();

    progress("getEncryptedAverage() and decrypt...");
    const encAvg = await contract.getEncryptedAverage();
    expect(encAvg).to.not.eq(ethers.ZeroHash);
    const clearAvg = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encAvg,
      contractAddress,
      signers.hr,
    );
    expect(clearAvg).to.eq(7500);
  });
});






