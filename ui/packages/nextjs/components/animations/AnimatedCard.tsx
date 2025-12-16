"use client";

import React, { ReactNode } from "react";

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  hover?: boolean;
  glow?: boolean;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  className = "",
  delay = 0,
  hover = true,
  glow = false,
}) => {
  return (
    <div
      className={`
        animate-slide-up
        ${hover ? "hover-lift" : ""}
        ${glow ? "animate-glow" : ""}
        ${className}
      `}
      style={{
        animationDelay: `${delay}ms`,
        animationFillMode: "both",
      }}
    >
      {children}
    </div>
  );
};

