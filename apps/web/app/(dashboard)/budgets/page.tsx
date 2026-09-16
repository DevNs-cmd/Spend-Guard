"use client";

import { useEffect, useState } from "react";
import { getBudgets, type Budget } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog, useConfirmDialog } from "@/components/ui/confirm-dialog";

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formScope, setFormScope] = useState<Budget["scope"]>("project");
  const [formSoft, setFormSoft] = useState("");
  const [formHard, setFormHard] = useState("");
  const { toast } = useToast();
  const { confirm, dialogProps, ConfirmDialog: ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    getBudgets().then((data) => {
      setBudgets(data);
      setLoading(false);
    });
  }, []);

  const openNew = () => {
    setEditId(null);
    setFormName("");
    setFormScope("project");
    setFormSoft("");
    setFormHard("");
    setShowDialog(true);
  };

  const openEdit = (b: Budget) => {
    setEditId(b.id);
    setFormName(b.name);
    setFormScope(b.scope);
    setFormSoft(b.softLimitUsd.toString());
    setFormHard(b.hardLimitUsd.toString());
    setShowDialog(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to POST/PUT /budgets (Gauri's endpoint)
    if (editId) {
      setBudgets(
        budgets.map((b) =>
          b.id === editId
            ? { ...b, name: formName, scope: formScope, softLimitUsd: Number(formSoft), hardLimitUsd: Number(formHard) }
            : b
        )
      );
      toast("Budget updated");
    } else {
      const newBudget: Budget = {
        id: `b-${Date.now()}`,
        name: formName,
        scope: formScope,
        scopeLabel: formName,
        softLimitUsd: Number(formSoft),
        hardLimitUsd: Number(formHard),
        currentSpendUsd: 0,
        period: "monthly",
      };
      setBudgets([...budgets, newBudget]);
      toast("Budget created");
    }
    setShowDialog(false);
  };

  const handleDelete = async (b: Budget) => {
    const confirmed = await confirm({
      title: "Delete budget",
      message: `Are you sure you want to delete "${b.name}"? This action cannot be undone.`,
      confirmLabel: "Delete",
    });
    if (confirmed) {
      setBudgets(budgets.filter((x) => x.id !== b.id));
      toast(`"${b.name}" deleted`, "info");
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Budgets</h1>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-40 mb-3" />
              <div className="h-2 bg-gray-100 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Budgets</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium rounded px-3 py-1.5 hover:bg-brand-700 transition-colors"
        >
          <Plus size={14} />
          New Budget
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500 mb-3">No budgets configured yet.</p>
          <button
            onClick={openNew}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Create your first budget →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => {
            const softPercent = Math.min(
              (b.currentSpendUsd / b.softLimitUsd) * 100,
              100
            );
            const hardPercent = Math.min(
              (b.currentSpendUsd / b.hardLimitUsd) * 100,
              100
            );
            const isOverSoft = b.currentSpendUsd >= b.softLimitUsd;
            const isOverHard = b.currentSpendUsd >= b.hardLimitUsd;

            return (
              <div
                key={b.id}
                className="border border-gray-200 rounded-lg px-5 py-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {b.name}
                      </span>
                      <span className="text-xs text-gray-400 border border-gray-200 rounded px-1.5 py-0.5">
                        {b.scope}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {b.scopeLabel} · {b.period}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(b)}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mb-2">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverHard
                          ? "bg-red-500"
                          : isOverSoft
                          ? "bg-amber-500"
                          : "bg-brand-500"
                      }`}
                      style={{ width: `${hardPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {formatCurrency(b.currentSpendUsd)} spent
                  </span>
                  <span>
                    Soft: {formatCurrency(b.softLimitUsd)} · Hard:{" "}
                    {formatCurrency(b.hardLimitUsd)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Budget dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setShowDialog(false)}
          />
          <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editId ? "Edit Budget" : "New Budget"}
            </h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label htmlFor="budget-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  id="budget-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Chatbot Monthly"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div>
                <label htmlFor="budget-scope" className="block text-sm font-medium text-gray-700 mb-1">
                  Scope
                </label>
                <select
                  id="budget-scope"
                  value={formScope}
                  onChange={(e) => setFormScope(e.target.value as Budget["scope"])}
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                >
                  <option value="organization">Organization</option>
                  <option value="project">Project</option>
                  <option value="team">Team</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="soft-limit" className="block text-sm font-medium text-gray-700 mb-1">
                    Soft limit ($)
                  </label>
                  <input
                    id="soft-limit"
                    type="number"
                    value={formSoft}
                    onChange={(e) => setFormSoft(e.target.value)}
                    required
                    min="0"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label htmlFor="hard-limit" className="block text-sm font-medium text-gray-700 mb-1">
                    Hard limit ($)
                  </label>
                  <input
                    id="hard-limit"
                    type="number"
                    value={formHard}
                    onChange={(e) => setFormHard(e.target.value)}
                    required
                    min="0"
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium rounded px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-brand-600 text-white text-sm font-medium rounded px-4 py-2 hover:bg-brand-700 transition-colors"
                >
                  {editId ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialogComponent {...dialogProps} />
    </div>
  );
}
