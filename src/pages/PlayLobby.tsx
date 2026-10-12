import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, History, LoaderCircle, Play, Swords } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { CardVisual } from '@/components/CardVisual'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { listCards } from '@/services/cards'
import { listDecks } from '@/services/decks'
import { createMatch, listRecentMatches } from '@/services/matches'
import {
  emptyZones,
  type CardInstance,
  type CardRecord,
  type DeckRecord,
  type MatchRecord,
  type MatchSnapshot,
  type PlayerKey,
} from '@/types/domain'

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}
function shuffled<T>(items: T[]) {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
function makeSnapshot(deck: DeckRecord): MatchSnapshot {
  const build = (owner: PlayerKey) =>
    shuffled(
      deck.items.flatMap((item) => Array.from({ length: item.quantity }, () => item.cardId)),
    ).map<CardInstance>((cardId, index) => ({
      uid: uid(),
      cardId,
      owner,
      faceUp: false,
      rotation: 0,
      x: 0,
      y: 0,
      z: index,
    }))
  const playerDeck = build('player')
  const opponentDeck = build('opponent')
  const mainId = deck.main_character || ''
  const playerZones = emptyZones()
  const opponentZones = emptyZones()
  if (mainId) {
    playerZones.main.push({
      uid: uid(),
      cardId: mainId,
      owner: 'player',
      faceUp: true,
      rotation: 0,
      x: 0,
      y: 0,
      z: 0,
    })
    opponentZones.main.push({
      uid: uid(),
      cardId: mainId,
      owner: 'opponent',
      faceUp: true,
      rotation: 0,
      x: 0,
      y: 0,
      z: 0,
    })
  }
  return {
    version: 1,
    players: {
      player: { deck: playerDeck, hand: [], zones: playerZones },
      opponent: { deck: opponentDeck, hand: [], zones: opponentZones },
    },
    initialDecks: {
      player: playerDeck.map((c) => c.cardId),
      opponent: opponentDeck.map((c) => c.cardId),
    },
    mainCharacters: { player: mainId, opponent: mainId },
    updatedAt: new Date().toISOString(),
  }
}

export default function PlayLobbyPage() {
  const [decks, setDecks] = useState<DeckRecord[]>([])
  const [cards, setCards] = useState<CardRecord[]>([])
  const [matches, setMatches] = useState<MatchRecord[]>([])
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  useEffect(() => {
    Promise.all([listDecks(), listCards(), listRecentMatches()])
      .then(([d, c, m]) => {
        setDecks(d)
        setCards(c)
        setMatches(m)
        if (d[0]) setSelected(d[0].id)
      })
      .catch((error) =>
        toast({
          variant: 'destructive',
          title: 'Não foi possível preparar a arena',
          description: error instanceof Error ? error.message : 'Tente novamente.',
        }),
      )
      .finally(() => setLoading(false))
  }, [])
  const map = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards])
  const activeDeck = decks.find((deck) => deck.id === selected)
  const start = async () => {
    if (!activeDeck) return
    if (!activeDeck.items.length)
      return toast({
        variant: 'destructive',
        title: 'Este baralho está vazio',
        description: 'Adicione cartas antes de iniciar a partida.',
      })
    setStarting(true)
    try {
      const match = await createMatch(activeDeck, makeSnapshot(activeDeck))
      navigate(`/play/${match.id}`)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível iniciar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setStarting(false)
    }
  }
  return (
    <div className="page-shell">
      <section className="play-hero">
        <div>
          <span className="eyebrow">Modo de treinamento local</span>
          <h1>Duas mesas. Controle total.</h1>
          <p>
            Teste combos e mecânicas controlando os dois lados, sem regras automáticas interferindo
            na sua partida.
          </p>
          <Button
            size="lg"
            className="gold-button mt-7"
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            <Play className="mr-2 h-5 w-5" />
            Criar partida
          </Button>
        </div>
        <Swords className="play-hero__icon" />
      </section>
      <section className="mt-12">
        <div className="mb-5 flex items-center gap-3">
          <History className="text-primary" />
          <div>
            <h2 className="font-display text-2xl font-semibold">Partidas recentes</h2>
            <p className="text-sm text-muted-foreground">Continue de onde parou.</p>
          </div>
        </div>
        {loading ? (
          <LoaderCircle className="mx-auto my-20 h-8 w-8 animate-spin text-primary" />
        ) : matches.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {matches.map((match) => (
              <button
                key={match.id}
                onClick={() => navigate(`/play/${match.id}`)}
                className="arcane-panel flex items-center justify-between gap-4 p-5 text-left transition hover:border-primary/40"
              >
                <div className="min-w-0">
                  <p className="truncate font-display font-semibold">{match.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Atualizada em {new Date(match.updated).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <ArrowRight className="shrink-0 text-primary" />
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-state py-14">
            <Swords />
            <h2>Nenhuma partida ainda</h2>
            <p>Escolha um baralho e abra a primeira mesa.</p>
          </div>
        )}
      </section>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Preparar partida</DialogTitle>
            <DialogDescription>
              O mesmo baralho será montado nos dois lados para o treino local.
            </DialogDescription>
          </DialogHeader>
          {decks.length ? (
            <div className="space-y-5">
              <div>
                <Label>Escolha o baralho</Label>
                <div className="mt-3 space-y-2">
                  {decks.map((deck) => {
                    const total = deck.items.reduce((sum, item) => sum + item.quantity, 0)
                    const hero = map.get(deck.main_character)
                    return (
                      <button
                        key={deck.id}
                        type="button"
                        onClick={() => setSelected(deck.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected === deck.id ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                      >
                        {hero ? (
                          <CardVisual
                            card={hero}
                            className="w-12 shrink-0 rounded-md"
                            showDetails={false}
                          />
                        ) : (
                          <div className="grid aspect-[63/88] w-12 place-items-center rounded bg-muted">
                            <Swords className="h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{deck.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {total} cartas •{' '}
                            {deck.main_character ? 'personagem definido' : 'sem personagem'}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
              <Button
                className="gold-button w-full"
                onClick={() => void start()}
                disabled={starting}
              >
                {starting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}Montar tabuleiro
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Crie um baralho antes de iniciar.</p>
              <Button className="mt-4" onClick={() => navigate('/baralhos')}>
                Ir para baralhos
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
