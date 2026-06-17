import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isToday, format,
} from 'date-fns'
import { es } from 'date-fns/locale'
import type { CalendarEvent, Holiday } from '../types'

interface MiniMesProps {
  mes: Date
  eventos: CalendarEvent[]
  festivos: Holiday[]
  onSeleccionarDia: (fecha: Date) => void
  onSeleccionarMes: (fecha: Date) => void
}

export function MiniMes({ mes, eventos, festivos, onSeleccionarDia, onSeleccionarMes }: MiniMesProps) {
  const inicioMes = startOfMonth(mes)
  const finMes = endOfMonth(mes)
  const inicioCal = startOfWeek(inicioMes, { weekStartsOn: 1 })
  const finCal = endOfWeek(finMes, { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicioCal, end: finCal })

  const fechasFestivas = new Set(festivos.map(f => f.date))
  const eventosPorFecha = eventos.reduce<Record<string, number>>((acc, e) => {
    acc[e.date] = (acc[e.date] ?? 0) + 1
    return acc
  }, {})

  const numFestivos = festivos.filter(f => f.date.startsWith(format(mes, 'yyyy-MM'))).length

  return (
    <article className="mini-mes">
      <button
        type="button"
        className="mini-mes__cabecera"
        onClick={() => onSeleccionarMes(mes)}
      >
        <h3 className="mini-mes__titulo capitalize">
          {format(mes, 'MMMM', { locale: es })}
        </h3>
        <div className="mini-mes__meta">
          {numFestivos > 0 && (
            <span className="mini-mes__badge mini-mes__badge--festivo">
              {numFestivos} festivo{numFestivos > 1 ? 's' : ''}
            </span>
          )}
          <span className="mini-mes__ir">Ver mes →</span>
        </div>
      </button>

      <div className="mini-mes__cuerpo">
        <div className="mini-mes__dias-semana">
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => (
            <span key={d}>{d}</span>
          ))}
        </div>
        <div className="mini-mes__grilla">
          {dias.map(dia => {
            const fechaStr = format(dia, 'yyyy-MM-dd')
            const enMes = isSameMonth(dia, mes)
            const esHoy = isToday(dia)
            const esFestivo = fechasFestivas.has(fechaStr)
            const numEventos = eventosPorFecha[fechaStr] ?? 0

            return (
              <button
                key={fechaStr}
                type="button"
                onClick={() => onSeleccionarDia(dia)}
                className={`
                  mini-mes__dia
                  ${!enMes ? 'mini-mes__dia--fuera' : ''}
                  ${esHoy ? 'mini-mes__dia--hoy' : ''}
                  ${esFestivo && enMes ? 'mini-mes__dia--festivo' : ''}
                `}
              >
                {format(dia, 'd')}
                {numEventos > 0 && enMes && (
                  <span className="mini-mes__punto mini-mes__punto--evento" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </article>
  )
}
