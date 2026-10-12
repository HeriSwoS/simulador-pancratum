import type { RecordModel } from 'pocketbase'

export type CardType = 'guerreiro' | 'arma' | 'armadura' | 'evento' | 'reliquia'
export type CardRarity = 'comum' | 'incomum' | 'rara' | 'epica' | 'lendaria'

export interface CardRecord extends RecordModel {
  owner: string
  name: string
  card_type: CardType
  rarity: CardRarity
  attack: number
  defense: number
  description: string
  image: string
  is_public: boolean
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
  /** resultado rolado no d20 (0–9) de cada lado, persistido junto do snapshot */
  d20: Record<PlayerKey, number>
  /** contador numérico manual (0–9) de cada lado, independente do d20 */
  counter: Record<PlayerKey, number>
  updatedAt: string
}

/** Preenche campos novos com valores padrão para snapshots salvos antes deles existirem. */
export function normalizeSnapshot(snapshot: MatchSnapshot): MatchSnapshot {
  const normalizePlayer = (player: PlayerState): PlayerState => ({
    ...player,
    zones: { ...emptyZones(), ...player.zones },
  })
  return {
    ...snapshot,
    version: 2,
    d20: snapshot.d20 ?? { player: 0, opponent: 0 },
    counter: snapshot.counter ?? { player: 0, opponent: 0 },
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
  legendary1: 'LENDÁRIA 1',
  legendary2: 'LENDÁRIA 2',
  legendary3: 'LENDÁRIA 3',
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
