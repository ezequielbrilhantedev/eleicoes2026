'use client'

import { useState } from 'react'

const CHAVE_PIX = 'ezequielbrilhante.dev@gmail.com'

export function ApoieProjeto() {
  const [aberto, setAberto] = useState(false)
  const [copiado, setCopiado] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(CHAVE_PIX)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    } catch {
      // Sem permissão de área de transferência: a chave continua visível para copiar à mão
    }
  }

  return (
    <div className="mt-3 text-center text-xs text-suave">
      <button
        onClick={() => setAberto((a) => !a)}
        aria-expanded={aberto}
        className="rounded-full px-3 py-1 hover:text-texto hover:underline"
      >
        ☕ Gostou? Apoie o projeto
      </button>

      {aberto && (
        <div className="mx-auto mt-2 max-w-sm rounded-xl border border-linha bg-painel p-3">
          <p>
            O app é gratuito e sem anúncios. Se quiser ajudar quem fez, a contribuição é voluntária e pessoal, sem
            relação com campanha, partido ou candidato.
          </p>
          <p className="mt-2 text-[11px] uppercase tracking-wide">Chave Pix (e-mail)</p>
          <p className="mt-0.5 break-all font-mono text-sm text-texto select-all">{CHAVE_PIX}</p>
          <button
            onClick={copiar}
            className="mt-2 rounded-full bg-ouro px-3.5 py-1.5 text-xs font-semibold text-fundo"
          >
            {copiado ? 'Copiado ✓' : 'Copiar chave'}
          </button>
        </div>
      )}
    </div>
  )
}
