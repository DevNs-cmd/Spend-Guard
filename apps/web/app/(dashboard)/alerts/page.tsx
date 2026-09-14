"use client";

import { useEffect, useState } from "react";
import { getAlerts, type Alert } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { AlertTriangle, AlertCircle, Info, Check } from "lucide-react";

const SEVERITY_CONFIG: Record<string, { icon: React.ElementType; bg: string; border: string; text: string; badge: string }> = {
  critical: {
    icon: AlertTriangle,
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-800",
    badge: "bg-red-100 text-red-700",
  },
  warning: {
    icon: AlertCircle,
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-800",
    badge: "bg-amber-100 text-amber-700",
  },
  info: {
    icon: Info,
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    badge: "bg-blue-100 text-blue-700",
  },
};

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unresolved">("all");

  useEffect(() => {
    getAlerts().then((data) => {
      setAlerts(data);
      setLoading(false);
    });
  }, []);

  const handleAcknowledge = (id: string) => {
    setAlerts(
      alerts.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
  };

  const filtered =
    filter === "unresolved"
      ? alerts.filter((a) => !a.acknowledged)
      : alerts;

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Alerts</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const unresolvedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold text-gray-900">Alerts</h1>
          {unresolvedCount > 0 && (
            <span className="text-xs bg-red-100 text-red-700 font-medium rounded-full px-2 py-0.5">
              {unresolvedCount} unresolved
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {(["all", "unresolved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`text-xs px-2.5 py-1 rounded capitalize transition-colors ${
                filter === f
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">
            {filter === "unresolved"
              ? "No unresolved alerts. All clear."
              : "No alerts yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((a) => {
            const config = SEVERITY_CONFIG[a.severity] || SEVERITY_CONFIG.info;
            const Icon = config.icon;
            return (
              <div
                key={a.id}
                className={`border rounded-lg px-4 py-3 flex items-start gap-3 ${
                  a.acknowledged
                    ? "border-gray-200 bg-white"
                    : `${config.border} ${config.bg}`
                }`}
              >
                <Icon
                  size={16}
                  className={`mt-0.5 flex-shrink-0 ${
                    a.acknowledged ? "text-gray-400" : config.text
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className={`text-sm font-medium ${
                        a.acknowledged ? "text-gray-600" : "text-gray-900"
                      }`}
                    >
                      {a.title}
                    </span>
                    <span
                      className={`text-xs rounded px-1.5 py-0.5 capitalize ${
                        a.acknowledged
                          ? "bg-gray-100 text-gray-500"
                          : config.badge
                      }`}
                    >
                      {a.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{a.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDateTime(a.firedAt)}
                  </p>
                </div>
                {!a.acknowledged && (
                  <button
                    onClick={() => handleAcknowledge(a.id)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 border border-gray-300 rounded px-2 py-1 transition-colors flex-shrink-0"
                  >
                    <Check size={12} />
                    Acknowledge
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
