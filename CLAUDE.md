# tvOS — instruções do projeto

**tvOS**: home screen própria, rápida e sem anúncios, para a TV **LG 43LM631C0SB**
(2019, webOS TV 4.x → app em **Chromium 53**, JS service em **Node 0.12**, tela provável Full HD).
Mostra apps, destaques de filmes/séries, clima, entradas e o **estado do sistema** (CPU, memória,
FPS…). Produto: `tvos-produto`; plataforma: `tvos-context`.

**Estado:** esqueleto funcionando (build → `.ipk`, painel CPU/memória/FPS). MVP a construir.

Decisões tomadas (não reabra sem ADR novo):
- **ADR 0006**: a TV de destino é a **43LM631C0SB (webOS 4.x)** — medida por `ares-device -i`, não a
  43UP7500PSF. Alvo `chrome53`, `lib: ES2016`, service em ES5, `appinfo` `1280x720` com palco
  1920×1080 escalado.
- **ADR 0002**: app `.ipk` + JS service instalados pelo **Developer Mode, sem root** (linha do
  FreeMyTvWebOS); abre por atalho numérico; Key Server OFF depois de instalar.
- **ADR 0003**: **TypeScript + esbuild, sem framework, zero dependência em runtime**, bundle único
  `target: chrome53`, `lib: ES2016`; **performance é o critério nº 1**.
- **ADR 0004**: TMDB (imagens leves) e Open-Meteo; sem telemetria.
- **ADR 0005**: config pessoal no `.env` (`TV_IP`, `TMDB_TOKEN`, `CITY`; modelo em
  `.env.example`) injetada no build local. **A IA nunca lê nem imprime o `.env`**; `.ipk`/`dist/`
  gerados com ele nunca são publicados.
- **Layout da home**: imagens do free-my-tv em modo escuro, sistema no lugar das criptomoedas
  (`context/specs/01-home/`: `spec.md` + mockups).

Repo **único** (ADR 0001):

| Pasta | O quê |
|---|---|
| `app/` | `index.html` (casca + CSP), `style.css`, `appinfo.json`, `assets/` |
| `src/` | `main.ts`, `config.ts` (valores do `.env`), `platform/` (ponte com a TV), `features/<x>/` |
| `service/` | JS service no barramento Luna (métricas de `/proc`) |
| `scripts/` | `build.mjs` (esbuild → `dist/`), `tv-setup.mjs`, `check-skills.mjs`, `check-encoding.mjs` |
| `context/` | `rules/`, `adr/`, `specs/` |
| `.claude/skills/` | skills (catálogo em `.claude/skills/README.md`) |

## Primeiros passos em toda tarefa

1. Leia este arquivo. Carregue só a skill do tema; `tvos-context` se não souber qual.
2. Leia o código que a mudança toca — o necessário, não o projeto inteiro.
   **Código vence skill**; se divergir, corrija a skill na mesma entrega.
3. Reuse o que existe antes de criar (`tvos-code-patterns`).
4. Ideia crua → `tvos-refine`. Pedido "Contexto/Atividade/…" → `tvos-plan-prompt`.
5. Antes de dizer "pronto": checks baratos e relato curto (`tvos-verify`).

**Ritmo**: tarefa pequena (bug, ajuste, 1 tela) = direto ao código. Processo completo (spec → ADR →
plano) só para feature grande ou decisão de arquitetura.

## Em aberto

- **MVP**: implementar `context/specs/01-home/spec.md` (casca, foco, prateleira, destaques, gaveta
  com entradas/atalhos/clima/sistema) via `tvos-plan-prompt`; ajustes e screensaver viram specs
  depois (`tvos-refine`).
- **Confirmar na TV** (primeira instalação): o JS service lê `/proc` sem root? Versão exata do
  webOS, keyCodes de mídia, memória total. Registrar em `tvos-webos-api`/`tvos-context`.

## Comandos

```bash
npm install            # uma vez (devDependencies fixadas); depois cp .env.example .env e preencher
npm run tv:setup       # cadastra a TV pelo TV_IP e busca a chave (passphrase: a pessoa digita)
npm run dev            # http://localhost:8000 no navegador do PC (1920×1080, só teclado)
npm run check          # typecheck (lib ES2016) + skills + encoding
npm run tv:package     # build + .ipk em dist/ (sem TV; o CI roda)
npm run tv:install     # build com o .env, instala e abre na TV "tv" (tutorial: README)
npm run tv:inspect     # DevTools do app na TV
npm run tv:monitor     # CPU/memória do processo na TV
```

## REGRA 1 — Documentação e skills em dia quando a mudança as desatualiza

Atualize docs/skills **só quando a mudança altera algo que elas descrevem**: comando, estrutura de
pastas, contrato, variável de ambiente, fluxo do usuário, convenção, decisão ou gap. Bug fix, ajuste
visual e refatoração interna normalmente não pedem nada.

1. Ache o alvo pelo mapa "mexeu em X → atualize Y" da skill `tvos-skills` e edite só esse trecho, no
   **mesmo commit/PR**.
2. Rode `node scripts/check-skills.mjs` se tocou skills ou `CLAUDE.md`.
3. No relato, uma linha: "docs/skills: <lista>" ou "docs/skills: sem alteração".

## Regras núcleo

- **Idioma**: responda em pt-BR. UI e mensagens em pt-BR com acento; identificadores de código em
  inglês. Arquivos em UTF-8 + LF.
- **Autonomia**: rode você mesmo checks, testes e builds locais. Edite sem pedir licença. Pergunte só em
  ambiguidade real de requisito ou ação irreversível/destrutiva (force push, apagar dados, reescrever
  histórico, instalar algo na TV fora do Developer Mode, mexer em configuração da TV).
- **Minimalismo** (`tvos-code-patterns`): a melhor linha é a que não foi escrita. YAGNI → reuso →
  stdlib → plataforma nativa → dependência já instalada → só então código novo, o mínimo. Dependência
  nova pesa duas vezes aqui: memória da TV e superfície de ataque.
- **Verificação**: "pronto" exige evidência (saída de comando, tela vista). Sem como verificar algo,
  diga o quê e por quê.
- **Relato final curto** (3–6 linhas): o que mudou, gaps/efeitos colaterais reais e a linha de
  docs/skills. Sem repetir o diff.
- **Escopo**: não expanda; melhoria vista no caminho vira item de "gaps".
- **Git** (`tvos-gitflow`): `main` = estável, `develop` = integração; trabalho em `feat/*`/`fix/*` a
  partir de `develop`. **Todo merge é por PR documentada**. Mensagens pt-BR, imperativo. **Nunca**
  `Co-Authored-By` nem menção a IA. **Toda entrega termina em commit** (sem push salvo pedido);
  confira que nenhum segredo entrou no diff. **Repo público**: nada pessoal ou sensível versionado.
- **Custo cloud**: decisão que gere custo estimado **> US$ 5/mês** (ou bem acima do atual) → pare e
  apresente decisão, custo mensal, comparação com hoje, e peça aprovação. < US$ 2 não precisa.
- **Segurança** (`tvos-security`): nada confia em dado externo (rede, USB, outro app, URL); segredo
  nunca em arquivo versionado, bundle, log ou resposta; HTML externo só sanitizado.
- **Performance** (`tvos-performance`): bundle ≤ 60 KB gzip, 60 fps, abrir < 1 s; anima só
  `transform`/`opacity`, sem `backdrop-filter`, imagem no tamanho exibido. Mudança visual = medir
  na TV. Dependência em runtime só com ADR.
- **Plataforma TV**: tudo navegável **só com o controle** (setas + OK + Voltar), foco sempre visível,
  texto legível a 3 m, safe area, **dark only** (`tvos-design-system`). API da TV só por
  `src/platform/` (`tvos-webos-api`). CSS sem flex `gap`/`:focus-visible`; service só ES5.
- **Decisão duradoura** (lib/serviço novo, arquitetura, distribuição, custo, convenção) → ADR em
  `context/adr/` (`tvos-adr`).

## Skills (prefixo `tvos-`)

| Grupo | Skills |
|---|---|
| Contexto | `context` (hub, plataforma LG/webOS), `produto` (visão, módulos, MVP) |
| Plataforma | `webos-api` (Luna, appinfo, service), `deploy` (Developer Mode, `tv:*`), `apis-externas` (TMDB, Open-Meteo) |
| Engenharia | `code-patterns` (boas práticas + padrões), `performance`, `design-system` (dark), `debug`, `verify` |
| Segurança | `security` (regras + revisão de diff), `security-audit` (auditoria profunda, manual) |
| Workflow | `refine`, `plan-prompt`, `adr`, `gitflow`, `toolbelt`, `skills` |

Sem acionamento automático (chame pelo `/nome`): `tvos-verify`, `tvos-security-audit`.

## Notas específicas do Claude Code

- Plan mode só para feature grande ou decisão de design real. `AskUserQuestion` só para dúvida real
  de requisito (opção recomendada primeiro).
- Subagentes só quando o usuário pedir. Revisão separada (`/tvos-verify`) só sob pedido.
- Documentação de plataforma/API (webOS TV, `@webos-tools/cli`, TMDB, Open-Meteo): MCP context7
  antes de responder de memória.
- Passphrase do Developer Mode e chave TMDB: a pessoa digita no terminal/TV dela; nunca no chat.
