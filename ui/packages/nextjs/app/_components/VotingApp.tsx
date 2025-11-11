"use client";

import { useMemo, useState } from "react";
import { useFhevm } from "@fhevm-sdk";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/helper/RainbowKitCustomConnectButton";
import { useVotingWagmi } from "~~/hooks/voting/useVotingWagmi";

export const VotingApp = () => {
  const { isConnected, chain } = useAccount();
  const chainId = chain?.id;

  const provider = useMemo(() => {
    if (typeof window === "undefined") return undefined;
    return (window as any).ethereum;
  }, []);

  const initialMockChains = { 31337: "http://localhost:8545" };

  const { instance } = useFhevm({ provider, chainId, initialMockChains, enabled: true });
  const voting = useVotingWagmi({ instance, initialMockChains });

  const [pollTitle, setPollTitle] = useState("");
  const [pollDescription, setPollDescription] = useState("");
  const [optionInputs, setOptionInputs] = useState<string[]>(["", ""]);
  const [showCreatePoll, setShowCreatePoll] = useState(false);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-6">
        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-4xl mb-4 shadow-lg">
              🔒
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Wallet Not Connected</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">
            Connect your wallet to participate in anonymous voting and protect your privacy.
          </p>
          <div className="flex justify-center mb-4">
            <RainbowKitCustomConnectButton />
          </div>
          <div className="text-sm text-gray-500 mt-4">
            <p>💡 <strong>Tip:</strong> Make sure Hardhat node is running on http://127.0.0.1:8545</p>
          </div>
        </div>
      </div>
    );
  }

  const addOption = () => {
    if (optionInputs.length < 10) {
      setOptionInputs([...optionInputs, ""]);
    }
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...optionInputs];
    newOptions[index] = value;
    setOptionInputs(newOptions);
  };

  const removeOption = (index: number) => {
    if (optionInputs.length > 2) {
      setOptionInputs(optionInputs.filter((_, i) => i !== index));
    }
  };

  const handleCreatePoll = async () => {
    const options = optionInputs.filter(opt => opt.trim() !== "");
    if (!pollTitle.trim() || options.length < 2) {
      alert("Please provide a title and at least 2 options");
      return;
    }
    try {
      await voting.createPoll(pollTitle, pollDescription, options);
      // Wait a bit for the UI to update
      await new Promise(resolve => setTimeout(resolve, 3000));
      setPollTitle("");
      setPollDescription("");
      setOptionInputs(["", ""]);
      setShowCreatePoll(false);
    } catch (error) {
      console.error("Error creating poll:", error);
      alert(`Failed to create poll: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleSelectPoll = async (pollId: number) => {
    voting.setSelectedPollId(pollId);
    setTimeout(() => {
      voting.loadEncryptedCounts();
    }, 500);
  };

  const handleVote = async (optionIndex: number) => {
    if (voting.selectedPollId === undefined) return;
    await voting.castVote(voting.selectedPollId, optionIndex);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white shadow-xl -mt-16 pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm mb-4">
              <span className="text-3xl">🗳️</span>
            </div>
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Anonymous Voting System
            </h1>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Cast your vote privately with fully homomorphic encryption. Your choices remain confidential until decryption.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Create Poll Section */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-300">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✨</span>
              <h2 className="text-2xl font-bold text-gray-900">Create New Poll</h2>
            </div>
            <button
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              onClick={() => setShowCreatePoll(!showCreatePoll)}
            >
              {showCreatePoll ? "❌ Cancel" : "➕ Create Poll"}
            </button>
          </div>

          {showCreatePoll && (
            <div className="space-y-6 mt-6 pt-6 border-t border-gray-200">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Poll Title
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                  placeholder="e.g., Best Framework for 2024"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none"
                  placeholder="Describe your poll..."
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Voting Options
                </label>
                <div className="space-y-3">
                  {optionInputs.map((option, index) => (
                    <div key={index} className="flex gap-3 items-center">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl flex-shrink-0 w-8 text-center">
                          {index === 0 && "1️⃣"}
                          {index === 1 && "2️⃣"}
                          {index === 2 && "3️⃣"}
                          {index === 3 && "4️⃣"}
                          {index === 4 && "5️⃣"}
                          {index === 5 && "6️⃣"}
                          {index === 6 && "7️⃣"}
                          {index === 7 && "8️⃣"}
                          {index === 8 && "9️⃣"}
                          {index === 9 && "🔟"}
                        </span>
                        <input
                          type="text"
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                        />
                      </div>
                      {optionInputs.length > 2 && (
                        <button
                          className="px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors flex-shrink-0"
                          onClick={() => removeOption(index)}
                          type="button"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {optionInputs.length < 10 && (
                  <button
                    className="mt-3 px-4 py-2 text-purple-600 border-2 border-purple-300 rounded-xl hover:bg-purple-50 transition-colors font-medium"
                    onClick={addOption}
                    type="button"
                  >
                    ➕ Add Option
                  </button>
                )}
              </div>

              <button
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleCreatePoll}
                disabled={voting.isProcessing}
              >
                {voting.isProcessing ? "⏳ Creating..." : "🚀 Create Poll"}
              </button>
              
              {voting.message && (
                <div className={`mt-4 p-4 rounded-lg ${
                  voting.message.includes("successfully") || voting.message.includes("success")
                    ? "bg-green-100 text-green-800 border border-green-300"
                    : voting.message.includes("error") || voting.message.includes("Error") || voting.message.includes("Failed")
                    ? "bg-red-100 text-red-800 border border-red-300"
                    : "bg-blue-100 text-blue-800 border border-blue-300"
                }`}>
                  <div className="flex items-center gap-2">
                    <span>{voting.message.includes("successfully") || voting.message.includes("success") ? "✅" : "ℹ️"}</span>
                    <span className="font-medium">{voting.message}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Polls List */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📋</span>
              <h2 className="text-2xl font-bold text-gray-900">
                Active Polls ({voting.pollCount})
              </h2>
            </div>
            <button
              className="px-4 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors font-medium"
              onClick={async () => {
                await voting.refreshContractData();
              }}
            >
              🔄 Refresh
            </button>
          </div>
          {voting.pollCount === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-lg">No polls available. Create one above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: voting.pollCount }).map((_, pollId) => (
                <div
                  key={pollId}
                  className="bg-gradient-to-br from-white to-purple-50 border-2 border-purple-200 rounded-xl p-6 hover:shadow-xl hover:border-purple-400 transition-all duration-300 cursor-pointer transform hover:-translate-y-1"
                  onClick={() => handleSelectPoll(pollId)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">📊</span>
                        <h3 className="font-bold text-gray-900">Poll #{pollId}</h3>
                      </div>
                      <p className="text-sm text-gray-600">Click to view and vote</p>
                    </div>
                    <button
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPoll(pollId);
                      }}
                    >
                      View →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Poll Details */}
        {voting.selectedPollId !== undefined && voting.pollInfo && (
          <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-xl border border-white/20 p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">📝</span>
                  <h2 className="text-3xl font-bold text-gray-900">{voting.pollInfo.title}</h2>
                </div>
                {voting.pollInfo.description && (
                  <p className="text-gray-600 mt-2 ml-11">{voting.pollInfo.description}</p>
                )}
              </div>
              <button
                className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => voting.setSelectedPollId(undefined)}
              >
                ✕
              </button>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              {/* Voting Section */}
              {voting.userHasVoted ? (
                <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <span className="text-green-800 font-medium">You have already voted in this poll.</span>
                  </div>
                </div>
              ) : (
                <div className="mb-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🎯</span>
                    Cast Your Vote
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: voting.pollInfo.optionCount }).map((_, index) => {
                      const optionDesc = voting.optionDescriptions[index] || `Option ${index + 1}`;
                      return (
                        <button
                          key={index}
                          className="p-6 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-xl hover:border-blue-400 hover:shadow-lg transition-all duration-300 text-left transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          onClick={() => handleVote(index)}
                          disabled={voting.isProcessing}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">
                              {index === 0 && "1️⃣"}
                              {index === 1 && "2️⃣"}
                              {index === 2 && "3️⃣"}
                              {index === 3 && "4️⃣"}
                              {index === 4 && "5️⃣"}
                              {index >= 5 && "⚪"}
                            </span>
                            <span className="font-semibold text-gray-900">{optionDesc}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Poll Statistics */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 mb-6 border border-purple-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Poll Statistics
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-white rounded-lg p-4 text-center border border-purple-200">
                    <div className="text-2xl mb-2">👥</div>
                    <div className="text-3xl font-bold text-purple-600">{voting.pollInfo.totalVotes}</div>
                    <div className="text-sm text-gray-600 mt-1">Total Votes</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border border-blue-200">
                    <div className="text-2xl mb-2">📝</div>
                    <div className="text-3xl font-bold text-blue-600">{voting.pollInfo.optionCount}</div>
                    <div className="text-sm text-gray-600 mt-1">Options</div>
                  </div>
                  <div className="bg-white rounded-lg p-4 text-center border border-green-200">
                    <div className="text-2xl mb-2">{voting.pollInfo.active ? "✅" : "🔒"}</div>
                    <div className="text-3xl font-bold text-green-600">{voting.pollInfo.active ? "Active" : "Closed"}</div>
                    <div className="text-sm text-gray-600 mt-1">Status</div>
                  </div>
                </div>
              </div>

              {/* Encrypted Vote Counts */}
              {Object.keys(voting.encryptedCounts).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>🔐</span>
                    Encrypted Vote Counts
                  </h3>
                  <div className="space-y-3">
                    {Array.from({ length: voting.pollInfo.optionCount }).map((_, index) => {
                      const handle = voting.encryptedCounts[index];
                      const decrypted = voting.decryptedCounts[index];
                      const optionDesc = voting.optionDescriptions[index] || `Option ${index + 1}`;
                      return (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                          <div className="flex items-center gap-3">
                            <span className="text-xl">
                              {index === 0 && "1️⃣"}
                              {index === 1 && "2️⃣"}
                              {index === 2 && "3️⃣"}
                              {index === 3 && "4️⃣"}
                              {index === 4 && "5️⃣"}
                              {index >= 5 && "⚪"}
                            </span>
                            <span className="font-medium text-gray-900">{optionDesc}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {handle && handle !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
                              <>
                                {decrypted !== undefined ? (
                                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-bold">
                                    {decrypted.toString()} votes ✅
                                  </span>
                                ) : (
                                  <span className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg font-medium">
                                    🔒 Encrypted
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg">
                                0 votes
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Admin Controls */}
              {voting.isAdmin && (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span>⚙️</span>
                    Admin Controls
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {Array.from({ length: voting.pollInfo.optionCount }).map((_, index) => (
                      <button
                        key={index}
                        className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium"
                        onClick={() => voting.allowAdminToDecrypt(voting.selectedPollId!, index)}
                        disabled={voting.isProcessing}
                      >
                        🔓 Allow Decrypt Option {index + 1}
                      </button>
                    ))}
                    <button
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                      onClick={async () => {
                        if (!voting.canDecrypt) {
                          voting.setMessage("⚠️ Please allow decryption for at least one option first");
                          return;
                        }
                        try {
                          await voting.decrypt();
                          // Refresh encrypted counts after decryption
                          setTimeout(() => {
                            voting.loadEncryptedCounts();
                          }, 1000);
                        } catch (error) {
                          console.error("Decrypt error:", error);
                          voting.setMessage(`❌ Decryption failed: ${error instanceof Error ? error.message : String(error)}. Make sure you've authorized decryption for all options first.`);
                        }
                      }}
                      disabled={!voting.canDecrypt || voting.isDecrypting}
                    >
                      {voting.isDecrypting ? "⏳ Decrypting..." : "🔓 Decrypt Results"}
                    </button>
                  </div>
                </div>
              )}

              {voting.message && (
                <div className={`mt-6 p-4 rounded-xl ${
                  voting.message.includes("success") || voting.message.includes("Success")
                    ? "bg-green-50 border-2 border-green-200 text-green-800"
                    : "bg-blue-50 border-2 border-blue-200 text-blue-800"
                }`}>
                  <div className="flex items-center gap-2">
                    <span>{voting.message.includes("success") ? "✅" : "ℹ️"}</span>
                    <span>{voting.message}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
