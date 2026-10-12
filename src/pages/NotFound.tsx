import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-background p-5 text-center">
      <div>
        <Compass className="mx-auto mb-6 h-14 w-14 text-primary" />
        <p className="font-display text-7xl font-bold text-primary">404</p>
        <h1 className="mt-4 font-display text-2xl">Esta trilha não leva à arena</h1>
        <p className="mt-2 text-muted-foreground">A página procurada não existe ou foi movida.</p>
        <Button asChild className="gold-button mt-7">
          <Link to="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  )
}
