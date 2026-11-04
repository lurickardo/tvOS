# Padrões de projeto para o tvOS

## Conteúdo
- Quando usar um padrão
- Padrões que valem numa UI de TV
- SOLID sem cerimônia
- Cheiros de código e o que fazer
- Checklist de revisão

## Quando usar um padrão

Padrão resolve um problema que **já existe** no código, não um que talvez apareça. Sinal de que
cabe: a mesma forma de `if/switch` se repete em 3+ lugares, ou trocar uma peça (fonte de dados,
plataforma) exige mexer em muitos arquivos. Sinal de que não cabe: só há um caso, ou o padrão tem
mais linhas que o problema.

## Padrões que valem numa UI de TV

| Padrão | Problema no tvOS | Forma mínima |
|---|---|---|
| **Máquina de estados** | telas, overlays, player (carregando → tocando → pausado → erro) e foco com regras de transição | objeto `estado → { evento → próximoEstado }`; lib só se o grafo crescer muito |
| **Gerenciador de foco** (mediator) | quem recebe a seta, foco entre regiões (menu ↔ grade), restaurar foco ao voltar | um módulo dono do foco atual; componentes registram regiões, não decidem sozinhos |
| **Pilha de navegação** | Voltar (461) desfaz a última tela/overlay; raiz sai do app | array de telas; `push`/`pop`; foco salvo por tela |
| **Command / mapa de teclas** | keyCodes espalhados em `switch` por tela | `const KEYS = { BACK: 461, OK: 13, … }` + mapa `tecla → ação` por contexto |
| **Observer / event bus** | eventos do sistema (`cursorStateChange`, rede, visibilidade) para várias telas | `EventTarget` nativo; cada inscrição devolve `unsubscribe` |
| **Adapter** | API do webOS, navegador do PC e testes oferecem coisas diferentes | um módulo `platform` com a mesma interface; implementação real + fake para dev/teste — **só** quando houver de fato duas |
| **Repository** | origem do dado (rede, cache, storage) não deve vazar para a UI | funções `getX/saveX` que escondem `fetch`/`localStorage` |
| **Strategy** | mesma ação com variações reais (layout de grade por tipo de conteúdo) | mapa `tipo → função`; nada de hierarquia de classes |
| **Composição** | componentes que crescem com flags booleanas | componha peças pequenas em vez de `<Card isBig isHero withX>` |

Evite por padrão: singleton escondido (estado global implícito), herança profunda, factory de um
produto só, DI container, "manager" genérico que faz tudo.

## SOLID sem cerimônia

- **S** — um módulo muda por um motivo (foco ≠ fetch ≠ render).
- **O** — estender por mapa/composição (nova tecla = nova entrada no mapa), não editando `switch`
  gigante. Não crie ponto de extensão antes do segundo caso.
- **L** — fake e real do adapter se comportam igual nos contratos usados.
- **I** — dependa de funções pequenas, não de um objeto-deus.
- **D** — UI depende de `platform`/repository, não de `webOS.service.request` direto.

## Cheiros de código e o que fazer

| Cheiro | Ação |
|---|---|
| Função > ~40 linhas ou com vários níveis de `if` | extrair funções com nome de intenção; retorno antecipado |
| Mesmo trecho em 3+ lugares | extrair; em 2, geralmente deixe |
| Flag booleana mudando o comportamento todo | duas funções/componentes |
| Número mágico (461, 1920, 300) | constante nomeada |
| Comentário explicando o quê | renomear até o comentário sobrar |
| `catch {}` vazio, promise sem `catch` | tratar na borda ou propagar |
| Listener/timer sem cleanup | cleanup no desmontar |
| Dependência para algo de 10 linhas | escrever as 10 linhas |

## Checklist de revisão

1. Precisava existir? Reusou o que havia?
2. Fronteiras: UI não fala direto com rede/plataforma?
3. Erros de rede/storage/parse tratados com saída para o usuário?
4. Funciona só com setas + OK + Voltar? Foco visível e restaurado ao voltar?
5. Roda no Chromium 53 (transpile/polyfill provado pelo build)?
6. Sem vazamento (listener, timer, imagem, player)?
7. Lógica não trivial tem um teste pequeno?
