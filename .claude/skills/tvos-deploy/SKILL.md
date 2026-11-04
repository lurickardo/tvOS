---
name: tvos-deploy
description: >-
  Levar o tvOS para a TV LG 43UP7500PSF sem root: ligar o Developer Mode (conta LG grátis, Dev
  Mode Status, Key Server), cadastrar a TV no ares-setup-device, buscar a chave com ares-novacom
  --getkey, desligar o Key Server depois, empacotar e instalar com os scripts npm (tv:package,
  tv:install, tv:inspect, tv:monitor), fixar o tvOS numa tecla numérica, renovar a sessão do
  Developer Mode (botão EXTEND), desinstalar, alternativa webOS Dev Manager, e correções de
  instalação (TV não encontrada, sessão expirada, "-5 ipk verified failed"). Acione ao instalar,
  atualizar, depurar ou medir o app na TV, configurar o Developer Mode, e em pedidos como "manda
  pra TV", "instala na TV", "como abro o tvOS?", "Developer Mode expirou". APIs do sistema ficam em
  tvos-webos-api.
---

# tvOS — Deploy na TV (Developer Mode, sem root)

> **Regra de ouro:** a TV é da casa. Passphrase, IP e chave **nunca** entram no repo, no chat ou
> em log; quem digita a passphrase é a pessoa, no terminal dela. Key Server **OFF** ao terminar.

## Primeira vez (a pessoa faz na TV; a IA guia)

1. LG Content Store → instalar **Developer Mode** → entrar com a conta grátis de
   webostv.developer.lge.com → **Dev Mode Status ON** (a TV reinicia).
2. Abrir o Developer Mode de novo → **Key Server ON**. Anotar IP e passphrase (6 caracteres).
3. No PC (pasta do repo, `npm install` feito, `TV_IP` no `.env` — ver `.env.example`):
   ```bash
   npm run tv:setup   # cadastra a TV "tv" pelo TV_IP, pede a passphrase (a PESSOA digita) e confirma a conexão
   ```
   Equivalente manual: `npx ares-setup-device` (nome `tv`, IP, porta 9922, usuário `prisoner`) +
   `npx ares-novacom -d tv --getkey` + `npx ares-device -i -d tv`.
4. **Key Server OFF** no app Developer Mode (com ele ligado, qualquer um no Wi-Fi com a
   passphrase pega a chave SSH da TV).

O nome do dispositivo **tem que ser `tv`**: os scripts usam `-d tv`.

## Ciclo do dia a dia

```bash
npm run tv:install    # build (lê o .env) → ares-package (dist/*.ipk) → ares-install -d tv → ares-launch
npm run tv:inspect    # Web Inspector (DevTools) do app rodando na TV
npm run tv:monitor    # CPU/memória do processo do tvOS a cada 2 s (ares-device -r)
npx ares-device -d tv -r       # CPU/memória da TV inteira
npx ares-install -d tv --list  # apps instalados
npx ares-install -d tv --remove com.lurickardo.tvos   # desinstalar
```

`npm run tv:package` sozinho gera o `.ipk` sem a TV (CI faz isso em todo PR). Mudou a `version` no
`app/appinfo.json`? Atualize o nome do `.ipk` no script `tv:install` do `package.json`.

## Abrir rápido

Com o tvOS aberto, **segurar uma tecla numérica** (ex.: `1`) no controle e atribuir o tvOS a ela;
depois, segurar `1` de qualquer lugar abre o tvOS. Sem root não há como assumir o botão Home
(ADR 0002).

## Sessão do Developer Mode

A sessão tem prazo (o app mostra o tempo restante; o free-my-tv relata ~40 dias). Renove antes
pelo botão **EXTEND** no app Developer Mode (o `@webos-tools/cli` 3.x não tem `ares-extend-dev`;
ele só existia na CLI antiga do SDK). Se expirar, a TV **remove os apps de desenvolvedor** —
reinstale com `npm run tv:install`.

## Alternativa sem terminal

webOS Dev Manager (github.com/webosbrew/dev-manager-desktop): conecta com IP + passphrase e
instala o `.ipk` de `dist/` por interface gráfica.

## Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| `ares-install` não acha a TV / timeout | IP mudou, TV desligada, Dev Mode expirado | conferir IP no app Developer Mode; `ares-setup-device` para atualizar; `ares-device -i -d tv` |
| Autenticação falha | chave antiga após reinstalar o Dev Mode | Key Server ON → `ares-novacom -d tv --getkey` → Key Server OFF |
| `-5: ipk verified failed` | entradas do tar com data 1970 (visto no webOS 5) | aplicar `_fix_ipk_timestamps` do FreeMyTvWebOS (`scripts/build.py`, MIT) ao `.ipk`; só se acontecer nesta TV |
| App sumiu da TV | sessão do Dev Mode expirou | renovar e reinstalar |
| Tela branca ao abrir | erro de JS no motor da TV | `npm run tv:inspect` → Console; ver `tvos-debug` |

## Skills irmãs

- `tvos-webos-api` — o que o app pode chamar na TV.
- `tvos-performance` — medir com `tv:monitor` e o inspector.
- `tvos-debug` — quando algo quebra só na TV.

---

Fontes: webOS TV CLI dev guide (ares-setup-device, ares-novacom, ares-package, ares-install,
ares-inspect, ares-device -r), `npx ares-* --help` do `@webos-tools/cli` 3.2.6, README do FreeMyTvWebOS (Developer Mode, Key
Server, atalho numérico), CLAUDE.md do free-my-tv (sessão, resolução). Em conflito, o que a CLI
instalada faz vence.
