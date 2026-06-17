import { useState, useMemo } from 'react'
import { format, parseISO, compareAsc, isAfter, startOfDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Calendar, PartyPopper } from 'lucide-react'
import { faseLunar } from '../lib/luna'
import type { CalendarEvent, Holiday } from '../types'

const POR_PAGINA = 8

interface VistaAgendaProps {
  eventos: CalendarEvent[]
  festivos: Holiday[]
  onSeleccionarDia: (fecha: Date) => void
}

interface PaginacionProps {
  pagina: number
  total: number
  porPagina: number
  onCambiar: (p: number) => void
}

function Paginacion({ pagina, total, porPagina, onCambiar }: PaginacionProps) {
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  if (total === 0) return null

  return (
    <div className="vista-agenda__paginacion">
      <button
        type="button"
        className="vista-agenda__nav"
        onClick={() => onCambiar(pagina - 1)}
        disabled={pagina <= 0}
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="vista-agenda__pagina-info">
        {pagina + 1} / {totalPaginas}
        <span className="vista-agenda__pagina-total"> · {total} en total</span>
      </span>
      <button
        type="button"
        className="vista-agenda__nav"
        onClick={() => onCambiar(pagina + 1)}
        disabled={pagina >= totalPaginas - 1}
        aria-label="Página siguiente"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function rebanar<T>(items: T[], pagina: number, porPagina: number): T[] {
  const inicio = pagina * porPagina
  return items.slice(inicio, inicio + porPagina)
}

export function VistaAgenda({ eventos, festivos, onSeleccionarDia }: VistaAgendaProps) {
  const hoy = startOfDay(new Date())
  const [paginaEventos, setPaginaEventos] = useState(0)
  const [paginaFestivos, setPaginaFestivos] = useState(0)

  const eventosProximos = useMemo(
    () => eventos
      .filter(e => !isAfter(hoy, parseISO(e.date)))
      .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date))),
    [eventos, hoy],
  )

  const festivosProximos = useMemo(
    () => festivos
      .filter(f => !isAfter(hoy, parseISO(f.date)))
      .sort((a, b) => compareAsc(parseISO(a.date), parseISO(b.date))),
    [festivos, hoy],
  )

  const eventosPagina = rebanar(eventosProximos, paginaEventos, POR_PAGINA)
  const festivosPagina = rebanar(festivosProximos, paginaFestivos, POR_PAGINA)

  return (
    <section className="vista-agenda tarjeta">
      <h2 className="vista-agenda__titulo">Agenda</h2>

      {/* Mis eventos */}
      <div className="vista-agenda__seccion">
        <div className="vista-agenda__seccion-cabecera">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <h3 className="vista-agenda__seccion-titulo">Mis eventos</h3>
          <span className="vista-agenda__contador">{eventosProximos.length}</span>
        </div>

        {eventosProximos.length === 0 ? (
          <p className="vista-agenda__vacio">No tienes eventos próximos</p>
        ) : (
          <>
            <ul className="vista-agenda__lista">
              {eventosPagina.map(ev => {
                const luna = faseLunar(parseISO(ev.date))
                return (
                  <li key={ev.id}>
                    <button
                      type="button"
                      onClick={() => onSeleccionarDia(parseISO(ev.date))}
                      className="vista-agenda__item"
                    >
                      <span className="vista-agenda__barra" style={{ backgroundColor: ev.color }} />
                      <span className="vista-agenda__luna" title={luna.name}>
                        {luna.emoji}
                      </span>
                      <span className="vista-agenda__info">
                        <span className="vista-agenda__nombre">{ev.title}</span>
                        <span className="vista-agenda__fecha capitalize">
                          {format(parseISO(ev.date), "EEEE d 'de' MMMM", { locale: es })}
                          {ev.time ? ` · ${ev.time}` : ''}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <Paginacion
              pagina={paginaEventos}
              total={eventosProximos.length}
              porPagina={POR_PAGINA}
              onCambiar={setPaginaEventos}
            />
          </>
        )}
      </div>

      {/* Festivos */}
      <div className="vista-agenda__seccion vista-agenda__seccion--festivos">
        <div className="vista-agenda__seccion-cabecera">
          <PartyPopper className="w-4 h-4 text-amber-400" />
          <h3 className="vista-agenda__seccion-titulo">Festivos</h3>
          <span className="vista-agenda__contador vista-agenda__contador--festivo">{festivosProximos.length}</span>
        </div>

        {festivosProximos.length === 0 ? (
          <p className="vista-agenda__vacio">No hay festivos próximos</p>
        ) : (
          <>
            <ul className="vista-agenda__lista">
              {festivosPagina.map(f => {
                const luna = faseLunar(parseISO(f.date))
                return (
                  <li key={`${f.date}-${f.name}`}>
                    <button
                      type="button"
                      onClick={() => onSeleccionarDia(parseISO(f.date))}
                      className="vista-agenda__item vista-agenda__item--festivo"
                    >
                      <span className="vista-agenda__barra vista-agenda__barra--festivo" />
                      <span className="vista-agenda__luna" title={luna.name}>
                        {luna.emoji}
                      </span>
                      <span className="vista-agenda__info">
                        <span className="vista-agenda__nombre">{f.name}</span>
                        <span className="vista-agenda__fecha capitalize">
                          {format(parseISO(f.date), "EEEE d 'de' MMMM", { locale: es })}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <Paginacion
              pagina={paginaFestivos}
              total={festivosProximos.length}
              porPagina={POR_PAGINA}
              onCambiar={setPaginaFestivos}
            />
          </>
        )}
      </div>
    </section>
  )
}
