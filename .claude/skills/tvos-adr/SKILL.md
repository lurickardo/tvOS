---
name: tvos-adr
description: >-
  Registro de decisões de arquitetura (ADR) do tvOS em context/adr/NNNN-slug.md, formato
  Nygard/MADR enxuto (contexto, decisão, alternativas, consequências, como verificar), imutável
  depois de aceito e substituído por outro ADR quando mudar. Define quando uma decisão merece ADR
  (distribuição na TV, root, stack, lib ou serviço novo, dependência em runtime, navegação de foco,
  persistência, backend, qualquer custo cloud, telemetria, convenção de código) e traz o template.
  Acione ao tomar ou propor decisão duradoura, quando um plano diz "vamos usar/trocar X", ao
  resolver um item "Em aberto" do CLAUDE.md, ou em perguntas "por que foi feito
  assim?", "isso já foi decidido?".
---

# tvOS — ADRs

> **Regra de ouro:** decisão que você (ou outra IA) poderia desfazer sem saber o motivo precisa de
> ADR. ADR aceito não é editado — cria-se outro que o substitui.

## Quando escrever

| Escreva ADR | Não precisa |
|---|---|
| Distribuição na TV, root, Homebrew Channel (hoje: ADR 0002) | Bump de versão menor |
| Stack, framework de UI, bundler, alvo de transpile | Nova tela seguindo o padrão |
| Lib ou serviço novo (navegação espacial, player, sanitizer) | Usar lib já adotada |
| Persistência, sync, backend, qualquer custo cloud recorrente | Refatoração interna |
| Telemetria, permissões de sistema da TV | Aplicar regra existente |
| Convenção de pastas/código/nomes | Novo módulo seguindo a convenção |

## Processo

1. `ls context/adr` → próximo número com 4 dígitos.
2. Criar `context/adr/NNNN-slug-kebab.md` com o template, status `proposto`.
3. Usuário aprova → status `aceito (AAAA-MM-DD)`. Reverter → novo ADR `Substitui: NNNN` e o antigo
   ganha só `Status: substituído por MMMM`.
4. Atualizar o que a decisão muda: `CLAUDE.md` (decisões tomadas, "Em aberto", comandos), `tvos-context`
   (estado atual) e a skill afetada; adicionar a linha no índice abaixo.

## Template

```markdown
# NNNN — <Decisão em uma frase>

Status: proposto | aceito (AAAA-MM-DD) | substituído por MMMM
Decisores: <nomes>

## Contexto
<forças em jogo, problema, restrições (TV, memória, custo, tempo)>

## Decisão
<o que foi decidido, na voz ativa>

## Alternativas consideradas
- <opção> — <por que não>

## Consequências
- Positivas: ...
- Negativas / dívidas: ...
- Custo mensal estimado (se houver): ...

## Como verificar que está sendo seguida
<regra checável: grep, lint, teste, CI>
```

## Índice

- `0001-contexto-ia-claude-code-repo-unico.md` — repo único, `CLAUDE.md` como fonte, skills
  `tvos-*` em `.claude/skills`, `context/` para rules/adr/specs.
- `0002-app-home-webos-sem-root.md` — app `.ipk` + JS service pelo Developer Mode, sem root,
  atalho numérico, Key Server OFF, reuso MIT com atribuição.
- `0003-stack-ts-esbuild-sem-framework.md` — TypeScript + esbuild, sem framework nem dependência
  em runtime, bundle `chrome79`, `lib: ES2019`, service ES2017, orçamento de performance,
  `@webos-tools/cli`.
- `0004-dados-externos-tmdb-open-meteo.md` — TMDB com imagens leves e token do usuário na TV,
  Open-Meteo, cache com TTL, CSP, sem telemetria.

## Skills irmãs

- `tvos-plan-prompt` — inclui tarefa de ADR no plano quando aplicável.
- `tvos-refine` — spec antes da decisão.

---

Fontes: Michael Nygard, "Documenting Architecture Decisions"; MADR; skill `fantasy-quest-adr` do
autor. Em conflito, o formato mais curto que preserve contexto e consequência vence.
