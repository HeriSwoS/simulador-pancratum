import pb from '@/lib/pocketbase/client'
import type { CardRecord, CardRarity, CardType } from '@/types/domain'

export async function listCards(): Promise<CardRecord[]> {
  return pb.collection<CardRecord>('cards').getFullList({ sort: '-created,name' })
}

export function cardImageUrl(card: CardRecord, size: 'small' | 'large' = 'small'): string {
  if (!card.image) return ''
  return pb.files.getURL(card, card.image, { thumb: size === 'small' ? '320x448' : '640x896' })
}

export async function importCards(files: File[]): Promise<CardRecord[]> {
  const owner = pb.authStore.record?.id
  if (!owner) throw new Error('Entre na sua conta para importar cartas.')
  const created: CardRecord[] = []
  for (const file of files) {
    const form = new FormData()
    form.set('owner', owner)
    form.set('name', file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '))
    form.set('card_type', 'evento')
    form.set('rarity', 'comum')
    form.set('is_public', 'false')
    form.set('image', file)
    created.push(await pb.collection<CardRecord>('cards').create(form))
  }
  return created
}

export async function updateCardDetails(
  id: string,
  data: { name: string; card_type: CardType; rarity: CardRarity },
): Promise<CardRecord> {
  return pb.collection<CardRecord>('cards').update(id, data)
}

export async function deleteCard(id: string): Promise<void> {
  await pb.collection('cards').delete(id)
}

export async function updateCardBack(file: File): Promise<void> {
  const user = pb.authStore.record
  if (!user) throw new Error('Entre na sua conta para trocar o verso.')
  const form = new FormData()
  form.set('card_back', file)
  const updated = await pb.collection('users').update(user.id, form)
  pb.authStore.save(pb.authStore.token, updated)
}

export function userCardBackUrl(): string {
  const user = pb.authStore.record
  const file = typeof user?.card_back === 'string' ? user.card_back : ''
  return user && file ? pb.files.getURL(user, file, { thumb: '240x336' }) : ''
}
