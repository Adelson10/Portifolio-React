"use client";

import LogoFull from "@/assents/logo-full";
import { checkEmailExists, confirmPasswordReset, signIn, signUp, updatePassword } from "@/lib/auth";
import { traduzirErroAuth } from "@/lib/auth-errors";
import { createClient } from "@/lib/supabase";
import { EMAIL_SUPORTE } from "@/lib/legal-info";
import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dispatch, SetStateAction, useCallback, useEffect, useState, useTransition } from "react";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type AuthSet = "login" | "cadastro" | "esqueci-senha" | "nova-senha";

const GoogleIcon = () => (
  <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 48 48" height="18" width="18" style={{ display: "block" }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    <path fill="none" d="M0 0h48v48H0z" />
  </svg>
);

export function AuthForm({
  initialSet,
  initialEmail,
  tokenHash,
}: { initialSet?: AuthSet; initialEmail?: string; tokenHash?: string } = {}) {
  const searchParams = useSearchParams();
  const linkExpired = searchParams.get("error") === "auth_callback";
  const [set, setSet] = useState<AuthSet>(
    () =>
      initialSet ??
      (searchParams.get("cadastro") === "1"
        ? "cadastro"
        : searchParams.get("reset") === "1"
        ? "nova-senha"
        : linkExpired
        ? "esqueci-senha"
        : "login")
  );

  return (
    <div className="flex-1 flex flex-col bg-(--background-secundary) px-4 2xl:px-16 py-6 overflow-y-auto">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-sm 2xl:max-w-md space-y-5">
          <div className="flex flex-col items-center text-center mb-12">
            <LogoFull size={300} />
          </div>
          {linkExpired && (
            <p className="text-xs text-(--color-danger) text-center">
              Seu link de redefinição expirou ou já foi usado. Solicite um novo abaixo.
            </p>
          )}
          {set === "login" ? (
            <LoginForm setSet={setSet} next={searchParams.get("next") ?? undefined} />
          ) : set === "cadastro" ? (
            <CadastroForm setSet={setSet} initialEmail={initialEmail ?? searchParams.get("email") ?? undefined} />
          ) : set === "esqueci-senha" ? (
            <EsqueciSenhaForm setSet={setSet} />
          ) : (
            <NovaSenhaForm setSet={setSet} tokenHash={tokenHash} />
          )}
        </div>
      </div>

      <p className="text-xs text-center text-(--foreground)/40 pt-6">
        <a href={`mailto:${EMAIL_SUPORTE}`} className="hover:text-(--brand) transition-colors">
          Entre em contato
        </a>
      </p>
    </div>
  );
}

function LoginForm({ setSet, next }: { setSet: Dispatch<SetStateAction<AuthSet>>; next?: string }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await signIn(email, senha, next);
      if (result?.error) setError(result.error);
    });
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    const redirectTo = new URL("/auth/callback", window.location.origin);
    if (next) redirectTo.searchParams.set("next", next);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field type="email" value={email} onChange={setEmail} placeholder="Digite seu e-mail..." />
      <Field type="password" value={senha} onChange={setSenha} placeholder="Senha" />

      <div className="flex justify-end">
        <button
          type="button"
          className="text-xs font-semibold text-(--foreground)/50 hover:text-(--foreground) transition-colors cursor-pointer"
          onClick={() => setSet("esqueci-senha")}
        >
          Esqueceu a senha?
        </button>
      </div>

      {error && <p className="text-xs text-(--color-danger) text-center">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-(--brand) hover:bg-(--brand-secundary) text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>

      <div className="flex items-center gap-3">
        <hr className="flex-1 border-t border-(--secundary)" />
        <span className="text-xs text-(--foreground)/40">ou continuar com</span>
        <hr className="flex-1 border-t border-(--secundary)" />
      </div>

      <button
        type="button"
        onClick={handleGoogleSignIn}
        className="bg-(--background) flex gap-2 py-2.5 px-3 items-center justify-center border rounded-lg border-(--secundary) w-full font-semibold text-sm cursor-pointer hover:bg-(--secundary) transition-colors"
      >
        <GoogleIcon /> Google
      </button>

      <p className="text-xs text-center text-(--foreground)/50 pt-4">
        Não tem uma conta?{" "}
        <button type="button" className="font-bold text-(--brand) hover:text-(--brand-secundary) transition-colors cursor-pointer" onClick={() => setSet("cadastro")}>
          Cadastre-se
        </button>
      </p>
    </form>
  );
}

function CadastroForm({ setSet, initialEmail }: { setSet: Dispatch<SetStateAction<AuthSet>>; initialEmail?: string }) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [emailCheck, setEmailCheck] = useState<{ email: string; taken: boolean } | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!EMAIL_REGEX.test(email)) return;

    let ignore = false;
    const timeout = setTimeout(async () => {
      const exists = await checkEmailExists(email);
      if (!ignore) setEmailCheck({ email, taken: exists });
    }, 500);

    return () => {
      ignore = true;
      clearTimeout(timeout);
    };
  }, [email]);

  const emailStatus: "idle" | "checking" | "available" | "taken" = !EMAIL_REGEX.test(email)
    ? "idle"
    : emailCheck?.email !== email
    ? "checking"
    : emailCheck.taken
    ? "taken"
    : "available";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (emailStatus === "taken") {
      setError("Este e-mail já está cadastrado.");
      return;
    }

    if (senha !== confirmar) {
      setError("As senhas não coincidem.");
      return;
    }

    startTransition(async () => {
      const result = await signUp(nome, email, senha);
      if (result?.error) setError(result.error);
      if (result?.success) setSuccess(result.success);
    });
  }

  const emailMessage =
    emailStatus === "checking"
      ? "Verificando e-mail..."
      : emailStatus === "taken"
      ? "Este e-mail já está cadastrado."
      : emailStatus === "available"
      ? "E-mail disponível."
      : undefined;

  const emailMessageTone = emailStatus === "taken" ? "error" : emailStatus === "available" ? "success" : "neutral";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Field type="text" value={nome} onChange={setNome} placeholder="Nome completo" />
      <Field
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="Seu endereço de e-mail"
        message={emailMessage}
        messageTone={emailMessageTone}
      />
      <Field type="password" value={senha} onChange={setSenha} placeholder="Senha" />
      <Field type="password" value={confirmar} onChange={setConfirmar} placeholder="Confirmar senha" />

      {error && <p className="text-xs text-(--color-danger) text-center">{error}</p>}
      {success && <p className="text-xs text-(--color-success) text-center">{success}</p>}

      <button
        type="submit"
        disabled={isPending || emailStatus === "taken" || emailStatus === "checking"}
        className="w-full bg-(--brand) hover:bg-(--brand-secundary) text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Criando conta..." : "Criar conta"}
      </button>

      <p className="text-xs text-center text-(--foreground)/50 pt-4">
        Já tem uma conta?{" "}
        <button type="button" className="font-bold text-(--brand) hover:text-(--brand-secundary) transition-colors cursor-pointer" onClick={() => setSet("login")}>
          Faça login
        </button>
      </p>
    </form>
  );
}

function EsqueciSenhaForm({ setSet }: { setSet: Dispatch<SetStateAction<AuthSet>> }) {
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isVerifying, startVerifying] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      });
      if (error) setError(traduzirErroAuth(error.message));
      else {
        setSent(true);
        setSuccess("Enviamos um e-mail com um link e um código de redefinição.");
      }
    });
  }

  function handleVerifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startVerifying(async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.verifyOtp({ email, token: codigo, type: "recovery" });
      if (error) setError(traduzirErroAuth(error.message));
      else setSet("nova-senha");
    });
  }

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-xs text-(--foreground)/50">
          Informe o e-mail da sua conta e enviaremos um link e um código para você redefinir a senha.
        </p>

        <Field type="email" value={email} onChange={setEmail} placeholder="Seu endereço de e-mail" />

        {error && !sent && <p className="text-xs text-(--color-danger) text-center">{error}</p>}
        {success && <p className="text-xs text-(--color-success) text-center">{success}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-(--brand) hover:bg-(--brand-secundary) text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "Enviando..." : sent ? "Reenviar e-mail" : "Enviar link de redefinição"}
        </button>
      </form>

      {sent && (
        <form onSubmit={handleVerifyCode} className="space-y-3 border-t border-(--secundary) pt-4">
          <p className="text-xs text-(--foreground)/50">
            Se o link do e-mail não funcionar, informe abaixo o código que veio junto na mensagem.
          </p>
          <Field type="text" value={codigo} onChange={setCodigo} placeholder="Código de verificação" />

          {error && <p className="text-xs text-(--color-danger) text-center">{error}</p>}

          <button
            type="submit"
            disabled={isVerifying || codigo.length === 0}
            className="w-full border border-(--brand) text-(--brand) hover:bg-(--brand) hover:text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isVerifying ? "Verificando..." : "Confirmar código"}
          </button>
        </form>
      )}

      <p className="text-xs text-center text-(--foreground)/50">
        <button type="button" className="font-bold text-(--brand) hover:text-(--brand-secundary) transition-colors cursor-pointer" onClick={() => setSet("login")}>
          Voltar para o login
        </button>
      </p>
    </div>
  );
}

type ResetStatus = "validating" | "needs-tap" | "invalid" | "ready";

function NovaSenhaForm({ setSet, tokenHash }: { setSet: Dispatch<SetStateAction<AuthSet>>; tokenHash?: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<ResetStatus>("validating");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isConfirming, startConfirming] = useTransition();

  const validateToken = useCallback(() => {
    if (!tokenHash) return;
    startConfirming(async () => {
      const result = await confirmPasswordReset(tokenHash);
      if (result?.error) {
        setStatus("invalid");
        return;
      }
      // Remove o token da URL: ele já foi consumido, não pode ser revalidado
      // se a página for recarregada.
      router.replace("/redefinir-senha");
      setStatus("ready");
    });
  }, [tokenHash, router]);

  useEffect(() => {
    if (window.location.hash.includes("error=")) {
      const supabase = createClient();
      supabase.auth.signOut().finally(() => setStatus("invalid"));
      return;
    }

    if (!tokenHash) {
      // Sem token na URL: só é válido se já existir uma sessão de
      // recuperação ativa (ex: confirmação por código de 6 dígitos).
      const supabase = createClient();
      // .catch: refresh token inválido/expirado rejeita em vez de devolver `{user: null}` (ver
      // lib/auth-seguro.ts)  sem isso a promise ficava pendurada e o status nunca saía de "loading".
      supabase.auth.getUser()
        .then(({ data }) => setStatus(data.user ? "ready" : "invalid"))
        .catch(() => setStatus("invalid"));
      return;
    }

    // Apps de e-mail no Android (ex: Gmail) pré-carregam o link antes do
    // toque do usuário, o que consumiria o token de uso único. Exigimos um
    // toque explícito só nesse caso; nas demais plataformas validamos direto.
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      setStatus("needs-tap");
    } else {
      validateToken();
    }
  }, [tokenHash, validateToken]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (senha.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (senha !== confirmar) {
      setError("As senhas não coincidem.");
      return;
    }

    startTransition(async () => {
      const result = await updatePassword(senha);
      if (result?.error) setError(result.error);
      if (result?.success) {
        setSuccess("Senha redefinida com sucesso! Faça login novamente.");
        const supabase = createClient();
        await supabase.auth.signOut();
        setTimeout(() => router.push("/login"), 1500);
      }
    });
  }

  if (status === "validating") {
    return <p className="text-xs text-center text-(--foreground)/50 py-4">Verificando...</p>;
  }

  if (status === "needs-tap") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm font-semibold text-(--foreground)">Confirmar redefinição de senha</p>
        <p className="text-xs text-(--foreground)/50">Toque no botão abaixo para continuar.</p>
        <button
          type="button"
          onClick={validateToken}
          disabled={isConfirming}
          className="w-full bg-(--brand) hover:bg-(--brand-secundary) text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isConfirming ? "Confirmando..." : "Confirmar"}
        </button>
      </div>
    );
  }

  if (status === "invalid") {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm font-semibold text-(--foreground)">Link inválido ou expirado</p>
        <p className="text-xs text-(--foreground)/50">
          Esse link de redefinição de senha não é mais válido ou já foi utilizado. Solicite um novo para continuar.
        </p>
        <button
          type="button"
          onClick={() => setSet("esqueci-senha")}
          className="w-full bg-(--brand) hover:bg-(--brand-secundary) text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          Solicitar novo link
        </button>
        <p className="text-xs text-center text-(--foreground)/50 pt-2">
          <button type="button" className="font-bold text-(--brand) hover:text-(--brand-secundary) transition-colors cursor-pointer" onClick={() => router.push("/login")}>
            Voltar para o login
          </button>
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <p className="text-xs text-(--foreground)/50">Defina uma nova senha para a sua conta.</p>

      <Field type="password" value={senha} onChange={setSenha} placeholder="Nova senha" />
      <Field type="password" value={confirmar} onChange={setConfirmar} placeholder="Confirmar nova senha" />

      {error && <p className="text-xs text-(--color-danger) text-center">{error}</p>}
      {success && <p className="text-xs text-(--color-success) text-center">{success}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-(--brand) hover:bg-(--brand-secundary) text-white font-medium py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Salvando..." : "Redefinir senha"}
      </button>

      <p className="text-xs text-center text-(--foreground)/50 pt-4">
        <button type="button" className="font-bold text-(--brand) hover:text-(--brand-secundary) transition-colors cursor-pointer" onClick={() => router.push("/login")}>
          Voltar para o login
        </button>
      </p>
    </form>
  );
}

export function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  message,
  messageTone = "neutral",
}: {
  label?: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  message?: string;
  messageTone?: "neutral" | "error" | "success";
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const messageClass =
    messageTone === "error"
      ? "text-(--color-danger)"
      : messageTone === "success"
      ? "text-(--color-success)"
      : "text-(--foreground)/50";

  return (
    <div className="space-y-1">
      {label && <label className="block text-xs font-semibold text-(--foreground)/70">{label}</label>}
      <div className="relative">
        <input
          type={isPassword && showPassword ? "text" : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          aria-label={label ?? placeholder}
          className={`w-full border border-(--secundary) rounded-lg px-3 py-2.5 text-sm bg-(--background) focus:outline-none focus:ring-2 focus:ring-(--brand) focus:border-transparent transition-shadow ${
            isPassword ? "pr-9" : ""
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            className="absolute right-0 top-0 h-full px-2.5 flex items-center text-(--foreground)/40 hover:text-(--foreground)/70 transition-colors cursor-pointer"
            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          >
            {showPassword ? <EyeSlashIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        )}
      </div>
      {message && <p className={`text-xs ${messageClass}`}>{message}</p>}
    </div>
  );
}
