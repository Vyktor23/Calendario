export type TipoDatoClima = 'actual' | 'pronostico' | 'historico' | 'indisponible'

export interface WeatherData {
  date: string
  temp_actual: number | null
  temp_max: number | null
  temp_min: number | null
  precipitation_probability: number | null
  weather_code: number
  description: string
  emoji: string
  tipo_dato: TipoDatoClima
  etiqueta_tipo: string
  disponible: boolean
  mensaje?: string | null
  es_hoy?: boolean
  forecast: Array<{
    date: string
    temp_max: number
    temp_min: number
    code: number
    description: string
    emoji: string
  }>
}
