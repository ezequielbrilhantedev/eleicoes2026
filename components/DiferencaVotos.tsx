'use client'

import { useEffect, useRef, useState } from 'react'
import type { Candidato } from '@/lib/tse'
import { corPartido } from '@/lib/partidos'
import { NumeroAnimado } from './NumeroAnimado'

/**
 * Placar da disputa: diferença de votos entre os dois candidatos que decidem a vaga
 * (líder x 2º colocado; em disputa com mais de uma vaga, o último dentro x o primeiro fora).
 * Acompanha cada atualização e mostra se a distância está abrindo ou fechando.
 */
export function DiferencaVotos({ candidatos, vagas, aoVivo }: { candidatos: Candidato[]; vagas: number; aoVivo: boolean }) {
  const a = candidatos[Math.max(0, vagas - 1)]
  const b = candidatos[Math.max(0, vagas - 1) + 1]
  const dif = a && b ? a.votos - b.votos : 0

  const anterior = useRef<{ dif: number; lider: string } | null>(null)
  const [variacao, setVariacao] = useState(0)
  const [virada, setVirada] = useState(false)

  useEffect(() => {
    if (!a || !b) return
    const ant = anterior.current
    anterior.current = { dif, lider: a.id }
    if (!ant) return
    if (ant.lider !== a.id) {
      setVirada(true)
      setVariacao(0)
    } else if (ant.dif !== dif) {
      setVirada(false)
      setVariacao(dif - ant.dif)
    }
  }, [a, b, dif])

  if (!a || !b || a.votos + b.votos === 0) return null

  const corA = corPartido(a.partido)
  const corB = corPartido(b.partido)
  const soma = a.votos + b.votos
  const larguraA = (a.votos / soma) * 100
  const difPontos = Math.abs(a.percentual - b.percentual)

  return (
    <div className="mt-3 rounded-2xl border border-ouro/30 bg-painel p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-suave">{vagas > 1 ? `Disputa pela ${vagas}ª vaga` : 'Diferença entre o 1º e o 2º'}</p>
        {virada && <span className="rounded-md bg-ouro/15 px-1.5 py-0.5 text-xs font-bold text-ouro">VIRADA</span>}
      </div>

      <div className="mt-1 flex items-end justify-between gap-3">
        <p className="text-3xl font-bold leading-none tabular-nums sm:text-4xl">
          <NumeroAnimado valor={dif} />
          <span className="ml-1.5 text-base font-medium text-suave">votos</span>
        </p>
        <p className="text-right text-xs text-suave tabular-nums">
          <span className="text-base font-semibold text-texto">
            <NumeroAnimado valor={difPontos} casas={2} />
          </span>{' '}
          p.p.
          {aoVivo && variacao !== 0 && (
            <span className={`mt-0.5 block font-semibold ${variacao > 0 ? 'text-verde' : 'text-red-400'}`}>
              {variacao > 0 ? '▲ abriu' : '▼ fechou'} {Math.abs(variacao).toLocaleString('pt-BR')}
            </span>
          )}
        </p>
      </div>

      <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/5">
        <div className="barra h-full" style={{ width: `${larguraA}%`, backgroundColor: corA }} />
        <div className="barra h-full" style={{ width: `${100 - larguraA}%`, backgroundColor: corB }} />
      </div>
      <div className="mt-2 flex justify-between gap-3 text-xs tabular-nums">
        <span className="min-w-0 truncate">
          <span className="font-semibold" style={{ color: corA }}>
            {a.nome}
          </span>
        </span>
        <span className="min-w-0 truncate text-right">
          <span className="font-semibold" style={{ color: corB }}>
            {b.nome}
          </span>
        </span>
      </div>
    </div>
  )
}
