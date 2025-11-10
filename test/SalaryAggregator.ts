import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  hr: HardhatEthersSigner;
};

describe("SalaryAggregator (mock)", function () {
  let signers: Signers;
  let contractAddress: string;
  let contract: any;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], hr: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn(`This test suite runs only on FHEVM mock (localhost)`);
      this.skip();
    }

    const factory = await ethers.getContractFactory("SalaryAggregator");
    contract = await factory.deploy(signers.hr.address);
    contractAddress = await contract.getAddress();
  });

  it("initial sum/count should be uninitialized", async function () {
    const encSum = await contract.getEncryptedSum();
    const c = await contract.count();
    expect(encSum).to.eq(ethers.ZeroHash);
    expect(c).to.eq(0);
  });

  it("submit one salary and decrypt average as HR", async function () {
    const salary1 = 7000; // monthly salary
    const enc1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(salary1)
      .encrypt();

    let tx = await contract.connect(signers.alice).submitSalary(enc1.handles[0], enc1.inputProof);
    await tx.wait();

    // HR allows and decrypts sum
    tx = await contract.connect(signers.hr).allowHrToDecryptSum();
    await tx.wait();

    const encSum = await contract.getEncryptedSum();
    expect(encSum).to.not.eq(ethers.ZeroHash);

    const clearSum = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encSum,
      contractAddress,
      signers.hr,
    );

    const c = await contract.count();
    expect(clearSum).to.eq(salary1);
    expect(c).to.eq(1);
  });

  it("submit two salaries from different users; HR decrypts correct average", async function () {
    const s1 = 6000;
    const s2 = 9000;

    const enc1 = await fhevm
      .createEncryptedInput(contractAddress, signers.alice.address)
      .add32(s1)
      .encrypt();
    let tx = await contract.connect(signers.alice).submitSalary(enc1.handles[0], enc1.inputProof);
    await tx.wait();

    const enc2 = await fhevm
      .createEncryptedInput(contractAddress, signers.deployer.address)
      .add32(s2)
      .encrypt();
    tx = await contract.connect(signers.deployer).submitSalary(enc2.handles[0], enc2.inputProof);
    await tx.wait();

    tx = await contract.connect(signers.hr).allowHrToDecryptSum();
    await tx.wait();
    const encSum = await contract.getEncryptedSum();
    const clearSum = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encSum,
      contractAddress,
      signers.hr,
    );
    const c = await contract.count();
    const avg = Number(clearSum) / Number(c);
    expect(Math.trunc(avg)).to.eq(Math.trunc((s1 + s2) / 2));
  });
});


