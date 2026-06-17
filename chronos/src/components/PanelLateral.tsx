import { Cloud, MapPin } from 'lucide-react'
import { useDatosInicio } from '../hooks/useDatosInicio'
import { FotoNasa } from './FotoNasa'
import { TarjetaClima, PronosticoSemana } from './TarjetaClima'
import { TarjetaFaseLunar } from './TarjetaFaseLunar'
import { normalizarClima } from '../lib/clima'
import { Esqueleto } from './Esqueleto'
import type { Ubicacion } from '../types'

interface PanelLateralProps {
  ubicacion: Ubicacion
  cargandoUbicacion: boolean
  lugar: string
}

export function PanelLateral({ ubicacion, cargandoUbicacion, lugar }: PanelLateralProps) {
  const { clima, festivosHoy, fotoNasa, cargando, cargandoNasa, error } =
    useDatosInicio(ubicacion)

  const climaNorm = clima ? normalizarClima(clima) : null

  return (
    <aside className="panel-lateral">
      {error && (
        <div className="panel-bloque tarjeta panel-bloque--error">
          <p className="panel-bloque__texto-error">{error}</p>
        </div>
      )}

      <section className="panel-bloque tarjeta">
        <header className="panel-bloque__cabecera">
          <div className="panel-bloque__titulo-fila">
            <Cloud className="panel-bloque__icono panel-bloque__icono--clima" aria-hidden />
            <span className="panel-bloque__titulo">Clima hoy</span>
          </div>
          <p className="panel-bloque__subtitulo">
            <MapPin className="panel-bloque__icono-sm" aria-hidden />
            {cargandoUbicacion ? 'Detectando…' : lugar}
          </p>
        </header>

        <div className="panel-bloque__cuerpo">
          {cargando ? (
            <Esqueleto altura="h-20" />
          ) : climaNorm ? (
            <>
              <TarjetaClima clima={climaNorm} />
              <PronosticoSemana clima={climaNorm} />
            </>
          ) : (
            <p className="panel-bloque__vacio">Sin datos de clima</p>
          )}
        </div>
      </section>

      <TarjetaFaseLunar />

      {festivosHoy.length > 0 && (
        <section className="panel-bloque tarjeta panel-bloque--festivo">
          <p className="panel-bloque__titulo">🎉 Festivo hoy</p>
          {festivosHoy.map(f => (
            <p key={f.name} className="panel-bloque__festivo-nombre">{f.name}</p>
          ))}
        </section>
      )}

      <FotoNasa foto={fotoNasa} cargando={cargandoNasa} />
    </aside>
  )
}
