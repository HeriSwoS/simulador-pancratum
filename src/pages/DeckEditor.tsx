import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Check, Crown, LoaderCircle, Minus, Plus, Save, Search } from 'lucide-react'
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
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  useEffect(() => {
    Promise.all([getDeck(id), listCards()])
      .then(([deck, all]) => {
        setName(deck.name)
        setItems(Array.isArray(deck.items) ? deck.items : [])
        setMain(deck.main_character || '')
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
  const adjust = (cardId: string, delta: number) =>
    setItems((old) => {
      const current = old.find((item) => item.cardId === cardId)
      if (!current && delta > 0) return [...old, { cardId, quantity: 1 }]
      if (!current) return old
      const next = current.quantity + delta
      return next <= 0
        ? old.filter((item) => item.cardId !== cardId)
        : old.map((item) => (item.cardId === cardId ? { ...item, quantity: next } : item))
    })
  const save = async () => {
    if (!name.trim())
      return toast({ variant: 'destructive', title: 'Informe um nome para o baralho.' })
    setSaving(true)
    try {
      await saveDeck(id, { name: name.trim(), items, main_character: main })
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
            <span className="ml-1 text-xs text-muted-foreground">/ 50 cartas</span>
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
        + 1 personagem principal separado. Para testes, qualquer quantidade é permitida.
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
              onChange={(e) => setMain(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Escolher personagem...</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
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
                      <p className="truncate text-sm font-semibold">{card.name}</p>
                      <p className="text-xs capitalize text-muted-foreground">{card.card_type}</p>
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
                return (
                  <button
                    key={card.id}
                    onClick={() => adjust(card.id, 1)}
                    className="group relative text-left"
                  >
                    <CardVisual card={card} />
                    <p className="mt-2 truncate text-xs font-semibold">{card.name}</p>
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
