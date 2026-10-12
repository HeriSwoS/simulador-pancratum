import { ArrowRight, Crown, Layers3, MousePointer2, RotateCw, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BoardPreview } from '@/components/BoardPreview'
import { Brand } from '@/components/Brand'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'

const features = [
  {
    icon: MousePointer2,
    title: 'Movimento livre',
    text: 'Arraste, empilhe e organize as cartas como faria em uma mesa física.',
  },
  {
    icon: RotateCw,
    title: 'Sem regras impostas',
    text: 'Gire, vire e mova livremente. Você controla cada ação da partida.',
  },
  {
    icon: Layers3,
    title: 'Seu acervo',
    text: 'Importe suas artes e monte baralhos personalizados para os testes.',
  },
]

export default function Index() {
  const { user } = useAuth()
  return (
    <div className="overflow-hidden">
      <section className="hero-section">
        <div className="hero-rune hero-rune--one" />
        <div className="hero-rune hero-rune--two" />
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-[1480px] items-center gap-14 px-5 py-16 lg:grid-cols-[0.82fr_1.18fr] lg:px-10">
          <div className="relative z-10 animate-fade-in-up">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
              <ShieldCheck className="h-4 w-4" /> Mesa digital oficial de testes
            </div>
            <h1 className="max-w-2xl font-display text-5xl font-bold leading-[1.04] text-foreground sm:text-6xl xl:text-7xl">
              Seu TCG, sua mesa, <span className="text-gold-gradient">suas regras.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Um simulador manual para testar cartas, mecânicas e estratégias do PANCRATUM. A
              liberdade da mesa física, direto no navegador.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button size="lg" className="gold-button" asChild>
                <Link to={user ? '/jogar' : '/cadastro'}>
                  {user ? 'Ir para a mesa' : 'Criar conta gratuita'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary/30 bg-background/30"
                asChild
              >
                <Link to={user ? '/biblioteca' : '/login'}>
                  {user ? 'Ver biblioteca' : 'Entrar'}
                </Link>
              </Button>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <Crown className="h-4 w-4 text-primary" /> Feito para prototipar. Sem automações, sem
              limites.
            </p>
          </div>
          <div className="relative min-h-[360px] lg:min-h-[570px]">
            <div className="absolute inset-[12%] rounded-full bg-primary/10 blur-[90px]" />
            <BoardPreview className="hero-board animate-float" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-full border border-primary/20 bg-[#140e09]/90 px-5 py-2 text-center text-xs uppercase tracking-[0.18em] text-primary shadow-2xl">
              2 tabuleiros • controle total
            </div>
          </div>
        </div>
      </section>
      <section className="border-y border-primary/10 bg-card/35 py-20">
        <div className="mx-auto max-w-6xl px-5 text-center">
          <Brand compact className="mb-5 justify-center" />
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Uma arena feita para criar
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Tudo que você precisa para testar o jogo sem transformar a mesa em um robô de regras.
          </p>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <article key={title} className="arcane-panel p-7 text-left">
                <span className="mb-5 inline-grid h-11 w-11 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                  <Icon />
                </span>
                <h3 className="font-display text-lg font-semibold">{title}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
