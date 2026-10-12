# Changelog — Simulador PANCRATUM

## 0.0.12

- **Seleção de dois baralhos ao criar partida**:
  - Modal de preparação de partida no lobby (`/jogar`) atualizado para permitir a seleção independente do baralho do Jogador 1 (Você) e do baralho do Jogador 2 (Adversário).
  - Ambos os lados nascem com suas respectivas cartas embaralhadas na pilha de Baralho, Personagem Principal posicionado na zona principal e cartas de classe Lenda pré-alocadas nas zonas LENDA 1–3 de cada jogador.
- **Vida inicial do jogador começando em 20**:
  - Partidas recém-criadas iniciam com vida do jogador em 20 (`playerLife: { player: 20, opponent: 20 }`), enquanto a vida do Personagem Principal mantém-se em 0.
  - Snapshots legados continuam preservando integralmente suas vidas sem rebaixamento em `normalizeSnapshot`.
- **Zona de Recursos externa ao tabuleiro**:
  - A zona de Recursos foi retirada de dentro da grade `.battle-board` e movida para um painel externo próprio (`.board-external-panel`), restaurando o alinhamento reto e simétrico entre as 5 zonas de Ataque, 5 zonas de Defesa e Equipamentos.
  - Layout responsivo ajustado para visualização em telas de 900px e 640px com rolagem horizontal consistente.
- **Cartas na zona de Recursos sem distorção e com movimento livre**:
  - Corrigido o dimensionamento das cartas na zona de Recursos, preservando estritamente a proporção oficial 63×88 de todas as zonas, sem estiramento ou distorção.
  - Cartas podem ser arrastadas e soltas livremente em qualquer posição dentro da zona de Recursos, sem ficarem travadas no centro.
  - O giro por clique (em pé ↔ deitada), o HUD de contagem de cores das cartas em pé e o contador de recursos continuam funcionando normalmente.
- **Alinhamento do BoardPreview**:
  - Prévia do tabuleiro atualizada com colunas balanceadas e zonas laterais alinhadas (Banimento, Cemitério e Baralho).

## 0.0.11

- **Remoção de cartas e cópias no Editor de Baralhos**:
  - Possibilidade de remover cartas individuais ou diminuir cópias diretamente no DeckEditor.

## 0.0.10

- **Nova classe de carta na edição (Normal, Lenda, Mestre)**:
  - Adicionado seletor de classe da carta (`Normal`, `Lenda`, `Mestre`) no modal de edição da Biblioteca (`/biblioteca`), além de filtro por classe na busca da biblioteca.
  - Criada e aplicada a migration `0010_add_cards_card_class.js` adicionando o campo `card_class` à coleção `cards`, com tratamento automático de registros legados para `normal`.
- **Regras de cópias ao montar o baralho e seleção de Mestre**:
  - **Normal**: até 4 cópias no baralho. Bloqueio e aviso claro ao tentar exceder.
  - **Lenda**: no máximo 1 cópia de cada no baralho. Bloqueio e aviso ao tentar adicionar a segunda cópia.
  - **Mestre**: exatamente 1 carta Mestre por baralho, que é o Personagem Principal.
  - Ao selecionar uma carta de classe Mestre (no editor ou dropdown), ela se torna automaticamente o Personagem Principal do deck, substituindo o anterior com notificação informativa.
- **Zonas de Lenda no tabuleiro e restrição exclusiva**:
  - Rótulos das três zonas da coluna esquerda renomeados de "LENDÁRIA 1/2/3" para **"LENDA 1"**, **"LENDA 2"** e **"LENDA 3"**.
  - Restrição ativa: apenas cartas de classe **Lenda** podem ser movidas/colocadas nessas zonas (aviso com bloqueio caso tente mover cartas de classe Normal ou Mestre).
- **Inversão das zonas de Banimento e Recursos**:
  - Trocadas as posições das zonas no tabuleiro e na prévia: **Recursos** agora ocupa a zona maior externa e **Banimento** ocupa a posição interna ao lado do Cemitério e Baralho.
  - Na zona maior de Recursos, as cartas são renderizadas em **leque sobreposto** com offset visível e ordenação de z-index do topo para a base, permitindo ver e clicar em cada carta individualmente.
- **HUD de contagem de cores na zona de Recursos**:
  - Exibição de HUD discreto sobre a zona de Recursos mostrando a contagem agrupada por cor das cartas presentes ali, considerando **somente as cartas em pé** (ex.: "3 azuis, 2 vermelhas"), utilizando os chips e paleta oficial de 9 cores do projeto.

## 0.0.9

- **Correção da lista oficial de Tipos de Carta**:
  - Atualizada a lista de tipos em todo o sistema para os 5 tipos oficiais do PANCRATUM: `Personagem`, `Criatura`, `Magia`, `Armadilha` e `Equipamento`.
  - Atualizados filtros e dropdowns no editor e na visualização da Biblioteca.
  - Criada a migration `0009_update_card_types_and_remove_seed_cards.js` para atualizar o schema do banco (select `card_type`) e migrar registros legados de forma transparente.
- **Correção da lista de Cores da Carta**:
  - Atualizada a lista para as 9 cores simples oficiais na ordem exata: `Azul`, `Vermelho`, `Amarelo`, `Verde`, `Laranja`, `Roxo`, `Branco`, `Preto` e `Cinza`.
  - Definidas novas classes e variáveis CSS de identidade visual no `CardVisual` e `main.css` para Laranja e Cinza, com suporte retrocompatível e conversão segura para cartas existentes com valores antigos (`dourado`, `neutro`).
- **Remoção de cartas oficiais de demonstração**:
  - Removido o acervo embutido/demonstração de cartas oficiais da Biblioteca: a biblioteca agora exibe exclusivamente o acervo pessoal do usuário.
  - A migration `0009` removeu do banco as cartas de seed do sistema antigo e o baralho modelo, preservando integralmente as cartas e baralhos criados pelos usuários reais.

## 0.0.8

- **Edição completa de cartas na Biblioteca**:
  - **Substituir/adicionar imagem da carta (frente)**: permite enviar uma nova imagem PNG, JPG ou WEBP para a frente da carta diretamente pela biblioteca, igual ao verso.
  - **Edição de metadados**: alteração de Nome, Tipo (Guerreiro, Arma, Armadura, Evento, Relíquia), Raridade (Comum, Incomum, Rara, Épica, Lendária) e Cor/Elemento da carta (Neutro, Branco/Luz, Azul/Água, Vermelho/Fogo, Verde/Terra, Preto/Trevas, Dourado/Divino, Roxo/Arcano).
  - **Visual da cor/elemento**: aplicação da cor selecionada nas bordas e moldura da carta (`CardVisual` e estilos CSS), permitindo identificar facilmente a identidade elementar de cada carta.
  - **Botão de editar (lápis)** nas cartas da biblioteca para acesso rápido à edição individual.
  - **Migration 0008**: adicionado campo `color` à coleção `cards` do PocketBase, mantendo total retrocompatibilidade com cartas existentes.

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
