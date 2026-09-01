/** Ilustração do que deve conter o .docx enviado em "Selecionar um novo modelo": só o cabeçalho
 *  (logo(s) + campos Nome/Turma/Data), nada no corpo do documento. Mesma convenção visual do
 *  cabeçalho falso já usado na cena "editor" do tour (duas caixas tracejadas "LOGO"). Um leve
 *  destaque (Tailwind `animate-pulse`, escalonado por elemento) passeia pelos campos pra guiar o
 *  olhar - sem CSS/lib externa. Usado só pelo passo "selecionar-proprio-modelo" (ver steps.ts). */
export default function ModelExamplePreview() {
  const campos = ["Nome:", "Turma:", "Data:"]

  return (
    <div className="rounded-lg border border-(--secundary) bg-(--secundary)/30 p-3 flex flex-col gap-2.5">
      <div className="flex items-center justify-center gap-2.5">
        {[0, 1].map((i) => (
          <span
            key={i}
            className="animate-pulse w-[84px] h-[30px] rounded-[2px] border border-dashed border-(--foreground)/40 flex items-center justify-center text-[8px] tracking-widest text-(--foreground)/50"
            style={{ animationDelay: `${i * 160}ms` }}
          >
            LOGO
          </span>
        ))}
      </div>
      <table className="w-full border-collapse text-[10px]">
        <tbody>
          {campos.map((campo, i) => (
            <tr key={campo}>
              <td
                className="animate-pulse border border-(--foreground)/25 px-2 py-1 font-semibold text-(--foreground)/70"
                style={{ animationDelay: `${(i + 2) * 160}ms` }}
              >
                {campo}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
