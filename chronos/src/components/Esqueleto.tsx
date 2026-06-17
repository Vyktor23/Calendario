interface EsqueletoProps {
  altura?: string
}

/** Placeholder animado mientras cargan los datos */
export function Esqueleto({ altura = 'h-24' }: EsqueletoProps) {
  return (
    <div className={`${altura} rounded-xl bg-white/5 animate-pulse`} />
  )
}
