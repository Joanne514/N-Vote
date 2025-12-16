import { useRef, useState } from "react";
import { NetworkOptions } from "./NetworkOptions";
import { Address, getAddress } from "viem";
import { useDisconnect } from "wagmi";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { ArrowsRightLeftIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { BlockieAvatar } from "~~/components/helper";
import { useOutsideClick } from "~~/hooks/helper";
import { getTargetNetworks } from "~~/utils/helper";

const allowedNetworks = getTargetNetworks();

type AddressInfoDropdownProps = {
  address: Address;
  displayName: string;
  ensAvatar?: string;
  blockExplorerAddressLink?: string;
};

export const AddressInfoDropdown = ({ address, ensAvatar, displayName }: AddressInfoDropdownProps) => {
  const { disconnect } = useDisconnect();
  const checkSumAddress = getAddress(address);

  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const dropdownRef = useRef<HTMLDetailsElement>(null);

  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };

  useOutsideClick(dropdownRef, closeDropdown);

  return (
    <>
      <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
        <summary className="btn btn-secondary btn-sm pl-2 pr-3 shadow-lg hover:shadow-xl dropdown-toggle gap-2 h-auto! bg-gradient-to-r from-purple-100 to-blue-100 border-purple-200/50 hover:from-purple-200 hover:to-blue-200 transition-all duration-300 transform hover:scale-105">
          <BlockieAvatar address={checkSumAddress} size={32} ensImage={ensAvatar} />
          <span className="ml-1 mr-1 font-semibold text-gray-900">{displayName}</span>
          <ChevronDownIcon className="h-5 w-5 ml-1 text-gray-700 transition-transform duration-300 group-open:rotate-180" />
        </summary>
        <ul className="dropdown-content menu z-2 p-3 mt-2 shadow-2xl bg-white/95 backdrop-blur-xl rounded-2xl border border-gray-200/50 gap-2 min-w-[200px]">
          <NetworkOptions hidden={!selectingNetwork} />
          {allowedNetworks.length > 1 ? (
            <li className={selectingNetwork ? "hidden" : ""}>
              <button
                className="h-10 btn-sm rounded-xl flex gap-3 py-3 px-4 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 transition-all duration-300 font-medium text-gray-700 hover:text-purple-700"
                type="button"
                onClick={() => {
                  setSelectingNetwork(true);
                }}
              >
                <ArrowsRightLeftIcon className="h-5 w-5" />
                <span>Switch Network</span>
              </button>
            </li>
          ) : null}
          <li className={selectingNetwork ? "hidden" : ""}>
            <button
              className="menu-item h-10 btn-sm rounded-xl flex gap-3 py-3 px-4 hover:bg-gradient-to-r hover:from-red-50 hover:to-rose-50 transition-all duration-300 font-medium text-red-600 hover:text-red-700"
              type="button"
              onClick={() => disconnect()}
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Disconnect</span>
            </button>
          </li>
        </ul>
      </details>
    </>
  );
};
