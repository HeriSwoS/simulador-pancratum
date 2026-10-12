import { normalizeCardColor } from './CardVisual'
import type { InvocationCost } from '@/types/domain'

export const COLOR_MAP: Record<string, { label: string; hex: string; border: string }> = {
  azul: { label: 'Azul', hex: '#2563eb', border: '#60a5fa' },
  vermelho: { label: 'Vermelho', hex: '#dc2626', border: '#f87171' },
  amarelo: { label: 'Amarelo', hex: '#eab308', border: '#fde047' },
  verde: { label: 'Verde', hex: '#16a34a', border: '#4ade80' },
  laranja: { label: 'Laranja', hex: '#ea580c', border: '#fb923c' },
  roxo: { label: 'Roxo', hex: '#9333ea', border: '#c084fc' },
  branco: { label: 'Branco', hex: '#e2e8f0', border: '#ffffff' },
  preto: { label: 'Preto', hex: '#1e293b', border: '#64748b' },
  cinza: { label: 'Cinza', hex: '#64748b', border: '#94a3b8' },
  neutro: { label: 'Cinza', hex: '#64748b', border: '#94a3b8' },
  dourado: { label: 'Dourado', hex: '#d97706', border: '#fcd34d' },
}

export function parseCost(raw: unknown): InvocationCost | null {
  if (!raw) return null
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown
      return parseCost(parsed)
    } catch {
      return null
    }
  }
  if (typeof raw === 'object' && raw !== null) {
    const obj = raw as Record<string, unknown>
    const prismatic = typeof obj.prismatic === 'number' ? obj.prismatic : undefined
    const essence = Array.isArray(obj.essence)
      ? (obj.essence.filter((item) => typeof item === 'string') as string[])
      : []
    if (prismatic !== undefined || (essence && essence.length > 0)) {
      return { prismatic, essence }
    }
  }
  return null
}

interface CostDisplayProps {
  cost?: InvocationCost | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function InvocationCostDisplay({ cost, size = 'md', className = '' }: CostDisplayProps) {
  const parsed = parseCost(cost)
  if (!parsed) return <span className="text-xs text-muted-foreground/70 italic">Sem custo</span>

  const hasPrismatic = typeof parsed.prismatic === 'number' && parsed.prismatic >= 0
  const essenceList = parsed.essence || []

  if (!hasPrismatic && essenceList.length === 0) {
    return <span className="text-xs text-muted-foreground/70 italic">Sem custo</span>
  }

  const boxSize =
    size === 'sm'
      ? 'h-5 w-5 text-[11px] rounded-[3px]'
      : size === 'lg'
        ? 'h-8 w-8 text-sm rounded-md font-bold'
        : 'h-6 w-6 text-xs rounded font-semibold'

  return (
    <div className={`inline-flex flex-wrap items-center gap-1.5 ${className}`}>
      {/* Ponto Primástico (quadradinho com número) */}
      {hasPrismatic && (
        <div
          title={`Ponto Primástico: ${parsed.prismatic}`}
          className={`${boxSize} grid place-items-center border-2 border-amber-400 bg-gradient-to-br from-amber-500/30 via-amber-600/20 to-black/80 font-display text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.45)]`}
        >
          {parsed.prismatic}
        </div>
      )}

      {/* Pontos de Essência (quadradinhos coloridos) */}
      {essenceList.map((colorKey, index) => {
        const norm = normalizeCardColor(colorKey) || 'azul'
        const meta = COLOR_MAP[norm] || COLOR_MAP.azul
        return (
          <div
            key={index}
            title={`Essência: ${meta.label}`}
            className={`${boxSize} border-2 shadow-sm transition hover:scale-105`}
            style={{
              backgroundColor: meta.hex,
              borderColor: meta.border,
              boxShadow: `0 0 6px ${meta.hex}88`,
            }}
          />
        )
      })}
    </div>
  )
}
