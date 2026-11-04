---
name: tvos-design-system
description: >-
  Design system do tvOS: dark only num palco fixo de 1920×1080, inspirado no layout do free-my-tv
  (título e abas no topo à esquerda, botões redondos só-ícone à direita, destaques com card em foco
  largo, prateleira de apps em plataforma na base, gaveta que sobe com ↓, screensaver), tokens de
  cor da paleta noturna (#0B0B0D, #1C1C1E, superfícies semi-opacas no lugar de vidro com blur),
  tipografia em px para 3 m, espaçamento e safe area, estados de foco (branco + escala), movimento
  curto só em transform/opacity, ícones, acessibilidade (contraste, foco visível, sem só-cor) e
  componentes (Tile, Card, Round, Tab, Platter, Drawer, Sheet, Metric, Toast). Acione ao criar,
  estilizar ou revisar qualquer tela ou componente, escolher cor, tamanho de fonte, animação ou
  ícone, e em perguntas como "qual cor uso?", "como fica o foco?", "onde vai isso na tela?". Limites
  de peso ficam em tvos-performance.
---

# tvOS — Design system (dark)

> **Regra de ouro:** sempre escuro, sempre legível a 3 m, sempre com foco óbvio — e nada que custe
> FPS. Cor e medida vêm dos tokens (custom properties em `app/style.css`), nunca de valor solto
> no componente.

## Princípios

1. **Dark only.** Fundo `#0B0B0D` → `#1C1C1E` em gradiente; não existe tema claro.
2. **Conteúdo é a cor**: a interface é neutra; a cor vem dos pôsteres e das marcas dos apps.
3. **Foco é branco**: o elemento focado fica branco (texto escuro), cresce (`scale`) e ganha
   sombra; os outros recuam. Um foco por vez, sempre visível.
4. **Vidro sem blur**: superfícies semi-opacas com borda interna de 1 px clara — o "vidro" do
   free-my-tv sem `backdrop-filter` (`tvos-performance`).
5. **Palco fixo 1920×1080** em px, com safe area (≈ 76–96 px nas laterais, 52–54 px em cima/baixo).
6. **Um movimento por ação**, curto (0,2–0,38 s), só `transform`/`opacity`.

## Layout da home (palco 1920×1080)

```
┌──────────────────────────────────────────────────────────────┐
│ Título (76px)                                ( )( )( )  ← Round│  top 52
│ [Filmes] [Séries]  ← Tab                       info discreta  │  top 158
│                                                              │
│ ┌───────────── Card em foco (largo) ──────┐ ┌pôster┐ ┌pôster┐ │  top 262, h 442
│ └─────────────────────────────────────────┘ └──────┘ └──────┘ │
│ Título · tipo · gênero · ano                                  │
│ ╭──────────────── Platter (prateleira) ────────────────────╮ │  top 814, h 206
│ │ [app] [app] [app] [app] [app] [app] [app]  ← Tile 126px   │ │
│ ╰──────────────────────────────────────────────────────────╯ │
└──────────────────────────────────────────────────────────────┘
↓ na prateleira: a home sobe (translateY) e a Drawer aparece (entradas, clima, sistema, atalhos).
```

## Roteador

| Quero… | Carregue |
|---|---|
| Tokens (cor, tipografia, espaço, raio, sombra, movimento), componentes com medidas e estados, ícones, acessibilidade, checklist "isso está no padrão?" | `references/tokens-e-componentes.md` |

## Skills irmãs

- `tvos-performance` — o que o visual pode custar.
- `tvos-produto` — o que cada módulo mostra.
- `tvos-context` — UI de 3 m, teclas, limites de CSS do Chromium 79.

---

Fontes: `free-my-tv/web/home.css` e `.github/preview.webp` (`a9e1027`, MIT — layout e modo
noturno), README do FreeMyTvWebOS (vidro, OLED), Apple tvOS HIG (foco, 10-foot UI), WCAG 2.2. Em
conflito, legibilidade e FPS medidos na TV vencem.
