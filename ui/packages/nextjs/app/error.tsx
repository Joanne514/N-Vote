"use client";

import { useEffect } from "react";
import { AnimatedCard } from "~~/components/animations/AnimatedCard";
import { FadeIn } from "~~/components/animations/FadeIn";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-6 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: "2s" }}></div>
      </div>

      <AnimatedCard className="max-w-lg w-full bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 md:p-12 border border-white/30 relative z-10">
        <FadeIn delay={200}>
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-white text-5xl mb-6 shadow-2xl animate-pulse-ring">
              ⚠️
            </div>
            <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">
              Something went wrong!
            </h2>
          </div>
        </FadeIn>

        <FadeIn delay={400}>
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 mb-6">
            <p className="text-gray-800 font-medium text-lg mb-2">
              {error.message || "An unexpected error occurred"}
            </p>
            {error.digest && (
              <p className="text-sm text-gray-600 mt-3 pt-3 border-t border-red-200">
                <span className="font-semibold">Error ID:</span> {error.digest}
              </p>
            )}
          </div>
        </FadeIn>

        <FadeIn delay={600}>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={reset}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            >
              🔄 Try Again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              className="px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-105"
            >
              🏠 Go Home
            </button>
          </div>
        </FadeIn>
      </AnimatedCard>
    </div>
  );
}



