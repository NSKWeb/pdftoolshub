import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create a free PDFToolsHub account to manage your documents and unlock Pro features.",
  alternates: { canonical: "/auth/register" },
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <section className="px-6 py-12 max-w-xl mx-auto">
      <div className="mb-6">
        <div className="dept-tag">Applications</div>
      </div>
      <AuthForm mode="register" />
    </section>
  );
}
