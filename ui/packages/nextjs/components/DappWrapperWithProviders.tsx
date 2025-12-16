"use client";

import { useEffect, useState } from "react";
import { InMemoryStorageProvider } from "@fhevm-sdk";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";
import { useTheme } from "next-themes";
import { Toaster } from "react-hot-toast";
import { WagmiProvider } from "wagmi";
import { Header } from "~~/components/Header";
import { BlockieAvatar } from "~~/components/helper";
import { getWagmiConfig } from "~~/services/web3/wagmiConfig";

// Create QueryClient instance - must be created outside component to avoid recreating on each render
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

export const DappWrapperWithProviders = ({ children }: { children: React.ReactNode }) => {
  const { resolvedTheme } = useTheme();
  const isDarkMode = resolvedTheme === "dark";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Always render QueryClientProvider, WagmiProvider, and RainbowKitProvider to ensure hooks can access them
  // getWagmiConfig handles SSR internally (returns minimal config for SSR)
  const wagmiConfig = getWagmiConfig();

  if (!mounted) {
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={wagmiConfig}>
          <RainbowKitProvider
            avatar={BlockieAvatar}
            theme={lightTheme()}
          >
            <div className="flex flex-col min-h-screen items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 relative overflow-hidden">
              {/* 背景装饰 */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
                <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: "2s" }}></div>
              </div>
              
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white text-4xl mb-6 shadow-2xl animate-pulse-ring">
                  🗳️
                </div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                  <div className="w-3 h-3 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                </div>
                <p className="text-gray-600 font-medium">Loading Anonymous Voting System...</p>
              </div>
              
              {/* Render children but hide it - ensures hooks can access all providers */}
              <div style={{ display: "none" }}>
                <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
              </div>
            </div>
          </RainbowKitProvider>
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <RainbowKitProvider
          avatar={BlockieAvatar}
          theme={isDarkMode ? darkTheme() : lightTheme()}
        >
          <ProgressBar height="3px" color="#2299dd" />
          <div className={`flex flex-col min-h-screen`}>
            <Header />
            <main className="relative flex flex-col flex-1">
              <InMemoryStorageProvider>{children}</InMemoryStorageProvider>
            </main>
          </div>
          <Toaster />
        </RainbowKitProvider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};
