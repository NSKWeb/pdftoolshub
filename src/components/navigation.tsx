"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

type User = { id: string; email: string; planType: string } | null;

export function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  return (
    <nav className="flex items-center gap-4 lg:gap-6 text-sm">
      <Link className="hover:text-white transition hidden sm:block" href="/">
        Tools
      </Link>
      <Link className="hover:text-white transition hidden sm:block" href="/dashboard">
        Dashboard
      </Link>

      {user ? (
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 transition"
          >
            <span className="w-6 h-6 rounded-full bg-accent/20 text-accent flex items-center justify-center text-xs font-medium">
              {user.email[0].toUpperCase()}
            </span>
            <span className="hidden lg:inline truncate max-w-[120px]">{user.email}</span>
            <svg
              className={`w-4 h-4 transition-transform ${userMenuOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-panel border border-slate-700 rounded-lg shadow-lg py-1 z-20">
                <div className="px-3 py-2 border-b border-slate-700">
                  <p className="text-xs text-slate-400">Signed in as</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-accent mt-1">{user.planType} plan</p>
                </div>
                <Link
                  href="/dashboard"
                  className="block px-3 py-2 text-sm hover:bg-slate-700 transition"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition"
                >
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        !loading && (
          <Link
            className="px-4 py-1.5 rounded-md bg-accent text-slate-900 font-medium hover:opacity-90 transition"
            href="/auth/login"
          >
            Sign In
          </Link>
        )
      )}

      <button
        className="lg:hidden p-2"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {mobileMenuOpen && (
        <div className="fixed top-[73px] left-0 right-0 bg-panel border-b border-slate-800 p-4 z-50 space-y-2 lg:hidden">
          <Link className="block py-2 hover:text-white transition" href="/">
            Tools
          </Link>
          <Link className="block py-2 hover:text-white transition" href="/dashboard">
            Dashboard
          </Link>
          {user ? (
            <>
              <p className="py-2 text-xs text-slate-400">{user.email}</p>
              <button
                onClick={handleLogout}
                className="block w-full text-left py-2 text-red-400"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link className="block py-2 text-accent" href="/auth/login">
              Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
