"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield } from "lucide-react";
import { setSession } from "@/lib/auth";
import { useToast } from "@/components/ui/toast";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // TODO: wire to POST /auth/login (Neerav's endpoint)
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Set session cookie
      setSession("user-1", "org-1");
      toast("Signed in successfully");

      // Redirect to original destination or dashboard
      const redirect = searchParams.get("redirect") || "/";
      router.push(redirect);
    } catch {
      setError("Invalid email or password. Please try again.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2 mb-4">
          {error}
        </div>
      )}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Password
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-brand-600 text-white text-sm font-medium rounded px-4 py-2 hover:bg-brand-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded bg-brand-600 text-white">
            <Shield size={18} />
          </div>
          <span className="text-xl font-semibold text-gray-900">SpendGuard</span>
        </div>

        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h1 className="text-lg font-semibold text-gray-900 mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-5">
            Enter your credentials to access the dashboard.
          </p>

          <Suspense fallback={<div className="h-32 bg-gray-100 rounded animate-pulse" />}>
            <LoginForm />
          </Suspense>

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-brand-600 hover:text-brand-700 font-medium">
                Sign up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
