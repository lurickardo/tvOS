---
name: tvos-security
description: >-
  Segurança do tvOS e modo revisão rápida: modelo de ameaça de uma interface web rodando na TV da
  casa (rede local, conteúdo e URLs externas, mídia por USB/rede, APIs do sistema webOS/Luna,
  Developer Mode com SSH, apps e iframes de terceiros, backend opcional), regras para código novo
  (dado externo não confiável, XSS, CSP, segredo fora do bundle, storage, CORS de file://,
  postMessage, dependências e supply chain, privacidade de uso), checklist por tipo de mudança e
  saída path:linha. Acione ao mexer em rede, fetch, URL, conteúdo HTML/Markdown externo, iframe,
  armazenamento local, credencial/token, API do sistema da TV, upload/leitura de arquivo, nova
  dependência ou qualquer coisa exposta na rede, e em pedidos como "isso é seguro?", "revise a
  segurança do diff", "revise permissões". Auditoria profunda do projeto inteiro com relatório é
  /tvos-security-audit.
---

# tvOS — Segurança

Atores: **pessoas da casa** (usuário do controle), **rede local** (outros dispositivos, quem está
no Wi-Fi), **internet** (serviços e conteúdo consumido), **terceiros** (libs, apps/iframes
embutidos). Ativos: contas e tokens de serviços, histórico/hábitos de uso, a própria TV (APIs do
sistema, Developer Mode) e a rede da casa.

> **Regra de ouro:** nada vindo de fora do código é confiável — resposta de rede, URL, arquivo do
> USB, mensagem de outro frame, dado do `localStorage`. Valide a forma na entrada, escape na saída,
> e dê a cada parte só o privilégio que ela precisa.

## Regras (código novo)

1. **Conteúdo externo nunca vira HTML cru.** Texto via `textContent`/escape do framework; HTML ou
   Markdown externo só depois de sanitizer (ex.: DOMPurify) com allowlist. Proibido `eval`,
   `new Function`, `setTimeout("string")`, `innerHTML` com dado externo.
2. **URL externa validada**: só `https:` (e `http:` só na LAN, com decisão consciente); bloquear
   `javascript:`, `data:` em `href`/`src` de origem externa.
3. **CSP** desde o primeiro HTML: `default-src 'self'`; liberar origem por origem; sem
   `unsafe-eval`; `unsafe-inline` só com ADR.
4. **Segredo nunca no cliente.** Bundle da TV é público para quem tiver o `.ipk`/a URL: nada de
   chave de API privada, client secret, senha. Variável pública de build (ex.: `VITE_*`) é pública.
   Se precisar de segredo, ele mora num backend (ADR + gate de custo).
5. **Token/credencial**: menor escopo e menor duração possível; nunca em log, URL ou query string;
   storage local só para o que aceita ser lido por quem tem acesso à TV; logout limpa tudo.
6. **Dado persistido é entrada**: ler `localStorage`/arquivo com `try/catch` + validação de forma
   (dado corrompido ou de versão antiga não derruba o app).
7. **`postMessage`**: sempre conferir `event.origin` e a forma da mensagem; enviar com origem alvo
   explícita (nunca `'*'` com dado sensível). Iframe de terceiro com `sandbox` mínimo.
8. **APIs do sistema (webOS/Luna)**: chamadas centralizadas num módulo `platform`; cada uma
   justificada; nunca montar URI/parâmetro de Luna com texto do usuário sem validação.
9. **Rede local**: serviço que escuta na LAN (se existir) exige autenticação/pareamento e escopo
   mínimo; descoberta (SSDP/mDNS) trata resposta como não confiável.
10. **Developer Mode**: chave, passphrase e IP da TV fora do git; Dev Mode desligado quando não
    estiver desenvolvendo (SSH aberto na rede).
11. **Dependência nova**: necessária? mantida? licença? tamanho? `npm audit`/equivalente limpo de
    crítica/alta alcançável; versão fixada no lockfile. Pacote com `postinstall` desconhecido =
    suspeito.
12. **Privacidade**: telemetria/analytics só com decisão explícita (ADR) e nada que identifique a
    casa; logs sem conteúdo assistido, tokens ou dados pessoais.
13. **Erro**: mensagem genérica ao usuário, detalhe técnico só no log local; nunca fail-open em
    checagem (erro na validação = negar).
14. **JS service** (`service/`): métodos em allowlist, sem parâmetro livre da página virando
    caminho de arquivo, comando ou URI; só lê o necessário (`/proc/stat`, `/proc/meminfo`).
15. **CSP** do `app/index.html`: `connect-src`/`img-src` só com os domínios do ADR 0004; domínio
    novo = ADR. Nada de `unsafe-eval`.
16. **Developer Mode**: Key Server OFF depois de instalar; passphrase digitada pela pessoa, nunca no
    chat, em arquivo ou argumento de comando (`tvos-deploy`).

## Gaps conhecidos

| # | Gap | Severidade |
|---|---|---|
| 1 | Token TMDB (v4, só leitura) fica em texto puro no `localStorage` da TV (ADR 0004): quem tem acesso à TV/Dev Mode lê | baixa (risco aceito) |
| 2 | `@webos-tools/cli` traz vulnerabilidades transitivas (express/`proxy-addr` crítica, `body-parser`, `js-yaml`, eslint…): só ferramenta de dev no PC, nunca vai ao `.ipk`; atualizar a CLI quando houver versão nova | média (só dev) |
| 3 | Socket SSAP (`127.0.0.1:3000`) devolve `client-key` que abre o controle remoto da TV: guardar só para listar apps, nunca expor nem logar; service só repassa `listLaunchPoints` | média (quando implementado) |

## Roteador

| Quero… | Carregue |
|---|---|
| Modelo de ameaça detalhado, controles esperados, checklist por tipo de mudança | `references/modelo-de-ameaca.md` |

## Modo revisão (rápida)

Acionado por "revise a segurança do diff", "isso é seguro?". **Read-only.** Auditoria profunda do
projeto inteiro (todas as superfícies, histórico git, dependências, relatório) é
`/tvos-security-audit`.

1. Escopo: diff atual (`git diff develop...HEAD`) ou pasta pedida.
2. Para cada arquivo: HTML/URL externa sem sanitizar, segredo/credencial, `eval`, `postMessage`
   sem origem, storage sem validação, chamada de sistema sem justificativa, dependência nova,
   log de dado sensível, CSP afrouxada.
3. `grep` direcionado (lista em `references/modelo-de-ameaca.md`).
4. Saída: uma linha por achado — `path:linha: [crítica|alta|média|baixa] problema. correção.` —
   ordenada por severidade, gaps já conhecidos marcados "(conhecido)". Terminar com bloco
   **Prompt de Remediação** (texto copiável para outra sessão corrigir).
5. Não corrigir durante a revisão; não dizer "sem problemas" sem listar o que foi checado.

## Skills irmãs

- `tvos-security-audit` — auditoria profunda com relatório.
- `tvos-code-patterns` — onde mora cada responsabilidade (módulo `platform`, repository).
- `tvos-verify` — itens de veto de segurança no gate de entrega.

---

Fontes: skills `fantasy-quest-security`/`-security-audit` do autor (regras, modo auditoria, saída
path:linha), OWASP Top 10 2025, OWASP ASVS, documentação de segurança do webOS TV. Em conflito, o
código real vence.
