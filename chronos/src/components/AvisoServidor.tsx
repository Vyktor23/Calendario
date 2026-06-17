import { AlertTriangle } from 'lucide-react'

interface AvisoServidorProps {
  visible: boolean
}

export function AvisoServidor({ visible }: AvisoServidorProps) {
  if (!visible) return null

  return (
    <div className="aviso-servidor" role="alert">
      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400" />
      <div>
        <p className="font-medium text-amber-200">Servidor no conectado</p>
        <p className="text-sm text-slate-400 mt-0.5">
          Para ver clima, festivos y NASA, inicia el servidor Python:
        </p>
        <code className="block mt-2 text-xs bg-black/30 rounded px-2 py-1.5 text-cyan-300">
          cd server → uvicorn main:app --reload --port 8000
        </code>
      </div>
    </div>
  )
}
