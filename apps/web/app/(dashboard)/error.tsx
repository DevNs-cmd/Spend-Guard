"use client";

import { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="flex items-center justify-center py-24">
      <div className="text-center max-w-sm">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
          <AlertCircle size={24} className="text-red-600" />
        </div>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load this page
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          There was a problem loading this section. Your data is safe — try refreshing.
        </p>
        <div className="flex gap-2 justify-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm font-medium rounded px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            <Home size={14} />
            Dashboard
          </Link>
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium rounded px-4 py-2 hover:bg-brand-700 transition-colors"
          >
            <RotateCcw size={14} />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
