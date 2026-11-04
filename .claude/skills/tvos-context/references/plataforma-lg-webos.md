# Plataforma — LG 43LM631C0SB e webOS TV 4.x

## Conteúdo
- Ficha do hardware
- webOS TV e motor web
- O que o Chromium 53 NÃO tem
- Node 0.12 no JS service
- Entrada: controle remoto e ponteiro
- App web no webOS (resumo)
- UI de 3 metros
- Perguntas que só a TV responde

## Ficha do hardware

Alvo desde o ADR 0006. Dados em **medido** vieram de `npx ares-device -i -d tv` (2026-11-04);
o resto é **verificar**. A 43UP7500PSF (webOS 6) deixou de ser alvo.

| Item | Valor | Nota |
|---|---|---|
| Modelo | LG **43LM631C0SB** (medido) | placa `M3R_ATSC_KR`, OTA `HE_DTV_W19R_AFAAATAA` (linha W19R = 2019) |
| Sistema | webOS TV **4.x** (medido: SDK 4.10.0, firmware 05.40.97) | Chromium 53 no app, Node 0.12.2 no service |
| Tela | 43", provável **Full HD** 1920×1080 — **verificar** | modelos Full HD desenham apps em **1280×720** (LG); `appinfo.json` usa `1280x720` e o palco 1920×1080 é escalado pelo menor de `innerWidth/1920` e `innerHeight/1080`, centralizado (`src/platform/stage.ts`) |
| CPU | **4 núcleos** (medido) | ~12% em repouso (medido, `ares-device -r`) |
| Memória | **658 MB** de RAM total, ~160 MB disponíveis em repouso, **~300 MB de swap em uso** (medido, 2026-11-04) | a TV já troca memória com o armazenamento: **RAM é o gargalo**; orçamento do tvOS em `tvos-performance` |
| Conexões | HDMI, USB, Wi-Fi, Bluetooth — **verificar quantas portas HDMI** | entradas `com.webos.app.hdmi1`/`hdmi2` (`tvos-webos-api`) |
| Controle | **verificar** se veio Magic Remote (ponteiro/roda) ou controle simples | navegação por setas funciona nos dois |

## webOS TV e motor web

| webOS TV | Ano | Motor | Node (service) |
|---|---|---|---|
| 3.x | 2016–2017 | Chromium 38 | 0.12.2 |
| **4.x** | **2018–2019 (esta TV)** | **Chromium 53** | **0.12.2** |
| 5.x | 2020 | Chromium 68 | 8.12.0 |
| 6.x | 2021 | Chromium 79 | 8.12.0 |
| 22 | 2022 | Chromium 87 | 12.21.0 |

Fonte: tabelas "Web engine" e "Supported Node.js version" do webOS TV Developer. Web Inspector
(`ares-inspect`) de TV antiga pode exigir Chrome compatível no PC (a LG lista Chrome 68 para
webOS 5 e Chrome 38 para 3.x; para 4.x **verificar** — se o inspector não abrir no Chrome atual,
ver `tvos-debug`).

## O que o Chromium 53 NÃO tem

O `tsconfig` (`lib: ES2016`) barra a API ausente; o esbuild (`target: chrome53`) rebaixa a
sintaxe. Confira em caniuse/MDN (coluna Chrome ≤ 53) antes de usar algo novo.

| Recurso | Chegou em | Alternativa |
|---|---|---|
| `async`/`await` | 55 | rebaixado pelo esbuild (vira generator + helper) |
| Spread/rest de objeto `{...a}` | 60 | rebaixado pelo esbuild |
| Optional chaining `?.`, nullish `??` | 80 | rebaixado pelo esbuild |
| `Object.entries`, `Object.values` | 54 | `Object.keys(o).map(k => [k, o[k]])` |
| `String.prototype.padStart`/`padEnd` | 57 | `('0' + n).slice(-2)` |
| `AbortController` | 66 | `XMLHttpRequest` com `timeout` e `abort()` |
| `ResizeObserver` | 64 | evento `resize` da janela; layout fixo |
| `Promise.prototype.finally` | 63 | `.then(f, f)` |
| `Array.prototype.flat`/`flatMap`, `Object.fromEntries` | 69 / 73 | `reduce`/laço |
| `globalThis`, `queueMicrotask` | 71 | `window`, `Promise.resolve().then` |
| CSS Grid | 57 | flexbox; posição absoluta no palco fixo |
| CSS `gap` em flexbox | 84 | margem nos filhos |
| CSS `position: sticky` | 56 | posição absoluta |
| CSS `min()`/`max()`/`clamp()` | 79 | valores em px (palco fixo) |
| CSS `inset`, `aspect-ratio`, `:is()`, `:focus-visible` | 87 / 88 / 88 / 86 | `top/right/…`, hack do `padding-top`, seletores explícitos, classe de foco própria |

Funcionam: `let`/`const`, arrow, classes, template strings, `Promise`, `fetch` (sem abort),
`Array.prototype.includes`, `**`, `IntersectionObserver`, custom properties (`var(--x)`),
`requestAnimationFrame`, `Intl.DateTimeFormat`, `localStorage`.

## Node 0.12 no JS service

O `service/` roda em Node 0.12.2: **só ES5** (`var`, `function`, concatenação de string), sem
`let`/`const`, arrow, template string, `Buffer.from` (use `new Buffer`), `Object.assign`. Módulos
nativos (`fs`, `net`) e `webos-service` (do sistema). Não há transpile do `service/`: escreva
ES5 à mão (molde: `service/index.js`).

## Entrada: controle remoto e ponteiro

Eventos `keydown` com `keyCode`:

| Tecla | keyCode |
|---|---|
| ← ↑ → ↓ | 37, 38, 39, 40 |
| OK | 13 |
| **Voltar** | **461** (`0x1CD`) |
| Vermelho, Verde, Amarelo, Azul | 403, 404, 405, 406 |
| Play, Pause, Stop, Retroceder, Avançar | 415, 19, 413, 412, 417 — **verificar** no controle |
| Canal +/- | 33, 34 — **verificar** |
| 0–9 | 48–57 |

- **Voltar**: o padrão do webOS navega no histórico; para tratar a tecla no app, `appinfo.json`
  com `"disableBackHistoryAPI": true` e capture 461. Voltar na tela raiz deve sair/minimizar, não
  travar.
- **Ponteiro do Magic Remote** (só se a TV tiver o controle com ponteiro): evento `cursorStateChange` (`event.detail.visibility`). Com
  ponteiro visível, hover move o foco; ao sumir, a navegação por setas continua de onde o foco
  estava. Nunca dependa de hover para mostrar ação.
- Navegação espacial (setas entre elementos) não é nativa: precisa de implementação ou lib
  (decisão de stack — ADR).

## App web no webOS (resumo)

Decidido no ADR 0007 (substitui o 0002): app `.ipk` instalado pelo SSH root e definido como home
(`general.defaultApps.home`). Não dá para trocar o SO: rootfs assinado e só-leitura.

- `ares-*` no device `tv-root`, root/debloat e problemas de instalação: skill `tvos-deploy`.
- `appinfo.json`, chamadas Luna, JS service, Voltar, `webOSRelaunch`: skill `tvos-webos-api`.
- App roda de `file://`: chamada HTTP externa sofre CORS como origem `null`; o servidor precisa
  permitir (TMDB e Open-Meteo permitem) ou a chamada sai pelo JS service.
- IP da TV, chave e passphrase **não entram no git** (`.gitignore` cobre `*.ipk`, `*.pem`, `*.key`).

## UI de 3 metros

| Regra | Por quê |
|---|---|
| Foco **sempre** visível e óbvio (contorno + escala/brilho), um elemento focado por vez | sem mouse, o foco é o cursor |
| Ordem de foco previsível: setas seguem o layout visual; nunca "prender" o foco | navegação espacial |
| Safe area ~5% nas bordas (≈ 96 px × 54 px no palco 1920×1080) | overscan e conforto |
| Texto de corpo ≥ 24 px no palco 1920×1080 (≈ 16 px reais em 1280×720 — não desça disso); título ≥ 36 px | leitura a 3 m |
| Alvos grandes e espaçados; ação principal a ≤ 2 cliques do início | controle impreciso |
| Contraste AA (≥ 4,5:1), sem informação só por cor; cores do controle sempre com rótulo | TVs variam muito |
| Animação curta (≤ 300 ms), só `transform`/`opacity`; respeite `prefers-reduced-motion` | GPU modesta |
| Estados vazio/carregando/erro em toda tela, com saída pelo Voltar | não há botão "fechar" universal |

## Perguntas que só a TV responde

Já medido: modelo, webOS 4.x, 4 núcleos, 658 MB de RAM, `/proc` legível pelo usuário do Developer
Mode (é de onde o `ares-device -r` lê). `ares-shell` **não funciona** no perfil `tv` do ares.

Registre a resposta aqui ao descobrir: `window.innerWidth`/`innerHeight` reais (esperado 1280×720),
painel Full HD ou HD, quantas portas HDMI, keyCodes de mídia/canal, se há Magic Remote, memória
total e livre para o app, se `listLaunchPoints` é negado nesta TV, se o inspector abre no Chrome
atual.
