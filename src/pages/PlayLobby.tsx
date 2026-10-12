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

const legendaryZoneIds = ['legendary1', 'legendary2', 'legendary3'] as const

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
/** carta pré-posicionada, centralizada e virada para cima (personagem/lendárias) */
function placedInstance(cardId: string, owner: PlayerKey): CardInstance {
  return {
    uid: uid(),
    cardId,
    owner,
    faceUp: true,
    rotation: 0,
    x: 50,
    y: 50,
    z: 0,
  }
}

function makeSnapshot(deckPlayer: DeckRecord, deckOpponent?: DeckRecord): MatchSnapshot {
  const deck2 = deckOpponent || deckPlayer
  const buildCards = (deck: DeckRecord, owner: PlayerKey) =>
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
  const playerDeck = buildCards(deckPlayer, 'player')
  const opponentDeck = buildCards(deck2, 'opponent')

  const playerMain = deckPlayer.main_character || ''
  const opponentMain = deck2.main_character || ''

  const playerLegendaries = Array.isArray(deckPlayer.legendary_cards)
    ? deckPlayer.legendary_cards.slice(0, 3)
    : []
  const opponentLegendaries = Array.isArray(deck2.legendary_cards)
    ? deck2.legendary_cards.slice(0, 3)
    : []

  const buildZones = (mainId: string, legendaries: string[], owner: PlayerKey) => {
    const zones = emptyZones()
    if (mainId) {
      zones.main.push(placedInstance(mainId, owner))
    }
    legendaries.forEach((cardId, index) => {
      const zone = legendaryZoneIds[index]
      if (zone) zones[zone].push(placedInstance(cardId, owner))
    })
    return zones
  }

  return {
    version: 3,
    players: {
      player: {
        deck: playerDeck,
        hand: [],
        zones: buildZones(playerMain, playerLegendaries, 'player'),
      },
      opponent: {
        deck: opponentDeck,
        hand: [],
        zones: buildZones(opponentMain, opponentLegendaries, 'opponent'),
      },
    },
    initialDecks: {
      // o baralho embaralhado contém SÓ as cartas de quantidade — personagem e
      // lendárias ficam fora, pois já nascem no tabuleiro
      player: playerDeck.map((c) => c.cardId),
      opponent: opponentDeck.map((c) => c.cardId),
    },
    mainCharacters: { player: playerMain, opponent: opponentMain },
    playerLife: { player: 20, opponent: 20 },
    characterLife: { player: 0, opponent: 0 },
    legendaryCards: { player: playerLegendaries, opponent: opponentLegendaries },
    updatedAt: new Date().toISOString(),
  }
}

export default function PlayLobbyPage() {
  const [decks, setDecks] = useState<DeckRecord[]>([])
  const [cards, setCards] = useState<CardRecord[]>([])
  const [matches, setMatches] = useState<MatchRecord[]>([])
  const [open, setOpen] = useState(false)
  const [selectedPlayer1, setSelectedPlayer1] = useState('')
  const [selectedPlayer2, setSelectedPlayer2] = useState('')
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
        if (d[0]) {
          setSelectedPlayer1(d[0].id)
          setSelectedPlayer2(d[1] ? d[1].id : d[0].id)
        }
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
  const activeDeck1 = decks.find((deck) => deck.id === selectedPlayer1)
  const activeDeck2 = decks.find((deck) => deck.id === selectedPlayer2) || activeDeck1
  const start = async () => {
    if (!activeDeck1 || !activeDeck2) return
    if (!activeDeck1.items.length)
      return toast({
        variant: 'destructive',
        title: 'O baralho do Jogador 1 está vazio',
        description: 'Adicione cartas antes de iniciar a partida.',
      })
    if (!activeDeck2.items.length)
      return toast({
        variant: 'destructive',
        title: 'O baralho do Jogador 2 está vazio',
        description: 'Adicione cartas antes de iniciar a partida.',
      })
    setStarting(true)
    try {
      const match = await createMatch(
        activeDeck1,
        makeSnapshot(activeDeck1, activeDeck2),
        activeDeck2,
      )
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
              Selecione o baralho para o Jogador 1 (Você) e para o Jogador 2 (Adversário).
            </DialogDescription>
          </DialogHeader>
          {decks.length ? (
            <div className="space-y-5">
              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Baralho do Jogador 1 (Você)
                </Label>
                <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
                  {decks.map((deck) => {
                    const total = deck.items.reduce((sum, item) => sum + item.quantity, 0)
                    const hero = map.get(deck.main_character)
                    const isSelected = selectedPlayer1 === deck.id
                    return (
                      <button
                        key={`p1-${deck.id}`}
                        type="button"
                        onClick={() => setSelectedPlayer1(deck.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                      >
                        {hero ? (
                          <CardVisual
                            card={hero}
                            className="w-10 shrink-0 rounded-md"
                            showDetails={false}
                          />
                        ) : (
                          <div className="grid aspect-[63/88] w-10 place-items-center rounded bg-muted">
                            <Swords className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{deck.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {total} cartas •{' '}
                            {deck.main_character ? 'personagem definido' : 'sem personagem'} •{' '}
                            {Array.isArray(deck.legendary_cards) ? deck.legendary_cards.length : 0}
                            /3 lendárias
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Baralho do Jogador 2 (Adversário)
                </Label>
                <div className="mt-2 max-h-44 space-y-2 overflow-y-auto pr-1">
                  {decks.map((deck) => {
                    const total = deck.items.reduce((sum, item) => sum + item.quantity, 0)
                    const hero = map.get(deck.main_character)
                    const isSelected = selectedPlayer2 === deck.id
                    return (
                      <button
                        key={`p2-${deck.id}`}
                        type="button"
                        onClick={() => setSelectedPlayer2(deck.id)}
                        className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${isSelected ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'}`}
                      >
                        {hero ? (
                          <CardVisual
                            card={hero}
                            className="w-10 shrink-0 rounded-md"
                            showDetails={false}
                          />
                        ) : (
                          <div className="grid aspect-[63/88] w-10 place-items-center rounded bg-muted">
                            <Swords className="h-4 w-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">{deck.name}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {total} cartas •{' '}
                            {deck.main_character ? 'personagem definido' : 'sem personagem'} •{' '}
                            {Array.isArray(deck.legendary_cards) ? deck.legendary_cards.length : 0}
                            /3 lendárias
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
