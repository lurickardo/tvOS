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
5. **Palco fixo 1920×1080** em px (a TV Full HD desenha o app em 1280×720 e `src/main.ts` escala o
   palco por `min(innerWidth/1920, innerHeight/1080)`, centralizado, em `src/platform/stage.ts` — o design não muda, ADR 0006), com safe area (≈ 76–96 px nas laterais, 52–54 px em cima/baixo).
6. **Um movimento por ação**, curto (0,2–0,38 s), só `transform`/`opacity`.

## Layout da home (palco 1920×1080)

Cópia do layout do free-my-tv em modo escuro, com o sistema no lugar das criptomoedas. Referência
visual aprovada: `context/specs/01-home/mockup-home.jpg` e `mockup-drawer.jpg` (fonte:
`mockup.html`, abrir no Chrome em 1920×1080; `#drawer` mostra a gaveta).

```
┌──────────────────────────────────────────────────────────────┐
│ Para você (76px)                  (TV ao vivo)(Entradas)(Ajustes) ← Round  │ top 52 / 69
│ [Explorar] [Filmes] [Séries] ← Tab      CPU 12%  Memória 48%  60 fps  24° … │ top 158 / 178
│ ┌──────── Card em foco (1040 de largura) ───┐ ┌pôster 320┐ ┌pôster 320┐     │ top 262, h 442
│ └───────────────────────────────────────────┘ └──────────┘ └──────────┘     │
│ Título · gênero · duração · serviço             Título       Título        │ top 726
│ ╭──────────────── Platter (prateleira, 7 Tiles de 210) ─────────────────╮  │ top 814, h 206
│ ╰───────────────────────────────────────────────────────────────────────╯  │
└──────────────────────────────────────────────────────────────┘
```

**Gaveta** (↓ na prateleira): a home sobe 560 px, topo e destaques somem (`opacity 0`), a
prateleira fica no alto e aparecem:
- **Entradas** (esquerda): TV ao vivo, HDMI 1, HDMI 2 (nome do `.env`; sem sinal = esmaecida).
- **Atalhos** (direita): Todos os apps, Sistema, Ajustes do tvOS, Ajustes da TV.
- **Clima** (painel esquerdo, 1024 px): ícone + temperatura grande, condição, máx./mín., próximas
  horas e nascer/pôr do sol.
- **Sistema** (painel direito, no lugar de "Crypto"): CPU, Memória (usada/total), Interface (FPS),
  Rede, com pílula de estado (verde/âmbar + texto); cabeçalho com webOS e modelo.

## Roteador

| Quero… | Carregue |
|---|---|
| Tokens (cor, tipografia, espaço, raio, sombra, movimento), componentes com medidas e estados, ícones, acessibilidade, checklist "isso está no padrão?" | `references/tokens-e-componentes.md` |

## Skills irmãs

- `tvos-performance` — o que o visual pode custar.
- `tvos-produto` — o que cada módulo mostra.
- `tvos-context` — UI de 3 m, teclas, limites de CSS do Chromium 53.

---

Fontes: `free-my-tv/web/home.css` e `.github/preview.webp` (`a9e1027`, MIT — layout e modo
noturno), README do FreeMyTvWebOS (vidro, OLED), Apple tvOS HIG (foco, 10-foot UI), WCAG 2.2. Em
conflito, legibilidade e FPS medidos na TV vencem.
