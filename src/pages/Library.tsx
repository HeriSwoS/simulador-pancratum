import { useEffect, useMemo, useRef, useState } from 'react'
import { ImagePlus, LoaderCircle, Maximize2, Search, Trash2, Upload } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { CardVisual } from '@/components/CardVisual'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import {
  deleteCard,
  importCards,
  listCards,
  updateCardBack,
  updateCardDetails,
} from '@/services/cards'
import type { CardRarity, CardRecord, CardType } from '@/types/domain'
import pb from '@/lib/pocketbase/client'

const typeOptions: { value: CardType | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'guerreiro', label: 'Guerreiro' },
  { value: 'arma', label: 'Arma' },
  { value: 'armadura', label: 'Armadura' },
  { value: 'evento', label: 'Evento' },
  { value: 'reliquia', label: 'Relíquia' },
]
const rarityOptions: { value: CardRarity | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas as raridades' },
  { value: 'comum', label: 'Comum' },
  { value: 'incomum', label: 'Incomum' },
  { value: 'rara', label: 'Rara' },
  { value: 'epica', label: 'Épica' },
  { value: 'lendaria', label: 'Lendária' },
]

export default function LibraryPage() {
  const [cards, setCards] = useState<CardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<CardType | 'todos'>('todos')
  const [rarity, setRarity] = useState<CardRarity | 'todas'>('todas')
  const [selected, setSelected] = useState<CardRecord | null>(null)
  const [backOpen, setBackOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [params, setParams] = useSearchParams()
  const load = async () => {
    setLoading(true)
    try {
      setCards(await listCards())
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar as cartas',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void load()
  }, [])
  useEffect(() => {
    if (params.get('verso') === '1') {
      setBackOpen(true)
      setParams({}, { replace: true })
    }
  }, [params, setParams])
  const filtered = useMemo(
    () =>
      cards.filter(
        (card) =>
          card.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')) &&
          (type === 'todos' || card.card_type === type) &&
          (rarity === 'todas' || card.rarity === rarity),
      ),
    [cards, query, type, rarity],
  )
  const upload = async (files: FileList | null) => {
    if (!files?.length) return
    const valid = Array.from(files).filter((f) =>
      ['image/png', 'image/jpeg', 'image/webp'].includes(f.type),
    )
    if (valid.length !== files.length)
      toast({
        variant: 'destructive',
        title: 'Alguns arquivos foram ignorados',
        description: 'Envie apenas PNG, JPG ou WEBP.',
      })
    if (!valid.length) return
    setImporting(true)
    try {
      const created = await importCards(valid)
      setCards((old) => [...created.reverse(), ...old])
      toast({
        title: 'Cartas importadas',
        description: `${created.length} ${created.length === 1 ? 'carta foi adicionada' : 'cartas foram adicionadas'} à biblioteca.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Falha na importação',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }
  const remove = async (card: CardRecord) => {
    if (card.is_public || card.owner !== pb.authStore.record?.id) return
    if (!window.confirm(`Excluir “${card.name}” da biblioteca?`)) return
    try {
      await deleteCard(card.id)
      setCards((old) => old.filter((item) => item.id !== card.id))
      setSelected(null)
      toast({ title: 'Carta excluída' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível excluir',
        description: error instanceof Error ? error.message : 'A carta pode estar em um baralho.',
      })
    }
  }
  const saveMeta = async (
    card: CardRecord,
    patch: { name: string; card_type: CardType; rarity: CardRarity },
  ) => {
    try {
      const updated = await updateCardDetails(card.id, patch)
      setCards((old) => old.map((item) => (item.id === card.id ? updated : item)))
      setSelected(updated)
      toast({ title: 'Carta atualizada' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    }
  }
  return (
    <div className="page-shell">
      <div className="page-heading page-heading--row">
        <div>
          <span className="eyebrow">Seu arsenal</span>
          <h1>Biblioteca de cartas</h1>
          <p>Importe artes, organize seu acervo e inspecione cada carta.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            multiple
            hidden
            onChange={(e) => void upload(e.target.files)}
          />
          <Button variant="outline" onClick={() => setBackOpen(true)}>
            <ImagePlus className="mr-2 h-4 w-4" />
            Verso das cartas
          </Button>
          <Button
            className="gold-button"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Importar cartas
          </Button>
        </div>
      </div>
      <div className="arcane-panel mb-8 grid gap-3 p-4 md:grid-cols-[1fr_220px_220px]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            placeholder="Buscar por nome..."
          />
        </div>
        <Select value={type} onValueChange={(value) => setType(value as CardType | 'todos')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={rarity} onValueChange={(value) => setRarity(value as CardRarity | 'todas')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {rarityOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {loading ? (
        <div className="grid min-h-80 place-items-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length ? (
        <div className="card-library-grid">
          {filtered.map((card) => (
            <button
              type="button"
              key={card.id}
              onClick={() => setSelected(card)}
              className="card-library-item text-left"
            >
              <CardVisual card={card} />
              <div className="mt-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-sm font-semibold">{card.name}</h3>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    {card.card_type} • {card.rarity}
                  </p>
                </div>
                <Maximize2 className="h-4 w-4 shrink-0 text-primary opacity-0 transition group-hover:opacity-100" />
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ImagePlus />
          <h2>Nenhuma carta encontrada</h2>
          <p>Ajuste os filtros ou importe suas primeiras artes.</p>
        </div>
      )}
      <CardDetails
        card={selected}
        onClose={() => setSelected(null)}
        onDelete={remove}
        onSave={saveMeta}
      />
      <BackDialog open={backOpen} onOpenChange={setBackOpen} />
    </div>
  )
}

function CardDetails({
  card,
  onClose,
  onDelete,
  onSave,
}: {
  card: CardRecord | null
  onClose: () => void
  onDelete: (card: CardRecord) => void
  onSave: (
    card: CardRecord,
    patch: { name: string; card_type: CardType; rarity: CardRarity },
  ) => void
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CardType>('evento')
  const [rarity, setRarity] = useState<CardRarity>('comum')
  useEffect(() => {
    if (card) {
      setName(card.name)
      setType(card.card_type)
      setRarity(card.rarity)
    }
  }, [card])
  const editable = card && !card.is_public && card.owner === pb.authStore.record?.id
  return (
    <Dialog open={Boolean(card)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes da carta</DialogTitle>
          <DialogDescription>
            Veja a arte em tamanho maior e ajuste os dados das cartas importadas.
          </DialogDescription>
        </DialogHeader>
        {card && (
          <div className="grid gap-7 sm:grid-cols-[240px_1fr]">
            <CardVisual card={card} className="mx-auto w-full max-w-[240px]" />
            <div className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  className="mt-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editable}
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <Select
                  value={type}
                  onValueChange={(v) => setType(v as CardType)}
                  disabled={!editable}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.slice(1).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Raridade</Label>
                <Select
                  value={rarity}
                  onValueChange={(v) => setRarity(v as CardRarity)}
                  disabled={!editable}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {rarityOptions.slice(1).map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {card.description && (
                <p className="rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  {card.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {editable ? (
                  <>
                    <Button
                      className="gold-button"
                      onClick={() => onSave(card, { name, card_type: type, rarity })}
                    >
                      Salvar alterações
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(card)}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Excluir
                    </Button>
                  </>
                ) : (
                  <Badge variant="outline">Carta oficial do acervo</Badge>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function BackDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const upload = async (file?: File) => {
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setBusy(true)
    try {
      await updateCardBack(file)
      toast({
        title: 'Verso atualizado',
        description: 'A nova imagem já será usada nas cartas viradas.',
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível salvar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
    } finally {
      setBusy(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Verso das cartas</DialogTitle>
          <DialogDescription>
            Envie PNG, JPG ou WEBP. A imagem será recortada na proporção 63 × 88 mm.
          </DialogDescription>
        </DialogHeader>
        <label
          className={cn(
            'mx-auto grid aspect-[63/88] w-44 cursor-pointer place-items-center overflow-hidden rounded-xl border-2 border-dashed border-primary/35 bg-primary/5 text-center transition hover:border-primary',
            busy && 'pointer-events-none opacity-60',
          )}
        >
          {preview ? (
            <img src={preview} alt="Prévia do verso" className="h-full w-full object-cover" />
          ) : (
            <span className="p-5 text-sm text-muted-foreground">
              <Upload className="mx-auto mb-3 text-primary" />
              Clique para escolher a imagem
            </span>
          )}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={(e) => void upload(e.target.files?.[0])}
          />
        </label>
      </DialogContent>
    </Dialog>
  )
}
