# 0006 — TV de destino é a LG 43LM631C0SB (webOS TV 4.x, Chromium 53)

Status: aceito (2026-11-04)
Decisores: Lurickardo
Substitui: o alvo de plataforma do ADR 0003 (Chromium 79, Node 8.12, `lib: ES2019`, service ES2017)

## Contexto

O projeto foi planejado para a LG 43UP7500PSF (webOS TV 6.x, Chromium 79). Ao rodar
`npm run tv:setup` com o `TV_IP` do `.env`, a TV que respondeu a `ares-device -i` se identificou
como:

- modelo **43LM631C0SB**, placa `M3R_ATSC_KR`, OTA `HE_DTV_W19R_AFAAATAA`;
- **SDK 4.10.0, firmware 05.40.97** → webOS TV **4.x**.

Pela documentação da LG, webOS TV 4.x usa **Chromium 53** no app e **Node 0.12.2** nos JS
services (webOS 6: Chromium 79 e Node 8.12). Modelos Full HD desenham a interface dos apps em
**1280×720**. O usuário confirmou que esta é a TV de destino (a 43UP7500PSF deixa de ser alvo).

## Decisão

1. **Alvo de código:** Chromium 53. `scripts/build.mjs` com `target: chrome53`; `tsconfig` com
   `target`/`lib` ES2016; typecheck barra API ausente (`Object.entries`, `padStart`,
   `AbortController`…). Sintaxe nova (`async`, spread, `?.`) é rebaixada pelo esbuild.
2. **JS service em ES5** (Node 0.12.2): sem `const`/`let`, arrow, template string. Escrito à mão,
   sem transpile.
3. **Resolução:** `appinfo.json` com `1280x720`; o palco de 1920×1080 do design é escalado por
   `window.innerWidth / 1920` (`src/main.ts`), então o layout aprovado não muda.
4. **CSS sem Grid, sem flex `gap`, sem `sticky`** (Chrome 53); layout por flexbox e posição
   absoluta no palco fixo.
5. **Rede sem `AbortController`:** `XMLHttpRequest` com `timeout` e `abort()`.
6. **Performance ainda mais restrita:** hardware de 2019 → modo "lite" (sem sombras animadas, só
   `transform`/`opacity`) é o padrão, não exceção.
7. Valem sem mudança os ADRs 0001, 0002, 0004 e 0005 e o restante do 0003 (TypeScript + esbuild,
   sem framework, zero dependência em runtime, orçamento de performance).

## Alternativas consideradas

- Manter o alvo webOS 6 e ignorar a TV real: o app não rodaria (async/await, spread e `?.` já
  quebram no Chromium 53 sem rebaixar; o service em ES2017 não sobe no Node 0.12).
- Mirar as duas TVs: o código mais antigo roda na mais nova, então nada impede, mas só a
  43LM631C0SB é testada e documentada.

## Consequências

- Positivas: o esqueleto já foi migrado (bundle de ~1 KB gzip, sem sintaxe acima de ES2016);
  código de alvo antigo funciona também em TVs mais novas.
- Negativas / riscos a verificar na TV:
  - `listLaunchPoints` pode ser negado (o free-my-tv relata isso no webOS 3); fallback em
    `tvos-webos-api`.
  - Web Inspector (`tv:inspect`) pode exigir um Chrome compatível no PC.
  - Quantas portas HDMI, painel Full HD ou HD, tipo de controle: ainda não medidos.
  - Recursos de CSS e JS modernos ficam fora do alcance (tabela em `tvos-context`).
- Custo mensal: zero.

## Como verificar que está sendo seguida

`grep chrome53 scripts/build.mjs`; `"lib": ["ES2016", "DOM"]` no `tsconfig.json`;
`grep -nE "=>|\bconst\b|\blet\b|\`" service/index.js` sem código (só comentários);
`npx ares-device -i -d tv` mostra `sdkVersion : 4.x`.
