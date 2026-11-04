---
name: tvos-plan-prompt
description: >-
  Reconhece e processa o formato canônico de pedido de trabalho do usuário no tvOS (Contexto,
  Atividade, Autorizações, Importante, Observações, DoD/Entregável — mesmo incompleto, fora de
  ordem ou sem os títulos) e também specs de context/specs/: valida campos, carrega as skills pelo
  tema, explora o código read-only, e produz um plano de execução (arquivos, ordem, riscos,
  verificação na TV, branch, PR quando pedido) seguindo o ciclo explorar → planejar → implementar
  → verificar → commitar. Acione quando o usuário mandar um prompt com "Contexto:"/"Atividade:",
  pedir "analise e planeje", "planeje e implemente", ou apontar uma spec pronta. Ideia ainda crua
  vai antes para tvos-refine.
---

# tvOS — Prompt de planejamento (formato canônico)

## O formato

| Campo | Serve para | Default se ausente |
|---|---|---|
| **Contexto** | situação atual / problema | perguntar se não der para entender o porquê |
| **Atividade** | escopo do que fazer | **bloqueia**: perguntar |
| **Autorizações** | o que a IA pode usar/rodar sem perguntar | skills, MCPs, CLIs e comandos locais; nada que gere custo, apague dados ou mexa na TV |
| **Importante** | restrições, ordem obrigatória | nenhuma além do `CLAUDE.md` |
| **Observações** | convenções, dúvidas | branch atual; `feat/<nome>` a partir de `develop` se estiver em `develop`/`main` |
| **DoD / Entregável** | critério de pronto | checks verdes + `/tvos-verify` + commit na branch (PR só quando pedido) + skills atualizadas |

## Fluxo (siga em ordem)

1. **Reconhecer** o formato (ou spec em `context/specs/<slug>/spec.md`).
2. **Validar campos.** Bloqueio real (escopo indefinido, ação irreversível, custo, decisão em aberto
   do `CLAUDE.md`) → perguntar (máx. 4, opção recomendada primeiro). Lacuna leve → assumir default
   e declarar.
3. **Carregar contexto.** Skill do tema; `tvos-context` se não souber qual. Rede/conteúdo externo/
   storage → `tvos-security`. Código → `tvos-code-patterns`.
4. **Explorar read-only.** Arquivos que a mudança toca e o fluxo ponta a ponta; código reutilizável.
5. **Planejar** (plan mode para feature grande). O plano contém:
   - Contexto (1 parágrafo: por quê).
   - Arquivos a criar/alterar e o que reutilizar.
   - Ordem: dados/contratos → lógica → UI/navegação → integração com a plataforma → docs/skills.
   - Riscos (Chromium 79, memória, foco/Voltar, segurança, custo).
   - Verificação concreta (comandos + o que olhar com o teclado/controle; TV real se possível).
   - Skills/docs/ADR que serão atualizados.
6. **Aprovação** do plano (se pediu "planeje e implemente" sem revisar, siga e registre o plano).
7. **Implementar** com lista de tarefas; commits pequenos (pt-BR, imperativo); **sem
   `Co-Authored-By`**.
8. **Verificar** com `/tvos-verify`.
9. **Entregar**: commit (PR `--base develop` se pedido), resumo, gaps, "docs/skills: …".

## Regras

- Não expandir escopo: melhoria vista no caminho vira "gaps".
- Decisão duradoura no plano → tarefa de ADR (`tvos-adr`).
- Item "Em aberto" do `CLAUDE.md` resolvido → atualizar a seção na mesma entrega.

## Skills irmãs

- `tvos-refine` (antes), `tvos-verify` (depois), `tvos-toolbelt` (como), `tvos-context` (onde).

---

Fontes: skill `fantasy-quest-plan-prompt` do autor, Anthropic "explore → plan → code → commit".
Em conflito, a instrução explícita do usuário vence.
