---
name: tvos-context
description: >-
  Contexto técnico mestre e roteador do tvOS (sistema/interface web pessoal para a TV LG
  43UP7500PSF): hardware alvo (4K UHD, 2 HDMI, 1 USB, Wi-Fi, Bluetooth, Magic Remote), plataforma
  webOS TV 6.x de 2021 com motor Chromium 79 e o que isso proíbe (optional chaining, flex gap,
  :focus-visible sem transpile/polyfill), teclas do controle (setas, OK, Voltar 461, cores),
  ponteiro do Magic Remote, Developer Mode e CLI ares-*, princípios de UI de 3 metros (foco,
  safe area, legibilidade), estado do projeto, decisões em aberto e qual skill carregar para cada
  tarefa. Acione quando não estiver claro qual skill usar ou onde fica o código, e em perguntas
  como "o que a TV suporta?", "posso usar essa API/CSS?", "como instalo na TV?", "qual skill uso?",
  "que stack é essa?". Tarefa com tema óbvio vai direto à skill do tema.
---

# tvOS — Contexto técnico mestre

Sistema/interface web pessoal para uma **LG 43UP7500PSF** (2021). Hoje o repo tem só o contexto de
IA; arquitetura e stack ainda não foram decididas (`CLAUDE.md` → "Decisões em aberto").

> **Regra de ouro:** leia o código real antes de afirmar qualquer coisa — esta skill é mapa, não
> território. Em conflito entre skill e código, **o código vence** e a skill é corrigida na mesma
> entrega. Fato de plataforma não confirmado na TV real é marcado "verificar".

## Invariantes (não quebre sem ADR — `tvos-adr`)

1. **Repo único** (ADR 0001): app, scripts e contexto aqui; skills só em `.claude/skills/`.
2. **Controle remoto é o dispositivo de entrada principal.** Toda função alcançável com setas +
   OK + Voltar; ponteiro do Magic Remote e teclado são extras, nunca o único caminho.
3. **Motor-alvo é o da TV** (Chromium 79 se rodar no webOS da TV): código moderno só com
   transpile/polyfill para esse alvo; o build precisa provar isso, não a memória.
4. **Pouca memória e CPU modesta**: orçamento de bundle, imagens e animação conta desde o
   primeiro commit (`tvos-code-patterns`).
5. **Repo público**: nada pessoal (IP/MAC da TV, chave do Developer Mode, contas) versionado.
6. **Textos de UI em pt-BR**; identificadores de código em inglês.

## Estado atual (atualize ao decidir)

| Tema | Estado |
|---|---|
| O que é o "OS" (app webOS / web hospedado / hardware na HDMI) | **em aberto** |
| Stack (linguagem, UI, bundler, testes) | **em aberto** |
| Backend/serviços | **em aberto** (gate de custo) |
| CI | `pr.yml`: check-skills + check-encoding |
| Checks locais | `node scripts/check-skills.mjs`, `node scripts/check-encoding.mjs` |

## Roteador — tarefa → skill

| Tarefa envolve… | Carregue |
|---|---|
| Escrever/refatorar código, escolher padrão ou lib, performance | `tvos-code-patterns` |
| Rede, conteúdo externo, storage, segredo, permissão, revisão de diff | `tvos-security` |
| Auditoria de segurança profunda com relatório (manual) | `/tvos-security-audit` |
| Bug sem causa óbvia | `tvos-debug` |
| Declarar "pronto", abrir PR | `/tvos-verify` |
| Ideia crua → spec | `tvos-refine` |
| Prompt Contexto/Atividade/… → plano | `tvos-plan-prompt` |
| Decisão arquitetural duradoura | `tvos-adr` |
| Branch, PR, release, tag | `tvos-gitflow` |
| Qual ferramenta/MCP/CLI usar | `tvos-toolbelt` |
| Criar/editar skill, CLAUDE.md, instalar skill/MCP de terceiro | `tvos-skills` |

## Roteador — detalhe desta skill

| Quero… | Carregue |
|---|---|
| Ficha do hardware, webOS 6.x, tabela do que o Chromium 79 não tem, teclas e ponteiro, Developer Mode, `ares-*`, `appinfo.json`, UI de 3 m | `references/plataforma-lg-webos.md` |

## Verifique ao vivo antes de agir

```bash
git branch --show-current && git log --oneline -5      # base do trabalho é develop
ls                                                      # o stack já existe? (package.json, src/ …)
node scripts/check-skills.mjs
```
Versão real do webOS: na TV, Configurações → Suporte → Informações da TV (ou `ares-device -i`).

---

Fontes: webostv.developer.lge.com (web engine por versão, back button, webOS events, CLI), ficha
do produto LG 43UP7500PSF, ADR 0001. Em conflito, o que a TV real faz vence.
