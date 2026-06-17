import { useState, useEffect } from 'react'
import type { Ubicacion } from '../types'
import { BOGOTA } from '../types'

/** Pide permiso de ubicación; si no, usa Bogotá */
export function useUbicacion() {
  const [ubicacion, setUbicacion] = useState<Ubicacion>(BOGOTA)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    if (!navigator.geolocation) {
      setCargando(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lon = pos.coords.longitude
        try {
          const res = await fetch(`/api/ubicacion?lat=${lat}&lon=${lon}`)
          if (res.ok) {
            const data = await res.json()
            setUbicacion({
              lat,
              lon,
              nombre: data.nombre || 'Tu ubicación',
              esUbicacionReal: true,
            })
          } else {
            setUbicacion({ lat, lon, nombre: 'Tu ubicación', esUbicacionReal: true })
          }
        } catch {
          setUbicacion({ lat, lon, nombre: 'Tu ubicación', esUbicacionReal: true })
        }
        setCargando(false)
      },
      () => setCargando(false),
      { timeout: 10000, maximumAge: 600_000 },
    )
  }, [])

  return { ubicacion, cargando }
}
