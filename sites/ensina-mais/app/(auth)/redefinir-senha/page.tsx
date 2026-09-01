import type { Metadata } from "next";
import { AuthForm } from "@/components/auth-form";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Redefinir senha",
};

export default async function RedefinirSenhaPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string }>;
}) {
  const { token_hash } = await searchParams;

  return (
    <Suspense>
      <AuthForm initialSet="nova-senha" tokenHash={token_hash} />
    </Suspense>
  );
}
