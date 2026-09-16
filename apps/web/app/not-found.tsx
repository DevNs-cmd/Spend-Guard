import Link from "next/link";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-sm">
        <p className="text-5xl font-bold text-gray-200 mb-4">404</p>
        <h1 className="text-lg font-semibold text-gray-900 mb-2">
          Page not found
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium rounded px-4 py-2 hover:bg-brand-700 transition-colors"
        >
          <Home size={14} />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
