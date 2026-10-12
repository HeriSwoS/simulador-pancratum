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
const typeLabel = {
  guerreiro: 'Guerreiro',
  arma: 'Arma',
  armadura: 'Armadura',
  evento: 'Evento',
  reliquia: 'Relíquia',
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
      <div className="card-back-sigil">
        <Shield className="h-1/2 w-1/2" />
        <span>P</span>
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
  return (
    <article
      className={cn('tcg-card group/card', `rarity-${card.rarity}`, className)}
      title={card.name}
    >
      {image ? (
        <img
          src={image}
          alt={card.name}
          className="absolute inset-0 h-full w-full rounded-[7px] object-cover"
          draggable={false}
        />
      ) : (
        <div className="generated-card">
          <div className="generated-card__name">{card.name}</div>
          <div className="generated-card__art">
            <Sparkles />
            <span>{typeLabel[card.card_type]}</span>
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
