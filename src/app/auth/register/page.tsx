import { AuthForm } from "@/components/auth-form";

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
