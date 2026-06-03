import { Sidebar } from "@/components/Sidebar";
import { MobileTopbar } from "@/components/MobileTopbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Sidebar />
      <MobileTopbar />
      <main className="min-h-screen px-4 py-6 lg:ml-72 lg:px-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </>
  );
}
