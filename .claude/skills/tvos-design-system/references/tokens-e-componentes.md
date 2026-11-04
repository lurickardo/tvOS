# Tokens e componentes

## Conteúdo
- Tokens de cor
- Tipografia
- Espaço, raio, sombra
- Movimento
- Componentes
- Ícones
- Acessibilidade
- Checklist

Custom properties funcionam no Chromium 79: declare em `:root` no `app/style.css` e use
`var(--…)`. Valores abaixo são o alvo; o CSS é a fonte de verdade depois de criado.

## Tokens de cor

| Token | Valor | Uso |
|---|---|---|
| `--bg-top` / `--bg-bottom` | `#1C1C1E` / `#0B0B0D` | gradiente do fundo |
| `--veil` | `rgba(11,11,13,.78)` | véu sobre backdrop de fundo (se usar imagem) |
| `--surface` | `rgba(44,44,46,.72)` | cards de informação, métricas |
| `--surface-glass-top` / `-bottom` | `rgba(40,40,44,.8)` / `rgba(17,17,19,.62)` | Round, Platter (gradiente de "vidro") |
| `--glass-edge` | `inset 0 1px 0 rgba(255,255,255,.14), inset 0 0 0 1px rgba(255,255,255,.08)` | borda de vidro |
| `--text` | `#F5F5F7` | texto principal |
| `--text-2` | `rgba(245,245,247,.62)` | secundário, abas fora de foco |
| `--text-3` | `#8E8E93` | dicas, metadados |
| `--focus-bg` / `--focus-text` | `#FFFFFF` / `#1D1D1F` | elemento focado |
| `--accent` | `#0A84FF` | progresso, seleção, link (raro) |
| `--ok` / `--warn` / `--bad` | `#30D158` / `#FF9F0A` / `#FF453A` | métricas do sistema (com texto, nunca só cor) |

## Tipografia

Fonte do sistema: `'LG Smart UI', 'Helvetica Neue', Arial, sans-serif`; números com
`font-variant-numeric: tabular-nums`.

| Papel | Tamanho / peso |
|---|---|
| Título da tela | 76px / 600 |
| Valor de métrica grande | 64px / 700 |
| Relógio | 48px / 500 |
| Nome do card em foco | 31px / 600 |
| Aba, rótulo | 30px / 500 (600 ativa) |
| Corpo | 28px / 400 |
| Meta, dica | 23–24px / 400–600 |
| Mínimo absoluto | 21px (só detalhe discreto) |

## Espaço, raio, sombra

- Grade de 8 px. Safe area: laterais 76–96 px, topo 52 px, base 54 px.
- Raios: Tab/Round 34px (pílula/círculo), Tile 22px, Card 18px, Platter 62px, painel 24px.
- Sombras: repouso `0 4px 22px rgba(0,0,0,.3)`; foco `0 18px 40px rgba(0,0,0,.6)`. Sombra **não
  anima**: no foco, uma pseudo-camada com a sombra de foco ganha `opacity: 1`.
- Sem flex `gap` (Chromium 79): margem nos filhos; grid `gap` funciona.

## Movimento

| Ação | Duração | Curva |
|---|---|---|
| Foco (Tile/Round/Tab) | 0,2 s | `cubic-bezier(.2,.9,.3,1.2)` (leve overshoot) |
| Card em foco | 0,22 s | `cubic-bezier(.2,.9,.3,1.15)` |
| Gaveta abre/fecha | 0,38 s | `cubic-bezier(.32,.72,.2,1)` |
| Fade de troca | 0,17–0,3 s | `ease` |

`prefers-reduced-motion` e modo lite: sem escala/overshoot, só troca de cor.

## Componentes

| Componente | Medidas | Estados |
|---|---|---|
| **Round** (botão só-ícone) | 68×68, ícone 28 | foco: branco, `scale(1.1)`, nome aparece embaixo (23px) |
| **Tab** | altura 68, padding 0 26 | ativa: 600; foco: fundo branco, `scale(1.05)` |
| **Card** (destaque) | altura 442; em foco largo (backdrop), demais pôster | foco: `translateY(-6px) scale(1.05)`, borda interna clara |
| **Platter** | top 814, altura 206, raio 62, gradiente de vidro | — |
| **Tile** (app) | altura 126, raio 22, cor da marca, logo 70%×50% | foco: `scale(1.2)`, sombra de foco |
| **Drawer** | sobe 560 px; home faz `translateY(-560px)` | aberta/fechada; Voltar fecha |
| **Sheet** (modal de ajustes) | centralizada, `--surface` opaco | foco preso dentro; Voltar fecha |
| **Metric** | 320 de largura, padding 32/40, raio 24 | valor grande + rótulo; "—" se indisponível |
| **Toast** | base central, acima da Platter | some em 4 s; não rouba foco |

## Ícones

SVG inline ou PNG branco tingido por `mask` (como o free-my-tv). Logos de marca: Simple Icons
(CC0) com o `SOURCES.md` de origem; marca registrada só para identificar o app. Nada de emoji
como ícone.

## Acessibilidade

- Contraste ≥ 4,5:1 (texto) contra o pior ponto do fundo.
- Foco sempre visível e único; nunca depende de hover.
- Estado nunca só por cor (métrica em `--bad` também tem texto/ícone).
- Rótulo de botão só-ícone aparece no foco.

## Checklist ("isso está no padrão?")

1. Só tokens, nenhum hex solto em componente?
2. Funciona só com setas + OK + Voltar, com foco óbvio?
3. Texto ≥ 23px (corpo ≥ 28px) e dentro da safe area?
4. Animação só `transform`/`opacity`, ≤ 0,38 s, sem `backdrop-filter`?
5. Estados vazio/carregando/erro desenhados?
