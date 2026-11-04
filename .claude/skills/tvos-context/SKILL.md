---
name: tvos-context
description: >-
  Contexto técnico mestre e roteador do tvOS (home screen própria para a TV LG 43LM631C0SB,
  app .ipk que é a home oficial da TV rootada — ADR 0007): hardware alvo (Full HD, HDMI 1–3, 1 USB,
  Wi-Fi, Bluetooth, Magic Remote), plataforma webOS TV 4.x com Chromium 53 (app) e Node 0.12 (JS
  service) e o que isso proíbe (optional chaining, flex gap, :focus-visible sem transpile), stack
  (TypeScript + esbuild, sem framework), mapa de pastas (src/, app/, service/, scripts/), comandos
  npm, teclas do controle (setas, OK, Voltar 461, cores), ponteiro do Magic Remote, princípios de
  UI de 3 metros e qual skill carregar para cada tarefa. Acione quando não estiver claro qual skill
  usar ou onde fica o código, e em perguntas como "o que a TV suporta?", "posso usar essa
  API/CSS?", "onde fica X?", "qual skill uso?", "que stack é essa?". Tarefa com tema óbvio vai
  direto à skill do tema.
---

# tvOS — Contexto técnico mestre

Home screen própria para uma **LG 43LM631C0SB** (2019, webOS TV 4.x, ADR 0006), app `.ipk` que é a
home oficial da TV rootada (ADR 0007; Home do controle abre o tvOS). Objetivo: ser muito mais rápida e limpa que a home da
LG, e mostrar o estado do sistema (`tvos-produto`).

> **Regra de ouro:** leia o código real antes de afirmar qualquer coisa — esta skill é mapa, não
> território. Em conflito entre skill e código, **o código vence** e a skill é corrigida na mesma
> entrega. Fato de plataforma não confirmado na TV real fica marcado "verificar".

## Invariantes (não quebre sem ADR — `tvos-adr`)

1. **Repo único** (ADR 0001); skills só em `.claude/skills/`.
2. **App webOS como home da TV rootada** (ADR 0007): `com.lurickardo.tvos` + service
   `com.lurickardo.tvos.service`; root só em `root/tvos-root.js` (`npm run tv:root`), nunca no app.
3. **Stack** (ADR 0003): TypeScript strict + esbuild, **sem framework**, **zero dependência em
   runtime**, um bundle `target: chrome53`; `tsconfig` `lib: ES2016` barra API ausente na TV.
   Service em JS ES5 (Node 0.12).
4. **Performance acima de tudo** (`tvos-performance`): bundle ≤ 60 KB gzip, 60 fps, abrir < 1 s.
5. **Controle remoto primeiro**: tudo com setas + OK + Voltar; ponteiro e teclado são extras.
6. **Dark only** (`tvos-design-system`).
7. **Dados externos** só TMDB (imagens leves) e Open-Meteo, sem telemetria (ADR 0004); chaves e
   cidade pelo `.env` no build local (ADR 0005).
8. **Repo público**: nada pessoal (IP/MAC da TV, chave SSH root, chave TMDB) versionado.

## Mapa do repo

```
app/            index.html (casca + CSP), style.css, appinfo.json, assets/ (ícones)
src/            main.ts (boot), config.ts (.env), platform/ (luna.ts), features/<x>/ (system, …)
service/        JS service no barramento Luna (index.js, package.json, services.json)
scripts/        build.mjs (esbuild + .env → dist/), tv-setup.mjs, check-skills.mjs, check-encoding.mjs
dist/           gerado: app/, service/, *.ipk (fora do git)
context/        rules/, adr/, specs/ (01-home: spec + mockups)
.env            config pessoal (fora do git; modelo .env.example; a IA não lê)
```

## Comandos

```bash
npm run dev          # http://localhost:8000 no navegador do PC (CPU/memória "—", FPS real)
npm run build        # dist/app + dist/service
npm run typecheck    # tsc strict, lib ES2016
npm run check        # typecheck + skills + encoding
npm run tv:setup     # cadastra a TV rootada "tv-root" (TV_IP do .env, chave SSH)
npm run tv:package   # build + .ipk em dist/
npm run tv:install   # empacota, instala e abre na TV (dispositivo "tv-root" — tvos-deploy)
npm run tv:root -- apply|status|restore   # tvOS como home + debloat da LG (ADR 0007)
npm run tv:inspect   # DevTools do app na TV
npm run tv:monitor   # CPU/memória do processo na TV
```

## Roteador — tarefa → skill

| Tarefa envolve… | Carregue |
|---|---|
| O que construir, módulos, painel do sistema, MVP | `tvos-produto` |
| Visual, cor, tipografia, foco, layout, componente | `tvos-design-system` |
| Fluidez, FPS, memória, imagem, animação, "está lento" | `tvos-performance` |
| API da TV (Luna), appinfo.json, JS service, entradas, info do sistema | `tvos-webos-api` |
| Instalar/atualizar/medir na TV, root, debloat, voltar à home da LG | `tvos-deploy` |
| TMDB, Open-Meteo, cache, chave, CSP | `tvos-apis-externas` |
| Escrever/refatorar código, padrão de projeto | `tvos-code-patterns` |
| Segurança, revisão de diff | `tvos-security` |
| Auditoria de segurança profunda (manual) | `/tvos-security-audit` |
| Bug sem causa óbvia | `tvos-debug` |
| Declarar "pronto", abrir PR | `/tvos-verify` |
| Ideia crua → spec | `tvos-refine` |
| Prompt Contexto/Atividade/… → plano | `tvos-plan-prompt` |
| Decisão arquitetural duradoura | `tvos-adr` |
| Branch, PR, release, tag | `tvos-gitflow` |
| Qual ferramenta/MCP/CLI usar | `tvos-toolbelt` |
| Criar/editar skill, CLAUDE.md | `tvos-skills` |

## Roteador — detalhe desta skill

| Quero… | Carregue |
|---|---|
| Ficha do hardware, motor por versão do webOS, tabela do que o Chromium 53 não tem, keyCodes e ponteiro, UI de 3 m, perguntas que só a TV responde | `references/plataforma-lg-webos.md` |

## Verifique ao vivo antes de agir

```bash
git branch --show-current && git log --oneline -5
ls src/features                    # features que já existem
npm run check
```
Versão real do webOS: `npx ares-device -i -d tv` (ou Configurações → Suporte → Informações da TV).

---

Fontes: webostv.developer.lge.com (web engine por versão, Node.js por versão, back button, webOS
events, CLI), saída de `ares-device -i` da TV, ADRs 0001–0006, FreeMyTvWebOS e free-my-tv. Em
conflito, o que a TV real faz vence.
