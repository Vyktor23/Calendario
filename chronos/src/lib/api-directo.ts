import type { ApodData, Holiday, MoonData, Ubicacion, WeatherData } from '../types'
import { faseLunar } from './luna'

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast'
const NAGER_API = 'https://date.nager.at/api/v3'
const NASA_IMAGES_API = 'https://images-api.nasa.gov/search'
const GEOCODING = 'https://geocoding-api.open-meteo.com/v1/reverse'

const WEATHER_CODES: Record<number, [string, string]> = {
  0: ['Despejado', '☀️'],
  1: ['Mayormente despejado', '🌤️'],
  2: ['Parcialmente nublado', '⛅'],
  3: ['Nublado', '☁️'],
  45: ['Niebla', '🌫️'],
  48: ['Niebla helada', '🌫️'],
  51: ['Llovizna ligera', '🌦️'],
  53: ['Llovizna', '🌦️'],
  55: ['Llovizna intensa', '🌧️'],
  61: ['Lluvia ligera', '🌧️'],
  63: ['Lluvia', '🌧️'],
  65: ['Lluvia fuerte', '⛈️'],
  71: ['Nieve ligera', '🌨️'],
  73: ['Nieve', '❄️'],
  75: ['Nieve intensa', '❄️'],
  80: ['Chubascos ligeros', '🌦️'],
  81: ['Chubascos', '🌧️'],
  82: ['Chubascos fuertes', '⛈️'],
  95: ['Tormenta', '⛈️'],
  96: ['Tormenta con granizo', '⛈️'],
  99: ['Tormenta severa', '⛈️'],
}

const TEMAS_COSMOS = [
  'nebula', 'galaxy', 'mars', 'jupiter', 'saturn', 'moon',
  'aurora', 'spacewalk', 'cosmos', 'universe', 'asteroid',
  'eclipse', 'supernova', 'milky way', 'solar flare',
]

const NASA_FALLBACK: ApodData = {
  date: new Date().toISOString().slice(0, 10),
  title: 'NGC 7714: Galaxia con cola de cometa',
  explanation: 'Imagen del archivo público de la NASA.',
  url: 'https://images-assets.nasa.gov/image/PIA12348/PIA12348~medium.jpg',
  hdurl: 'https://images-assets.nasa.gov/image/PIA12348/PIA12348~orig.jpg',
  media_type: 'image',
  copyright: 'NASA, ESA',
  thumbnail: 'https://images-assets.nasa.gov/image/PIA12348/PIA12348~thumb.jpg',
  fuente: 'nasa_images',
}

function describirCodigo(code: number): [string, string] {
  return WEATHER_CODES[code] ?? ['Desconocido', '🌡️']
}

function construirSemana(daily: Record<string, number[] | string[]>, fechas: string[]) {
  const hoy = new Date().toISOString().slice(0, 10)
  const inicio = fechas.indexOf(hoy) >= 0 ? fechas.indexOf(hoy) : 0
  const fin = Math.min(inicio + 7, fechas.length)
  return fechas.slice(inicio, fin).map((d, i) => {
    const idx = inicio + i
    const code = (daily.weather_code as number[])?.[idx] ?? 0
    const [description, emoji] = describirCodigo(code)
    return {
      date: d,
      temp_max: (daily.temperature_2m_max as number[])?.[idx] ?? 0,
      temp_min: (daily.temperature_2m_min as number[])?.[idx] ?? 0,
      code,
      description,
      emoji,
    }
  })
}

export async function climaDirecto(lat: number, lon: number, fecha = new Date()): Promise<WeatherData> {
  const hoy = new Date().toISOString().slice(0, 10)
  const target = fecha.toISOString().slice(0, 10)
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    current: 'temperature_2m,weather_code',
    timezone: 'auto',
    forecast_days: '16',
    past_days: '7',
  })

  const res = await fetch(`${OPEN_METEO}?${params}`)
  if (!res.ok) throw new Error('No se pudo obtener el clima')
  const data = await res.json()

  const daily = data.daily ?? {}
  const fechas: string[] = daily.time ?? []
  const idx = fechas.indexOf(target)

  if (idx < 0) {
    return {
      date: target,
      temp_actual: null,
      temp_max: null,
      temp_min: null,
      precipitation_probability: null,
      weather_code: 0,
      description: 'Sin datos',
      emoji: '🌡️',
      tipo_dato: 'indisponible',
      etiqueta_tipo: 'Sin datos para esta fecha',
      disponible: false,
      mensaje: 'Sin datos para esta fecha',
      es_hoy: target === hoy,
      forecast: [],
    }
  }

  let code = (daily.weather_code as number[])?.[idx] ?? 0
  let tempActual: number | null = null
  let tipo: WeatherData['tipo_dato'] = 'pronostico'

  if (target === hoy) {
    const current = data.current ?? {}
    tempActual = current.temperature_2m ?? null
    if (current.weather_code != null) code = current.weather_code
    tipo = 'actual'
  } else if (target < hoy) {
    tipo = 'historico'
  }

  const [description, emoji] = describirCodigo(code)

  return {
    date: target,
    temp_actual: tempActual,
    temp_max: (daily.temperature_2m_max as number[])?.[idx] ?? null,
    temp_min: (daily.temperature_2m_min as number[])?.[idx] ?? null,
    precipitation_probability: (daily.precipitation_probability_max as number[])?.[idx] ?? null,
    weather_code: code,
    description,
    emoji,
    tipo_dato: tipo,
    etiqueta_tipo: tipo === 'actual' ? 'Temperatura actual en tiempo real' : 'Pronóstico meteorológico',
    disponible: true,
    es_hoy: target === hoy,
    forecast: construirSemana(daily, fechas),
  }
}

export async function festivosDirecto(anio: number, pais = 'CO'): Promise<Holiday[]> {
  const res = await fetch(`${NAGER_API}/PublicHolidays/${anio}/${pais}`)
  if (!res.ok) throw new Error('No se pudieron obtener festivos')
  const raw: Array<{ date: string; name: string; localName?: string; global?: boolean; types?: string[] }> =
    await res.json()
  return raw.map(h => ({
    date: h.date,
    name: h.localName || h.name,
    global: h.global ?? true,
    types: h.types ?? [],
  }))
}

export async function nombreLugarDirecto(lat: number, lon: number): Promise<string> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    language: 'es',
    count: '1',
  })
  const res = await fetch(`${GEOCODING}?${params}`)
  if (!res.ok) return 'Tu ubicación'
  const data = await res.json()
  const r = data.results?.[0]
  if (!r) return 'Tu ubicación'
  return r.name || r.admin1 || 'Tu ubicación'
}

function urlsImagenNasa(links: Array<{ href?: string; render?: string }>): [string | null, string | null] {
  let thumb: string | null = null
  let medium: string | null = null
  let large: string | null = null
  let orig: string | null = null
  for (const link of links) {
    const href = link.href ?? ''
    if (!href.startsWith('https')) continue
    if (href.includes('~thumb')) thumb = href
    else if (href.includes('~medium')) medium = href
    else if (href.includes('~large')) large = href
    else if (href.includes('~orig')) orig = href
    else if (link.render === 'image' && !medium) medium = href
  }
  const principal = medium || large || thumb || orig
  const hd = orig || large || medium || thumb
  return [principal, hd]
}

function formatearItemNasa(item: Record<string, unknown>, fecha: string): ApodData | null {
  const data = (item.data as Record<string, string>[])?.[0]
  if (!data?.title) return null
  const [principal, hd] = urlsImagenNasa((item.links as Array<{ href?: string; render?: string }>) ?? [])
  if (!principal) return null
  let descripcion = data.description ?? ''
  if (descripcion.length > 500) descripcion = `${descripcion.slice(0, 500)}…`
  return {
    date: fecha,
    title: data.title,
    explanation: descripcion,
    url: principal,
    hdurl: hd ?? undefined,
    media_type: 'image',
    copyright: data.center ?? 'NASA',
    thumbnail: principal !== hd ? principal : undefined,
    fuente: 'nasa_images',
    nasa_id: data.nasa_id,
  }
}

export async function fotoNasaDirecta(fecha = new Date()): Promise<ApodData> {
  const objetivo = fecha
  const doy = Math.floor(
    (objetivo.getTime() - new Date(objetivo.getFullYear(), 0, 0).getTime()) / 86_400_000,
  )
  const tema = TEMAS_COSMOS[doy % TEMAS_COSMOS.length]
  const pagina = (doy % 4) + 1
  const fechaStr = objetivo.toISOString().slice(0, 10)

  try {
    const params = new URLSearchParams({ q: tema, media_type: 'image', page: String(pagina) })
    let res = await fetch(`${NASA_IMAGES_API}?${params}`)
    if (!res.ok) throw new Error('NASA no disponible')
    let data = await res.json()
    let items: Record<string, unknown>[] = data.collection?.items ?? []

    if (!items.length) {
      res = await fetch(`${NASA_IMAGES_API}?q=space&media_type=image&page=1`)
      data = await res.json()
      items = data.collection?.items ?? []
    }

    if (items.length) {
      const indice = doy % items.length
      for (let offset = 0; offset < items.length; offset++) {
        const candidato = formatearItemNasa(items[(indice + offset) % items.length], fechaStr)
        if (candidato) return candidato
      }
    }
  } catch {
    /* fallback abajo */
  }

  return { ...NASA_FALLBACK, date: fechaStr }
}

export async function datosInicioDirecto(ubicacion: Ubicacion): Promise<{
  luna: MoonData
  proxima_luna_llena: MoonData
  clima: WeatherData
  festivos_hoy: Holiday[]
  ubicacion: { lat: number; lon: number; nombre: string }
}> {
  const hoy = new Date().toISOString().slice(0, 10)
  const anio = new Date().getFullYear()
  const luna = faseLunar(new Date())

  const [clima, festivos, nombre] = await Promise.all([
    climaDirecto(ubicacion.lat, ubicacion.lon),
    festivosDirecto(anio).catch(() => [] as Holiday[]),
    nombreLugarDirecto(ubicacion.lat, ubicacion.lon).catch(() => ubicacion.nombre),
  ])

  return {
    luna,
    proxima_luna_llena: luna,
    clima,
    festivos_hoy: festivos.filter(f => f.date === hoy),
    ubicacion: { lat: ubicacion.lat, lon: ubicacion.lon, nombre },
  }
}
