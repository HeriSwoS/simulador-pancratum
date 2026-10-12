import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { COLOR_MAP, parseCost } from './InvocationCostDisplay'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { InvocationCost } from '@/types/domain'

interface CostEditorProps {
  value?: InvocationCost | null
  onChange: (value: InvocationCost) => void
  disabled?: boolean
}

const colorChoices = [
  'azul',
  'vermelho',
  'amarelo',
  'verde',
  'laranja',
  'roxo',
  'branco',
  'preto',
  'cinza',
]

export function InvocationCostEditor({ value, onChange, disabled }: CostEditorProps) {
  const current = parseCost(value) || { prismatic: 0, essence: [] }
  const [selectedColor, setSelectedColor] = useState('azul')

  const setPrismatic = (numStr: string) => {
    const val = parseInt(numStr, 10)
    onChange({
      ...current,
      prismatic: isNaN(val) ? 0 : Math.max(0, val),
    })
  }

  const addEssence = (color: string) => {
    const list = [...(current.essence || []), color]
    onChange({
      ...current,
      essence: list,
    })
  }

  const removeEssence = (index: number) => {
    const list = [...(current.essence || [])]
    list.splice(index, 1)
    onChange({
      ...current,
      essence: list,
    })
  }

  const clearCost = () => {
    onChange({ prismatic: 0, essence: [] })
  }

  return (
    <div className="space-y-3 rounded-lg border border-primary/20 bg-background/50 p-3">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold uppercase tracking-wider text-primary">
          Custo de Invocação (Composto)
        </Label>
        {((current.prismatic ?? 0) > 0 || (current.essence?.length ?? 0) > 0) && (
          <button
            type="button"
            onClick={clearCost}
            disabled={disabled}
            className="text-[11px] text-muted-foreground hover:text-destructive"
          >
            Limpar custo
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Ponto Primástico */}
        <div>
          <Label className="text-xs text-muted-foreground">Ponto Primástico (Número)</Label>
          <div className="mt-1 flex items-center gap-2">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded border-2 border-amber-400 bg-amber-500/20 font-display text-sm font-bold text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]">
              {current.prismatic ?? 0}
            </div>
            <Input
              type="number"
              min={0}
              max={99}
              value={current.prismatic ?? 0}
              onChange={(e) => setPrismatic(e.target.value)}
              disabled={disabled}
              className="h-9 w-24 text-center font-display"
              placeholder="0"
            />
            <span className="text-[11px] text-muted-foreground">Ponto numérico</span>
          </div>
        </div>

        {/* Adicionar Ponto de Essência */}
        <div>
          <Label className="text-xs text-muted-foreground">Adicionar Ponto de Essência</Label>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {colorChoices.map((cKey) => {
              const meta = COLOR_MAP[cKey]
              const isSelected = selectedColor === cKey
              return (
                <button
                  key={cKey}
                  type="button"
                  title={`Adicionar essência ${meta.label}`}
                  onClick={() => {
                    setSelectedColor(cKey)
                    addEssence(cKey)
                  }}
                  disabled={disabled}
                  className={`h-7 w-7 rounded border-2 transition hover:scale-110 active:scale-95 ${
                    isSelected ? 'ring-2 ring-primary ring-offset-1' : ''
                  }`}
                  style={{
                    backgroundColor: meta.hex,
                    borderColor: meta.border,
                  }}
                />
              )
            })}
          </div>
          <span className="text-[11px] text-muted-foreground">Clique na cor para adicionar</span>
        </div>
      </div>

      {/* Prévia da lista de pontos de essência */}
      <div>
        <Label className="text-xs text-muted-foreground">
          Essências adicionadas ({current.essence?.length || 0}):
        </Label>
        <div className="mt-1.5 flex min-h-[36px] flex-wrap items-center gap-1.5 rounded border border-border/60 bg-background/80 p-1.5">
          {current.essence && current.essence.length > 0 ? (
            current.essence.map((cKey, idx) => {
              const meta = COLOR_MAP[cKey] || COLOR_MAP.azul
              return (
                <div
                  key={idx}
                  className="group relative flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs text-foreground"
                  style={{
                    borderColor: meta.border,
                    backgroundColor: `${meta.hex}25`,
                  }}
                >
                  <span
                    className="h-3 w-3 rounded-sm border"
                    style={{ backgroundColor: meta.hex, borderColor: meta.border }}
                  />
                  <span className="text-[11px] capitalize">{meta.label}</span>
                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => removeEssence(idx)}
                      className="ml-1 text-muted-foreground hover:text-destructive"
                      title="Remover ponto"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })
          ) : (
            <span className="text-xs text-muted-foreground/60 italic">
              Nenhuma essência adicionada. Clique nas cores acima.
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
