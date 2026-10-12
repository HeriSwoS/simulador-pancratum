import { useEffect, useMemo, useRef, useState } from 'react'
import { Edit3, ImagePlus, LoaderCircle, Maximize2, Search, Trash2, Upload } from 'lucide-react'
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
  type UpdateCardInput,
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

export const colorOptions = [
  { value: 'neutro', label: 'Neutro / Padrão', colorHex: '#8a7a63' },
  { value: 'branco', label: 'Branco (Luz)', colorHex: '#e5e7eb' },
  { value: 'azul', label: 'Azul (Água / Mente)', colorHex: '#3b82f6' },
  { value: 'vermelho', label: 'Vermelho (Fogo / Força)', colorHex: '#ef4444' },
  { value: 'verde', label: 'Verde (Terra / Vida)', colorHex: '#22c55e' },
  { value: 'preto', label: 'Preto (Trevas / Morte)', colorHex: '#374151' },
  { value: 'dourado', label: 'Dourado (Divino / Épico)', colorHex: '#eab308' },
  { value: 'roxo', label: 'Roxo (Arcano / Caos)', colorHex: '#a855f7' },
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
  const saveMeta = async (card: CardRecord, patch: UpdateCardInput) => {
    try {
      const updated = await updateCardDetails(card.id, patch)
      setCards((old) => old.map((item) => (item.id === card.id ? updated : item)))
      setSelected(updated)
      toast({ title: 'Carta atualizada com sucesso!' })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível atualizar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
      })
      throw error
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
          {filtered.map((card) => {
            const isOwner = !card.is_public && card.owner === pb.authStore.record?.id
            return (
              <div
                key={card.id}
                className="group relative flex flex-col justify-between rounded-xl border border-primary/15 bg-card/40 p-2.5 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/70 hover:shadow-lg"
              >
                <div className="cursor-pointer" onClick={() => setSelected(card)}>
                  <CardVisual card={card} />
                </div>
                <div className="mt-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setSelected(card)}>
                    <h3
                      className="truncate font-display text-sm font-semibold text-foreground/95"
                      title={card.name}
                    >
                      {card.name}
                    </h3>
                    <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                      {card.card_type} • {card.rarity}
                      {card.color && card.color !== 'neutro' && ` • ${card.color}`}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {isOwner && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-primary hover:bg-primary/15 hover:text-primary"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelected(card)
                        }}
                        title="Editar carta"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {isOwner && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive/80 hover:bg-destructive/15 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          void remove(card)
                        }}
                        title="Excluir carta"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      onClick={() => setSelected(card)}
                      title="Ver detalhes"
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
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
  onSave: (card: CardRecord, patch: UpdateCardInput) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CardType>('evento')
  const [rarity, setRarity] = useState<CardRarity>('comum')
  const [color, setColor] = useState('neutro')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (card) {
      setName(card.name)
      setType(card.card_type)
      setRarity(card.rarity)
      setColor(card.color || 'neutro')
      setImageFile(null)
      setImagePreview('')
    }
  }, [card])

  const editable = card && !card.is_public && card.owner === pb.authStore.record?.id

  const handleImageChange = (file?: File) => {
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (!card) return
    setSaving(true)
    try {
      await onSave(card, {
        name,
        card_type: type,
        rarity,
        color,
        ...(imageFile ? { image: imageFile } : {}),
      })
      setImageFile(null)
    } finally {
      setSaving(false)
    }
  }

  // Objeto temporário para prévia visual em tempo real dentro do modal
  const previewCard: CardRecord | null = useMemo(() => {
    if (!card) return null
    return {
      ...card,
      name,
      card_type: type,
      rarity,
      color,
    }
  }, [card, name, type, rarity, color])

  return (
    <Dialog open={Boolean(card)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editable ? 'Editar carta' : 'Detalhes da carta'}</DialogTitle>
          <DialogDescription>
            {editable
              ? 'Edite a imagem da frente, nome, tipo, raridade e a cor/elemento da carta.'
              : 'Veja a arte em tamanho maior e consulte as informações da carta oficial.'}
          </DialogDescription>
        </DialogHeader>
        {card && previewCard && (
          <div className="grid gap-7 sm:grid-cols-[240px_1fr]">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-full max-w-[240px]">
                {imagePreview ? (
                  <article
                    className={cn(
                      'tcg-card group/card',
                      `rarity-${rarity}`,
                      color && color !== 'neutro' && `card-color-${color}`,
                      'mx-auto w-full max-w-[240px]',
                    )}
                    title={name}
                  >
                    <img
                      src={imagePreview}
                      alt={name}
                      className="absolute inset-0 h-full w-full rounded-[7px] object-cover"
                    />
                    {color && color !== 'neutro' && (
                      <div
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 opacity-90"
                        style={{ backgroundColor: 'var(--card-accent)' }}
                      />
                    )}
                  </article>
                ) : (
                  <CardVisual card={previewCard} className="mx-auto w-full max-w-[240px]" />
                )}
              </div>

              {editable && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    hidden
                    onChange={(e) => handleImageChange(e.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full max-w-[240px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {card.image || imagePreview
                      ? 'Substituir arte (frente)'
                      : 'Adicionar arte (frente)'}
                  </Button>
                  {imageFile && (
                    <p className="text-center text-xs text-primary font-medium">
                      Nova imagem selecionada: {imageFile.name}
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <Label>Nome da carta</Label>
                <Input
                  className="mt-2"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editable}
                  placeholder="Ex: Guerreiro de Bronze"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
              </div>

              <div>
                <Label>Cor / Elemento da carta</Label>
                <Select value={color} onValueChange={(v) => setColor(v)} disabled={!editable}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-white/20"
                            style={{ backgroundColor: option.colorHex }}
                          />
                          <span>{option.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  A cor define o elemento e aplica destaque colorido na moldura e detalhe da carta.
                </p>
              </div>

              {card.description && (
                <div>
                  <Label className="text-xs text-muted-foreground">Descrição</Label>
                  <p className="mt-1 rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                    {card.description}
                  </p>
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {editable ? (
                  <>
                    <Button
                      className="gold-button"
                      onClick={() => void handleSave()}
                      disabled={saving}
                    >
                      {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Salvar alterações
                    </Button>
                    <Button variant="destructive" onClick={() => onDelete(card)} disabled={saving}>
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
