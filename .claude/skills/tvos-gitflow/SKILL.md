---
name: tvos-gitflow
description: >-
  Gitflow, branches, commits, PRs, release com tag semver e acompanhamento de pipeline (GitHub
  Actions) do repo público lurickardo/tvOS: main estável, develop integração, feat/fix a partir de
  develop, hotfix a partir de main, uma branch de trabalho por vez, template de corpo de PR e de
  release, pr.yml verde antes do merge, mensagens pt-BR no imperativo sem Co-Authored-By.
  Consulte ANTES de criar branch, commitar, abrir PR, fazer merge, criar tag/release ou declarar
  algo publicado, e em pedidos como "abre o PR", "faz o merge", "sobe uma release", "qual tag",
  "o pipeline passou?", "hotfix", "qual branch base".
---

# tvOS — Gitflow e pipelines

Repo **público** `lurickardo/tvOS`. CI: `.github/workflows/pr.yml` — job `context` (check-skills +
check-encoding) e job `app` (`npm ci`, typecheck, `tv:package`). Release não publica `.ipk`
(uso pessoal; instala-se com `npm run tv:install`).

## Branches

- **`main`** → estável (o que está na TV). **`develop`** → integração. Ambas de vida longa. Branch
  padrão do GitHub é `main`; a base dos PRs de feature é `develop` — passe `--base develop` sempre.
- **`feat/<nome>`** (feature), **`fix/<nome>`** (correção), saindo de `develop`.
- **Uma branch de trabalho por vez:** fora de `develop`/`main`, pedido novo continua na branch
  atual (commit por entrega); a próxima nasce depois do PR.
- **`hotfix/<nome>`** saindo de `main`: PR para `main` (patch + tag + release) **e** PR de volta
  para `develop`, senão a próxima release desfaz o fix.

## Fluxo

```bash
git switch develop && git pull
git switch -c feat/<nome>
# ... commits (toda entrega termina em commit; confira que nada pessoal/segredo entrou no diff) ...
git push -u origin feat/<nome>
gh pr create --base develop --head feat/<nome> \
  --title "<Assunto no imperativo>" --body-file <arquivo-temporário>.md   # nunca --fill
gh pr checks <pr> --watch                      # pr.yml verde ANTES do merge
gh pr merge <pr> --merge --delete-branch
```

Corpo da PR de feature:

```markdown
## O quê
- <mudança visível para quem usa>
## Por quê
<problema/pedido em 1–2 frases; ADR/spec quando houver>
## Como verificar
- <check/pipeline/passo com o controle ou na TV>
## Docs/skills
- <lista> (ou "sem alteração")
## Riscos
- <o que pode quebrar> (ou "nenhum")
```

## Release (develop → main)

Sem branch de release: **PR `develop` → `main`** + **tag anotada** + **GitHub Release**.

```bash
git fetch origin --tags
git log --oneline origin/main..origin/develop          # o que vai subir
gh pr create --base main --head develop --title "Release vX.Y.Z — <resumo>" --body-file <notas>.md
gh pr checks <pr> --watch
gh pr merge <pr> --merge                                # SEM --delete-branch (develop fica)
git fetch origin
git tag -a vX.Y.Z origin/main -m "vX.Y.Z — <resumo>"
git push origin vX.Y.Z
gh release create vX.Y.Z --verify-tag --title "vX.Y.Z — <resumo>" --notes-file <notas>.md
```

Notas da release (corpo da PR = notas):

```markdown
## vX.Y.Z — <resumo curto>
**Tipo:** minor · patch · major   ·   **Anterior:** vX.Y.(Z-1)
### Novidades
- <o que muda para quem usa>
### Correções
- <bug corrigido> (omita se vazio)
### PRs incluídas
- #<n> <título>
### Verificação
- `pr.yml` verde; testado na TV (<versão do webOS>, FPS, CPU/memória) ou "não testado na TV: <motivo>"
### Rollback
- reinstalar a versão anterior (vX.Y.(Z-1)) / PR revertendo o merge
```

Semver: patch = correção, minor = feature compatível, major = quebra de contrato (formato de dado
salvo, API, protocolo).

## Acompanhar pipeline

```bash
gh run list --branch <branch> --limit 1 --json databaseId,status,conclusion,workflowName,headSha
gh run watch <id> --exit-status
gh run view <id> --log-failed
```

> **Sucesso = `conclusion: success` E `headSha` == `git rev-parse origin/<branch>`.** Run verde de
> commit antigo não conta.

## Regras absolutas

- **Commit só com o autor da conta.** Nunca `Co-Authored-By`, nunca menção a IA.
- **Mensagem pt-BR, imperativo**, assunto curto ("Adiciona …", "Corrige …"); corpo só quando o
  porquê não é óbvio.
- **Repo público:** antes de todo push, `git diff --cached` sem segredo, IP/MAC da TV, chave,
  `.ipk`, dado pessoal.
- **Nunca** force push em `main`/`develop`, reescrita de histórico ou apagar tag sem pedido
  explícito.
- Sem branch protection configurada: a disciplina acima (PR + `pr.yml` verde) é a proteção.

---

Fontes: skill `fantasy-quest-gitflow` do autor, `context/rules/release-rules.md`. Em conflito,
`CLAUDE.md` vence.
