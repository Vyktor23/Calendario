import type { WeatherData } from '../types'

const HOY = () => new Date().toISOString().slice(0, 10)

/** Normaliza respuesta del servidor (compatible con versiones anteriores) */
export function normalizarClima(raw: WeatherData): WeatherData {
  const tienePronostico = (raw.forecast?.length ?? 0) > 0
  const esHoy = raw.es_hoy ?? raw.date === HOY()
  let enriched = { ...raw, es_hoy: esHoy }

  const sinTempRaiz = enriched.temp_actual == null && enriched.temp_max == null
  if (sinTempRaiz && tienePronostico) {
    const dia =
      enriched.forecast.find(f => f.date === enriched.date) ??
      enriched.forecast.find(f => f.date === HOY()) ??
      enriched.forecast[0]
    if (dia) {
      enriched = {
        ...enriched,
        temp_max: dia.temp_max,
        temp_min: dia.temp_min,
        emoji: enriched.emoji || dia.emoji,
        description: enriched.description || dia.description,
        weather_code: enriched.weather_code ?? dia.code,
      }
    }
  }

  const tieneTemp = enriched.temp_actual != null || enriched.temp_max != null

  let tipo = enriched.tipo_dato
  if (!tipo || tipo === 'indisponible') {
    if (esHoy && enriched.temp_actual != null) tipo = 'actual'
    else if (tieneTemp) tipo = esHoy ? 'actual' : 'pronostico'
    else if (tienePronostico) tipo = 'pronostico'
    else tipo = 'indisponible'
  }

  const disponible =
    enriched.disponible ?? (tieneTemp || tienePronostico)

  return { ...enriched, tipo_dato: tipo, disponible }
}

export function climaTieneDatos(clima: WeatherData): boolean {
  const c = normalizarClima(clima)
  if (c.temp_actual != null || c.temp_max != null) return true
  return (c.forecast?.length ?? 0) > 0
}

export function temperaturaPrincipal(clima: WeatherData): string {
  const c = normalizarClima(clima)
  if (c.temp_actual != null) return `${Math.round(c.temp_actual)}°`
  if (c.temp_max != null) return `${Math.round(c.temp_max)}°`
  const hoy = c.forecast?.find(d => d.date === c.date) ?? c.forecast?.[0]
  if (hoy?.temp_max != null) return `${Math.round(hoy.temp_max)}°`
  return '—'
}

export function detalleTemperatura(clima: WeatherData): string {
  const c = normalizarClima(clima)
  if (!climaTieneDatos(c)) {
    return c.mensaje || 'Sin datos de clima'
  }

  const partes: string[] = []

  if (c.tipo_dato === 'actual' && c.temp_actual != null) {
    partes.push(c.description)
    if (c.temp_min != null && c.temp_max != null) {
      partes.push(`Mín ${Math.round(c.temp_min)}° · Máx ${Math.round(c.temp_max)}°`)
    }
    return partes.join(' · ')
  }

  if (c.description) partes.push(c.description)
  if (c.temp_min != null && c.temp_max != null) {
    partes.push(`${Math.round(c.temp_min)}° — ${Math.round(c.temp_max)}°C`)
  }
  if (c.precipitation_probability != null) {
    partes.push(`${c.precipitation_probability}% lluvia`)
  }
  return partes.join(' · ') || c.description
}

export function etiquetaTipoClima(clima: WeatherData): string {
  const c = normalizarClima(clima)
  if (c.tipo_dato === 'actual') return 'Temperatura actual'
  if (c.tipo_dato === 'pronostico') return 'Pronóstico'
  if (c.tipo_dato === 'historico') return 'Dato histórico'
  return 'Clima'
}

export function colorEtiquetaClima(tipo: WeatherData['tipo_dato']): string {
  switch (tipo) {
    case 'actual': return 'bg-cyan-500/20 text-cyan-300'
    case 'pronostico': return 'bg-violet-500/20 text-violet-300'
    case 'historico': return 'bg-slate-500/20 text-slate-300'
    default: return 'bg-cyan-500/20 text-cyan-300'
  }
}

export function urlImagenNasa(urlOriginal: string): string {
  if (!urlOriginal) return ''
  if (urlOriginal.startsWith('/api/')) return urlOriginal

  const apiUrl = import.meta.env.VITE_API_URL?.trim()
  if (apiUrl) {
    return `${apiUrl.replace(/\/$/, '')}/api/nasa/imagen?url=${encodeURIComponent(urlOriginal)}`
  }

  // Desarrollo: proxy local. Producción sin backend: URL directa de NASA.
  if (import.meta.env.DEV) {
    return `/api/nasa/imagen?url=${encodeURIComponent(urlOriginal)}`
  }
  return urlOriginal
}
