// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Private Voting System (FHE)
/// @notice Community members can vote on-chain without exposing their individual choices.
///         Votes are encrypted and counted in encrypted state. Final results can be decrypted.
contract Voting is SepoliaConfig {
    address public immutable admin;

    struct VoteOption {
        string description;
        euint32 encryptedCount; // Encrypted vote count for this option
        bool initialized;
    }

    struct Poll {
        string title;
        string description;
        bool active;
        uint32 optionCount;
        mapping(uint32 => VoteOption) options;
        mapping(address => bool) hasVoted;
        uint32 totalVotes; // Plain count of total votes
    }

    mapping(uint256 => Poll) public polls;
    uint256 public pollCount;

    event PollCreated(uint256 indexed pollId, string title, address creator);
    event VoteCast(uint256 indexed pollId, address indexed voter);
    event PollDecrypted(uint256 indexed pollId);

    constructor(address _admin) {
        require(_admin != address(0), "Admin required");
        admin = _admin;
    }

    /// @notice Create a new poll with voting options
    /// @param title The title of the poll
    /// @param description Description of the poll
    /// @param options Array of option descriptions
    /// @return pollId The ID of the created poll
    function createPoll(
        string memory title,
        string memory description,
        string[] memory options
    ) external returns (uint256 pollId) {
        require(bytes(title).length > 0, "Poll title cannot be empty");
        require(bytes(description).length > 0, "Poll description cannot be empty");
        require(options.length >= 2 && options.length <= 10, "Poll must have 2-10 options");
        require(bytes(title).length > 0, "Title required");

        pollId = pollCount++;
        Poll storage poll = polls[pollId];
        poll.title = title;
        poll.description = description;
        poll.active = true;
        poll.optionCount = uint32(options.length);

        for (uint32 i = 0; i < options.length; i++) {
            poll.options[i].description = options[i];
            poll.options[i].initialized = false;
        }

        emit PollCreated(pollId, title, msg.sender);
    }

    /// @notice Cast an encrypted vote for a specific option
    /// @param pollId The ID of the poll
    /// @param optionIndex The index of the option being voted for (1-based vote indicator)
    /// @param inputEuint32 Encrypted vote handle (should be 1 for the selected option, 0 for others)
    /// @param inputProof Input proof
    function castVote(
        uint256 pollId,
        uint32 optionIndex,
        externalEuint32 inputEuint32,
        bytes calldata inputProof
    ) external {
        Poll storage poll = polls[pollId];
        require(poll.active, "Poll not active");
        require(!poll.hasVoted[msg.sender], "Already voted");
        require(optionIndex < poll.optionCount, "Invalid option index");

        euint32 encryptedVote = FHE.fromExternal(inputEuint32, inputProof);

        VoteOption storage option = poll.options[optionIndex];

        // Initialize encrypted count on first vote
        if (!option.initialized) {
            option.encryptedCount = encryptedVote;
            option.initialized = true;
        } else {
            // Ensure contract has permission to access encrypted count
            FHE.allowThis(option.encryptedCount);
            option.encryptedCount = FHE.add(option.encryptedCount, encryptedVote);
        }

        poll.hasVoted[msg.sender] = true;
        poll.totalVotes += 1;

        // Allow contract and voter to access updated handles
        FHE.allowThis(option.encryptedCount);
        FHE.allow(option.encryptedCount, msg.sender);

        emit VoteCast(pollId, msg.sender);
    }

    /// @notice Get encrypted vote count for a specific option
    /// @param pollId The ID of the poll
    /// @param optionIndex The index of the option
    /// @return The encrypted vote count handle
    function getEncryptedVoteCount(uint256 pollId, uint32 optionIndex) external view returns (euint32) {
        require(optionIndex < polls[pollId].optionCount, "Invalid option");
        return polls[pollId].options[optionIndex].encryptedCount;
    }

    /// @notice Get poll information
    /// @param pollId The ID of the poll
    /// @return title The title of the poll
    /// @return description The description of the poll
    /// @return active Whether the poll is active
    /// @return optionCount Number of options
    /// @return totalVotes Total number of votes cast
    function getPollInfo(uint256 pollId)
        external
        view
        returns (
            string memory title,
            string memory description,
            bool active,
            uint32 optionCount,
            uint32 totalVotes
        )
    {
        Poll storage poll = polls[pollId];
        title = poll.title;
        description = poll.description;
        active = poll.active;
        optionCount = poll.optionCount;
        totalVotes = poll.totalVotes;
    }

    /// @notice Get option description
    /// @param pollId The ID of the poll
    /// @param optionIndex The index of the option
    /// @return The description of the option
    function getOptionDescription(uint256 pollId, uint32 optionIndex) external view returns (string memory) {
        require(optionIndex < polls[pollId].optionCount, "Invalid option");
        return polls[pollId].options[optionIndex].description;
    }

    /// @notice Allow admin to decrypt vote counts (enables decryption permission)
    /// @param pollId The ID of the poll
    /// @param optionIndex The index of the option to allow decryption for
    function allowAdminToDecrypt(uint256 pollId, uint32 optionIndex) external {
        require(msg.sender == admin, "Only admin");
        require(optionIndex < polls[pollId].optionCount, "Invalid option");
        
        VoteOption storage option = polls[pollId].options[optionIndex];
        require(option.initialized, "Option not initialized");
        
        FHE.allowThis(option.encryptedCount);
        FHE.allow(option.encryptedCount, admin);
    }

    /// @notice Deactivate a poll (admin only)
    /// @param pollId The ID of the poll
    function deactivatePoll(uint256 pollId) external {
        require(msg.sender == admin, "Only admin");
        polls[pollId].active = false;
    }

    /// @notice Check if an address has voted in a poll
    /// @param pollId The ID of the poll
    /// @param voter The address to check
    /// @return Whether the address has voted
    function hasVoted(uint256 pollId, address voter) external view returns (bool) {
        return polls[pollId].hasVoted[voter];
    }
}


