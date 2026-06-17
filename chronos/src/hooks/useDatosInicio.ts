import { useState, useEffect } from 'react'
import { obtenerDatosInicio, obtenerFotoNasa } from '../lib/api'
import { normalizarClima } from '../lib/clima'
import type { MoonData, WeatherData, ApodData, Holiday, Ubicacion } from '../types'

export function useDatosInicio(ubicacion: Ubicacion) {
  const [luna, setLuna] = useState<MoonData | null>(null)
  const [clima, setClima] = useState<WeatherData | null>(null)
  const [festivosHoy, setFestivosHoy] = useState<Holiday[]>([])
  const [fotoNasa, setFotoNasa] = useState<ApodData | null>(null)
  const [nombreLugar, setNombreLugar] = useState(ubicacion.nombre)
  const [cargando, setCargando] = useState(true)
  const [cargandoNasa, setCargandoNasa] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    setCargando(true)
    setError(null)

    obtenerDatosInicio(ubicacion)
      .then(datos => {
        if (!activo) return
        setLuna(datos.luna)
        setClima(normalizarClima(datos.clima))
        setFestivosHoy(datos.festivos_hoy)
        setNombreLugar(datos.ubicacion?.nombre ?? ubicacion.nombre)
      })
      .catch((e: Error) => {
        if (activo) setError(e.message)
      })
      .finally(() => {
        if (activo) setCargando(false)
      })

    setCargandoNasa(true)
    obtenerFotoNasa()
      .then(foto => { if (activo) setFotoNasa(foto) })
      .catch(() => {})
      .finally(() => { if (activo) setCargandoNasa(false) })

    return () => { activo = false }
  }, [ubicacion.lat, ubicacion.lon, ubicacion.nombre])

  return { luna, clima, festivosHoy, fotoNasa, nombreLugar, cargando, cargandoNasa, error }
}
