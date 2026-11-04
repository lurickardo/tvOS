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
| `luna://com.webos.applicationManager/listLaunchPoints` | `{}` | `launchPoints[]`: `id`, `title`, `icon`, `largeIcon` | provado (ref); **negado a apps de Dev Mode em alguns webOS** → SSAP |
| `luna://com.webos.applicationManager/getAppLoadStatus` | `{ appId }` | se está instalado | provado (ref, free-my-tv) |

Abrir app: ignore OK repetido enquanto a abertura está pendente; sem resposta em 8 s → mensagem.

## Entradas

| Chamada | Parâmetros | Resposta útil | Status |
|---|---|---|---|
| `luna://com.webos.service.eim/getAllInputStatus` | `{}` | lista de entradas e se há sinal/dispositivo | provado (ref) |
| launch `com.webos.app.hdmi1` / `hdmi2` | — | abre a entrada | provado (ref) |
| launch `com.webos.app.livetv` | — | TV ao vivo (antena/cabo) | provado (ref, free-my-tv) |

A 43UP7500PSF tem 2 HDMI. Nome do dispositivo por porta é escolha da pessoa (não há detecção
confiável de console).

## Sistema e rede

| Chamada | Parâmetros | Resposta útil | Status |
|---|---|---|---|
| `luna://com.webos.service.tv.systemproperty/getSystemInfo` | `{ keys: ["modelName","firmwareVersion","sdkVersion","UHD"] }` | modelo, firmware, versão do SDK, se é 4K | provado (ref) |
| `luna://com.webos.service.systemservice/osInfo/query` | `{ parameters: ["webos_release","webos_build_id"] }` | versão do webOS | provado (ref) — conferir chaves |
| `luna://com.palm.connectionmanager/getStatus` | `{ subscribe?: true }` | `isInternetConnectionAvailable`, `wifi`/`wired` com `state`, `ipAddress` | provado (ref) |
| `PalmSystem.deviceInfo` (JSON) | — | `modelName`, `platformVersion`, `screenWidth/Height` | provado (ref, `webOSTV.js`) |
| `navigator.deviceMemory` | — | RAM em potência de 2 (≤ 1 → modo lite) | provado (ref) |
| CPU %, memória total/usada, uptime | JS service lendo `/proc` | ver abaixo | **verificar** (esqueleto pronto para testar) |

## Ajustes

| Chamada | Status |
|---|---|
| launch `com.palm.app.settings` | provado (ref) |
| `luna://com.webos.settingsservice/getSystemSettings` (`{ category, keys }`) — ex.: `sound`/`soundOutput` | provado (ref, `webOSTV.js`) para som; outras categorias **verificar** |

Mudar ajuste da TV pelo tvOS: **não** sem pedido explícito e ADR (princípio "reversível").

## Screensaver

`luna://com.webos.service.tvpower/power/registerScreenSaverRequest` (`{ subscribe: true,
clientName }`) e `responseScreenSaverRequest` (`{ clientName, ack, timestamp }`): o webOS pergunta
antes de ligar o screensaver dele; responder `ack: false` enquanto o do tvOS vai assumir. Provado
(ref, free-my-tv).

## Fallback SSAP (lista de apps)

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
- `stats` (já existe): CPU % por duas leituras de `/proc/stat` com 250 ms de intervalo
  (`(total − idle) / total`), memória por `/proc/meminfo` (`MemTotal − MemAvailable`).
- **A confirmar na TV:** se o jail do Developer Mode deixa o service ler `/proc` (o
  `ares-device -r` da LG lê CPU/memória pelo mesmo usuário do Dev Mode, então é provável). Se
  negar: painel mostra "—", registrar aqui e no ADR 0003.
- Polling só com a tela visível; o webOS encerra service ocioso (primeira chamada pode demorar).
