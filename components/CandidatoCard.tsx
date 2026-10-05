'use client'

import { useEffect, useRef, useState } from 'react'
import type { Candidato } from '@/lib/tse'
import { corPartido } from '@/lib/partidos'
import { NumeroAnimado } from './NumeroAnimado'

function iniciais(nome: string) {
  return nome
    .split(/\s+/)
    .filter((p) => p.length > 2)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase()
}

function Foto({ src, nome, cor }: { src: string; nome: string; cor: string }) {
  const [erro, setErro] = useState(!src)
  useEffect(() => setErro(!src), [src])
  return (
    <div
      className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 sm:h-16 sm:w-16"
      style={{ ['--tw-ring-color' as string]: cor, backgroundColor: `${cor}22` }}
    >
      {erro ? (
        <span className="flex h-full w-full items-center justify-center text-lg font-bold" style={{ color: cor }}>
          {iniciais(nome)}
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={nome}
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover object-top"
          onError={() => setErro(true)}
        />
      )}
    </div>
  )
}

export function CandidatoCard({
  c,
  posicao,
  escala,
  aoVivo,
  destaque,
}: {
  c: Candidato
  posicao: number
  /** percentual que corresponde a 100% da barra (100 em cargos majoritários, o do líder nos proporcionais) */
  escala: number
  aoVivo: boolean
  destaque: boolean
}) {
  // Cor do partido, a mesma usada no mapa
  const cor = corPartido(c.partido)
  const largura = escala > 0 ? Math.min(100, (c.percentual / escala) * 100) : 0

  // Pisca levemente quando os votos mudam
  const anterior = useRef(c.votos)
  const [flash, setFlash] = useState(0)
  useEffect(() => {
    if (anterior.current !== c.votos) {
      anterior.current = c.votos
      setFlash((f) => f + 1)
    }
  }, [c.votos])

  return (
    <li
      className={`${flash ? (flash % 2 ? 'flash-a' : 'flash-b') : ''} rounded-2xl border p-3 sm:p-4 ${
        destaque ? 'border-ouro/40 bg-painel-2' : 'border-linha bg-painel'
      }`}
    >
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="w-6 text-center text-sm font-semibold text-suave">{posicao}º</span>
        <Foto src={c.foto} nome={c.nome} cor={cor} />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              {/* A tag fica fora do trecho cortado com "…" e, se não couber ao lado do nome, desce para a linha de baixo */}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                <p className="max-w-full truncate text-base font-semibold sm:text-lg">{c.nome}</p>
                {c.eleito && (
                  <span className="shrink-0 rounded-md bg-verde/15 px-1.5 py-0.5 text-xs font-bold text-verde">
                    ELEITO
                  </span>
                )}
                {!c.eleito && /2º turno/i.test(c.situacao) && (
                  <span className="shrink-0 rounded-md bg-ouro/15 px-1.5 py-0.5 text-xs font-bold text-ouro">
                    2º TURNO
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-suave sm:text-sm">
                <span className="font-semibold text-texto/90">{c.partido}</span> · {c.numero}
                {c.vice && <span className="hidden sm:inline"> · Vice/1º sup.: {c.vice}</span>}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold leading-none tabular-nums sm:text-3xl">
                <NumeroAnimado valor={c.percentual} casas={2} />
                <span className="text-base text-suave">%</span>
              </p>
              <p className="mt-1 text-xs text-suave tabular-nums">
                <NumeroAnimado valor={c.votos} /> votos
              </p>
            </div>
          </div>

          <div className="mt-2.5 h-3 overflow-hidden rounded-full bg-white/5">
            <div
              className={`barra relative h-full overflow-hidden rounded-full ${aoVivo ? 'barra-viva' : ''}`}
              style={{ width: `${largura}%`, background: `linear-gradient(90deg, ${cor}aa, ${cor})` }}
            />
          </div>
        </div>
      </div>
    </li>
  )
}
