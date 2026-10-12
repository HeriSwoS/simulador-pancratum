import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, EyeOff, LoaderCircle, Mail, Shield } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/contexts/AuthContext'
import { extractFieldErrors, getErrorMessage, type FieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="auth-page">
      <Link
        to="/"
        className="absolute left-5 top-5 flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>
      <div className="auth-card animate-fade-in-up">
        <Brand className="mb-8 justify-center" />
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-muted-foreground">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

export function LoginPage() {
  const { user, signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/jogar" replace />
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signIn(email, password)
      const target = (location.state as { from?: string } | null)?.from || '/jogar'
      navigate(target, { replace: true })
    } catch (err) {
      setError('E-mail ou senha incorretos. Verifique os dados e tente novamente.')
      console.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  return (
    <AuthFrame title="Entre na arena" subtitle="Acesse sua biblioteca e continue seus testes.">
      <form onSubmit={submit} className="space-y-5">
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-2"
            placeholder="voce@exemplo.com"
          />
        </div>
        <div>
          <div className="flex justify-between">
            <Label htmlFor="password">Senha</Label>
            <Link to="/recuperar-senha" className="text-xs text-primary hover:underline">
              Esqueci minha senha
            </Link>
          </div>
          <div className="relative mt-2">
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {error && <p className="form-error">{error}</p>}
        <Button className="gold-button w-full" size="lg" disabled={busy}>
          {busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}Entrar
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="font-semibold text-primary hover:underline">
          Cadastre-se grátis
        </Link>
      </p>
    </AuthFrame>
  )
}

export function SignupPage() {
  const { user, signUp } = useAuth()
  const navigate = useNavigate()
  const [data, setData] = useState({ name: '', email: '', password: '', passwordConfirm: '' })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [general, setGeneral] = useState('')
  const [busy, setBusy] = useState(false)
  if (user) return <Navigate to="/jogar" replace />
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setErrors({})
    setGeneral('')
    try {
      await signUp(data)
      navigate('/jogar')
    } catch (err) {
      const fields = extractFieldErrors(err)
      setErrors(fields)
      if (!Object.keys(fields).length) setGeneral(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }
  const field = (key: keyof typeof data, label: string, type = 'text') => (
    <div>
      <Label htmlFor={key}>{label}</Label>
      <Input
        id={key}
        className="mt-2"
        type={type}
        autoComplete={key.includes('password') ? 'new-password' : key}
        value={data[key]}
        onChange={(e) => setData({ ...data, [key]: e.target.value })}
        required
      />
      {errors[key] && <p className="form-error">{errors[key]}</p>}
    </div>
  )
  return (
    <AuthFrame
      title="Forje sua conta"
      subtitle="Sua coleção e seus baralhos ficam guardados na nuvem."
    >
      <form onSubmit={submit} className="space-y-4">
        {field('name', 'Nome de jogador')}
        {field('email', 'E-mail', 'email')}
        {field('password', 'Senha (mínimo de 8 caracteres)', 'password')}
        {field('passwordConfirm', 'Confirme a senha', 'password')}
        {general && <p className="form-error">{general}</p>}
        <Button className="gold-button w-full" size="lg" disabled={busy}>
          {busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}Criar conta
        </Button>
      </form>
      <p className="mt-7 text-center text-sm text-muted-foreground">
        Já faz parte?{' '}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Entrar
        </Link>
      </p>
    </AuthFrame>
  )
}

export function RecoverPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      await pb.collection('users').requestPasswordReset(email)
    } catch {
      /* intentionally ignored */
    } finally {
      setSent(true)
      setBusy(false)
    }
  }
  return (
    <AuthFrame title="Recuperar acesso" subtitle="Enviaremos instruções para redefinir sua senha.">
      {sent ? (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-6 text-center">
          <Mail className="mx-auto mb-3 text-primary" />
          <p>Se o e-mail existir, enviamos as instruções.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label htmlFor="recover-email">E-mail</Label>
            <Input
              id="recover-email"
              type="email"
              className="mt-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button className="gold-button w-full" disabled={busy}>
            {busy && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}Enviar instruções
          </Button>
        </form>
      )}
    </AuthFrame>
  )
}

export function ResetPage() {
  const params = new URLSearchParams(useLocation().search)
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) return setError('A senha precisa ter pelo menos 8 caracteres.')
    if (password !== confirm) return setError('As senhas não coincidem.')
    try {
      await pb.collection('users').confirmPasswordReset(token, password, confirm)
      setDone(true)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }
  return (
    <AuthFrame title="Nova senha" subtitle="Escolha uma senha segura para voltar à arena.">
      {done ? (
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-primary" />
          <p className="mb-5">Senha alterada com sucesso.</p>
          <Button asChild className="gold-button">
            <Link to="/login">Entrar</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Nova senha</Label>
            <Input
              type="password"
              className="mt-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <Label>Confirmar senha</Label>
            <Input
              type="password"
              className="mt-2"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <Button className="gold-button w-full">Redefinir senha</Button>
        </form>
      )}
    </AuthFrame>
  )
}
