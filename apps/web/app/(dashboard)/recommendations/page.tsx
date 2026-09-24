"use client";

import { useEffect, useState } from "react";
import { getRecommendations, type Recommendation } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownRight, Zap, RotateCcw, Layers, Trash2 } from "lucide-react";

const CATEGORY_CONFIG: Record<
  string,
  { icon: React.ElementType; label: string }
> = {
  "model-downgrade": { icon: ArrowDownRight, label: "Model Downgrade" },
  caching: { icon: Zap, label: "Prompt Caching" },
  routing: { icon: RotateCcw, label: "Model Routing" },
  unused: { icon: Trash2, label: "Unused Resource" },
};

const IMPACT_COLORS: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    getRecommendations().then((data) => {
      setRecs(data);
      setLoading(false);
    });
  }, []);

  const totalSavings = recs.reduce((s, r) => s + r.estimatedSavingsUsd, 0);
  const categories = [...new Set(recs.map((r) => r.category))];

  const filtered =
    categoryFilter === "all"
      ? recs
      : recs.filter((r) => r.category === categoryFilter);

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">
          Recommendations
        </h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border border-gray-200 rounded-lg p-5 animate-pulse"
            >
              <div className="h-4 bg-gray-100 rounded w-64" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">
        Recommendations
      </h1>

      {/* Savings summary */}
      {totalSavings > 0 && (
        <div className="border border-green-200 bg-green-50 rounded-lg px-5 py-4 mb-6">
          <p className="text-sm text-green-800 font-medium">
            Estimated monthly savings potential
          </p>
          <p className="text-2xl font-semibold text-green-700 mt-1">
            {formatCurrency(totalSavings)}/mo
          </p>
          <p className="text-xs text-green-600 mt-1">
            Based on {recs.length} optimization{recs.length > 1 ? "s" : ""}{" "}
            identified
          </p>
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setCategoryFilter("all")}
          className={`text-xs px-2.5 py-1 rounded transition-colors ${
            categoryFilter === "all"
              ? "bg-brand-50 text-brand-700 font-medium"
              : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
          }`}
        >
          All
        </button>
        {categories.map((c) => {
          const config = CATEGORY_CONFIG[c];
          return (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`text-xs px-2.5 py-1 rounded transition-colors ${
                categoryFilter === c
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {config?.label || c}
            </button>
          );
        })}
      </div>

      {/* Recommendation cards */}
      {filtered.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500">
            No recommendations in this category.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const catConfig = CATEGORY_CONFIG[r.category] || {
              icon: Layers,
              label: r.category,
            };
            const CatIcon = catConfig.icon;
            return (
              <div
                key={r.id}
                className="border border-gray-200 rounded-lg px-5 py-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <CatIcon
                      size={16}
                      className="text-gray-400 mt-0.5 flex-shrink-0"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {r.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {r.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-xs rounded px-1.5 py-0.5 ${
                            IMPACT_COLORS[r.impact]
                          }`}
                        >
                          {r.impact} impact
                        </span>
                        <span className="text-xs rounded px-1.5 py-0.5 bg-gray-100 text-gray-600">
                          {r.effort} effort
                        </span>
                        <span className="text-xs rounded px-1.5 py-0.5 bg-brand-50 text-brand-700">
                          {catConfig.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  {r.estimatedSavingsUsd > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-green-600">
                        {formatCurrency(r.estimatedSavingsUsd)}
                      </p>
                      <p className="text-xs text-gray-400">est. savings/mo</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
