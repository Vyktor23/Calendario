import { useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { X, Plus, Trash2, PartyPopper } from 'lucide-react'
import type { CalendarEvent, Holiday } from '../types'
import { EVENT_COLORS } from '../types'
import { TarjetaFaseLunar } from './TarjetaFaseLunar'

interface DetalleDiaProps {
  fecha: Date
  eventos: CalendarEvent[]
  festivosDelDia: Holiday[]
  onCerrar: () => void
  onAgregarEvento: (evento: Omit<CalendarEvent, 'id'>) => void
  onEliminarEvento: (id: string) => void
}

export function DetalleDia({
  fecha,
  eventos,
  festivosDelDia,
  onCerrar,
  onAgregarEvento,
  onEliminarEvento,
}: DetalleDiaProps) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [hora, setHora] = useState('')
  const [color, setColor] = useState<string>(EVENT_COLORS[0])
  const [descripcion, setDescripcion] = useState('')

  const fechaStr = format(fecha, 'yyyy-MM-dd')

  const guardarEvento = (e: React.FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return
    onAgregarEvento({ title: titulo, date: fechaStr, time: hora, color, description: descripcion })
    setTitulo('')
    setHora('')
    setDescripcion('')
    setMostrarFormulario(false)
  }

  return (
    <div className="detalle-dia">
      <div className="detalle-dia__cabecera">
        <div className="min-w-0">
          <p className="detalle-dia__etiqueta text-xs uppercase tracking-wider">Día seleccionado</p>
          <h2 className="font-[family-name:var(--font-display)] text-base sm:text-lg font-bold capitalize">
            {format(fecha, "EEEE, d 'de' MMMM", { locale: es })}
          </h2>
        </div>
        <button onClick={onCerrar} className="btn-icono shrink-0" aria-label="Cerrar">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="mb-3">
        <TarjetaFaseLunar fecha={fecha} compacta />
      </div>

      {festivosDelDia.length > 0 && (
        <div className="tarjeta-interna p-3 mb-3 border-amber-500/20 bg-amber-500/5">
          <div className="flex items-center gap-2 mb-1">
            <PartyPopper className="w-4 h-4 text-amber-400" />
            <span className="font-medium text-amber-200 text-sm">Festivo</span>
          </div>
          {festivosDelDia.map(f => (
            <p key={f.name} className="text-sm text-slate-200">{f.name}</p>
          ))}
        </div>
      )}

      <div className="detalle-dia__eventos">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-sm">Mis eventos</h3>
          <button
            onClick={() => setMostrarFormulario(!mostrarFormulario)}
            className="flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300"
          >
            <Plus className="w-4 h-4" /> Agregar
          </button>
        </div>

        {mostrarFormulario && (
          <form onSubmit={guardarEvento} className="space-y-3 mb-4">
            <input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Título del evento" className="campo" required />
            <input type="time" value={hora} onChange={e => setHora(e.target.value)} className="campo" />
            <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="Descripción (opcional)" rows={2} className="campo resize-none" />
            <div className="flex gap-2 flex-wrap">
              {EVENT_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)} className={`w-7 h-7 rounded-full ${color === c ? 'ring-2 ring-white scale-110' : ''}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <button type="submit" className="boton-principal w-full">Guardar evento</button>
          </form>
        )}

        {eventos.length === 0 ? (
          <p className="text-sm text-slate-500">Sin eventos este día</p>
        ) : (
          <ul className="space-y-2">
            {eventos.map(ev => (
              <li key={ev.id} className="flex items-center gap-3 tarjeta-interna p-3 group">
                <span className="w-1.5 h-8 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate text-sm">{ev.title}</p>
                  {ev.time && <p className="text-xs text-slate-400">{ev.time}</p>}
                </div>
                <button onClick={() => onEliminarEvento(ev.id)} className="p-2 rounded hover:bg-red-500/20 text-red-400" aria-label="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
