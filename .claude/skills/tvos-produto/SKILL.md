---
name: tvos-produto
description: >-
  Visão de produto do tvOS (home screen própria para a TV LG 43LM631C0SB): por que existe (a home da
  LG é lenta e cheia de anúncios), princípios (performance acima de tudo, dark only, sem anúncios,
  sem telemetria, controle remoto primeiro, reversível), público (a casa, no sofá), módulos e o que
  cada um mostra — prateleira de apps, destaques de filmes/séries do TMDB, painel do sistema com
  CPU %, memória, FPS, rede, modelo e firmware, clima, entradas HDMI, ajustes da TV, screensaver,
  configurações na própria TV — roadmap do MVP e referências (FreeMyTvWebOS, free-my-tv). Acione
  ao decidir o que construir ou como uma tela deve se comportar, ao priorizar, escrever spec, e em
  perguntas como "o que entra no MVP?", "isso faz sentido no tvOS?", "o que o painel do sistema
  mostra?". Técnica de plataforma fica em tvos-webos-api; visual em tvos-design-system.
---

# tvOS — Produto

> **Regra de ouro:** cada tela tem que ser **mais rápida e mais limpa que a home da LG**. Feature
> que deixa a TV mais lenta não entra, por mais legal que seja; corte a feature ou o peso dela.

## Por que existe

A home do webOS é um portal de tela cheia: banners que tocam sozinhos, promoções, travadas de
3–5 s ao apertar Home. O tvOS é uma home própria, instalada como app (ADR 0002), que abre na hora
e mostra só o que a casa usa — e mais informação útil sobre a TV do que a LG mostra.

## Princípios (contrato)

1. **Performance > tudo**: 60 fps, abrir em < 1 s, tecla responde em < 100 ms (`tvos-performance`).
2. **Dark only**: nenhum tema claro (`tvos-design-system`).
3. **Zero anúncio, zero telemetria**: rede só para o que a tela mostra (ADR 0004).
4. **Controle remoto primeiro**: setas + OK + Voltar fazem tudo; ponteiro do Magic Remote é extra.
5. **Informação de verdade**: número do sistema é medido, nunca inventado; sem dado → "—".
6. **Reversível**: nada muda configuração da TV sem a pessoa pedir; desinstalar devolve o original.
7. **pt-BR** em toda a interface.

## O que o tvOS resolve (e o que não)

Resolve a lentidão **da home**: troca o portal da LG por uma tela leve, abre apps/entradas por
comando direto (~100 ms) e não carrega anúncio. Com a TV rootada (ADR 0007) o botão Home abre o
tvOS e a LG fica mais leve (preload, daemons, hosts). **Não** muda: a velocidade dentro dos apps de
streaming, o liga/desliga (volta ao último app) e os menus/ajustes da LG. Para a TV inteira, o README lista ajustes da LG que ajudam (Live
Plus, promoções, recomendações). Nunca prometa mais que isso; meça antes/depois (README).

## Módulos

| Módulo | O que é | Status |
|---|---|---|
| Prateleira de apps | apps instalados da TV, escolhidos e ordenados na própria TV; abre em ~100 ms | MVP |
| Destaques (TMDB) | filmes/séries em alta: card em foco largo (backdrop), outros como pôster; abas Filmes/Séries | MVP |
| **Painel do sistema** | CPU %, memória, FPS, rede, modelo/firmware/webOS, uptime | MVP (esqueleto já mede CPU/memória/FPS) |
| Clima | agora + próximas horas, nascer/pôr do sol (Open-Meteo) | MVP |
| Entradas | HDMI 1 e 2 com nome/ícone escolhido (console, PC…), abre a entrada | MVP |
| Ajustes | atalho para os ajustes da TV e ajustes do tvOS (cidade, chave TMDB, apps, relógio) | MVP |
| Screensaver | relógio + clima em fundo escuro, deslocando aos poucos (anti-marcação) | depois |
| Dim noturno | escurece as telas do tvOS à noite | depois |

Requisitos e comportamento de cada módulo: `references/modulos.md`.

## Roadmap

1. **Esqueleto** (feito): pipeline build → `.ipk` → TV; painel CPU/memória/FPS.
2. **MVP**: casca (topo, prateleira, gaveta), navegação por foco, prateleira, destaques, painel do
   sistema, clima, entradas, ajustes. Cada um vira spec (`tvos-refine`) antes do código.
3. **Depois**: screensaver, dim, Wake-on-LAN, QR para configurar pelo celular.

## Referências

- [FreeMyTvWebOS](https://github.com/danielthejoker18/FreeMyTvWebOS) (MIT): mesma ideia em webOS,
  configuração e instalação — seguimos a linha dele até o root (ADR 0007).
- [free-my-tv](https://github.com/simbasjungles/free-my-tv) (MIT): referência de aparência — layout
  e modo noturno; o tvOS fica sempre no modo escuro.

## Skills irmãs

- `tvos-refine` — transforma um módulo em spec.
- `tvos-design-system` — como cada módulo parece.
- `tvos-webos-api` / `tvos-apis-externas` — de onde vem cada dado.

---

Fontes: pedido do usuário (2026-11-04), READMEs e roadmaps do FreeMyTvWebOS e do free-my-tv,
ADRs 0002–0004. Em conflito, a decisão do usuário vence.
