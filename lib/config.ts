// Códigos oficiais das Eleições 2026 (arquivo ele-c.json do TSE).
// Se o TSE mudar algo, ajuste aqui ou pelas variáveis de ambiente.
export const TSE_BASE = process.env.TSE_BASE_URL ?? 'https://resultados.tse.jus.br/oficial'
export const CICLO = process.env.TSE_CICLO ?? 'ele2026'

export type Turno = 1 | 2

export const ELEICOES = {
  federal: { 1: process.env.TSE_ELEICAO_FEDERAL_T1 ?? '6257', 2: process.env.TSE_ELEICAO_FEDERAL_T2 ?? '6258' },
  estadual: { 1: process.env.TSE_ELEICAO_ESTADUAL_T1 ?? '6259', 2: process.env.TSE_ELEICAO_ESTADUAL_T2 ?? '6260' },
} as const

export type CargoId = 1 | 3 | 5 | 6 | 7 | 8

export const CARGOS: Record<CargoId, { nome: string; eleicao: keyof typeof ELEICOES }> = {
  1: { nome: 'Presidente', eleicao: 'federal' },
  3: { nome: 'Governador', eleicao: 'estadual' },
  5: { nome: 'Senador', eleicao: 'estadual' },
  6: { nome: 'Deputado Federal', eleicao: 'estadual' },
  7: { nome: 'Deputado Estadual', eleicao: 'estadual' },
  8: { nome: 'Deputado Distrital', eleicao: 'estadual' },
}

export const UFS: { sigla: string; nome: string }[] = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
]

/** Cargos disponíveis para uma abrangência. "BR" só tem Presidente. */
export function cargosDe(abr: string): CargoId[] {
  if (abr === 'BR') return [1]
  return abr === 'DF' ? [1, 3, 5, 6, 8] : [1, 3, 5, 6, 7]
}

/** Cargos que têm visão em mapa (um vencedor por estado). */
export const CARGOS_MAPA: CargoId[] = [1, 3, 5]

export const REGIOES: { nome: string; ufs: string[] }[] = [
  { nome: 'Norte', ufs: ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'] },
  { nome: 'Nordeste', ufs: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'] },
  { nome: 'Centro-Oeste', ufs: ['DF', 'GO', 'MT', 'MS'] },
  { nome: 'Sudeste', ufs: ['ES', 'MG', 'RJ', 'SP'] },
  { nome: 'Sul', ufs: ['PR', 'RS', 'SC'] },
]
