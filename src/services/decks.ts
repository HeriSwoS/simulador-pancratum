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
  return pb.collection<DeckRecord>('decks').create({ owner, name, items: [], main_character: '' })
}

export async function saveDeck(
  id: string,
  data: { name: string; items: DeckItem[]; main_character: string },
): Promise<DeckRecord> {
  return pb.collection<DeckRecord>('decks').update(id, data)
}

export async function duplicateDeck(deck: DeckRecord): Promise<DeckRecord> {
  const owner = pb.authStore.record?.id
  if (!owner) throw new Error('Entre na sua conta para duplicar o baralho.')
  return pb.collection<DeckRecord>('decks').create({
    owner,
    name: `${deck.name} — cópia`,
    items: deck.items,
    main_character: deck.main_character,
  })
}

export async function deleteDeck(id: string): Promise<void> {
  await pb.collection('decks').delete(id)
}
