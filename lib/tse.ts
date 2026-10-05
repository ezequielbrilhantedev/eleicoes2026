import { CARGOS, CICLO, ELEICOES, TSE_BASE, type CargoId, type Turno } from './config'

/* ---------- Formato bruto do TSE (arquivo "-u.json", especificação EA20) ---------- */

interface RawCandidato {
  n: string
  sqcand: string
  nm: string
  nmu: string
  e?: 's' | 'n'
  st?: string
  dvt?: string
  vap: string
  pvap: string
  vs?: { tp: string; nmu: string; sgp: string }[]
}

interface RawPartido {
  n: string
  sg: string
  nm: string
  cand?: RawCandidato[]
}

interface RawAgremiacao {
  n: string
  nm: string
  tp: string
  par?: RawPartido[]
}

interface RawCargo {
  cd: string
  nmn: string
  nv?: string
  agr?: RawAgremiacao[]
}

export interface RawResultado {
  ele: string
  cdabr: string
  dg?: string
  hg?: string
  tf?: 's' | 'n'
  carg: RawCargo[]
  s?: { ts?: string; st?: string; pst?: string }
  e?: { te?: string; c?: string; pc?: string; a?: string; pa?: string }
  v?: { tv?: string; vv?: string; pvv?: string; vb?: string; pvb?: string; tvn?: string; ptvn?: string }
}

/* ---------- Modelo normalizado (o que a tela recebe) ---------- */

export interface Candidato {
  id: string
  numero: string
  nome: string
  nomeCompleto: string
  partido: string
  coligacao: string
  votos: number
  percentual: number
  eleito: boolean
  situacao: string
  vice: string
  foto: string
}

export interface Resultado {
  cargo: CargoId
  cargoNome: string
  abrangencia: string
  vagas: number
  atualizadoEm: string
  totalizacaoFinal: boolean
  urnas: { total: number; apuradas: number; percentual: number }
  eleitorado: { total: number; comparecimento: number; pComparecimento: number; abstencao: number; pAbstencao: number }
  votos: { validos: number; brancos: number; pBrancos: number; nulos: number; pNulos: number }
  candidatos: Candidato[]
  simulacao?: boolean
}

const num = (s?: string) => (s ? Number(String(s).replace(/\./g, '')) || 0 : 0)
const pct = (s?: string) => (s ? Number(String(s).replace(',', '.')) || 0 : 0)

export function codigoEleicao(cargo: CargoId, turno: Turno) {
  return ELEICOES[CARGOS[cargo].eleicao][turno]
}

export function resultadoUrl(cargo: CargoId, abr: string, turno: Turno) {
  const ele = codigoEleicao(cargo, turno)
  const a = abr.toLowerCase()
  return `${TSE_BASE}/${CICLO}/${ele}/dados/${a}/${a}-c${String(cargo).padStart(4, '0')}-e${ele.padStart(6, '0')}-u.json`
}

export function fotoUrl(cargo: CargoId, abr: string, sqcand: string, turno: Turno) {
  return `${TSE_BASE}/${CICLO}/${codigoEleicao(cargo, turno)}/fotos/${abr.toLowerCase()}/${sqcand}.jpeg`
}

export function normalizar(raw: RawResultado, cargo: CargoId, turno: Turno): Resultado {
  const c = raw.carg.find((x) => Number(x.cd) === cargo) ?? raw.carg[0]
  const abr = raw.cdabr ?? 'br'
  const candidatos: Candidato[] = []

  for (const agr of c?.agr ?? []) {
    const coligacao = agr.tp === 'c' || agr.tp === 'f' ? agr.nm : ''
    for (const par of agr.par ?? []) {
      for (const cand of par.cand ?? []) {
        // Candidaturas com voto anulado (indeferidas etc.) não entram na disputa
        if (cand.dvt && /anulad/i.test(cand.dvt)) continue
        const vice = cand.vs?.find((v) => v.tp === 'v' || v.tp === 's1')
        candidatos.push({
          id: cand.sqcand,
          numero: cand.n,
          nome: cand.nmu || cand.nm,
          nomeCompleto: cand.nm,
          partido: par.sg,
          coligacao,
          votos: num(cand.vap),
          percentual: pct(cand.pvap),
          // O campo "e" do TSE vale "s" também para quem vai ao 2º turno; só a situação
          // ("Eleito", "Eleito por QP", "Eleito por média") confirma a eleição.
          eleito: /^eleito/i.test(cand.st ?? ''),
          situacao: cand.st ?? '',
          vice: vice ? `${vice.nmu} (${vice.sgp})` : '',
          foto: fotoUrl(cargo, abr, cand.sqcand, turno),
        })
      }
    }
  }
  candidatos.sort((a, b) => b.votos - a.votos || a.nome.localeCompare(b.nome, 'pt-BR'))

  return {
    cargo,
    cargoNome: c?.nmn ?? CARGOS[cargo].nome,
    abrangencia: abr.toUpperCase(),
    vagas: num(c?.nv) || 1,
    atualizadoEm: raw.dg && raw.hg ? `${raw.dg} ${raw.hg}` : '',
    totalizacaoFinal: raw.tf === 's',
    urnas: { total: num(raw.s?.ts), apuradas: num(raw.s?.st), percentual: pct(raw.s?.pst) },
    eleitorado: {
      total: num(raw.e?.te),
      comparecimento: num(raw.e?.c),
      pComparecimento: pct(raw.e?.pc),
      abstencao: num(raw.e?.a),
      pAbstencao: pct(raw.e?.pa),
    },
    votos: {
      validos: num(raw.v?.vv),
      brancos: num(raw.v?.vb),
      pBrancos: pct(raw.v?.pvb),
      nulos: num(raw.v?.tvn),
      pNulos: pct(raw.v?.ptvn),
    },
    candidatos,
  }
}

export class NaoDisponivelError extends Error {}

export async function buscarResultado(cargo: CargoId, abr: string, turno: Turno): Promise<Resultado> {
  const res = await fetch(resultadoUrl(cargo, abr, turno), {
    // Cache no servidor da Vercel: no máximo 1 requisição ao TSE a cada 10 s por arquivo
    next: { revalidate: 10 },
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'apuracao-2026 (uso pessoal)' },
  })
  if (res.status === 404 || res.status === 403) {
    throw new NaoDisponivelError('O TSE ainda não publicou este resultado.')
  }
  if (!res.ok) throw new Error(`TSE respondeu ${res.status}`)
  return normalizar((await res.json()) as RawResultado, cargo, turno)
}
