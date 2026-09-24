import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "border border-gray-200 rounded-lg p-5 bg-white",
        className
      )}
    >
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 tracking-tight">
        {value}
      </p>
      {change && (
        <p
          className={cn(
            "text-xs mt-1",
            changeType === "positive" && "text-green-600",
            changeType === "negative" && "text-red-600",
            changeType === "neutral" && "text-gray-500"
          )}
        >
          {change} vs last period
        </p>
      )}
    </div>
  );
}
