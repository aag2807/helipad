"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Menu,
  X,
  LogOut,
  User,
  Plane,
  Calendar,
  ListOrdered,
  Users,
  ClipboardList,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/lib/constants";

interface HeaderProps {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    role: "admin" | "user";
  };
}

const navItems = {
  user: [
    { label: "Calendar", href: ROUTES.calendar, icon: Calendar },
    { label: "My Bookings", href: ROUTES.myBookings, icon: ListOrdered },
  ],
  admin: [
    { label: "Dashboard", href: ROUTES.adminDashboard, icon: LayoutDashboard },
    { label: "Users", href: ROUTES.adminUsers, icon: Users },
    { label: "All Bookings", href: ROUTES.adminBookings, icon: ClipboardList },
    { label: "Settings", href: ROUTES.adminSettings, icon: Settings },
  ],
};

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-zinc-200">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
          {/* Mobile menu button */}
          <button
            type="button"
            className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white flex items-center justify-center">
              <Plane className="w-4 h-4" />
            </div>
            <span className="font-bold text-zinc-900">Helipad</span>
          </div>

          {/* Desktop spacer */}
          <div className="hidden lg:block" />

          {/* Profile dropdown */}
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-zinc-100 transition-colors"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-500 flex items-center justify-center text-white text-sm font-semibold">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
            </button>

            {/* Dropdown */}
            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 py-2 z-20 animate-fade-in">
                  <div className="px-4 py-2 border-b border-zinc-100">
                    <p className="text-sm font-medium text-zinc-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-zinc-500 capitalize">{user.role}</p>
                  </div>
                  <Link
                    href="/profile"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button
                    type="button"
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-zinc-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu panel */}
          <div className="fixed inset-y-0 left-0 w-full max-w-xs bg-white animate-slide-in-right">
            <div className="flex items-center justify-between h-16 px-4 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-600 text-white flex items-center justify-center">
                  <Plane className="w-4 h-4" />
                </div>
                <span className="font-bold text-zinc-900">Helipad</span>
              </div>
              <button
                type="button"
                className="p-2 -mr-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="px-4 py-6 space-y-6">
              <div>
                <h3 className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Bookings
                </h3>
                <ul className="space-y-1">
                  {navItems.user.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname.startsWith(item.href);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                            isActive
                              ? "bg-violet-50 text-violet-700"
                              : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                          )}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Icon className="w-5 h-5" />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {user.role === "admin" && (
                <div>
                  <h3 className="px-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Administration
                  </h3>
                  <ul className="space-y-1">
                    {navItems.admin.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                              isActive
                                ? "bg-violet-50 text-violet-700"
                                : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                            )}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            <Icon className="w-5 h-5" />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

