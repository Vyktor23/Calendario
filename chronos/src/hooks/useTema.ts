import { useState, useLayoutEffect, useCallback } from 'react'
import { TEMA_DEFECTO, CLAVE_TEMA, esTemaId, type TemaId } from '../lib/temas'

function leerTemaGuardado(): TemaId {
  try {
    const guardado = localStorage.getItem(CLAVE_TEMA)
    if (guardado && esTemaId(guardado)) return guardado
  } catch { /* privado / sin storage */ }
  return TEMA_DEFECTO
}

function aplicarTema(tema: TemaId) {
  document.documentElement.setAttribute('data-tema', tema)
}

export function useTema() {
  const [tema, setTemaState] = useState<TemaId>(leerTemaGuardado)

  useLayoutEffect(() => {
    aplicarTema(tema)
    try { localStorage.setItem(CLAVE_TEMA, tema) } catch { /* ignore */ }
  }, [tema])

  const setTema = useCallback((nuevo: TemaId) => setTemaState(nuevo), [])

  return { tema, setTema }
}
