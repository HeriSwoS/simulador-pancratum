import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Index from '@/pages/Index'
import NotFound from '@/pages/NotFound'
import { LoginPage, RecoverPage, ResetPage, SignupPage } from '@/pages/Auth'
import LibraryPage from '@/pages/Library'
import DecksPage from '@/pages/Decks'
import DeckEditorPage from '@/pages/DeckEditor'
import PlayLobbyPage from '@/pages/PlayLobby'
import MatchPage from '@/pages/Match'
import ProfilePage from '@/pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/entrar" element={<Navigate to="/login" replace />} />
              <Route path="/cadastro" element={<SignupPage />} />
              <Route path="/cadastrar" element={<Navigate to="/cadastro" replace />} />
              <Route path="/recuperar-senha" element={<RecoverPage />} />
              <Route path="/redefinir-senha" element={<ResetPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/biblioteca" element={<LibraryPage />} />
                <Route path="/colecao" element={<Navigate to="/biblioteca" replace />} />
                <Route path="/baralhos" element={<DecksPage />} />
                <Route path="/baralhos/:id" element={<DeckEditorPage />} />
                <Route path="/decks" element={<Navigate to="/baralhos" replace />} />
                <Route path="/jogar" element={<PlayLobbyPage />} />
                <Route path="/perfil" element={<ProfilePage />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute />}>
              <Route path="/play/:matchId" element={<MatchPage />} />
              <Route path="/partida/:matchId" element={<MatchPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  )
}
