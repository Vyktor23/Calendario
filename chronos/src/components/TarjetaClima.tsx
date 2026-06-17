import type { WeatherData } from '../types'
import {
  normalizarClima,
  climaTieneDatos,
  temperaturaPrincipal,
  detalleTemperatura,
  etiquetaTipoClima,
  colorEtiquetaClima,
} from '../lib/clima'

interface TarjetaClimaProps {
  clima: WeatherData
  lugar?: string
}

export function TarjetaClima({ clima, lugar }: TarjetaClimaProps) {
  const c = normalizarClima(clima)

  if (!climaTieneDatos(c)) {
    return (
      <div className="clima-hoy">
        <p className="clima-hoy__sin-datos">{c.mensaje || 'Sin datos de clima para hoy'}</p>
      </div>
    )
  }

  return (
    <div className="clima-hoy">
      <div className="clima-hoy__etiquetas">
        <span className={`clima-hoy__badge ${colorEtiquetaClima(c.tipo_dato)}`}>
          {etiquetaTipoClima(c)}
        </span>
        {lugar && <span className="clima-hoy__lugar">{lugar}</span>}
      </div>
      <div className="clima-hoy__principal">
        <span className="clima-hoy__emoji" aria-hidden>{c.emoji}</span>
        <p className="clima-hoy__temp">{temperaturaPrincipal(c)}</p>
        <p className="clima-hoy__detalle">{detalleTemperatura(c)}</p>
        {c.tipo_dato === 'actual' && (
          <p className="clima-hoy__nota clima-hoy__nota--actual">Medida en tiempo real</p>
        )}
        {c.tipo_dato === 'pronostico' && !c.es_hoy && (
          <p className="clima-hoy__nota clima-hoy__nota--pronostico">Estimación meteorológica</p>
        )}
        {c.tipo_dato === 'historico' && (
          <p className="clima-hoy__nota">Registro histórico</p>
        )}
      </div>
    </div>
  )
}

/** Mini pronóstico de 7 días */
export function PronosticoSemana({ clima }: { clima: WeatherData }) {
  const c = normalizarClima(clima)
  if (!c.forecast?.length) return null

  return (
    <div className="pronostico-semana">
      {c.forecast.map(dia => (
        <div key={dia.date} className="pronostico-semana__dia">
          <span className="pronostico-semana__num">{dia.date.slice(8)}</span>
          <span className="pronostico-semana__emoji" aria-hidden>{dia.emoji}</span>
          <span className="pronostico-semana__temp">{Math.round(dia.temp_max)}°</span>
        </div>
      ))}
    </div>
  )
}
