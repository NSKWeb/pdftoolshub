import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <section className="px-6 py-12 max-w-xl mx-auto">
      <AuthForm mode="login" />
    </section>
  );
}
