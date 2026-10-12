import pb from '@/lib/pocketbase/client'
import type { DeckItem, DeckRecord } from '@/types/domain'

export async function listDecks(): Promise<DeckRecord[]> {
  return pb.collection<DeckRecord>('decks').getFullList({ sort: '-updated' })
}

export async function getDeck(id: string): Promise<DeckRecord> {
  return pb.collection<DeckRecord>('decks').getOne(id)
}

export async function createDeck(name = 'Novo baralho'): Promise<DeckRecord> {
  const owner = pb.authStore.record?.id
  if (!owner) throw new Error('Entre na sua conta para criar um baralho.')
  return pb.collection<DeckRecord>('decks').create({
    owner,
    name,
    items: [],
    main_character: null,
    legendary_cards: [],
  })
}

export async function saveDeck(
  id: string,
  data: {
    name: string
    items: DeckItem[]
    main_character: string | null
    legendary_cards: string[]
  },
): Promise<DeckRecord> {
  return pb.collection<DeckRecord>('decks').update(id, {
    name: data.name,
    items: Array.isArray(data.items) ? data.items : [],
    main_character: data.main_character || null,
    legendary_cards: Array.isArray(data.legendary_cards) ? data.legendary_cards.slice(0, 3) : [],
  })
}

export async function duplicateDeck(deck: DeckRecord): Promise<DeckRecord> {
  const owner = pb.authStore.record?.id
  if (!owner) throw new Error('Entre na sua conta para duplicar o baralho.')
  return pb.collection<DeckRecord>('decks').create({
    owner,
    name: `${deck.name} — cópia`,
    items: Array.isArray(deck.items) ? deck.items : [],
    main_character: deck.main_character || null,
    legendary_cards: Array.isArray(deck.legendary_cards) ? deck.legendary_cards.slice(0, 3) : [],
  })
}

export async function deleteDeck(id: string): Promise<void> {
  await pb.collection('decks').delete(id)
}
