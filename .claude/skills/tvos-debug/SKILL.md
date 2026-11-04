---
name: tvos-debug
description: >-
  Depuração sistemática no tvOS: quatro fases (reproduzir, isolar, achar causa raiz, corrigir no
  ponto compartilhado e provar) e tabela de hotspots de TV/webOS — sintaxe que funciona no PC e
  quebra na TV (Chromium 79, optional chaining, flex gap), tela branca após instalar, foco perdido
  ou preso, tecla Voltar fechando o app, ponteiro do Magic Remote roubando foco, CORS de app em
  file://, app encerrado por memória, lentidão/travadas ao rolar, imagem pesada, autoplay de
  mídia bloqueado, Developer Mode expirado, encoding quebrado. Acione quando algo quebrar e a
  causa não for óbvia, após duas tentativas de correção falharem, ou com "por que X acontece",
  "não funciona", "funciona no PC mas não na TV", "bug".
---

# tvOS — Depuração sistemática

> **Regra de ouro:** sem causa raiz, sem correção. O relato é o **sintoma**; antes de editar,
> encontre todos os chamadores da função suspeita e corrija onde **todos** passam — não só no
> caminho do relato.

## Fases

1. **Reproduzir.** Passos exatos, onde (navegador do PC, TV via Developer Mode, navegador da TV),
   versão do build, entrada (controle, ponteiro, teclado). Sem reprodução: log temporário e peça
   os passos.
2. **Isolar.** PC × TV? (diferença = motor/memória/entrada.) Rede ou local? Só depois de voltar de
   outra tela? Só com ponteiro? Bisect por commit se regrediu (`git log --oneline -- <arquivo>`,
   `git bisect`).
3. **Causa raiz.** Leia o fluxo ponta a ponta; hipótese falsificável; prove com log, breakpoint
   (`ares-inspect`) ou teste mínimo. Duas hipóteses erradas → pare, releia o fluxo inteiro.
4. **Corrigir e provar.** Menor mudança no ponto compartilhado; rode a reprodução de novo;
   `/tvos-verify`. Remova logs temporários. Causa revelou dívida → registre o gap.

## Hotspots

| Sintoma | Suspeito | Verifique |
|---|---|---|
| Funciona no PC, tela branca/erro de sintaxe na TV | recurso acima do Chromium 79 sem transpile/polyfill | console no `ares-inspect`; target do build; tabela em `tvos-context` |
| Layout quebrado só na TV | flex `gap`, `aspect-ratio`, `inset`, `:is()` | `tvos-context` → plataforma |
| Foco some / ninguém responde às setas | elemento focado removido do DOM sem mover o foco; foco fora de região registrada | dono do foco; restaurar foco ao desmontar |
| Foco preso numa região | regra de saída ausente na navegação espacial | mapa de vizinhos da região |
| Voltar fecha o app ou não faz nada | `disableBackHistoryAPI` ausente/sem handler 461; pilha de navegação vazia | `appinfo.json`; listener `keydown` 461 |
| Foco pula ao mexer o controle | ponteiro do Magic Remote dando hover | `cursorStateChange`; hover só move foco com ponteiro visível |
| `fetch` falha só na TV | app em `file://` → origem `null` no CORS; `http:` bloqueado | headers do servidor; proxy/serviço |
| App fecha sozinho / recarrega | memória (imagens grandes, lista sem virtualização, vazamento) | Memory no inspector; descartar o que saiu da tela |
| Rolagem trava | layout/paint por frame, animação fora de `transform`/`opacity`, imagem decodificando | Performance no inspector |
| Mídia não toca sozinha | política de autoplay | iniciar por ação do usuário ou `muted` |
| Não instala / "device not found" | Developer Mode expirado ou IP mudou | app Developer Mode; `ares-setup-device`; botão EXTEND (`tvos-deploy`) |
| `-5: ipk verified failed` ao instalar | tar do `.ipk` com datas de 1970 (visto no webOS 5) | receita `_fix_ipk_timestamps` (`tvos-deploy`) |
| App sumiu da TV | sessão do Developer Mode expirou (a TV apaga apps de dev) | renovar (EXTEND) e `npm run tv:install` |
| CPU/memória "—" na TV | service não instalado/encerrado, ou `/proc` negado no jail do Dev Mode | `npx ares-install -d tv --list`; `luna-send` pelo `ares-shell`; registrar em `tvos-webos-api` |
| `listLaunchPoints` falha / prateleira vazia | webOS nega a lista a apps de Dev Mode | fallback SSAP (`tvos-webos-api`) |
| `invalid origin` no socket 127.0.0.1:3000 | página com origem própria (webOS novo) | conexão pelo JS service com `Origin: file://` |
| Chamada Luna nunca responde | bridge coletada pelo GC ou serviço sem permissão em `requiredPermissions` | usar `luna()` de `src/platform/luna.ts` (guarda a bridge, timeout); conferir `appinfo.json` |
| FPS cai ao mover o foco | sombra/blur animados, DOM grande, imagem decodificando no foco | `tvos-performance` (checklist de regressão) |
| Acento vira caracteres estranhos | arquivo salvo fora de UTF-8 | `node scripts/check-encoding.mjs` (`--fix`, revise o diff) |
| Dado salvo derruba o app ao abrir | formato antigo/corrompido no storage sem validação | leitura com `try/catch` + validação + versão |

## Ferramentas

`ares-inspect --device tv --app <id> --open` (DevTools remoto: Console, Network, Performance,
Memory); navegador do PC em 1920×1080 com teclado para reproduzir rápido; `git bisect`.

## Skills irmãs

- `tvos-context` — limites do motor, teclas, Developer Mode.
- `tvos-code-patterns` — foco, cleanup, performance.
- `tvos-verify` — fechar a correção com evidência.

---

Fontes: skill `fantasy-quest-debug` do autor, prática "systematic debugging", documentação do
webOS TV (back button, webOS events, app debugging). Em conflito, a evidência reproduzida vence.
