"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdSlot } from "@/components/ad-slot";

type DashboardData = {
  stats: Array<{ label: string; value: string; helper: string }>;
  recentFiles: Array<{ id: string; filename: string; toolUsed: string; status: string }>;
};

type UserProfile = {
  id: string;
  email: string;
  planType: string;
  usageCount: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashboardRes, profileRes] = await Promise.all([
          fetch("/api/dashboard/overview"),
          fetch("/api/user/profile")
        ]);

        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          setDashboard(dashboardData);
        }

        if (profileRes.ok) {
          const userData = await profileRes.json();
          setUser(userData.user);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }

  async function handleUpgradePlan() {
    if (!user) return;
    try {
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planType: user.planType === "Free" ? "Pro" : "Free" })
      });
      router.refresh();
    } catch (error) {
      console.error("Failed to update plan:", error);
    }
  }

  if (loading) {
    return (
      <section className="px-4 sm:px-6 py-12 max-w-7xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-800 rounded w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-slate-800 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!dashboard || !user) {
    router.push("/auth/login");
    return null;
  }

  return (
    <section className="px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Your dashboard</h1>
              <p className="text-slate-400 mt-1">Track usage, downloads, and plan limits.</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-md border border-red-500/50 text-red-400 hover:bg-red-500/10 transition text-sm"
            >
              Sign out
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {dashboard.stats.map((stat) => (
              <div key={stat.label} className="gradient-border rounded-xl p-5 bg-panel">
                <div className="text-sm text-slate-400">{stat.label}</div>
                <div className="text-2xl font-semibold mt-2">{stat.value}</div>
                <div className="text-xs text-slate-500 mt-1">{stat.helper}</div>
              </div>
            ))}
          </div>

          <div className="gradient-border rounded-xl p-6 bg-panel">
            <h3 className="text-lg font-medium mb-4">Recent files</h3>
            {dashboard.recentFiles.length > 0 ? (
              <div className="space-y-3">
                {dashboard.recentFiles.map((file) => (
                  <div key={file.id} className="flex items-center justify-between text-sm p-3 bg-slate-900/50 rounded-lg">
                    <div>
                      <div className="font-medium">{file.filename}</div>
                      <div className="text-xs text-slate-500">{file.toolUsed}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      file.status === "processed"
                        ? "bg-green-500/20 text-green-400"
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {file.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <p>No files processed yet</p>
                <a href="/" className="text-accent hover:underline mt-2 inline-block">
                  Try a tool →
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <AdSlot position="sidebar" />
          <div className="gradient-border rounded-xl p-5 bg-panel">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Account</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-500">Email</p>
                <p className="text-slate-200">{user.email}</p>
              </div>
              <div>
                <p className="text-slate-500">Current plan</p>
                <p className={`font-medium ${
                  user.planType === "Pro" ? "text-accent" : "text-slate-200"
                }`}>
                  {user.planType}
                </p>
              </div>
              <button
                onClick={handleUpgradePlan}
                className="w-full mt-3 px-4 py-2 rounded-md bg-accent text-slate-900 font-medium hover:opacity-90 transition text-sm"
              >
                {user.planType === "Free" ? "Upgrade to Pro" : "Downgrade to Free"}
              </button>
            </div>
          </div>
          <div className="gradient-border rounded-xl p-5 bg-panel text-xs text-slate-400">
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-slate-500 mb-2">Usage limits</h4>
            <p className="mb-2">
              <strong className="text-slate-300">Free:</strong> 5 files/day
            </p>
            <p className="mb-2">
              <strong className="text-slate-300">Pro:</strong> Unlimited files
            </p>
            <p>Reset happens at midnight UTC.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
