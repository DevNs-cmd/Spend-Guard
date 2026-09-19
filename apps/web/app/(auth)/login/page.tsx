"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, UserCheck, Eye } from "lucide-react";
import { setSession } from "@/lib/auth";
import { DEMO_ORG_ID, getTenantData } from "@/lib/tenant-store";
import { useToast } from "@/components/ui/toast";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleLogin = (userEmail: string, role: "owner" | "viewer" = "owner") => {
    setLoading(true);
    setError("");

    setTimeout(() => {
      let targetOrgId = DEMO_ORG_ID;
      let targetOrgName = "Acme Inc.";
      let targetName = "Anuj Shukla";
      let targetRole = role;

      if (userEmail.toLowerCase() === "viewer@company.com") {
        targetOrgId = DEMO_ORG_ID;
        targetOrgName = "Acme Inc.";
        targetName = "Viewer User";
        targetRole = "viewer";
      } else if (userEmail.toLowerCase() === "anuj@company.com") {
        targetOrgId = DEMO_ORG_ID;
        targetOrgName = "Acme Inc.";
        targetName = "Anuj Shukla";
        targetRole = "owner";
      } else {
        // Search localStorage for any tenant created with this email
        if (typeof window !== "undefined") {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith("sg_tenant_")) {
              try {
                const tenant = JSON.parse(localStorage.getItem(key) || "{}");
                const foundMember = tenant.members?.find((m: any) => m.email?.toLowerCase() === userEmail.toLowerCase());
                if (foundMember) {
                  targetOrgId = tenant.orgId;
                  targetOrgName = tenant.orgName;
                  targetName = foundMember.name;
                  targetRole = foundMember.role || "member";
                  break;
                }
              } catch {
                // ignore
              }
            }
          }
        }
      }

      setSession(`user-${Date.now()}`, targetOrgId, targetOrgName, userEmail, targetName, targetRole);
      toast(`Signed in as ${targetName} (${targetRole.toUpperCase()})`);

      const redirect = searchParams.get("redirect") || "/";
      window.location.href = redirect;
    }, 300);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email");
      return;
    }
    handleLogin(email, "owner");
  };

  return (
    <div className="space-y-4">
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

      {/* Quick Role Presets for Easy Testing */}
      <div className="pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 mb-2 font-medium">Quick sign-in presets:</p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleLogin("anuj@company.com", "owner")}
            className="flex items-center justify-center gap-1.5 border border-gray-200 bg-gray-50 text-gray-700 text-xs py-1.5 px-2 rounded hover:bg-gray-100 transition-colors"
          >
            <UserCheck size={13} className="text-emerald-600" />
            <span>Owner (Full)</span>
          </button>
          <button
            type="button"
            onClick={() => handleLogin("viewer@company.com", "viewer")}
            className="flex items-center justify-center gap-1.5 border border-gray-200 bg-gray-50 text-gray-700 text-xs py-1.5 px-2 rounded hover:bg-gray-100 transition-colors"
          >
            <Eye size={13} className="text-blue-600" />
            <span>Viewer (Read-only)</span>
          </button>
        </div>
      </div>
    </div>
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
