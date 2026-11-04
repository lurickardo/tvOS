---
name: tvos-gitflow
description: >-
  Git, commits, release com tag semver e acompanhamento de pipeline (GitHub Actions) do repo
  público lurickardo/tvOS: SEM feature branches — trabalho e commit direto em develop (padrão) ou
  main; release de develop para main por tag semver + GitHub Release; pr.yml verde, mensagens
  pt-BR no imperativo sem Co-Authored-By. Consulte ANTES de commitar, subir release, criar tag ou
  declarar algo publicado, e em pedidos como "sobe uma release", "qual tag", "o pipeline passou?",
  "qual branch".
---

# tvOS — Gitflow e pipelines

Repo **público** `lurickardo/tvOS`. CI: `.github/workflows/pr.yml` — job `context` (check-skills +
check-encoding) e job `app` (`npm ci`, typecheck, `tv:package`). Release não publica `.ipk`
(uso pessoal; instala-se com `npm run tv:install`).

## Branches

- **`sem feature branches`**: trabalhe e commite **direto em `develop`** (padrão) ou `main`. Nada
  de `feat/*`/`fix/*`/`hotfix/*` — decisão do dono para este projeto pessoal.
- **`main`** → estável (o que está na TV). **`develop`** → integração/trabalho. Ambas de vida longa.
- Branch padrão do GitHub é `main`.

## Fluxo

```bash
git switch develop            # (ou main) — é onde o trabalho acontece
# ... edita e commita direto (toda entrega termina em commit;
#     confira que nada pessoal/segredo entrou no diff) ...
git commit -m "<Assunto no imperativo>"
git push                       # só quando o usuário pedir
```

Correção urgente do que está na TV: commit direto em `main`, depois traga `main` de volta para
`develop` (`git merge main`) para a próxima release não desfazer o fix.

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
