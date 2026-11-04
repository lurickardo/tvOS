# Relatório, findings.json e prompts

## Conteúdo
- Onde gravar
- Schema do findings.json
- Estrutura do report.md
- Prompt de Remediação (por achado)
- Prompt de implementação (sessão nova)

## Onde gravar

```
.security/reports/<AAAA-MM-DD-HHMM>/
  findings.json   ← fonte única
  report.md       ← escrito a partir do findings.json
  gitleaks.json   ← só se o scanner rodou (com --redact)
```

`.security/` está no `.gitignore`. Pasta nova por execução; não sobrescreva auditoria antiga.

## Schema do findings.json

```jsonc
{
  "project": "tvos",
  "date": "AAAA-MM-DD HH:MM",
  "commit": "<sha curto>",
  "branch": "<branch>",
  "scope": "repo inteiro (interface, plataforma, rede, storage, build, deps, histórico git)",
  "summary": "1–3 frases: estado geral, tema dominante, o que corrigir primeiro.",
  "methodology": ["XSS → checado HTML cru, sanitizer, URLs e CSP"],
  "strengths": [{ "title": "Conteúdo externo escapado", "evidence": "src/ui/Tile.ts — só textContent" }],
  "weaknesses": ["Riscos centrais em 1 linha cada"],
  "findings": [
    {
      "id": "F-01",
      "severity": "alta",           // critica | alta | media | baixa | info | needs-review
      "priority": "P1",             // P1 | P2 | P3
      "category": "XSS/HTML",       // XSS/HTML | URL | postMessage/iframe | CSP | Segredos | Storage | Plataforma | Rede/LAN | Backend | Dependências | Erro/log | Recursos
      "title": "Descrição do feed renderizada com innerHTML",
      "owasp": "A05:2025",
      "cwe": "CWE-79",
      "locations": ["src/features/feed/render.ts:42"],
      "snippet": "el.innerHTML = item.description;",
      "exploit": "Item de feed com <img onerror> executa script na TV.",
      "condition": "Fonte do feed comprometida ou maliciosa.",
      "impact": "Script com acesso ao módulo platform e aos tokens salvos.",
      "fix": "textContent, ou sanitizer com allowlist antes de inserir.",
      "known": false,
      "source": "manual",           // manual | npm-audit | gitleaks | semgrep | dinamico
      "remediationPrompt": "texto auto-suficiente (regras abaixo)"
    }
  ],
  "dependencies": [{ "package": "x", "version": "1.2.3", "severity": "alta", "verdict": "runtime alcançável", "advisory": "GHSA-…" }],
  "secrets": [{ "location": "src/config.ts:3", "type": "API key", "prefix": "sk-a…", "status": "real" }],
  "coverage": {
    "inputs": [{ "location": "src/features/feed/api.ts:10", "origin": "fetch RSS", "validation": "nenhuma", "sink": "innerHTML", "verdict": "F-01" }],
    "checked": ["14 entradas externas", "histórico git (N commits)"],
    "notChecked": ["pacote .ipk (não gerado)"],
    "notApplicable": ["API Top 10 — sem backend"],
    "scanners": [{ "name": "npm audit", "ran": true, "note": "" }]
  },
  "implementationPrompt": "texto do prompt de implementação (template abaixo)"
}
```

Nunca coloque valor de segredo em campo nenhum — `prefix` tem no máximo 4 caracteres + `…`.

## Estrutura do report.md

1. Cabeçalho: projeto, data, commit, branch, escopo, metodologia.
2. Resumo executivo: score + faixa, contagem por severidade (tabela), `summary`.
3. Pontos fortes e fracos.
4. Achados por categoria: tabela `Sev | Arquivo:linha | Título`.
5. Detalhe de cada achado: evidência (trecho), exploração, condição, impacto, correção, Prompt de
   Remediação.
6. Dependências · segredos mascarados · cobertura (entradas, checado, não checado, n/a, scanners).
7. Recomendações P1/P2/P3.
8. **Prompt de implementação**.

## Prompt de Remediação (por achado)

Bloco que, sozinho, basta para outra IA corrigir **aquele** achado:

1. `path:linha` exatos.
2. Classificação numa linha (`A05:2025 · CWE-79`).
3. O problema em 1–2 frases concretas (nada de "corrija a vulnerabilidade").
4. A correção ancorada no padrão real do repo (sanitizer usado, módulo `platform`, validação na
   borda), citando o arquivo que já faz certo, se houver.
5. Guard-rails: o que não mudar e como provar (teste, tela na TV, payload que antes passava).
6. Texto auto-suficiente: quem colar não viu o relatório.

## Prompt de implementação (sessão nova)

Um bloco ao final do relatório e do resumo no chat. Preencha os `<…>`; ordem P1 → P3, achados da
mesma causa agrupados:

```text
Contexto:
Auditoria de segurança do tvOS em .security/reports/<pasta>/report.md (findings.json ao lado).
Score <n> (<faixa>): <c> crítica, <a> alta, <m> média, <b> baixa.

Atividade:
Corrigir os achados abaixo, nesta ordem, sem expandir escopo.
Use as skills tvos-security e tvos-code-patterns.

P1
- F-01 [<sev>] <path:linha> — <problema>. Correção: <padrão real + arquivo-modelo>.
P2
- …
P3
- …

Importante:
- Branch fix/seguranca-<AAAA-MM-DD> a partir de develop; um commit por grupo (P1, P2, P3),
  mensagem pt-BR imperativa, sem Co-Authored-By.
- Segredo real: NÃO tente rotacionar nem reescrever histórico — liste como ação humana no relato.
- Item que exija decisão de produto/ADR: pare e pergunte.

DoD:
- Cada achado corrigido com prova (teste ou payload que antes passava e agora é bloqueado).
- node scripts/check-encoding.mjs; build/test do stack verdes.
- Tabela de gaps de .claude/skills/tvos-security/SKILL.md atualizada.
- Relato final curto: o que mudou, ações humanas pendentes, docs/skills alteradas.
```
