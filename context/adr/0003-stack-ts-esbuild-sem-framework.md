# 0003 — TypeScript + esbuild, sem framework, bundle único para o Chromium 79

Status: aceito (2026-11-04)
Decisores: Lurickardo

## Contexto

O critério do usuário é **performance máxima**: a TV é de 2021 e a meta é ficar muito mais rápida
que a home da LG. A plataforma é webOS TV 6.x: o app roda no Chromium 79 e o JS service no Node
8.12. A memória é modesta. O free-my-tv mediu 23–60 fps conforme as sombras e o blur em TVs LG de
1,3–1,5 GB.

Custo em tempo de execução vem de framework, virtual DOM, bundle grande e CSS pesado (blur,
sombras animadas). Custo em tempo de build não chega à TV.

## Decisão

1. **TypeScript strict + esbuild**, **sem framework** e **zero dependência em runtime**: DOM
   direto, estado em módulos pequenos (`tvos-code-patterns`).
2. O esbuild gera **um bundle IIFE minificado** (`dist/app/main.js`) com `target: chrome79`, que
   rebaixa a sintaxe nova (`?.`, `??`).
3. `tsconfig` com `lib: ["ES2019", "DOM"]`: o typecheck **recusa API que a TV não tem**
   (`replaceAll`, `at`, `Object.hasOwn`, `structuredClone`) sem precisar de lint nem polyfill.
4. O JS service fica em JavaScript **ES2017** (Node 8.12), sem dependência, só `webos-service`
   (vem do sistema).
5. **Orçamento**:
   - bundle ≤ 60 KB gzip;
   - 60 fps na navegação;
   - abrir em < 1 s;
   - resposta à tecla < 100 ms;
   - sem `backdrop-filter` por padrão;
   - anima só `transform`/`opacity`.
   Detalhe e medição: `tvos-performance`.
6. Ferramentas da TV pela CLI oficial `@webos-tools/cli` (devDependency fixada):
   `ares-package`, `ares-install`, `ares-launch`, `ares-inspect`, `ares-device -r`.

## Alternativas consideradas

- JS puro sem build (como o FreeMyTvWebOS): mesmo desempenho em runtime, mas sem tipagem e sem
  minificação; na prática virou um arquivo monolítico de 145 KB.
- Enact (framework React da LG, com navegação espacial Spotlight): mais peso em runtime e mais
  dependências. Vai contra o critério.
- Preact/Lit: pequenos, mas ainda são runtime a mais sem problema que o justifique hoje.
- `install.py` do FreeMyTvWebOS para instalar: precisa da lib Python `cryptography`; a CLI
  oficial faz o mesmo com o Node que já está no projeto.

## Consequências

- Positivas: pacote mínimo (esqueleto: `.ipk` de 4 KB, bundle < 1 KB gzip), tipagem, checagem
  de API em tempo de compilação.
- Negativas:
  - navegação espacial, roteamento e componentes são feitos à mão (pouco código, mas é nosso);
  - o `@webos-tools/cli` traz vulnerabilidades transitivas (express, eslint…), só no PC de
    desenvolvimento e nunca no pacote — gap registrado em `tvos-security`.
- **A verificar na TV:** se o JS service sem root lê `/proc/stat` e `/proc/meminfo` (painel de
  CPU/memória). Se não ler, o painel mostra "—" e o gap vai para `tvos-webos-api`.
- Custo: zero.

## Como verificar que está sendo seguida

`package.json` sem `dependencies` (só `devDependencies`); `npm run typecheck` verde;
`grep -c '?\.\|??' dist/app/main.js` = 0; tamanho gzip do bundle dentro do orçamento.
