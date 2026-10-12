import { Crown, Sparkles, Swords, Shield, Zap, BookOpen } from 'lucide-react'
import { CardVisual, normalizeCardColor } from './CardVisual'
import { InvocationCostDisplay } from './InvocationCostDisplay'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { CardRecord } from '@/types/domain'

const classDisplayNames: Record<string, string> = {
  normal: 'Normal',
  lenda: 'Lenda',
  mestre: 'Mestre',
}

const rarityDisplayNames: Record<string, string> = {
  comum: 'Comum',
  incomum: 'Incomum',
  rara: 'Rara',
  epica: 'Épica',
  lendaria: 'Lendária',
}

const colorDisplayNames: Record<string, string> = {
  azul: 'Azul',
  vermelho: 'Vermelho',
  amarelo: 'Amarelo',
  verde: 'Verde',
  laranja: 'Laranja',
  roxo: 'Roxo',
  branco: 'Branco',
  preto: 'Preto',
  cinza: 'Cinza',
  dourado: 'Amarelo',
  neutro: 'Cinza',
}

const typeDisplayNames: Record<string, string> = {
  personagem: 'Personagem',
  criatura: 'Criatura',
  magia: 'Magia',
  armadilha: 'Armadilha',
  equipamento: 'Equipamento',
  guerreiro: 'Personagem',
  arma: 'Equipamento',
  armadura: 'Equipamento',
  evento: 'Magia',
  reliquia: 'Equipamento',
}

interface CardZoomHudProps {
  card: CardRecord | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  faceUp?: boolean
}

export function CardZoomHud({ card, open, onOpenChange, faceUp = true }: CardZoomHudProps) {
  if (!card) return null

  const cardClass = card.card_class || 'normal'
  const displayGrau = classDisplayNames[cardClass] || 'Normal'
  const displayRaridade = rarityDisplayNames[card.rarity] || card.rarity
  const displayTipo = typeDisplayNames[card.card_type] || card.card_type
  const displayCor = card.color ? colorDisplayNames[card.color] || card.color : null
  const normColor = normalizeCardColor(card.color)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto border-primary/30 bg-[#16100b] text-[#f4ecd8] shadow-2xl">
        <DialogHeader className="border-b border-primary/20 pb-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <DialogTitle className="font-display text-xl sm:text-2xl font-bold tracking-wide text-amber-300">
              {card.name}
            </DialogTitle>
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider',
                  cardClass === 'mestre'
                    ? 'border border-amber-500/60 bg-amber-500/20 text-amber-300'
                    : cardClass === 'lenda'
                      ? 'border border-purple-500/60 bg-purple-500/20 text-purple-300'
                      : 'border border-primary/30 bg-primary/10 text-primary-foreground',
                )}
              >
                Grau: {displayGrau}
              </span>
              <span className="rounded-full border border-border/60 bg-background/50 px-2 py-0.5 text-xs capitalize text-muted-foreground">
                {displayRaridade}
              </span>
            </div>
          </div>
          <DialogDescription className="text-xs text-[#b8a78a]">
            Inspeção detalhada de atributos, custo, habilidades e efeitos da carta.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 pt-3 sm:grid-cols-[260px_1fr]">
          {/* Coluna da carta */}
          <div className="flex flex-col items-center gap-3">
            <CardVisual
              card={card}
              faceUp={faceUp}
              className="mx-auto w-full max-w-[260px] shadow-2xl"
            />
            {displayCor && (
              <div className="flex items-center gap-1.5 text-xs text-[#c9b79b]">
                <span>Cor dominante:</span>
                <span
                  className="inline-block h-3 w-3 rounded-full border border-white/40"
                  style={{
                    backgroundColor:
                      normColor === 'azul'
                        ? '#2563eb'
                        : normColor === 'vermelho'
                          ? '#dc2626'
                          : normColor === 'amarelo'
                            ? '#eab308'
                            : normColor === 'verde'
                              ? '#16a34a'
                              : normColor === 'laranja'
                                ? '#ea580c'
                                : normColor === 'roxo'
                                  ? '#9333ea'
                                  : normColor === 'branco'
                                    ? '#f3f4f6'
                                    : normColor === 'preto'
                                      ? '#1f2937'
                                      : '#6b7280',
                  }}
                />
                <span className="font-medium text-foreground">{displayCor}</span>
              </div>
            )}
          </div>

          {/* Coluna do HUD de atributos e lore */}
          <div className="space-y-4">
            {/* Bloco de Custo de Invocação Visual */}
            <div className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-black/50 p-3 shadow-inner">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-400">
                Custo de Invocação
              </span>
              <div className="mt-1.5 flex items-center">
                <InvocationCostDisplay cost={card.cost} size="lg" />
              </div>
            </div>

            {/* Grid de atributos principais */}
            <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-2">
              <div className="rounded-lg border border-primary/20 bg-black/40 p-2.5">
                <span className="text-[10px] uppercase text-muted-foreground">Grau</span>
                <p className="font-display font-semibold text-amber-200">{displayGrau}</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-black/40 p-2.5">
                <span className="text-[10px] uppercase text-muted-foreground">Classe</span>
                <p className="font-display font-semibold text-[#f0e4cc]">
                  {card.card_archetype || '—'}
                </p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-black/40 p-2.5">
                <span className="text-[10px] uppercase text-muted-foreground">Escola Mágica</span>
                <p className="font-display font-semibold text-[#f0e4cc]">
                  {card.magic_school || '—'}
                </p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-black/40 p-2.5">
                <span className="text-[10px] uppercase text-muted-foreground">Raça</span>
                <p className="font-display font-semibold text-[#f0e4cc]">{card.race || '—'}</p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-black/40 p-2.5">
                <span className="text-[10px] uppercase text-muted-foreground">
                  Modo de Invocação
                </span>
                <p className="font-display font-semibold text-[#f0e4cc]">
                  {card.summon_mode || '—'}
                </p>
              </div>
              <div className="rounded-lg border border-primary/20 bg-black/40 p-2.5">
                <span className="text-[10px] uppercase text-muted-foreground">Tipo / Raridade</span>
                <p className="font-display font-semibold text-[#f0e4cc]">
                  {displayTipo} • {displayRaridade}
                </p>
              </div>
            </div>

            {/* Ataque e Defesa se tiver */}
            {(card.attack > 0 || card.defense > 0) && (
              <div className="flex items-center gap-4 rounded-lg border border-primary/20 bg-black/30 p-2.5">
                <div className="flex items-center gap-1.5 text-red-400">
                  <Swords className="h-4 w-4" />
                  <span className="text-xs font-semibold">Ataque: {card.attack}</span>
                </div>
                <div className="flex items-center gap-1.5 text-blue-400">
                  <Shield className="h-4 w-4" />
                  <span className="text-xs font-semibold">Defesa: {card.defense}</span>
                </div>
              </div>
            )}

            {/* Texto de Habilidades */}
            {card.abilities && (
              <div className="rounded-xl border border-primary/30 bg-[#1f1710]/90 p-3 shadow">
                <div className="mb-1 flex items-center gap-1.5 text-amber-400">
                  <Zap className="h-4 w-4" />
                  <span className="font-display text-xs font-bold uppercase tracking-wide">
                    Habilidades
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#ece1cd]">
                  {card.abilities}
                </p>
              </div>
            )}

            {/* Texto de Efeitos */}
            {card.effects && (
              <div className="rounded-xl border border-primary/30 bg-[#1f1710]/90 p-3 shadow">
                <div className="mb-1 flex items-center gap-1.5 text-amber-400">
                  <Sparkles className="h-4 w-4" />
                  <span className="font-display text-xs font-bold uppercase tracking-wide">
                    Efeitos
                  </span>
                </div>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#ece1cd]">
                  {card.effects}
                </p>
              </div>
            )}

            {/* Descrição adicional / lore */}
            {card.description && (
              <div className="rounded-xl border border-border/40 bg-black/30 p-3 italic">
                <div className="mb-1 flex items-center gap-1.5 text-muted-foreground">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider">
                    Descrição
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-[#bcaea0]">{card.description}</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
