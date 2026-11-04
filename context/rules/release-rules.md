# Release Rules

- **Todo merge é por PR documentada**, nos dois saltos: `feat/*`/`fix/*` → `develop` e
  `develop` → `main`. Nada de `git merge` local empurrado para `develop`/`main`. Corpo da PR no
  template da skill `tvos-gitflow` (o quê, por quê, como verificar, docs/skills, riscos); nunca
  `--fill`.
- **`pr.yml` verde antes de todo merge.** Check falhando não se contorna; corrige-se.
- **Subida para `main` = PR `develop` → `main` ("Release vX.Y.Z — …") + tag anotada + GitHub
  Release** com as notas (novidades, correções, PRs incluídas, verificação na TV, rollback).
- **Tag semver** (`vMAJOR.MINOR.PATCH`): patch = correção, minor = feature compatível, major =
  quebra de contrato (formato de dado salvo, API, protocolo).
- **Release = testado na TV real** (ou o relato diz explicitamente que não foi e por quê).
- Fluxo completo e comandos: skill `tvos-gitflow`.
