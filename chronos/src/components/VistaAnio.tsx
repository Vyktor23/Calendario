import { eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns'
import { MiniMes } from './MiniMes'
import type { CalendarEvent, Holiday } from '../types'

interface VistaAnioProps {
  anio: number
  eventos: CalendarEvent[]
  festivos: Holiday[]
  onSeleccionarDia: (fecha: Date) => void
  onSeleccionarMes: (fecha: Date) => void
}

export function VistaAnio({ anio, eventos, festivos, onSeleccionarDia, onSeleccionarMes }: VistaAnioProps) {
  const meses = eachMonthOfInterval({
    start: startOfYear(new Date(anio, 0, 1)),
    end: endOfYear(new Date(anio, 0, 1)),
  })

  return (
    <div className="vista-anio">
      {meses.map(mes => (
        <MiniMes
          key={mes.toISOString()}
          mes={mes}
          eventos={eventos}
          festivos={festivos}
          onSeleccionarDia={onSeleccionarDia}
          onSeleccionarMes={onSeleccionarMes}
        />
      ))}
    </div>
  )
}
