import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type DragEvent,
  type MouseEvent,
  type ReactNode,
} from 'react'
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Crown,
  Eye,
  EyeOff,
  Hand,
  Layers3,
  LoaderCircle,
  MoreVertical,
  Orbit,
  RotateCw,
  Save,
  Shield,
  Shuffle,
  Skull,
  Sparkles,
  Swords,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CardBack, CardVisual, normalizeCardColor } from '@/components/CardVisual'
import { CardZoomHud } from '@/components/CardZoomHud'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { listCards } from '@/services/cards'
import { getMatch, saveMatchState } from '@/services/matches'
import {
  emptyZones,
  normalizeSnapshot,
  zoneIds,
  zoneLabels,
  type CardInstance,
  type CardRecord,
  type MatchRecord,
  type MatchSnapshot,
  type PlayerKey,
  type ZoneId,
} from '@/types/domain'

interface Locator {
  player: PlayerKey
  area: 'hand' | 'zone'
  uid: string
  zone?: ZoneId
}
interface CardMenuState {
  locator: Locator
  x: number
  y: number
}
interface PileState {
  player: PlayerKey
  zone: 'graveyard' | 'banishment'
}
type ZoneKind =
  | 'legendary'
  | 'attack'
  | 'defense'
  | 'equipment'
  | 'main'
  | 'resource'
  | 'graveyard'
  | 'banishment'

const centerRows: { kind: ZoneKind; zones: ZoneId[] }[] = [
  { kind: 'attack', zones: ['attack1', 'attack2', 'attack3', 'attack4', 'attack5'] },
  { kind: 'defense', zones: ['defense1', 'defense2', 'defense3', 'defense4', 'defense5'] },
  { kind: 'equipment', zones: ['equipment1', 'equipment2', 'main', 'equipment3', 'equipment4'] },
]
const legendaryZones: ZoneId[] = ['legendary1', 'legendary2', 'legendary3']
const sideZones: { id: ZoneId; kind: ZoneKind }[] = [
  { id: 'banishment', kind: 'banishment' },
  { id: 'graveyard', kind: 'graveyard' },
]

function randomUid() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}
function cloneSnapshot(value: MatchSnapshot): MatchSnapshot {
  return JSON.parse(JSON.stringify(value)) as MatchSnapshot
}
function shuffle<T>(value: T[]) {
  const result = [...value]
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
function locateCard(state: MatchSnapshot, locator: Locator): CardInstance | undefined {
  const player = state.players[locator.player]
  if (locator.area === 'hand') return player.hand.find((card) => card.uid === locator.uid)
  return locator.zone
    ? player.zones[locator.zone].find((card) => card.uid === locator.uid)
    : undefined
}
function takeCard(state: MatchSnapshot, locator: Locator): CardInstance | undefined {
  const list =
    locator.area === 'hand'
      ? state.players[locator.player].hand
      : locator.zone
        ? state.players[locator.player].zones[locator.zone]
        : []
  const index = list.findIndex((card) => card.uid === locator.uid)
  if (index < 0) return undefined
  return list.splice(index, 1)[0]
}
function zoneKindIcon(kind: ZoneKind) {
  if (kind === 'legendary' || kind === 'main') return Crown
  if (kind === 'attack') return Swords
  if (kind === 'defense') return Shield
  if (kind === 'resource') return Orbit
  if (kind === 'graveyard') return Skull
  if (kind === 'banishment') return Sparkles
  return Sparkles
}
function zoneKind(id: ZoneId): ZoneKind {
  if (id.startsWith('legendary')) return 'legendary'
  if (id.startsWith('attack')) return 'attack'
  if (id.startsWith('defense')) return 'defense'
  if (id.startsWith('equipment')) return 'equipment'
  if (id === 'main') return 'main'
  if (id === 'resources') return 'resource'
  if (id === 'graveyard') return 'graveyard'
  return 'banishment'
}
/** carta nascida no tabuleiro: centralizada na zona e virada para cima */
function placedInstance(cardId: string, owner: PlayerKey): CardInstance {
  return {
    uid: randomUid(),
    cardId,
    owner,
    faceUp: true,
    rotation: 0,
    x: 50,
    y: 50,
    z: 0,
  }
}
function createResetSnapshot(current: MatchSnapshot): MatchSnapshot {
  const build = (player: PlayerKey) =>
    shuffle(current.initialDecks[player]).map<CardInstance>((cardId, index) => ({
      uid: randomUid(),
      cardId,
      owner: player,
      faceUp: false,
      rotation: 0,
      x: 0,
      y: 0,
      z: index,
    }))
  const playerDeck = build('player')
  const opponentDeck = build('opponent')
  const buildZones = (player: PlayerKey) => {
    const zones = emptyZones()
    const mainId = current.mainCharacters[player]
    if (mainId) zones.main.push(placedInstance(mainId, player))
    const legendaries = current.legendaryCards?.[player] ?? []
    legendaries.slice(0, 3).forEach((cardId, index) => {
      const zone = legendaryZones[index]
      if (zone && cardId) zones[zone].push(placedInstance(cardId, player))
    })
    return zones
  }
  return {
    ...current,
    players: {
      player: { deck: playerDeck, hand: [], zones: buildZones('player') },
      opponent: { deck: opponentDeck, hand: [], zones: buildZones('opponent') },
    },
    playerLife: current.playerLife ?? { player: 20, opponent: 20 },
    characterLife: current.characterLife ?? { player: 0, opponent: 0 },
    legendaryCards: current.legendaryCards ?? { player: [], opponent: [] },
    version: 3,
    updatedAt: new Date().toISOString(),
  }
}

export default function MatchPage() {
  const { matchId = '' } = useParams()
  const navigate = useNavigate()
  const { toast } = useToast()
  const [match, setMatch] = useState<MatchRecord | null>(null)
  const [state, setState] = useState<MatchSnapshot | null>(null)
  const [cards, setCards] = useState<CardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [dragging, setDragging] = useState<Locator | null>(null)
  const [selected, setSelected] = useState<Locator | null>(null)
  const [preview, setPreview] = useState<CardInstance | null>(null)
  const [menu, setMenu] = useState<CardMenuState | null>(null)
  const [pile, setPile] = useState<PileState | null>(null)
  const [shuffling, setShuffling] = useState<PlayerKey | null>(null)
  const [justDrawn, setJustDrawn] = useState('')
  const dirty = useRef(false)

  useEffect(() => {
    Promise.all([getMatch(matchId), listCards()])
      .then(([record, allCards]) => {
        setMatch(record)
        setState(normalizeSnapshot(record.state))
        setCards(allCards)
      })
      .catch((error) => {
        toast({
          variant: 'destructive',
          title: 'Partida não encontrada',
          description: error instanceof Error ? error.message : 'Volte e tente novamente.',
        })
        navigate('/jogar')
      })
      .finally(() => setLoading(false))
  }, [matchId])
  useEffect(() => {
    if (!state || !dirty.current) return
    const timer = window.setTimeout(() => {
      setSaving(true)
      saveMatchState(matchId, state)
        .then((record) => setMatch(record))
        .catch((error) =>
          toast({
            variant: 'destructive',
            title: 'Estado não salvo',
            description:
              error instanceof Error ? error.message : 'Tente outra ação para salvar novamente.',
          }),
        )
        .finally(() => {
          dirty.current = false
          setSaving(false)
        })
    }, 450)
    return () => window.clearTimeout(timer)
  }, [state, matchId])
  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('resize', close)
    window.addEventListener('scroll', close, true)
    return () => {
      window.removeEventListener('resize', close)
      window.removeEventListener('scroll', close, true)
    }
  }, [menu])
  const cardMap = useMemo(() => new Map(cards.map((card) => [card.id, card])), [cards])
  const update = useCallback((mutator: (draft: MatchSnapshot) => void) => {
    setState((current) => {
      if (!current) return current
      const next = cloneSnapshot(current)
      mutator(next)
      next.updatedAt = new Date().toISOString()
      dirty.current = true
      return next
    })
  }, [])

  const draw = (player: PlayerKey) =>
    update((draft) => {
      const card = draft.players[player].deck.pop()
      if (!card) {
        toast({ title: 'Baralho vazio', description: 'Não há cartas para comprar.' })
        return
      }
      card.faceUp = true
      card.rotation = 0
      draft.players[player].hand.push(card)
      setJustDrawn(card.uid)
      window.setTimeout(() => setJustDrawn(''), 520)
    })
  const shuffleDeck = (player: PlayerKey) => {
    setShuffling(player)
    update((draft) => {
      draft.players[player].deck = shuffle(draft.players[player].deck)
    })
    window.setTimeout(() => setShuffling(null), 650)
    toast({ title: 'Baralho embaralhado' })
  }
  const moveToZone = (
    locator: Locator,
    player: PlayerKey,
    zone: ZoneId,
    x?: number,
    y?: number,
  ) => {
    // Validação: Zonas LENDA 1, 2 e 3 só aceitam cartas de classe Lenda
    if (zone === 'legendary1' || zone === 'legendary2' || zone === 'legendary3') {
      const targetCard = locateCard(state, locator)
      if (targetCard) {
        const cardDef = cardMap.get(targetCard.cardId)
        const cardClass = cardDef?.card_class || 'normal'
        if (cardClass !== 'lenda') {
          toast({
            variant: 'destructive',
            title: 'Zona exclusiva para Lendas',
            description: `Apenas cartas da classe Lenda podem ser colocadas na zona ${zoneLabels[zone]}. “${cardDef?.name || 'Esta carta'}” é de classe ${cardClass === 'mestre' ? 'Mestre' : 'Normal'}.`,
          })
          return
        }
      }
    }

    update((draft) => {
      const card = takeCard(draft, locator)
      if (!card) return
      const list = draft.players[player].zones[zone]
      // Se não houver coordenadas explícitas (ex.: mover via clique na zona ou menu),
      // a carta fica perfeitamente centralizada em (50, 50).
      // Na zona de Recursos, o usuário pode mover livremente as cartas dentro dela (12% a 88%).
      // Nas outras zonas menores, limitamos o centro (42-58) para evitar transbordamento.
      if (x === undefined || y === undefined) {
        card.x = 50
        card.y = 50
      } else if (zone === 'resources') {
        card.x = Math.max(12, Math.min(88, x))
        card.y = Math.max(12, Math.min(88, y))
      } else {
        card.x = Math.max(42, Math.min(58, x))
        card.y = Math.max(42, Math.min(58, y))
      }
      card.z = list.reduce((max, item) => Math.max(max, item.z), 0) + 1
      list.push(card)
    })
  }
  const moveToHand = (locator: Locator, player: PlayerKey, index?: number) =>
    update((draft) => {
      const card = takeCard(draft, locator)
      if (!card) return
      card.rotation = 0
      card.x = 0
      card.y = 0
      const hand = draft.players[player].hand
      hand.splice(
        index === undefined ? hand.length : Math.max(0, Math.min(index, hand.length)),
        0,
        card,
      )
    })
  const returnToDeck = (locator: Locator, position: 'top' | 'bottom') =>
    update((draft) => {
      const card = takeCard(draft, locator)
      if (!card) return
      card.faceUp = false
      card.rotation = 0
      card.x = 0
      card.y = 0
      const deck = draft.players[locator.player].deck
      if (position === 'top') deck.push(card)
      else deck.unshift(card)
    })
  const alterCard = (locator: Locator, fn: (card: CardInstance) => void) =>
    update((draft) => {
      const card = locateCard(draft, locator)
      if (card) fn(card)
    })
  const deleteInstance = (locator: Locator) =>
    update((draft) => {
      takeCard(draft, locator)
    })
  const handleCardClick = (locator: Locator) => {
    // girar por clique: qualquer carta no tabuleiro alterna em pé ↔ deitada (90°)
    if (locator.area === 'zone') {
      alterCard(locator, (card) => {
        card.rotation = card.rotation === 90 ? 0 : 90
      })
      return
    }
    setSelected((current) => (current?.uid === locator.uid ? null : locator))
  }
  const handleZoneClick = (player: PlayerKey, zone: ZoneId) => {
    if (selected) {
      moveToZone(selected, player, zone)
      setSelected(null)
      return
    }
    if (zone === 'graveyard' || zone === 'banishment') setPile({ player, zone })
  }
  const dropOnZone = (event: DragEvent, player: PlayerKey, zone: ZoneId) => {
    event.preventDefault()
    const locator = parseDrag(event)
    if (!locator) return
    const rect = event.currentTarget.getBoundingClientRect()
    // Calcula posição relativa ao centro da zona (em % de 0 a 100)
    let rawX = ((event.clientX - rect.left) / rect.width) * 100
    let rawY = ((event.clientY - rect.top) / rect.height) * 100
    if (player === 'opponent') {
      rawX = 100 - rawX
      rawY = 100 - rawY
    }
    // Snap magnético: se soltar em torno do centro (entre 35% e 65%),
    // fixa exatamente em 50%, 50% para um alinhamento perfeito sem desvio acidental (exceto na zona de Recursos onde o movimento é livre).
    const snapThreshold = zone === 'resources' ? 0 : 15
    const x = Math.abs(rawX - 50) <= snapThreshold ? 50 : rawX
    const y = Math.abs(rawY - 50) <= snapThreshold ? 50 : rawY
    moveToZone(locator, player, zone, x, y)
    setDragging(null)
    setSelected(null)
  }
  const dropOnHand = (event: DragEvent, player: PlayerKey) => {
    event.preventDefault()
    const locator = parseDrag(event)
    if (!locator || !state) return
    const rect = event.currentTarget.getBoundingClientRect()
    const index = Math.round(
      ((event.clientX - rect.left) / rect.width) * state.players[player].hand.length,
    )
    moveToHand(locator, player, index)
    setDragging(null)
    setSelected(null)
  }
  const parseDrag = (event: DragEvent): Locator | null => {
    try {
      return JSON.parse(event.dataTransfer.getData('application/pancratum-card')) as Locator
    } catch {
      return dragging
    }
  }
  const startDrag = (event: DragEvent, locator: Locator) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('application/pancratum-card', JSON.stringify(locator))
    setDragging(locator)
  }
  const openMenu = (event: MouseEvent, locator: Locator) => {
    event.preventDefault()
    event.stopPropagation()
    setMenu({
      locator,
      x: Math.min(event.clientX, window.innerWidth - 260),
      y: Math.min(event.clientY, window.innerHeight - 430),
    })
  }
  const setPlayerLife = (player: PlayerKey, value: number) =>
    update((draft) => {
      const next: Record<PlayerKey, number> = { ...draft.playerLife }
      next[player] = Math.max(0, value)
      draft.playerLife = next
    })
  const setCharacterLife = (player: PlayerKey, value: number) =>
    update((draft) => {
      const next: Record<PlayerKey, number> = { ...draft.characterLife }
      next[player] = Math.max(0, value)
      draft.characterLife = next
    })
  const reset = () => {
    if (
      !state ||
      !window.confirm(
        'Reiniciar a partida? Todas as cartas voltarão aos baralhos e as mãos serão esvaziadas.',
      )
    )
      return
    setState(createResetSnapshot(state))
    dirty.current = true
    toast({ title: 'Partida reiniciada', description: 'Os dois lados voltaram ao estado inicial.' })
  }

  if (loading || !state)
    return (
      <div className="grid min-h-screen place-items-center bg-[#0b0806]">
        <LoaderCircle className="h-9 w-9 animate-spin text-primary" />
      </div>
    )
  const selectedCard = selected ? locateCard(state, selected) : undefined
  return (
    <div className="match-screen">
      <header className="match-toolbar">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={() => navigate('/jogar')}
            aria-label="Sair da partida"
          >
            <ArrowLeft />
          </Button>
          <div className="min-w-0">
            <h1 className="truncate font-display text-sm font-semibold text-primary sm:text-base">
              {match?.name || 'Treino PANCRATUM'}
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Modo local • dois tabuleiros
            </p>
          </div>
        </div>
        <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
          {saving ? (
            <>
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-3.5 w-3.5 text-emerald-500" />
              Estado salvo
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={reset}>
            <RotateCw className="mr-0 h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Reiniciar partida</span>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link to="/jogar">
              <X />
            </Link>
          </Button>
        </div>
      </header>
      {selectedCard && (
        <div className="selection-banner">
          <Hand className="h-4 w-4" />
          <span>
            <strong>{cardMap.get(selectedCard.cardId)?.name || 'Carta'}</strong> selecionada — toque
            em uma zona para mover.
          </span>
          <button onClick={() => setSelected(null)}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <div className="tabletop">
        <HandRow
          player="opponent"
          state={state}
          cardMap={cardMap}
          selected={selected}
          justDrawn={justDrawn}
          onDrop={dropOnHand}
          onDragStart={startDrag}
          onCardClick={handleCardClick}
          onPreview={(card) => setPreview(card)}
          onMenu={openMenu}
        />
        <Board
          player="opponent"
          state={state}
          cardMap={cardMap}
          dragging={dragging}
          selected={selected}
          shuffling={shuffling === 'opponent'}
          onDraw={draw}
          onShuffle={shuffleDeck}
          onDrop={dropOnZone}
          onZoneClick={handleZoneClick}
          onDragStart={startDrag}
          onCardClick={handleCardClick}
          onPreview={(card) => setPreview(card)}
          onMenu={openMenu}
          onDeckSelected={() => {
            if (selected) {
              returnToDeck(selected, 'top')
              setSelected(null)
            } else draw('opponent')
          }}
          onPlayerLife={setPlayerLife}
          onCharacterLife={setCharacterLife}
        />
        <div className="arena-divider">
          <span>ADVERSÁRIO</span>
          <div>
            <Swords />
            <b>ARENA DE TREINO</b>
            <Swords />
          </div>
          <span>VOCÊ</span>
        </div>
        <Board
          player="player"
          state={state}
          cardMap={cardMap}
          dragging={dragging}
          selected={selected}
          shuffling={shuffling === 'player'}
          onDraw={draw}
          onShuffle={shuffleDeck}
          onDrop={dropOnZone}
          onZoneClick={handleZoneClick}
          onDragStart={startDrag}
          onCardClick={handleCardClick}
          onPreview={(card) => setPreview(card)}
          onMenu={openMenu}
          onDeckSelected={() => {
            if (selected) {
              returnToDeck(selected, 'top')
              setSelected(null)
            } else draw('player')
          }}
          onPlayerLife={setPlayerLife}
          onCharacterLife={setCharacterLife}
        />
        <HandRow
          player="player"
          state={state}
          cardMap={cardMap}
          selected={selected}
          justDrawn={justDrawn}
          onDrop={dropOnHand}
          onDragStart={startDrag}
          onCardClick={handleCardClick}
          onPreview={(card) => setPreview(card)}
          onMenu={openMenu}
        />
      </div>
      <CardZoomHud
        card={preview ? cardMap.get(preview.cardId) : null}
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
        faceUp={preview ? preview.faceUp : true}
      />
      <PileDialog
        pile={pile}
        state={state}
        cardMap={cardMap}
        onClose={() => setPile(null)}
        onSelect={(locator) => {
          setSelected(locator)
          setPile(null)
        }}
        onHand={(locator) => {
          moveToHand(locator, locator.player)
          setPile(null)
        }}
        onPreview={setPreview}
        onDragStart={startDrag}
      />
      {menu && (
        <CardContextMenu
          menu={menu}
          state={state}
          cardMap={cardMap}
          onClose={() => setMenu(null)}
          onFlip={() => {
            alterCard(menu.locator, (card) => {
              card.faceUp = !card.faceUp
            })
            setMenu(null)
          }}
          onPreview={() => {
            const card = locateCard(state, menu.locator)
            if (card) setPreview(card)
            setMenu(null)
          }}
          onDeck={(position) => {
            returnToDeck(menu.locator, position)
            setMenu(null)
          }}
          onHand={() => {
            moveToHand(menu.locator, menu.locator.player)
            setMenu(null)
          }}
          onZone={(zone) => {
            moveToZone(menu.locator, menu.locator.player, zone)
            setMenu(null)
          }}
          onDelete={() => {
            deleteInstance(menu.locator)
            setMenu(null)
          }}
        />
      )}
    </div>
  )
}

interface BoardProps {
  player: PlayerKey
  state: MatchSnapshot
  cardMap: Map<string, CardRecord>
  dragging: Locator | null
  selected: Locator | null
  shuffling: boolean
  onDraw: (player: PlayerKey) => void
  onShuffle: (player: PlayerKey) => void
  onDrop: (event: DragEvent, player: PlayerKey, zone: ZoneId) => void
  onZoneClick: (player: PlayerKey, zone: ZoneId) => void
  onDragStart: (event: DragEvent, locator: Locator) => void
  onCardClick: (locator: Locator) => void
  onPreview: (card: CardInstance) => void
  onMenu: (event: MouseEvent, locator: Locator) => void
  onDeckSelected: () => void
  onPlayerLife: (player: PlayerKey, value: number) => void
  onCharacterLife: (player: PlayerKey, value: number) => void
}
function Board(props: BoardProps) {
  const { player, state, cardMap, dragging, selected } = props
  return (
    <div className="board-viewport">
      <div className={cn('board-container', player === 'opponent' && 'board-container--opponent')}>
        <div className={cn('battle-board', player === 'opponent' && 'battle-board--opponent')}>
          <div className="board-column board-column--legendary">
            {legendaryZones.map((zone) => (
              <BoardZone
                key={zone}
                player={player}
                zone={zone}
                kind="legendary"
                state={state}
                cardMap={cardMap}
                dragging={dragging}
                selected={selected}
                {...cardHandlers(props)}
              />
            ))}
          </div>
          <div className="board-center">
            {centerRows.map((row) => (
              <div className="board-row" key={row.kind}>
                {row.zones.map((zone) => (
                  <BoardZone
                    key={zone}
                    player={player}
                    zone={zone}
                    kind={zone === 'main' ? 'main' : row.kind}
                    state={state}
                    cardMap={cardMap}
                    dragging={dragging}
                    selected={selected}
                    widgets={
                      zone === 'main' ? (
                        <MatchWidgets
                          playerLife={state.playerLife?.[player] ?? 0}
                          characterLife={state.characterLife?.[player] ?? 0}
                          onPlayerLife={(value) => props.onPlayerLife(player, value)}
                          onCharacterLife={(value) => props.onCharacterLife(player, value)}
                        />
                      ) : undefined
                    }
                    {...cardHandlers(props)}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="board-column board-column--side">
            {sideZones.map(({ id, kind }) => (
              <BoardZone
                key={id}
                player={player}
                zone={id}
                kind={kind}
                state={state}
                cardMap={cardMap}
                dragging={dragging}
                selected={selected}
                {...cardHandlers(props)}
              />
            ))}
            <DeckZone
              player={player}
              count={state.players[player].deck.length}
              shuffling={props.shuffling}
              onClick={props.onDeckSelected}
              onShuffle={() => props.onShuffle(player)}
            />
          </div>
        </div>
        <aside
          className={cn(
            'board-external-panel',
            player === 'opponent' && 'board-external-panel--opponent',
          )}
        >
          <div className="board-external-resource">
            <BoardZone
              player={player}
              zone="resources"
              kind="resource"
              state={state}
              cardMap={cardMap}
              dragging={dragging}
              selected={selected}
              {...cardHandlers(props)}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
function cardHandlers(props: BoardProps) {
  return {
    onDrop: props.onDrop,
    onZoneClick: props.onZoneClick,
    onDragStart: props.onDragStart,
    onCardClick: props.onCardClick,
    onPreview: props.onPreview,
    onMenu: props.onMenu,
  }
}

interface BoardZoneProps {
  player: PlayerKey
  zone: ZoneId
  kind: ZoneKind
  state: MatchSnapshot
  cardMap: Map<string, CardRecord>
  dragging: Locator | null
  selected: Locator | null
  widgets?: ReactNode
  onDrop: BoardProps['onDrop']
  onZoneClick: BoardProps['onZoneClick']
  onDragStart: BoardProps['onDragStart']
  onCardClick: BoardProps['onCardClick']
  onPreview: BoardProps['onPreview']
  onMenu: BoardProps['onMenu']
}
function BoardZone({
  player,
  zone,
  kind,
  state,
  cardMap,
  dragging,
  selected,
  widgets,
  onDrop,
  onZoneClick,
  onDragStart,
  onCardClick,
  onPreview,
  onMenu,
}: BoardZoneProps) {
  const Icon = zoneKindIcon(kind)
  const instances = state.players[player].zones[zone]
  const upright = instances.filter((card) => card.rotation === 0).length
  const lying = instances.length - upright

  // Contagem de cores na zona de Recursos considerando SOMENTE as cartas em pé (rotation === 0)
  const colorCounts = useMemo(() => {
    if (kind !== 'resource') return []
    const counts: Record<string, number> = {}
    instances.forEach((inst) => {
      if (inst.rotation === 0) {
        const cRecord = cardMap.get(inst.cardId)
        const norm = normalizeCardColor(cRecord?.color) || 'neutro'
        counts[norm] = (counts[norm] || 0) + 1
      }
    })
    const colorMeta: Record<
      string,
      { label: string; plural: string; hex: string; border: string }
    > = {
      azul: { label: 'azul', plural: 'azuis', hex: '#2563eb', border: '#3b82f6' },
      vermelho: { label: 'vermelha', plural: 'vermelhas', hex: '#dc2626', border: '#ef4444' },
      amarelo: { label: 'amarela', plural: 'amarelas', hex: '#eab308', border: '#facc15' },
      verde: { label: 'verde', plural: 'verdes', hex: '#16a34a', border: '#22c55e' },
      laranja: { label: 'laranja', plural: 'laranjas', hex: '#ea580c', border: '#f97316' },
      roxo: { label: 'roxa', plural: 'roxas', hex: '#9333ea', border: '#a855f7' },
      branco: { label: 'branca', plural: 'brancas', hex: '#f3f4f6', border: '#ffffff' },
      preto: { label: 'preta', plural: 'pretas', hex: '#1f2937', border: '#4b5563' },
      cinza: { label: 'cinza', plural: 'cinzas', hex: '#6b7280', border: '#9ca3af' },
      neutro: { label: 'cinza', plural: 'cinzas', hex: '#6b7280', border: '#9ca3af' },
    }
    return Object.entries(counts).map(([colorKey, count]) => {
      const meta = colorMeta[colorKey] || {
        label: colorKey,
        plural: colorKey,
        hex: '#70bd4e',
        border: '#8fd06a',
      }
      return {
        key: colorKey,
        count,
        label: count === 1 ? `${count} ${meta.label}` : `${count} ${meta.plural}`,
        hex: meta.hex,
        border: meta.border,
      }
    })
  }, [kind, instances, cardMap])

  return (
    <div
      className={cn(
        'board-zone',
        `board-zone--${kind}`,
        (dragging || selected) && 'board-zone--target',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
      }}
      onDrop={(e) => onDrop(e, player, zone)}
      onClick={() => onZoneClick(player, zone)}
    >
      <div className="zone-watermark">
        <Icon />
      </div>
      <div className={cn('zone-label', zone === 'main' && 'zone-label--top')}>
        {zoneLabels[zone]}
      </div>

      {/* HUD de contagem de cores na zona de recursos (somente cartas em pé) */}
      {kind === 'resource' && colorCounts.length > 0 && (
        <div
          className="resource-color-hud"
          title="Cores das cartas em pé presentes na zona de recursos"
        >
          {colorCounts.map((c) => (
            <span
              key={c.key}
              className="resource-color-chip"
              style={{ '--chip-border': c.border } as CSSProperties}
            >
              <span className="resource-color-dot" style={{ backgroundColor: c.hex }} />
              <span>{c.label}</span>
            </span>
          ))}
        </div>
      )}

      {kind === 'resource' && (
        <div className="zone-res-count" aria-label="Contador de recursos">
          <span className="up" title="Cartas em pé (disponíveis)">
            <RotateCw /> {upright} em pé
          </span>
          <span className="down" title="Cartas deitadas (usadas)">
            <RotateCw aria-label="deitada" /> {lying} deitada{lying === 1 ? '' : 's'}
          </span>
        </div>
      )}
      {instances.length > 0 && <span className="zone-count">{instances.length}</span>}
      {instances.map((instance) => {
        const locator: Locator = { player, area: 'zone', zone, uid: instance.uid }

        return (
          <BoardCard
            key={instance.uid}
            instance={instance}
            card={cardMap.get(instance.cardId)}
            locator={locator}
            selected={selected?.uid === instance.uid}
            onDragStart={onDragStart}
            onClick={onCardClick}
            onPreview={onPreview}
            onMenu={onMenu}
          />
        )
      })}
      {zone === 'main' && widgets}
    </div>
  )
}

function BoardCard({
  instance,
  card,
  locator,
  selected,
  overrideStyle,
  onDragStart,
  onClick,
  onPreview,
  onMenu,
}: {
  instance: CardInstance
  card?: CardRecord
  locator: Locator
  selected: boolean
  overrideStyle?: CSSProperties
  onDragStart: BoardProps['onDragStart']
  onClick: BoardProps['onCardClick']
  onPreview: BoardProps['onPreview']
  onMenu: BoardProps['onMenu']
}) {
  const style = {
    left: `${instance.x}%`,
    top: `${instance.y}%`,
    zIndex: instance.z + 2,
    '--card-rotation': `${instance.rotation}deg`,
    ...overrideStyle,
  } as CSSProperties
  return (
    <div
      className={cn('board-card-wrap', selected && 'card-selected')}
      style={style}
      draggable
      onDragStart={(e) => onDragStart(e, locator)}
      onDragEnd={(e) => {
        e.currentTarget.style.opacity = '1'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(locator)
      }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        onPreview(instance)
      }}
      onContextMenu={(e) => onMenu(e, locator)}
    >
      <CardVisual
        card={card}
        faceUp={instance.faceUp}
        className="h-full w-full"
        showDetails={false}
      />
      <button
        type="button"
        className="card-more"
        onClick={(e) => onMenu(e, locator)}
        aria-label="Ações da carta"
      >
        <MoreVertical />
      </button>
    </div>
  )
}
function MatchWidgets({
  playerLife,
  characterLife,
  onPlayerLife,
  onCharacterLife,
}: {
  playerLife: number
  characterLife: number
  onPlayerLife: (value: number) => void
  onCharacterLife: (value: number) => void
}) {
  const lifeChip = (label: string, value: number, onChange: (value: number) => void) => (
    <div className="widget-chip" title={`${label} (sem limite)`}>
      <span className="widget-label">{label}</span>
      <button type="button" title="Diminuir" onClick={() => onChange(value - 1)}>
        <ChevronDown />
      </button>
      <span className="widget-value">{value}</span>
      <button type="button" title="Aumentar" onClick={() => onChange(value + 1)}>
        <ChevronUp />
      </button>
    </div>
  )
  return (
    <div className="main-widgets" onClick={(e) => e.stopPropagation()}>
      {lifeChip('Vida', playerLife, onPlayerLife)}
      {lifeChip('Personagem', characterLife, onCharacterLife)}
    </div>
  )
}
function DeckZone({
  player,
  count,
  shuffling,
  onClick,
  onShuffle,
}: {
  player: PlayerKey
  count: number
  shuffling: boolean
  onClick: () => void
  onShuffle: () => void
}) {
  return (
    <div className="board-zone board-zone--deck" onClick={onClick}>
      <div className={cn('deck-stack', shuffling && 'deck-stack--shuffling')}>
        {count > 0 ? <CardBack /> : <Layers3 />}
      </div>
      <div className="zone-label">BARALHO</div>
      <span className="zone-count">{count}</span>
      <button
        className="deck-shuffle"
        title="Embaralhar"
        onClick={(e) => {
          e.stopPropagation()
          onShuffle()
        }}
      >
        <Shuffle />
      </button>
      <span className="sr-only">Baralho de {player === 'player' ? 'você' : 'adversário'}</span>
    </div>
  )
}

interface HandProps {
  player: PlayerKey
  state: MatchSnapshot
  cardMap: Map<string, CardRecord>
  selected: Locator | null
  justDrawn: string
  onDrop: (event: DragEvent, player: PlayerKey) => void
  onDragStart: BoardProps['onDragStart']
  onCardClick: BoardProps['onCardClick']
  onPreview: BoardProps['onPreview']
  onMenu: BoardProps['onMenu']
}
function HandRow({
  player,
  state,
  cardMap,
  selected,
  justDrawn,
  onDrop,
  onDragStart,
  onCardClick,
  onPreview,
  onMenu,
}: HandProps) {
  const hand = state.players[player].hand
  const opponent = player === 'opponent'
  return (
    <section
      className={cn('hand-area', opponent && 'hand-area--opponent')}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, player)}
    >
      <div className="hand-label">
        <Hand />
        <span>{opponent ? 'MÃO DO ADVERSÁRIO' : 'SUA MÃO'}</span>
        <Badge variant="outline">{hand.length}</Badge>
      </div>
      <div className="hand-scroll">
        {hand.length ? (
          hand.map((instance, index) => {
            const locator: Locator = { player, area: 'hand', uid: instance.uid }
            const spread = Math.max(-8, Math.min(8, (index - (hand.length - 1) / 2) * 2))
            return (
              <div
                key={instance.uid}
                className={cn(
                  'hand-card',
                  selected?.uid === instance.uid && 'card-selected',
                  justDrawn === instance.uid && 'hand-card--drawn',
                )}
                style={{
                  transform: `rotate(${spread}deg) translateY(${Math.abs(spread) * 0.3}px)`,
                  zIndex: index,
                }}
                draggable
                onDragStart={(e) => onDragStart(e, locator)}
                onClick={() => onCardClick(locator)}
                onDoubleClick={() => onPreview(instance)}
                onContextMenu={(e) => onMenu(e, locator)}
              >
                <CardVisual
                  card={cardMap.get(instance.cardId)}
                  faceUp={!opponent && instance.faceUp}
                  className="h-full w-full"
                  showDetails={false}
                />
                <button className="card-more" onClick={(e) => onMenu(e, locator)}>
                  <MoreVertical />
                </button>
              </div>
            )
          })
        ) : (
          <p className="hand-empty">Mão vazia — clique no baralho para comprar</p>
        )}
      </div>
    </section>
  )
}

function PileDialog({
  pile,
  state,
  cardMap,
  onClose,
  onSelect,
  onHand,
  onPreview,
  onDragStart,
}: {
  pile: PileState | null
  state: MatchSnapshot
  cardMap: Map<string, CardRecord>
  onClose: () => void
  onSelect: (locator: Locator) => void
  onHand: (locator: Locator) => void
  onPreview: (card: CardInstance) => void
  onDragStart: BoardProps['onDragStart']
}) {
  const cards = pile ? state.players[pile.player].zones[pile.zone] : []
  return (
    <Dialog open={Boolean(pile)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn('max-w-4xl', pile?.zone === 'banishment' && 'banishment-dialog')}
      >
        <DialogHeader>
          <DialogTitle>
            {pile?.zone === 'banishment' ? 'Cartas no banimento' : 'Cartas no cemitério'}
          </DialogTitle>
          <DialogDescription>
            Selecione uma carta para fechar esta janela e depois toque na zona de destino, ou envie
            diretamente para a mão.
          </DialogDescription>
        </DialogHeader>
        <div className="pile-grid">
          {cards.length ? (
            cards.map((instance) => {
              const locator: Locator = {
                player: pile!.player,
                area: 'zone',
                zone: pile!.zone,
                uid: instance.uid,
              }
              return (
                <div key={instance.uid} className="group">
                  <div
                    draggable
                    onDragStart={(e) => onDragStart(e, locator)}
                    onDoubleClick={() => onPreview(instance)}
                  >
                    <CardVisual card={cardMap.get(instance.cardId)} faceUp={instance.faceUp} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    <Button size="sm" variant="outline" onClick={() => onSelect(locator)}>
                      Selecionar
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onHand(locator)}>
                      Para a mão
                    </Button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full py-16 text-center text-muted-foreground">
              Esta zona está vazia.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface ContextProps {
  menu: CardMenuState
  state: MatchSnapshot
  cardMap: Map<string, CardRecord>
  onClose: () => void
  onFlip: () => void
  onPreview: () => void
  onDeck: (position: 'top' | 'bottom') => void
  onHand: () => void
  onZone: (zone: ZoneId) => void
  onDelete: () => void
}
function CardContextMenu({
  menu,
  state,
  cardMap,
  onClose,
  onFlip,
  onPreview,
  onDeck,
  onHand,
  onZone,
  onDelete,
}: ContextProps) {
  const card = locateCard(state, menu.locator)
  const definition = card ? cardMap.get(card.cardId) : undefined
  const [zonesOpen, setZonesOpen] = useState(false)
  return (
    <>
      <button
        className="fixed inset-0 z-[80] cursor-default"
        onClick={onClose}
        aria-label="Fechar menu"
      />
      <div className="card-context-menu" style={{ left: menu.x, top: Math.max(8, menu.y) }}>
        <div className="border-b border-border px-3 py-2">
          <p className="truncate text-xs font-semibold">{definition?.name || 'Carta'}</p>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Ações manuais
          </p>
        </div>
        <button onClick={onPreview}>
          <Eye />
          Ampliar carta
        </button>
        <button onClick={onFlip}>
          {card?.faceUp ? <EyeOff /> : <Eye />}
          {card?.faceUp ? 'Virar para baixo' : 'Virar para cima'}
        </button>
        <button onClick={() => setZonesOpen(!zonesOpen)}>
          <Orbit />
          Mover para zona
          <ChevronDown className={cn('ml-auto transition', zonesOpen && 'rotate-180')} />
        </button>
        {zonesOpen && (
          <div className="context-zone-list">
            {zoneIds.map((zone) => (
              <button key={zone} onClick={() => onZone(zone)}>
                {zoneLabels[zone]}
              </button>
            ))}
          </div>
        )}
        <button onClick={onHand}>
          <Hand />
          Mover para a mão
        </button>
        <button onClick={() => onDeck('top')}>
          <Layers3 />
          Devolver ao topo
        </button>
        <button onClick={() => onDeck('bottom')}>
          <Layers3 />
          Devolver ao fundo
        </button>
        <button className="text-destructive" onClick={onDelete}>
          <Trash2 />
          Excluir da partida
        </button>
      </div>
    </>
  )
}
