---
name: tvos-performance
description: >-
  Performance do tvOS na TV LG 43LM631C0SB (webOS 4, Chromium 53, CPU e GPU modestas, pouca RAM) —
  critério número 1 do projeto: orçamentos (bundle ≤ 60 KB gzip, 60 fps, abrir < 1 s, tecla <
  100 ms), como medir (overlay de FPS, npm run tv:monitor / ares-device -r, Performance e Memory no
  ares-inspect), técnicas que funcionam em TV (só transform/opacity, sem backdrop-filter, sombras
  estáticas, camadas na medida, DOM pequeno, atualizações em lote no requestAnimationFrame, imagem
  no tamanho exibido, lazy, modo lite por navigator.deviceMemory, fonte do sistema, cache, polling só
  visível) e o que evitar, com números medidos pelo free-my-tv em TVs LG. Acione ao criar tela,
  animação, lista, imagem, polling, ao adicionar dependência ou fonte, quando a TV estiver lenta,
  travando ou fechando sozinha, e em perguntas "isso pesa?", "por que caiu o FPS?", "dá para
  animar isso?".
---

# tvOS — Performance

> **Regra de ouro:** a TV mede, não a intuição. Mudança visual ou de dados que possa pesar é
> medida **na TV** (FPS + CPU/memória) antes e depois. Passou do orçamento → simplifique a feature,
> não peça desculpa ao orçamento.

## Orçamentos (ADR 0003)

| Métrica | Alvo | Como medir |
|---|---|---|
| Bundle JS | ≤ 60 KB gzip | `gzip -c dist/app/main.js \| wc -c` após `npm run build` |
| Navegação | 60 fps (nunca < 50 ao mover foco) | FPS na gaveta (Sistema) do tvOS |
| Abrir o app | < 1 s até a prateleira com foco | `performance.now()` no boot + cronômetro na TV |
| Resposta à tecla | < 100 ms | Performance no `npm run tv:inspect` |
| Memória do processo | **≤ 40 MB** e estável (sem subir a cada navegação) — a TV tem 658 MB no total, ~160 MB livres e já usa swap | `npm run tv:monitor` por alguns minutos |
| Imagem | ≤ ~150 KB cada | Network no inspector |

## Técnicas que funcionam

1. **Anime só `transform` e `opacity`**, ≤ 300 ms, `cubic-bezier` curto. Foco = `scale` +
   `translateY`, nunca `width`/`top`/`margin`.
2. **Sem `backdrop-filter`** (blur): pesado na GPU de TV; use superfície semi-opaca
   (`rgba(28,28,30,.72)`). O FreeMyTvWebOS precisa de "modo performance" para desligar o blur.
3. **Sombras**: fixas nos elementos; no foco troque por uma pseudo-camada com `opacity` em vez de
   animar `box-shadow`. free-my-tv mediu em LG de 1,3–1,5 GB: 23–28 fps → 60 sem sombras/animações
   pesadas; 45–50 → 55 só tirando sombras.
4. **Modo lite por padrão** nesta TV de 2019 (ADR 0006; `navigator.deviceMemory` não existe no
   Chromium 53): sem sombras animadas e sem transições não essenciais (`<html class="lite">`).
5. **DOM pequeno**: só o que está na tela + 1 de folga; lista longa virtualizada; nada escondido
   com `display:none` pesando na memória (remova).
6. **Leitura e escrita de layout separadas**; mudanças agrupadas num `requestAnimationFrame`.
   Nada de `offsetWidth` dentro de loop de escrita.
7. **Imagens no tamanho exibido** (TMDB `w342`/`w780`, nunca `original` — ADR 0004),
   `decoding="async"`, carregue a próxima fora do caminho do foco; descarte as que saíram.
8. **Fonte do sistema** (`'LG Smart UI'`, fallback Helvetica/Arial). Fonte embutida só subset
   WOFF2 ≤ 50 KB com ADR.
9. **Nada roda com o tvOS escondido**: ele é a home residente (ADR 0007). `visibilitychange` para
   métricas, FPS (rAF só na gaveta) e clima; dado periódico de service = **assinatura** (poll sobe
   um Node novo por chamada — medido).
10. **Cache** de dados de rede no `localStorage` com TTL: a tela abre com o último dado e atualiza
    depois.
11. **Zero dependência em runtime** sem medir o custo (bundle + parse + memória).
12. **Timers, listeners e subscriptions** sempre com cleanup (vazamento = app encerrado pela TV).

## Sistema da TV (medido, 2026-11-04)

`npm run tv:root -- status` mostra memória, swap, carga e top RSS. Ruído alto: Netflix em
segundo plano sozinho ocupa ~114 MB; meça com só o tvOS em frente.

| Momento | MemAvailable | Swap usado |
|---|---|---|
| Home da LG de fábrica, TV ao vivo em frente (18 min) | 198 MB | 226 MB |
| tvOS em frente, antes do debloat (25 min) | 177 MB | 275 MB |
| tvOS home + debloat (ADR 0007), só tvOS em frente (~9 min) | 256 MB | 227 MB |

Maiores ganhos: `fullhome` fora (66 MB + swap), preload sem streaming, 8 daemons parados. Ainda
residente: `com.webos.app.home` (barra LG, ~17 MB + swap; ignora `closeByAppId`), TV ao vivo e
HDMI 1–3 pré-carregados (escolha do usuário).

## Checklist de regressão (tela nova ou mudança visual)

1. `npm run build` → bundle dentro do orçamento.
2. Na TV, overlay de FPS ligado: mover o foco por toda a tela, abrir/fechar gaveta → ≥ 55 fps.
3. `npm run tv:monitor` por 3 min navegando → memória sem subir sem parar.
4. Network: nenhuma imagem acima do tamanho exibido.
5. Performance (inspector): nenhuma tarefa longa (> 50 ms) ao apertar tecla.

## Skills irmãs

- `tvos-design-system` — o visual já nasce dentro destes limites.
- `tvos-code-patterns` — estrutura, cleanup, fronteiras.
- `tvos-deploy` — `tv:monitor`, `tv:inspect`.

---

Fontes: ADR 0003, `free-my-tv/web/tv.js` e `web/home.css` (medições em LGs de 1,3–1,5 GB),
README do FreeMyTvWebOS (modo performance), guias de renderização do Chromium. Em conflito, a
medição na TV vence.
