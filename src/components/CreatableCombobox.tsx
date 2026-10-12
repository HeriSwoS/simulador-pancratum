import { useState } from 'react'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'

interface CreatableComboboxProps {
  value?: string
  onChange: (value: string) => void
  options: string[]
  placeholder?: string
  emptyText?: string
  disabled?: boolean
  className?: string
}

export function CreatableCombobox({
  value = '',
  onChange,
  options,
  placeholder = 'Selecione ou adicione...',
  emptyText = 'Nenhuma opção.',
  disabled = false,
  className,
}: CreatableComboboxProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const trimmedSearch = search.trim()
  const exists = options.some((opt) => opt.toLowerCase() === trimmedSearch.toLowerCase())

  const handleSelect = (val: string) => {
    onChange(val)
    setOpen(false)
    setSearch('')
  }

  const handleCreate = () => {
    if (!trimmedSearch) return
    onChange(trimmedSearch)
    setOpen(false)
    setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal text-left h-10',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar ou digitar nova..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty className="p-2 text-xs text-muted-foreground">
              {trimmedSearch ? (
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex w-full items-center gap-1.5 rounded p-1.5 text-left text-xs text-primary hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar &quot;{trimmedSearch}&quot;</span>
                </button>
              ) : (
                emptyText
              )}
            </CommandEmpty>

            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                  className="flex items-center justify-between"
                >
                  <span className="capitalize">{option}</span>
                  {value.toLowerCase() === option.toLowerCase() && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>

            {trimmedSearch && !exists && (
              <div className="border-t border-border p-1">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="flex w-full items-center gap-1.5 rounded p-2 text-xs font-medium text-primary hover:bg-primary/10"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Adicionar &quot;{trimmedSearch}&quot;</span>
                </button>
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
