import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Entrar",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ cadastro?: string; email?: string }>;
}) {
  const params = await searchParams;

  return (
    <Suspense>
      <AuthForm
        initialSet={params.cadastro === "1" ? "cadastro" : undefined}
        initialEmail={params.email}
      />
    </Suspense>
  );
}
