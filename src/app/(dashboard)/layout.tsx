import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ToastContainer } from "@/components/ui/toast";
import { ServiceWorkerRegistration } from "@/components/service-worker";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <Sidebar user={session.user} />
      </div>

      {/* Main content area */}
      <div className="lg:pl-64 pb-20 lg:pb-0">
        <Header user={session.user} />
        <main className="py-6 px-4 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileNav isAdmin={session.user.role === "admin"} />

      {/* Toast notifications */}
      <ToastContainer />

      {/* Service worker registration */}
      <ServiceWorkerRegistration />
    </div>
  );
}
