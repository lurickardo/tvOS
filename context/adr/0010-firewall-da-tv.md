# 0010 — Firewall na TV: só SSH por chave, cast e app LG abertos para a rede

Status: aceito (2026-11-04)
Decisores: Lurickardo
Complementa: ADR 0007

## Contexto

Medido na TV (2026-11-04): 12 portas TCP escutando em `0.0.0.0`, entre elas o DevTools do
WebAppMgr na **9998, sem senha** (fixo no firmware, `/etc/init/WebAppMgr.conf`): qualquer aparelho
do Wi-Fi roda JS na página do tvOS e, por ela, chama o service elevado (ADR 0008). Mapa por
processo e anúncio SSDP:

| Porta | Processo | Uso |
|---|---|---|
| 22 | dropbear (Homebrew) | SSH root; root sem senha (`*`), só chave |
| 2003, 36866, 18181 | upnpd, xinetd `dial_http`/`dial_tvapp` | cast DIAL (YouTube/Netflix do celular) |
| 1434, 1708, 3000, 3001 | upnpd (second screen, `urn:lge:device:tv`), xinetd `ssg_http(s)` | app LG ThinQ / controle pelo celular |
| 9998 | WebAppMgr | DevTools — fechar |
| 11111 | crashreportd | relatório de crash à LG — fechar |
| 1191, 1473 | upnpd (Neptune, não anunciados) | UPnP/DLNA não usado — fechar |

O kernel não tem `conntrack` (só os matches `tcp`/`udp`/`icmp`) nem `ip6tables`.

## Decisão

1. `root/tvos-root.js` cria a chain `TVOS` no `INPUT` a cada boot (hook) e no `apply`: aceita
   `lo` e TCP para `22 1434 1708 2003 3000 3001 18181 36866`; todo outro **SYN** TCP leva
   `REJECT tcp-reset`. Regras só em memória (somem no reboot, o hook refaz); `restore` remove.
2. Stateless: bloqueia só conexão nova vinda de fora; respostas das conexões que a TV abre
   (TMDB, clima, streaming, DNS) passam. UDP fica (SSDP, mDNS, CoAP do ThinQ, DNS).
3. Acesso de dev só por SSH com a chave deste PC; DevTools por túnel (`npm run tv:inspect` já usa o
   forward do `ares-inspect`; trace manual com `ssh -L`).

## Alternativas consideradas

- Fechar tudo menos SSH: perde cast do celular e o app ThinQ (o usuário pediu manter o que é usável).
- SSH só do IP deste PC: trancaria a TV fora se o DHCP mudar o IP; a chave já limita a este PC.
- Firewall com estado (`-m state`): não há módulo no kernel da TV.

## Consequências

- Positivas: 9998, crashreportd e DLNA fora da rede; porta nova que a LG abrir nasce fechada.
- Negativas: ~40 s após o boot frio (até o hook rodar) tudo fica aberto; IPv6 sem filtro (só
  link-local; ouvem 22 e CoAP); serviço da LG que dependa de porta TCP fora da lista para de
  responder à rede (acrescentar em `TCP_OPEN`).
- Custo: zero.

## Como verificar que está sendo seguida

`npm run tv:root -- status` mostra 9 regras ACCEPT; do PC, conexão em 9998/11111 recusada e em
22/2003/3000 aceita; `iptables -S INPUT` na TV tem `-j TVOS`.
