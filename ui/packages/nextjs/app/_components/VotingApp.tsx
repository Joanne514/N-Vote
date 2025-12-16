"use client";

import { useMemo, useState } from "react";
import { useFhevm } from "@fhevm-sdk";
import { useAccount } from "wagmi";
import { RainbowKitCustomConnectButton } from "~~/components/helper/RainbowKitCustomConnectButton";
import { useVotingWagmi } from "~~/hooks/voting/useVotingWagmi";
import { AnimatedCard } from "~~/components/animations/AnimatedCard";
import { FadeIn } from "~~/components/animations/FadeIn";
import { PulseRing } from "~~/components/animations/PulseRing";

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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [allowedDecryptionOptions, setAllowedDecryptionOptions] = useState<Set<number>>(new Set());

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 gradient-animated flex items-center justify-center p-6 relative overflow-hidden">
        {/* 背景装饰元素 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: "2s" }}></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: "4s" }}></div>
        </div>
        
        <AnimatedCard className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 max-w-md w-full text-center border border-white/30 relative z-10">
          <FadeIn delay={200}>
          <div className="mb-6">
              <PulseRing size="lg">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 text-white text-5xl shadow-2xl transform transition-transform duration-300 hover:scale-110">
              🔒
                </div>
              </PulseRing>
            </div>
          </FadeIn>
          
          <FadeIn delay={400}>
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent mb-4">
              Wallet Not Connected
            </h2>
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">
              Connect your wallet to participate in anonymous voting and protect your privacy with fully homomorphic encryption.
          </p>
          </FadeIn>
          
          <FadeIn delay={600}>
            <div className="flex justify-center mb-6">
              <div className="transform transition-all duration-300 hover:scale-105">
            <RainbowKitCustomConnectButton />
          </div>
          </div>
            <div className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <p className="flex items-center justify-center gap-2">
                <span className="text-lg">💡</span>
                <span><strong>Tip:</strong> Make sure Hardhat node is running on http://127.0.0.1:8545</span>
              </p>
        </div>
          </FadeIn>
        </AnimatedCard>
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
      // Calculate endTime: 7 days from now (in seconds)
      const endTime = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
      await voting.createPoll(pollTitle, pollDescription, options, endTime);
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

    try {
      setError(null);
      await voting.castVote(voting.selectedPollId, optionIndex);
      setSuccess("Vote cast successfully!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Voting error:", err);
      const errorMessage = err?.message?.includes("Already voted")
        ? "You have already voted in this poll"
        : err?.message?.includes("Poll not active")
        ? "This poll is no longer active"
        : err?.message?.includes("Invalid option")
        ? "Invalid voting option selected"
        : "Failed to cast vote. Please try again.";
      setError(errorMessage);
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: "4s" }}></div>
      </div>

      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 text-white shadow-2xl -mt-16 pt-28 pb-20 md:pt-32 md:pb-24 overflow-hidden">
        {/* 背景动画效果 */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <FadeIn>
          <div className="text-center">
              {/* 投票箱 Icon with 呼吸动画 + radial glow */}
              <div className="mb-8 flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full animate-radial-glow"></div>
                  <div className="relative inline-flex items-center justify-center w-28 h-28 md:w-32 md:h-32 rounded-full bg-white/10 backdrop-blur-md animate-breathe">
                    <span className="text-6xl md:text-7xl">🗳️</span>
                  </div>
                </div>
            </div>
              
              {/* 主标题 - 更大更有重量感 */}
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 bg-gradient-to-r from-white via-blue-50 to-purple-50 bg-clip-text text-transparent tracking-tight leading-tight">
              Anonymous Voting System
            </h1>
              
              {/* 副标题 - 更轻、透明度更低、行距更舒展 */}
              <p className="text-lg md:text-xl lg:text-xl text-blue-100/80 max-w-2xl mx-auto leading-relaxed font-light tracking-wide">
                Cast your vote privately with fully homomorphic encryption.<br className="hidden md:block" />
                <span className="text-blue-200/70"> Your choices remain confidential until decryption.</span>
            </p>
          </div>
          </FadeIn>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 space-y-6 relative z-10">
        {/* Create Poll Section */}
        <AnimatedCard delay={200} hover={true} className="bg-white rounded-card shadow-medium border border-gray-100/50 p-6 md:p-8 hover:shadow-medium hover:-translate-y-1 transition-all duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-2xl shadow-lg transform transition-transform duration-300 hover:scale-110 hover:rotate-12">
                ✨
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Create New Poll
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Start a new anonymous voting session</p>
              </div>
            </div>
            <button
              className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-card shadow-medium hover:shadow-deep transition-all duration-200 btn-click relative overflow-hidden group"
              onClick={() => setShowCreatePoll(!showCreatePoll)}
            >
              <span className="relative z-10 flex items-center gap-2">
                {showCreatePoll ? (
                  <>
                    <span>❌</span>
                    <span>Cancel</span>
                  </>
                ) : (
                  <>
                    <span>➕</span>
                    <span>Create Poll</span>
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </button>
          </div>

          {showCreatePoll && (
            <FadeIn>
              <div className="space-y-6 mt-6 pt-6 border-t border-gray-200 animate-slide-up">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-purple-600">📝</span>
                  Poll Title
                </label>
                <input
                  type="text"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:border-purple-300"
                  placeholder="e.g., Best Framework for 2024"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                />
              </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <span className="text-blue-600">📄</span>
                  Description (Optional)
                </label>
                <textarea
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 resize-none bg-white/50 backdrop-blur-sm hover:border-purple-300"
                  placeholder="Describe your poll..."
                  value={pollDescription}
                  onChange={(e) => setPollDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                  <span className="text-indigo-600">🎯</span>
                  Voting Options
                </label>
                <div className="space-y-3">
                  {optionInputs.map((option, index) => (
                    <AnimatedCard key={index} delay={index * 50} className="flex gap-3 items-center p-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-md">
                          {index + 1}
                        </div>
                        <input
                          type="text"
                          className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300 bg-white/50 backdrop-blur-sm hover:border-purple-300"
                          placeholder={`Option ${index + 1}`}
                          value={option}
                          onChange={(e) => updateOption(index, e.target.value)}
                        />
                      </div>
                      {optionInputs.length > 2 && (
                        <button
                          className="px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 transition-all duration-300 flex-shrink-0 shadow-md hover:shadow-lg transform hover:scale-105"
                          onClick={() => removeOption(index)}
                          type="button"
                        >
                          🗑️
                        </button>
                      )}
                    </AnimatedCard>
                  ))}
                </div>
                {optionInputs.length < 10 && (
                  <button
                    className="mt-4 px-5 py-2.5 text-purple-600 border-2 border-purple-300 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 font-medium shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-2"
                    onClick={addOption}
                    type="button"
                  >
                    <span>➕</span>
                    <span>Add Option</span>
                  </button>
                )}
              </div>

              <button
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-semibold rounded-card-lg shadow-deep hover:shadow-colored-glow transition-all duration-200 btn-click disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                onClick={handleCreatePoll}
                disabled={voting.isProcessing}
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {voting.isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Creating Poll...</span>
                    </>
                  ) : (
                    <>
                      <span className="transform group-hover:rotate-12 transition-transform duration-300">🚀</span>
                      <span>Create Poll</span>
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
              
              {voting.message && (
                <FadeIn>
                  <div className={`mt-4 p-4 rounded-xl border-2 animate-scale-in ${
                  voting.message.includes("successfully") || voting.message.includes("success")
                      ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-800 border-green-300 shadow-lg"
                    : voting.message.includes("error") || voting.message.includes("Error") || voting.message.includes("Failed")
                      ? "bg-gradient-to-r from-red-50 to-rose-50 text-red-800 border-red-300 shadow-lg"
                      : "bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-800 border-blue-300 shadow-lg"
                }`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{voting.message.includes("successfully") || voting.message.includes("success") ? "✅" : "ℹ️"}</span>
                    <span className="font-medium">{voting.message}</span>
                  </div>
                </div>
                </FadeIn>
              )}
            </div>
            </FadeIn>
          )}
        </AnimatedCard>

        {/* Polls List */}
        <AnimatedCard delay={400} className="bg-white rounded-card shadow-medium border border-gray-100/50 p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl shadow-lg">
                📋
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Active Polls
              </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {voting.pollCount} {voting.pollCount === 1 ? "poll" : "polls"} available
                </p>
              </div>
            </div>
            <button
              className="px-5 py-2.5 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 rounded-xl hover:from-purple-200 hover:to-blue-200 transition-all duration-300 font-medium shadow-sm hover:shadow-md transform hover:scale-105 flex items-center gap-2"
              onClick={async () => {
                await voting.refreshContractData();
              }}
            >
              <span className="animate-spin-slow">🔄</span>
              <span>Refresh</span>
            </button>
          </div>
          {voting.pollCount === 0 ? (
            <FadeIn>
              <div className="text-center py-16 md:py-20">
                <div className="text-7xl md:text-8xl mb-6 animate-float">📭</div>
                <p className="text-lg md:text-xl text-gray-500 font-medium">No polls available. Create one above!</p>
            </div>
            </FadeIn>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: voting.pollCount }).map((_, pollId) => (
                <AnimatedCard
                  key={pollId}
                  delay={pollId * 100}
                  hover={true}
                  className="bg-white border border-gray-200 rounded-card shadow-soft p-6 cursor-pointer relative overflow-hidden group hover:shadow-medium hover:-translate-y-1 transition-all duration-300 btn-click"
                  onClick={() => handleSelectPoll(pollId)}
                >
                  <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-bold">
                            {pollId + 1}
                          </div>
                          <h3 className="font-semibold text-gray-900">Poll #{pollId}</h3>
                        </div>
                        <p className="text-xs text-gray-500 ml-11">Click to view and vote</p>
                      </div>
                    </div>
                    <button
                      className="w-full px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-all duration-200 text-sm font-medium btn-click flex items-center justify-center gap-2 border border-gray-200"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectPoll(pollId);
                      }}
                    >
                      <span>View</span>
                      <span className="text-xs">→</span>
                    </button>
                  </div>
                </AnimatedCard>
              ))}
            </div>
          )}
        </AnimatedCard>

        {/* Selected Poll Details */}
        {voting.selectedPollId !== undefined && voting.pollInfo && (
          <AnimatedCard delay={600} className="bg-white rounded-card shadow-medium border border-gray-100/50 p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-3xl shadow-lg">
                    📝
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {voting.pollInfo.title}
                  </h2>
                </div>
                {voting.pollInfo.description && (
                  <p className="text-gray-600 mt-2 ml-16 md:ml-20 text-lg leading-relaxed">{voting.pollInfo.description}</p>
                )}
              </div>
              <button
                className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all duration-300 transform hover:scale-110 hover:rotate-90 shadow-sm hover:shadow-md"
                onClick={() => voting.setSelectedPollId(undefined)}
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* Error/Success Messages */}
              {error && (
                <FadeIn>
                  <div className="p-4 bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-300 rounded-xl shadow-lg animate-scale-in">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">⚠️</span>
                      <span className="text-red-800 font-medium">{error}</span>
                    </div>
                  </div>
                </FadeIn>
              )}

              {success && (
                <FadeIn>
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl shadow-lg animate-scale-in">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✅</span>
                      <span className="text-green-800 font-medium">{success}</span>
                    </div>
                  </div>
                </FadeIn>
              )}

              {/* Voting Section */}
              {voting.userHasVoted ? (
                <FadeIn>
                  <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 border border-green-200 rounded-card p-6 shadow-soft">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-xl flex-shrink-0">
                        ✅
                      </div>
                      <div className="flex-1">
                        <div className="text-green-800 font-semibold mb-2">Vote Cast Successfully</div>
                        <div className="text-sm text-green-700/70 font-mono-crypto">
                          Your vote is encrypted and recorded on-chain.
                        </div>
                        <div className="mt-2 text-xs text-green-600/60 font-mono-crypto">
                          Status: Encrypted • Awaiting threshold decryption
                        </div>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              ) : (
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-xl shadow-md">
                      🎯
                    </div>
                    <span>Cast Your Vote</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: voting.pollInfo.optionCount }).map((_, index) => {
                      const optionDesc = voting.optionDescriptions[index] || `Option ${index + 1}`;
                      return (
                        <button
                          key={index}
                          className="p-5 bg-white border border-gray-200 rounded-card shadow-soft text-left relative overflow-hidden group cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-medium hover:-translate-y-0.5 transition-all duration-200 btn-click w-full"
                          onClick={() => handleVote(index)}
                          disabled={voting.isProcessing}
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-700 font-bold text-sm group-hover:bg-gray-200 transition-colors">
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900 flex-1">{optionDesc}</span>
                            <span className="text-gray-400 group-hover:text-gray-600 transition-colors">→</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Poll Statistics */}
              <div className="bg-white rounded-card shadow-soft border border-gray-100 p-6 md:p-8 relative overflow-hidden">
                {/* 渐变竖线 accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-purple-500 via-blue-500 to-indigo-500"></div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-3 ml-4">
                  <span className="text-lg">📊</span>
                  <span>Poll Statistics</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-card p-5 text-center border border-gray-100">
                    <div className="text-2xl mb-2">👥</div>
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 animate-count-up font-mono-crypto">
                      {voting.pollInfo.totalVotes}
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Votes</div>
                  </div>
                  <div className="bg-gray-50 rounded-card p-5 text-center border border-gray-100">
                    <div className="text-2xl mb-2">📝</div>
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1 font-mono-crypto">
                      {voting.pollInfo.optionCount}
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Options</div>
                  </div>
                  <div className="bg-gray-50 rounded-card p-5 text-center border border-gray-100">
                    <div className="text-2xl mb-2">
                      {voting.pollInfo.active ? "✅" : "🔒"}
                    </div>
                    <div className={`text-lg md:text-xl font-bold mb-1 ${
                      voting.pollInfo.active 
                        ? "text-green-600"
                        : "text-gray-600"
                    }`}>
                      {voting.pollInfo.active ? "Live · Votes are encrypted" : "Closed"}
                    </div>
                    <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</div>
                  </div>
                </div>
              </div>

              {/* Homomorphically Encrypted Tally */}
              {Object.keys(voting.encryptedCounts).length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="text-lg">🔐</span>
                    <span>Homomorphically Encrypted Tally</span>
                  </h3>
                  <div className="space-y-2">
                    {Array.from({ length: voting.pollInfo.optionCount }).map((_, index) => {
                      const handle = voting.encryptedCounts[index];
                      const decrypted = voting.decryptedCounts[index];
                      const optionDesc = voting.optionDescriptions[index] || `Option ${index + 1}`;
                      const isEncrypted = handle && handle !== "0x0000000000000000000000000000000000000000000000000000000000000000" && decrypted === undefined;
                      const isDecrypted = decrypted !== undefined;
                      
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-between p-4 bg-white rounded-card border transition-all duration-300 ${
                            isDecrypted 
                              ? "border-green-200 bg-green-50/30 shadow-soft" 
                              : isEncrypted
                              ? "border-gray-200 shadow-soft"
                              : "border-gray-100"
                          }`}
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              isDecrypted 
                                ? "bg-green-500 text-white" 
                                : "bg-gray-200 text-gray-600"
                            }`}>
                              {index + 1}
                            </div>
                            <span className="font-medium text-gray-900">{optionDesc}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {handle && handle !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? (
                              <>
                                {isDecrypted ? (
                                  <div className="flex items-center gap-2 px-4 py-2 bg-green-100 border border-green-300 rounded-lg">
                                    <span className="font-mono-crypto font-bold text-green-800 text-lg animate-count-up">
                                      {decrypted.toString()}
                                  </span>
                                    <span className="text-xs text-green-700 font-medium">votes</span>
                                    <span className="text-green-600">✓</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg">
                                    <span className="font-mono-crypto text-gray-500 encrypted-blur">
                                      {handle.slice(0, 8)}...{handle.slice(-6)}
                                  </span>
                                    <span className="text-xs text-gray-500">🔒</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <span className="px-4 py-2 bg-gray-50 text-gray-400 rounded-lg font-mono-crypto text-sm">
                                0
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Threshold Decryption Controls */}
              {Object.keys(voting.encryptedCounts).length > 0 && (
                <div className="bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-200 rounded-card-xl shadow-colored-glow p-6 md:p-8 relative overflow-hidden">
                  {/* Subtle pattern background */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
                    backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.05) 10px, rgba(0,0,0,0.05) 20px)`
                  }}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center text-white shadow-md">
                        🔐
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">Public Decryption Controls</h3>
                        <p className="text-xs text-gray-600 mt-1 font-mono-crypto">Anyone can decrypt • Multi-party decryption</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {Array.from({ length: voting.pollInfo.optionCount }).map((_, index) => {
                          // 这里需要检查是否已允许解密，暂时用简单逻辑
                          const isAllowed = false; // 需要从 voting hook 获取实际状态
                          return (
                      <button
                        key={index}
                              className={`px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium btn-click flex items-center gap-2 ${
                                isAllowed
                                  ? "bg-green-100 text-green-800 border border-green-300"
                                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                              }`}
                        onClick={() => voting.allowAdminToDecrypt(voting.selectedPollId!, index)}
                        disabled={voting.isProcessing}
                      >
                              {isAllowed ? (
                                <>
                                  <span>✓</span>
                                  <span>Option {index + 1}</span>
                                </>
                              ) : (
                                <>
                                  <span>🔒</span>
                                  <span>Allow Decrypt Option {index + 1}</span>
                                </>
                              )}
                      </button>
                          );
                        })}
                      </div>
                      
                    <button
                        className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white rounded-card-lg hover:shadow-colored-glow transition-all duration-300 font-semibold shadow-deep btn-click disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      onClick={async () => {
                        if (!voting.canDecrypt) {
                          voting.setMessage("⚠️ Please allow decryption for at least one option first");
                          return;
                        }
                        try {
                          await voting.decrypt();
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
                        {voting.isDecrypting ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Decrypting...</span>
                          </>
                        ) : (
                          <>
                            <span>🔓</span>
                            <span>Decrypt Results</span>
                          </>
                        )}
                    </button>
                    </div>
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
          </AnimatedCard>
        )}
      </div>
    </div>
  );
};
