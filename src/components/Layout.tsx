import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LogOut, Menu, Settings, UserRound } from 'lucide-react'
import { Brand } from '@/components/Brand'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

const links = [
  { to: '/biblioteca', label: 'Biblioteca' },
  { to: '/baralhos', label: 'Baralhos' },
  { to: '/jogar', label: 'Jogar' },
]

function UserMenu() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const initials = String(user?.name || user?.email || 'A')
    .slice(0, 2)
    .toUpperCase()
  const avatar = user?.avatar
    ? pb.files.getURL(user, String(user.avatar), { thumb: '100x100' })
    : ''
  if (!user)
    return (
      <Button variant="ghost" onClick={() => navigate('/login')}>
        Entrar
      </Button>
    )
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-10 gap-2 rounded-full px-2 pr-3">
          <Avatar className="h-7 w-7 border border-primary/40">
            <AvatarImage src={avatar} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span className="hidden max-w-28 truncate text-sm md:block">
            {String(user.name || 'Jogador')}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => navigate('/perfil')}>
          <UserRound className="mr-2 h-4 w-4" />
          Perfil
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/biblioteca?verso=1')}>
          <Settings className="mr-2 h-4 w-4" />
          Trocar verso das cartas
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            signOut()
            navigate('/')
          }}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return (
    <div className="flex min-h-screen flex-col">
      <header className={cn('site-header', scrolled && 'site-header--scrolled')}>
        <div className="mx-auto flex h-16 w-full max-w-[1480px] items-center justify-between px-4 lg:px-8">
          <NavLink to="/" aria-label="Página inicial">
            <Brand />
          </NavLink>
          <nav className="hidden items-center gap-9 md:flex">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) => cn('nav-link', isActive && 'nav-link--active')}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="hidden md:block">
            <UserMenu />
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="md:hidden">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent className="border-primary/20 bg-card">
              <SheetHeader>
                <SheetTitle>
                  <Brand />
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-10 flex flex-col gap-2">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'rounded-lg px-4 py-3 font-display text-sm tracking-wider',
                        isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                      )
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-6 border-t border-border pt-4">
                <UserMenu />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
      <main className="flex flex-1 flex-col pt-16">
        <Outlet />
      </main>
      <footer className="border-t border-primary/10 bg-[#130d08] px-4 py-5 text-center text-sm text-muted-foreground">
        <Brand compact className="mr-2 align-middle" /> PANCRATUM © 2025 — Simulador manual de TCG
      </footer>
    </div>
  )
}
