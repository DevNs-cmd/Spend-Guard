"use client";

import { useEffect, useState } from "react";
import { getMembers, getTags, type OrgMember, type Tag } from "@/lib/api-client";
import { formatDate } from "@/lib/utils";
import { Plus, Trash2, UserPlus, Bell, Building2, Users, Tags, Save } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

type SettingsTab = "general" | "members" | "tags" | "notifications";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  viewer: "Viewer",
};

export default function SettingsPage() {
  const [tab, setTab] = useState<SettingsTab>("general");
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  // General form
  const [orgName, setOrgName] = useState("Acme Inc.");
  const [timezone, setTimezone] = useState("UTC");

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrgMember["role"]>("member");
  const [showInvite, setShowInvite] = useState(false);

  // Tag form
  const [newTagKey, setNewTagKey] = useState("");
  const [newTagValue, setNewTagValue] = useState("");

  // Notifications form
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [alertEmail, setAlertEmail] = useState("admin@company.com");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [alertThreshold, setAlertThreshold] = useState<"all" | "warning_critical" | "critical_only">("warning_critical");
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  const { toast } = useToast();
  const { confirm, dialogProps, ConfirmDialog: ConfirmDialogComponent } = useConfirmDialog();

  useEffect(() => {
    Promise.all([getMembers(), getTags()]).then(([m, t]) => {
      setMembers(m);
      setTags(t);
      setLoading(false);
    });
  }, []);

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Organization settings saved");
  };

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to POST /organizations/:id/members (Neerav's endpoint)
    const newMember: OrgMember = {
      id: `m-${Date.now()}`,
      name: inviteEmail.split("@")[0],
      email: inviteEmail,
      role: inviteRole,
      joinedAt: new Date().toISOString(),
    };
    setMembers([...members, newMember]);
    setShowInvite(false);
    toast(`Invite sent to ${inviteEmail}`);
    setInviteEmail("");
  };

  const handleRemoveMember = async (id: string, name: string) => {
    const confirmed = await confirm({
      title: "Remove team member",
      message: `Are you sure you want to remove "${name}" from this organization? They will lose access to SpendGuard immediately.`,
      confirmLabel: "Remove member",
    });
    if (confirmed) {
      setMembers(members.filter((m) => m.id !== id));
      toast(`Removed ${name}`, "info");
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to POST /tags (Vedant's endpoint)
    const newTag: Tag = {
      id: `t-${Date.now()}`,
      key: newTagKey,
      value: newTagValue,
      usageCount: 0,
    };
    setTags([...tags, newTag]);
    toast(`Tag "${newTagKey}: ${newTagValue}" added`);
    setNewTagKey("");
    setNewTagValue("");
  };

  const handleRemoveTag = async (id: string, key: string, value: string) => {
    const confirmed = await confirm({
      title: "Delete tag",
      message: `Are you sure you want to delete tag "${key}: ${value}"? Records with this tag will retain it as legacy data.`,
      confirmLabel: "Delete tag",
    });
    if (confirmed) {
      setTags(tags.filter((t) => t.id !== id));
      toast(`Tag "${key}: ${value}" deleted`, "info");
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    toast("Notification settings saved");
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Settings</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 mb-6">
        {(
          [
            { key: "general", label: "General", icon: Building2 },
            { key: "members", label: "Members", icon: Users },
            { key: "tags", label: "Tags", icon: Tags },
            { key: "notifications", label: "Notifications", icon: Bell },
          ] as const
        ).map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 -mb-px transition-colors ${
                tab === t.key
                  ? "border-b-2 border-brand-500 text-brand-700 font-medium"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* General */}
      {tab === "general" && (
        <form onSubmit={handleSaveGeneral} className="max-w-lg space-y-4">
          <div>
            <label
              htmlFor="settings-org-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Organization name
            </label>
            <input
              id="settings-org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            />
          </div>
          <div>
            <label
              htmlFor="settings-timezone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Timezone
            </label>
            <select
              id="settings-timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time</option>
              <option value="America/Chicago">Central Time</option>
              <option value="America/Los_Angeles">Pacific Time</option>
              <option value="Europe/London">London</option>
              <option value="Asia/Kolkata">India (IST)</option>
            </select>
          </div>
          <button
            type="submit"
            className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium rounded px-4 py-2 hover:bg-brand-700 transition-colors"
          >
            <Save size={14} />
            Save Changes
          </button>
        </form>
      )}

      {/* Members */}
      {tab === "members" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">
              {members.length} member{members.length !== 1 ? "s" : ""}
            </p>
            <button
              onClick={() => setShowInvite(true)}
              className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium rounded px-3 py-1.5 hover:bg-brand-700 transition-colors"
            >
              <UserPlus size={14} />
              Invite Member
            </button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Name</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Email</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Role</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Joined</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-900">{m.name}</td>
                      <td className="px-4 py-2.5 text-gray-500">{m.email}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs rounded px-1.5 py-0.5 bg-gray-100 text-gray-600 capitalize">
                          {ROLE_LABELS[m.role] || m.role}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-gray-500">{formatDate(m.joinedAt)}</td>
                      <td className="px-4 py-2.5 text-right">
                        {m.role !== "owner" && (
                          <button
                            onClick={() => handleRemoveMember(m.id, m.name)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Remove member"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Invite dialog */}
          {showInvite && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/20" onClick={() => setShowInvite(false)} />
              <div className="relative bg-white border border-gray-200 rounded-lg shadow-lg w-full max-w-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Member</h2>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      id="invite-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@company.com"
                      required
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label htmlFor="invite-role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      id="invite-role"
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as OrgMember["role"])}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowInvite(false)}
                      className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium rounded px-4 py-2 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-brand-600 text-white text-sm font-medium rounded px-4 py-2 hover:bg-brand-700 transition-colors"
                    >
                      Send Invite
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tags */}
      {tab === "tags" && (
        <div>
          <form
            onSubmit={handleAddTag}
            className="flex items-end gap-3 mb-4"
          >
            <div>
              <label htmlFor="tag-key" className="block text-sm font-medium text-gray-700 mb-1">
                Key
              </label>
              <input
                id="tag-key"
                type="text"
                value={newTagKey}
                onChange={(e) => setNewTagKey(e.target.value)}
                placeholder="environment"
                required
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div>
              <label htmlFor="tag-value" className="block text-sm font-medium text-gray-700 mb-1">
                Value
              </label>
              <input
                id="tag-value"
                type="text"
                value={newTagValue}
                onChange={(e) => setNewTagValue(e.target.value)}
                placeholder="production"
                required
                className="border border-gray-300 rounded px-3 py-1.5 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium rounded px-3 py-1.5 hover:bg-brand-700 transition-colors"
            >
              <Plus size={14} />
              Add Tag
            </button>
          </form>

          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : tags.length === 0 ? (
            <div className="border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-sm text-gray-500">No tags defined yet.</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Key</th>
                    <th className="text-left px-4 py-2.5 font-medium text-gray-600">Value</th>
                    <th className="text-right px-4 py-2.5 font-medium text-gray-600">Usage Count</th>
                    <th className="px-4 py-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {tags.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-2.5 text-gray-900 font-mono text-xs">{t.key}</td>
                      <td className="px-4 py-2.5 text-gray-600 font-mono text-xs">{t.value}</td>
                      <td className="px-4 py-2.5 text-right text-gray-500 tabular-nums">
                        {t.usageCount.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          onClick={() => handleRemoveTag(t.id, t.key, t.value)}
                          className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete tag"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Notifications */}
      {tab === "notifications" && (
        <form onSubmit={handleSaveNotifications} className="max-w-lg space-y-6">
          {/* Email notifications */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Email Notifications</p>
                <p className="text-xs text-gray-500">Receive alert notifications via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
              </label>
            </div>
            {emailAlerts && (
              <div>
                <label htmlFor="alert-email" className="block text-xs font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  id="alert-email"
                  type="email"
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  placeholder="alerts@company.com"
                  className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                />
              </div>
            )}
          </div>

          {/* Slack Webhook */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Slack Notifications</p>
              <p className="text-xs text-gray-500">Post budget alerts to an incoming Slack webhook channel</p>
            </div>
            <div>
              <label htmlFor="slack-webhook" className="block text-xs font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <input
                id="slack-webhook"
                type="url"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">Leave blank if Slack alerts are not needed.</p>
            </div>
          </div>

          {/* Severity threshold */}
          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-900">Alert Severity Threshold</p>
              <p className="text-xs text-gray-500">Choose which alert levels trigger notifications</p>
            </div>
            <select
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(e.target.value as typeof alertThreshold)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
            >
              <option value="all">All Alerts (Info, Warning, and Critical)</option>
              <option value="warning_critical">Warning & Critical Only (Recommended)</option>
              <option value="critical_only">Critical Only (Budget Overages & Anomalies)</option>
            </select>
          </div>

          {/* Weekly summary */}
          <div className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Weekly Spend Summary</p>
              <p className="text-xs text-gray-500">Receive a weekly digest of spending trends and top models every Monday</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-600"></div>
            </label>
          </div>

          <button
            type="submit"
            className="flex items-center gap-1.5 bg-brand-600 text-white text-sm font-medium rounded px-4 py-2 hover:bg-brand-700 transition-colors"
          >
            <Save size={14} />
            Save Notification Settings
          </button>
        </form>
      )}

      {/* Confirm dialog */}
      <ConfirmDialogComponent {...dialogProps} />
    </div>
  );
}
