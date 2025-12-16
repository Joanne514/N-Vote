"use client";

import React, { useRef, useEffect, useState } from "react";
import { RainbowKitCustomConnectButton } from "~~/components/helper";
import { useOutsideClick } from "~~/hooks/helper";

/**
 * Site header with modern animations
 */
export const Header = () => {
  const burgerMenuRef = useRef<HTMLDetailsElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useOutsideClick(burgerMenuRef, () => {
    burgerMenuRef?.current?.removeAttribute("open");
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-xl shadow-lg border-b border-gray-200/50"
          : "bg-white/80 backdrop-blur-lg shadow-md border-b border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center gap-3 md:gap-4 group cursor-pointer">
            <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl md:text-2xl shadow-lg transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-12 group-hover:shadow-xl">
              🗳️
              </div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-300 animate-pulse"></div>
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg md:text-xl lg:text-2xl bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent transition-all duration-300 group-hover:scale-105">
                Anonymous Voting
              </span>
              <span className="text-xs md:text-sm text-gray-500 font-medium hidden sm:block">
                Privacy-Preserving Democracy
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 animate-fade-in">
            <RainbowKitCustomConnectButton />
          </div>
        </div>
      </div>
    </header>
  );
};
