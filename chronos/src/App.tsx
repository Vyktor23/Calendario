import { useState, useCallback, useMemo } from 'react'
import {
  addMonths, subMonths, addYears, subYears,
  format,
} from 'date-fns'
import { FondoCosmico } from './components/FondoCosmico'
import { Cabecera } from './components/Cabecera'
import { CalendarioMes } from './components/CalendarioMes'
import { ModalDia } from './components/ModalDia'
import { VistaAnio } from './components/VistaAnio'
import { VistaAgenda } from './components/VistaAgenda'
import { PanelLateral } from './components/PanelLateral'
import { AvisoServidor } from './components/AvisoServidor'
import { PantallaCarga } from './components/PantallaCarga'
import { useEvents } from './hooks/useEvents'
import { useUbicacion } from './hooks/useUbicacion'
import { useCargaInicial } from './hooks/useCargaInicial'
import { useTema } from './hooks/useTema'
import type { ViewMode } from './types'

export default function App() {
  const [fechaActual, setFechaActual] = useState(new Date())
  const [fechaSeleccionada, setFechaSeleccionada] = useState<Date | null>(null)
  const [modoVista, setModoVista] = useState<ViewMode>('month')
  const { ubicacion, cargando: cargandoUbicacion } = useUbicacion()
  const { events, addEvent, deleteEvent, getEventsForDate } = useEvents()

  const { tema, setTema } = useTema()
  const anio = fechaActual.getFullYear()
  const { listo, festivos, servidorOk } = useCargaInicial(ubicacion, cargandoUbicacion, anio)

  const irAnterior = useCallback(() => {
    setFechaActual(prev => modoVista === 'year' ? subYears(prev, 1) : subMonths(prev, 1))
  }, [modoVista])

  const irSiguiente = useCallback(() => {
    setFechaActual(prev => modoVista === 'year' ? addYears(prev, 1) : addMonths(prev, 1))
  }, [modoVista])

  const irHoy = useCallback(() => {
    setFechaActual(new Date())
    setFechaSeleccionada(null)
    setModoVista('month')
  }, [])

  /** Abre el modal del día sin cambiar la vista actual */
  const abrirDia = useCallback((fecha: Date) => {
    setFechaSeleccionada(fecha)
  }, [])

  const seleccionarMes = useCallback((fecha: Date) => {
    setFechaActual(fecha)
    setModoVista('month')
    setFechaSeleccionada(null)
  }, [])

  const cerrarModal = useCallback(() => setFechaSeleccionada(null), [])

  const fechaStr = fechaSeleccionada ? format(fechaSeleccionada, 'yyyy-MM-dd') : ''
  const eventosDia = fechaSeleccionada ? getEventsForDate(fechaStr) : []

  const festivosDelDia = useMemo(
    () => festivos.filter(f => f.date === fechaStr),
    [festivos, fechaStr],
  )

  const lugar = ubicacion.esUbicacionReal ? ubicacion.nombre : 'Bogotá'

  if (!listo) {
    return (
      <div className="app">
        <FondoCosmico />
        <PantallaCarga />
      </div>
    )
  }

  return (
    <div className="app">
      <FondoCosmico />

      <div className="app__contenido">
        <AvisoServidor visible={!servidorOk} />

        <Cabecera
          fechaActual={fechaActual}
          modoVista={modoVista}
          tema={tema}
          onCambiarTema={setTema}
          onCambiarVista={setModoVista}
          onAnterior={irAnterior}
          onSiguiente={irSiguiente}
          onHoy={irHoy}
        />

        <div className="app__layout">
          <main className="app__principal">
            {modoVista === 'month' && (
              <CalendarioMes
                fechaActual={fechaActual}
                fechaSeleccionada={fechaSeleccionada}
                eventos={events}
                festivos={festivos}
                onSeleccionarDia={abrirDia}
              />
            )}

            {modoVista === 'year' && (
              <VistaAnio
                anio={anio}
                eventos={events}
                festivos={festivos}
                onSeleccionarDia={abrirDia}
                onSeleccionarMes={seleccionarMes}
              />
            )}

            {modoVista === 'agenda' && (
              <VistaAgenda
                eventos={events}
                festivos={festivos}
                onSeleccionarDia={abrirDia}
              />
            )}
          </main>

          <PanelLateral ubicacion={ubicacion} cargandoUbicacion={false} lugar={lugar} />
        </div>

        {fechaSeleccionada && (
          <ModalDia
            fecha={fechaSeleccionada}
            eventos={eventosDia}
            festivosDelDia={festivosDelDia}
            onCerrar={cerrarModal}
            onAgregarEvento={addEvent}
            onEliminarEvento={deleteEvent}
          />
        )}

      </div>
    </div>
  )
}
