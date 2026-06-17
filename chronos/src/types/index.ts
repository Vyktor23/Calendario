export interface Ubicacion {
  lat: number
  lon: number
  nombre: string
  esUbicacionReal: boolean
}

export const BOGOTA: Ubicacion = {
  lat: 4.711,
  lon: -74.0721,
  nombre: 'Bogotá',
  esUbicacionReal: false,
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time?: string
  color: string
  description?: string
}

export interface MoonData {
  date: string
  phase: number
  illumination: number
  name: string
  emoji: string
  age_days: number
}

export interface Holiday {
  date: string
  name: string
  global: boolean
  types: string[]
}

export interface ApodData {
  date: string
  title: string
  explanation: string
  url: string
  hdurl?: string
  thumbnail?: string
  media_type: string
  copyright?: string
  nasa_id?: string
  fuente?: string
}

export type ViewMode = 'month' | 'year' | 'agenda'

export type { WeatherData, TipoDatoClima } from './clima'

export const EVENT_COLORS = [
  '#22d3ee', '#a78bfa', '#f472b6', '#fbbf24',
  '#34d399', '#fb923c', '#60a5fa', '#f87171',
] as const
