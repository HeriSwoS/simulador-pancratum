import pb from '@/lib/pocketbase/client'
import type { CardRecord, CardRarity, CardType, CardClass } from '@/types/domain'

export async function listCards(): Promise<CardRecord[]> {
  const userId = pb.authStore.record?.id
  // Garante retorno do acervo pessoal do usuário logado
  if (userId) {
    return pb.collection<CardRecord>('cards').getFullList({
      filter: `owner = '${userId}'`,
      sort: '-created,name',
    })
  }
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
    form.set('card_type', 'personagem')
    form.set('rarity', 'comum')
    form.set('card_class', 'normal')
    form.set('color', 'azul')
    form.set('is_public', 'false')
    form.set('image', file)
    created.push(await pb.collection<CardRecord>('cards').create(form))
  }
  return created
}

export interface UpdateCardInput {
  name?: string
  card_type?: CardType
  rarity?: CardRarity
  card_class?: CardClass
  color?: string
  image?: File | null
  attack?: number
  defense?: number
  description?: string
}

export async function updateCardDetails(id: string, data: UpdateCardInput): Promise<CardRecord> {
  if (data.image instanceof File) {
    const form = new FormData()
    if (data.name !== undefined) form.set('name', data.name)
    if (data.card_type !== undefined) form.set('card_type', data.card_type)
    if (data.rarity !== undefined) form.set('rarity', data.rarity)
    if (data.card_class !== undefined) form.set('card_class', data.card_class)
    if (data.color !== undefined) form.set('color', data.color)
    if (data.attack !== undefined) form.set('attack', String(data.attack))
    if (data.defense !== undefined) form.set('defense', String(data.defense))
    if (data.description !== undefined) form.set('description', data.description)
    form.set('image', data.image)
    return pb.collection<CardRecord>('cards').update(id, form)
  }
  const payload: Record<string, unknown> = {}
  if (data.name !== undefined) payload.name = data.name
  if (data.card_type !== undefined) payload.card_type = data.card_type
  if (data.rarity !== undefined) payload.rarity = data.rarity
  if (data.card_class !== undefined) payload.card_class = data.card_class
  if (data.color !== undefined) payload.color = data.color
  if (data.attack !== undefined) payload.attack = data.attack
  if (data.defense !== undefined) payload.defense = data.defense
  if (data.description !== undefined) payload.description = data.description
  return pb.collection<CardRecord>('cards').update(id, payload)
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
