"use client";

import Link from "next/link";
import { AnimatedCard } from "~~/components/animations/AnimatedCard";
import { FadeIn } from "~~/components/animations/FadeIn";
import { PulseRing } from "~~/components/animations/PulseRing";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: "2s" }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: "4s" }}></div>
      </div>

      <AnimatedCard className="text-center max-w-2xl w-full relative z-10">
        <FadeIn delay={200}>
          <PulseRing size="lg" className="mb-8">
            <div className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 text-white text-7xl shadow-2xl">
              🔍
            </div>
          </PulseRing>
        </FadeIn>

        <FadeIn delay={400}>
          <h1 className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700 bg-clip-text text-transparent mb-4 animate-scale-in">
            404
          </h1>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Page Not Found
          </h2>
          <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-md mx-auto">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </FadeIn>

        <FadeIn delay={600}>
          <Link
            href="/"
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-105"
          >
            <span>🏠</span>
            <span>Go Home</span>
          </Link>
        </FadeIn>
      </AnimatedCard>
    </div>
  );
}
