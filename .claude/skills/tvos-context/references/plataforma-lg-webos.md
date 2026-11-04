# Plataforma — LG 43UP7500PSF e webOS TV 6.x

## Conteúdo
- Ficha do hardware
- webOS TV e motor web
- O que o Chromium 79 NÃO tem
- Entrada: controle remoto e ponteiro
- App web no webOS (resumo)
- UI de 3 metros
- Perguntas que só a TV responde

## Ficha do hardware

| Item | Valor | Nota |
|---|---|---|
| Modelo | LG 43UP7500PSF (linha UP75, 2021) | versão brasileira |
| Tela | 43", LED, 4K UHD 3840×2160, 60 Hz | TV UHD desenha app com `resolution: 1920x1080` nesse tamanho (TV Full HD/HD usa 1280×720, free-my-tv #402) — **verificar** `window.innerWidth` |
| HDR | HDR10, HLG | |
| Processador | Quad Core 4K | CPU/GPU modestas: anime só `transform`/`opacity` |
| Memória | não divulgada | trate como dispositivo de **pouca RAM**; app pesado é encerrado pelo sistema; total real: painel do tvOS ou `npx ares-device -d tv -r` |
| Conexões | 2× HDMI (uma com ARC), 1× USB, Wi-Fi, Bluetooth, LAN | entradas `com.webos.app.hdmi1`/`hdmi2` (`tvos-webos-api`) |
| Sistema | webOS TV 6.x | ThinQ AI, assistente de voz |
| Controle | Magic Remote (setas, OK, Voltar, ponteiro, roda) ou controle simples | **verificar** qual veio |

## webOS TV e motor web

| webOS TV | Ano | Motor |
|---|---|---|
| 5.x | 2020 | Chromium 68 |
| **6.x** | **2021 (esta TV)** | **Chromium 79** |
| 22 | 2022 | Chromium 87 |
| 23 | 2023 | Chromium 94 |
| 24 | 2024 | Chromium 108 |

JS service (Node.js): webOS TV 6.0 = **Node 8.12** (ES2017; sem `?.`/`??`), webOS 22 = 12.21,
webOS 24 = 16.19.

Fonte: tabela "Web engine" do webOS TV Developer. Web Inspector (`ares-inspect`) do 6.x funciona
com Chrome recente no PC.

## O que o Chromium 79 NÃO tem

Precisa de transpile (alvo `chrome79` no bundler/Babel/TS), polyfill ou alternativa:

| Recurso | Chegou em | Alternativa |
|---|---|---|
| Optional chaining `a?.b`, nullish `a ?? b` | Chrome 80 | transpile |
| `String.prototype.replaceAll` | 85 | `split/join` ou regex com `g` |
| Atribuição lógica `??=`, `\|\|=`, `&&=` | 85 | transpile |
| Métodos/acessores privados `#m()` | 84 | transpile (campos `#x` já existem desde 74) |
| `Promise.any`, `AggregateError` | 85 | polyfill |
| Top-level `await` | 89 | função `async` de entrada |
| `Array.prototype.at`, `Object.hasOwn` | 92 / 93 | índice, `Object.prototype.hasOwnProperty.call` |
| `structuredClone` | 98 | `JSON.parse(JSON.stringify())` para dado simples |
| CSS `gap` em **flexbox** | 84 | margem nos filhos (grid `gap` funciona) |
| CSS `:focus-visible` | 86 | classe de foco própria controlada pela navegação |
| CSS `inset` | 87 | `top/right/bottom/left` |
| CSS `aspect-ratio` | 88 | hack do `padding-top` |
| CSS `:is()`, `:where()` | 88 | seletores explícitos |
| CSS `@container`, `:has()` | 105 | layout fixo para 1920×1080 |

Funcionam: ES modules, `import()` dinâmico, `async/await`, classes com campos públicos e `#x`,
`Promise.allSettled`, `IntersectionObserver`, `ResizeObserver`, CSS Grid, custom properties,
`position: sticky`, Web Animations básico.

Antes de usar API/CSS moderno: confira no MDN/caniuse a coluna Chrome ≤ 79 ou teste na TV.

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
- **Ponteiro do Magic Remote**: evento `cursorStateChange` (`event.detail.visibility`). Com
  ponteiro visível, hover move o foco; ao sumir, a navegação por setas continua de onde o foco
  estava. Nunca dependa de hover para mostrar ação.
- Navegação espacial (setas entre elementos) não é nativa: precisa de implementação ou lib
  (decisão de stack — ADR).

## App web no webOS (resumo)

Decidido no ADR 0002: app `.ipk` pelo Developer Mode, sem root.

- Passo a passo do Developer Mode, `ares-*`, renovação da sessão e problemas de instalação:
  skill `tvos-deploy`.
- `appinfo.json`, chamadas Luna, JS service, Voltar/`platformBack`: skill `tvos-webos-api`.
- App roda de `file://`: chamada HTTP externa sofre CORS como origem `null`; o servidor precisa
  permitir (TMDB e Open-Meteo permitem) ou a chamada sai pelo JS service.
- IP da TV, chave e passphrase **não entram no git** (`.gitignore` cobre `*.ipk`, `*.pem`, `*.key`).

## UI de 3 metros

| Regra | Por quê |
|---|---|
| Foco **sempre** visível e óbvio (contorno + escala/brilho), um elemento focado por vez | sem mouse, o foco é o cursor |
| Ordem de foco previsível: setas seguem o layout visual; nunca "prender" o foco | navegação espacial |
| Safe area ~5% nas bordas (≈ 96 px × 54 px em 1920×1080) | overscan e conforto |
| Texto de corpo ≥ 24 px CSS em 1920×1080; título ≥ 36 px | leitura a 3 m |
| Alvos grandes e espaçados; ação principal a ≤ 2 cliques do início | controle impreciso |
| Contraste AA (≥ 4,5:1), sem informação só por cor; cores do controle sempre com rótulo | TVs variam muito |
| Animação curta (≤ 300 ms), só `transform`/`opacity`; respeite `prefers-reduced-motion` | GPU modesta |
| Estados vazio/carregando/erro em toda tela, com saída pelo Voltar | não há botão "fechar" universal |

## Perguntas que só a TV responde

Registre a resposta aqui ao descobrir: versão exata do webOS, `innerWidth`/`devicePixelRatio`,
keyCodes de mídia/canal, se o Magic Remote veio, memória livre para o app, se o navegador da TV
abre o app hospedado (caso "web hospedado").
