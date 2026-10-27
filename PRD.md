# PRD — Jogo casual de adivinhação de palavras

**Status:** Rascunho inicial  
**Versão:** 0.1  
**Data:** 13 de outubro de 2026  
**Plataforma inicial:** Web responsiva  
**Idioma inicial:** Português do Brasil

## 1. Resumo do produto

Um jogo casual para navegador em que a pessoa tenta descobrir uma palavra brasileira de cinco letras em até seis tentativas. Depois de cada tentativa, recebe pistas sobre quais letras estão na palavra e quais estão na posição correta. As partidas são ilimitadas, e o sorteio evita repetir palavras para a mesma pessoa até que o conjunto disponível se esgote.

O jogo deve ser simples de começar, funcionar bem em celulares e computadores, ser acessível sem depender exclusivamente de cores e permitir que a pessoa jogue sem criar uma conta. Uma conta opcional permite sincronizar estatísticas entre dispositivos.

**Escopo do MVP:** manter intencionalmente um vocabulário pequeno. O jogo deve informar quando a pessoa já encontrou todas as respostas disponíveis; ampliar o banco não é requisito para esta etapa.

## 2. Problema e oportunidade

Jogadores casuais precisam conseguir entender e iniciar uma rodada rapidamente, sem uma barreira de cadastro ou regras extensas. Em um jogo de palavras, pistas pouco claras e respostas excessivamente raras podem fazer a resolução parecer aleatória. O produto deve equilibrar desafio, vocabulário familiar e uma experiência inclusiva.

O formato de tentativas com pistas foi popularizado por jogos como Wordle. Este produto adota o ciclo de dedução como referência, mas prioriza partidas ilimitadas, vocabulário em português brasileiro e prevenção de repetição por jogador.

## 3. Público-alvo

- Pessoas que jogam casualmente no navegador.
- Falantes de português brasileiro, incluindo pessoas que usam celular como dispositivo principal.
- Pessoas com daltonismo ou que usam leitores de tela.

## 4. Objetivos

1. Permitir que uma pessoa comece uma partida sem cadastro.
2. Oferecer um ciclo de jogo curto, compreensível e justo.
3. Evitar respostas obscuras e repetição de palavras enquanto houver palavras inéditas disponíveis.
4. Permitir acompanhar estatísticas e compartilhar o resultado sem expor a resposta.
5. Disponibilizar as pistas de forma acessível, não apenas por cor.

### Indicadores de sucesso a definir

- Percentual de visitantes que iniciam a primeira rodada.
- Percentual de rodadas concluídas com acerto.
- Número de rodadas por jogador e retorno ao jogo.
- Uso do compartilhamento de resultados.
- Erros reportados no teclado, validação de palavras e tecnologia assistiva.

Metas numéricas, janela de avaliação e ferramenta de analytics ainda precisam ser definidas. A coleta deve respeitar a política de privacidade e não registrar tentativas de modo identificável sem necessidade.

## 5. Não objetivos do MVP

- Aplicativos nativos para Android ou iOS.
- Ranking público, competição com amigos ou partidas multiplayer.
- Monetização, anúncios ou assinatura.
- Campanhas, níveis ou categorias temáticas.
- Idiomas além do português brasileiro.
- Desafio diário como modo principal.

## 6. Experiência principal

1. A pessoa abre o site e vê instruções resumidas.
2. A pessoa inicia uma partida sem precisar criar uma conta.
3. O jogo sorteia uma palavra-alvo de cinco letras ainda não apresentada àquela pessoa.
4. A pessoa digita uma tentativa e envia.
5. O jogo valida a tentativa e apresenta pistas por letra.
6. A pessoa continua até acertar ou usar as seis tentativas.
7. Ao terminar, o jogo revela a resposta, atualiza as estatísticas e oferece compartilhamento sem revelar a palavra.
8. A pessoa pode iniciar outra partida imediatamente.

## 7. Requisitos funcionais

### 7.1 Partida e tentativas

- **FR-01:** O jogo deve oferecer partidas ilimitadas enquanto houver palavras inéditas disponíveis para a pessoa.
- **FR-02:** Cada palavra-alvo deve ter cinco letras, considerando a forma normalizada descrita em “Língua e vocabulário”.
- **FR-03:** Cada partida deve permitir até seis tentativas válidas.
- **FR-04:** Uma tentativa só deve consumir uma chance quando for válida e enviada.
- **FR-05:** O jogo deve permitir inserir letras por teclado físico e por teclado na interface.
- **FR-06:** O jogo deve apresentar feedback claro para tentativa incompleta, palavra não reconhecida e rodada concluída.
- **FR-07:** Depois de uma vitória ou derrota, a pessoa deve poder ver a palavra correta e iniciar outra rodada.
- **FR-08:** A página deve explicar brevemente as regras antes da primeira partida. O conteúdo deve poder ser consultado novamente.

### 7.2 Regras das pistas

Para cada posição da tentativa:

- **Letra na posição correta:** indicar que a letra existe e está na posição correta.
- **Letra na palavra, mas em outra posição:** indicar que a letra existe, mas está em outra posição.
- **Letra ausente:** indicar que a letra não ocorre na resposta, respeitando o tratamento de letras repetidas.

As pistas devem ser comunicadas com cores e também com texto, ícones ou outro sinal não cromático. O teclado na tela deve refletir as melhores pistas conhecidas para cada letra.

**Regra pendente de especificação:** definir formalmente como calcular pistas quando a tentativa ou a resposta contém letras repetidas. A mesma regra deve ser usada no tabuleiro, no teclado, no leitor de tela e no resultado compartilhado.

### 7.3 Dificuldade

- **FR-09:** O modo normal deve ser a opção padrão.
- **FR-10:** Deve haver uma opção de modo difícil.
- **FR-11:** No modo difícil, a pessoa deve usar nas tentativas seguintes as pistas já reveladas: letras confirmadas devem permanecer nas posições corretas e letras presentes devem continuar incluídas.
- A regra exata para letras repetidas no modo difícil deve seguir a regra de pistas definida antes do lançamento.
- A escolha de dificuldade deve ser apresentada antes de começar a partida e mantida durante toda a rodada.

### 7.4 Língua e vocabulário

- **FR-12:** A comparação de letras deve ignorar diacríticos: por exemplo, `á` deve ser comparado como `a`, e `ç` como `c`.
- **FR-13:** A resposta revelada deve preservar sua grafia correta em português.
- **FR-14:** A lista de respostas deve priorizar palavras comuns do português brasileiro e excluir nomes próprios, siglas e formas muito raras.
- **FR-15:** O sistema deve distinguir o conjunto de respostas possíveis do conjunto de tentativas aceitas. Uma palavra pode ser aceita como tentativa sem poder ser sorteada como resposta.
- **FR-16:** A validação de tentativas deve informar quando uma palavra não pertence ao vocabulário aceito, sem consumir uma chance.
- **FR-17:** O banco de palavras deve ser revisável e atualizável sem alterar as regras do jogo.

O processo para classificar frequência, flexões aceitas, variantes regionais, empréstimos e formas verbais precisa ser definido editorialmente. A lista deve ser revisada antes de ser disponibilizada.

### 7.5 Sorteio e repetição

- **FR-18:** O sorteio deve evitar repetir respostas já apresentadas à mesma pessoa enquanto houver respostas inéditas disponíveis.
- **FR-19:** O histórico de palavras apresentadas deve ser mantido localmente para quem joga sem conta e associado à conta para quem opta pela sincronização.
- **FR-20:** Quando todas as palavras disponíveis já tiverem sido apresentadas, o jogo deve informar que não há palavras inéditas e que uma atualização do banco é necessária.
- **FR-21:** O jogo não deve reiniciar silenciosamente a lista nem voltar a sortear respostas usadas após o esgotamento.
- **FR-22:** Ao receber novas palavras, o jogo deve disponibilizá-las para partidas futuras sem apagar as estatísticas existentes.

### 7.6 Estatísticas

- **FR-23:** Ao final da partida, atualizar estatísticas pessoais, incluindo ao menos partidas jogadas, vitórias e distribuição de vitórias por número de tentativas.
- **FR-24:** As estatísticas devem funcionar sem conta e permanecer no dispositivo.
- **FR-25:** Para quem criar uma conta, oferecer sincronização de estatísticas entre dispositivos.
- **FR-26:** Ao entrar em uma conta com estatísticas locais, o produto deve definir e comunicar como os dados locais e remotos serão conciliados antes de executar essa operação.

Definição pendente: formato de cadastro, provedor de autenticação, estratégia de conciliação e se o histórico de palavras também será sincronizado, além das estatísticas.

### 7.7 Compartilhamento

- **FR-27:** Depois de concluir uma partida, oferecer uma representação compacta do resultado que não revele a palavra nem permita deduzi-la diretamente.
- **FR-28:** O resultado compartilhado deve indicar, no mínimo, o número de tentativas usadas ou uma indicação de derrota.
- **FR-29:** Oferecer cópia do resultado para a área de transferência e apresentar confirmação de sucesso ou falha.
- **FR-30:** O compartilhamento deve funcionar sem exigir conta ou publicação em uma rede social específica.

### 7.8 Acessibilidade e interface

- **FR-31:** A experiência deve funcionar em telas pequenas e grandes, sem perda de conteúdo ou funcionalidades essenciais.
- **FR-32:** Todas as informações de pista devem estar disponíveis a leitores de tela, incluindo mudanças após o envio de uma tentativa.
- **FR-33:** Oferecer uma apresentação alternativa das pistas para pessoas com daltonismo.
- **FR-34:** Permitir operação por teclado, com foco visível e ordem de navegação coerente.
- **FR-35:** A interface deve comunicar estados de erro, sucesso e fim da partida sem depender apenas de animação, cor ou som.

Meta recomendada: buscar conformidade WCAG 2.2 nível AA nas telas do jogo. A conformidade deve ser validada com ferramentas automatizadas e testes manuais com teclado e leitor de tela.

## 8. Requisitos não funcionais

- **Desempenho:** a tela inicial e as interações centrais devem responder com rapidez em conexões móveis comuns; metas mensuráveis de carregamento ainda precisam ser definidas.
- **Privacidade:** jogar sem conta não deve exigir identificação pessoal. Explicar de forma transparente quais dados são armazenados localmente e quais são sincronizados.
- **Segurança:** proteger credenciais e dados de conta; não expor respostas futuras nem a lista interna de respostas antes do término da partida.
- **Compatibilidade:** suportar navegadores modernos em celular e computador. A matriz de versões suportadas deve ser decidida antes do lançamento.
- **Resiliência:** informar erros de carregamento, sincronização ou cópia sem apresentar um estado de sucesso falso. A partida em andamento não deve ser perdida por uma falha transitória de sincronização.
- **Manutenção do conteúdo:** permitir atualização controlada da lista de palavras e registrar a versão do banco usada em cada partida.

## 9. Dados e persistência

### Sem conta

- Guardar no dispositivo o progresso e as estatísticas necessárias para evitar repetição.
- Informar que limpar os dados do navegador ou trocar de dispositivo pode apagar esse progresso.
- Não exigir envio de dados de jogo para um servidor para iniciar uma partida.

### Com conta opcional

- Sincronizar estatísticas entre dispositivos após autenticação.
- Definir consentimento, retenção, exclusão e conciliação de dados antes da implementação.
- Não tornar cadastro obrigatório para jogar ou compartilhar.

## 10. Critérios de aceitação do MVP

1. Uma pessoa consegue iniciar e concluir uma rodada sem cadastro, em celular e computador.
2. A rodada tem uma resposta de cinco letras e no máximo seis tentativas válidas.
3. Uma tentativa incompleta ou não reconhecida não consome uma chance.
4. A comparação trata acentos e cedilha de forma consistente com as regras definidas e a resposta final mostra a grafia correta.
5. As pistas são compreensíveis sem depender apenas das cores e são anunciadas por leitores de tela.
6. O modo normal e o modo difícil aplicam suas regras de forma consistente.
7. A mesma resposta não é sorteada novamente para a pessoa antes do esgotamento do conjunto disponível.
8. Ao esgotar o conjunto, a pessoa recebe uma mensagem explícita e não recebe uma palavra repetida.
9. As estatísticas pessoais são atualizadas após a conclusão e persistem sem conta.
10. Uma pessoa com conta pode consultar estatísticas sincronizadas em outro dispositivo, sem perder dados silenciosamente.
11. O resultado pode ser copiado sem revelar a resposta, e a interface informa se a cópia falhar.
12. É possível completar o ciclo principal usando apenas teclado.

## 11. Riscos e decisões pendentes

| Tema | Risco ou questão | Próximo passo |
|---|---|---|
| Vocabulário | “Palavra comum” é subjetivo; flexões e variantes regionais podem causar frustração. | Definir política editorial, fontes e processo de revisão do banco. |
| Acentos | Comparar formas normalizadas pode fazer palavras diferentes parecerem iguais na grade. | Definir como normalização afeta pistas visuais e entradas aceitas. |
| Letras repetidas | Pistas inconsistentes comprometem dedução, modo difícil e acessibilidade. | Especificar e testar a regra antes de implementar. |
| Esgotamento | O vocabulário pequeno pode ser esgotado por quem jogar com frequência. | Comportamento aceito no MVP: informar o esgotamento e aguardar futura atualização do banco. |
| Sincronização | Mesclar progresso local com conta pode gerar duplicação ou perda de dados. | Definir modelo de dados, autenticação e política de conciliação. |
| Métricas | Sem metas, não é possível avaliar objetivamente o sucesso do MVP. | Definir metas, janela de medição e abordagem de analytics com privacidade. |
| Compatibilidade | Navegadores e versões suportados ainda não foram especificados. | Estabelecer matriz de suporte antes dos testes de lançamento. |

## 12. Referências de pesquisa

- [Wordle — The New York Times](https://www.nytimes.com/games/wordle/index.html)
- [Wordle — histórico, formato diário e compartilhamento](https://en.wikipedia.org/wiki/Wordle)

As referências servem como contexto para o gênero e não implicam cópia de marca, conteúdo, interface ou regras específicas.
