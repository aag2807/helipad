"use client";

import { useEffect } from "react";
import { initializeSession, useAuthStore } from "@/lib/auth-client";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initializeSession();
  }, []);

  return <>{children}</>;
}
