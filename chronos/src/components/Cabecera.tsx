import { ChevronLeft, ChevronRight, Calendar, Grid3X3, List, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { SelectorTema } from './SelectorTema'
import type { ViewMode } from '../types'
import type { TemaId } from '../lib/temas'

interface CabeceraProps {
  fechaActual: Date
  modoVista: ViewMode
  tema: TemaId
  onCambiarTema: (tema: TemaId) => void
  onCambiarVista: (modo: ViewMode) => void
  onAnterior: () => void
  onSiguiente: () => void
  onHoy: () => void
}

const VISTAS: { modo: ViewMode; icono: typeof Calendar; etiqueta: string }[] = [
  { modo: 'month', icono: Calendar, etiqueta: 'Mes' },
  { modo: 'year', icono: Grid3X3, etiqueta: 'Año' },
  { modo: 'agenda', icono: List, etiqueta: 'Agenda' },
]

export function Cabecera({
  fechaActual, modoVista, tema, onCambiarTema,
  onCambiarVista, onAnterior, onSiguiente, onHoy,
}: CabeceraProps) {
  const titulo = modoVista === 'year'
    ? format(fechaActual, 'yyyy', { locale: es })
    : format(fechaActual, 'MMMM yyyy', { locale: es })

  return (
    <header className="cabecera tarjeta">
      <div className="cabecera__fila-superior">
        <div className="cabecera__marca">
          <div className="cabecera__logo" aria-hidden>
            <Sparkles className="cabecera__logo-icono" />
          </div>
          <div className="cabecera__titulos">
            <h1 className="cabecera__titulo text-gradient capitalize">{titulo}</h1>
            <p className="cabecera__subtitulo">Chronos — Tu calendario inteligente</p>
          </div>
        </div>
        <SelectorTema tema={tema} onCambiar={onCambiarTema} />
      </div>

      <div className="cabecera__controles">
        <nav className="cabecera__vistas tarjeta-interna" aria-label="Vista del calendario">
          {VISTAS.map(({ modo, icono: Icono, etiqueta }) => (
            <button
              key={modo}
              type="button"
              onClick={() => onCambiarVista(modo)}
              className={`cabecera__vista-btn ${modoVista === modo ? 'vista-btn--activa' : 'cabecera__vista-inactiva'}`}
              aria-current={modoVista === modo ? 'page' : undefined}
            >
              <Icono className="cabecera__vista-icono" aria-hidden />
              <span className="cabecera__vista-texto">{etiqueta}</span>
            </button>
          ))}
        </nav>

        <div className="cabecera__nav-fecha">
          <button type="button" onClick={onAnterior} className="btn-icono" aria-label="Anterior">
            <ChevronLeft className="cabecera__nav-icono" />
          </button>
          <button type="button" onClick={onHoy} className="btn-texto cabecera__btn-hoy">Hoy</button>
          <button type="button" onClick={onSiguiente} className="btn-icono" aria-label="Siguiente">
            <ChevronRight className="cabecera__nav-icono" />
          </button>
        </div>
      </div>
    </header>
  )
}
