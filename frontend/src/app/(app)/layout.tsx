import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";

// Auth gating for /dashboard, /materials, ... is handled by middleware.ts
// (cookie presence check) plus per-request 401 handling on the API client.
// We intentionally do NOT call any DB-backed function here — the frontend
// service has no Prisma access in the split architecture.
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 px-4 lg:px-8 py-6 pb-24 lg:pb-8">{children}</main>
      </div>
    </div>
  );
}
