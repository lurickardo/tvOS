# 0005 — Configuração pessoal pelo `.env`, injetada no build local

Status: aceito (2026-11-04)
Decisores: Lurickardo
Substitui: item 2 do ADR 0004 (token TMDB digitado na TV)

## Contexto

O ADR 0004 previa digitar o token do TMDB na TV. O token de leitura v4 tem ~200 caracteres:
digitar com o controle é inviável. O usuário vai pôr as chaves e informações num `.env`. O `.ipk`
deste projeto é de uso pessoal: é gerado no PC do usuário e instalado só na TV dele; nenhuma
release publica o pacote (`tvos-gitflow`).

## Decisão

1. `.env` na raiz (ignorado pelo git) guarda a configuração pessoal. `.env.example` (versionado)
   documenta cada chave: `TV_IP`, `TMDB_TOKEN`, `CITY`.
2. `scripts/build.mjs` lê o `.env` e injeta `TMDB_TOKEN` e `CITY` no bundle
   (`define __TVOS_CONFIG__`, lido por `src/config.ts`). Falta de valor = recurso desligado, sem
   quebrar o build (o CI builda sem `.env`).
3. `TV_IP` só é usado no PC: `npm run tv:setup` cadastra a TV no ares e busca a chave SSH.
4. **Passphrase do Developer Mode nunca vai para o `.env`**: é digitada uma vez no terminal, no
   prompt do `ares-novacom`.
5. **`.ipk` e `dist/` gerados com `.env` nunca são publicados** (release, PR, chat): carregam o
   token. O servidor de dev escuta só em `127.0.0.1`.
6. Ajustes na própria TV (trocar cidade etc.) podem vir depois e sobrescrever o `.env`, guardados no
   `localStorage`.

## Alternativas consideradas

- Digitar na TV (ADR 0004): inviável para o token.
- QR code para colar pelo celular (como o free-my-tv): bom, mas exige um servidor local ou serviço
  externo; fica para depois se fizer falta.

## Consequências

- Positivas: configuração em um arquivo, sem digitar nada na TV.
- Negativas: o token fica dentro do bundle no PC (`dist/`) e na TV — mesma exposição que o
  `localStorage` previsto antes (token só de leitura; risco aceito em `tvos-security`).
- Custo: zero.

## Como verificar que está sendo seguida

`git ls-files | grep -E '^\.env$'` vazio; `.env.example` sem valores; `git grep -n eyJ` sem token;
`scripts/build.mjs` serve em `127.0.0.1`.
