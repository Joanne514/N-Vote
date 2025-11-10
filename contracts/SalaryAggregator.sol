// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title Private Salary Aggregator (FHE)
/// @notice Employees submit encrypted salaries; contract maintains encrypted sum and count.
///         HR can decrypt the aggregated average value. Individual salaries remain private.
contract SalaryAggregator is SepoliaConfig {
    address public immutable hrAdmin;

    // Encrypted running sum of all submitted salaries
    euint32 private _sum;

    // Plain count of submissions (reveals number of participants only)
    uint32 public count;

    event SalarySubmitted(address indexed account);

    constructor(address hr) {
        require(hr != address(0), "HR admin required");
        hrAdmin = hr;
        // _sum defaults to uninitialized zero handle (ZeroHash)
        // _count defaults to uninitialized zero handle (ZeroHash)
    }

    /// @notice Submit your salary (encrypted off-chain). Can be called multiple times.
    /// @param inputEuint32 Encrypted salary handle
    /// @param inputProof   Input proof
    function submitSalary(externalEuint32 inputEuint32, bytes calldata inputProof) external {
        euint32 encSalary = FHE.fromExternal(inputEuint32, inputProof);

        // Initialize sum on first submission
        if (count == 0) {
            _sum = encSalary;
        } else {
            // Ensure contract has permission to access _sum before performing addition
            FHE.allowThis(_sum);
            _sum = FHE.add(_sum, encSalary);
        }
        count += 1;

        // Allow contract and sender to access updated handles if needed
        FHE.allowThis(_sum);
        FHE.allow(_sum, msg.sender);

        emit SalarySubmitted(msg.sender);
    }

    /// @notice Returns encrypted running sum
    function getEncryptedSum() external view returns (euint32) {
        return _sum;
    }

    /// @notice Allow HR to decrypt the current encrypted sum.
    /// @dev Average can be computed off-chain by HR as sum / count.
    function allowHrToDecryptSum() external {
        require(msg.sender == hrAdmin, "Only HR");
        FHE.allowThis(_sum);
        FHE.allow(_sum, hrAdmin);
    }
}


