"use client";

import React, { ReactNode } from "react";

interface PulseRingProps {
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const PulseRing: React.FC<PulseRingProps> = ({
  children,
  className = "",
  size = "md",
}) => {
  const sizeClasses = {
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
  };

  return (
    <div className={`relative inline-block ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 rounded-full pulse-ring bg-gradient-to-r from-purple-500 to-blue-500 opacity-20"></div>
      <div className="relative">{children}</div>
    </div>
  );
};

