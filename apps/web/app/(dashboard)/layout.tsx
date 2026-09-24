// Dashboard shell: sidebar + content area. Owner: Anuj.
import { Sidebar } from "@/components/dashboard/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-white">
      <Sidebar />
      <main className="flex-1 min-w-0 h-full overflow-y-auto">
        <div className="max-w-[1200px] mx-auto px-6 pt-6 pb-28">{children}</div>
      </main>
    </div>
  );
}
