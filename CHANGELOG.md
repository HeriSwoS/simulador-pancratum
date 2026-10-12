# Changelog — Simulador PANCRATUM

## 0.0.5

- **Dois contadores de vida** no lugar do antigo D20: cada zona PERSONAGEM PRINCIPAL agora tem os chips "Vida" (vida do jogador) e "Personagem" (vida do personagem principal), ambos sem limite. Snapshots antigos (v2, com `d20`/`counter`) são amaciados em `normalizeSnapshot`, `makeSnapshot` e `createResetSnapshot` (`src/types/domain.ts`, `src/pages/Match.tsx`).
- **Personagem principal + 3 lendárias nascem no tabuleiro**: o baralho embaralhado contém só as cartas de quantidade; o personagem nasce na zona PERSONAGEM PRINCIPAL e cada lendária escolhida na sua zona LENDÁRIA 1, 2 ou 3, viradas para cima. O editor de baralho guarda `legendary_cards` (relation, máx. 3, na ordem de escolha — migration `0007_add_decks_legendary_cards`) (`src/pages/DeckEditor.tsx`, `src/pages/PlayLobby.tsx`, `src/services/decks.ts`).
- **Giro por clique**: qualquer carta no tabuleiro alterna em pé ↔ deitada (0°/90°) com um clique; o menu de contexto não tem mais botões de graus (`src/pages/Match.tsx`, `src/main.css`).
