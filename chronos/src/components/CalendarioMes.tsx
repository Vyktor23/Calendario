import { useMemo } from 'react'
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, isToday, format,
} from 'date-fns'
import { faseLunar, nombreLunaCorto } from '../lib/luna'
import type { CalendarEvent, Holiday } from '../types'

interface CalendarioMesProps {
  fechaActual: Date
  fechaSeleccionada: Date | null
  eventos: CalendarEvent[]
  festivos: Holiday[]
  onSeleccionarDia: (fecha: Date) => void
}

const DIAS_CORTOS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do']
const DIAS_LARGOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export function CalendarioMes({ fechaActual, fechaSeleccionada, eventos, festivos, onSeleccionarDia }: CalendarioMesProps) {
  const inicioMes = startOfMonth(fechaActual)
  const finMes = endOfMonth(fechaActual)
  const inicioCal = startOfWeek(inicioMes, { weekStartsOn: 1 })
  const finCal = endOfWeek(finMes, { weekStartsOn: 1 })
  const dias = eachDayOfInterval({ start: inicioCal, end: finCal })

  const fechasFestivas = useMemo(() => new Set(festivos.map(f => f.date)), [festivos])
  const eventosPorFecha = useMemo(
    () => eventos.reduce<Record<string, CalendarEvent[]>>((acc, e) => {
      (acc[e.date] ??= []).push(e)
      return acc
    }, {}),
    [eventos],
  )

  return (
    <section className="calendario-mes tarjeta">
      <div className="calendario-mes__cabecera-dias">
        {DIAS_LARGOS.map((dia, i) => (
          <span key={dia}>
            <span className="calendario-mes__dia-largo">{dia}</span>
            <span className="calendario-mes__dia-corto">{DIAS_CORTOS[i]}</span>
          </span>
        ))}
      </div>
      <div className="calendario-mes__grilla">
        {dias.map(dia => {
          const fechaStr = format(dia, 'yyyy-MM-dd')
          const eventosDia = eventosPorFecha[fechaStr] ?? []
          const esFestivo = fechasFestivas.has(fechaStr)
          const enMes = isSameMonth(dia, fechaActual)
          const seleccionado = fechaSeleccionada && isSameDay(dia, fechaSeleccionada)
          const esHoy = isToday(dia)
          const luna = enMes ? faseLunar(dia) : null

          return (
            <button
              key={fechaStr}
              type="button"
              onClick={() => onSeleccionarDia(dia)}
              title={luna ? `${fechaStr} · ${luna.name}` : fechaStr}
              className={`
                dia-calendario
                ${!enMes ? 'dia-calendario--fuera' : ''}
                ${seleccionado ? 'dia-calendario--seleccionado' : ''}
                ${esHoy && !seleccionado ? 'dia-calendario--hoy' : ''}
                ${esFestivo && enMes ? 'dia-calendario--festivo' : ''}
              `}
            >
              <span className="dia-calendario__num">{format(dia, 'd')}</span>
              {luna && (
                <span className="dia-calendario__luna">
                  <span className="dia-calendario__luna-emoji" aria-hidden>{luna.emoji}</span>
                  <span className="dia-calendario__luna-nombre">{nombreLunaCorto(luna.name)}</span>
                </span>
              )}
              {(esFestivo || eventosDia.length > 0) && enMes && (
                <span className="dia-calendario__punto" style={{
                  backgroundColor: esFestivo ? '#fbbf24' : eventosDia[0]?.color,
                }} />
              )}
            </button>
          )
        })}
      </div>
    </section>
  )
}
