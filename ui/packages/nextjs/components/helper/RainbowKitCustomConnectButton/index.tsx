"use client";

// @refresh reset
import { Balance } from "../Balance";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Address } from "viem";
import { useTargetNetwork } from "~~/hooks/helper/useTargetNetwork";
import { getBlockExplorerAddressLink } from "~~/utils/helper";

/**
 * Custom Wagmi Connect Button (watch balance + custom design)
 */
export const RainbowKitCustomConnectButton = () => {
  const { targetNetwork } = useTargetNetwork();

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const connected = mounted && account && chain;
        const blockExplorerAddressLink = account
          ? getBlockExplorerAddressLink(targetNetwork, account.address)
          : undefined;

        return (
          <>
            {(() => {
              if (!connected) {
                return (
                  <button
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-105 flex items-center gap-2 cursor-pointer border-none relative overflow-hidden group"
                    onClick={openConnectModal}
                    type="button"
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      <span>🔗</span>
                      <span>Connect Wallet</span>
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </button>
                );
              }

              if (chain.unsupported || chain.id !== targetNetwork.id) {
                return <WrongNetworkDropdown />;
              }

              return (
                <>
                  <div className="flex flex-col items-center mr-3 px-4 py-2 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200/50 shadow-sm">
                    <Balance address={account.address as Address} className="min-h-0 h-auto font-semibold text-gray-900" />
                    <span className="text-xs text-gray-600 font-medium mt-1">{chain.name}</span>
                  </div>
                  <AddressInfoDropdown
                    address={account.address as Address}
                    displayName={account.displayName}
                    ensAvatar={account.ensAvatar}
                    blockExplorerAddressLink={blockExplorerAddressLink}
                  />
                </>
              );
            })()}
          </>
        );
      }}
    </ConnectButton.Custom>
  );
};
