import { useState, useEffect } from 'react'
import { X, Sparkles, ExternalLink, ZoomIn } from 'lucide-react'
import type { ApodData } from '../types'
import { urlImagenNasa } from '../lib/clima'
import { Esqueleto } from './Esqueleto'

interface FotoNasaProps {
  foto: ApodData | null
  cargando: boolean
}

function urlsDeImagen(foto: ApodData): string[] {
  return [...new Set(
    [foto.url, foto.hdurl, foto.thumbnail].filter(
      (u): u is string => !!u && u.startsWith('https'),
    ),
  )]
}

export function FotoNasa({ foto, cargando }: FotoNasaProps) {
  const [expandida, setExpandida] = useState(false)
  const [indice, setIndice] = useState(0)
  const [fallo, setFallo] = useState(false)

  const urls = foto ? urlsDeImagen(foto) : []
  const urlOriginal = urls[indice] ?? ''
  const src = urlOriginal ? urlImagenNasa(urlOriginal) : ''

  useEffect(() => {
    setIndice(0)
    setFallo(false)
  }, [foto?.url, foto?.title])

  if (cargando) {
    return (
      <section className="panel-bloque tarjeta">
        <Esqueleto altura="h-40" />
      </section>
    )
  }

  if (!foto?.title || !src || fallo) {
    return (
      <section className="panel-bloque tarjeta foto-cosmos__vacio">
        <Sparkles className="foto-cosmos__vacio-icono" aria-hidden />
        <p>Explorando el cosmos…</p>
      </section>
    )
  }

  const enlaceNasa = foto.nasa_id
    ? `https://images.nasa.gov/details/${foto.nasa_id}`
    : urlOriginal

  return (
    <>
      <section className="tarjeta foto-cosmos">
        <button
          type="button"
          className="foto-nasa__contenedor foto-nasa__contenedor--clic"
          onClick={() => setExpandida(true)}
          aria-label="Ampliar imagen del cosmos"
        >
          <img
            key={src}
            src={src}
            alt={foto.title}
            className="foto-nasa__imagen"
            loading="eager"
            decoding="async"
            onError={() => {
              if (indice < urls.length - 1) setIndice(i => i + 1)
              else setFallo(true)
            }}
          />
          <span className="foto-nasa__zoom">
            <ZoomIn className="w-4 h-4" />
            Ampliar
          </span>
        </button>
        <div className="foto-cosmos__info">
          <div className="foto-cosmos__etiqueta">
            <Sparkles className="foto-cosmos__icono" aria-hidden />
            <span>Cosmos del día</span>
          </div>
          <p className="foto-cosmos__titulo">{foto.title}</p>
          {foto.explanation && (
            <p className="foto-cosmos__descripcion">{foto.explanation}</p>
          )}
        </div>
      </section>

      {expandida && (
        <VisorCosmos
          foto={foto}
          src={src}
          urls={urls}
          enlace={enlaceNasa}
          onCerrar={() => setExpandida(false)}
        />
      )}
    </>
  )
}

function VisorCosmos({
  foto,
  src,
  urls,
  enlace,
  onCerrar,
}: {
  foto: ApodData
  src: string
  urls: string[]
  enlace: string
  onCerrar: () => void
}) {
  const [srcVisor, setSrcVisor] = useState(src)
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    window.addEventListener('keydown', esc)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', esc)
    }
  }, [onCerrar])

  return (
    <div className="visor-nasa" role="dialog" aria-modal="true">
      <div className="visor-nasa__fondo" onClick={onCerrar} />
      <div className="visor-nasa__contenido">
        <button className="visor-nasa__cerrar btn-icono" onClick={onCerrar} aria-label="Cerrar">
          <X className="w-5 h-5" />
        </button>
        <img
          src={srcVisor}
          alt={foto.title}
          className="visor-nasa__imagen"
          onError={() => {
            if (idx < urls.length - 1) {
              const next = idx + 1
              setIdx(next)
              setSrcVisor(urlImagenNasa(urls[next]))
            }
          }}
        />
        <div className="visor-nasa__info">
          <p className="font-medium text-sm">{foto.title}</p>
          {foto.explanation && (
            <p className="text-xs text-slate-400 mt-1">{foto.explanation}</p>
          )}
          <a
            href={enlace}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-cyan-400 mt-2"
          >
            <ExternalLink className="w-3 h-3" /> Ver en NASA
          </a>
        </div>
      </div>
    </div>
  )
}
