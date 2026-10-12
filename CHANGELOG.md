# Changelog — Simulador PANCRATUM

## 0.0.7

- **Centralização perfeita e prevenção de transbordamento nas zonas**:
  - Ajustado o dimensionamento da carta no tabuleiro (`.board-card-wrap`) para `height: 84%; width: auto; aspect-ratio: 63 / 88; max-width: 90%` com `transform-origin: center center`, garantindo que tanto na posição vertical quanto deitada (90°) ela caiba totalmente dentro do limite de 100% da zona sem cortar ou ficar para fora.
  - Removido o espalhamento artificial (`spreadX`/`spreadY`) ao mover cartas para a zona por clique ou menu de contexto, posicionando-as com exatidão em `(50, 50)`.
  - Adicionado snap magnético no drop por drag-and-drop: soltar a carta próximo ao centro da zona (dentro de ±15%) trava o centro em 50% / 50%, evitando descentralização acidental pelo cursor.
  - Adicionado saneamento no carregamento de partidas em `normalizeSnapshot` para re-centralizar automaticamente cartas que possuíam desvios herdados do espalhamento anterior.

## 0.0.6

- Atualizações e ajustes gerais de estabilidade.

## 0.0.5

- **Dois contadores de vida** no lugar do antigo D20: cada zona PERSONAGEM PRINCIPAL agora tem os chips "Vida" (vida do jogador) e "Personagem" (vida do personagem principal), ambos sem limite. Snapshots antigos (v2, com `d20`/`counter`) são amaciados em `normalizeSnapshot`, `makeSnapshot` e `createResetSnapshot` (`src/types/domain.ts`, `src/pages/Match.tsx`).
- **Personagem principal + 3 lendárias nascem no tabuleiro**: o baralho embaralhado contém só as cartas de quantidade; o personagem nasce na zona PERSONAGEM PRINCIPAL e cada lendária escolhida na sua zona LENDÁRIA 1, 2 ou 3, viradas para cima. O editor de baralho guarda `legendary_cards` (relation, máx. 3, na ordem de escolha — migration `0007_add_decks_legendary_cards`) (`src/pages/DeckEditor.tsx`, `src/pages/PlayLobby.tsx`, `src/services/decks.ts`).
- **Giro por clique**: qualquer carta no tabuleiro alterna em pé ↔ deitada (0°/90°) com um clique; o menu de contexto não tem mais botões de graus (`src/pages/Match.tsx`, `src/main.css`).
