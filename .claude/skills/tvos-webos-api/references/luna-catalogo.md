# Catálogo Luna, SSAP e JS service

## Conteúdo
- Status das chamadas
- Apps
- Entradas
- Sistema e rede
- Ajustes
- Screensaver
- Fallback SSAP (lista de apps)
- JS service: molde e /proc

## Status das chamadas

- **provado (ref)**: usado em produção pelo FreeMyTvWebOS/free-my-tv; falta confirmar nesta TV.
- **provado (tvOS)**: funcionou nesta TV — anote a data.
- **verificar**: documentado ou suposto; teste antes de depender.

Ao confirmar na TV, troque o status aqui (REGRA 1).

## Apps

| Chamada | Parâmetros | Resposta útil | Status |
|---|---|---|---|
| `luna://com.webos.applicationManager/launch` | `{ id, params? }` | `returnValue` | provado (ref) |
| `luna://com.webos.applicationManager/listLaunchPoints` | `{}` | `launchPoints[]`: `id`, `title`, `icon`, `largeIcon` | **provado na TV** (rootada); negado a apps de Dev Mode em alguns webOS → SSAP |
| `luna://com.webos.applicationManager/getAppLoadStatus` | `{ appId }` | se está instalado | provado (ref, free-my-tv) |

Abrir app: ignore OK repetido enquanto a abertura está pendente; sem resposta em 8 s → mensagem.

## Entradas

| Chamada | Parâmetros | Resposta útil | Status |
|---|---|---|---|
| `luna://com.webos.service.eim/getAllInputStatus` | `{}` | `devices[]`: `id` (`HDMI_1`…, `AV_1`, `COMP_1`), `port`, `label`, `appId`, `hdmiPlugIn` | **provado na TV**; a gaveta usa só `HDMI_*` |
| launch `com.webos.app.hdmi1` / `hdmi2` | — | abre a entrada | provado (ref) |
| launch `com.webos.app.livetv` | — | TV ao vivo (antena/cabo) | provado (ref, free-my-tv) |

A 43LM631C0SB tem **HDMI 1–3** (EIM); `hdmiPlugIn: false` = sem cabo (esmaecida na gaveta). Nome do
dispositivo por porta é escolha da pessoa (`HDMI1_NAME`/`HDMI2_NAME` no `.env`).

## Sistema e rede

| Chamada | Parâmetros | Resposta útil | Status |
|---|---|---|---|
| `luna://com.webos.service.tv.systemproperty/getSystemInfo` | `{ keys: ["modelName","firmwareVersion","sdkVersion","UHD"] }` | modelo, firmware, versão do SDK, se é 4K | provado (ref) |
| `luna://com.webos.service.systemservice/osInfo/query` | `{ parameters: ["webos_release","webos_build_id"] }` | versão do webOS | provado (ref) — conferir chaves |
| `luna://com.palm.connectionmanager/getStatus` | `{ subscribe?: true }` | `isInternetConnectionAvailable`, `wifi`/`wired` com `state`, `ipAddress` | provado (ref) |
| `PalmSystem.deviceInfo` (JSON) | — | `modelName`, `platformVersion`, `screenWidth/Height` | provado (ref, `webOSTV.js`) |
| `navigator.deviceMemory` | — | RAM em potência de 2 (≤ 1 → modo lite) | provado (ref) |
| CPU %, memória total/usada, uptime | JS service lendo `/proc` | ver abaixo | **provado na TV** |

## Ajustes

| Chamada | Status |
|---|---|
| launch `com.palm.app.settings` | provado (ref) |
| `luna://com.webos.settingsservice/getSystemSettings` (`{ category, keys }`) — ex.: `sound`/`soundOutput` | provado (ref, `webOSTV.js`) para som; outras categorias **verificar** |

Mudar ajuste da TV pelo app: **não**. Settings de home/debloat (`general.defaultApps.home`,
`homeAutoLaunch`, `option.*`, `eulaStatus` sem `category`) e preload
(`com.webos.service.config` `com.webos.service.preloadmanager.supportAppList` e `.maxPreloadApp`;
entrada com `isPinUp` pré-carrega mesmo com `isEnabled: false`) só pelo `root/tvos-root.js`
(ADR 0007, 0009), com original guardado e `restore`.

## Screensaver

`luna://com.webos.service.tvpower/power/registerScreenSaverRequest` (`{ subscribe: true,
clientName }`) e `responseScreenSaverRequest` (`{ clientName, ack, timestamp }`): o webOS pergunta
antes de ligar o screensaver dele; responder `ack: false` enquanto o do tvOS vai assumir. Provado
(ref, free-my-tv).

## Fallback SSAP (lista de apps)

**Risco nesta TV (webOS 4.x):** o free-my-tv relata `listLaunchPoints` negado, sem `getAppLoadStatus`
e `invalid origin` no socket em webOS 3 (Chromium 38); no 4.x **verificar**. Plano B documentado lá:
um script no PC (`webos/apps.py`) lista os apps pelo socket (a TV pede uma aprovação na tela) e grava
um JSON que entra no pacote, em vez de a TV listar sozinha.

Quando `listLaunchPoints` é negado: o socket de controle remoto da TV (`ws://127.0.0.1:3000`,
protocolo SSAP) lista apps depois de um **pareamento único** que a pessoa aceita na tela.

1. `register` com `manifest.permissions: ["READ_INSTALLED_APPS"]` e `pairingType: "PROMPT"`.
2. Resposta `registered` traz `client-key`: guardar (só a lista de apps; nunca expor) para não
   pedir de novo.
3. `request` `ssap://com.webos.applicationManager/listLaunchPoints`.

A página pode receber `invalid origin` (webOS novo dá origem própria ao app); então a conexão sai
do JS service com `Origin: file://` (molde: `free-my-tv/webos/service/service.js`). **Allowlist**:
o service só aceita essa URI; nada mais vai ao socket.

## JS service: molde e /proc

```
service/
  package.json    { "name": "com.lurickardo.tvos.service", "main": "index.js" }
  services.json   { "id": "com.lurickardo.tvos.service", "services": [{ "name": "com.lurickardo.tvos.service" }] }
  index.js        const Service = require('webos-service'); service.register('<método>', (message) => message.respond({...}))
```

- `ares-package dist/app dist/service` junta app e service num `.ipk`.
- Responda sempre (`returnValue: true|false`); erro → `{ returnValue: false, errorText }` em pt-BR.
- `stats`: CPU % pela diferença entre leituras de `/proc/stat` (`(total − idle) / total`),
  memória por `/proc/meminfo` (`MemTotal − MemAvailable`). Provado na TV.
- **Assinatura** (`subscribe: true`, `interval` 2–60 s): o service fica num processo só enquanto
  houver assinatura (activity do `webos-service`; ocioso sai em 5 s). Chamada avulsa a cada N s
  subia um Node 0.12 novo por chamada (medido: PID novo a cada poll). Cancelar ao esconder.
