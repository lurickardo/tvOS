---
name: tvos-verify
description: >-
  Gate de verificação do tvOS antes de dizer "pronto", marcar tarefa concluída ou abrir PR: roda
  de verdade os checks do repo (check-skills, check-encoding) e os do stack (build, typecheck,
  testes, lint), confere o alvo Chromium 53 no build, verifica a UI rodando só com teclado/controle
  (setas, OK, Voltar) em 1920×1080 e, quando possível, na TV real, aplica checklist com itens de
  veto (segredo, custo cloud, conteúdo externo sem sanitizar, navegação sem saída, check falhando,
  doc desatualizada) e exige relato de gaps e skills atualizadas. Revisor deve ser contexto
  separado do construtor. Acione com "verifique", "revise antes do PR", "isso está pronto?", e ao
  terminar uma implementação antes de declarar entrega. Auditoria profunda fica em
  tvos-security-audit.
# Desligada do acionamento automático (economia de tokens); use /tvos-verify quando precisar.
disable-model-invocation: true
---

# tvOS — Verificação antes da entrega

> **Regra de ouro:** "pronto" exige **evidência**: saída de comando e o que foi visto na tela.
> "Deve funcionar" não é evidência. Se não deu para verificar algo, diga exatamente o quê e por quê.

## Revisor ≠ construtor

Quem implementou tende a confirmar o próprio trabalho. Rode a revisão (passos 3–4) num subagente ou
sessão nova que recebe só: o pedido original, `git diff develop...HEAD` e esta skill. O revisor
aponta **apenas** defeitos de correção e requisitos faltando — não estilo nem "melhorias".

## Passos

1. **Escopo.** `git status` + `git diff develop...HEAD --stat`. Tudo no diff é intencional? Nada
   de arquivo gerado, `.env`, `.ipk`, chave, dump, binário grande, dado pessoal (repo público).
2. **Comandos (rode e cole o resultado resumido):**
   ```bash
   npm run check                        # typecheck (lib ES2016) + skills + encoding
   npm run tv:package                   # build + .ipk (valida appinfo.json e o pacote)
   gzip -c dist/app/main.js | wc -c     # orçamento: ≤ 60 KB (tvos-performance)
   grep -c '?\.\|??' dist/app/main.js   # 0: sintaxe rebaixada para o Chromium 53
   node --check service/index.js        # se tocou o service (ES5, Node 0.12)
   ```
3. **Comportamento.**
   - UI: `npm run dev` → http://localhost:8000 em 1920×1080 e usar **só teclado** (setas, Enter,
     Esc = Voltar). Foco visível sempre? Voltar sai de toda tela? Estados vazio/carregando/erro?
   - TV real (se disponível): `npm run tv:install`; `npm run tv:inspect` sem erro no console;
     FPS ≥ 55 navegando; `npm run tv:monitor` sem memória subindo sem parar.
   - Sem TV/ambiente: diga isso no relato.
4. **Checklist.**

### Vetos (qualquer um reprova)

| # | Item |
|---|---|
| V1 | Segredo/credencial/dado pessoal em arquivo versionado, bundle, log ou resposta |
| V2 | Recurso cloud pago novo sem aprovação (gate > US$ 5/mês) |
| V3 | Conteúdo externo renderizado como HTML sem sanitizer, ou `eval`/URL `javascript:` aceita |
| V4 | Tela/estado sem saída pelo controle (foco preso, Voltar não faz nada, foco invisível) |
| V5 | Build, teste ou check falhando |
| V6 | Doc/skill desatualizada pelo diff (REGRA 1 do CLAUDE.md) |

### Itens ponderados

| # | Item | Delega a |
|---|---|---|
| P1 | Reusa código existente; sem abstração ou dependência desnecessária | `tvos-code-patterns` |
| P2 | Roda no Chromium 53 (sem API/CSS fora do alvo sem polyfill) | `tvos-context` |
| P3 | Erros de rede/storage tratados com mensagem pt-BR e saída | `tvos-code-patterns` |
| P4 | Sem vazamento (listener, timer, imagem, player) | `tvos-code-patterns` |
| P5 | Texto ≥ 24 px, contraste AA, safe area, animação curta com reduced-motion | `tvos-context` |
| P6 | Lógica não trivial com teste pequeno | `tvos-code-patterns` |
| P7 | Textos pt-BR com acento, UTF-8 | `CLAUDE.md` |
| P8 | Decisão duradoura registrada em ADR | `tvos-adr` |

5. **Relato final** (pt-BR):
   - O que foi feito (1–3 linhas).
   - Evidência: comandos + resultado; o que foi visto na tela/TV.
   - **Gaps e efeitos colaterais**.
   - "docs/skills: <lista>" ou "docs/skills: sem alteração".

## Saída de achados

`path:linha: [veto|alto|médio|baixo] problema. correção.` — reprova se houver veto; senão aprova
com achados listados.

## Skills irmãs

- `tvos-security-audit` (auditoria profunda), `tvos-debug` (falhou e a causa não é óbvia).

---

Fontes: skill `fantasy-quest-verify` do autor, práticas "verification before completion" e
writer/reviewer split. Em conflito, CLAUDE.md vence.
