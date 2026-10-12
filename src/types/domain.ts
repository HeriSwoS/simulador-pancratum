import type { RecordModel } from 'pocketbase'

export type CardType =
  | 'personagem'
  | 'criatura'
  | 'magia'
  | 'armadilha'
  | 'equipamento'
  // compatibilidade com registros/tipos legados
  | 'guerreiro'
  | 'arma'
  | 'armadura'
  | 'evento'
  | 'reliquia'

export type CardRarity = 'comum' | 'incomum' | 'rara' | 'epica' | 'lendaria'

export type CardClass = 'normal' | 'lenda' | 'mestre'

export type CardColor =
  | 'azul'
  | 'vermelho'
  | 'amarelo'
  | 'verde'
  | 'laranja'
  | 'roxo'
  | 'branco'
  | 'preto'
  | 'cinza'
  // compatibilidade com valores legados
  | 'neutro'
  | 'dourado'

export interface InvocationCost {
  /** Número do ponto primástico (quadradinho com número), ex: 3 */
  prismatic?: number
  /** Pontos de essência (quadradinhos coloridos), ex: ['azul', 'azul', 'azul'] */
  essence?: string[]
}

export interface CardRecord extends RecordModel {
  owner: string
  name: string
  card_type: CardType
  rarity: CardRarity
  /** Grau da carta (antigo card_class: normal, lenda, mestre) */
  card_class?: CardClass
  color?: string
  attack: number
  defense: number
  description: string
  image: string
  is_public: boolean
  /** Novos campos PANCRATUM */
  cost?: InvocationCost
  card_archetype?: string // Classe: Guerreiro, Mago, Fera, Veículo...
  magic_school?: string // Escola Mágica: Abjuração, Conjuração, Encantamento...
  race?: string // Raça: Dragão, Humano, Peixe...
  summon_mode?: string // Modo de Invocação: Sinc, Fusion, Dimension...
  abilities?: string // Texto de Habilidades
  effects?: string // Texto de Efeitos
}

export interface LorePageRecord extends RecordModel {
  owner: string
  title: string
  content?: string
  order?: number
  created: string
  updated: string
}

export interface DeckItem {
  cardId: string
  quantity: number
}

export interface DeckRecord extends RecordModel {
  owner: string
  name: string
  items: DeckItem[]
  main_character: string
  /** até 3 cartas lendárias, guardadas na ordem em que foram escolhidas */
  legendary_cards: string[]
  created: string
  updated: string
}

export type PlayerKey = 'player' | 'opponent'
export type Rotation = 0 | 90 | 180 | 270
export type ZoneId =
  | 'legendary1'
  | 'legendary2'
  | 'legendary3'
  | 'attack1'
  | 'attack2'
  | 'attack3'
  | 'attack4'
  | 'attack5'
  | 'defense1'
  | 'defense2'
  | 'defense3'
  | 'defense4'
  | 'defense5'
  | 'equipment1'
  | 'equipment2'
  | 'main'
  | 'equipment3'
  | 'equipment4'
  | 'resources'
  | 'graveyard'
  | 'banishment'

export interface CardInstance {
  uid: string
  cardId: string
  owner: PlayerKey
  faceUp: boolean
  rotation: Rotation
  x: number
  y: number
  z: number
}

export interface PlayerState {
  deck: CardInstance[]
  hand: CardInstance[]
  zones: Record<ZoneId, CardInstance[]>
}

export interface MatchSnapshot {
  version: number
  players: Record<PlayerKey, PlayerState>
  initialDecks: Record<PlayerKey, string[]>
  mainCharacters: Record<PlayerKey, string>
  /** vida do JOGADOR de cada lado, nos contadores abaixo da zona principal */
  playerLife: Record<PlayerKey, number>
  /** vida do PERSONAGEM PRINCIPAL de cada lado, independente da vida do jogador */
  characterLife: Record<PlayerKey, number>
  /** ids das 3 lendárias que nascem nas zonas LENDA 1–3 (ordem de escolha) */
  legendaryCards: Record<PlayerKey, string[]>
  updatedAt: string
}

/** Campos de snapshots antigos (v2) que não existem mais. */
type LegacySnapshotFields = Partial<MatchSnapshot> & {
  d20?: Record<PlayerKey, number>
  counter?: Record<PlayerKey, number>
}

function coerceLife(...values: unknown[]): number {
  for (const value of values) {
    if (typeof value === 'number' && Number.isFinite(value)) return value
  }
  return 0
}

/** Preenche campos novos com valores padrão para snapshots salvos antes deles existirem. */
export function normalizeSnapshot(snapshot: MatchSnapshot): MatchSnapshot {
  const legacy = snapshot as LegacySnapshotFields
  const normalizePlayer = (player: PlayerState): PlayerState => {
    const rawZones = { ...emptyZones(), ...player.zones }
    const zones = Object.fromEntries(
      Object.entries(rawZones).map(([zId, cards]) => [
        zId,
        cards.map((card) => {
          // Garante que cartas já salvas com coordenadas descentralizadas ou fora dos limites
          // sejam re-centradas para 50%, 50% caso estivessem no spread antigo ou transbordando
          const x = typeof card.x === 'number' && card.x >= 40 && card.x <= 60 ? 50 : (card.x ?? 50)
          const y = typeof card.y === 'number' && card.y >= 40 && card.y <= 60 ? 50 : (card.y ?? 50)
          return { ...card, x, y }
        }),
      ]),
    ) as Record<ZoneId, CardInstance[]>
    return {
      ...player,
      zones,
    }
  }
  const legendaries = (key: PlayerKey): string[] => {
    const value = legacy.legendaryCards?.[key]
    return Array.isArray(value) ? value.filter((id) => typeof id === 'string').slice(0, 3) : []
  }
  return {
    ...snapshot,
    version: 3,
    // migração suave: `counter` virou a vida do JOGADOR e `d20` virou a vida do
    // PERSONAGEM PRINCIPAL (mesma ordem dos widgets antigos)
    playerLife: {
      player: coerceLife(legacy.playerLife?.player, legacy.counter?.player),
      opponent: coerceLife(legacy.playerLife?.opponent, legacy.counter?.opponent),
    },
    characterLife: {
      player: coerceLife(legacy.characterLife?.player, legacy.d20?.player),
      opponent: coerceLife(legacy.characterLife?.opponent, legacy.d20?.opponent),
    },
    legendaryCards: { player: legendaries('player'), opponent: legendaries('opponent') },
    players: {
      player: normalizePlayer(snapshot.players.player),
      opponent: normalizePlayer(snapshot.players.opponent),
    },
  }
}

export interface MatchRecord extends RecordModel {
  owner: string
  guest: string
  name: string
  status: 'local' | 'aguardando' | 'em_andamento' | 'finalizada'
  practice: boolean
  deck: string
  state: MatchSnapshot
  created: string
  updated: string
}

export const zoneLabels: Record<ZoneId, string> = {
  legendary1: 'LENDA 1',
  legendary2: 'LENDA 2',
  legendary3: 'LENDA 3',
  attack1: 'ZONA DE ATAQUE',
  attack2: 'ZONA DE ATAQUE',
  attack3: 'ZONA DE ATAQUE',
  attack4: 'ZONA DE ATAQUE',
  attack5: 'ZONA DE ATAQUE',
  defense1: 'ZONA DE DEFESA',
  defense2: 'ZONA DE DEFESA',
  defense3: 'ZONA DE DEFESA',
  defense4: 'ZONA DE DEFESA',
  defense5: 'ZONA DE DEFESA',
  equipment1: 'EQUIPAMENTO 1',
  equipment2: 'EQUIPAMENTO 2',
  main: 'PERSONAGEM PRINCIPAL',
  equipment3: 'EQUIPAMENTO 3',
  equipment4: 'EQUIPAMENTO 4',
  resources: 'RECURSOS',
  graveyard: 'CEMITÉRIO',
  banishment: 'BANIMENTO',
}

export const zoneIds = Object.keys(zoneLabels) as ZoneId[]

export function emptyZones(): Record<ZoneId, CardInstance[]> {
  return Object.fromEntries(zoneIds.map((id) => [id, []])) as Record<ZoneId, CardInstance[]>
}
