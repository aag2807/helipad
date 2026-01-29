"use client";

import { create } from "zustand";
import { SessionUser } from "@/lib/auth";

type AuthStore = {
  user: SessionUser | null;
  isLoading: boolean;
  setUser: (user: SessionUser | null) => void;
  setLoading: (loading: boolean) => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),
}));

/**
 * Sign in a user
 */
export async function signIn(username: string, password: string) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Login failed");
  }

  // Update the store with the user data
  useAuthStore.getState().setUser(data.user);

  return data.user;
}

/**
 * Sign out the current user
 */
export async function signOut() {
  await fetch("/api/auth/logout", {
    method: "POST",
  });

  useAuthStore.getState().setUser(null);
}

/**
 * Get the current session
 */
export async function getSession() {
  const response = await fetch("/api/auth/session");
  const data = await response.json();
  return data.user;
}

/**
 * Hook to get the current session
 */
export function useSession() {
  const { user, isLoading } = useAuthStore();

  return {
    data: user ? { user } : null,
    isLoading,
  };
}

/**
 * Initialize session from server
 */
export async function initializeSession() {
  const user = await getSession();
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setLoading(false);
}

