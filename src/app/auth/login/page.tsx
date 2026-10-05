import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your PDFToolsHub account to access your saved files and Pro features.",
  alternates: { canonical: "/auth/login" },
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <section className="px-6 py-12 max-w-xl mx-auto">
      <div className="mb-6">
        <div className="dept-tag">The Print Room</div>
      </div>
      <AuthForm mode="login" />
    </section>
  );
}
