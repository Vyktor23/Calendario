import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CLAVE_TEMA, esTemaId, TEMA_DEFECTO } from './lib/temas'
import './index.css'
import './temas.css'
import './responsive.css'
import App from './App.tsx'

try {
  const guardado = localStorage.getItem(CLAVE_TEMA)
  document.documentElement.setAttribute('data-tema', guardado && esTemaId(guardado) ? guardado : TEMA_DEFECTO)
} catch {
  document.documentElement.setAttribute('data-tema', TEMA_DEFECTO)
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
