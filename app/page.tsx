'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CARGOS, CARGOS_MAPA, UFS, cargosDe, type CargoId, type Turno } from '@/lib/config'
import type { Resultado } from '@/lib/tse'
import type { ResultadoMapa } from '@/lib/mapa'
import { CandidatoCard } from '@/components/CandidatoCard'
import { MapaBrasil } from '@/components/MapaBrasil'
import { ApoieProjeto } from '@/components/ApoieProjeto'
import { NumeroAnimado } from '@/components/NumeroAnimado'

const INTERVALO_MS = 15_000
const INTERVALO_SIMULACAO_MS = 5_000
const LIMITE_INICIAL = 30

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; dados: Resultado }
  | { tipo: 'mapa'; dados: ResultadoMapa }
  | { tipo: 'aguardando'; mensagem: string }
  | { tipo: 'erro'; mensagem: string }

type Visao = 'lista' | 'mapa'

const proporcional = (c: CargoId) => c === 6 || c === 7 || c === 8

function lerUrl() {
  if (typeof window === 'undefined') return null
  const p = new URLSearchParams(window.location.search)
  const abr = (p.get('abr') ?? 'BR').toUpperCase()
  const abrValida = abr === 'BR' || UFS.some((u) => u.sigla === abr) ? abr : 'BR'
  const cargo = Number(p.get('cargo') ?? 1) as CargoId
  const visao: Visao = p.get('visao') === 'mapa' ? 'mapa' : 'lista'
  const permitidos = visao === 'mapa' ? CARGOS_MAPA : cargosDe(abrValida)
  return {
    abr: abrValida,
    visao,
    cargo: permitidos.includes(cargo) ? cargo : permitidos[0],
    turno: (p.get('turno') === '2' ? 2 : 1) as Turno,
    simulacao: p.get('simulacao') === '1',
  }
}

export default function Pagina() {
  const [abr, setAbr] = useState('BR')
  const [cargo, setCargo] = useState<CargoId>(1)
  const [turno, setTurno] = useState<Turno>(1)
  const [simulacao, setSimulacao] = useState(false)
  const [visao, setVisao] = useState<Visao>('lista')
  const [pronto, setPronto] = useState(false)
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })
  const [buscadoEm, setBuscadoEm] = useState<number | null>(null)
  const [agora, setAgora] = useState(() => Date.now())
  const [busca, setBusca] = useState('')
  const [limite, setLimite] = useState(LIMITE_INICIAL)

  // Restaura a seleção pela URL (dá para salvar nos favoritos, ex.: ?abr=CE&cargo=3)
  useEffect(() => {
    const u = lerUrl()
    if (u) {
      setAbr(u.abr)
      setCargo(u.cargo)
      setTurno(u.turno)
      setSimulacao(u.simulacao)
      setVisao(u.visao)
    }
    setPronto(true)
  }, [])

  useEffect(() => {
    if (!pronto) return
    const p = new URLSearchParams(visao === 'mapa' ? { visao, cargo: String(cargo) } : { abr, cargo: String(cargo) })
    if (turno === 2) p.set('turno', '2')
    if (simulacao) p.set('simulacao', '1')
    window.history.replaceState(null, '', `?${p}`)
  }, [abr, cargo, turno, simulacao, visao, pronto])

  // Só a resposta da busca mais recente vale (evita uma resposta antiga sobrescrever a nova)
  const ultimaBusca = useRef(0)

  const buscar = useCallback(
    async (silencioso: boolean) => {
      const id = ++ultimaBusca.current
      if (!silencioso) setEstado({ tipo: 'carregando' })
      const p = new URLSearchParams({ abr, cargo: String(cargo), turno: String(turno) })
      if (simulacao) p.set('simulacao', '1')
      try {
        const res = await fetch(visao === 'mapa' ? `/api/mapa?${p}` : `/api/resultado?${p}`, { cache: 'no-store' })
        const json = await res.json()
        if (id !== ultimaBusca.current) return
        if (res.ok) {
          setEstado(visao === 'mapa' ? { tipo: 'mapa', dados: json as ResultadoMapa } : { tipo: 'ok', dados: json as Resultado })
          setBuscadoEm(Date.now())
        } else if (json.naoDisponivel) {
          setEstado({ tipo: 'aguardando', mensagem: json.erro })
          setBuscadoEm(Date.now())
        } else if (!silencioso) {
          setEstado({ tipo: 'erro', mensagem: json.erro ?? 'Erro ao buscar os dados.' })
        }
      } catch {
        if (id === ultimaBusca.current && !silencioso) setEstado({ tipo: 'erro', mensagem: 'Sem conexão. Tentando de novo…' })
      }
    },
    [abr, cargo, turno, simulacao, visao],
  )

  // Busca inicial + atualização periódica (pausa quando a aba está escondida)
  useEffect(() => {
    if (!pronto) return
    buscar(false)
    setLimite(LIMITE_INICIAL)
    setBusca('')
    const intervalo = simulacao ? INTERVALO_SIMULACAO_MS : INTERVALO_MS
    const id = setInterval(() => {
      if (!document.hidden) buscar(true)
    }, intervalo)
    const aoVoltar = () => !document.hidden && buscar(true)
    document.addEventListener('visibilitychange', aoVoltar)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', aoVoltar)
    }
  }, [buscar, pronto, simulacao])

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  function trocarAbr(nova: string) {
    setAbr(nova)
    const permitidos = cargosDe(nova)
    if (!permitidos.includes(cargo)) setCargo(nova === 'BR' ? 1 : 3)
    else if (abr === 'BR' && nova !== 'BR') setCargo(3) // ao escolher um estado, começa por Governador
  }

  function trocarVisao(nova: Visao) {
    setVisao(nova)
    if (nova === 'mapa' && !CARGOS_MAPA.includes(cargo)) setCargo(1)
    if (nova === 'lista' && !cargosDe(abr).includes(cargo)) setCargo(cargosDe(abr)[0])
  }

  // Clique num estado do mapa: abre a lista daquele estado no mesmo cargo
  function abrirEstado(uf: string) {
    setAbr(uf)
    setVisao('lista')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const dados = estado.tipo === 'ok' ? estado.dados : null
  const mapa = estado.tipo === 'mapa' ? estado.dados : null
  const aoVivo =
    (!!dados && !dados.totalizacaoFinal && dados.urnas.percentual > 0) ||
    (!!mapa && Object.values(mapa.estados).some((e) => e && e.urnasPct > 0 && !e.totalizacaoFinal))

  const lista = useMemo(() => {
    if (!dados) return []
    const termo = busca
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
    if (!termo) return dados.candidatos
    return dados.candidatos.filter((c) =>
      `${c.nome} ${c.nomeCompleto} ${c.partido} ${c.numero}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .includes(termo),
    )
  }, [dados, busca])

  const escala = dados
    ? proporcional(dados.cargo)
      ? Math.max(0.0001, dados.candidatos[0]?.percentual ?? 0)
      : 100
    : 100

  const nomeLocal = abr === 'BR' ? 'Brasil' : UFS.find((u) => u.sigla === abr)?.nome ?? abr
  const segundos = buscadoEm ? Math.max(0, Math.round((agora - buscadoEm) / 1000)) : null

  return (
    <main className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:pt-10">
      {/* Cabeçalho */}
      <header className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Apuração 2026</h1>
          <p className="text-xs text-suave sm:text-sm">Dados oficiais do TSE · {turno}º turno</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          {simulacao ? (
            <span className="rounded-full bg-ouro/15 px-2.5 py-1 font-semibold text-ouro">SIMULAÇÃO</span>
          ) : aoVivo ? (
            <span className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 font-semibold text-red-400">
              <span className="ao-vivo h-2 w-2 rounded-full bg-red-500" /> AO VIVO
            </span>
          ) : null}
        </div>
      </header>

      {/* Seletores */}
      <section className="mb-5 space-y-3 rounded-2xl border border-linha bg-painel p-3 sm:p-4">
        <div className="grid grid-cols-2 rounded-xl bg-painel-2 p-1 text-sm">
          {(['lista', 'mapa'] as Visao[]).map((v) => (
            <button
              key={v}
              onClick={() => trocarVisao(v)}
              className={`rounded-lg py-1.5 font-medium transition ${v === visao ? 'bg-ouro text-fundo' : 'text-suave hover:text-texto'}`}
            >
              {v === 'lista' ? '📋 Lista' : '🗺️ Mapa por estado'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {visao === 'lista' && (
            <label className="flex-1 min-w-[180px]">
              <span className="mb-1 block text-xs text-suave">Local</span>
              <select
                value={abr}
                onChange={(e) => trocarAbr(e.target.value)}
                className="w-full rounded-xl border border-linha bg-painel-2 px-3 py-2.5 text-sm font-medium outline-none focus:border-ouro/60"
              >
                <option value="BR">🇧🇷 Brasil (Presidente)</option>
                {UFS.map((u) => (
                  <option key={u.sigla} value={u.sigla}>
                    {u.sigla} · {u.nome}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className={visao === 'mapa' ? 'flex-1' : 'w-[130px]'}>
            <span className="mb-1 block text-xs text-suave">Turno</span>
            <select
              value={turno}
              onChange={(e) => setTurno(Number(e.target.value) as Turno)}
              className="w-full rounded-xl border border-linha bg-painel-2 px-3 py-2.5 text-sm font-medium outline-none focus:border-ouro/60"
            >
              <option value={1}>1º turno</option>
              <option value={2}>2º turno</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {(visao === 'mapa' ? CARGOS_MAPA : cargosDe(abr)).map((c) => (
            <button
              key={c}
              onClick={() => setCargo(c)}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                c === cargo ? 'bg-ouro text-fundo' : 'bg-painel-2 text-suave hover:text-texto'
              }`}
            >
              {CARGOS[c].nome}
            </button>
          ))}
        </div>
      </section>

      {/* Título da disputa + resumo */}
      <section className="mb-4">
        <h2 className="text-lg font-semibold sm:text-xl">
          {CARGOS[cargo].nome}{' '}
          <span className="text-suave">· {visao === 'mapa' ? 'Brasil, quem lidera em cada estado' : nomeLocal}</span>
        </h2>

        {dados && (
          <div className="mt-3 rounded-2xl border border-linha bg-painel p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-suave">Seções totalizadas</p>
                <p className="text-3xl font-bold tabular-nums">
                  <NumeroAnimado valor={dados.urnas.percentual} casas={2} />
                  <span className="text-lg text-suave">%</span>
                </p>
              </div>
              <p className="text-right text-xs text-suave tabular-nums">
                <NumeroAnimado valor={dados.urnas.apuradas} /> de {dados.urnas.total.toLocaleString('pt-BR')}
                <br />
                {dados.totalizacaoFinal ? 'Totalização final' : dados.atualizadoEm && `${dados.simulacao ? 'Simulado' : 'TSE'}: ${dados.atualizadoEm}`}
              </p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
              <div className="barra h-full rounded-full bg-verde" style={{ width: `${dados.urnas.percentual}%` }} />
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="rounded-xl bg-painel-2 p-2">
                <dt className="text-suave">Comparecimento</dt>
                <dd className="font-semibold tabular-nums">{dados.eleitorado.pComparecimento.toLocaleString('pt-BR')}%</dd>
                <dd className="mt-0.5 text-[11px] text-suave tabular-nums">
                  <NumeroAnimado valor={dados.eleitorado.comparecimento} /> eleitores
                </dd>
              </div>
              <div className="rounded-xl bg-painel-2 p-2">
                <dt className="text-suave">Brancos</dt>
                <dd className="font-semibold tabular-nums">{dados.votos.pBrancos.toLocaleString('pt-BR')}%</dd>
                <dd className="mt-0.5 text-[11px] text-suave tabular-nums">
                  <NumeroAnimado valor={dados.votos.brancos} /> votos
                </dd>
              </div>
              <div className="rounded-xl bg-painel-2 p-2">
                <dt className="text-suave">Nulos</dt>
                <dd className="font-semibold tabular-nums">{dados.votos.pNulos.toLocaleString('pt-BR')}%</dd>
                <dd className="mt-0.5 text-[11px] text-suave tabular-nums">
                  <NumeroAnimado valor={dados.votos.nulos} /> votos
                </dd>
              </div>
            </dl>
            {proporcional(dados.cargo) && (
              <p className="mt-3 text-xs text-suave">
                {dados.vagas > 1 && `${dados.vagas} vagas. `}A eleição para deputado é proporcional (quociente eleitoral), então a ordem de
                votos não define sozinha quem é eleito.
              </p>
            )}
          </div>
        )}
      </section>

      {/* Lista de candidatos */}
      {estado.tipo === 'carregando' && (
        <ul className="space-y-3">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className="h-[92px] animate-pulse rounded-2xl border border-linha bg-painel" />
          ))}
        </ul>
      )}

      {mapa && <MapaBrasil dados={mapa} aoAbrirEstado={abrirEstado} />}

      {estado.tipo === 'aguardando' && (
        <div className="rounded-2xl border border-linha bg-painel p-6 text-center">
          <p className="text-3xl">🗳️</p>
          <p className="mt-2 font-semibold">Aguardando o TSE</p>
          <p className="mt-1 text-sm text-suave">
            A divulgação começa às 17h (horário de Brasília), quando a votação termina. Esta tela consulta o TSE
            sozinha a cada 15 segundos.
          </p>
          <button
            onClick={() => setSimulacao(true)}
            className="mt-4 rounded-full bg-ouro px-4 py-2 text-sm font-semibold text-fundo"
          >
            Ver uma simulação enquanto isso
          </button>
        </div>
      )}

      {estado.tipo === 'erro' && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
          {estado.mensagem}
        </div>
      )}

      {dados && (
        <>
          {proporcional(dados.cargo) && (
            <input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder={`Buscar entre ${dados.candidatos.length.toLocaleString('pt-BR')} candidatos (nome, partido ou número)`}
              className="mb-3 w-full rounded-xl border border-linha bg-painel px-3 py-2.5 text-sm outline-none placeholder:text-suave focus:border-ouro/60"
            />
          )}
          <ul className="space-y-3">
            {lista.slice(0, limite).map((c) => (
              <CandidatoCard
                key={c.id}
                c={c}
                posicao={dados.candidatos.indexOf(c) + 1}
                escala={escala}
                aoVivo={aoVivo || !!dados.simulacao}
                destaque={dados.candidatos.indexOf(c) === 0 && c.votos > 0}
              />
            ))}
          </ul>
          {lista.length > limite && (
            <button
              onClick={() => setLimite((l) => l + 50)}
              className="mt-4 w-full rounded-xl border border-linha bg-painel py-2.5 text-sm font-medium text-suave hover:text-texto"
            >
              Mostrar mais ({(lista.length - limite).toLocaleString('pt-BR')} restantes)
            </button>
          )}
          {lista.length === 0 && <p className="text-center text-sm text-suave">Nenhum candidato encontrado.</p>}
        </>
      )}

      {/* Rodapé */}
      <footer className="mt-8 flex flex-wrap items-center justify-between gap-3 text-xs text-suave">
        <span>
          {segundos !== null && `Atualizado há ${segundos}s · `}
          atualiza a cada {simulacao ? 5 : 15}s
        </span>
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={simulacao}
            onChange={(e) => setSimulacao(e.target.checked)}
            className="accent-[#f5c542]"
          />
          Modo simulação
        </label>
      </footer>
      <p className="mt-3 text-[11px] text-suave/70">
        Projeto pessoal, sem vínculo com a Justiça Eleitoral. Fonte: resultados.tse.jus.br.
        Mapa: SVG Maps (CC BY 4.0).
      </p>
      <p className="mt-3 text-center text-xs text-suave">
        Feito por:{' '}
        <a
          href="https://www.instagram.com/ezequielbrilhante.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-ouro hover:underline"
        >
          @ezequielbrilhante.dev
        </a>
      </p>
      <ApoieProjeto />
    </main>
  )
}
