import type { ReactNode } from "react"
import Link from "next/link"
import SiteNav from "@/components/landing/site-nav"

/** Marca inline um dado que depende de confirmação do proprietário do sistema (razão social,
 *  CNPJ, endereço, e-mail do encarregado etc.)  não foi encontrado no código, por isso não pode
 *  ser afirmado como fato nos documentos. Fica visualmente destacado até ser preenchido de verdade. */
export function Pendente({ children }: { children: ReactNode }) {
  return (
    <span
      className="rounded bg-amber-400/20 px-1 py-0.5 text-amber-700 dark:text-amber-400 font-medium"
      title="Pendente de confirmação pelo responsável pela plataforma"
    >
      {children}
    </span>
  )
}

export interface Clausula {
  numero: string
  titulo: string
  conteudo: ReactNode
}

export interface DocumentoRelacionado {
  href: string
  label: string
}

interface LegalDocumentProps {
  titulo: string
  ultimaAtualizacao: string
  resumo?: ReactNode
  clausulas: Clausula[]
  relacionados?: DocumentoRelacionado[]
}

/** Estrutura compartilhada por todas as páginas legais (Termos, Privacidade, Cookies etc.):
 *  título, sumário navegável e cláusulas numeradas  mesmo container/tipografia usados desde os
 *  rascunhos originais de /termos e /privacidade, agora reaproveitado pelos 10 documentos. */
export default function LegalDocument({ titulo, ultimaAtualizacao, resumo, clausulas, relacionados }: LegalDocumentProps) {
  return (
    <main className="flex-1 flex flex-col overflow-y-auto">
      <SiteNav legal />
      <div className="max-w-3xl w-full mx-auto flex flex-col gap-6 px-6 pt-28 pb-20">
        <h1 className="text-2xl font-bold">{titulo}</h1>
        <p className="text-sm text-(--foreground)/60">Última atualização: {ultimaAtualizacao}.</p>

        {resumo && <div className="flex flex-col gap-4 text-sm text-(--foreground)/80 leading-relaxed">{resumo}</div>}

        <nav aria-label="Índice" className="rounded-lg border border-(--secundary) p-4">
          <span className="text-xs font-semibold uppercase tracking-wide text-(--foreground)/50">Índice</span>
          <ol className="mt-2 flex flex-col gap-1 text-sm">
            {clausulas.map((c) => (
              <li key={c.numero}>
                <a href={`#clausula-${c.numero}`} className="text-(--brand) hover:text-(--brand-secundary) hover:underline">
                  {c.numero}. {c.titulo}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-8 text-sm text-(--foreground)/80 leading-relaxed">
          {clausulas.map((c) => (
            <section key={c.numero} id={`clausula-${c.numero}`} className="flex flex-col gap-2 scroll-mt-24">
              <h2 className="text-base font-semibold text-(--foreground)">
                {c.numero}. {c.titulo}
              </h2>
              {c.conteudo}
            </section>
          ))}
        </div>

        {relacionados && relacionados.length > 0 && (
          <p className="mt-4">
            Veja também:{" "}
            {relacionados.map((r, i) => (
              <span key={r.href}>
                <Link href={r.href} className="underline text-(--brand) hover:text-(--brand-secundary)">
                  {r.label}
                </Link>
                {i < relacionados.length - 1 ? " · " : ""}
              </span>
            ))}
            .
          </p>
        )}
      </div>
    </main>
  )
}
