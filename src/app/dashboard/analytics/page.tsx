"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/dashboard/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        } else if (res.status === 401) {
          router.push("/auth/login");
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [router]);

  if (loading) return <div className="p-8 text-center">Loading Analytics...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Advanced Analytics Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-4 mb-12">
        {data?.stats.map((stat: any) => (
          <div key={stat.label} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <div className="text-sm text-slate-400">{stat.label}</div>
            <div className="text-3xl font-bold mt-2">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold">Usage Logs</h2>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-900/50">
              <th className="p-4 text-sm font-medium text-slate-400">Tool Used</th>
              <th className="p-4 text-sm font-medium text-slate-400">File Size</th>
              <th className="p-4 text-sm font-medium text-slate-400">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700">
            {data?.usageLogs.map((log: any) => (
              <tr key={log.id} className="hover:bg-slate-700/30 transition">
                <td className="p-4 text-sm">{log.toolUsed}</td>
                <td className="p-4 text-sm">{(log.fileSize / 1024 / 1024).toFixed(2)} MB</td>
                <td className="p-4 text-sm text-slate-400">{new Date(log.timestamp).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
