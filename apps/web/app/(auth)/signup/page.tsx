"use client";

import { useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [orgName, setOrgName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }
    setLoading(true);
    // TODO: wire to POST /organizations + POST /auth/register (Neerav's endpoints)
    setTimeout(() => {
      window.location.href = "/";
    }, 800);
  };

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
          <h1 className="text-lg font-semibold text-gray-900 mb-1">
            Create your account
          </h1>
          <p className="text-sm text-gray-500 mb-5">
            {step === 1
              ? "Set up your workspace to get started."
              : "Enter your personal details."}
          </p>

          {/* Step indicator */}
          <div className="flex gap-2 mb-5">
            <div
              className={`h-1 flex-1 rounded-full ${
                step >= 1 ? "bg-brand-500" : "bg-gray-200"
              }`}
            />
            <div
              className={`h-1 flex-1 rounded-full ${
                step >= 2 ? "bg-brand-500" : "bg-gray-200"
              }`}
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 ? (
              <div>
                <label
                  htmlFor="org-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Organization name
                </label>
                <input
                  id="org-name"
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Acme Inc."
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            ) : (
              <>
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Full name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Email
                  </label>
                  <input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label
                    htmlFor="signup-password"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Password
                  </label>
                  <input
                    id="signup-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={8}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white text-sm font-medium rounded px-4 py-2 hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating…" : step === 1 ? "Continue" : "Create account"}
            </button>
          </form>

          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Back
            </button>
          )}

          <div className="mt-4 text-center">
            <span className="text-sm text-gray-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-brand-600 hover:text-brand-700 font-medium"
              >
                Sign in
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
