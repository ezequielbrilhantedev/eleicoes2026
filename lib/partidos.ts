// Cores aproximadas das identidades visuais dos partidos, ajustadas para o fundo escuro.
// Os principais (PT, PL, PSD, NOVO, MDB, UNIÃO) foram escolhidos para não se confundirem
// entre si; os demais podem se parecer, por isso o mapa também mostra a sigla em texto.
const CORES_PARTIDOS: Record<string, string> = {
  PT: '#e0303f',
  PL: '#3a7bff',
  PSD: '#f4d03f',
  NOVO: '#ff8c1a',
  MDB: '#2fb35a',
  'UNIÃO': '#22b3c7',
  PSB: '#e45ba8',
  PSDB: '#8ab8ff',
  REPUBLICANOS: '#5b6cff',
  PP: '#4fa3d9',
  PSOL: '#b57bff',
  PDT: '#c94b3b',
  PODE: '#7cc242',
  'MISSÃO': '#d6e23a',
  PCdoB: '#b3262e',
  'PC do B': '#b3262e',
  PV: '#5fbf6b',
  REDE: '#3fae8c',
  CIDADANIA: '#f06292',
  AVANTE: '#ffa94d',
  SOLIDARIEDADE: '#ff7a59',
  PRD: '#6f7fd6',
  DC: '#4a8fe7',
  DEMOCRATA: '#7b9cff',
  AGIR: '#9ccc65',
  MOBILIZA: '#26a69a',
  PRTB: '#43a047',
  PMB: '#ce93d8',
  PSTU: '#ef5350',
  PCO: '#c62828',
  UP: '#e53950',
  PCB: '#d32f2f',
}

/** Paleta de reserva para partidos fora da tabela (mesma da lista de candidatos). */
export const CORES_RESERVA = ['#f5c542', '#4f8cff', '#ef5a6f', '#2fd38a', '#b07cff', '#ff9a3d', '#3fc9e0', '#e86bd0']

export function corPorHash(chave: string) {
  return CORES_RESERVA[[...chave].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % CORES_RESERVA.length]
}

export function corPartido(sigla: string) {
  return CORES_PARTIDOS[sigla] ?? CORES_PARTIDOS[sigla.toUpperCase()] ?? corPorHash(sigla)
}

/** Cor dos estados ainda sem votos. */
export const COR_SEM_DADOS = '#24304f'
