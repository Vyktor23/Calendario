/** Pantalla de carga inicial con animación cósmica */
export function PantallaCarga() {
  return (
    <div className="pantalla-carga" role="status" aria-label="Cargando">
      <div className="pantalla-carga__contenido">
        <div className="pantalla-carga__orbita">
          <div className="pantalla-carga__planeta" />
          <div className="pantalla-carga__luna" />
        </div>
        <h2 className="pantalla-carga__titulo text-gradient">Chronos</h2>
        <p className="pantalla-carga__texto">Preparando tu calendario…</p>
        <div className="pantalla-carga__barra">
          <div className="pantalla-carga__barra-progreso" />
        </div>
      </div>
    </div>
  )
}
