---
name: tvos-security-audit
description: >-
  Auditoria de segurança profunda e read-only do tvOS inteiro (código da interface, integração com
  APIs do webOS/Luna, rede e conteúdo externo, storage, iframes/apps embutidos, backend se existir,
  build e pacote .ipk, dependências e histórico git) contra OWASP Top 10 2025, API Top 10 2023 e
  CWE. Inventaria superfícies antes de procurar, percorre TODAS as entradas externas, caça segredo
  no código, no bundle e no histórico, XSS, URL perigosa, postMessage sem origem, CSP fraca,
  supply chain. Só achado verificado com path:linha e trecho; registra também o que está correto.
  Gera findings.json + report.md em .security/reports/ (fora do git) com Prompt de Remediação por
  achado e um Prompt de implementação para colar numa sessão nova. Acione com "auditoria de
  segurança profunda", "varredura de segurança", "relatório de segurança", "pentest do código",
  antes de release ou de expor algo na rede. NÃO corrige código; regras e gaps conhecidos ficam
  em tvos-security.
# Desligada do acionamento automático (economia de tokens); use /tvos-security-audit quando precisar.
disable-model-invocation: true
---

# tvOS — Auditoria de segurança

Skill **ofensiva de leitura**: acha onde o código real viola as regras de `tvos-security`, aponta
`path:linha` com trecho, classifica (OWASP/CWE + severidade) e entrega relatório com prompts de
correção. Revisão rápida de diff continua no modo revisão do `tvos-security`.

## Regras invioláveis

1. **Read-only.** Só escreve em `.security/reports/<AAAA-MM-DD-HHMM>/` (ignorado pelo git; o repo
   é público — achado explorável nunca vai para o git). Nunca corrige.
2. **Só achado verificado.** Cada um com `path:linha`, trecho, por que é explorável, condição de
   explorabilidade e severidade. Hit de grep não confirmado → `needs-review`, nunca descartado em
   silêncio nem promovido a achado.
3. **Registra o que está correto** (pontos fortes com evidência). Prova a cobertura.
4. **Categoria que não se aplica → diga** ("sem backend: API1–API10 n/a"). O que não foi checado
   vai em "Não auditado".
5. **Nunca imprime segredo** — nem no chat, nem no relatório: tipo + 4 primeiros caracteres + `…`.
   Não abre `.env` para ler valor; só checa se está versionado.
6. **Scanner externo só com aprovação** (gitleaks, semgrep, osv-scanner), sempre efêmero
   (`docker run --rm` / `npx`/`pipx run`), nunca instalação global. `npm audit` e `git` rodam livres.
7. **Nada de escrita** em serviço externo, conta ou TV. Teste dinâmico só contra `localhost` ou a
   TV em Developer Mode, só se já estiver no ar e com aprovação.
8. Gap já listado em `tvos-security` entra como achado com marca **(conhecido)** — confirme se
   ainda existe e atualize `path:linha`.

## Superfícies (inventarie e conte antes de procurar)

| Superfície | O que procurar |
|---|---|
| Entradas externas | todo `fetch`/XHR/WebSocket, leitura de arquivo/USB, `message` de frame, query string, storage — tabela de cobertura com: origem · validação · saída (onde o dado é exibido/usado) · veredito |
| Renderização | HTML cru, sanitizer ausente/frouxo, URL em `href`/`src`, SVG inline, `eval` |
| Plataforma | chamadas Luna/webOS, permissões no `appinfo.json`, parâmetros vindos de fora |
| Isolamento | iframes (`sandbox`, origem), `postMessage` (origem/forma), CSP do HTML |
| Credenciais | tokens/chaves no código, bundle, storage, logs, URL |
| Backend/LAN (se existir) | rotas sem auth, CORS, rate limit, segredo, IDOR (aplique API Top 10) |
| Build/pacote | `dist/` e `.ipk` com source map, `.env`, arquivo pessoal; CSP no HTML final |
| Dependências | `npm audit --json` (ou equivalente do stack), typosquat, `postinstall`, licença |
| Histórico git | arquivos e padrões de segredo em qualquer commit/branch |

Greps de partida: `tvos-security` → `references/modelo-de-ameaca.md` (seção "Greps de revisão").
Histórico:

```bash
git log --all --diff-filter=A --name-only --format= | sort -u | grep -iE '\.env|\.pem|\.key|secret|credential|\.ipk'
git log --all -G 'AKIA[0-9A-Z]{16}|sk-[A-Za-z0-9]{20,}|ghp_[A-Za-z0-9]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY' --format='%h %ad %s' --date=short
```

## Workflow (siga em ordem)

0. **Escopo** — padrão: repo inteiro. Aceita pasta ou diff (`git diff develop...HEAD`). Anote
   commit (`git rev-parse --short HEAD`) e branch.
1. **Recon** — stack real, ponto de entrada, módulo `platform`, backend existe? Inventário de
   superfícies acima, com contagem.
2. **Tooling** — `npm audit --json` (ou equivalente). Ofereça gitleaks/semgrep efêmeros; recusado
   → siga e anote a lacuna.
3. **Tabela de cobertura** de toda entrada externa (nada de amostra).
4. **Varredura por categoria**: XSS/HTML · URL/navegação · postMessage/iframe · CSP · segredos
   (árvore, bundle, histórico) · storage · plataforma/Luna · rede/LAN · backend · supply chain ·
   erro/log/fail-open · consumo de recurso (listas, imagens, retry).
5. **Teste dinâmico (opcional)** — com aprovação e ambiente no ar: promover `needs-review` a
   confirmado. Nunca contra serviço de terceiro.
6. **Severidade e score** — `references/severidade-owasp.md`. Deduplique (mesma causa em N lugares
   = 1 achado com N locais). Atribua P1/P2/P3.
7. **Relatório** — `findings.json` + `report.md` no formato de `references/relatorio-e-prompts.md`.
8. **Resumo no chat** — contagem por severidade + score, top 5 (`sev · OWASP · path:linha`),
   caminhos gerados e o **Prompt de implementação** completo, pronto para colar em sessão nova.

## Roteador

| Quero… | Carregue |
|---|---|
| Rubrica de severidade, score, prioridade e mapeamento OWASP 2025 / API 2023 / CWE | `references/severidade-owasp.md` |
| Schema do `findings.json`, estrutura do `report.md` e os dois tipos de prompt | `references/relatorio-e-prompts.md` |

## Skills irmãs

- `tvos-security` — regras, modelo de ameaça e tabela de gaps (base de comparação).
- `tvos-code-patterns` — padrão da correção (módulo `platform`, repository, validação na borda).
- `tvos-verify` — itens de veto de segurança no gate de entrega.

---

Fontes: skill `fantasy-quest-security-audit` do autor (read-only, cobertura total, pontos fortes,
n/a explícito, score, prompts de remediação), OWASP Top 10 2025, OWASP API Security Top 10 2023,
CWE. Em conflito, o código vence.
