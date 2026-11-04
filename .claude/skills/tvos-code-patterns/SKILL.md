---
name: tvos-code-patterns
description: >-
  Boas práticas de código e padrões de projeto do tvOS: escada do minimalismo (YAGNI → reuso →
  stdlib → plataforma nativa → dependência existente → código novo mínimo), organização por
  feature com camadas e fronteiras, nomes, funções pequenas, imutabilidade, tratamento de erro na
  borda, tipagem estrita, testes do que tem lógica, padrões de projeto que valem numa UI de TV
  (máquina de estados de foco/telas, observer/event bus, command para teclas, adapter para APIs do
  webOS, strategy, repository) e quando NÃO usar padrão, orçamento de performance em TV (bundle,
  memória, animação, timers e listeners vazando), TypeScript com lib ES2016 para o
  Chromium 53 e estrutura src/features + src/platform + service. Acione ao
  escrever, refatorar ou revisar código, criar módulo/componente/serviço, escolher lib ou padrão,
  e em dúvidas como "onde coloco isso?", "precisa de abstração?", "qual padrão uso?", "isso está
  over-engineered?", "por que a TV está lenta?". Segurança fica em tvos-security; plataforma em
  tvos-context.
---

# tvOS — Boas práticas e padrões de projeto

> **Regra de ouro:** a melhor linha é a que não foi escrita. Entenda o problema e o fluxo inteiro
> primeiro; depois suba a escada e pare no primeiro degrau que resolve. Código simples e chato
> vence código esperto — quem lê às 3 h da manhã agradece.

## Escada do minimalismo (antes de escrever)

1. **Precisa existir?** Necessidade especulativa → não faça; diga em uma linha.
2. **Já existe no repo?** Componente, helper, tipo, padrão do módulo vizinho → reuse.
3. **Stdlib resolve?** Use.
4. **Plataforma nativa resolve?** HTML/CSS antes de JS; API do navegador antes de lib.
5. **Dependência já instalada resolve?** Use. Nunca adicione lib para o que poucas linhas fazem.
6. **Só então** o mínimo de código que funciona.

Atalho consciente leva comentário `ponytail:` dizendo o teto e o caminho de evolução
(`// ponytail: busca linear; índice por id se a lista passar de ~1k`).

## Regras de implementação

1. **Por feature, não por tipo** (ADR 0003). `src/features/<feature>/` com o que a feature usa
   (`api.ts`, estado, render); `src/platform/` fala com a TV (`luna.ts`); compartilhado nunca
   importa de feature; feature fala com outra só pelo que ela exporta. `service/` é o JS service
   (ES5, Node 0.12). Molde atual: `src/features/system/` (`fps.ts`, `metrics.ts`).
2. **Fronteiras explícitas.** UI ↔ estado ↔ serviços ↔ plataforma (webOS/rede/storage). UI não
   chama `fetch` nem API do webOS direto; passa por um módulo que dá para trocar/simular.
3. **Nomes dizem intenção** (`focusNextTile`, não `handle2`). Inglês no código, pt-BR na UI.
4. **Funções pequenas, um nível de abstração cada.** Retorno antecipado em vez de `if` aninhado.
5. **Imutável por padrão**; mutação só local e óbvia. Estado global só com motivo (foco, sessão).
6. **Erro tratado na borda** (rede, storage, API do sistema, parse) com mensagem pt-BR para o
   usuário e log técnico; nada de `catch {}` silencioso. Falha nunca deixa a tela sem saída.
7. **Tipagem estrita** se a linguagem permitir; sem `any` novo; valide dado externo na entrada
   (schema) e confie nele por dentro.
8. **Sem abstração não pedida**: nada de interface com uma implementação, factory de um produto,
   config para valor que nunca muda, camada "para depois".
9. **Comentário explica porquê**, não o quê. Código morto sai (o git lembra).
10. **Teste o que tem lógica** (parser, navegação de foco, reducer, regra): um teste pequeno que
    falha se a lógica quebrar. One-liner trivial não precisa.
11. **Formato e lint** do stack, quando existir, sem discussão de estilo em revisão.

## Performance

Critério número 1 do projeto. Orçamentos, medição e técnicas: `tvos-performance`. Mínimo em todo
código: só `transform`/`opacity` em animação, cleanup de todo timer/listener, imagem no tamanho
exibido, polling só com a tela visível.

## TypeScript para o Chromium 53

- `tsconfig` `lib: ES2016`: se o typecheck reclamar de `Object.entries`, `padStart`, `AbortController`,
  `replaceAll`, use a alternativa (tabela em `tvos-context`) — não amplie o `lib`.
- `?.` e `??` podem ser usados no TS (o esbuild rebaixa); no `service/` (JS puro, Node 0.12) só ES5: sem `const`/`let`, arrow, template string.
- Sem `any`; dado externo entra como `unknown` e passa por um type guard (ex.: `isStats` em
  `src/features/system/metrics.ts`).

## Roteador

| Quero… | Carregue |
|---|---|
| Padrões de projeto úteis numa UI de TV (estado de foco, telas, teclas, adapters…), quando não usar, princípios SOLID aplicados sem cerimônia, cheiros de código | `references/padroes-de-projeto.md` |

## Skills irmãs

- `tvos-context` — limites do Chromium 53, teclas, UI de 3 m.
- `tvos-security` — regras para conteúdo externo, storage e segredos.
- `tvos-verify` — evidência antes de "pronto".

---

Fontes: princípios Ponytail (minimalismo) do autor, skills de padrões do Fantasy Quest
(camadas, reuso antes de criar, check de imports), "Refactoring" (Fowler), "A Philosophy of
Software Design" (Ousterhout), guias de performance de webOS TV. Em conflito, o código real e a
medição na TV vencem.
