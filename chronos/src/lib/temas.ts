export type TemaId =
  | 'cosmos'
  | 'aurora'
  | 'atardecer'
  | 'oceano'
  | 'bosque'
  | 'medianoche'
  | 'sakura'

export interface TemaInfo {
  id: TemaId
  nombre: string
  /** Gradiente para la muestra de color */
  preview: string
}

export const TEMAS: TemaInfo[] = [
  { id: 'cosmos', nombre: 'Cosmos', preview: 'linear-gradient(135deg, #22d3ee, #a78bfa)' },
  { id: 'aurora', nombre: 'Aurora', preview: 'linear-gradient(135deg, #34d399, #06b6d4)' },
  { id: 'atardecer', nombre: 'Atardecer', preview: 'linear-gradient(135deg, #fb923c, #f472b6)' },
  { id: 'oceano', nombre: 'Océano', preview: 'linear-gradient(135deg, #0ea5e9, #6366f1)' },
  { id: 'bosque', nombre: 'Bosque', preview: 'linear-gradient(135deg, #4ade80, #166534)' },
  { id: 'medianoche', nombre: 'Medianoche', preview: 'linear-gradient(135deg, #818cf8, #1e293b)' },
  { id: 'sakura', nombre: 'Sakura', preview: 'linear-gradient(135deg, #f9a8d4, #c084fc)' },
]

export const TEMA_DEFECTO: TemaId = 'cosmos'
export const CLAVE_TEMA = 'chronos-tema'

export function esTemaId(valor: string | null): valor is TemaId {
  return TEMAS.some(t => t.id === valor)
}
