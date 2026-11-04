---
name: tvos-apis-externas
description: >-
  APIs externas do tvOS (ADR 0004): TMDB para filmes e séries em alta (trending movie/tv da
  semana, language pt-BR, token de leitura v4 no header Authorization vindo do .env no
  build local (ADR 0005), nunca no repo), tamanhos de imagem leves (pôster w342, backdrop w780,
  w1280 só no hero medido, nunca original), atribuição obrigatória do TMDB; Open-Meteo para clima,
  previsão por hora, nascer/pôr do sol e geocoding de cidade, sem chave; regras de rede (timeout,
  cache com TTL no localStorage, offline com último dado, CSP com domínios declarados, sem
  telemetria). Acione ao buscar filmes/séries, montar banner/hero/pôster, mostrar clima, adicionar
  chamada HTTP ou domínio, e em perguntas como "qual tamanho de imagem?", "onde guardo a chave do
  TMDB?", "como pego o clima?". APIs da própria TV ficam em tvos-webos-api.
---

# tvOS — APIs externas (TMDB, Open-Meteo)

> **Regra de ouro:** toda chamada externa tem timeout, cache e plano para "sem rede"; toda imagem
> vem no menor tamanho que fica bom na tela. Domínio novo = ADR + CSP.

## Regras de rede

1. Um módulo por fonte (`src/features/<x>/api.ts` ou repository), nunca `fetch` na UI.
2. `fetch` com `AbortController` e timeout de 8 s; validar a forma da resposta antes de usar.
3. Cache no `localStorage` com `{ savedAt, data }` e TTL (TMDB 1 h, clima 30 min); abrir a tela
   com o cache e atualizar depois. Leitura com `try/catch` (dado velho ou corrompido = sem cache).
4. Sem rede: mostrar o último dado com "desatualizado"; sem cache, estado vazio com mensagem.
5. CSP do `app/index.html` lista os domínios: `api.themoviedb.org`, `image.tmdb.org`,
   `api.open-meteo.com`, `geocoding-api.open-meteo.com`. Nada além disso.
6. **Sem telemetria**, sem geolocalização por IP.

## TMDB

| Item | Valor |
|---|---|
| Base | `https://api.themoviedb.org/3` |
| Em alta | `/trending/movie/week`, `/trending/tv/week` (`?language=pt-BR`) |
| Detalhe (gêneros, temporadas) | `/movie/{id}`, `/tv/{id}` (`?language=pt-BR`) — só do card em foco |
| Gêneros (cache longo) | `/genre/movie/list`, `/genre/tv/list` |
| Auth | header `Authorization: Bearer <token de leitura v4>` (nunca `api_key` na URL) |
| Imagens | `https://image.tmdb.org/t/p/<tamanho><file_path>` |

**Tamanhos (ADR 0004):**

| Uso | Tamanho | Peso típico |
|---|---|---|
| Pôster na fileira | `w342` | ~30–60 KB |
| Card em foco / backdrop | `w780` | ~60–150 KB |
| Hero tela cheia | `w1280` **só se** `w780` ficar visivelmente ruim na TV (medir) | ~150–300 KB |
| Qualquer coisa | **nunca `original`** | MBs |

- Título sem tradução: o TMDB devolve o original; mostre o que vier.
- **Chave** (ADR 0005): a pessoa cria em themoviedb.org → Configurações → API (token de leitura
  v4, começa com `eyJ`) e põe em `TMDB_TOKEN` no `.env`; o build injeta em `config.tmdbToken`
  (`src/config.ts`). A IA nunca pede a chave no chat, nunca lê o `.env` e nunca grava o token em
  arquivo versionado; se aparecer no chat, não repita.
- Sem chave → seção de destaques mostra como configurar (não cards vazios).
- **Atribuição** na tela "Sobre": logo do TMDB + "Este produto usa a API do TMDB, mas não é
  endossado nem certificado pelo TMDB."

## Open-Meteo

| Item | Valor |
|---|---|
| Previsão | `https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code&daily=sunrise,sunset&timezone=auto&forecast_days=1` |
| Cidade → coordenadas | `https://geocoding-api.open-meteo.com/v1/search?name=<cidade>&count=1&language=pt` |
| Chave | não precisa |
| Condição | `weather_code` (WMO) → texto pt-BR + ícone (tabela no código) |

Cidade vem de `CITY` no `.env` (`config.city`; padrão `São Vicente, São Paulo`, o `.env` vence), no formato `<cidade>, <estado>` (ex.: `São Vicente,
São Paulo`; o nome sozinho acha cidades de outros países). Geocoding com `countryCode=BR`, `count=1`;
coordenadas no cache (geocoding só ao trocar a cidade).
Confirme parâmetros na doc atual (context7 / open-meteo.com/en/docs) antes de mudar a URL.

## Skills irmãs

- `tvos-security` — token no `localStorage`, CSP, dado externo não confiável.
- `tvos-performance` — imagem no tamanho exibido, cache.
- `tvos-produto` — o que destaques e clima mostram.

---

Fontes: ADR 0004, developer.themoviedb.org (trending, images, auth v4), open-meteo.com/en/docs,
README do FreeMyTvWebOS (seção de conexões de rede), `free-my-tv/web/data.js`. Em conflito, a doc
atual da API vence — consulte antes de mudar endpoint.
