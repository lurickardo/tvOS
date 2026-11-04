---
name: tvos-webos-api
description: >-
  Integração do tvOS com o sistema da TV LG (webOS TV 4.x rootada, ADR 0007): barramento Luna via
  PalmServiceBridge (src/platform/luna.ts, timeout, null em falha, lunaSubscribe), catálogo de chamadas provadas
  (abrir app, listar apps com listLaunchPoints e o fallback SSAP com
  pareamento, entradas HDMI pelo eim, info do sistema, rede pelo connectionmanager, ajustes,
  screensaver), appinfo.json (resolution, requiredPermissions, disableBackHistoryAPI,
  supportQuickStart, requiredACG só no webOS 26+), JS service do pacote (service/, services.json,
  webos-service, Node 0.12 = ES5, métricas por /proc em assinatura, allowlist de métodos), tvOS
  como home (defaultApps.home, webOSRelaunch, visibilitychange), tecla Voltar, ponteiro e origem file://. Acione ao chamar qualquer API da TV,
  mexer em appinfo.json ou service/, ler dado do sistema (CPU, memória, rede, modelo, entradas),
  abrir app/entrada/ajustes, e em erros como "invalid origin", "listLaunchPoints negado",
  "serviço não responde". Instalação na TV fica em tvos-deploy.
---

# tvOS — APIs do webOS (Luna, appinfo, JS service)

> **Regra de ouro:** toda chamada ao sistema passa por `src/platform/` (UI nunca chama
> `PalmServiceBridge` direto), tem timeout e trata `null` como "indisponível". Chamada nova só
> entra no catálogo depois de **funcionar na TV**; até lá fica marcada "verificar".

## Invariantes

1. **TV rootada** (ADR 0007/0008): a página não tem privilégio; o service é **elevado** pelo
   Homebrew (`tvos-root.js elevate`, refeito no boot e no `tv:install`) e faz, por `tvService()`, o
   que a página não pode: `uninstall` (só app de loja) e `closeLgHome`. Root de sistema (settings,
   preload, hosts) só em `root/tvos-root.js`.
2. **Wrapper único** `luna(uri, params, timeoutMs)` em `src/platform/luna.ts`: devolve
   `Promise<resultado | null>`, guarda a bridge até a resposta (senão o GC a coleta) e no PC
   responde `null` — o app roda no navegador sem quebrar. Leitura periódica = `lunaSubscribe`
   (cancela ao parar): poll de método de service sobe um Node novo por chamada (medido).
3. **JS service** (`service/`) é a saída para o que a página não alcança (arquivos de `/proc`,
   socket local). Node **0.12.2** → só ES5 (sem `const`/`let`, arrow, template string, `?.`), sem dependência além de `webos-service`.
   **Métodos em allowlist**; parâmetro só validado/limitado (`stats` aceita `interval` 2–60 s).
4. IDs: app `com.lurickardo.tvos`; service `com.lurickardo.tvos.service` (precisa começar com o
   id do app). URI: `luna://com.lurickardo.tvos.service/<método>`.
5. App roda em `file://`: `fetch` externo sofre CORS com origem `null`; o socket de controle
   remoto (`127.0.0.1:3000`) recusa a origem da página em webOS novos → vai pelo service.

## appinfo.json (`app/appinfo.json`)

| Campo | Valor | Por quê |
|---|---|---|
| `resolution` | `1280x720` | TV Full HD desenha app em 720p; o palco de 1920×1080 é escalado (ADR 0006) |
| `disableBackHistoryAPI` | `true` | o app trata a tecla Voltar (461) |
| `supportQuickStart` | `true` | reabre rápido |
| `handlesRelaunch` | `false` | relançar = trazer para frente |
| `requiredPermissions` | `applications`, `applications.launcher`, `system.notifications` | listar/abrir apps, avisos |
| `requiredACG` | não usar | ACG só existe do webOS TV 26 em diante; o aviso do `ares-package` pode ser ignorado |

## Teclas e entrada

Voltar = 461 (também `Escape`/`GoBack` no PC). Na raiz não faz nada: o tvOS é a home.

## tvOS como home (ADR 0007)

- Tecla Home → `systemUi.js` lança `general.defaultApps.home` (setting; fábrica: `com.webos.app.fullhome`).
  Voltar na raiz de outro app também volta para ela.
- Home com o tvOS já aberto dispara `webOSRelaunch` (mesmo com `handlesRelaunch: false`) → `goHome()`.
- Escondido (`document.hidden`) o app para assinatura de métricas, FPS e clima; ao voltar relê apps.
- Shell root: `luna-send ... </dev/null` (sem stdin solto não imprime nada).
- `/dev/input` não serve para tecla global: o `lginput2` prende o controle. LG Input Hook recusado
  (1.5.x quebra o webOS 4.10; 1.4.0 abre root sem senha na porta 1842) — ADR 0008.
- `appInstallService/remove` responde antes de terminar e o `listLaunchPoints` demora a refletir:
  o app sai da prateleira na hora (`forgetApp`).
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
