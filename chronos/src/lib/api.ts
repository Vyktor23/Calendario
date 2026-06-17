import type { Holiday, MoonData, ApodData, WeatherData, Ubicacion } from '../types'
import { BOGOTA } from '../types'
import { normalizarClima } from './clima'
import { faseLunar } from './luna'
import {
  climaDirecto,
  datosInicioDirecto,
  festivosDirecto,
  fotoNasaDirecta,
} from './api-directo'

/** Origen del backend. Vacío = mismo origen (/api, proxy de Vite en desarrollo). */
function origenApi(): string {
  const url = import.meta.env.VITE_API_URL?.trim()
  return url ? url.replace(/\/$/, '') : ''
}

function baseApi(): string {
  const origen = origenApi()
  return origen ? `${origen}/api` : '/api'
}

export class ErrorServidor extends Error {
  constructor(mensaje = 'No se pudo conectar con el servidor') {
    super(mensaje)
    this.name = 'ErrorServidor'
  }
}

function esRespuestaHtml(texto: string): boolean {
  const t = texto.trimStart().toLowerCase()
  return t.startsWith('<!doctype') || t.startsWith('<html')
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

  const tipo = res.headers.get('content-type') ?? ''
  if (!tipo.includes('application/json')) {
    const texto = await res.text().catch(() => '')
    if (esRespuestaHtml(texto) || !res.ok) {
      throw new ErrorServidor('El servidor no está disponible (respuesta no JSON)')
    }
    throw new Error(`Respuesta inesperada (${res.status})`)
  }

  if (!res.ok) {
    const texto = await res.text().catch(() => '')
    throw new Error(`Error ${res.status}: ${texto || 'petición fallida'}`)
  }

  return res.json()
}

/** true si el backend Python responde JSON en /api/health */
export async function verificarServidor(): Promise<boolean> {
  try {
    const res = await fetch(`${baseApi()}/health`)
    const tipo = res.headers.get('content-type') ?? ''
    return res.ok && tipo.includes('application/json')
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
  const BASE = baseApi()
  const p = paramsUbicacion(ubicacion)

  try {
    const datos = await pedir<DatosInicio>(`${BASE}/inicio?${p}`)
    return { ...datos, clima: normalizarClima(datos.clima) }
  } catch {
    try {
      const datos = await datosInicioDirecto(ubicacion)
      return { ...datos, clima: normalizarClima(datos.clima) }
    } catch {
      // Compatibilidad si el servidor no tiene /api/inicio
    }
  }

  try {
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
  } catch {
    const datos = await datosInicioDirecto(ubicacion)
    return { ...datos, clima: normalizarClima(datos.clima) }
  }
}

export async function obtenerFestivos(anio: number, pais = 'CO'): Promise<{ festivos: Holiday[] }> {
  const BASE = baseApi()
  try {
    return await pedir(`${BASE}/festivos/${anio}?pais=${pais}`)
  } catch {
    try {
      const legacy = await pedir<{ holidays: Holiday[] }>(`${BASE}/holidays/${anio}?country=${pais}`)
      return { festivos: legacy.holidays }
    } catch {
      const festivos = await festivosDirecto(anio, pais)
      return { festivos }
    }
  }
}

export async function obtenerResumenDia(fecha: string, ubicacion: Ubicacion = BOGOTA): Promise<ResumenDia> {
  const BASE = baseApi()
  const p = paramsUbicacion(ubicacion)

  try {
    const resumen = await pedir<ResumenDia>(`${BASE}/dia?d=${fecha}&${p}`)
    return { ...resumen, clima: normalizarClima(resumen.clima) }
  } catch {
    try {
      const [clima, festivosRes] = await Promise.all([
        climaDirecto(ubicacion.lat, ubicacion.lon, new Date(`${fecha}T12:00:00`)),
        obtenerFestivos(new Date(fecha).getFullYear()),
      ])
      return {
        fecha,
        clima: normalizarClima(clima),
        luna: faseLunar(new Date(`${fecha}T12:00:00`)),
        festivos: festivosRes.festivos.filter(f => f.date === fecha),
      }
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
}

export async function obtenerFotoNasa(fecha?: string): Promise<ApodData> {
  const BASE = baseApi()
  const q = fecha ? `?d=${fecha}` : ''
  try {
    return await pedir(`${BASE}/nasa${q}`)
  } catch {
    try {
      return await pedir(`${BASE}/nasa/apod${q}`)
    } catch {
      const d = fecha ? new Date(`${fecha}T12:00:00`) : new Date()
      return fotoNasaDirecta(d)
    }
  }
}

export const fetchHolidays = obtenerFestivos
