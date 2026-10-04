'use client'

import { useEffect, useRef, useState } from 'react'

/** Número que "conta" do valor anterior até o novo, como no placar da TV. */
export function NumeroAnimado({ valor, casas = 0, duracao = 1100 }: { valor: number; casas?: number; duracao?: number }) {
  const [exibido, setExibido] = useState(valor)
  const de = useRef(valor)

  useEffect(() => {
    const inicio = de.current
    if (inicio === valor) return
    const reduzir = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduzir) {
      de.current = valor
      setExibido(valor)
      return
    }
    const t0 = performance.now()
    let raf = 0
    const passo = (t: number) => {
      const p = Math.min(1, (t - t0) / duracao)
      const e = 1 - Math.pow(1 - p, 3)
      const atual = inicio + (valor - inicio) * e
      de.current = atual
      setExibido(atual)
      if (p < 1) raf = requestAnimationFrame(passo)
    }
    raf = requestAnimationFrame(passo)
    return () => cancelAnimationFrame(raf)
  }, [valor, duracao])

  return (
    <>
      {exibido.toLocaleString('pt-BR', {
        minimumFractionDigits: casas,
        maximumFractionDigits: casas,
      })}
    </>
  )
}
