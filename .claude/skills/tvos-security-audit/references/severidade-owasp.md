# Severidade, score e mapeamento OWASP/CWE

## Conteúdo
- Rubrica de severidade
- Score de risco
- Prioridade (P1/P2/P3)
- OWASP Top 10 2025
- OWASP API Security Top 10 2023
- CWE mais usados

## Rubrica de severidade

Impacto × explorabilidade, ajustado ao produto (credencial de serviço e acesso ao sistema da TV
valem mais que dado público; código alcançável > código morto; quem está na LAN é atacante
plausível).

| Severidade | Critério | Exemplos no tvOS |
|---|---|---|
| crítica | remoto, sem pré-condição forte → execução de script, segredo real, controle da TV | chave privada no bundle/git; XSS por conteúdo de feed público; serviço na LAN sem auth que chama Luna |
| alta | sério com pré-condição leve (estar na LAN, conteúdo de fonte semi-confiável) | `postMessage` sem origem que dispara ação; URL `javascript:` aceita; token em URL/log; dependência runtime com CVE alta alcançável |
| média | impacto limitado ou condição específica | CSP com `unsafe-inline`; storage sem validação derruba o app; retry infinito; erro vazando detalhe |
| baixa | defesa em profundidade | source map no pacote; `http:` na LAN sem necessidade; header ausente no backend |
| info | observação sem risco direto | placeholder em doc; fixture de teste local |
| needs-review | candidato não confirmado | grep suspeito que pede validação humana ou teste dinâmico |

Regras:
- Gap "(conhecido)" mantém a severidade real; conhecido não é mitigado.
- Condição de explorabilidade reduz no máximo um nível e precisa estar escrita.
- Mesma causa em N lugares = 1 achado com N locais; severidade do pior local.

## Score de risco

`score = crítica×10 + alta×5 + média×2 + baixa×1` (info e needs-review não contam).

| Faixa | Leitura |
|---|---|
| 0 | limpo |
| 1–9 | baixo |
| 10–29 | atenção |
| 30–59 | alto |
| 60+ | crítico |

## Prioridade (P1/P2/P3)

- **P1** — antes de qualquer release/exposição: crítica e alta de execução/segredo/acesso.
  Segredo real: rotacionar primeiro (ação humana), depois remover do código.
- **P2** — próximo ciclo: alta restante e média com impacto em credencial ou estabilidade.
- **P3** — endurecimento: média restante, baixa.

## OWASP Top 10 2025

| Código | Categoria | Onde aparece aqui |
|---|---|---|
| A01:2025 | Broken Access Control (inclui SSRF) | serviço na LAN sem auth, iframe com acesso a `platform`, backend sem checagem de dono |
| A02:2025 | Security Misconfiguration | CSP frouxa, CORS `*`, Dev Mode ligado, source map publicado |
| A03:2025 | Software Supply Chain Failures | audit, typosquat, `postinstall`, versão não fixada |
| A04:2025 | Cryptographic Failures | segredo versionado/no bundle, token sem expiração, `http:` com credencial |
| A05:2025 | Injection (inclui XSS) | HTML externo, URL `javascript:`, parâmetro de Luna montado com texto externo |
| A06:2025 | Insecure Design | ação sensível sem confirmação, privilégio amplo para iframe |
| A07:2025 | Authentication Failures | pareamento fraco, token reaproveitável, logout que não limpa |
| A08:2025 | Software or Data Integrity Failures | storage/arquivo aceito sem validação, atualização sem verificação |
| A09:2025 | Security Logging & Alerting Failures | log com token/dado pessoal |
| A10:2025 | Mishandling of Exceptional Conditions | `catch {}` em validação, fail-open, stack exposta |

## OWASP API Security Top 10 2023

Só se houver backend ou serviço na LAN; senão, "n/a" no relatório.

| Código | Categoria |
|---|---|
| API1 | BOLA (recurso por id sem conferir dono) |
| API2 | Broken Authentication |
| API3 | Broken Object Property Level Authorization |
| API4 | Unrestricted Resource Consumption |
| API5 | Broken Function Level Authorization |
| API6 | Unrestricted Access to Sensitive Business Flows |
| API7 | SSRF |
| API8 | Security Misconfiguration |
| API9 | Improper Inventory Management |
| API10 | Unsafe Consumption of APIs |

## CWE mais usados

| CWE | Nome |
|---|---|
| 79 | XSS |
| 94 / 95 | Injeção de código / `eval` |
| 601 | Open redirect |
| 346 / 1385 | Origem não validada / `postMessage` sem origem |
| 798 / 540 | Credencial hardcoded / segredo em fonte |
| 922 | Armazenamento inseguro de dado sensível |
| 200 / 209 | Exposição de dado / detalhe em erro |
| 532 | Dado sensível em log |
| 306 / 862 | Autenticação / autorização ausente |
| 770 | Alocação sem limite |
| 755 | Tratamento impróprio de exceção (fail-open) |
| 942 | CORS permissivo |
| 1104 | Componente não mantido/não verificado |
