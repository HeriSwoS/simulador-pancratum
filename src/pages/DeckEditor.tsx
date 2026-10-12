import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Check,
  Crown,
  Gem,
  LoaderCircle,
  Minus,
  Plus,
  Save,
  Search,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CardVisual } from '@/components/CardVisual'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { getDeck, saveDeck } from '@/services/decks'
import { listCards } from '@/services/cards'
import type { CardRecord, DeckItem } from '@/types/domain'

export default function DeckEditorPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [cards, setCards] = useState<CardRecord[]>([])
  const [name, setName] = useState('')
  const [items, setItems] = useState<DeckItem[]>([])
  const [main, setMain] = useState('')
  const [legendaries, setLegendaries] = useState<string[]>([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    Promise.all([getDeck(id), listCards()])
      .then(([deck, all]) => {
        setName(deck.name)
        setItems(Array.isArray(deck.items) ? deck.items : [])
        setMain(deck.main_character || '')
        setLegendaries(Array.isArray(deck.legendary_cards) ? deck.legendary_cards.slice(0, 3) : [])
        setCards(all)
      })
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Baralho não encontrado',
          description: error instanceof Error ? error.message : 'Volte à lista.',
        })
        navigate('/baralhos')
      })
      .finally(() => setLoading(false))
  }, [id])
  const map = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards])
  const total = items.reduce((sum, item) => sum + item.quantity, 0)
  const deckCards = items
    .map((item) => ({ ...item, card: map.get(item.cardId) }))
    .filter((item) => item.card) as (DeckItem & { card: CardRecord })[]
  const filtered = cards.filter((card) =>
    card.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')),
  )
  const setMainCharacter = (cardId: string) => {
    setMain(cardId)
    // Se a carta escolhida como personagem principal estava nas lendárias, remove dela
    if (cardId) {
      setLegendaries((old) => old.filter((id) => id !== cardId))
    }
  }

  const adjust = (cardId: string, delta: number) => {
    const targetCard = map.get(cardId)
    const cardClass = targetCard?.card_class || 'normal'

    // Regra: Carta Mestre só pode existir UMA por baralho e ela É o personagem principal
    if (delta > 0 && cardClass === 'mestre') {
      // "ao selecionar uma carta é classe mestre. já coloca automaticamente como personagem principal do deck"
      // Se já é o personagem principal atual:
      if (main === cardId) {
        toast({
          title: 'Carta Mestre já selecionada',
          description: `“${targetCard?.name}” já é o Personagem Principal deste baralho. Apenas 1 carta Mestre é permitida por baralho.`,
        })
        return
      }

      // Se havia outro personagem principal, avisa a substituição
      const prevHero = main ? map.get(main) : null
      setMainCharacter(cardId)

      toast({
        title: 'Personagem Principal definido',
        description: prevHero
          ? `“${targetCard?.name}” (Mestre) substituiu “${prevHero.name}” como Personagem Principal.`
          : `“${targetCard?.name}” é classe Mestre e foi definida automaticamente como Personagem Principal.`,
      })
      return
    }

    setItems((old) => {
      const current = old.find((item) => item.cardId === cardId)
      const currentQty = current?.quantity || 0

      if (delta > 0) {
        // Regra de limites de cópias:
        // Lenda: no máximo 1 cópia de cada
        if (cardClass === 'lenda') {
          if (currentQty >= 1) {
            toast({
              variant: 'destructive',
              title: 'Limite de cópias atingido',
              description: `Cartas de classe Lenda só podem ter no máximo 1 cópia no baralho (“${targetCard?.name}”).`,
            })
            return old
          }
        } else if (cardClass === 'normal') {
          // Normal: até 4 cópias de cada
          if (currentQty >= 4) {
            toast({
              variant: 'destructive',
              title: 'Limite de cópias atingido',
              description: `Cartas de classe Normal podem ter até 4 cópias no baralho (“${targetCard?.name}”).`,
            })
            return old
          }
        }
      }

      if (!current && delta > 0) return [...old, { cardId, quantity: 1 }]
      if (!current) return old
      const next = current.quantity + delta
      return next <= 0
        ? old.filter((item) => item.cardId !== cardId)
        : old.map((item) => (item.cardId === cardId ? { ...item, quantity: next } : item))
    })
  }

  const toggleLegendary = (cardId: string) => {
    const targetCard = map.get(cardId)
    const cardClass = targetCard?.card_class || 'normal'

    if (cardClass !== 'lenda') {
      toast({
        variant: 'destructive',
        title: 'Apenas cartas de classe Lenda',
        description: `“${targetCard?.name || 'Esta carta'}” é de classe ${cardClass === 'mestre' ? 'Mestre' : 'Normal'}. Apenas cartas Lenda podem ser colocadas nas zonas Lenda.`,
      })
      return
    }

    setLegendaries((old) => {
      if (old.includes(cardId)) return old.filter((id) => id !== cardId)
      if (old.length >= 3) {
        toast({
          variant: 'destructive',
          title: 'Limite de lendárias atingido',
          description: 'Você só pode ter até 3 cartas Lenda no tabuleiro.',
        })
        return old
      }
      return [...old, cardId]
    })
  }
  const save = async () => {
    if (!name.trim())
      return toast({ variant: 'destructive', title: 'Informe um nome para o baralho.' })
    setSaving(true)
    try {
      await saveDeck(id, {
        name: name.trim(),
        items,
        main_character: main,
        legendary_cards: legendaries,
      })
      toast({ title: 'Baralho salvo', description: `${total} cartas no baralho principal.` })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }
  if (loading)
    return (
      <div className="grid min-h-[70vh] place-items-center">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  return (
    <div className="mx-auto w-full max-w-[1580px] px-4 py-8 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button size="icon" variant="ghost" asChild>
            <Link to="/baralhos">
              <ArrowLeft />
            </Link>
          </Button>
          <div>
            <span className="eyebrow">Editor de baralho</span>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 h-auto border-0 bg-transparent p-0 font-display text-2xl font-bold focus-visible:ring-0 sm:text-3xl"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`rounded-lg border px-4 py-2 text-center ${total === 50 ? 'border-emerald-500/40 text-emerald-400' : 'border-primary/25 text-primary'}`}
          >
            <strong className="font-display text-xl">{total}</strong>
            <span className="ml-1 text-xs text-muted-foreground">
              / 50 cartas + 1 personagem + 3 lendárias
            </span>
          </div>
          <Button className="gold-button" onClick={save} disabled={saving}>
            {saving ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
        </div>
      </div>
      <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <strong className="text-primary">Estrutura oficial:</strong> 50 cartas no baralho principal
        + 1 personagem principal separado + 3 lendárias que já começam no tabuleiro. Para testes,
        qualquer configuração é permitida.
      </div>
      <div className="deck-editor-grid">
        <section className="arcane-panel overflow-hidden">
          <div className="border-b border-border p-4">
            <h2 className="font-display text-lg font-semibold">Seu baralho</h2>
            <p className="text-sm text-muted-foreground">Ajuste livremente as quantidades.</p>
          </div>
          <div className="border-b border-border bg-primary/5 p-4">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <Crown className="h-4 w-4" />
              Personagem principal
            </h3>
            <select
              value={main}
              onChange={(e) => {
                const chosenId = e.target.value
                const chosen = map.get(chosenId)
                setMainCharacter(chosenId)
                if (chosen?.card_class === 'mestre') {
                  toast({
                    title: 'Personagem Principal definido',
                    description: `“${chosen.name}” (Mestre) é o Personagem Principal do baralho.`,
                  })
                }
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Escolher personagem...</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}{' '}
                  {card.card_class === 'mestre'
                    ? '⭐ (Mestre)'
                    : card.card_class === 'lenda'
                      ? '👑 (Lenda)'
                      : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="border-b border-border bg-primary/5 p-4">
            <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-primary">
              <Gem className="h-4 w-4" />
              Lendárias no tabuleiro
              <span className="ml-auto font-normal text-xs text-muted-foreground">
                {legendaries.length}/3
              </span>
            </h3>
            <p className="mb-3 text-xs text-muted-foreground">
              Cada lendária escolhida já começa em sua zona LENDA 1, 2 ou 3.
            </p>
            {legendaries.length ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {legendaries.map((cardId, index) => {
                  const card = map.get(cardId)
                  return (
                    <span
                      key={cardId}
                      className="flex items-center gap-1 rounded-full border border-primary/40 bg-background/60 py-1 pl-1 pr-2 text-xs"
                    >
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/20 font-display text-[10px] font-bold text-primary">
                        {index + 1}
                      </span>
                      <span className="max-w-[140px] truncate">{card?.name || 'Carta'}</span>
                      <button
                        type="button"
                        aria-label={`Remover ${card?.name || 'lendária'}`}
                        onClick={() => toggleLegendary(cardId)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  )
                })}
              </div>
            ) : null}
            <select
              value=""
              onChange={(e) => e.target.value && toggleLegendary(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Adicionar lendária ({legendaries.length}/3)...</option>
              {cards
                .filter(
                  (card) =>
                    (card.card_class || 'normal') === 'lenda' &&
                    !legendaries.includes(card.id) &&
                    card.id !== main,
                )
                .map((card) => (
                  <option key={card.id} value={card.id}>
                    {card.name} (Lenda)
                  </option>
                ))}
            </select>
          </div>
          <ScrollArea className="h-[650px]">
            <div className="space-y-2 p-4">
              {deckCards.length ? (
                deckCards.map(({ card, quantity }) => (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/35 p-2"
                  >
                    <CardVisual
                      card={card}
                      className="w-12 shrink-0 rounded-md"
                      showDetails={false}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold">{card.name}</p>
                        {card.card_class === 'lenda' && (
                          <span className="shrink-0 rounded border border-purple-500/40 bg-purple-500/20 px-1 text-[9px] font-bold text-purple-300 uppercase">
                            Lenda (máx 1)
                          </span>
                        )}
                      </div>
                      <p className="text-xs capitalize text-muted-foreground">
                        {card.card_type === 'guerreiro'
                          ? 'Personagem'
                          : card.card_type === 'arma' ||
                              card.card_type === 'armadura' ||
                              card.card_type === 'reliquia'
                            ? 'Equipamento'
                            : card.card_type === 'evento'
                              ? 'Magia'
                              : card.card_type}
                        {card.card_class === 'normal' || !card.card_class
                          ? ' • Normal (até 4)'
                          : ''}
                      </p>
                    </div>
                    <div className="flex items-center rounded-md border border-border">
                      <button
                        className="p-2 hover:text-primary"
                        onClick={() => adjust(card.id, -1)}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-7 text-center font-display text-sm">{quantity}</span>
                      <button className="p-2 hover:text-primary" onClick={() => adjust(card.id, 1)}>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Clique nas cartas da coleção para adicioná-las.
                </div>
              )}
            </div>
          </ScrollArea>
        </section>
        <section className="arcane-panel overflow-hidden">
          <div className="border-b border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Coleção</h2>
                <p className="text-sm text-muted-foreground">Clique em uma carta para adicionar.</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-9"
                  placeholder="Buscar carta..."
                />
              </div>
            </div>
          </div>
          <ScrollArea className="h-[750px]">
            <div className="deck-collection-grid p-4">
              {filtered.map((card) => {
                const count = items.find((item) => item.cardId === card.id)?.quantity || 0
                const cardClass = card.card_class || 'normal'
                const isMain = main === card.id
                return (
                  <button
                    key={card.id}
                    onClick={() => adjust(card.id, 1)}
                    className="group relative text-left"
                  >
                    <CardVisual card={card} />
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-semibold" title={card.name}>
                        {card.name}
                      </p>
                      {cardClass === 'mestre' && (
                        <span className="shrink-0 rounded border border-amber-500/40 bg-amber-500/20 px-1 text-[9px] font-bold text-amber-300 uppercase">
                          Mestre
                        </span>
                      )}
                      {cardClass === 'lenda' && (
                        <span className="shrink-0 rounded border border-purple-500/40 bg-purple-500/20 px-1 text-[9px] font-bold text-purple-300 uppercase">
                          Lenda
                        </span>
                      )}
                    </div>
                    {isMain && (
                      <span className="absolute left-1 top-1 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black shadow">
                        <Crown className="h-3 w-3" />
                        Personagem
                      </span>
                    )}
                    {count > 0 && (
                      <span className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full bg-primary font-display text-xs font-bold text-primary-foreground shadow">
                        <Check className="h-3 w-3" />
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </ScrollArea>
        </section>
      </div>
    </div>
  )
}
