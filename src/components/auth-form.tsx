"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submitLabel = mode === "login" ? "Sign in" : "Create account";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus(null);
    const formData = new FormData(event.currentTarget);

    const res = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify({
        email: formData.get("email"),
        password: formData.get("password")
      }),
      headers: { "Content-Type": "application/json" }
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      setStatus({ type: "success", message: data.message ?? "Success" });
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 500);
    } else {
      setStatus({ type: "error", message: data.message ?? "Something went wrong" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="gradient-border rounded-xl bg-panel p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-semibold">{submitLabel}</h2>
        <p className="text-slate-400 text-sm">
          {mode === "login" ? "Welcome back to Dittopdf." : "Start processing your PDFs instantly."}
        </p>
      </div>
      <div className="space-y-3">
        <input
          name="email"
          type="email"
          placeholder="Email address"
          required
          className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 focus:border-accent focus:outline-none transition"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          required
          minLength={8}
          className="w-full rounded-md bg-slate-900 border border-slate-700 px-3 py-2 focus:border-accent focus:outline-none transition"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-accent text-slate-900 font-medium py-2 disabled:opacity-60 hover:opacity-90 transition"
      >
        {loading ? "Processing..." : submitLabel}
      </button>
      {status && (
        <p className={`text-sm ${status.type === "success" ? "text-green-400" : "text-red-400"}`}>
          {status.message}
        </p>
      )}
    </form>
  );
}
