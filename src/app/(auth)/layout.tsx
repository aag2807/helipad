export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware handles auth redirects now
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-sky-50">
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
