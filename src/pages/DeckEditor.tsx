import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  Crown,
  Eye,
  Gem,
  LoaderCircle,
  Minus,
  Plus,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CardVisual } from '@/components/CardVisual'
import { CardZoomHud } from '@/components/CardZoomHud'
import { InvocationCostDisplay } from '@/components/InvocationCostDisplay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { listCards } from '@/services/cards'
import { getDeck, saveDeck } from '@/services/decks'
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
  const [zoomCard, setZoomCard] = useState<CardRecord | null>(null)

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
      setLegendaries((old) => old.filter((legendaryId) => legendaryId !== cardId))
    }
  }

  const removeItem = (cardId: string) => {
    setItems((old) => old.filter((item) => item.cardId !== cardId))
    const card = map.get(cardId)
    toast({
      title: 'Carta removida do baralho',
      description: card ? `“${card.name}” foi retirada do baralho principal.` : undefined,
    })
  }

  const removeMainCharacter = () => {
    const card = map.get(main)
    setMain('')
    toast({
      title: 'Personagem Principal removido',
      description: card ? `“${card.name}” voltou para a coleção.` : undefined,
    })
  }

  const adjust = (cardId: string, delta: number) => {
    const targetCard = map.get(cardId)
    const cardClass = targetCard?.card_class || 'normal'

    // Regra: Carta Mestre só pode existir UMA por baralho e ela É o personagem principal
    if (delta > 0 && cardClass === 'mestre') {
      // Se já é o personagem principal atual:
      if (main === cardId) {
        toast({
          title: 'Carta Grau Mestre já selecionada',
          description: `“${targetCard?.name}” já é o Personagem Principal deste baralho. Apenas 1 carta de Grau Mestre é permitida por baralho.`,
        })
        return
      }

      // Se havia outro personagem principal, avisa a substituição
      const prevHero = main ? map.get(main) : null
      setMainCharacter(cardId)

      toast({
        title: 'Personagem Principal definido',
        description: prevHero
          ? `“${targetCard?.name}” (Grau Mestre) substituiu “${prevHero.name}” como Personagem Principal.`
          : `“${targetCard?.name}” é de Grau Mestre e foi definida automaticamente como Personagem Principal.`,
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
              description: `Cartas de Grau Lenda só podem ter no máximo 1 cópia no baralho (“${targetCard?.name}”).`,
            })
            return old
          }
        } else if (cardClass === 'normal') {
          // Normal: até 4 cópias de cada
          if (currentQty >= 4) {
            toast({
              variant: 'destructive',
              title: 'Limite de cópias atingido',
              description: `Cartas de Grau Normal podem ter até 4 cópias no baralho (“${targetCard?.name}”).`,
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
        title: 'Apenas cartas de Grau Lenda',
        description: `“${targetCard?.name || 'Esta carta'}” é de Grau ${cardClass === 'mestre' ? 'Mestre' : 'Normal'}. Apenas cartas Lenda podem ser colocadas nas zonas Lenda.`,
      })
      return
    }

    setLegendaries((old) => {
      if (old.includes(cardId)) return old.filter((legendaryId) => legendaryId !== cardId)
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
            <h2 className="font-display text-lg font-semibold">Seu baralho ({total})</h2>
            <p className="text-sm text-muted-foreground">Ajuste livremente as quantidades.</p>
          </div>
          <div className="border-b border-border bg-primary/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Crown className="h-4 w-4" />
                Personagem principal
              </h3>
              {main ? (
                <button
                  type="button"
                  onClick={removeMainCharacter}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"
                  title="Remover personagem principal"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Remover</span>
                </button>
              ) : null}
            </div>
            {main && map.get(main) ? (
              <div className="mb-2 flex items-center gap-2.5 rounded-lg border border-primary/40 bg-background/60 p-2">
                <div
                  className="cursor-pointer"
                  onClick={() => setZoomCard(map.get(main) || null)}
                  title="Ampliar personagem"
                >
                  <CardVisual
                    card={map.get(main)}
                    className="w-10 shrink-0 rounded"
                    showDetails={false}
                  />
                </div>
                <div
                  className="min-w-0 flex-1 cursor-pointer"
                  onClick={() => setZoomCard(map.get(main) || null)}
                >
                  <p className="truncate text-xs font-semibold">{map.get(main)?.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {map.get(main)?.card_class === 'mestre'
                      ? '⭐ Grau Mestre'
                      : map.get(main)?.card_class === 'lenda'
                        ? '👑 Grau Lenda'
                        : 'Personagem'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={removeMainCharacter}
                  className="rounded p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  title="Tirar personagem e voltar para a coleção"
                  aria-label="Tirar personagem principal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <select
              value={main}
              onChange={(e) => {
                const chosenId = e.target.value
                const chosen = map.get(chosenId)
                setMainCharacter(chosenId)
                if (chosen?.card_class === 'mestre') {
                  toast({
                    title: 'Personagem Principal definido',
                    description: `“${chosen.name}” (Grau Mestre) é o Personagem Principal do baralho.`,
                  })
                }
              }}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{main ? 'Trocar personagem...' : 'Escolher personagem...'}</option>
              {cards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}{' '}
                  {card.card_class === 'mestre'
                    ? '⭐ (Grau Mestre)'
                    : card.card_class === 'lenda'
                      ? '👑 (Grau Lenda)'
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
                      <span
                        className="max-w-[140px] truncate cursor-pointer hover:underline"
                        onClick={() => card && setZoomCard(card)}
                      >
                        {card?.name || 'Carta'}
                      </span>
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
                    {card.name} (Grau Lenda)
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
                    className="flex items-center gap-3 rounded-lg border border-border bg-background/35 p-2 transition hover:bg-background/60"
                  >
                    {/* Botão MENOS no lado ESQUERDO da carta */}
                    <button
                      type="button"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-background/80 text-muted-foreground hover:border-destructive/60 hover:bg-destructive/15 hover:text-destructive transition active:scale-95"
                      onClick={() => adjust(card.id, -1)}
                      title="Diminuir quantidade (retirar cópia)"
                      aria-label={`Diminuir cópia de ${card.name}`}
                    >
                      <Minus className="h-4 w-4" />
                    </button>

                    {/* Arte da carta com badge de quantidade centralizado no topo */}
                    <div
                      className="relative shrink-0 cursor-pointer"
                      onClick={() => setZoomCard(card)}
                      title="Clique para inspecionar carta"
                    >
                      <CardVisual
                        card={card}
                        className="w-12 rounded-md shadow"
                        showDetails={false}
                      />
                      {/* Quantidade centralizada no topo-centro da carta */}
                      <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 grid h-5 min-w-[20px] place-items-center rounded-full bg-amber-500 px-1 font-display text-[10px] font-bold text-black shadow-md border border-amber-300">
                        {quantity}x
                      </span>
                    </div>

                    {/* Botão MAIS no lado DIREITO da carta */}
                    <button
                      type="button"
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-background/80 text-muted-foreground hover:border-primary/60 hover:bg-primary/15 hover:text-primary transition active:scale-95"
                      onClick={() => adjust(card.id, 1)}
                      title="Aumentar quantidade (adicionar cópia)"
                      aria-label={`Adicionar cópia de ${card.name}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>

                    {/* Informações da carta */}
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => setZoomCard(card)}
                    >
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-semibold">{card.name}</p>
                        {card.card_class === 'lenda' && (
                          <span className="shrink-0 rounded border border-purple-500/40 bg-purple-500/20 px-1 text-[9px] font-bold text-purple-300 uppercase">
                            Lenda (máx 1)
                          </span>
                        )}
                        {card.card_class === 'mestre' && (
                          <span className="shrink-0 rounded border border-amber-500/40 bg-amber-500/20 px-1 text-[9px] font-bold text-amber-300 uppercase">
                            Mestre
                          </span>
                        )}
                      </div>
                      <p className="text-xs capitalize text-muted-foreground truncate">
                        {card.card_type === 'guerreiro'
                          ? 'Personagem'
                          : card.card_type === 'arma' ||
                              card.card_type === 'armadura' ||
                              card.card_type === 'reliquia'
                            ? 'Equipamento'
                            : card.card_type === 'evento'
                              ? 'Magia'
                              : card.card_type}
                        {card.card_archetype ? ` • ${card.card_archetype}` : ''}
                        {card.card_class === 'normal' || !card.card_class
                          ? ' • Grau Normal (até 4)'
                          : ''}
                      </p>
                    </div>

                    {/* Ações adicionais: Zoom e Lixeira para remover tudo */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-muted-foreground hover:text-amber-300"
                        onClick={() => setZoomCard(card)}
                        title="Ver HUD da carta"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-md border border-transparent p-1.5 text-muted-foreground hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive transition"
                        onClick={() => removeItem(card.id)}
                        title="Remover carta do baralho"
                        aria-label={`Remover ${card.name} do baralho`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-16 text-center text-sm text-muted-foreground">
                  Clique nas cartas da coleção ao lado para adicioná-las.
                </div>
              )}
            </div>
          </ScrollArea>
        </section>

        {/* Seção da Coleção de Cartas */}
        <section className="arcane-panel overflow-hidden">
          <div className="border-b border-border p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-semibold">Coleção</h2>
                <p className="text-sm text-muted-foreground">
                  Clique no card para adicionar ou use a lupa para inspecionar.
                </p>
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
                  <div key={card.id} className="group relative text-left flex flex-col">
                    <button
                      type="button"
                      onClick={() => adjust(card.id, 1)}
                      className="relative block w-full text-left transition hover:scale-[1.02] focus:outline-none"
                    >
                      <CardVisual card={card} />
                      {/* Custo no topo esquerdo se houver */}
                      {card.cost && (
                        <div className="absolute top-1 left-1 z-20 rounded bg-black/85 px-1 py-0.5 shadow border border-amber-500/40">
                          <InvocationCostDisplay cost={card.cost} size="sm" />
                        </div>
                      )}
                      {/* Badge do Personagem */}
                      {isMain && (
                        <span className="absolute left-1 bottom-1 z-20 flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold text-black shadow">
                          <Crown className="h-3 w-3" />
                          Personagem
                        </span>
                      )}
                      {/* Quantidade no baralho centralizada no topo */}
                      {count > 0 && (
                        <span className="absolute top-1 right-1 z-20 grid h-6 min-w-[24px] place-items-center rounded-full bg-amber-400 px-1 font-display text-xs font-bold text-black shadow-lg border border-amber-200">
                          {count}x
                        </span>
                      )}
                    </button>

                    <div className="mt-2 flex items-center justify-between gap-1">
                      <p className="truncate text-xs font-semibold flex-1" title={card.name}>
                        {card.name}
                      </p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setZoomCard(card)
                        }}
                        className="rounded p-1 text-muted-foreground hover:bg-primary/10 hover:text-amber-300"
                        title="Inspecionar carta"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="capitalize">{card.rarity}</span>
                      {cardClass === 'mestre' && (
                        <span className="rounded border border-amber-500/40 bg-amber-500/20 px-1 font-bold text-amber-300 uppercase">
                          Grau Mestre
                        </span>
                      )}
                      {cardClass === 'lenda' && (
                        <span className="rounded border border-purple-500/40 bg-purple-500/20 px-1 font-bold text-purple-300 uppercase">
                          Grau Lenda
                        </span>
                      )}
                      {cardClass === 'normal' && <span>• Grau Normal</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </ScrollArea>
        </section>
      </div>

      {/* HUD de Zoom */}
      <CardZoomHud
        card={zoomCard}
        open={Boolean(zoomCard)}
        onOpenChange={(open) => !open && setZoomCard(null)}
      />
    </div>
  )
}
