# 0008 — JS service elevado para ações de app; LG Input Hook recusado

Status: aceito (2026-11-04)
Decisores: Lurickardo
Complementa: ADR 0007

## Contexto

Com o tvOS como home, faltavam ações que a home da LG faz e que um app comum não pode chamar:
desinstalar app (`com.webos.appInstallService/remove`) e tirar o webOS da LG da memória ao voltar
(`applicationManager/closeByAppId`). O pedido também incluía botões coloridos abrindo apps em
qualquer tela.

Medido na TV: o `lginput2` da LG prende os dispositivos de `/dev/input` (outro processo não lê
nada). A saída da comunidade é o LG Input Hook (injeção no `lginput2` e no `tvservice`): a 1.5.x
trava vídeo e dá kernel panic no webOS 4.10 (issue #41 aberta), e a 1.4.0 abre na **porta 1842,
em todas as interfaces e sem senha**, um servidor que grava arquivos como root (com `../`) e roda
comandos — root para qualquer aparelho do Wi-Fi.

## Decisão

1. O service `com.lurickardo.tvos.service` é **elevado** pelo `elevate-service` do Homebrew
   (`root/tvos-root.js elevate`; o boot e o `npm run tv:install` refazem, toda instalação desfaz).
2. Métodos em allowlist, parâmetros validados no service: `uninstall` (só id de app de loja; recusa
   `com.webos.`, `com.palm.`, `com.lge.`, `com.lurickardo.`, `org.webosbrew.`) e `closeLgHome`
   (sem parâmetro). Nada de comando de shell vindo da página.
3. **Sem LG Input Hook.** Botões coloridos globais ficam fora; a tecla amarela segue movendo app
   dentro do tvOS.
4. A barra `com.webos.app.home` (home antiga, ~30 MB com swap) é encerrada no boot; o webOS da LG
   (`com.webos.app.fullhome`) abre como app pelo tile "webOS da LG" e sai da memória ao voltar.

## Alternativas consideradas

- LG Input Hook 1.4.0 + firewall só-localhost na 1842: recusado pelo usuário (risco residual, injeção
  em processo do sistema).
- Vigia root lendo `/dev/input`: testado, não recebe eventos (o `lginput2` prende o controle).
- Ajustes rápidos (imagem, som, Bluetooth, timer, só áudio), modo infantil e botões dentro do tvOS:
  implementados e retirados a pedido do usuário no mesmo dia.

## Consequências

- Positivas: desinstalar sem sair do tvOS; ~66 MB do webOS da LG liberados ao voltar; a barra antiga
  fora da RAM.
- Negativas: service com privilégio total no barramento — qualquer método novo nele exige revisão
  de segurança (`tvos-security`).
- Custo: zero.

## Como verificar que está sendo seguida

`npm run tv:root -- status`; `luna-send -a com.lurickardo.tvos .../uninstall '{"id":"com.webos.app.livetv"}'`
responde "App protegido"; `ls /media/developer/apps/usr/palm/applications` sem `org.webosbrew.inputhook`.
