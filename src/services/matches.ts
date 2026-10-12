import pb from '@/lib/pocketbase/client'
import type { DeckRecord, MatchRecord, MatchSnapshot } from '@/types/domain'

export async function createMatch(
  deck1: DeckRecord,
  state: MatchSnapshot,
  deck2?: DeckRecord,
): Promise<MatchRecord> {
  const owner = pb.authStore.record?.id
  if (!owner) throw new Error('Entre na sua conta para iniciar uma partida.')
  const matchName =
    deck2 && deck2.id !== deck1.id
      ? `Treino — ${deck1.name} vs ${deck2.name}`
      : `Treino — ${deck1.name}`
  return pb.collection<MatchRecord>('matches').create({
    owner,
    name: matchName,
    status: 'local',
    practice: true,
    deck: deck1.id,
    state,
  })
}

export async function getMatch(id: string): Promise<MatchRecord> {
  return pb.collection<MatchRecord>('matches').getOne(id)
}

export async function saveMatchState(id: string, state: MatchSnapshot): Promise<MatchRecord> {
  return pb.collection<MatchRecord>('matches').update(id, { state })
}

export async function listRecentMatches(): Promise<MatchRecord[]> {
  return pb
    .collection<MatchRecord>('matches')
    .getList(1, 8, { sort: '-updated' })
    .then((result) => result.items)
}
