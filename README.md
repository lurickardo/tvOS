# tvOS

Home screen própria, rápida e sem anúncios para a TV **LG 43UP7500PSF** (43", 4K UHD, webOS TV 6.x):
apps, destaques de filmes e séries, clima, entradas e o estado do sistema (CPU, memória, FPS).
Instalada como app pelo **Developer Mode da LG, sem root** — a home original continua lá.

> Estado: esqueleto rodando (painel de CPU, memória e FPS). O MVP está em construção.

## Requisitos

- Node.js 20+ e npm
- TV LG com **Developer Mode** ativo (conta grátis em [webostv.developer.lge.com](https://webostv.developer.lge.com))

## Uso

```bash
npm install
npm run dev            # abre em http://localhost:8000 (use 1920×1080 e só o teclado)
npm run check          # typecheck + lint de skills + encoding
npm run tv:package     # gera o .ipk em dist/
```

### Primeira instalação na TV

1. Na TV: LG Content Store → **Developer Mode** → entrar → **Dev Mode Status ON** → depois
   **Key Server ON** (anote o IP e a passphrase).
2. No computador:
   ```bash
   npx ares-setup-device             # adicione a TV com o nome "tv" (IP, porta 9922, usuário prisoner)
   npx ares-novacom -d tv --getkey   # digite a passphrase mostrada na TV
   npm run tv:install                # empacota, instala e abre o tvOS
   ```
3. Na TV: **Key Server OFF**. Com o tvOS aberto, segure uma tecla numérica do controle para
   fixar o atalho.

A sessão do Developer Mode expira: renove pelo botão EXTEND no app (se expirar, reinstale com
`npm run tv:install`).

## Estrutura

```
app/          casca HTML/CSS, appinfo.json, ícones
src/          código TypeScript (platform/, features/)
service/      JS service do webOS (métricas do sistema)
scripts/      build (esbuild) e checks
context/      regras, ADRs e specs
.claude/      skills para o Claude Code (CLAUDE.md é a porta de entrada)
```

## Créditos

Inspirado em [FreeMyTvWebOS](https://github.com/danielthejoker18/FreeMyTvWebOS) e
[free-my-tv](https://github.com/simbasjungles/free-my-tv) (MIT) — veja `THIRD_PARTY_NOTICES.md`.
Dados de filmes e séries: [TMDB](https://www.themoviedb.org/) (este produto usa a API do TMDB, mas
não é endossado nem certificado pelo TMDB). Clima: [Open-Meteo](https://open-meteo.com/).
