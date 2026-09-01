import HeroLoginCard from "@/components/landing/hero-login-card"
import HeroAccessCard from "@/components/landing/hero-access-card"
import HeroGlowBackground from "@/components/landing/hero-glow-background"
import FaqAccordion from "@/components/landing/faq-accordion"
import SiteNav from "@/components/landing/site-nav"
import { APP_LOGIN_URL } from "@/lib/site"
import { EMAIL_SUPORTE } from "@/lib/legal-info"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getUserSeguro } from "@/lib/auth-seguro"
import HeroIntro from "@/components/landing/hero-intro";
import SecuritySection from "@/components/landing/security-section";
import ToolsSection from "@/components/landing/tools-section";
import PricingSection from "@/components/landing/pricing-section";
import FlowSteps from "@/components/landing/flow-steps";

/** Sem metadata.title aqui de propósito  herda o "Ensina Plus" default do layout raiz.
 *  Definir um title aqui aplicaria o template "%s | Ensina Plus" e duplicaria o nome.
 *
 *  Home institucional (ensinaplus.com)  ver proxy.ts pro roteamento por domínio.
 *  Estrutura de seções ainda com estilo neutro de propósito, pra facilitar a
 *  estilização definitiva depois sem precisar remontar o esqueleto da página. */
export default async function Inicio() {
  const supabase = await createServerSupabaseClient()
  const user = await getUserSeguro(supabase)
  const userName = user?.user_metadata?.full_name ?? user?.email ?? "Usuário"

  const { data: usuario } = user
    ? await supabase.from("usuarios").select("avatar_url").eq("id", user.id).single()
    : { data: null }
  const avatarUrl = usuario?.avatar_url ?? null

  return (
    <main className="inicio-scroll flex-1 flex flex-col overflow-y-auto bg-(--background-secundary)">

      <SiteNav />
      {/* 01 · HERO */}
      <section id="intro" className="relative isolate lg:min-h-[100vh] lg:flex lg:items-center px-6 pt-17 pb-12 lg:pb-0">
          <HeroGlowBackground />
          <div className="max-w-[1080px] w-full mx-auto flex flex-col lg:flex-row items-center justify-center text-center gap-10 lg:gap-12 py-8">
            <HeroIntro />
            <div className="lg:flex-1 flex justify-center">
              {user ? <HeroAccessCard userName={userName} avatarUrl={avatarUrl} /> : <HeroLoginCard />}
            </div>
          </div>
      </section>
      <div className="max-w-5xl w-full mx-auto flex flex-col gap-16 px-6">

        {/* 02 · FERRAMENTAS (as 3 reais do produto) */}
        <ToolsSection />

        {/* 03 · FLUXO */}
        <FlowSteps />

        {/* 04 · SEGURANÇA E PRIVACIDADE  perto de Preços de propósito: funciona como
            tratamento de objeção no momento em que o visitante está mais perto de decidir,
            em vez de logo após o hero, antes dele ainda entender o que o produto faz. */}
        <SecuritySection />

        {/* 05 · PREÇOS */}
        <PricingSection />

        {/* 07 · FAQ */}
        <section id="faq" className="flex flex-col gap-6 scroll-mt-10 py-18">
          <div className="flex flex-col items-center text-center gap-3 mb-16">
            <span className="text-lg font-serif text-(--brand)">Dúvidas</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-balance">Perguntas frequentes</h2>
            <p className="text-base font-serif text-(--foreground)/60 max-w-xl">Tudo que você precisa saber antes de começar.</p>
          </div>
          <FaqAccordion />
        </section>

        {/* 08 · CTA FINAL */}
        <section className="flex flex-col items-center text-center gap-4 py-6">
          <h2 className="text-2xl font-bold text-balance">Comece a economizar horas esta semana.</h2>
          <a href={`${APP_LOGIN_URL}?cadastro=1`} className="text-sm font-semibold text-white bg-(--brand) hover:bg-(--brand-secundary) transition-colors rounded-lg px-6 py-3">
            Começar gratuitamente
          </a>
        </section>
      </div>
      {/* FOOTER */}
      <footer className="bg-(--background) flex flex-col items-center gap-3 text-xs text-(--foreground)/40 border-t border-(--secundary) py-6 px-6 sm:px-12 text-center">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 max-w-3xl">
          <a href="/termos" className="hover:text-(--foreground)/60 transition-colors">Termos de Uso</a>
          <a href="/privacidade" className="hover:text-(--foreground)/60 transition-colors">Privacidade</a>
          <a href="/cookies" className="hover:text-(--foreground)/60 transition-colors">Cookies</a>
          <a href="/retencao-dados" className="hover:text-(--foreground)/60 transition-colors">Retenção de Dados</a>
          <a href="/direitos-autorais" className="hover:text-(--foreground)/60 transition-colors">Direitos Autorais</a>
          <a href="/conteudo-usuario" className="hover:text-(--foreground)/60 transition-colors">Conteúdo do Usuário</a>
          <a href="/politica-ia" className="hover:text-(--foreground)/60 transition-colors">Política de IA</a>
          <a href="/politica-seguranca" className="hover:text-(--foreground)/60 transition-colors">Segurança da Informação</a>
          <a href="/isencao-responsabilidade" className="hover:text-(--foreground)/60 transition-colors">Isenção de Responsabilidade</a>
          <a href="/politica-conta" className="hover:text-(--foreground)/60 transition-colors">Conta e Exclusão</a>
          <a href={`mailto:${EMAIL_SUPORTE}`} className="hover:text-(--foreground)/60 transition-colors">Suporte</a>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span>Ensina Plus</span>
          <span>© 2026 Ensina Plus. Todos os direitos reservados.</span>
        </div>
      </footer>
    </main>
  )
}
