# 0004 — Dados externos: TMDB com imagens leves e Open-Meteo, sem telemetria

Status: aceito (2026-11-04); item 2 (token digitado na TV) substituído por 0005
Decisores: Lurickardo

## Contexto

A home mostra destaques de filmes e séries (hero, banners) e o clima. O usuário exigiu **imagens
leves**; se a fonte só tivesse 4K, ficaria de fora. O TMDB escolhe o tamanho pela URL
(`image.tmdb.org/t/p/<tamanho>/<arquivo>`), então o peso fica sob nosso controle. O Open-Meteo é
grátis e não tem chave.

## Decisão

1. **TMDB** para filmes e séries em alta:
   - pôster `w342`, backdrop `w780`; `w1280` só no hero e só se a medição na TV mostrar perda
     visível;
   - **nunca `original`**;
   - `language=pt-BR` em toda chamada.
2. **Chave TMDB é do usuário**:
   - token de leitura v4 enviado no header `Authorization: Bearer`, digitado na TV
     (configurações) e guardado no `localStorage`;
   - **nunca** no repo, no bundle, em log ou em URL.
   - Sem chave, a parte do TMDB some (sem fallback pago).
3. **Atribuição TMDB obrigatória** na tela "Sobre": "Este produto usa a API do TMDB, mas não é
   endossado nem certificado pelo TMDB", com o logo.
4. **Open-Meteo** para clima e nascer/pôr do sol (`api.open-meteo.com`), cidade por
   `geocoding-api.open-meteo.com`. Sem geolocalização por IP (privacidade).
5. **Cache** no `localStorage` com TTL (TMDB 1 h, clima 30 min). Sem rede, mostra o último dado
   com indicação de desatualizado.
6. **Sem telemetria e sem analytics.** A CSP (`app/index.html`) libera `connect-src`/`img-src`
   só para esses domínios; domínio novo = ADR.

## Alternativas consideradas

- TVMaze (sem chave) como fallback de séries: pode entrar depois, se fizer falta; hoje é YAGNI.
- Embutir uma chave TMDB do projeto: o bundle é público; quem tem o `.ipk` extrai a chave.

## Consequências

- Positivas: imagens de dezenas de KB em vez de MB; nenhum segredo no repo; superfície de rede
  pequena e declarada na CSP.
- Negativas: o token fica em texto puro no `localStorage` da TV (só leitura de catálogo; risco
  aceito, registrado em `tvos-security`); sem chave, não há destaques.
- Custo: zero (planos grátis do TMDB e do Open-Meteo, uso pessoal).

## Como verificar que está sendo seguida

`grep -rn "t/p/original" src` vazio; nenhum token em `git grep`; CSP do `app/index.html` só com
domínios deste ADR.
