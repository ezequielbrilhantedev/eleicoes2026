import { CARGOS, type CargoId } from './config'
import type { Candidato, Resultado } from './tse'

/**
 * Modo simulação: gera uma apuração fictícia que avança com o tempo
 * (ciclo de 4 minutos), para testar a tela antes das 17h.
 * Se o TSE já tiver publicado a lista de candidatos (com votos zerados),
 * usa os candidatos reais; senão, usa candidatos fictícios.
 */
const CICLO_MS = 4 * 60 * 1000

function hash(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967295
}

const PARTIDOS = ['PAZ', 'AVANTE', 'NOVO RUMO', 'PROGRESSO', 'UNIÃO', 'TRABALHO', 'FUTURO', 'VERDE']
const NOMES = ['Ana Ribeiro', 'Carlos Menezes', 'Fernanda Lima', 'João Batista', 'Marta Souza', 'Paulo Henrique', 'Rita Alves', 'Sérgio Nunes']

function ficticios(cargo: CargoId, abr: string): Candidato[] {
  const qtd = cargo === 1 || cargo === 3 || cargo === 5 ? 6 : 8
  return Array.from({ length: qtd }, (_, i) => ({
    id: `sim-${abr}-${cargo}-${i}`,
    numero: String(10 + i * 7),
    nome: NOMES[i % NOMES.length],
    nomeCompleto: NOMES[i % NOMES.length],
    partido: PARTIDOS[i % PARTIDOS.length],
    coligacao: '',
    votos: 0,
    percentual: 0,
    eleito: false,
    situacao: '',
    vice: '',
    foto: '',
  }))
}

export function simular(cargo: CargoId, abr: string, base?: Resultado | null): Resultado {
  const agora = Date.now()
  const t = (agora % CICLO_MS) / CICLO_MS // 0..1
  const progresso = Math.min(1, t * 1.15) // chega a 100% um pouco antes do fim do ciclo

  const lista = base?.candidatos.length ? base.candidatos : ficticios(cargo, abr)
  const eleitores = base?.eleitorado.total || 6_000_000 + Math.round(hash(abr) * 20_000_000)
  const comparecimento = Math.round(eleitores * 0.79 * progresso)
  const validos = Math.round(comparecimento * 0.93)

  // Peso de cada candidato: estável + uma oscilação que diminui conforme a apuração avança
  const pesos = lista.map((c, i) => {
    const forca = Math.pow(hash(c.id + cargo), 2.2) + (i < 2 ? 0.35 : 0)
    const ruido = Math.sin(agora / 9000 + hash(c.id) * 10) * 0.08 * (1 - progresso)
    return Math.max(0.002, forca + ruido)
  })
  const soma = pesos.reduce((a, b) => a + b, 0)

  const candidatos = lista
    .map((c, i) => {
      const votos = Math.round((pesos[i] / soma) * validos)
      return { ...c, votos, percentual: validos ? (votos / validos) * 100 : 0, eleito: false }
    })
    .sort((a, b) => b.votos - a.votos)

  const totalUrnas = Math.round(eleitores / 300)
  const ts = new Date(agora)
  return {
    cargo,
    cargoNome: base?.cargoNome ?? CARGOS[cargo].nome,
    abrangencia: abr,
    vagas: base?.vagas ?? 1,
    atualizadoEm: ts.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
    totalizacaoFinal: false,
    urnas: { total: totalUrnas, apuradas: Math.round(totalUrnas * progresso), percentual: progresso * 100 },
    eleitorado: {
      total: eleitores,
      comparecimento,
      pComparecimento: progresso ? 79 : 0,
      abstencao: progresso ? Math.round(eleitores * 0.21 * progresso) : 0,
      pAbstencao: progresso ? 21 : 0,
    },
    votos: {
      validos,
      brancos: Math.round(comparecimento * 0.025),
      pBrancos: progresso ? 2.5 : 0,
      nulos: Math.round(comparecimento * 0.045),
      pNulos: progresso ? 4.5 : 0,
    },
    candidatos,
    simulacao: true,
  }
}
