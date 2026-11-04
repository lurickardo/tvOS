---
name: tvos-deploy
description: >-
  Levar o tvOS para a TV LG 43LM631C0SB rootada (Homebrew Channel, SSH root por chave, ADR 0007):
  cadastrar a TV como "tv-root" no ares (npm run tv:setup), empacotar e instalar com os scripts npm
  (tv:package, tv:install, tv:inspect, tv:monitor), tvOS como home e debloat da LG com
  npm run tv:root -- apply|status|restore (settings, preload, hosts, daemons, hook de boot),
  rollback, reset de fábrica e correções (SSH some em standby, sshd não sobe após reboot, luna-send
  sem saída). Acione ao instalar, atualizar, depurar ou medir o app na TV, mexer no root/debloat, e
  em pedidos como "manda pra TV", "instala na TV", "volta a home da LG", "a TV está lenta".
  APIs do sistema ficam em tvos-webos-api.
---

# tvOS — Deploy na TV rootada (ADR 0007)

> **Regra de ouro:** a TV é da casa. IP e chave **nunca** entram no repo, no chat ou em log.
> **Nunca** escrever em rootfs/kernel nem usar `chattr` (brick ou root perdido para sempre).

## Primeira vez

Root já feito (faultmanager-autoroot + Homebrew Channel; tutorial local `ROOT-TV.md`, fora do git).
Chave em `~/.ssh/tvos_root_key`, pública em `/home/root/.ssh/authorized_keys` da TV.

```bash
npm run tv:setup             # cadastra "tv-root" (root@TV_IP:22, privatekey=tvos_root_key) e confirma
npm run tv:install           # build → .ipk → ares-install -d tv-root → abre → eleva o service
npm run tv:root -- apply     # tvOS como home + debloat + hook de boot (guarda originais uma vez)
```

## Ciclo do dia a dia

```bash
npm run tv:install           # reinstalar depois de mudar código
npm run tv:root -- status    # home, preload (zero, ADR 0009), maxPreloadApp, hosts, daemons, memória/swap/carga, top RSS
npm run tv:root -- elevate   # reeleva o service (toda instalação desfaz; o boot refaz)
npm run tv:inspect           # Web Inspector (Chromium 68 do webOS TV IDE; ver README)
npm run tv:monitor           # CPU/memória do processo do tvOS (ares-device -r)
npx ares-install -d tv-root --list
```

`root/tvos-root.js` roda **na TV** (Node 0.12, ES5); `scripts/tv-root.mjs` copia `root/` para
`/var/lib/webosbrew/tvos/` e chama por SSH. Hook: `/var/lib/webosbrew/init.d/50-tvos` → log em
`/tmp/tvos-root.log` (~40 s após o boot frio).

## Voltar à home da LG

```bash
npm run tv:root -- restore   # settings, preload, hook, updates e daemons de volta
ssh -i ~/.ssh/tvos_root_key root@<TV_IP> reboot   # solta o hosts e recarrega o preload
```

Boot travado por hook: o failsafe do Homebrew desliga os hooks no boot seguinte. Reset de fábrica
apaga root, hook e settings.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| SSH não responde | TV em standby (cai o SSH) ou IP mudou | ligar a TV; conferir `TV_IP`; `npm run tv:setup` |
| SSH recusado após reboot | `dropbear` do Homebrew não subiu (visto 1×) | Homebrew Channel na TV: SSH Server off/on (detalhe em `ROOT-TV.md`) |
| `luna-send` não imprime nada | stdin preso à sessão SSH | `luna-send ... </dev/null` ou `ssh -tt` |
| `Host key verification failed` | chave da TV fora do `known_hosts` | `tv:root` usa `accept-new`; ou `ssh-keyscan` uma vez |
| Loja dá erro 102 / relógio errado | nome necessário no `root/hosts.block` | tirar o nome, `apply`, reboot |
| Tela branca ao abrir | erro de JS no motor da TV | `npm run tv:debug-install` + `tv:inspect` → Console; ver `tvos-debug` |

## Skills irmãs

- `tvos-webos-api` — o que o app pode chamar na TV.
- `tvos-performance` — números medidos e como medir.
- `tvos-debug` — quando algo quebra só na TV.

---

Fontes: medição na TV (2026-11-04), ADR 0007, `npx ares-* --help` do `@webos-tools/cli` 3.2.6,
guia e known-traps de hbertsch/lgtv-webos-root-launcher, startup.sh do Homebrew Channel.
