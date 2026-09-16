"use client";

import { useEffect, useState } from "react";
import { getReports, type Report } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { Plus, FileText, Download, Pause, Play } from "lucide-react";
import { useToast } from "@/components/ui/toast";

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState<Report["type"]>("executive");
  const [formSchedule, setFormSchedule] = useState<Report["schedule"]>("weekly");
  const [formFormat, setFormFormat] = useState<Report["format"]>("pdf");
  const { toast } = useToast();

  useEffect(() => {
    getReports().then((data) => {
      setReports(data);
      setLoading(false);
    });
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to POST /reports (Gauri's endpoint)
    const newReport: Report = {
      id: `rp-${Date.now()}`,
      name: formName,
      type: formType,
      schedule: formSchedule,
      lastGeneratedAt: null,
      format: formFormat,
      status: "active",
    };
    setReports([...reports, newReport]);
    setShowDialog(false);
    setFormName("");
    toast(`Report "${formName}" created`);
  };

  const toggleStatus = (id: string) => {
    const report = reports.find((r) => r.id === id);
    const newStatus = report?.status === "active" ? "paused" : "active";
    setReports(
      reports.map((r) =>
        r.id === id
          ? { ...r, status: newStatus as Report["status"] }
          : r
      )
    );
    toast(`Report ${newStatus === "active" ? "resumed" : "paused"}`);
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-6">Reports</h1>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-48" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Reports</h1>
        <button
          onClick={() => setShowDialog(true)}
          className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium rounded px-3 py-1.5 hover:bg-brand-700 transition-colors"
        >
          <Plus size={14} />
          New Report
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-sm text-gray-500 mb-3">No reports configured yet.</p>
          <button
            onClick={() => setShowDialog(true)}
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            Create your first report →
          </button>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Name</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Type</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Schedule</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Format</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Last Generated</th>
                <th className="text-left px-4 py-2.5 font-medium text-gray-600">Status</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900 flex items-center gap-2">
                    <FileText size={14} className="text-gray-400" />
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{r.type}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{r.schedule}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs uppercase bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">
                      {r.format}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {r.lastGeneratedAt ? formatDateTime(r.lastGeneratedAt) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs rounded px-1.5 py-0.5 ${
                        r.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleStatus(r.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title={r.status === "active" ? "Pause" : "Resume"}
                      >
                        {r.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        title="Download latest"
                        onClick={() => toast("Download started", "info")}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create report dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/20" onClick={() => setShowDialog(false)} />
          <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">New Report</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label htmlFor="report-name" className="block text-sm font-medium text-gray-700 mb-1">
                  Report name
                </label>
                <input
                  id="report-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Monthly Finance Report"
                  required
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    id="report-type"
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as Report["type"])}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="executive">Executive</option>
                    <option value="finance">Finance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="report-schedule" className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule
                  </label>
                  <select
                    id="report-schedule"
                    value={formSchedule}
                    onChange={(e) => setFormSchedule(e.target.value as Report["schedule"])}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="one-time">One-time</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="report-format" className="block text-sm font-medium text-gray-700 mb-1">
                    Format
                  </label>
                  <select
                    id="report-format"
                    value={formFormat}
                    onChange={(e) => setFormFormat(e.target.value as Report["format"])}
                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                  >
                    <option value="pdf">PDF</option>
                    <option value="csv">CSV</option>
                    <option value="email">Email</option>
                  </select>
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
