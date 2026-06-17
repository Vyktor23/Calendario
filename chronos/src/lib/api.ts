import type { Holiday, MoonData, ApodData, WeatherData, Ubicacion } from '../types'
import { BOGOTA } from '../types'
import { normalizarClima } from './clima'

const BASE = '/api'

export class ErrorServidor extends Error {
  constructor(mensaje = 'No se pudo conectar con el servidor') {
    super(mensaje)
    this.name = 'ErrorServidor'
  }
}

async function pedir<T>(url: string): Promise<T> {
  let res: Response
  try {
    res = await fetch(url)
  } catch {
    throw new ErrorServidor(
      '¿Está corriendo el servidor? Ejecuta: cd server && uvicorn main:app --reload --port 8000',
    )
  }
  if (!res.ok) {
    const texto = await res.text().catch(() => '')
    throw new Error(`Error ${res.status}: ${texto || 'petición fallida'}`)
  }
  return res.json()
}

export async function verificarServidor(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE}/health`)
    if (res.ok) return true
    // Servidor viejo sin /health — probar ruta raíz
    const root = await fetch('/')
    return root.ok
  } catch {
    return false
  }
}

export interface DatosInicio {
  luna: MoonData
  proxima_luna_llena: MoonData
  clima: WeatherData
  festivos_hoy: Holiday[]
  ubicacion?: { lat: number; lon: number; nombre: string }
}

export interface ResumenDia {
  fecha: string
  clima: WeatherData
  luna: MoonData
  festivos: Holiday[]
}

function paramsUbicacion(u: Ubicacion) {
  return `lat=${u.lat}&lon=${u.lon}`
}

export async function obtenerDatosInicio(ubicacion: Ubicacion = BOGOTA): Promise<DatosInicio> {
  const p = paramsUbicacion(ubicacion)
  try {
    const datos = await pedir<DatosInicio>(`${BASE}/inicio?${p}`)
    return { ...datos, clima: normalizarClima(datos.clima) }
  } catch {
    // Compatibilidad si el servidor no tiene /api/inicio
    const hoy = new Date().toISOString().slice(0, 10)
    const anio = new Date().getFullYear()
    const [lunaRes, clima, festivosRes] = await Promise.all([
      pedir<{ actual: MoonData; proxima_luna_llena: MoonData }>(`${BASE}/luna`).catch(() =>
        pedir<{ current: MoonData; next_full_moon: MoonData }>(`${BASE}/moon`).then(r => ({
          actual: r.current,
          proxima_luna_llena: r.next_full_moon,
        })),
      ),
      pedir<WeatherData>(`${BASE}/clima?${p}`).catch(() =>
        pedir<WeatherData>(`${BASE}/weather?${p}`),
      ),
      obtenerFestivos(anio),
    ])
    return {
      luna: lunaRes.actual,
      proxima_luna_llena: lunaRes.proxima_luna_llena,
      clima: normalizarClima(clima),
      festivos_hoy: festivosRes.festivos.filter(f => f.date === hoy),
      ubicacion: { lat: ubicacion.lat, lon: ubicacion.lon, nombre: ubicacion.nombre },
    }
  }
}

export async function obtenerFestivos(anio: number, pais = 'CO'): Promise<{ festivos: Holiday[] }> {
  try {
    return await pedir(`${BASE}/festivos/${anio}?pais=${pais}`)
  } catch {
    const legacy = await pedir<{ holidays: Holiday[] }>(`${BASE}/holidays/${anio}?country=${pais}`)
    return { festivos: legacy.holidays }
  }
}

export async function obtenerResumenDia(fecha: string, ubicacion: Ubicacion = BOGOTA): Promise<ResumenDia> {
  const p = paramsUbicacion(ubicacion)
  try {
    const resumen = await pedir<ResumenDia>(`${BASE}/dia?d=${fecha}&${p}`)
    return { ...resumen, clima: normalizarClima(resumen.clima) }
  } catch {
    const [clima, lunaRes, festivosRes] = await Promise.all([
      pedir<WeatherData>(`${BASE}/clima?d=${fecha}&${p}`).catch(() =>
        pedir<WeatherData>(`${BASE}/weather?d=${fecha}&${p}`),
      ),
      pedir<{ actual: MoonData }>(`${BASE}/luna?d=${fecha}`).catch(() =>
        pedir<{ current: MoonData }>(`${BASE}/moon?d=${fecha}`).then(r => ({ actual: r.current })),
      ),
      obtenerFestivos(new Date(fecha).getFullYear()),
    ])
    return {
      fecha,
      clima: normalizarClima(clima),
      luna: lunaRes.actual,
      festivos: festivosRes.festivos.filter(f => f.date === fecha),
    }
  }
}

export async function obtenerFotoNasa(fecha?: string): Promise<ApodData> {
  const q = fecha ? `?d=${fecha}` : ''
  try {
    return await pedir(`${BASE}/nasa${q}`)
  } catch {
    return pedir(`${BASE}/nasa/apod${q}`)
  }
}

export const fetchHolidays = obtenerFestivos
