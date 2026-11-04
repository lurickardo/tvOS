# tvOS — instruções do projeto

**tvOS**: sistema/interface web pessoal para a TV **LG 43UP7500PSF** (43", 4K UHD, webOS TV 6.x de 2021 →
motor **Chromium 79**, Magic Remote, 2 HDMI, 1 USB, Wi-Fi, Bluetooth). Plataforma, limites do motor e
controle remoto: skill `tvos-context`.

**Estado:** repositório recém-criado, só com contexto de IA — **nenhuma linha de código de produto**.
Arquitetura e stack se decidem na primeira sessão de criação (seção "Decisões em aberto").

Repo **único** (ADR 0001): app, scripts, contexto e decisões moram aqui, sem divisão back/front/infra.

| Pasta | O quê |
|---|---|
| `.claude/skills/` | skills do projeto (catálogo em `.claude/skills/README.md`) |
| `context/` | `rules/` (regras curtas), `adr/` (decisões), `specs/` (specs de feature) |
| `scripts/` | `check-skills.mjs` (lint do contexto), `check-encoding.mjs` (UTF-8) |
| `.github/workflows/` | `pr.yml`: checks de todo PR |

## Primeiros passos em toda tarefa

1. Leia este arquivo. Carregue só a skill do tema; `tvos-context` se não souber qual.
2. Leia o código que a mudança toca — o necessário, não o projeto inteiro.
   **Código vence skill**; se divergir, corrija a skill na mesma entrega.
3. Reuse o que existe antes de criar (`tvos-code-patterns`).
4. Ideia crua → `tvos-refine`. Pedido "Contexto/Atividade/…" → `tvos-plan-prompt`.
5. Antes de dizer "pronto": checks baratos e relato curto (`tvos-verify`).

**Ritmo**: tarefa pequena (bug, ajuste, 1 tela) = direto ao código. Processo completo (spec → ADR →
plano) só para feature grande ou decisão de arquitetura.

## Decisões em aberto (primeira sessão)

Nada abaixo está decidido. Não assuma — pergunte (`AskUserQuestion`, opção recomendada primeiro) e
registre cada resposta em ADR.

1. **O que é o "OS"**: (a) app web instalado no webOS da TV como launcher/home (Developer Mode,
   `ares-*`, `.ipk`); (b) web app hospedado aberto pelo navegador da TV; (c) hardware externo na HDMI
   (mini PC, Raspberry Pi, stick) com navegador em kiosk; (d) outro. Muda motor-alvo, distribuição,
   segurança e custo.
2. **Stack**: linguagem, framework de UI, bundler, testes, lint. Em (a)/(b) o alvo de transpile é
   Chromium 79.
3. **Backend/serviços** (perfis, catálogo, sync, mídia)? Custo cloud passa pelo gate.
4. **MVP**: quais telas/apps entram primeiro.

Ritual: `tvos-refine` (spec) → `tvos-adr` (decisão) → `tvos-plan-prompt` (plano) → implementar →
`tvos-verify`. Ao decidir, **atualize esta seção**, a skill `tvos-context` e as skills afetadas.

## Comandos

```bash
node scripts/check-skills.mjs          # tocou .claude/skills ou CLAUDE.md
node scripts/check-encoding.mjs        # texto com acento; --fix corrige (revise o diff)
```
Quando o stack existir: registre aqui build/typecheck/test/lint e empacotamento para a TV, e em
`tvos-verify`.

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
- **Plataforma TV**: tudo navegável **só com o controle** (setas + OK + Voltar), foco sempre visível,
  texto legível a 3 m, safe area nas bordas, código transpilado para **Chromium 79** (sem `?.`/`??`
  nativos, sem `gap` em flexbox, sem `:focus-visible`). Detalhe: `tvos-context`.
- **Decisão duradoura** (lib/serviço novo, arquitetura, distribuição, custo, convenção) → ADR em
  `context/adr/` (`tvos-adr`).

## Skills (prefixo `tvos-`)

| Grupo | Skills |
|---|---|
| Contexto | `context` (hub, plataforma LG/webOS) |
| Engenharia | `code-patterns` (boas práticas + padrões de projeto), `debug`, `verify` |
| Segurança | `security` (regras + revisão de diff), `security-audit` (auditoria profunda, manual) |
| Workflow | `refine`, `plan-prompt`, `adr`, `gitflow`, `toolbelt`, `skills` |

Sem acionamento automático (chame pelo `/nome`): `tvos-verify`, `tvos-security-audit`.

## Notas específicas do Claude Code

- Plan mode só para feature grande ou decisão de design real. `AskUserQuestion` só para dúvida real
  de requisito (opção recomendada primeiro).
- Subagentes só quando o usuário pedir. Revisão separada (`/tvos-verify`) só sob pedido.
- Documentação de biblioteca/plataforma (webOS TV, framework escolhido): MCP context7 antes de
  responder de memória.
