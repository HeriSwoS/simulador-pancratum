import { Shield, Swords, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { cardImageUrl, userCardBackUrl } from '@/services/cards'
import type { CardRecord } from '@/types/domain'

const rarityLabel = {
  comum: 'Comum',
  incomum: 'Incomum',
  rara: 'Rara',
  epica: 'Épica',
  lendaria: 'Lendária',
}
const typeLabel: Record<string, string> = {
  personagem: 'Personagem',
  criatura: 'Criatura',
  magia: 'Magia',
  armadilha: 'Armadilha',
  equipamento: 'Equipamento',
  // Legados
  guerreiro: 'Personagem',
  arma: 'Equipamento',
  armadura: 'Equipamento',
  evento: 'Magia',
  reliquia: 'Equipamento',
}

/** Normaliza valores de cores (inclusive legados) para as classes css */
export function normalizeCardColor(color?: string): string {
  if (!color) return ''
  const c = color.toLowerCase().trim()
  if (c === 'azul' || c === 'azul_agua' || c.startsWith('azul')) return 'azul'
  if (c === 'vermelho' || c === 'vermelho_fogo' || c.startsWith('vermelho')) return 'vermelho'
  if (c === 'amarelo' || c === 'dourado' || c === 'dourado_divino' || c.startsWith('dourad'))
    return 'amarelo'
  if (c === 'verde' || c === 'verde_terra' || c.startsWith('verde')) return 'verde'
  if (c === 'laranja' || c.startsWith('laranja')) return 'laranja'
  if (c === 'roxo' || c === 'roxo_arcano' || c.startsWith('roxo')) return 'roxo'
  if (c === 'branco' || c === 'branco_luz' || c.startsWith('branco')) return 'branco'
  if (c === 'preto' || c === 'preto_trevas' || c.startsWith('preto')) return 'preto'
  if (c === 'cinza' || c === 'neutro' || c.startsWith('cinza')) return 'cinza'
  return c
}

export function CardBack({ className }: { className?: string }) {
  const customBack = userCardBackUrl()
  if (customBack)
    return (
      <img
        src={customBack}
        alt="Verso da carta"
        className={cn('h-full w-full rounded-[inherit] object-cover', className)}
      />
    )
  return (
    <div
      className={cn(
        'card-back grid h-full w-full place-items-center overflow-hidden rounded-[inherit]',
        className,
      )}
    >
      <div className="card-back-inner">
        <div className="card-back-frame">
          <div className="card-back-sigil">
            <Shield className="h-1/2 w-1/2" />
            <span>P</span>
          </div>
          <span className="card-back-word">PANCRATUM</span>
        </div>
      </div>
    </div>
  )
}

export function CardVisual({
  card,
  faceUp = true,
  className,
  showDetails = true,
}: {
  card?: CardRecord
  faceUp?: boolean
  className?: string
  showDetails?: boolean
}) {
  if (!faceUp)
    return (
      <div className={cn('tcg-card rarity-comum', className)}>
        <CardBack />
      </div>
    )
  if (!card)
    return (
      <div
        className={cn(
          'tcg-card grid place-items-center bg-[#20150d] text-xs text-muted-foreground',
          className,
        )}
      >
        Carta indisponível
      </div>
    )
  const image = cardImageUrl(card)
  const normColor = normalizeCardColor(card.color)
  return (
    <article
      className={cn(
        'tcg-card group/card',
        `rarity-${card.rarity}`,
        normColor && `card-color-${normColor}`,
        className,
      )}
      title={card.name}
    >
      {image ? (
        <>
          <img
            src={image}
            alt={card.name}
            className="absolute inset-0 h-full w-full rounded-[7px] object-cover"
            draggable={false}
          />
          {normColor && (
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 opacity-90 transition-opacity"
              style={{ backgroundColor: 'var(--card-accent)' }}
            />
          )}
        </>
      ) : (
        <div className="generated-card">
          <div
            className="generated-card__name"
            style={
              normColor
                ? { borderColor: 'var(--card-accent)', boxShadow: '0 0 6px var(--card-accent)' }
                : undefined
            }
          >
            {card.name}
          </div>
          <div className="generated-card__art">
            <Sparkles />
            <span>{typeLabel[card.card_type] || card.card_type}</span>
          </div>
          {showDetails && <p>{card.description}</p>}
          <div className="generated-card__stats">
            <span>
              <Swords />
              {card.attack ?? 0}
            </span>
            <small>{rarityLabel[card.rarity]}</small>
            <span>
              <Shield />
              {card.defense ?? 0}
            </span>
          </div>
        </div>
      )}
    </article>
  )
}
