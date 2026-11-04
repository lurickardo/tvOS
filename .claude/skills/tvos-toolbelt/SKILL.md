---
name: tvos-toolbelt
description: >-
  Playbook de ferramentas do Claude Code para o tvOS: quando usar plan mode, subagentes
  (Explore/Plan), lista de tarefas, AskUserQuestion, MCP context7 (documentação atual do webOS TV,
  da CLI ares, TMDB, Open-Meteo), MCP sequential-thinking, navegador do PC em 1920×1080 só
  com teclado, Playwright/Chrome DevTools, CLI webOS (ares-setup-device, ares-package,
  ares-install, ares-launch, ares-inspect, ares-device -r) pelos scripts npm, Chrome headless,
  GitHub CLI (gh) e scripts do repo.
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
| Ver UI rodando rápido | `npm run dev` → http://localhost:8000 em 1920×1080, só teclado | Chrome headless `--window-size=1920,1080 --screenshot` em `dist/app/index.html` (rAF não roda no headless: FPS fica "…") |
| Instalar e abrir na TV | `npm run tv:install` | `ares-package` → `ares-install -d tv` → `ares-launch` (primeira vez: `tvos-deploy`) |
| Depurar na TV | `npm run tv:inspect` | Console, Network, Performance, Memory |
| Medir CPU/memória na TV | `npm run tv:monitor` / `npx ares-device -d tv -r` | processo do tvOS / TV inteira |
| Developer Mode expirando | botão EXTEND no app Developer Mode | a CLI 3.x não tem `ares-extend-dev` |
| PR, issues, CI, release | `gh` | `gh pr create --base develop`; `gh run watch` |
| Texto com acento quebrado | `node scripts/check-encoding.mjs` | `--fix` e revise o diff |
| Skill nova/alterada | `node scripts/check-skills.mjs` | antes do commit |

## Comandos do repo

```bash
npm run check         # typecheck + skills + encoding
npm run dev           # navegador do PC
npm run tv:package    # .ipk sem TV
npm run tv:install    # TV
git diff develop...HEAD --stat

## Skills irmãs

- `tvos-plan-prompt` / `tvos-refine` — fluxo que usa essas ferramentas.
- `tvos-verify` — gate com evidência.
- `tvos-debug` — diagnóstico por sintoma.

---

Fontes: documentação do Claude Code (plan mode, subagentes, skills), webOS TV CLI dev guide,
skill `fantasy-quest-toolbelt` do autor. Em conflito, o que a versão instalada suporta vence.
