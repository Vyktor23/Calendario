import { Palette } from 'lucide-react'
import { TEMAS, type TemaId } from '../lib/temas'

interface SelectorTemaProps {
  tema: TemaId
  onCambiar: (tema: TemaId) => void
}

export function SelectorTema({ tema, onCambiar }: SelectorTemaProps) {
  return (
    <div className="selector-tema">
      <div className="selector-tema__etiqueta">
        <Palette className="w-3.5 h-3.5" aria-hidden />
        <span>Tema</span>
      </div>
      <div className="selector-tema__opciones" role="listbox" aria-label="Elegir tema del calendario">
        {TEMAS.map(t => (
          <button
            key={t.id}
            type="button"
            role="option"
            aria-selected={tema === t.id}
            className={`selector-tema__swatch ${tema === t.id ? 'selector-tema__swatch--activo' : ''}`}
            style={{ background: t.preview }}
            onClick={() => onCambiar(t.id)}
            title={t.nombre}
            aria-label={`Tema ${t.nombre}`}
          />
        ))}
      </div>
    </div>
  )
}
