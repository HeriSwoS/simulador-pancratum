import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Edit3,
  Eye,
  ImagePlus,
  LoaderCircle,
  Maximize2,
  Search,
  Trash2,
  Upload,
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { CardVisual, normalizeCardColor } from '@/components/CardVisual'
import { CardZoomHud } from '@/components/CardZoomHud'
import { CreatableCombobox } from '@/components/CreatableCombobox'
import { InvocationCostDisplay } from '@/components/InvocationCostDisplay'
import { InvocationCostEditor } from '@/components/InvocationCostEditor'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'
import {
  deleteCard,
  importCards,
  listCards,
  updateCardBack,
  updateCardDetails,
  type UpdateCardInput,
} from '@/services/cards'
import type { CardClass, CardRarity, CardRecord, CardType, InvocationCost } from '@/types/domain'

const typeOptions: { value: CardType | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todos os tipos' },
  { value: 'personagem', label: 'Personagem' },
  { value: 'criatura', label: 'Criatura' },
  { value: 'magia', label: 'Magia' },
  { value: 'armadilha', label: 'Armadilha' },
  { value: 'equipamento', label: 'Equipamento' },
]

const rarityOptions: { value: CardRarity | 'todas'; label: string }[] = [
  { value: 'todas', label: 'Todas as raridades' },
  { value: 'comum', label: 'Comum' },
  { value: 'incomum', label: 'Incomum' },
  { value: 'rara', label: 'Rara' },
  { value: 'epica', label: 'Épica' },
  { value: 'lendaria', label: 'Lendária' },
]

export const classOptions: { value: CardClass; label: string; desc: string }[] = [
  { value: 'normal', label: 'Normal', desc: 'Até 4 cópias no baralho' },
  { value: 'lenda', label: 'Lenda', desc: 'Máximo 1 cópia; entra nas zonas Lenda' },
  { value: 'mestre', label: 'Mestre', desc: 'Apenas 1 por baralho; é o Personagem Principal' },
]

const classDisplayNames: Record<CardClass, string> = {
  normal: 'Normal',
  lenda: 'Lenda',
  mestre: 'Mestre',
}

export const colorOptions = [
  { value: 'azul', label: 'Azul', colorHex: '#2563eb' },
  { value: 'vermelho', label: 'Vermelho', colorHex: '#dc2626' },
  { value: 'amarelo', label: 'Amarelo', colorHex: '#eab308' },
  { value: 'verde', label: 'Verde', colorHex: '#16a34a' },
  { value: 'laranja', label: 'Laranja', colorHex: '#ea580c' },
  { value: 'roxo', label: 'Roxo', colorHex: '#9333ea' },
  { value: 'branco', label: 'Branco', colorHex: '#f3f4f6' },
  { value: 'preto', label: 'Preto', colorHex: '#1f2937' },
  { value: 'cinza', label: 'Cinza', colorHex: '#6b7280' },
]

const colorDisplayNames: Record<string, string> = {
  azul: 'Azul',
  vermelho: 'Vermelho',
  amarelo: 'Amarelo',
  verde: 'Verde',
  laranja: 'Laranja',
  roxo: 'Roxo',
  branco: 'Branco',
  preto: 'Preto',
  cinza: 'Cinza',
  dourado: 'Amarelo',
  neutro: 'Cinza',
}

const typeDisplayNames: Record<string, string> = {
  personagem: 'Personagem',
  criatura: 'Criatura',
  magia: 'Magia',
  armadilha: 'Armadilha',
  equipamento: 'Equipamento',
  guerreiro: 'Personagem',
  arma: 'Equipamento',
  armadura: 'Equipamento',
  evento: 'Magia',
  reliquia: 'Equipamento',
}

// Opções iniciais padrão para os novos campos editáveis
export const INITIAL_ARCHETYPES = ['Guerreiro', 'Mago', 'Fera', 'Veículo']
export const INITIAL_MAGIC_SCHOOLS = ['Abjuração', 'Conjuração', 'Encantamento']
export const INITIAL_RACES = ['Dragão', 'Humano', 'Peixe']
export const INITIAL_SUMMON_MODES = ['Sinc', 'Fusion', 'Dimension']

export default function LibraryPage() {
  const [cards, setCards] = useState<CardRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [importing, setImporting] = useState(false)
  const [query, setQuery] = useState('')
  const [type, setType] = useState<CardType | 'todos'>('todos')
  const [rarity, setRarity] = useState<CardRarity | 'todas'>('todas')
  const [cardClassFilter, setCardClassFilter] = useState<CardClass | 'todas'>('todas')
  const [selected, setSelected] = useState<CardRecord | null>(null)
  const [zoomCard, setZoomCard] = useState<CardRecord | null>(null)
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

  // Opções dinâmicas unindo as iniciais aos valores já salvos nas cartas
  const dynamicArchetypes = useMemo(() => {
    const set = new Set(INITIAL_ARCHETYPES)
    cards.forEach((c) => {
      if (c.card_archetype?.trim()) set.add(c.card_archetype.trim())
    })
    return Array.from(set)
  }, [cards])

  const dynamicSchools = useMemo(() => {
    const set = new Set(INITIAL_MAGIC_SCHOOLS)
    cards.forEach((c) => {
      if (c.magic_school?.trim()) set.add(c.magic_school.trim())
    })
    return Array.from(set)
  }, [cards])

  const dynamicRaces = useMemo(() => {
    const set = new Set(INITIAL_RACES)
    cards.forEach((c) => {
      if (c.race?.trim()) set.add(c.race.trim())
    })
    return Array.from(set)
  }, [cards])

  const dynamicSummonModes = useMemo(() => {
    const set = new Set(INITIAL_SUMMON_MODES)
    cards.forEach((c) => {
      if (c.summon_mode?.trim()) set.add(c.summon_mode.trim())
    })
    return Array.from(set)
  }, [cards])

  const filtered = useMemo(
    () =>
      cards.filter((card) => {
        const cardTypeNorm = typeDisplayNames[card.card_type]?.toLowerCase() || card.card_type
        const selectedTypeNorm =
          type === 'todos' ? 'todos' : typeDisplayNames[type]?.toLowerCase() || type
        const cardClass = card.card_class || 'normal'
        return (
          card.name.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR')) &&
          (type === 'todos' || card.card_type === type || cardTypeNorm === selectedTypeNorm) &&
          (rarity === 'todas' || card.rarity === rarity) &&
          (cardClassFilter === 'todas' || cardClass === cardClassFilter)
        )
      }),
    [cards, query, type, rarity, cardClassFilter],
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
    if (card.owner && card.owner !== pb.authStore.record?.id) return
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

      <div className="arcane-panel mb-8 grid gap-3 p-4 md:grid-cols-[1fr_180px_180px_180px]">
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
        <Select
          value={cardClassFilter}
          onValueChange={(value) => setCardClassFilter(value as CardClass | 'todas')}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os graus</SelectItem>
            <SelectItem value="normal">Grau: Normal</SelectItem>
            <SelectItem value="lenda">Grau: Lenda</SelectItem>
            <SelectItem value="mestre">Grau: Mestre</SelectItem>
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
            const isOwner = !card.owner || card.owner === pb.authStore.record?.id
            const displayType = typeDisplayNames[card.card_type] || card.card_type
            const displayColor = card.color ? colorDisplayNames[card.color] || card.color : null
            const cardClass = card.card_class || 'normal'
            const displayGrau = classDisplayNames[cardClass]
            return (
              <div
                key={card.id}
                className="group relative flex flex-col justify-between rounded-xl border border-primary/15 bg-card/40 p-2.5 transition duration-200 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/70 hover:shadow-lg"
              >
                <div
                  className="relative cursor-pointer"
                  onClick={() => setZoomCard(card)}
                  title="Clique para inspecionar com HUD"
                >
                  <CardVisual card={card} />
                  {/* Badge de custo de invocação se preenchido */}
                  {card.cost && (
                    <div className="absolute top-1.5 left-1.5 z-20 rounded bg-black/80 px-1.5 py-0.5 backdrop-blur-sm shadow border border-amber-500/40">
                      <InvocationCostDisplay cost={card.cost} size="sm" />
                    </div>
                  )}
                </div>
                <div className="mt-2.5 flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setZoomCard(card)}>
                    <div className="flex items-center gap-1.5">
                      <h3
                        className="truncate font-display text-sm font-semibold text-foreground/95"
                        title={card.name}
                      >
                        {card.name}
                      </h3>
                      <span
                        className={cn(
                          'shrink-0 rounded px-1 py-0.2 text-[9px] font-bold uppercase tracking-wide',
                          cardClass === 'mestre'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : cardClass === 'lenda'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                              : 'bg-primary/10 text-muted-foreground border border-primary/20',
                        )}
                      >
                        {displayGrau}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground truncate">
                      {displayType} • <span className="capitalize">{card.rarity}</span>
                      {card.card_archetype ? ` • ${card.card_archetype}` : ''}
                      {displayColor ? ` • ${displayColor}` : ''}
                    </p>
                    {(card.race || card.magic_school || card.summon_mode) && (
                      <p className="mt-0.5 text-[10px] text-muted-foreground/80 truncate">
                        {[card.race, card.magic_school, card.summon_mode]
                          .filter(Boolean)
                          .join(' • ')}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-amber-400/90 hover:bg-amber-500/15 hover:text-amber-300"
                      onClick={() => setZoomCard(card)}
                      title="Ver HUD detalhado"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
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

      {/* Editor Modal da Carta */}
      <CardDetails
        card={selected}
        archetypes={dynamicArchetypes}
        schools={dynamicSchools}
        races={dynamicRaces}
        summonModes={dynamicSummonModes}
        onClose={() => setSelected(null)}
        onDelete={remove}
        onSave={saveMeta}
      />

      {/* HUD de Zoom */}
      <CardZoomHud
        card={zoomCard}
        open={Boolean(zoomCard)}
        onOpenChange={(open) => !open && setZoomCard(null)}
      />

      {/* Verso da carta */}
      <BackDialog open={backOpen} onOpenChange={setBackOpen} />
    </div>
  )
}

function CardDetails({
  card,
  archetypes,
  schools,
  races,
  summonModes,
  onClose,
  onDelete,
  onSave,
}: {
  card: CardRecord | null
  archetypes: string[]
  schools: string[]
  races: string[]
  summonModes: string[]
  onClose: () => void
  onDelete: (card: CardRecord) => void
  onSave: (card: CardRecord, patch: UpdateCardInput) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [type, setType] = useState<CardType>('personagem')
  const [rarity, setRarity] = useState<CardRarity>('comum')
  const [cardClass, setCardClass] = useState<CardClass>('normal')
  const [color, setColor] = useState('azul')
  const [cost, setCost] = useState<InvocationCost>({ prismatic: 0, essence: [] })
  const [cardArchetype, setCardArchetype] = useState('')
  const [magicSchool, setMagicSchool] = useState('')
  const [race, setRace] = useState('')
  const [summonMode, setSummonMode] = useState('')
  const [abilities, setAbilities] = useState('')
  const [effects, setEffects] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (card) {
      setName(card.name)
      const mappedType = (
        card.card_type in typeDisplayNames
          ? typeDisplayNames[card.card_type].toLowerCase()
          : card.card_type
      ) as CardType
      setType(mappedType || 'personagem')
      setRarity(card.rarity)
      setCardClass(card.card_class || 'normal')
      setColor(normalizeCardColor(card.color) || 'azul')
      setCost(card.cost || { prismatic: 0, essence: [] })
      setCardArchetype(card.card_archetype || '')
      setMagicSchool(card.magic_school || '')
      setRace(card.race || '')
      setSummonMode(card.summon_mode || '')
      setAbilities(card.abilities || '')
      setEffects(card.effects || '')
      setDescription(card.description || '')
      setImageFile(null)
      setImagePreview('')
    }
  }, [card])

  const editable = Boolean(card && (!card.owner || card.owner === pb.authStore.record?.id))

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
        card_class: cardClass,
        color,
        cost,
        card_archetype: cardArchetype,
        magic_school: magicSchool,
        race,
        summon_mode: summonMode,
        abilities,
        effects,
        description,
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
      card_class: cardClass,
      color,
      cost,
      card_archetype: cardArchetype,
      magic_school: magicSchool,
      race,
      summon_mode: summonMode,
      abilities,
      effects,
      description,
    }
  }, [
    card,
    name,
    type,
    rarity,
    cardClass,
    color,
    cost,
    cardArchetype,
    magicSchool,
    race,
    summonMode,
    abilities,
    effects,
    description,
  ])

  return (
    <Dialog open={Boolean(card)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto border-primary/30 bg-[#16100b]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold text-amber-300">
            Editar carta
          </DialogTitle>
          <DialogDescription>
            Edite os atributos, Grau (Normal/Lenda/Mestre), nova Classe, Custo de Invocação, Raça,
            Escola Mágica, Modo de Invocação, Habilidades e Efeitos.
          </DialogDescription>
        </DialogHeader>
        {card && previewCard && (
          <div className="grid gap-7 sm:grid-cols-[250px_1fr]">
            {/* Coluna da arte */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-full max-w-[250px]">
                {imagePreview ? (
                  (() => {
                    const normPreviewColor = normalizeCardColor(color)
                    return (
                      <article
                        className={cn(
                          'tcg-card group/card',
                          `rarity-${rarity}`,
                          normPreviewColor && `card-color-${normPreviewColor}`,
                          'mx-auto w-full max-w-[250px]',
                        )}
                        title={name}
                      >
                        <img
                          src={imagePreview}
                          alt={name}
                          className="absolute inset-0 h-full w-full rounded-[7px] object-cover"
                        />
                        {normPreviewColor && (
                          <div
                            className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 opacity-90"
                            style={{ backgroundColor: 'var(--card-accent)' }}
                          />
                        )}
                      </article>
                    )
                  })()
                ) : (
                  <CardVisual card={previewCard} className="mx-auto w-full max-w-[250px]" />
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
                    className="w-full max-w-[250px]"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {card.image || imagePreview
                      ? 'Substituir arte (frente)'
                      : 'Adicionar arte (frente)'}
                  </Button>
                  {imageFile && (
                    <p className="text-center text-xs text-primary font-medium">
                      Nova imagem: {imageFile.name}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Coluna de formulário */}
            <div className="space-y-4">
              <div>
                <Label>Nome da carta</Label>
                <Input
                  className="mt-1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!editable}
                  placeholder="Ex: Guerreiro Ancestral"
                />
              </div>

              {/* Grau da carta (antigo card_class) */}
              <div>
                <Label className="text-primary font-semibold">Grau da carta</Label>
                <Select
                  value={cardClass}
                  onValueChange={(v) => setCardClass(v as CardClass)}
                  disabled={!editable}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex flex-col">
                          <span className="font-medium">Grau: {option.label}</span>
                          <span className="text-[11px] text-muted-foreground">{option.desc}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Normal: até 4 cópias no baralho • Lenda: máx. 1 cópia (zonas Lenda) • Mestre: 1
                  por baralho (Personagem Principal).
                </p>
              </div>

              {/* Editor de Custo de Invocação */}
              <InvocationCostEditor value={cost} onChange={setCost} disabled={!editable} />

              {/* Novos campos dinâmicos: Classe e Escola Mágica */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Classe (Arquétipo)</Label>
                  <div className="mt-1">
                    <CreatableCombobox
                      value={cardArchetype}
                      onChange={setCardArchetype}
                      options={archetypes}
                      placeholder="Guerreiro, Mago, Fera, Veículo..."
                      disabled={!editable}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Ex: Guerreiro, Mago, Fera, Veículo. Digite para adicionar mais.
                  </p>
                </div>

                <div>
                  <Label>Escola Mágica</Label>
                  <div className="mt-1">
                    <CreatableCombobox
                      value={magicSchool}
                      onChange={setMagicSchool}
                      options={schools}
                      placeholder="Abjuração, Conjuração..."
                      disabled={!editable}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Ex: Abjuração, Conjuração, Encantamento.
                  </p>
                </div>
              </div>

              {/* Novos campos dinâmicos: Raça e Modo de Invocação */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <Label>Raça</Label>
                  <div className="mt-1">
                    <CreatableCombobox
                      value={race}
                      onChange={setRace}
                      options={races}
                      placeholder="Dragão, Humano, Peixe..."
                      disabled={!editable}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Ex: Dragão, Humano, Peixe. Digite para adicionar mais.
                  </p>
                </div>

                <div>
                  <Label>Modo de Invocação</Label>
                  <div className="mt-1">
                    <CreatableCombobox
                      value={summonMode}
                      onChange={setSummonMode}
                      options={summonModes}
                      placeholder="Sinc, Fusion, Dimension..."
                      disabled={!editable}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Ex: Sinc, Fusion, Dimension.
                  </p>
                </div>
              </div>

              {/* Tipo, Raridade e Cor */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={type}
                    onValueChange={(v) => setType(v as CardType)}
                    disabled={!editable}
                  >
                    <SelectTrigger className="mt-1">
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
                    <SelectTrigger className="mt-1">
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

                <div>
                  <Label>Cor da carta</Label>
                  <Select value={color} onValueChange={(v) => setColor(v)} disabled={!editable}>
                    <SelectTrigger className="mt-1">
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
                </div>
              </div>

              {/* Texto de Habilidades */}
              <div>
                <Label>Texto de Habilidades</Label>
                <Textarea
                  className="mt-1 text-xs"
                  rows={2}
                  value={abilities}
                  onChange={(e) => setAbilities(e.target.value)}
                  disabled={!editable}
                  placeholder="Habilidades ativas ou passivas da carta..."
                />
              </div>

              {/* Texto de Efeitos */}
              <div>
                <Label>Texto de Efeitos</Label>
                <Textarea
                  className="mt-1 text-xs"
                  rows={2}
                  value={effects}
                  onChange={(e) => setEffects(e.target.value)}
                  disabled={!editable}
                  placeholder="Efeitos de invocação, disparo, gatilho..."
                />
              </div>

              {/* Descrição / Lore livre */}
              <div>
                <Label>Descrição adicional / Lore</Label>
                <Textarea
                  className="mt-1 text-xs"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!editable}
                  placeholder="Texto descritivo ou de história..."
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  className="gold-button"
                  onClick={() => void handleSave()}
                  disabled={saving || !editable}
                >
                  {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Salvar alterações
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => onDelete(card)}
                  disabled={saving || !editable}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </Button>
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
