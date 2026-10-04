import { NextResponse, type NextRequest } from 'next/server'
import { CARGOS, CARGOS_MAPA, UFS, type CargoId, type Turno } from '@/lib/config'
import { buscarResultado } from '@/lib/tse'
import { simular } from '@/lib/simulacao'
import { resumirEstado, type ResultadoMapa } from '@/lib/mapa'

// GET /api/mapa?cargo=1&turno=1[&simulacao=1]
// Busca o resultado do cargo nos 27 estados e devolve só o resumo de cada um.
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const cargo = Number(p.get('cargo') ?? 1) as CargoId
  const turno = (Number(p.get('turno') ?? 1) === 2 ? 2 : 1) as Turno
  const simulacao = p.get('simulacao') === '1'

  if (!CARGOS_MAPA.includes(cargo)) {
    return NextResponse.json({ erro: 'O mapa está disponível para Presidente, Governador e Senador.' }, { status: 400 })
  }

  const resultados = await Promise.allSettled(
    UFS.map(async ({ sigla }) => {
      if (!simulacao) return buscarResultado(cargo, sigla, turno)
      const base = await buscarResultado(cargo, sigla, turno).catch(() => null)
      return simular(cargo, sigla, base)
    }),
  )

  const estados: ResultadoMapa['estados'] = {}
  // Horário mais recente entre os estados ("dd/mm/aaaa hh:mm:ss" → comparável como "aaaammdd hh:mm:ss")
  const ordenavel = (s: string) => s.replace(/^(\d{2})\/(\d{2})\/(\d{4})/, '$3$2$1')
  let atualizadoEm = ''
  resultados.forEach((r, i) => {
    estados[UFS[i].sigla] = r.status === 'fulfilled' ? resumirEstado(r.value) : null
    if (r.status === 'fulfilled' && ordenavel(r.value.atualizadoEm) > ordenavel(atualizadoEm)) {
      atualizadoEm = r.value.atualizadoEm
    }
  })

  if (!simulacao && Object.values(estados).every((e) => e === null)) {
    return NextResponse.json(
      { erro: 'O TSE ainda não publicou este resultado.', naoDisponivel: true },
      { status: 404, headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' } },
    )
  }

  const corpo: ResultadoMapa = { cargo, cargoNome: CARGOS[cargo].nome, turno, atualizadoEm, simulacao, estados }
  return NextResponse.json(corpo, {
    headers: { 'Cache-Control': simulacao ? 'no-store' : 'public, s-maxage=10, stale-while-revalidate=20' },
  })
}
