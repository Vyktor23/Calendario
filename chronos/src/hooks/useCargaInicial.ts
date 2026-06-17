import { useState, useEffect } from 'react'
import { obtenerFestivos, obtenerDatosInicio, obtenerFotoNasa, verificarServidor } from '../lib/api'
import type { Holiday, Ubicacion } from '../types'

const TIEMPO_MINIMO_MS = 800

/** Espera a que carguen festivos, ubicación y datos del panel */
export function useCargaInicial(ubicacion: Ubicacion, cargandoUbicacion: boolean, anio: number) {
  const [listo, setListo] = useState(false)
  const [festivos, setFestivos] = useState<Holiday[]>([])
  const [servidorOk, setServidorOk] = useState(true)

  useEffect(() => {
    if (cargandoUbicacion) return

    let activo = true
    setListo(false)
    const inicio = Date.now()

    Promise.all([
      obtenerFestivos(anio)
        .then(d => d.festivos)
        .catch(() => [] as Holiday[]),
      verificarServidor().catch(() => false),
      obtenerDatosInicio(ubicacion).catch(() => null),
      obtenerFotoNasa().catch(() => null),
    ]).then(([festivosData, srv]) => {
      if (!activo) return
      setFestivos(festivosData)
      setServidorOk(srv)
    }).finally(() => {
      const espera = Math.max(0, TIEMPO_MINIMO_MS - (Date.now() - inicio))
      setTimeout(() => {
        if (activo) setListo(true)
      }, espera)
    })

    return () => { activo = false }
  }, [anio, cargandoUbicacion, ubicacion.lat, ubicacion.lon])

  return { listo, festivos, servidorOk }
}
