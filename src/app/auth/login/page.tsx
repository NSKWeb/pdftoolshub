import { AuthForm } from "@/components/auth-form";

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
