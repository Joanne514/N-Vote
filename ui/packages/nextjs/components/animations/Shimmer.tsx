"use client";

import React, { ReactNode } from "react";

interface ShimmerProps {
  children: ReactNode;
  className?: string;
}

export const Shimmer: React.FC<ShimmerProps> = ({ children, className = "" }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
      {children}
    </div>
  );
};

