# 0001 — Contexto de IA no Claude Code, num repositório único

Status: aceito (2026-11-04)
Decisores: Lurickardo

## Contexto

O tvOS nasce como projeto pessoal, de uma pessoa, desenvolvido com Claude Code. O projeto de
referência do mesmo autor (Fantasy Quest) separa o código em quatro repos (backend, frontend,
infra, contexts), cada um com skills próprias e uma pasta-mãe montada por symlinks. Essa divisão
serve a um produto com deploy independente por camada; aqui ela só traria indireção: script de
workspace, symlinks, catálogos duplicados e "em qual repo mora esta skill?".

O mesmo projeto já tinha testado um esquema multi-harness (`AGENTS.md` + `.agents/skills` gerando
`.claude/skills`) e voltou atrás por falta de uso de outros agentes.

## Decisão

1. **Um repositório** (`lurickardo/tvOS`, público) guarda app, scripts, contexto de IA e
   decisões. Sem divisão back/front/infra; se surgir backend, ele entra como pasta deste repo até
   um ADR dizer o contrário.
2. `CLAUDE.md` na raiz é a fonte da verdade (≤ 12.000 caracteres, lint). Detalhe vai para skills.
3. Skills reais em `.claude/skills/<tvos-nome>/` (padrão Agent Skills, frontmatter só com chaves
   portáveis), catálogo em `.claude/skills/README.md`. Sem link, sem geração, sem `AGENTS.md`.
4. `context/` guarda o que não é skill: `rules/` (regras curtas), `adr/`, `specs/`.
5. `scripts/check-skills.mjs` trava a estrutura (nome, prefixo `tvos-`, description com gatilho,
   ≤ 500 linhas, references a um nível, catálogo, tamanho do `CLAUDE.md`) e roda no `pr.yml`.
6. Skills de segurança, padrões de código, workflow (refine, plan-prompt, verify, debug, adr,
   gitflow, toolbelt, skills) foram adaptadas do Fantasy Quest, sem nada específico daquele
   produto (NestJS, MongoDB, mesa 3D, AWS/GCP).

## Alternativas consideradas

- Copiar a divisão em quatro repos do Fantasy Quest — custo de manutenção sem benefício para um
  projeto de uma pessoa sem stack definido.
- Multi-harness (`AGENTS.md`) — já testado e revertido no projeto de referência.
- Contexto só no `CLAUDE.md`, sem skills — inflaria o arquivo carregado em todo turno.

## Consequências

- Positivas: um lugar para editar; nada para montar antes de abrir a sessão; lint impede
  regressão estrutural.
- Negativas: outro agente de IA precisa ser instruído a ler `CLAUDE.md` e `.claude/skills`.
  Repo público exige disciplina com dado pessoal (`context/rules/development-rules.md`).
- Custo: zero.

## Como verificar que está sendo seguida

`node scripts/check-skills.mjs` verde; não existe `AGENTS.md` nem `.agents/`; toda skill do projeto
tem prefixo `tvos-` e linha no catálogo.
