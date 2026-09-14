"use client";

import { useEffect, useState } from "react";
import { getPlans, getCurrentPlan, type BillingPlan, type CurrentPlan } from "@/lib/api-client";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Check, ExternalLink } from "lucide-react";

export default function BillingPage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [current, setCurrent] = useState<CurrentPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getPlans(), getCurrentPlan()]).then(([p, c]) => {
      setPlans(p);
      setCurrent(c);
      setLoading(false);
    });
  }, []);

  if (loading || !current) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Billing</h1>
        <div className="animate-pulse space-y-4">
          <div className="border border-gray-200 rounded-lg p-5">
            <div className="h-4 bg-gray-100 rounded w-32 mb-3" />
            <div className="h-6 bg-gray-100 rounded w-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Billing</h1>

      {/* Current plan */}
      <div className="border border-gray-200 rounded-lg px-5 py-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Current plan</p>
            <p className="text-lg font-semibold text-gray-900">
              {current.planName}
            </p>
          </div>
          <button className="flex items-center gap-1.5 border border-gray-300 text-gray-700 text-sm rounded px-3 py-1.5 hover:bg-gray-50 transition-colors">
            <ExternalLink size={14} />
            Manage in Stripe
          </button>
        </div>

        {/* Usage meters */}
        <div className="grid grid-cols-3 gap-4">
          {(
            [
              { label: "Providers", ...current.usage.providers },
              { label: "Projects", ...current.usage.projects },
              { label: "Team Seats", ...current.usage.seats },
            ] as const
          ).map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{m.label}</span>
                <span>
                  {m.used} / {m.limit}
                </span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    m.used / m.limit >= 0.9
                      ? "bg-amber-500"
                      : "bg-brand-500"
                  }`}
                  style={{
                    width: `${Math.min((m.used / m.limit) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Current period ends {formatDate(current.currentPeriodEnd)}
        </p>
      </div>

      {/* Plan cards */}
      <h2 className="text-sm font-medium text-gray-900 mb-3">Available Plans</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {plans.map((plan) => {
          const isCurrent = plan.id === current.planId;
          return (
            <div
              key={plan.id}
              className={`border rounded-lg p-5 ${
                isCurrent
                  ? "border-brand-500 bg-brand-50"
                  : "border-gray-200"
              }`}
            >
              <p className="text-sm font-semibold text-gray-900 mb-1">
                {plan.name}
              </p>
              <p className="text-2xl font-semibold text-gray-900 mb-4">
                {plan.priceMonthly === -1 ? (
                  "Custom"
                ) : (
                  <>
                    ${plan.priceMonthly}
                    <span className="text-sm font-normal text-gray-500">
                      /mo
                    </span>
                  </>
                )}
              </p>

              <div className="space-y-2 mb-4">
                <p className="text-xs text-gray-500">
                  {plan.limits.providers === -1
                    ? "Unlimited providers"
                    : `${plan.limits.providers} providers`}
                </p>
                <p className="text-xs text-gray-500">
                  {plan.limits.projects === -1
                    ? "Unlimited projects"
                    : `${plan.limits.projects} projects`}
                </p>
                <p className="text-xs text-gray-500">
                  {plan.limits.seats === -1
                    ? "Unlimited seats"
                    : `${plan.limits.seats} team seats`}
                </p>
                <p className="text-xs text-gray-500">
                  {plan.limits.retentionDays === -1
                    ? "Custom retention"
                    : `${plan.limits.retentionDays}-day data retention`}
                </p>
              </div>

              <div className="space-y-1.5 mb-4">
                {plan.features.map((f) => (
                  <p key={f} className="text-xs text-gray-600 flex items-center gap-1.5">
                    <Check size={12} className="text-green-600 flex-shrink-0" />
                    {f}
                  </p>
                ))}
              </div>

              <button
                disabled={isCurrent}
                className={`w-full text-sm font-medium rounded px-4 py-2 transition-colors ${
                  isCurrent
                    ? "bg-brand-100 text-brand-700 cursor-default"
                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {isCurrent ? "Current Plan" : plan.priceMonthly === -1 ? "Contact Sales" : "Upgrade"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
