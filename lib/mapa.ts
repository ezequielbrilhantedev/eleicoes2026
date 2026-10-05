import { REGIOES, type CargoId, type Turno } from './config'
import type { Resultado } from './tse'

export interface CandidatoMapa {
  nome: string
  partido: string
  numero: string
  votos: number
  percentual: number
  eleito: boolean
  segundoTurno: boolean
}

export interface EstadoMapa {
  urnasPct: number
  totalizacaoFinal: boolean
  validos: number
  lider: CandidatoMapa | null
  segundo: CandidatoMapa | null
  /** votos somados por partido, para agregar por região */
  porPartido: Record<string, number>
}

export interface ResultadoMapa {
  cargo: CargoId
  cargoNome: string
  turno: Turno
  atualizadoEm: string
  simulacao: boolean
  /** sigla da UF → resumo; null quando o TSE não tem esse resultado (ou falhou) */
  estados: Record<string, EstadoMapa | null>
}

export interface RegiaoMapa {
  nome: string
  ufs: string[]
  partido: string | null
  votos: number
  percentual: number
  validos: number
}

const resumirCandidato = (c: Resultado['candidatos'][number]): CandidatoMapa => ({
  nome: c.nome,
  partido: c.partido,
  numero: c.numero,
  votos: c.votos,
  percentual: c.percentual,
  eleito: c.eleito,
  segundoTurno: !c.eleito && /2º turno/i.test(c.situacao),
})

export function resumirEstado(r: Resultado): EstadoMapa {
  const porPartido: Record<string, number> = {}
  for (const c of r.candidatos) porPartido[c.partido] = (porPartido[c.partido] ?? 0) + c.votos
  const [primeiro, segundo] = r.candidatos
  const temVotos = (primeiro?.votos ?? 0) > 0
  return {
    urnasPct: r.urnas.percentual,
    totalizacaoFinal: r.totalizacaoFinal,
    validos: r.votos.validos,
    lider: temVotos ? resumirCandidato(primeiro) : null,
    segundo: temVotos && segundo ? resumirCandidato(segundo) : null,
    porPartido,
  }
}

/** Partido com mais votos somados nos estados de cada região. */
export function agregarRegioes(mapa: ResultadoMapa): RegiaoMapa[] {
  return REGIOES.map(({ nome, ufs }) => {
    const soma: Record<string, number> = {}
    let total = 0
    for (const uf of ufs) {
      for (const [partido, votos] of Object.entries(mapa.estados[uf]?.porPartido ?? {})) {
        soma[partido] = (soma[partido] ?? 0) + votos
        total += votos
      }
    }
    const [partido, votos] = Object.entries(soma).sort((a, b) => b[1] - a[1])[0] ?? [null, 0]
    return {
      nome,
      ufs,
      partido: votos > 0 ? partido : null,
      votos,
      percentual: total ? (votos / total) * 100 : 0,
      validos: total,
    }
  })
}
