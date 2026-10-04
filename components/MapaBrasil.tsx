'use client'

import { useMemo, useState } from 'react'
import brasil from '@svg-maps/brazil'
import { UFS } from '@/lib/config'
import { agregarRegioes, type ResultadoMapa } from '@/lib/mapa'
import { COR_SEM_DADOS, corPartido } from '@/lib/partidos'

// Mapa: SVG Maps (https://github.com/VictorCazanave/svg-maps), licença CC BY 4.0
const MAPA = brasil as unknown as { viewBox: string; locations: { id: string; name: string; path: string }[] }

type Modo = 'estados' | 'regioes'

const fmtPct = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const nomeUF = (uf: string) => UFS.find((u) => u.sigla === uf)?.nome ?? uf

export function MapaBrasil({ dados, aoAbrirEstado }: { dados: ResultadoMapa; aoAbrirEstado: (uf: string) => void }) {
  const [modo, setModo] = useState<Modo>('estados')
  // Clique/toque fixa um estado; passar o mouse só mostra uma prévia
  const [fixo, setFixo] = useState<string | null>(null)
  const [previa, setPrevia] = useState<string | null>(null)
  const foco = previa ?? fixo // sigla da UF em foco

  const regioes = useMemo(() => agregarRegioes(dados), [dados])
  const regiaoDe = useMemo(() => {
    const m: Record<string, (typeof regioes)[number]> = {}
    for (const r of regioes) for (const uf of r.ufs) m[uf] = r
    return m
  }, [regioes])

  // Partido que pinta cada UF no modo atual
  const partidoDe = (uf: string) =>
    modo === 'estados' ? dados.estados[uf]?.lider?.partido ?? null : regiaoDe[uf]?.partido ?? null

  // Legenda: partidos que lideram em algum lugar, com a contagem
  const legenda = useMemo(() => {
    const cont: Record<string, number> = {}
    const itens = modo === 'estados' ? UFS.map((u) => dados.estados[u.sigla]?.lider?.partido) : regioes.map((r) => r.partido)
    for (const p of itens) if (p) cont[p] = (cont[p] ?? 0) + 1
    return Object.entries(cont).sort((a, b) => b[1] - a[1])
  }, [dados, regioes, modo])

  const comVotos = UFS.filter((u) => dados.estados[u.sigla]?.lider).length
  const unidade = modo === 'estados' ? ['estado', 'estados'] : ['região', 'regiões']

  const ufFoco = foco ? dados.estados[foco] : null
  const regiaoFoco = foco ? regiaoDe[foco] : null

  return (
    <div className="rounded-2xl border border-linha bg-painel p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-suave">
          {comVotos} de 27 estados com votos{dados.atualizadoEm && ` · ${dados.simulacao ? 'Simulado' : 'TSE'}: ${dados.atualizadoEm}`}
        </p>
        <div className="flex shrink-0 rounded-full bg-painel-2 p-0.5 text-xs">
          {(['estados', 'regioes'] as Modo[]).map((m) => (
            <button
              key={m}
              onClick={() => setModo(m)}
              className={`rounded-full px-3 py-1 font-medium transition ${m === modo ? 'bg-ouro text-fundo' : 'text-suave hover:text-texto'}`}
            >
              {m === 'estados' ? 'Estados' : 'Regiões'}
            </button>
          ))}
        </div>
      </div>

      <svg
        viewBox={MAPA.viewBox}
        className="mx-auto block h-auto w-full max-w-[520px]"
        role="img"
        aria-label={`Mapa do Brasil: partido que lidera em cada ${unidade[0]}`}
        onMouseLeave={() => setPrevia(null)}
      >
        {MAPA.locations.map((l) => {
          const uf = l.id.toUpperCase()
          const partido = partidoDe(uf)
          const emFoco = modo === 'estados' ? foco === uf : !!foco && regiaoDe[foco]?.nome === regiaoDe[uf]?.nome
          return (
            <path
              key={l.id}
              d={l.path}
              className="mapa-uf cursor-pointer outline-none"
              fill={partido ? corPartido(partido) : COR_SEM_DADOS}
              stroke={emFoco ? '#ffffff' : 'var(--color-fundo)'}
              strokeWidth={emFoco ? 2 : 1}
              opacity={foco && !emFoco ? 0.75 : 1}
              tabIndex={0}
              role="button"
              aria-label={`${l.name}${partido ? `: ${partido} na frente` : ': sem votos ainda'}`}
              onMouseEnter={() => setPrevia(uf)}
              onFocus={() => setFixo(uf)}
              onClick={() => setFixo(uf)}
              onKeyDown={(e) => e.key === 'Enter' && modo === 'estados' && aoAbrirEstado(uf)}
            />
          )
        })}
      </svg>

      {/* Detalhe do estado/região em foco */}
      <div className="mt-3 min-h-[76px] rounded-xl bg-painel-2 p-3 text-sm">
        {!foco ? (
          <p className="text-suave">Toque ou passe o mouse sobre um estado para ver quem lidera.</p>
        ) : modo === 'estados' ? (
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">
                {nomeUF(foco)}{' '}
                {ufFoco && <span className="text-xs font-normal text-suave">· {fmtPct(ufFoco.urnasPct)}% das seções</span>}
              </p>
              {ufFoco?.lider ? (
                <>
                  <LinhaCandidato c={ufFoco.lider} />
                  {ufFoco.segundo && <LinhaCandidato c={ufFoco.segundo} suave />}
                </>
              ) : (
                <p className="text-suave">{ufFoco ? 'Sem votos apurados ainda.' : 'Sem resultado do TSE para este estado.'}</p>
              )}
            </div>
            <button
              onClick={() => aoAbrirEstado(foco)}
              className="shrink-0 rounded-full bg-ouro px-3 py-1.5 text-xs font-semibold text-fundo"
            >
              Ver lista →
            </button>
          </div>
        ) : (
          regiaoFoco && (
            <div>
              <p className="font-semibold">
                {regiaoFoco.nome} <span className="text-xs font-normal text-suave">· {regiaoFoco.ufs.join(', ')}</span>
              </p>
              {regiaoFoco.partido ? (
                <p className="mt-1 flex items-center gap-2">
                  <Amostra cor={corPartido(regiaoFoco.partido)} />
                  <span className="font-semibold">{regiaoFoco.partido}</span>
                  <span className="text-suave tabular-nums">
                    {fmtPct(regiaoFoco.percentual)}% · {regiaoFoco.votos.toLocaleString('pt-BR')} votos
                  </span>
                </p>
              ) : (
                <p className="text-suave">Sem votos apurados ainda.</p>
              )}
            </div>
          )
        )}
      </div>

      {/* Legenda */}
      {legenda.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
          {legenda.map(([partido, n]) => (
            <li key={partido} className="flex items-center gap-1.5">
              <Amostra cor={corPartido(partido)} />
              <span className="font-semibold">{partido}</span>
              <span className="text-suave">
                {n} {n === 1 ? unidade[0] : unidade[1]}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Tabela: o mesmo dado em texto, para não depender só da cor */}
      <details className="mt-3 text-xs">
        <summary className="cursor-pointer text-suave hover:text-texto">
          Ver {modo === 'estados' ? 'todos os estados' : 'todas as regiões'} em lista
        </summary>
        {modo === 'estados' ? (
          <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {UFS.map(({ sigla }) => {
              const e = dados.estados[sigla]
              return (
                <li key={sigla}>
                  <button
                    onClick={() => aoAbrirEstado(sigla)}
                    className="flex w-full items-center gap-2 rounded-lg bg-painel-2 px-2 py-1.5 text-left hover:bg-linha"
                  >
                    <Amostra cor={e?.lider ? corPartido(e.lider.partido) : COR_SEM_DADOS} />
                    <span className="w-6 font-semibold">{sigla}</span>
                    <span className="min-w-0 flex-1 truncate">{e?.lider ? e.lider.partido : '—'}</span>
                    {e?.lider && <span className="text-suave tabular-nums">{fmtPct(e.lider.percentual)}%</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {regioes.map((r) => (
              <li key={r.nome} className="flex items-center gap-2 rounded-lg bg-painel-2 px-2 py-1.5">
                <Amostra cor={r.partido ? corPartido(r.partido) : COR_SEM_DADOS} />
                <span className="w-24 font-semibold">{r.nome}</span>
                <span className="flex-1">{r.partido ?? '—'}</span>
                {r.partido && <span className="text-suave tabular-nums">{fmtPct(r.percentual)}%</span>}
              </li>
            ))}
          </ul>
        )}
      </details>

      {modo === 'regioes' && (
        <p className="mt-3 text-[11px] text-suave">
          Na visão por região, os votos dos estados são somados por partido.
        </p>
      )}
    </div>
  )
}

function Amostra({ cor }: { cor: string }) {
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: cor }} />
}

function LinhaCandidato({ c, suave }: { c: { nome: string; partido: string; percentual: number }; suave?: boolean }) {
  return (
    <p className={`mt-1 flex items-center gap-2 ${suave ? 'text-suave' : ''}`}>
      <Amostra cor={corPartido(c.partido)} />
      <span className="truncate">
        <span className={suave ? '' : 'font-semibold'}>{c.nome}</span> ({c.partido})
      </span>
      <span className="ml-auto tabular-nums">{fmtPct(c.percentual)}%</span>
    </p>
  )
}
