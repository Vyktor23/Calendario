import type { MoonData } from '../types'

function diaJuliano(fecha: Date): number {
  let y = fecha.getFullYear()
  let m = fecha.getMonth() + 1
  const d = fecha.getDate()
  if (m <= 2) {
    y -= 1
    m += 12
  }
  const a = Math.floor(y / 100)
  const b = 2 - a + Math.floor(a / 4)
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5
}

/** Misma lógica que el servidor — cálculo instantáneo en el navegador */
export function faseLunar(fecha: Date): MoonData {
  const jd = diaJuliano(fecha)
  const daysSinceNew = ((jd - 2451549.5) % 29.530588853 + 29.530588853) % 29.530588853
  const phase = daysSinceNew / 29.530588853

  let name: string
  let emoji: string
  let illumination: number

  if (phase < 0.03 || phase > 0.97) {
    name = 'Luna Nueva'
    emoji = '🌑'
    illumination = 0
  } else if (phase < 0.22) {
    name = 'Luna Creciente'
    emoji = '🌒'
    illumination = phase * 2
  } else if (phase < 0.28) {
    name = 'Cuarto Creciente'
    emoji = '🌓'
    illumination = 0.5
  } else if (phase < 0.47) {
    name = 'Creciente Avanzada'
    emoji = '🌔'
    illumination = phase
  } else if (phase < 0.53) {
    name = 'Luna Llena'
    emoji = '🌕'
    illumination = 1
  } else if (phase < 0.72) {
    name = 'Menguante Avanzada'
    emoji = '🌖'
    illumination = 1 - phase
  } else if (phase < 0.78) {
    name = 'Cuarto Menguante'
    emoji = '🌗'
    illumination = 0.5
  } else {
    name = 'Luna Menguante'
    emoji = '🌘'
    illumination = 1 - phase * 2
  }

  const fechaStr = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`

  return {
    date: fechaStr,
    phase: Math.round(phase * 10000) / 10000,
    illumination: Math.round(Math.min(1, Math.max(0, illumination)) * 1000) / 10,
    name,
    emoji,
    age_days: Math.round(daysSinceNew * 10) / 10,
  }
}

/** Nombre corto para celdas pequeñas del calendario */
export function nombreLunaCorto(nombre: string): string {
  return nombre.replace(/^Luna /, '')
}

function agregarDias(fecha: Date, dias: number): Date {
  const d = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  d.setDate(d.getDate() + dias)
  return d
}

/** Fechas en que inicia y termina la fase lunar actual */
export function rangoFaseLunar(fecha: Date): { inicio: Date; fin: Date } {
  const nombreFase = faseLunar(fecha).name

  let inicio = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  for (let i = 0; i < 16; i++) {
    const anterior = agregarDias(inicio, -1)
    if (faseLunar(anterior).name !== nombreFase) break
    inicio = anterior
  }

  let fin = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
  for (let i = 0; i < 16; i++) {
    const siguiente = agregarDias(fin, 1)
    if (faseLunar(siguiente).name !== nombreFase) break
    fin = siguiente
  }

  return { inicio, fin }
}
