import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import { headers } from "next/headers"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: {
    default: "Ensina Plus",
    template: "%s | Ensina Plus",
  },
  description: "Crie atividades, provas e planos de aula em minutos com IA. Grátis pra começar, sem cartão de crédito.",
}

// viewport-fit=cover é o que faz o Safari no iOS reportar env(safe-area-inset-bottom) de verdade
// (a barra de baixo/home indicator) em vez de sempre 0  sem isso, painéis e sheets colados no
// fundo da tela (sidebar mobile, bottom sheets) ficam escondidos atrás da barra do navegador.
export const viewport: Viewport = {
  viewportFit: "cover",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Setado pelo proxy.ts (middleware) a cada request  assina o script inline abaixo pra
  // passar na CSP (script-src usa nonce, não 'unsafe-inline'; ver proxy.ts).
  const nonce = (await headers()).get("x-nonce") ?? undefined

  return (
    <html lang="pt-br" className={`${inter.className} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Aplica o tema salvo (ver lib/theme.ts) antes da hidratação, pra não piscar o tema
            errado quando o usuário escolheu "Claro"/"Escuro" fugindo da preferência do sistema.
            Lê de cookie (não localStorage) pra funcionar em qualquer subdomínio de ensinaplus.com. */}
        <script
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var m=document.cookie.match(/(?:^|; )tema=([^;]*)/);var t=m?decodeURIComponent(m[1]):null;var c=document.documentElement.classList;if(t==="claro")c.add("light");else if(t==="escuro")c.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body className="h-full flex overflow-hidden">
        {children}
      </body>
    </html>
  )
}
