# Especificação técnica — Entre Letras

**Status:** Proposta para implementação  
**Versão:** 0.1  
**Data:** 20 de outubro de 2026  
**Base do produto:** [PRD.md](./PRD.md)  
**Referência visual e de interação:** [mockup-ux.html](./mockup-ux.html)

## 1. Objetivo e escopo

Este documento descreve uma implementação de produção para o protótipo UX “Entre Letras”: jogo web casual, em português brasileiro, de adivinhação de palavras com cinco letras e até seis tentativas. A interface escolhida usa uma composição editorial em papel claro, verde-petróleo como cor principal, detalhes em dourado e coral, uma área de jogo em destaque e cartões laterais para pistas, dificuldade e estatísticas.

O protótipo é uma demonstração standalone com conteúdo pequeno e estado em memória/localStorage. Não é uma base de produção: a lista de palavras, a seleção de resposta, a persistência, a validação, a privacidade e os fluxos de erro precisam ser separados e implementados conforme esta especificação.

O documento inclui decisões técnicas recomendadas e identifica os pontos que ainda requerem decisão de produto. O workspace atualmente contém documentos e mockups, não uma aplicação nem uma stack já estabelecida; portanto, a stack abaixo é uma proposta, não uma descrição do código existente.

## 2. Decisões técnicas propostas

| Tema | Proposta | Observações |
|---|---|---|
| Aplicação | SPA web responsiva com Vite e módulos JavaScript nativos | Implementado sem framework; o workspace não tinha aplicação nem stack preexistente. |
| UI | HTML semântico, CSS próprio e tokens inspirados no mockup UX | Evitar dependência de biblioteca visual para manter a identidade do design. |
| Estado de jogo | Máquina de estados explícita e funções de domínio puras | UI não deve calcular pistas nem alterar estatísticas diretamente. |
| Persistência sem conta | IndexedDB para partida, histórico e estatísticas | Dados versionados; gravações usam revisão otimista para evitar sobrescrita silenciosa entre abas. |
| Vocabulário | Dados editoriais versionados e revisados | Separar palavras que podem ser resposta das palavras aceitas como tentativa. |
| Conta e sincronização | Integração futura por API autenticada | Provedor, backend, conciliação e retenção permanecem decisões pendentes do PRD. |
| Rodada e sigilo da resposta | Decisão bloqueante: modo local protege contra exposição casual, mas não oculta a resposta de quem inspeciona o cliente | Ver seção 13; exigir sigilo real requer avaliação no servidor e conectividade. |

### Stack implementada

- JavaScript ES modules no navegador e Vite para servidor local/build de produção.
- HTML semântico e CSS próprio; sem framework de componentes ou fonte remota.
- `node:test` para testes unitários do domínio.
- Fluxos principais verificados no navegador integrado, inclusive restauração local e viewport de 320 px.

TypeScript, React, testes Playwright automatizados e axe-core podem ser adotados futuramente, mas não fazem parte da implementação atual.

## 3. Arquitetura lógica

Separar o produto em quatro áreas para manter regras consistentes e testáveis:

1. **Apresentação:** componentes de layout, tabuleiro, teclado, controles, status e cartões laterais.
2. **Domínio do jogo:** normalização, validação, avaliação das pistas, regras de dificuldade, transições de estado e resumo de partida.
3. **Aplicação:** inicia rodada, envia tentativa, termina jogo, cria compartilhamento e coordena persistência.
4. **Infraestrutura:** repositório local, banco de palavras versionado e, quando implementado, cliente de sincronização.

### Estrutura implementada

```text
index.html
src/
  app.js
  dictionary.js
  game.js
  storage.js
  styles.css
test/
  game.test.js
```

As regras puras ficam em `game.js`, o vocabulário versionado em `dictionary.js`, o acesso ao IndexedDB em `storage.js` e os eventos/renderização em `app.js`. Manter essas responsabilidades separadas ao ampliar o jogo.

## 4. Interface e relação com o mockup

### 4.1 Estrutura de página

Preservar a hierarquia e o ritmo do mockup UX:

- **Cabeçalho:** marca “entre letras”, subtítulo, indicação de português brasileiro e estado de jogo sem cadastro/no dispositivo.
- **Introdução:** título orientado à descoberta, explicação curta do ciclo e identificador ordinal da rodada. O número da rodada não deve ser usado como identificador do desafio.
- **Área principal:** cartão de jogo com contagem de tentativas, tabuleiro, progresso, controles de apagar/enviar, mensagem de estado e teclado virtual.
- **Coluna de apoio:** guia de pistas, escolha de dificuldade e estatísticas.
- **Faixa inferior:** explicação de continuidade e ação “Nova rodada”.

O mockup mostra conteúdo demonstrativo preenchido. Em produção, a primeira visita deve mostrar instruções e a primeira rodada em estado real; não apresentar tentativas de exemplo como se fossem progresso do jogador. Se um exemplo educativo for mantido, deve ser claramente identificado como demonstração e não alterar estatísticas ou histórico.

### 4.2 Componentes e responsabilidades

| Componente | Responsabilidade |
|---|---|
| `AppHeader` | Marca, idioma, modo de persistência e acesso a instruções/configurações. |
| `IntroPanel` | Explicar rapidamente a proposta e exibir o ordinal local da rodada. |
| `GameCard` | Agrupar o jogo e fornecer o título acessível da região. |
| `GameBoard` | Renderizar seis linhas e cinco posições, com a linha atual editável. |
| `GuessRow` | Apresentar tentativa concluída ou linha em edição, com rótulos acessíveis. |
| `LetterTile` | Mostrar letra e estado por símbolo/estilo/texto acessível. |
| `VirtualKeyboard` | Permitir entrada por toque; refletir a melhor pista conhecida por letra. |
| `ClueLegend` | Explicar posição correta, letra presente em outro local e letra ausente. |
| `DifficultyControl` | Alterar dificuldade apenas antes de começar uma rodada. |
| `StatsCard` | Exibir partidas, vitórias, sequência e distribuição por tentativas. |
| `LiveStatus` | Anunciar validação, pista e encerramento sem mover o foco a cada ação. |
| `NewRoundAction` | Iniciar a próxima rodada quando aplicável e gerenciar o estado sem palavras disponíveis. |

### 4.3 Design tokens

Extrair as cores do CSS do mockup para tokens semânticos. Valores abaixo correspondem à direção visual escolhida; validar contraste na implementação:

```css
:root {
  --color-paper: #f5f1e7;
  --color-paper-deep: #ebe5d7;
  --color-surface: #fffdf8;
  --color-ink: #202e32;
  --color-muted: #687477;
  --color-border: #d9d3c6;
  --color-primary: #126b67;
  --color-exact-bg: #dcece5;
  --color-present-bg: #f7ebc9;
  --color-absent-bg: #f2ded6;
  --color-error: #a3452d;
  --focus-ring: #a54f35;
}
```

- Fundo tipo papel, cartões claros, sombras discretas e cantos arredondados.
- Tipografia de marca/títulos serifada; texto de interface em sans-serif com fallback do sistema.
- Não carregar fontes remotas no MVP; usar fontes locais/sistema para evitar dependência externa e flash tipográfico.
- Estado de pista sempre usa cor **e** símbolo/descrição: ✓ no lugar certo, ↗ presente em outra posição, × ausente. Símbolos não devem ser o único texto acessível.
- Estados desabilitados, erro, foco e hover precisam de tokens próprios e contraste validado.
- Respeitar `prefers-reduced-motion`; animações são decorativas e nunca sinalizam o único feedback.

### 4.4 Layout responsivo

- Largura máxima de conteúdo aproximada de 1160 px, centralizada.
- Desktop: tabuleiro/cartão principal e coluna lateral em grid de duas colunas.
- Tablet e celular: empilhar cartão de jogo e cartões de apoio; manter as pistas e o estado da rodada acessíveis sem navegação oculta.
- Garantir layout a partir de 320 px, sem rolagem horizontal.
- O tabuleiro deve escalar sem reduzir as casas a uma área de toque impraticável; teclado virtual deve permanecer fácil de operar.
- Breakpoints devem ser determinados pelo conteúdo, começando pela transição de duas para uma coluna ao redor de 760 px e validados em dispositivos reais.

## 5. Modelo de domínio

Usar formas normalizadas para comparar letras e preservar as formas originais para exibição.

```ts
type Difficulty = "normal" | "hard";
type LetterMark = "exact" | "present" | "absent";
type RoundStatus = "playing" | "won" | "lost";

interface Guess {
  display: string;
  normalized: string;
  marks: LetterMark[];
  submittedAt: string;
}

interface Round {
  id: string;
  targetId: string;
  targetDisplay: string;
  targetNormalized: string;
  difficulty: Difficulty;
  status: RoundStatus;
  guesses: Guess[];
  currentInput: string;
  dictionaryVersion: string;
  startedAt: string;
  completedAt?: string;
}

interface Statistics {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  distribution: [number, number, number, number, number, number];
  updatedAt: string;
}

interface PlayerProgress {
  schemaVersion: number;
  seenAnswerIds: string[];
  roundCounter: number;
  activeRound?: Round;
  statistics: Statistics;
}
```

`targetDisplay`/`targetNormalized` no cliente implicam que a resposta atual pode ser inspecionada. Se sigilo contra inspeção for obrigatório, mover estado autoritativo da rodada para servidor e não serializar a resposta até o encerramento. Não armazenar tentativas ou histórico individual em analytics por padrão.

### Entrada do banco editorial

```ts
interface WordEntry {
  id: string;
  display: string;
  normalized: string;
  allowedAsAnswer: boolean;
  allowedAsGuess: boolean;
  locale: "pt-BR";
  dictionaryVersion: string;
}
```

- Cada item de resposta precisa ter exatamente cinco letras após normalização.
- Cada `id` é estável entre versões da lista para conservar histórico de não repetição.
- Remover duplicatas pelo valor normalizado e validar colisões antes de publicar.
- Resposta e tentativa aceita são conjuntos distintos; uma entrada pode existir apenas como tentativa.
- O vocabulário pequeno atual é intencional no MVP: 106 respostas elegíveis e um conjunto maior de tentativas. A exaustão e a mensagem correspondente são comportamento esperado, não bloqueio de lançamento desta etapa.
- Manter testes de integridade para tamanho, duplicatas e normalização. A ampliação editorial do banco fica fora do escopo atual.

## 6. Regras do jogo

### 6.1 Normalização e acentos

Implementar função pura e única, usada pela validação, avaliação, comparação de vitória e modo difícil:

1. Aplicar Unicode `NFD`.
2. Remover marcas combinantes Unicode (`\p{M}`), incluindo acentos e cedilha decomposta.
3. Converter para maiúsculas com locale `pt-BR`.
4. Validar que restaram apenas letras do alfabeto latino aceito pelo vocabulário.
5. Contar cinco grafemas/letras, não cinco bytes UTF-8.

Manter `display` em NFC/forma editorial para renderizar a ortografia correta. `ç` normaliza para `C`; `á` para `A`. A regra torna palavras com mesma forma sem acento equivalentes para comparação. Decidir editorialmente como comunicar possíveis colisões entre grafias distintas. Espaços, hífens, números e pontuação devem ser rejeitados no vocabulário MVP.

### 6.2 Avaliação das pistas, inclusive letras repetidas

Adotar algoritmo de duas passagens, padrão consistente e coberto por testes:

1. Inicializar cinco posições como `absent`.
2. Comparar cada posição normalizada; marcar `exact` e reservar a ocorrência correspondente da resposta.
3. Para cada posição ainda não exata, da esquerda para a direita, marcar `present` somente se houver uma ocorrência restante da mesma letra na resposta; consumir essa ocorrência.
4. As demais posições permanecem `absent`.

Essa ordem garante que acertos exatos tenham prioridade e que o total de letras presentes nunca exceda a quantidade existente na resposta.

### 6.3 Validação de tentativa

Validar em ordem, sem alterar a rodada até todos os passos passarem:

1. Rodada está em `playing`.
2. Entrada tem exatamente cinco letras após normalização.
3. Tentativa consta no conjunto `allowedAsGuess` para a versão ativa do vocabulário.
4. Se modo difícil, respeita todas as pistas acumuladas.
5. Só então registrar a tentativa, limpar a entrada atual e revelar as marcas.

Tentativa incompleta, desconhecida ou inválida no modo difícil não consome uma das seis chances. Informar o motivo na região de status; preservar as letras digitadas para correção, exceto quando a ação explícita de apagar for usada.

### 6.4 Modo difícil

- Fixar nas posições conhecidas todas as letras marcadas como `exact`.
- Exigir pelo menos a quantidade mínima de ocorrências já demonstrada como presente/exata para cada letra.
- Excluir uma letra/posição marcada como presente apenas se o comportamento de produto for deliberadamente definido e comunicado; o PRD exige manter letras e posições exatas, mas não detalha todas as deduções negativas. Por padrão do MVP, não impor restrições adicionais de posição para marcas `present`.
- Somar ocorrências reveladas por tentativa e usar o máximo de mínimo comprovado por letra, levando em conta as marcas `absent` quando uma tentativa prova um limite superior de repetição.
- Congelar a dificuldade ao iniciar a rodada. Não permitir alternar de modo para contornar restrições durante a partida.

As restrições para repetições e letras ausentes devem ser expressas por testes de tabela e aprovadas pelo responsável de produto antes do lançamento.

### 6.5 Ciclo de vida da rodada

```text
ready -> playing -> won
                 -> lost
                 -> unavailable (não há resposta inédita)
```

- Uma vitória ocorre quando tentativa normalizada equivale à resposta normalizada.
- Derrota ocorre ao registrar a sexta tentativa válida sem acerto.
- Apenas transições para `won` ou `lost` atualizam estatísticas, uma única vez.
- Partidas finalizadas são imutáveis; nova rodada cria outro `id`.
- Recarregar a página restaura uma rodada ativa e não a conta como nova.
- A ação “Nova rodada” não inicia duplicatas por duplo clique; desabilitar/serializar enquanto a seleção é persistida.
- Quando todas as respostas disponíveis forem conhecidas, mostrar a mensagem de esgotamento definida pelo PRD; não reciclar silenciosamente palavras já vistas.

## 7. Estado, teclado e acessibilidade

### 7.1 Modelo de estado

O estado visual é uma projeção de `Round` e `PlayerProgress`. Atualizar por ações explícitas, por exemplo:

```ts
type GameAction =
  | { type: "LETTER_ADDED"; letter: string }
  | { type: "LETTER_REMOVED" }
  | { type: "GUESS_SUBMITTED"; guess: Guess }
  | { type: "ROUND_WON"; completedAt: string }
  | { type: "ROUND_LOST"; completedAt: string }
  | { type: "ROUND_STARTED"; round: Round }
  | { type: "PERSISTENCE_RESTORED"; progress: PlayerProgress };
```

Não permitir que componente de tile ou teclado mutile diretamente arrays de tentativas/estatísticas.

### 7.2 Entrada por teclado

- Teclado físico: aceitar letras sem modificador; `Enter` envia; `Backspace` apaga uma letra.
- Ignorar teclas quando foco estiver em botão/campo editável alheio ao jogo, quando existir diálogo aberto ou quando a rodada estiver encerrada.
- Teclado virtual: mesma ação de domínio que o teclado físico.
- Aceitar entrada acentuada de IME/composição quando aplicável; a normalização remove diacríticos para regras, preservando a apresentação da grafia digitada/validada.
- Não converter teclas desconhecidas em entradas silenciosamente.
- Foco sempre visível; controles utilizáveis sem mouse.

### 7.3 Semântica assistiva

- `main`, regiões com nomes acessíveis e títulos hierárquicos.
- Tabuleiro como tabela estruturada (`table`, `row`, `cell`), com rótulos por casa (“X, no lugar certo”, “espaço N vazio”).
- A linha atual precisa de instrução clara de entrada.
- Botões de tecla usam nomes compreensíveis (“Digitar A”, “Apagar letra”, “Enviar tentativa”).
- Área de status com `role="status"`/`aria-live="polite"` para feedback e resultado de uma tentativa; o anúncio inclui letra, posição e pista de cada casa. Erros urgentes não devem duplicar o anúncio.
- Pistas não dependem apenas da paleta: ✓ exato, ↗ presente em outro lugar, × ausente, além do nome acessível.
- Ao fim da partida, anunciar o resultado e mover foco de modo previsível para o título/ação relevante, sem prender a navegação.
- Gráficos de estatística devem oferecer descrição textual equivalente.
- Respeitar zoom do navegador, contraste e preferência por movimento reduzido.
- Meta de conformidade: WCAG 2.2 AA; requer testes automáticos e manuais, não apenas axe.

## 8. Persistência e atualização de dados

### 8.1 Persistência local

Usar IndexedDB como fonte persistente para progresso do jogador:

- `progress`: um registro local, contendo versão de schema, contador, estatísticas e preferências.
- `rounds`: rodadas recentes/finalizadas, se o produto precisar de histórico além de agregados.
- `seenAnswers`: IDs estáveis de respostas apresentadas.

Usar transação IndexedDB para salvar conjuntamente a finalização da rodada, a resposta marcada como vista e a atualização de estatísticas. Isso evita registrar uma vitória sem histórico (ou vice-versa) em falha de escrita.

Cada gravação verifica, na mesma transação read/write, a revisão lida quando a aba iniciou sua atualização. Em caso de conflito, não sobrescrever o valor mais novo: bloquear novas ações na aba desatualizada e orientar a pessoa a recarregar.

- Salvar a rodada ativa após cada tentativa aceita e após alterações de entrada com debounce de 250 ms; ao reabrir, restaurar sem incrementar partidas.
- Tratar indisponibilidade/quota de armazenamento: continuar a rodada em memória, avisar que a persistência falhou e não afirmar que progresso foi guardado.
- Validar dados lidos; se inválidos, não falhar silenciosamente nem sobrescrever a cópia sem tentar recuperação. Informar erro e oferecer começar uma sessão limpa mantendo backup recuperável quando possível.
- Preferências pequenas (como modo de contraste) podem ficar em localStorage; não duplicar autoridade entre storages.
- Exibir a indicação “no seu dispositivo” apenas quando o estado está efetivamente persistido localmente.

### 8.2 Sorteio sem repetição

1. Carregar respostas elegíveis da versão atual.
2. Selecionar respostas cujos `id`s não estejam em `seenAnswers`.
3. Se conjunto vazio, apresentar estado `unavailable`.
4. Escolher um índice uniforme com `crypto.getRandomValues`, ou embaralhar um conjunto e persistir sua ordem/posição para seleção sem repetição.
5. Persistir a resposta como usada de forma atômica com a criação da rodada, para evitar repetição em reload/duplo clique.
6. Ao carregar uma versão nova do vocabulário, adicionar respostas novas sem limpar IDs vistos ou estatísticas.

O requisito é não repetir até esgotar o conjunto ativo. Mudanças em resposta/ID devem ter revisão editorial e migração associada.

### 8.3 Migrações

- `schemaVersion` deve ser inteiro crescente.
- Cada migração precisa ter teste para dados de entrada de versões suportadas.
- Não apagar estatísticas durante atualização do app.
- Se uma rodada ativa tiver `targetId` removido do banco, permitir terminá-la usando snapshot mínimo da versão anterior ou oferecer resolução explícita; nunca substituir silenciosamente a resposta.

## 9. Persistência de conta e sincronização futura

Login e estratégia de sincronização não foram decididos no PRD. Não acoplar o jogo local a um provedor específico.

Para habilitar a funcionalidade depois:

- definir fornecedor de autenticação, API, formato de identidade e política de logout;
- sincronizar apenas após consentimento/autenticação;
- estabelecer como mesclar estatísticas (por exemplo, unir partidas por `roundId`, não somar snapshots repetidos);
- definir se histórico de respostas vistas sincroniza e como evitar duplicações entre dispositivos;
- tratar falhas mostrando claramente o estado pendente e conservando dados locais;
- oferecer exportação/exclusão conforme política de privacidade e requisitos legais aplicáveis.

Uma conta não deve ser requisito para jogar, iniciar rodada ou compartilhar. Não inventar sincronização apenas como botão visual.

## 10. Compartilhamento de resultado

Implementar após a rodada terminar:

- Construir texto local com marca/ordinal, resultado (“X/6” ou indicação de derrota) e sequência de símbolos de estado por linha.
- Não incluir a palavra-alvo, as letras tentadas, o identificador da resposta, token ou URL que exponha segredo.
- Não copiar tentativas inválidas.
- Usar `navigator.clipboard.writeText` quando disponível e autorizado; capturar falha para mostrar mensagem explícita.
- Fornecer alternativa acessível para selecionar/copiar texto se Clipboard API falhar.
- Não publicar automaticamente nem exigir login/rede social.
- Testar que o payload não contém `targetDisplay`, `targetNormalized` ou guesses.

## 11. Falhas e mensagens

| Situação | Comportamento esperado |
|---|---|
| Entrada com menos/mais de cinco letras | Informar o comprimento exigido; não consumir tentativa. |
| Palavra não reconhecida | Informar que não está no vocabulário; preservar entrada; não consumir tentativa. |
| Regra do modo difícil violada | Explicar a restrição infringida e preservar entrada. |
| Persistência falha | Continuar em memória, avisar que o progresso pode não sobreviver ao reload. |
| Vocabulário ausente/corrompido | Mostrar erro recuperável, não criar resposta inválida nem declarar sucesso. |
| Sem respostas inéditas | Mostrar aviso de banco esgotado e não gerar repetição. |
| Clipboard indisponível/falha | Mostrar alternativa e não confirmar cópia sem sucesso. |
| Dados locais incompatíveis | Informar erro de recuperação, preservar original e oferecer reinício explícito. |

Não usar `catch` abrangente que converta falhas em resposta vazia, estatísticas zeradas ou partida concluída. Erros inesperados devem ser registrados sem dados pessoais ou conteúdo das tentativas.

## 12. Segurança e privacidade

- Sem conta, gerar e manter o estado local; não enviar tentativas para analytics no padrão.
- Não armazenar dados pessoais no progresso local.
- Não inserir resposta futura em URL, HTML estático acessível antes do jogo, logs de produção ou evento de analytics.
- Codificar/renderizar texto do vocabulário como texto, sem `innerHTML`.
- Validar dados locais como entrada não confiável; limitar tamanho, schema e enumerações.
- CSP restritiva e dependências reduzidas para a versão web.
- A sincronização futura deve usar HTTPS, autenticação e autorização no servidor, limites de requisição e política de retenção documentada.
- Um bundle entregue ao navegador pode ser inspecionado. Hash, minificação ou ofuscação não tornam respostas secretas.

Ver decisão de sigilo na seção 13 antes de publicar um banco de respostas real.

## 13. Decisões de produto/arquitetura que bloqueiam a implementação

### 13.1 Sigilo das respostas vs jogo local

O PRD pede que respostas futuras não sejam expostas, mas também prevê jogo sem conta e progresso local. Se todo o banco e a resposta ativa forem entregues ao navegador para validar tentativas offline, uma pessoa tecnicamente experiente consegue encontrá-los. Isso não pode ser resolvido por ofuscação.

**Opção recomendada para o primeiro MVP:** aceitar que o modo local oferece proteção contra exposição acidental, não contra inspeção do cliente; não anunciar sigilo forte. O jogo opera sem conta e sem enviar tentativas a um servidor.

**Alternativa se sigilo real for requisito de lançamento:** rodadas anônimas autoritativas no servidor. O servidor cria uma rodada e retorna um `roundId` opaco, recebe as tentativas e devolve apenas marcas; revela a resposta quando a rodada termina. Essa alternativa requer conexão e envia tentativas ao serviço. A interface precisa declarar esse tratamento, e o produto precisa aprovar privacidade, retenção e disponibilidade.

Não implementar ambas as promessas ao mesmo tempo sem decisão explícita. O modo local deve ser favorecido para alinhar-se à UX e à privacidade do PRD, salvo decisão de produto em contrário.

### 13.2 Outros itens a decidir antes do lançamento

1. Definir se a stack JavaScript atual deve migrar para TypeScript/React antes de ampliar a aplicação.
2. Manter a lista pequena aprovada para o MVP; mudanças editoriais futuras devem preservar testes de integridade do vocabulário `pt-BR`.
3. Aprovar algoritmo de letras repetidas e limites de dedução do modo difícil.
4. Definir se escolher dificuldade inicia automaticamente uma partida ou exige ação “Começar”.
5. Definir se o usuário pode abandonar uma rodada ativa e como isso afeta contagem/estatísticas.
6. Aprovar conteúdo e distribuição de dados do compartilhamento.
7. Definir armazenamento de histórico completo versus apenas agregado.
8. Definir metas quantitativas de desempenho e indicadores de sucesso.
9. Se sincronização estiver no MVP, selecionar autenticação, serviço e regra de conciliação.
10. Decidir o comportamento educativo de primeira visita: instruções resumidas ou exemplo jogável separado.

## 14. Plano de testes

### 14.1 Testes unitários de domínio

- Normalização: maiúsculas/minúsculas, formas Unicode NFC/NFD, `á`, `ç`, `ã`, caracteres inválidos e contagem por letra.
- Avaliação de pista: letra exata, presente, ausente e combinações de repetição.
- Vitória independente da grafia/acento quando a forma normalizada coincide.
- Tentativas de tamanho incorreto/desconhecidas não alteram número de chances.
- Modo difícil com letras fixas, ocorrências mínimas e casos de duplicação.
- Limite de seis tentativas e atualização de estatísticas exatamente uma vez.
- Sorteio uniforme operacional, não repetição, esgotamento e adição de nova versão editorial.

### 14.2 Testes de persistência

- Abrir uma rodada, recarregar e continuar sem perda.
- Falha de escrita/quota informa persistência degradada.
- Duplo clique/reload não consome duas respostas.
- Migração preserva estatísticas, histórico e partida ativa.
- Dados corrompidos não são tratados como estatísticas vazias sem aviso.

### 14.3 Testes de integração e ponta a ponta

- Primeiro acesso, instruções, tentativa válida, vitória, derrota e nova rodada.
- Teclado físico e virtual produzem o mesmo resultado.
- Mensagens de erro mantêm entrada e não consomem tentativa.
- Modo difícil impede tentativa incompatível e preserva rodada.
- Compartilhamento não revela palavra e mostra estado real de cópia.
- Esgotamento informa indisponibilidade e não repete palavra.
- Viewports de 320 px, tablet e desktop sem rolagem horizontal inesperada.

### 14.4 Acessibilidade

- axe-core em telas inicial, em andamento, erro, vitória e derrota.
- Navegação integral por Tab/Shift+Tab/Enter/Espaço e teclado do jogo.
- Teste manual com leitores de tela representativos (NVDA/Firefox e VoiceOver/Safari, conforme disponibilidade).
- Contraste medido em texto, estado de pista, controles, foco e disabled.
- Zoom a 200% e movimento reduzido.
- Acessibilidade do teclado virtual e anúncios live sem repetição excessiva.

## 15. Observabilidade e critérios de entrega

- Erros técnicos sem palavras tentadas ou respostas em logs.
- Métricas de uso são opt-in/compatíveis com política de privacidade e não armazenam conteúdo digitado.
- Registrar versão da aplicação, versão de schema local e versão do dicionário para suporte técnico.
- Critérios do PRD devem ser reproduzidos como testes automatizados, incluindo responsividade, persistência, acessibilidade e ausência de repetição.

### Pronto para lançamento quando

- Todos os critérios de aceitação do PRD aplicáveis estiverem cobertos por testes.
- Banco de palavras estiver revisado, normalizado, sem colisões e com versão.
- Decisão sobre sigilo/servidor estiver aprovada e refletida na comunicação de privacidade.
- Fluxos de falha e recuperação tiverem validação manual.
- WCAG 2.2 AA tiver sido avaliada com automação e testes humanos.
- Build de produção não incluir palavras não necessárias ao vocabulário ativo nem respostas de demonstração.

## 16. Relação com o PRD e ressalvas

Esta especificação detalha o design UX escolhido e propõe uma arquitetura, mas não substitui decisões de produto registradas como pendentes no [PRD.md](./PRD.md). Em particular, vocabulário, sincronização, métricas, repetição de letras e proteção contra inspeção do banco ainda precisam de aprovação. A interface deve manter a identidade visual do [mockup-ux.html](./mockup-ux.html), mas o comportamento do protótipo não deve ser considerado contrato de produção quando diferir dos requisitos acima.
