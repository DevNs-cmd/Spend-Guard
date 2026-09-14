"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Plug,
  BarChart3,
  Wallet,
  Bell,
  TrendingUp,
  Lightbulb,
  FileText,
  CreditCard,
  Settings,
  ChevronLeft,
  Shield,
} from "lucide-react";
import { useState } from "react";

const NAV_ITEMS = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/providers", label: "Providers", icon: Plug },
  { href: "/usage", label: "Usage & Costs", icon: BarChart3 },
  { href: "/budgets", label: "Budgets", icon: Wallet },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/recommendations", label: "Recommendations", icon: Lightbulb },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-gray-200 bg-white h-full shrink-0 transition-all duration-200 z-20",
        collapsed ? "w-16" : "w-56"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 h-14 border-b border-gray-200">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-zinc-900 text-white flex-shrink-0">
          <Shield size={15} />
        </div>
        {!collapsed && (
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-sm tracking-tight text-zinc-900">
              SpendGuard
            </span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
              B2B
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors",
                isActive
                  ? "bg-zinc-100 text-zinc-950 font-semibold"
                  : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-50"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={16} className={cn("flex-shrink-0", isActive ? "text-zinc-900" : "text-zinc-500")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 border-t border-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          size={16}
          className={cn(
            "transition-transform duration-200",
            collapsed && "rotate-180"
          )}
        />
      </button>
    </aside>
  );
}
