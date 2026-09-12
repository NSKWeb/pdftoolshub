"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === "login";
  const submitLabel = isLogin ? "Sign In" : "Create Account";

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
        router.push("/");
        router.refresh();
      }, 500);
    } else {
      setStatus({ type: "error", message: data.message ?? "Something went wrong" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="neo-card rounded-sm p-8 space-y-5">
      <div>
        <div className="eyebrow">{isLogin ? "Subscribers" : "New Byline"}</div>
        <h2 className="font-display text-3xl font-black tracking-tight mt-1">{submitLabel}</h2>
        <p className="text-inksoft text-sm mt-2">
          {isLogin
            ? "Welcome back to the newsroom. The tools work without an account — signing in just unlocks unlimited."
            : "Start processing your PDFs instantly. The tools stay free; an account just ups your allowance."}
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <label htmlFor="email" className="font-display font-bold text-sm block mb-1.5">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="reader@example.com"
            required
            className="neo-input rounded-sm !shadow-offset-sm"
          />
        </div>
        <div>
          <label htmlFor="password" className="font-display font-bold text-sm block mb-1.5">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            minLength={8}
            className="neo-input rounded-sm !shadow-offset-sm"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="neo-btn neo-btn-accent w-full rounded-sm"
      >
        {loading ? "Processing..." : submitLabel}
      </button>
      {status && (
        <p className={`text-sm font-medium ${status.type === "success" ? "text-olive" : "text-vermilion"}`}>
          {status.message}
        </p>
      )}
      <p className="text-xs text-phantom text-center">
        {isLogin ? "New to the sheet? " : "Already a subscriber? "}
        <Link
          href={isLogin ? "/auth/register" : "/auth/login"}
          className="text-vermilion font-bold hover:underline"
        >
          {isLogin ? "Create an account" : "Sign in"}
        </Link>
      </p>
    </form>
  );
}
