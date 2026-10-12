import { useState, type FormEvent } from 'react'
import { Camera, LoaderCircle, Save } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const { toast } = useToast()
  const [name, setName] = useState(String(user?.name || ''))
  const [avatar, setAvatar] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [errors, setErrors] = useState<FieldErrors>({})
  const [busy, setBusy] = useState(false)
  const currentAvatar = user?.avatar
    ? pb.files.getURL(user, String(user.avatar), { thumb: '200x200' })
    : ''
  const selectAvatar = (file?: File) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ avatar: 'A imagem deve ter no máximo 2 MB.' })
      return
    }
    setAvatar(file)
    setPreview(URL.createObjectURL(file))
    setErrors({})
  }
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setBusy(true)
    setErrors({})
    try {
      const form = new FormData()
      form.set('name', name)
      if (avatar) form.set('avatar', avatar)
      await pb.collection('users').update(user.id, form)
      await refreshUser()
      toast({ title: 'Perfil atualizado', description: 'Suas alterações foram salvas.' })
    } catch (err) {
      const fields = extractFieldErrors(err)
      setErrors(Object.keys(fields).length ? fields : { form: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="page-shell">
      <div className="page-heading">
        <span className="eyebrow">Conta do combatente</span>
        <h1>Seu perfil</h1>
        <p>Atualize como você aparece na arena.</p>
      </div>
      <form onSubmit={submit} className="arcane-panel mx-auto max-w-2xl p-6 sm:p-9">
        <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row">
          <label className="group relative cursor-pointer">
            <Avatar className="h-24 w-24 border-2 border-primary/40">
              <AvatarImage src={preview || currentAvatar} />
              <AvatarFallback className="text-xl">{name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 grid place-items-center rounded-full bg-black/55 opacity-0 transition group-hover:opacity-100">
              <Camera />
            </span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              hidden
              onChange={(e) => selectAvatar(e.target.files?.[0])}
            />
          </label>
          <div>
            <h2 className="font-display text-xl">Imagem de jogador</h2>
            <p className="mt-1 text-sm text-muted-foreground">PNG, JPG ou WEBP, até 2 MB.</p>
            {errors.avatar && <p className="form-error">{errors.avatar}</p>}
          </div>
        </div>
        <div>
          <Label htmlFor="profile-name">Nome</Label>
          <Input
            id="profile-name"
            className="mt-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          {errors.name && <p className="form-error">{errors.name}</p>}
        </div>
        {errors.form && <p className="form-error mt-3">{errors.form}</p>}
        <Button className="gold-button mt-6" disabled={busy}>
          {busy ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar perfil
        </Button>
      </form>
    </div>
  )
}
