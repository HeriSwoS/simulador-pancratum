import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { Copy, Layers3, LoaderCircle, Plus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CardVisual } from '@/components/CardVisual'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { createDeck, deleteDeck, duplicateDeck, listDecks } from '@/services/decks'
import { listCards } from '@/services/cards'
import type { CardRecord, DeckRecord } from '@/types/domain'

export default function DecksPage() {
  const [decks, setDecks] = useState<DeckRecord[]>([])
  const [cards, setCards] = useState<CardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  useEffect(() => {
    Promise.all([listDecks(), listCards()])
      .then(([d, c]) => {
        setDecks(d)
        setCards(c)
      })
      .catch((error) =>
        toast({
          variant: 'destructive',
          title: 'Falha ao carregar baralhos',
          description: error instanceof Error ? error.message : 'Tente novamente.',
        }),
      )
      .finally(() => setLoading(false))
  }, [])
  const map = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards])
  const create = async () => {
    setCreating(true)
    try {
      const deck = await createDeck()
      navigate(`/baralhos/${deck.id}`)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível criar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setCreating(false)
    }
  }
  const remove = async (deck: DeckRecord) => {
    if (!window.confirm(`Excluir o baralho “${deck.name}”?`)) return
    try {
      await deleteDeck(deck.id)
      setDecks((old) => old.filter((item) => item.id !== deck.id))
      toast({ title: 'Baralho excluído' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }
  const duplicate = async (deck: DeckRecord) => {
    try {
      const copy = await duplicateDeck(deck)
      setDecks((old) => [copy, ...old])
      toast({ title: 'Baralho duplicado' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível duplicar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }
  return (
    <div className="page-shell">
      <div className="page-heading page-heading--row">
        <div>
          <span className="eyebrow">Oficina de estratégias</span>
          <h1>Meus baralhos</h1>
          <p>Monte seus testes com 50 cartas e um personagem principal separado.</p>
        </div>
        <Button className="gold-button" onClick={create} disabled={creating}>
          {creating ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Criar baralho
        </Button>
      </div>
      {loading ? (
        <div className="grid min-h-80 place-items-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : decks.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => {
            const total = deck.items.reduce((sum, item) => sum + item.quantity, 0)
            const faces = deck.items
              .map((item) => map.get(item.cardId))
              .filter(Boolean)
              .slice(0, 4) as CardRecord[]
            return (
              <article key={deck.id} className="arcane-panel overflow-hidden p-5">
                <button
                  type="button"
                  className="block w-full text-left"
                  onClick={() => navigate(`/baralhos/${deck.id}`)}
                >
                  <div className="deck-fan">
                    {faces.length ? (
                      faces.map((card, index) => (
                        <div
                          key={card.id}
                          className="absolute left-1/2 top-1/2 w-[82px]"
                          style={{ '--fan-index': index } as CSSProperties}
                        >
                          <CardVisual card={card} />
                        </div>
                      ))
                    ) : (
                      <div className="grid h-full place-items-center text-muted-foreground">
                        <Layers3 className="h-10 w-10" />
                      </div>
                    )}
                  </div>
                  <h2 className="mt-5 truncate font-display text-xl font-semibold">{deck.name}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {total} cartas •{' '}
                    {deck.main_character ? 'Personagem definido' : 'Sem personagem'}
                  </p>
                </button>
                <div className="mt-5 flex gap-2 border-t border-border pt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => void duplicate(deck)}
                  >
                    <Copy className="mr-2 h-3.5 w-3.5" />
                    Duplicar
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => void remove(deck)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Layers3 />
          <h2>Nenhum baralho forjado</h2>
          <p>Crie um baralho para começar a testar o PANCRATUM.</p>
          <Button className="gold-button mt-5" onClick={create}>
            <Plus className="mr-2 h-4 w-4" />
            Criar primeiro baralho
          </Button>
        </div>
      )}
    </div>
  )
}
