import { NextResponse, type NextRequest } from 'next/server'
import { CARGOS, cargosDe, type CargoId, type Turno } from '@/lib/config'
import { buscarResultado, NaoDisponivelError } from '@/lib/tse'
import { simular } from '@/lib/simulacao'

// GET /api/resultado?abr=CE&cargo=3&turno=1[&simulacao=1]
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const abr = (p.get('abr') ?? 'BR').toUpperCase()
  const cargo = Number(p.get('cargo') ?? 1) as CargoId
  const turno = (Number(p.get('turno') ?? 1) === 2 ? 2 : 1) as Turno
  const simulacao = p.get('simulacao') === '1'

  if (!/^[A-Z]{2}$/.test(abr) || !(cargo in CARGOS) || !cargosDe(abr).includes(cargo)) {
    return NextResponse.json({ erro: 'Combinação de estado e cargo inválida.' }, { status: 400 })
  }

  const cache = { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=20' }

  if (simulacao) {
    // Tenta usar os candidatos reais; se o TSE não responder, usa fictícios
    const base = await buscarResultado(cargo, abr, turno).catch(() => null)
    return NextResponse.json(simular(cargo, abr, base), { headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    return NextResponse.json(await buscarResultado(cargo, abr, turno), { headers: cache })
  } catch (e) {
    if (e instanceof NaoDisponivelError) {
      return NextResponse.json({ erro: e.message, naoDisponivel: true }, { status: 404, headers: cache })
    }
    return NextResponse.json({ erro: 'Não foi possível falar com o TSE agora. Tentando de novo…' }, { status: 502 })
  }
}
