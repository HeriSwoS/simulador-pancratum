import pb from '@/lib/pocketbase/client'
import type { LorePageRecord } from '@/types/domain'

export async function listLorePages(): Promise<LorePageRecord[]> {
  const userId = pb.authStore.record?.id
  if (!userId) return []
  return pb.collection<LorePageRecord>('lore_pages').getFullList({
    filter: `owner = '${userId}'`,
    sort: 'order,created',
  })
}

export async function createLorePage(input: {
  title: string
  content?: string
  order?: number
}): Promise<LorePageRecord> {
  const userId = pb.authStore.record?.id
  if (!userId) throw new Error('Entre na sua conta para criar páginas de história.')
  return pb.collection<LorePageRecord>('lore_pages').create({
    owner: userId,
    title: input.title,
    content: input.content || '',
    order: input.order ?? 0,
  })
}

export async function updateLorePage(
  id: string,
  input: { title?: string; content?: string; order?: number },
): Promise<LorePageRecord> {
  return pb.collection<LorePageRecord>('lore_pages').update(id, input)
}

export async function deleteLorePage(id: string): Promise<void> {
  await pb.collection('lore_pages').delete(id)
}
