"use client";

import { useEffect, useState } from "react";
import { getReports, type Report } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { Plus, FileText, Download, Pause, Play, Printer, X, CheckCircle2, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { getCurrentOrgId } from "@/lib/auth";
import { getTenantData, type TenantData } from "@/lib/tenant-store";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [previewReport, setPreviewReport] = useState<Report | null>(null);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<Report["type"]>("executive");
  const [formSchedule, setFormSchedule] = useState<Report["schedule"]>("weekly");
  const [formFormat, setFormFormat] = useState<Report["format"]>("csv");
  const { toast } = useToast();

  const orgId = typeof window !== "undefined" ? getCurrentOrgId() : "org-demo";

  useEffect(() => {
    const storageKey = `spendguard_reports_${orgId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setReports(JSON.parse(saved));
        setLoading(false);
        return;
      } catch (e) {
        // Fallback to default
      }
    }

    getReports().then((data) => {
      // If reports array is empty because tenant spend is 0, give them default template reports
      if (!data || data.length === 0) {
        const defaultTemplates: Report[] = [
          { id: "rp1", name: "Weekly Executive Summary", type: "executive", schedule: "weekly", lastGeneratedAt: null, format: "pdf", status: "active" },
          { id: "rp2", name: "Monthly Finance Reconciliation", type: "finance", schedule: "monthly", lastGeneratedAt: null, format: "csv", status: "active" },
          { id: "rp3", name: "Cost & Token Usage Audit", type: "custom", schedule: "one-time", lastGeneratedAt: null, format: "csv", status: "active" },
        ];
        setReports(defaultTemplates);
        localStorage.setItem(storageKey, JSON.stringify(defaultTemplates));
      } else {
        setReports(data);
        localStorage.setItem(storageKey, JSON.stringify(data));
      }
      setLoading(false);
    });
  }, [orgId]);

  const saveReportsState = (updated: Report[]) => {
    setReports(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem(`spendguard_reports_${orgId}`, JSON.stringify(updated));
    }
  };

  const generateCsvData = (r: { name: string; type: string; schedule: string }, tenant: TenantData) => {
    const timestampStr = new Date().toLocaleString();
    const lines = [
      `"SpendGuard Report: ${r.name}"`,
      `"Organization: ${tenant.orgName}"`,
      `"Generated: ${timestampStr}"`,
      `"Report Type: ${r.type.toUpperCase()}"`,
      `"Schedule: ${r.schedule}"`,
      "",
      `"EXECUTIVE SUMMARY METRICS"`,
      `"Metric","Value"`,
      `"Total Spend (USD)","${tenant.summary.totalSpendUsd.toFixed(2)}"`,
      `"Total Requests","${tenant.summary.totalRequests}"`,
      `"Total Tokens","${tenant.summary.totalTokens}"`,
      `"Avg Cost Per Request","${tenant.summary.avgCostPerRequestUsd.toFixed(4)}"`,
      "",
      `"MODEL BREAKDOWN"`,
      `"Model","Provider","Cost (USD)","Requests","Tokens","Share %"`,
      ...(tenant.models.length > 0
        ? tenant.models.map(m => `"${m.model}","${m.provider}","${m.costUsd.toFixed(2)}","${m.requests}","${m.tokens}","${m.percentage}%"`)
        : [`"No model usage data recorded yet","","0","0","0","0%"`]
      ),
      "",
      `"ACTIVE BUDGETS"`,
      `"Budget Name","Scope","Current Spend","Soft Limit","Hard Limit"`,
      ...(tenant.budgets.length > 0
        ? tenant.budgets.map(b => `"${b.name}","${b.scope}","$${b.currentSpendUsd.toFixed(2)}","$${b.softLimitUsd.toFixed(2)}","$${b.hardLimitUsd.toFixed(2)}"`)
        : [`"No active budgets configured","","0","0","0"`]
      ),
      "",
      `"USAGE & TELEMETRY LOGS"`,
      `"Timestamp","Provider","Model","Input Tokens","Output Tokens","Total Tokens","Cost (USD)","Project","User"`,
      ...(tenant.usageRecords.length > 0
        ? tenant.usageRecords.map(u => 
            `"${u.timestamp}","${u.provider}","${u.model}","${u.inputTokens}","${u.outputTokens}","${u.inputTokens + u.outputTokens}","${u.costUsd.toFixed(4)}","${u.project}","${u.user}"`
          )
        : [`"No usage telemetry recorded yet","","","0","0","0","0.0000","",""`]
      ),
    ];
    return lines.join("\n");
  };

  const triggerCsvDownload = (name: string, csvContent: string) => {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const dateStr = new Date().toISOString().split("T")[0];
    const safeName = name.toLowerCase().replace(/[^a-z0-9]/g, "_");
    link.href = url;
    link.setAttribute("download", `${safeName}_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadCsv = (r: Report) => {
    const tenant = getTenantData(orgId);
    const csvContent = generateCsvData(r, tenant);
    triggerCsvDownload(r.name, csvContent);

    // Update lastGeneratedAt
    const nowIso = new Date().toISOString();
    const updated = reports.map(rep => rep.id === r.id ? { ...rep, lastGeneratedAt: nowIso } : rep);
    saveReportsState(updated);
    toast(`Report "${r.name}" downloaded as CSV!`);
  };

  const handleExportAll = () => {
    const tenant = getTenantData(orgId);
    const csvContent = generateCsvData({ name: "Complete_Data_Export", type: "all", schedule: "on-demand" }, tenant);
    triggerCsvDownload(`SpendGuard_${tenant.orgName}_Full_Export`, csvContent);
    toast(`Exported complete telemetry data successfully!`);
  };

  const handleOpenPdfPreview = (r: Report) => {
    // Update lastGeneratedAt
    const nowIso = new Date().toISOString();
    const updated = reports.map(rep => rep.id === r.id ? { ...rep, lastGeneratedAt: nowIso } : rep);
    saveReportsState(updated);
    setPreviewReport(r);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newReport: Report = {
      id: `rp-${Date.now()}`,
      name: formName,
      type: formType,
      schedule: formSchedule,
      lastGeneratedAt: null,
      format: formFormat,
      status: "active",
    };
    saveReportsState([...reports, newReport]);
    setShowDialog(false);
    setFormName("");
    toast(`Report "${formName}" created`);
  };

  const toggleStatus = (id: string) => {
    const report = reports.find((r) => r.id === id);
    const newStatus = report?.status === "active" ? "paused" : "active";
    const updated = reports.map((r) =>
      r.id === id ? { ...r, status: newStatus as Report["status"] } : r
    );
    saveReportsState(updated);
    toast(`Report ${newStatus === "active" ? "resumed" : "paused"}`);
  };

  const activeTenant = getTenantData(orgId);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Reports</h1>
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Reports & Analytics Exports</h1>
          <p className="text-xs text-gray-500 mt-0.5">Generate, schedule, and download AI cost breakdowns and finance reconciliation reports.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportAll}
            id="export-all-data-btn"
            className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-gray-50 transition-colors shadow-sm"
            title="Download full organization telemetry as CSV"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            Export All (CSV)
          </button>
          <button
            onClick={() => setShowDialog(true)}
            id="new-report-btn"
            className="flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-md px-3 py-1.5 hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Plus size={14} />
            New Report
          </button>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="border border-gray-200 rounded-xl p-12 text-center bg-gray-50/50">
          <FileText size={36} className="mx-auto text-gray-400 mb-3" />
          <p className="text-sm font-semibold text-gray-800 mb-1">No reports configured yet.</p>
          <p className="text-xs text-gray-500 mb-4">Set up recurring executive, finance, or custom cost reports.</p>
          <button
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-medium rounded-lg px-4 py-2 hover:bg-zinc-800 transition-colors shadow-sm"
          >
            <Plus size={13} />
            Create Report
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/80">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">Report Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">Schedule</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">Format</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">Last Generated</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600 text-xs uppercase tracking-wider">Status</th>
                <th className="px-4 py-2.5 text-right font-medium text-gray-600 text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50/80 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                    <FileText size={15} className="text-zinc-500 flex-shrink-0" />
                    <span>{r.name}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize text-xs">{r.type}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize text-xs">{r.schedule}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-mono uppercase rounded px-1.5 py-0.5 border ${
                      r.format === "pdf" 
                        ? "bg-rose-50 text-rose-700 border-rose-200" 
                        : "bg-emerald-50 text-emerald-700 border-emerald-200"
                    }`}>
                      {r.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {r.lastGeneratedAt ? formatDateTime(r.lastGeneratedAt) : <span className="text-gray-400 italic">Not yet generated</span>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        r.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-gray-100 text-gray-600 border border-gray-200"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {r.format === "pdf" ? (
                        <>
                          <button
                            onClick={() => handleOpenPdfPreview(r)}
                            id={`view-pdf-${r.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 border border-gray-300 rounded px-2.5 py-1 transition-colors shadow-sm"
                            title="Open Print/PDF preview"
                          >
                            <Printer size={13} className="text-rose-600" />
                            <span>PDF / Print</span>
                          </button>
                          <button
                            onClick={() => handleDownloadCsv(r)}
                            id={`download-csv-${r.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-gray-200 rounded px-2 py-1 transition-colors"
                            title="Download dataset as CSV"
                          >
                            <Download size={12} />
                            <span>CSV</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleDownloadCsv(r)}
                          id={`download-btn-${r.id}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-900 bg-white hover:bg-zinc-100 border border-gray-300 rounded px-2.5 py-1 transition-colors shadow-sm"
                          title="Download CSV report"
                        >
                          <Download size={13} className="text-emerald-600" />
                          <span>Download</span>
                        </button>
                      )}

                      <button
                        onClick={() => toggleStatus(r.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors ml-1"
                        title={r.status === "active" ? "Pause schedule" : "Resume schedule"}
                      >
                        {r.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Executive Report Preview & PDF Print Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative bg-white border border-gray-200 rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden">
            {/* Modal Controls Header (hidden during native print) */}
            <div className="no-print flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/80">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-zinc-800" />
                <h2 className="text-sm font-bold text-gray-900">Executive Report View: {previewReport.name}</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    window.print();
                    toast("Print dialog opened. Select 'Save as PDF' to export.");
                  }}
                  id="modal-print-pdf-btn"
                  className="inline-flex items-center gap-1.5 bg-zinc-900 text-white text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  <Printer size={14} />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => handleDownloadCsv(previewReport)}
                  id="modal-download-csv-btn"
                  className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-semibold rounded-lg px-3 py-1.5 hover:bg-gray-50 transition-colors shadow-sm"
                >
                  <Download size={14} />
                  Download CSV
                </button>
                <button
                  onClick={() => setPreviewReport(null)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-200 transition-colors ml-2"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Printable Report Document Body */}
            <div className="p-8 space-y-6 text-gray-900 max-h-[75vh] overflow-y-auto" id="printable-report-area">
              <div className="flex justify-between items-start border-b-2 border-gray-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-2xl tracking-tight text-zinc-900">SpendGuard</span>
                    <span className="bg-zinc-100 text-zinc-700 text-[10px] font-mono px-2 py-0.5 rounded border border-zinc-200">
                      FINANCE AUDIT
                    </span>
                  </div>
                  <h1 className="text-lg font-bold text-gray-800 mt-2">{previewReport.name}</h1>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Organization: <strong>{activeTenant.orgName}</strong> • Generated: {new Date().toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 inline-flex items-center gap-1">
                    <CheckCircle2 size={12} /> Verified Telemetry
                  </span>
                  <p className="text-[11px] text-gray-400 mt-1">Schedule: {previewReport.schedule.toUpperCase()}</p>
                </div>
              </div>

              {/* KPI Summary Tiles */}
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Executive Overview</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <div className="text-[11px] font-medium text-gray-500 uppercase">Total AI Spend</div>
                    <div className="text-xl font-extrabold text-zinc-900 mt-1">${activeTenant.summary.totalSpendUsd.toFixed(2)}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <div className="text-[11px] font-medium text-gray-500 uppercase">Total API Calls</div>
                    <div className="text-xl font-extrabold text-zinc-900 mt-1">{activeTenant.summary.totalRequests.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <div className="text-[11px] font-medium text-gray-500 uppercase">Total Tokens</div>
                    <div className="text-xl font-extrabold text-zinc-900 mt-1">{(activeTenant.summary.totalTokens / 1000000).toFixed(2)}M</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                    <div className="text-[11px] font-medium text-gray-500 uppercase">Avg Cost / Req</div>
                    <div className="text-xl font-extrabold text-zinc-900 mt-1">${activeTenant.summary.avgCostPerRequestUsd.toFixed(4)}</div>
                  </div>
                </div>
              </div>

              {/* Model Breakdown */}
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Model Cost Distribution</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 text-left">
                        <th className="p-2.5">Model</th>
                        <th className="p-2.5">Provider</th>
                        <th className="p-2.5">Total Cost</th>
                        <th className="p-2.5">Requests</th>
                        <th className="p-2.5">Tokens</th>
                        <th className="p-2.5">Spend Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTenant.models.map((m, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="p-2.5 font-bold text-gray-900">{m.model}</td>
                          <td className="p-2.5 text-gray-600 capitalize">{m.provider}</td>
                          <td className="p-2.5 font-semibold text-gray-900">${m.costUsd.toFixed(2)}</td>
                          <td className="p-2.5 text-gray-600">{m.requests.toLocaleString()}</td>
                          <td className="p-2.5 text-gray-600">{(m.tokens / 1000000).toFixed(2)}M</td>
                          <td className="p-2.5 text-gray-700 font-medium">{m.percentage}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Active Budgets & Safety Limits */}
              <div>
                <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider mb-2">Active Budget & Guardrail Limits</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-gray-700 font-semibold border-b border-gray-200 text-left">
                        <th className="p-2.5">Budget Scope</th>
                        <th className="p-2.5">Current Spend</th>
                        <th className="p-2.5">Soft Alert Threshold</th>
                        <th className="p-2.5">Hard Limit Threshold</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTenant.budgets.map((b, idx) => (
                        <tr key={idx} className="border-b border-gray-100">
                          <td className="p-2.5 font-medium text-gray-900">{b.name} ({b.scope})</td>
                          <td className="p-2.5 font-bold text-gray-900">${b.currentSpendUsd.toFixed(2)}</td>
                          <td className="p-2.5 text-amber-700 font-medium">${b.softLimitUsd.toFixed(2)}</td>
                          <td className="p-2.5 text-rose-700 font-medium">${b.hardLimitUsd.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4 text-center text-[11px] text-gray-400">
                SpendGuard AI Governance Platform • Confidential Report for {activeTenant.orgName}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create report dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDialog(false)} />
          <div className="relative bg-white border border-gray-200 rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-base font-bold text-gray-900 mb-1">Create New Report</h2>
            <p className="text-xs text-gray-500 mb-4">Set up a recurring or one-time cost report.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="report-name" className="block text-xs font-medium text-gray-700 mb-1">
                  Report name
                </label>
                <input
                  id="report-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Weekly Executive Cost Summary"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-800"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="report-type" className="block text-xs font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    id="report-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as Report["type"])}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  >
                    <option value="executive">Executive</option>
                    <option value="finance">Finance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="report-schedule" className="block text-xs font-medium text-gray-700 mb-1">
                    Schedule
                  </label>
                  <select
                    id="report-schedule"
                    value={formSchedule}
                    onChange={(e) => setFormSchedule(e.target.value as Report["schedule"])}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="report-format" className="block text-xs font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    id="report-format"
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value as Report["format"])}
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  >
                    <option value="csv">CSV</option>
                    <option value="pdf">PDF (Print)</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="flex-1 border border-gray-300 text-gray-700 text-xs font-medium rounded-lg px-4 py-2 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-zinc-900 text-white text-xs font-semibold rounded-lg px-4 py-2 hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Create Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
