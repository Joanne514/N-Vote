import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { ethers, fhevm, deployments } from "hardhat";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { Voting } from "../types";

type Signers = {
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
  admin: HardhatEthersSigner;
};

describe("VotingSepolia", function () {
  let signers: Signers;
  let votingContract: Voting;
  let votingContractAddress: string;
  let step: number;
  let steps: number;

  function progress(message: string) {
    console.log(`${++step}/${steps} ${message}`);
  }

  before(async function () {
    if (fhevm.isMock) {
      console.warn(`This hardhat test suite can only run on Sepolia Testnet`);
      this.skip();
    }

    try {
      const VotingDeployment = await deployments.get("Voting");
      votingContractAddress = VotingDeployment.address;
      votingContract = await ethers.getContractAt("Voting", VotingDeployment.address);
    } catch (e) {
      (e as Error).message += ". Call 'npx hardhat deploy --network sepolia'";
      throw e;
    }

    const ethSigners: HardhatEthersSigner[] = await ethers.getSigners();
    signers = {
      alice: ethSigners[0],
      bob: ethSigners[1],
      admin: ethSigners[2],
    };
  });

  beforeEach(async () => {
    step = 0;
    steps = 0;
  });

  it("create poll and cast multiple votes", async function () {
    steps = 15;

    this.timeout(4 * 40000);

    progress("Creating poll...");
    const tx = await votingContract.createPoll(
      "Sepolia Test Poll",
      "Testing voting on Sepolia",
      ["Option 1", "Option 2", "Option 3"]
    );
    await tx.wait();

    const pollId = 0;
    progress(`Poll created with ID: ${pollId}`);

    progress("Checking initial vote counts...");
    const encCount0 = await votingContract.getEncryptedVoteCount(pollId, 0);
    expect(encCount0).to.eq(ethers.ZeroHash);

    progress("Alice encrypting vote for option 0...");
    const voteAlice = await fhevm
      .createEncryptedInput(votingContractAddress, signers.alice.address)
      .add32(1)
      .encrypt();

    progress(`Calling castVote for Alice, option 0...`);
    let voteTx = await votingContract
      .connect(signers.alice)
      .castVote(pollId, 0, voteAlice.handles[0], voteAlice.inputProof);
    await voteTx.wait();

    progress("Checking poll info...");
    const pollInfo = await votingContract.getPollInfo(pollId);
    progress(`Total votes: ${pollInfo.totalVotes}`);
    expect(pollInfo.totalVotes).to.eq(1);

    progress("Bob encrypting vote for option 1...");
    const voteBob = await fhevm
      .createEncryptedInput(votingContractAddress, signers.bob.address)
      .add32(1)
      .encrypt();

    progress(`Calling castVote for Bob, option 1...`);
    voteTx = await votingContract
      .connect(signers.bob)
      .castVote(pollId, 1, voteBob.handles[0], voteBob.inputProof);
    await voteTx.wait();

    progress("Checking updated poll info...");
    const pollInfo2 = await votingContract.getPollInfo(pollId);
    expect(pollInfo2.totalVotes).to.eq(2);

    progress("Admin allowing decryption for option 0...");
    await votingContract.connect(signers.admin).allowAdminToDecrypt(pollId, 0);
    await votingContract.connect(signers.admin).allowAdminToDecrypt(pollId, 1);

    progress("Retrieving encrypted vote counts...");
    const encCountAfter0 = await votingContract.getEncryptedVoteCount(pollId, 0);
    const encCountAfter1 = await votingContract.getEncryptedVoteCount(pollId, 1);

    progress(`Decrypting option 0 count...`);
    const clearCount0 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encCountAfter0,
      votingContractAddress,
      signers.admin,
    );
    progress(`Clear count for option 0: ${clearCount0}`);

    progress(`Decrypting option 1 count...`);
    const clearCount1 = await fhevm.userDecryptEuint(
      FhevmType.euint32,
      encCountAfter1,
      votingContractAddress,
      signers.admin,
    );
    progress(`Clear count for option 1: ${clearCount1}`);

    expect(clearCount0).to.eq(1);
    expect(clearCount1).to.eq(1);
  });
});



