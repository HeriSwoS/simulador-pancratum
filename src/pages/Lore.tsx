import { useEffect, useState } from 'react'
import {
  BookOpen,
  Calendar,
  ChevronDown,
  ChevronUp,
  Edit3,
  Feather,
  LoaderCircle,
  Plus,
  Scroll,
  Trash2,
} from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { createLorePage, deleteLorePage, listLorePages, updateLorePage } from '@/services/lore'
import type { LorePageRecord } from '@/types/domain'

export default function LorePage() {
  const [pages, setPages] = useState<LorePageRecord[]>([])
  const [selectedPage, setSelectedPage] = useState<LorePageRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<LorePageRecord | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  const load = async () => {
    setLoading(true)
    try {
      const data = await listLorePages()
      setPages(data)
      if (data.length > 0 && !selectedPage) {
        setSelectedPage(data[0])
      } else if (selectedPage) {
        const found = data.find((p) => p.id === selectedPage.id)
        setSelectedPage(found || data[0] || null)
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Não foi possível carregar a história',
        description: err instanceof Error ? err.message : 'Tente novamente.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const handleOpenNew = () => {
    setEditingPage(null)
    setTitle('')
    setContent('')
    setEditorOpen(true)
  }

  const handleOpenEdit = (page: LorePageRecord) => {
    setEditingPage(page)
    setTitle(page.title)
    setContent(page.content || '')
    setEditorOpen(true)
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        variant: 'destructive',
        title: 'Título obrigatório',
        description: 'Dê um título à página da história.',
      })
      return
    }
    setSaving(true)
    try {
      if (editingPage) {
        const updated = await updateLorePage(editingPage.id, {
          title: title.trim(),
          content: content.trim(),
        })
        setPages((old) => old.map((p) => (p.id === updated.id ? updated : p)))
        setSelectedPage(updated)
        toast({ title: 'Página atualizada com sucesso!' })
      } else {
        const nextOrder = pages.length > 0 ? Math.max(...pages.map((p) => p.order ?? 0)) + 1 : 0
        const created = await createLorePage({
          title: title.trim(),
          content: content.trim(),
          order: nextOrder,
        })
        setPages((old) => [...old, created])
        setSelectedPage(created)
        toast({ title: 'Nova página adicionada ao tomo!' })
      }
      setEditorOpen(false)
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao salvar',
        description: err instanceof Error ? err.message : 'Tente novamente.',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (page: LorePageRecord) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${page.title}"?`)) return
    try {
      await deleteLorePage(page.id)
      setPages((old) => old.filter((p) => p.id !== page.id))
      if (selectedPage?.id === page.id) {
        setSelectedPage(pages.find((p) => p.id !== page.id) || null)
      }
      toast({ title: 'Página removida' })
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Falha ao excluir',
        description: err instanceof Error ? err.message : 'Tente novamente.',
      })
    }
  }

  const moveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= pages.length) return

    const newPages = [...pages]
    const temp = newPages[index]
    newPages[index] = newPages[targetIndex]
    newPages[targetIndex] = temp

    // Atualiza ordens
    setPages(newPages)
    try {
      await Promise.all([
        updateLorePage(newPages[index].id, { order: index }),
        updateLorePage(newPages[targetIndex].id, { order: targetIndex }),
      ])
    } catch {
      // rollback em caso de falha
      void load()
    }
  }

  return (
    <div className="page-shell">
      {/* Cabeçalho */}
      <div className="page-heading page-heading--row">
        <div>
          <span className="eyebrow flex items-center gap-1.5">
            <Feather className="h-3.5 w-3.5" />
            Crônicas e Lore de Pancratum
          </span>
          <h1>História do Mundo</h1>
          <p>
            Textos, tomos e fragmentos dos livros que narram as origens dos guerreiros, magias e
            reinos.
          </p>
        </div>
        <Button className="gold-button" onClick={handleOpenNew}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Página / Texto
        </Button>
      </div>

      {loading ? (
        <div className="grid min-h-80 place-items-center">
          <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : pages.length === 0 ? (
        <div className="empty-state">
          <BookOpen className="h-12 w-12 text-primary/60" />
          <h2>Nenhuma crônica registrada</h2>
          <p>Seja o primeiro a transcrever as lendas e tomos de PANCRATUM.</p>
          <Button className="gold-button mt-4" onClick={handleOpenNew}>
            <Plus className="mr-2 h-4 w-4" />
            Criar primeira página
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          {/* Índice do Livro (Sidebar de Páginas) */}
          <aside className="arcane-panel flex flex-col p-4">
            <div className="mb-3 flex items-center justify-between border-b border-primary/20 pb-3">
              <h2 className="flex items-center gap-2 font-display text-base font-semibold text-amber-200">
                <Scroll className="h-4 w-4 text-amber-400" />
                Índice dos Tomos
              </h2>
              <span className="text-xs text-muted-foreground">{pages.length} páginas</span>
            </div>

            <div className="space-y-1.5 overflow-y-auto max-h-[640px] pr-1">
              {pages.map((p, idx) => {
                const isSelected = selectedPage?.id === p.id
                return (
                  <div
                    key={p.id}
                    className={`group flex items-center justify-between rounded-lg p-2.5 transition cursor-pointer ${
                      isSelected
                        ? 'border border-amber-500/50 bg-amber-950/40 text-amber-200 shadow-[0_0_12px_rgba(251,191,36,0.15)]'
                        : 'border border-transparent bg-background/40 hover:border-primary/30 hover:bg-background/80 text-foreground'
                    }`}
                    onClick={() => setSelectedPage(p)}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-display text-primary/70">
                          § {idx + 1}
                        </span>
                        <p className="truncate text-sm font-semibold">{p.title}</p>
                      </div>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {p.content || 'Sem conteúdo.'}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5 opacity-80 group-hover:opacity-100">
                      {/* Reordenar */}
                      <div className="flex flex-col">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={(e) => {
                            e.stopPropagation()
                            void moveOrder(idx, 'up')
                          }}
                          className="p-0.5 text-muted-foreground hover:text-amber-300 disabled:opacity-30"
                          title="Mover para cima"
                        >
                          <ChevronUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === pages.length - 1}
                          onClick={(e) => {
                            e.stopPropagation()
                            void moveOrder(idx, 'down')
                          }}
                          className="p-0.5 text-muted-foreground hover:text-amber-300 disabled:opacity-30"
                          title="Mover para baixo"
                        >
                          <ChevronDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </aside>

          {/* Área do Pergaminho / Livro Aberto */}
          <main className="relative rounded-2xl border-2 border-[#5c4428] bg-gradient-to-b from-[#251b13] via-[#1c140e] to-[#140e0a] p-6 sm:p-10 shadow-2xl text-[#f3e9d2]">
            {/* Efeito de pergaminho sutil */}
            <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.06),_transparent_70%)]" />

            {selectedPage ? (
              <div className="relative">
                {/* Cabeçalho da página lida */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-[#5c4428]/60 pb-5">
                  <div>
                    <span className="text-xs uppercase tracking-widest text-amber-400/80 font-display">
                      Capítulo &bull; Tomo Oficial
                    </span>
                    <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-wide text-amber-200">
                      {selectedPage.title}
                    </h2>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[#b8a68a]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        Registrado em {new Date(selectedPage.created).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(selectedPage)}
                      className="border-amber-500/40 hover:bg-amber-500/15 text-amber-300"
                    >
                      <Edit3 className="mr-1.5 h-3.5 w-3.5" />
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void handleDelete(selectedPage)}
                      className="text-destructive/80 hover:bg-destructive/15 hover:text-destructive"
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Excluir
                    </Button>
                  </div>
                </div>

                {/* Conteúdo em estilo livro antigo */}
                <article className="prose prose-invert max-w-none text-[#eadfc7]">
                  <div className="whitespace-pre-line font-serif text-base sm:text-lg leading-relaxed tracking-normal">
                    {selectedPage.content ? (
                      selectedPage.content
                    ) : (
                      <p className="italic text-[#a8967e]">Esta página ainda não possui texto.</p>
                    )}
                  </div>
                </article>

                <div className="mt-10 border-t border-[#5c4428]/40 pt-4 text-center">
                  <span className="font-display text-xs text-[#b8a68a] tracking-widest">
                    &bull; PANCRATUM &bull;
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center text-muted-foreground">
                Selecione uma página no índice para ler.
              </div>
            )}
          </main>
        </div>
      )}

      {/* Modal de Criação / Edição */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl border-primary/30 bg-[#16100b] text-[#f4ecd8]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold text-amber-300">
              {editingPage ? 'Editar página da história' : 'Nova página / crônica'}
            </DialogTitle>
            <DialogDescription className="text-xs text-[#b8a78a]">
              Escreva os acontecimentos, lendas, regras de lore ou registros dos livros de
              PANCRATUM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs uppercase text-amber-400">Título do Tomo / Página</Label>
              <Input
                className="mt-1"
                placeholder="Ex: O Despertar dos Primásticos"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs uppercase text-amber-400">Texto da História</Label>
              <Textarea
                rows={12}
                className="mt-1 text-sm leading-relaxed font-serif"
                placeholder="Escreva aqui a narrativa, parágrafos, profecias ou capítulos..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditorOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button className="gold-button" onClick={() => void handleSave()} disabled={saving}>
                {saving ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                Salvar página
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
