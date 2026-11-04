# 0007 — TV rootada: tvOS é a home oficial e o sistema da LG é enxugado

Status: aceito (2026-11-04); item preload (ficam TV ao vivo e HDMI 1–3) substituído por 0009
Decisores: Lurickardo
Substitui: ADR 0002 (Developer Mode, sem root, atalho numérico)

## Contexto

A 43LM631C0SB (webOS 4.10.2, firmware 05.40.97) foi rootada com o faultmanager-autoroot; o
Homebrew Channel 0.7.3 roda os hooks de `/var/lib/webosbrew/init.d` no boot frio, SSH root só por
chave, telnet desligado, Developer Mode desinstalado. O pedido: o tvOS ser a interface padrão da
TV e o sistema da LG ficar o mais leve possível.

Medido na TV: **658 MB de RAM**, 4× ARMv7, **~230 MB de swap em uso** minutos após o boot, load ~6.
O firmware é assinado e o rootfs só-leitura: escrever nele (ou usar `chattr`) pode brickar a TV ou
travar o root para sempre. Trocar o sistema operacional não é possível.

Achado-chave: a tecla Home (`/usr/lib/qt5/qml/KeyFilters/systemUi.js`) lança
`settingsService.getLaunchDefaultApp`, que vem de `general.defaultApps.home`
(`com.webos.app.fullhome` de fábrica). Trocar essa setting basta — testado: Home e Voltar na raiz
de outros apps abrem o tvOS.

## Decisão

1. **tvOS como home** por setting nativa: `general.defaultApps.home = com.lurickardo.tvos`. Sem
   bind mount em arquivo do sistema. No app: Voltar na raiz não sai; `webOSRelaunch` volta à tela
   inicial; com o tvOS escondido nada roda (polling, FPS, clima).
2. **Ao ligar**: boot frio abre o tvOS (hook); o botão power com Quick Start+ volta ao último app
   em uso — mantido assim a pedido do usuário.
3. **Debloat em camadas reversíveis**, por `root/tvos-root.js` (roda na TV com o Node 0.12 dela,
   ES5) acionado por `npm run tv:root -- apply|status|restore`:
   - settings persistentes: promoções e LG Channels off; consentimentos de ACR, anúncio e voz off;
   - preload (`com.webos.service.preloadmanager.supportAppList`): sai a home da LG e todo
     streaming; ficam TV ao vivo e HDMI 1–3;
   - updates de firmware bloqueados (flag `webosbrew_block_updates` do Homebrew): update da LG pode
     fechar o exploit e levar o root;
   - a cada boot frio (hook `50-tvos`, em segundo plano, nunca segura o boot): `/etc/hosts` com
     anúncio/ACR/telemetria/voz bloqueados (bind mount de cópia em `/tmp`) e `initctl stop` de
     `rdxd uploadd contentminer nudge voiceconductor voiceinput miracast dmr`.
   - originais guardados uma vez em `/var/lib/webosbrew/tvos/orig.json`; `restore` devolve tudo.
4. **Mantidos por escolha**: Ginga (interatividade da TV aberta), ThinQ/IoT/Google, teclado virtual,
   núcleo do sistema. Hosts não bloqueia loja, contas, relógio nem `*ngfts*`.
5. **Regras**: nunca escrever em rootfs/kernel nem usar `chattr`; hook sempre `exit 0`; SSH só por
   chave; telnet desligado; device `tv-root` no ares substitui o `tv` do Developer Mode.

## Alternativas consideradas

- Bind mount de `systemUi.js` patchado (vibehack-native-home): desnecessário, a setting resolve.
- Serviço que vigia a tecla Home / app em frente (Hearth, lgtv-webos-root-launcher): processo a
  mais residente na TV de 658 MB.
- `blockedAppList` para esconder apps: só persiste com `chattr +i` — proibido; o tvOS já mostra só
  o que interessa.
- Mexer em swap/sysctl: sem ganho provado.

## Consequências

- Positivas: Home instantâneo no tvOS; home da LG (66 MB + preload) fora da RAM; menos processos
  de telemetria/anúncio; tudo volta com `npm run tv:root -- restore` + reboot.
- Negativas: sem updates de segurança da LG; reset de fábrica apaga root, hook e settings;
  regiões de servidor (`aic.`/`us.`/`br.`) do hosts são estimativa — conferir loja/relógio.
- Emergência sem PC: failsafe do Homebrew (desliga hooks se o boot travar); com PC: `restore`.
- Custo: zero.

## Como verificar que está sendo seguida

`npm run tv:root -- status` mostra `defaultApps.home` = tvOS, hook e updates bloqueados, preload só
com livetv/hdmi1–3, daemons em `stop/waiting`; `grep -rn chattr root/` vazio.
