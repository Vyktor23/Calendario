import { useMemo } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Moon } from 'lucide-react'
import { faseLunar, rangoFaseLunar } from '../lib/luna'

interface TarjetaFaseLunarProps {
  fecha?: Date
  compacta?: boolean
}

function formatearRango(inicio: Date, fin: Date): string {
  const mismoMes = inicio.getFullYear() === fin.getFullYear()
    && inicio.getMonth() === fin.getMonth()

  if (mismoMes) {
    return `${format(inicio, 'd', { locale: es })} — ${format(fin, "d 'de' MMMM yyyy", { locale: es })}`
  }

  const mismoAnio = inicio.getFullYear() === fin.getFullYear()
  if (mismoAnio) {
    return `${format(inicio, "d MMM", { locale: es })} — ${format(fin, "d MMM yyyy", { locale: es })}`
  }

  return `${format(inicio, "d MMM yyyy", { locale: es })} — ${format(fin, "d MMM yyyy", { locale: es })}`
}

export function TarjetaFaseLunar({ fecha = new Date(), compacta = false }: TarjetaFaseLunarProps) {
  const luna = useMemo(() => faseLunar(fecha), [fecha.getTime()])
  const rango = useMemo(() => rangoFaseLunar(fecha), [fecha.getTime()])
  const rangoTexto = useMemo(() => formatearRango(rango.inicio, rango.fin), [rango.inicio.getTime(), rango.fin.getTime()])

  if (compacta) {
    return (
      <div className="tarjeta-interna p-3 fase-lunar fase-lunar--compacta">
        <span className="fase-lunar__emoji" aria-hidden>{luna.emoji}</span>
        <div className="fase-lunar__detalle">
          <p className="fase-lunar__nombre">{luna.name}</p>
          <p className="fase-lunar__iluminacion">Iluminación {luna.illumination}%</p>
          <p className="fase-lunar__rango capitalize">{rangoTexto}</p>
        </div>
      </div>
    )
  }

  return (
    <section className="panel-bloque tarjeta">
      <header className="panel-bloque__cabecera">
        <div className="panel-bloque__titulo-fila">
          <Moon className="panel-bloque__icono panel-bloque__icono--luna" aria-hidden />
          <span className="panel-bloque__titulo">Fase lunar</span>
        </div>
      </header>
      <div className="panel-bloque__cuerpo fase-lunar">
        <span className="fase-lunar__emoji" aria-hidden>{luna.emoji}</span>
        <p className="fase-lunar__nombre">{luna.name}</p>
        <p className="fase-lunar__iluminacion">{luna.illumination}% iluminada</p>
        <p className="fase-lunar__rango capitalize">{rangoTexto}</p>
      </div>
    </section>
  )
}
