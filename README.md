# tvOS

Sistema/interface web pessoal para a TV **LG 43UP7500PSF** (43", 4K UHD, webOS TV 6.x, Magic Remote).

> Estado: só o contexto de IA está pronto — o código do sistema começa na próxima sessão.

## Estrutura

```
CLAUDE.md            regras do projeto (fonte da verdade para o Claude Code)
.claude/skills/      skills: contexto da plataforma, padrões de código, segurança, workflow
context/
  rules/             regras curtas de desenvolvimento e release
  adr/               decisões de arquitetura (NNNN-slug.md)
  specs/             specs de feature (EARS)
scripts/             check-skills.mjs, check-encoding.mjs
.github/workflows/   pr.yml (checks de todo PR)
```

## Checks

```bash
node scripts/check-skills.mjs
node scripts/check-encoding.mjs
```

## Como começar

Abra uma sessão do Claude Code na raiz do repo e descreva a ideia (ou use o formato
`Contexto / Atividade / Importante / DoD`). As decisões iniciais (o que é o "OS", stack, MVP)
estão listadas em `CLAUDE.md` → "Decisões em aberto".
