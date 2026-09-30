import { Sidebar } from "@/components/sidebar";
import { MobileNav } from "@/components/mobile-nav";
import { TopNav } from "@/components/top-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <TopNav />
        <main className="p-4 md:p-6 lg:p-8 pb-20 lg:pb-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
