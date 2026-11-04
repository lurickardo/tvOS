---
name: tvos-webos-api
description: >-
  Integração do tvOS com o sistema da TV LG (webOS TV 6.x, sem root): barramento Luna via
  PalmServiceBridge (src/platform/luna.ts, timeout, null em falha), catálogo de chamadas provadas
  pelos projetos de referência (abrir app, listar apps com listLaunchPoints e o fallback SSAP com
  pareamento, entradas HDMI pelo eim, info do sistema, rede pelo connectionmanager, ajustes,
  screensaver), appinfo.json (resolution, requiredPermissions, disableBackHistoryAPI,
  supportQuickStart, requiredACG só no webOS 26+), JS service do pacote (service/, services.json,
  webos-service, Node 8.12 = ES2017, métricas por /proc, allowlist de métodos), tecla Voltar e
  platformBack, ponteiro do Magic Remote e origem file://. Acione ao chamar qualquer API da TV,
  mexer em appinfo.json ou service/, ler dado do sistema (CPU, memória, rede, modelo, entradas),
  abrir app/entrada/ajustes, e em erros como "invalid origin", "listLaunchPoints negado",
  "serviço não responde". Instalação na TV fica em tvos-deploy.
---

# tvOS — APIs do webOS (Luna, appinfo, JS service)

> **Regra de ouro:** toda chamada ao sistema passa por `src/platform/` (UI nunca chama
> `PalmServiceBridge` direto), tem timeout e trata `null` como "indisponível". Chamada nova só
> entra no catálogo depois de **funcionar na TV**; até lá fica marcada "verificar".

## Invariantes

1. **Sem root** (ADR 0002): só o que um app de Developer Mode pode chamar. Nada de
   `org.webosbrew.hbchannel.service`.
2. **Wrapper único** `luna(uri, params, timeoutMs)` em `src/platform/luna.ts`: devolve
   `Promise<resultado | null>`, guarda a bridge até a resposta (senão o GC a coleta) e no PC
   responde `null` — o app roda no navegador sem quebrar.
3. **JS service** (`service/`) é a saída para o que a página não alcança (arquivos de `/proc`,
   socket local). Node **8.12** → ES2017, sem `?.`/`??`, sem dependência além de `webos-service`.
   **Métodos em allowlist**, sem parâmetro livre vindo da página.
4. IDs: app `com.lurickardo.tvos`; service `com.lurickardo.tvos.service` (precisa começar com o
   id do app). URI: `luna://com.lurickardo.tvos.service/<método>`.
5. App roda em `file://`: `fetch` externo sofre CORS com origem `null`; o socket de controle
   remoto (`127.0.0.1:3000`) recusa a origem da página em webOS novos → vai pelo service.

## appinfo.json (`app/appinfo.json`)

| Campo | Valor | Por quê |
|---|---|---|
| `resolution` | `1920x1080` | TV UHD desenha app em 1080p (TV Full HD/HD usa 1280x720) |
| `disableBackHistoryAPI` | `true` | o app trata a tecla Voltar (461) |
| `supportQuickStart` | `true` | reabre rápido |
| `handlesRelaunch` | `false` | relançar = trazer para frente |
| `requiredPermissions` | `applications`, `applications.launcher`, `system.notifications` | listar/abrir apps, avisos |
| `requiredACG` | não usar | ACG só existe do webOS TV 26 em diante; o aviso do `ares-package` pode ser ignorado |

## Teclas e entrada

Voltar = 461 (também `Escape`/`GoBack` no PC). Na raiz: `exitApp()` → `PalmSystem.platformBack()`.
Ponteiro do Magic Remote: `cursorStateChange` (`detail.visibility`). Tabela completa de keyCodes:
`tvos-context`.

## Roteador

| Quero… | Carregue |
|---|---|
| Catálogo de chamadas Luna (URI, parâmetros, resposta, status provado/verificar), fallback SSAP, molde de JS service e leitura de `/proc` | `references/luna-catalogo.md` |

## Skills irmãs

- `tvos-deploy` — empacotar, instalar, inspecionar na TV.
- `tvos-security` — allowlist do service, dado externo, Key Server.
- `tvos-produto` — o que cada dado do sistema alimenta.

---

Fontes: webostv.developer.lge.com (back button, webOS events, JS service basics, ACG guide),
`free-my-tv/web/tv.js` e `webos/service/service.js` (`a9e1027`), `FreeMyTvWebOS/app/index.html`
(`465ef69`), `src/platform/luna.ts`, `service/index.js`. Em conflito, o que a TV real responde vence.
