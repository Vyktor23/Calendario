import { useEffect } from 'react'
import { DetalleDia } from './DetalleDia'
import type { CalendarEvent, Holiday } from '../types'

interface ModalDiaProps {
  fecha: Date
  eventos: CalendarEvent[]
  festivosDelDia: Holiday[]
  onCerrar: () => void
  onAgregarEvento: (evento: Omit<CalendarEvent, 'id'>) => void
  onEliminarEvento: (id: string) => void
}

/** Modal centrado en pantalla para el detalle del día */
export function ModalDia(props: ModalDiaProps) {
  const { onCerrar } = props

  useEffect(() => {
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const cerrarConEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
    }
    window.addEventListener('keydown', cerrarConEscape)

    return () => {
      document.body.style.overflow = anterior
      window.removeEventListener('keydown', cerrarConEscape)
    }
  }, [onCerrar])

  return (
    <div className="modal-dia" role="dialog" aria-modal="true" aria-label="Detalle del día">
      <div className="modal-dia__fondo" onClick={onCerrar} aria-hidden="true" />
      <div className="modal-dia__contenido">
        <DetalleDia {...props} />
      </div>
    </div>
  )
}
