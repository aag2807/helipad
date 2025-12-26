import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Only redirect if there's a valid session
  if (session?.user) {
    redirect("/bookings/calendar");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-sky-50">
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
