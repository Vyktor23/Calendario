/** Fondo animado con CSS puro — mucho más rápido que Three.js */

export function FondoCosmico() {
  return (
    <div className="fondo-cosmico" aria-hidden="true">
      <div className="fondo-cosmico__aurora" />
      <div className="fondo-cosmico__estrellas" />
      <div className="fondo-cosmico__orbe fondo-cosmico__orbe--1" />
      <div className="fondo-cosmico__orbe fondo-cosmico__orbe--2" />
    </div>
  )
}
