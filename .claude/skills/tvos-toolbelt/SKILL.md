---
name: tvos-toolbelt
description: >-
  Playbook de ferramentas do Claude Code para o tvOS: quando usar plan mode, subagentes
  (Explore/Plan), lista de tarefas, AskUserQuestion, MCP context7 (documentação atual do webOS TV,
  da CLI ares e do framework escolhido), MCP sequential-thinking, navegador do PC em 1920×1080 só
  com teclado, Playwright/Chrome DevTools, CLI webOS (ares-setup-device, ares-package,
  ares-install, ares-launch, ares-inspect, ares-extend-dev), GitHub CLI (gh) e scripts do repo.
  Acione quando houver dúvida sobre QUAL ferramenta usar e COMO (instalar na TV, depurar na TV,
  consultar doc, ver a UI rodando, abrir PR); não precisa em tarefa comum.
---

# tvOS — Toolbelt

> **Regra de ouro:** use a ferramenta que produz **evidência** (comando rodado, tela vista, doc
> atual consultada), não a que produz opinião. Plataforma e libs: **context7** antes de responder
> de memória (webOS TV: `/websites/webostv_developer_lge_develop`; CLI: `/webos-tools/cli`).

## Situação → ferramenta

| Situação | Ferramenta | Como |
|---|---|---|
| Feature grande ou decisão de design | plan mode | explore read-only, plano, aprovação; tarefa pequena vai direto |
| Requisito ambíguo | `AskUserQuestion` | opções com recomendação primeiro; nunca pergunte o que o código responde |
| Busca ampla no repo | subagente `Explore` (só se o usuário pedir subagentes) | peça a conclusão + `path:linha` |
| Revisar a própria entrega | subagente/sessão nova | revisor ≠ construtor (`/tvos-verify`) |
| API de plataforma/lib | MCP context7 | `resolve-library-id` → `query-docs` com a pergunta completa |
| "Esse JS/CSS roda na TV?" | MDN/caniuse (coluna Chrome ≤ 79) + tabela de `tvos-context` | na dúvida, teste na TV |
| Raciocínio longo, várias hipóteses | MCP sequential-thinking | arquitetura, depuração difícil |
| Ver UI rodando rápido | navegador do PC em 1920×1080, só teclado | Playwright/Chrome DevTools para screenshot e console |
| Instalar e abrir na TV | CLI `ares-*` | `ares-package` → `ares-install --device tv` → `ares-launch` |
| Depurar na TV | `ares-inspect --device tv --app <id> --open` | Console, Network, Performance, Memory |
| Developer Mode expirando | `ares-extend-dev --device tv` | ou botão no app Developer Mode |
| PR, issues, CI, release | `gh` | `gh pr create --base develop`; `gh run watch` |
| Texto com acento quebrado | `node scripts/check-encoding.mjs` | `--fix` e revise o diff |
| Skill nova/alterada | `node scripts/check-skills.mjs` | antes do commit |

## Comandos do repo

```bash
node scripts/check-skills.mjs && node scripts/check-encoding.mjs
git diff develop...HEAD --stat                    # escopo da entrega
```
Quando o stack existir, acrescente aqui build/test/lint/empacotamento.

## Skills irmãs

- `tvos-plan-prompt` / `tvos-refine` — fluxo que usa essas ferramentas.
- `tvos-verify` — gate com evidência.
- `tvos-debug` — diagnóstico por sintoma.

---

Fontes: documentação do Claude Code (plan mode, subagentes, skills), webOS TV CLI dev guide,
skill `fantasy-quest-toolbelt` do autor. Em conflito, o que a versão instalada suporta vence.
