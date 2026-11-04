# 0009 — Preload zero: nenhum app da LG pré-carregado na RAM

Status: aceito (2026-11-04)
Decisores: Lurickardo
Substitui: item "preload" do ADR 0007 (ficavam TV ao vivo e HDMI 1–3)

## Contexto

Investigação de lentidão ao navegar rápido (medida na TV, 2026-11-04). O preload da LG
(`com.webos.service.preloadmanager`) seguia ativo mesmo com o debloat do ADR 0007:

- o Netflix (`GIBBON_MAIN`, ~126 MB) foi relançado **8× em 4,4 h** com `isEnabled: false`: entradas
  com `isPinUp: true` são pré-carregadas mesmo assim, até `maxPreloadApp` (3 de fábrica);
- a cada vez que a TV liga, hdmi3, livetv, netflix, hdmi1 e hdmi2 voltam por CRIU em ~30 s: é a
  lentidão "logo após ligar".

O usuário não usa nenhum preload (TV ao vivo e HDMI abrem a frio sem problema).

## Decisão

1. `root/tvos-root.js apply` grava `supportAppList` com **todas** as entradas `isEnabled: false` e
   `isPinUp: false`, e `com.webos.service.preloadmanager.maxPreloadApp: 0`, pelo mesmo
   `com.webos.service.config/setConfigs` já usado.
2. Os valores de fábrica ficam em `orig.json` (`preload`, `maxPreload`); `restore` os devolve;
   `status` mostra preload ligado e `maxPreloadApp`.
3. Sem kill no hook de boot: app já carregado sai com `closeByAppId` uma vez; depois não deve voltar.

## Alternativas consideradas

- Manter TV ao vivo e HDMI 1–3 (ADR 0007): rajada de CRIU a cada ligar e ~27 MB do `cr_zygote`.
- Bind mount de `/etc/configd/layers/base/com.webos.service.preloadmanager.json` em `/tmp` +
  `initctl restart webos-preload-manager` (lg-webos4-tweaks): fica como plano B se o setting não
  segurar o Netflix; risco maior (hook de boot reinicia serviço).
- `blockedAppList` com `chattr` (gist lucataco): proibido (rootfs/`chattr`).

## Consequências

- Positivas: ~126 MB do Netflix e o CRIU pós-ligar fora da RAM (MemAvailable 134 → 197 MB ao fechar
  o Netflix residente).
- Negativas: Netflix, TV ao vivo e HDMI abrem a frio (~1 s a mais, relato da comunidade).
- Custo: zero.

## Como verificar que está sendo seguida

`npm run tv:root -- status` mostra `preload ligado:` vazio e `maxPreloadApp: 0`; após 2 ciclos
desliga/liga, `pidof GIBBON_MAIN` vazio sem o usuário ter aberto o Netflix e
`grep -c 'caller_id":"com.webos.service.preloadmanager' /var/log/messages` sem crescer.
