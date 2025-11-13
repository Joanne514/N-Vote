import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { Voting, Voting__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  admin: HardhatEthersSigner;
};

async function deployFixture() {
  const factory = (await ethers.getContractFactory("Voting")) as Voting__factory;
  const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
  const admin = ethSigners[3];
  const votingContract = (await factory.deploy(admin.address)) as Voting;
  const votingContractAddress = await votingContract.getAddress();

  return { votingContract, votingContractAddress, admin };
}

describe("Voting", function () {
  let signers: Signers;
  let votingContract: Voting;
  let votingContractAddress: string;
  let admin: HardhatEthersSigner;

  before(async function () {
    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
      admin: ethSigners[3],
    };
  });

  beforeEach(async function () {
    // Check whether the tests are running against an FHEVM mock environment
    if (!fhevm.isMock) {
      console.warn(`This hardhat test suite cannot run on Sepolia Testnet`);
      this.skip();
    }

    ({ votingContract, votingContractAddress, admin } = await deployFixture());
  });

  it("encrypted vote counts should be uninitialized after poll creation", async function () {
    const tx = await votingContract.createPoll(
      "Test Poll",
      "This is a test poll",
      ["Option 1", "Option 2"]
    );
    await tx.wait();

    const pollId = 0;
    const encCount0 = await votingContract.getEncryptedVoteCount(pollId, 0);
    const encCount1 = await votingContract.getEncryptedVoteCount(pollId, 1);

    // Expect initial counts to be bytes32(0) after creation
    expect(encCount0).to.eq(ethers.ZeroHash);
    expect(encCount1).to.eq(ethers.ZeroHash);
  });

  it("create poll and cast vote for option 0", async function () {
    const tx = await votingContract.createPoll(
      "Favorite Color",
      "What is your favorite color?",
      ["Red", "Blue", "Green"]
    );
    await tx.wait();

    const pollId = 0;

    // Alice votes for option 0 (Red)
    const voteValue = 1; // 1 indicates a vote for this option
    const encryptedVote = await fhevm
      .createEncryptedInput(votingContractAddress, signers.alice.address)
      .add32(voteValue)
      .encrypt();

    const voteTx = await votingContract
      .connect(signers.alice)
      .castVote(pollId, 0, encryptedVote.handles[0], encryptedVote.inputProof);
    await voteTx.wait();

    const pollInfo = await votingContract.getPollInfo(pollId);
    expect(pollInfo.totalVotes).to.eq(1);

    const hasVoted = await votingContract.hasVoted(pollId, signers.alice.address);
    expect(hasVoted).to.be.true;

    // Allow admin to decrypt
    const allowTx = await votingContract.connect(admin).allowAdminToDecrypt(pollId, 0);
    await allowTx.wait();

    const encryptedCount = await votingContract.getEncryptedVoteCount(pollId, 0);
    expect(encryptedCount).to.not.eq(ethers.ZeroHash);

    const clearCount = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encryptedCount,
      votingContractAddress,
      admin,
    );
    expect(clearCount).to.eq(1);
  });

  it("multiple users vote for different options", async function () {
    const tx = await votingContract.createPoll(
      "Best Framework",
      "Which framework do you prefer?",
      ["React", "Vue", "Angular"]
    );
    await tx.wait();

    const pollId = 0;

    // Alice votes for option 0 (React)
    const voteAlice = await fhevm
      .createEncryptedInput(votingContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();
    let voteTx = await votingContract
      .connect(signers.alice)
      .castVote(pollId, 0, voteAlice.handles[0], voteAlice.inputProof);
    await voteTx.wait();

    // Bob votes for option 1 (Vue)
    const voteBob = await fhevm
      .createEncryptedInput(votingContractAddress, signers.bob.address)
      .add32(1)
      .encrypt();
    voteTx = await votingContract
      .connect(signers.bob)
      .castVote(pollId, 1, voteBob.handles[0], voteBob.inputProof);
    await voteTx.wait();

    const pollInfo = await votingContract.getPollInfo(pollId);
    expect(pollInfo.totalVotes).to.eq(2);

    // Allow admin to decrypt both options
    await votingContract.connect(admin).allowAdminToDecrypt(pollId, 0);
    await votingContract.connect(admin).allowAdminToDecrypt(pollId, 1);

    const encCount0 = await votingContract.getEncryptedVoteCount(pollId, 0);
    const encCount1 = await votingContract.getEncryptedVoteCount(pollId, 1);

    const clearCount0 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encCount0,
      votingContractAddress,
      admin,
    );
    const clearCount1 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encCount1,
      votingContractAddress,
      admin,
    );

    expect(clearCount0).to.eq(1); // Alice voted for React
    expect(clearCount1).to.eq(1); // Bob voted for Vue
  });

  it("user cannot vote twice", async function () {
    const tx = await votingContract.createPoll("Test", "Test poll", ["Option 1", "Option 2"]);
    await tx.wait();

    const pollId = 0;
    const vote = await fhevm
      .createEncryptedInput(votingContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await votingContract
      .connect(signers.alice)
      .castVote(pollId, 0, vote.handles[0], vote.inputProof);

    await expect(
      votingContract.connect(signers.alice).castVote(pollId, 1, vote.handles[0], vote.inputProof),
    ).to.be.revertedWith("Already voted");
  });

  it("non-admin cannot decrypt", async function () {
    const tx = await votingContract.createPoll("Test", "Test poll", ["Option 1"]);
    await tx.wait();

    const pollId = 0;
    const vote = await fhevm
      .createEncryptedInput(votingContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    await votingContract
      .connect(signers.alice)
      .castVote(pollId, 0, vote.handles[0], vote.inputProof);

    await expect(
      votingContract.connect(signers.alice).allowAdminToDecrypt(pollId, 0),
    ).to.be.revertedWith("Only admin");
  });

  it("get poll info returns correct data", async function () {
    const title = "Test Poll";
    const description = "This is a test";
    const options = ["Option A", "Option B", "Option C"];

    const tx = await votingContract.createPoll(title, description, options);
    await tx.wait();

    const pollId = 0;
    const pollInfo = await votingContract.getPollInfo(pollId);

    expect(pollInfo.title).to.eq(title);
    expect(pollInfo.description).to.eq(description);
    expect(pollInfo.active).to.be.true;
    expect(pollInfo.optionCount).to.eq(2);
    expect(pollInfo.totalVotes).to.eq(0);

    const option0 = await votingContract.getOptionDescription(pollId, 0);
    expect(option0).to.eq("Option A");
  });
});



