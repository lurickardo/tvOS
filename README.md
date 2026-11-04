# tvOS

Home screen própria, rápida e sem anúncios para a TV **LG 43LM631C0SB** (43", webOS TV 4.x):
apps, destaques de filmes e séries, clima, entradas e o estado do sistema (CPU, memória, FPS).
Na TV **rootada** (Homebrew Channel) o tvOS é a **home oficial**: o botão Home abre ele, e o
sistema da LG fica mais leve (sem anúncios, telemetria e apps pré-carregados à toa). Tudo é
reversível com um comando (ADR 0007).

| Home | Gaveta (↓ na prateleira) |
|---|---|
| ![Home](context/specs/01-home/mockup-home.jpg) | ![Gaveta](context/specs/01-home/mockup-drawer.jpg) |

> **Estado:** a home do MVP roda na TV como home oficial; próximas versões instalam do mesmo jeito.

---

## Isso deixa a TV mais rápida?

**Deixa mais rápido o que é lento na home da LG — não a TV inteira.**

| Melhora | Não muda |
|---|---|
| A tela inicial: no lugar do portal da LG (banners, anúncios, recomendações carregando), uma tela leve (pacote de poucos KB, sem framework) | Ligar a TV volta ao último app em uso (Quick Start+) |
| Abrir apps e entradas: comando direto ao sistema (~100 ms), sem passar pelo portal | A velocidade **dentro** de Netflix, YouTube etc. (cada app tem o próprio peso) |
| Navegação a 60 fps, sem anúncio e sem telemetria | Os menus de ajustes da LG (continuam os da LG) |
| Você vê CPU, memória e FPS e sabe quando a TV está sobrecarregada | O hardware (CPU e memória são fixos) |

Referência: o FreeMyTvWebOS, que faz a mesma coisa, mede menos de 0,2 s para abrir contra 3,5–5 s da
home da LG (medido por eles no webOS 24; nesta TV vamos medir — veja "Medir antes e depois").

**Medido na sua TV (43LM631C0SB):** 4 núcleos e **só 658 MB de RAM**. Parada, ela já tinha ~160 MB
livres e **~300 MB em swap** (memória jogada para o armazenamento, que é muito mais lento). Boa
parte da lentidão vem daí. Por isso o `npm run tv:root -- apply` (Parte 4):
- tira a home da LG e todo streaming do pré-carregamento, para 8 serviços de telemetria, anúncio,
  voz e espelhamento, bloqueia servidores de anúncio/ACR no `/etc/hosts` e os updates de firmware;
- medido: com só o tvOS em frente, ~256 MB livres contra ~177–198 MB antes (detalhes em
  `tvos-performance`);
- desligar a TV da tomada de vez em quando ainda limpa o swap acumulado.

---

## Tutorial: do zero até o tvOS na TV

Tempo: ~30 min na primeira vez. Você precisa de:
- a TV e um computador (macOS, Linux ou Windows) **na mesma rede Wi-Fi/cabo** (não use rede de convidados);
- o controle da TV;
- a TV já rootada (Homebrew Channel, SSH root por chave) e um e-mail para a conta grátis do TMDB.

### Parte 1 — Preparar o computador

1. Instale o **Node.js 20 ou mais novo** (https://nodejs.org → versão LTS). No macOS também dá
   `brew install node`. Confira: `node -v`.
2. Instale o **Git** (https://git-scm.com; no macOS já vem ou `xcode-select --install`).
3. Baixe o projeto e as dependências:
   ```bash
   git clone https://github.com/lurickardo/tvOS.git
   cd tvOS
   npm install
   ```

### Parte 2 — Chaves e informações (`.env`)

1. Crie o seu `.env` a partir do modelo:
   ```bash
   cp .env.example .env
   ```
2. Abra o `.env` num editor e preencha (cada campo está explicado no próprio `.env.example`):

| Variável | Obrigatória? | O que é | Onde conseguir |
|---|---|---|---|
| `TV_IP` | sim | IP da TV na rede | Configurações → Rede, ou no roteador (reserve o IP por DHCP) |
| `TMDB_TOKEN` | para os destaques | "Token de Leitura da API" (v4) do TMDB, começa com `eyJ` | themoviedb.org → criar conta → Configurações → API → solicitar chave (tipo *Developer*, uso pessoal) → copiar **Token de Leitura da API** (não a "Chave da API" curta) |
| `CITY` | não (padrão: `São Vicente, São Paulo`) | cidade e estado; só o nome acha cidades de outros países. Troque para mudar o clima | — (clima pelo Open-Meteo, sem chave) |

> O `.env` nunca vai para o git. Nunca envie o `.env` nem o `.ipk` gerado com ele para ninguém: o
> token vai dentro do pacote. A chave SSH (`~/.ssh/tvos_root_key`) também nunca sai do computador.

### Parte 3 — Root da TV (uma vez)

Root com o [faultmanager-autoroot](https://github.com/throwaway96/faultmanager-autoroot) (webOS
4–10; confira o firmware em https://cani.rootmy.tv), que instala o Homebrew Channel. Depois:
desinstale o app Developer Mode e nunca o reinstale; no Homebrew Channel ligue o **SSH** e
desligue o **telnet**; ponha a sua chave pública em `/home/root/.ssh/authorized_keys` (sem ela a
senha é a padrão `alpine`) e a privada em `~/.ssh/tvos_root_key`.

> **Nunca** escreva em partições do sistema (rootfs, kernel) nem use `chattr`: a TV pode não ligar
> mais. Os scripts deste repo só mexem em ajustes, `/var` e `/tmp`.

### Parte 4 — Conectar, instalar e virar a home

```bash
npm run tv:setup            # cadastra a TV "tv-root" (root@TV_IP:22 com a chave) e mostra modelo/firmware
npm run tv:install          # instala e abre o tvOS
npm run tv:root -- apply    # tvOS vira a home + deixa a LG leve (guarda os valores originais)
```

O computador não precisa ficar ligado depois disso.

### Parte 5 — Usar no dia a dia

- **Home** do controle abre o tvOS de qualquer lugar; Voltar na raiz de um app também volta a ele.
- Prateleira: **TV ao vivo** em primeiro e **webOS da LG** no fim (abre a home da LG como app; ao
  voltar ao tvOS ela sai da memória).
- **Segure OK** num app para movê-lo com ← →; com ele pego, ↑ mostra a **lixeira** (desinstalar,
  com confirmação) e **Ocultar**. Ocultos continuam em "Todos os apps" (segure OK lá para mostrar).
- No tvOS: setas e OK navegam; **Voltar** fecha a camada aberta; ↓ na prateleira abre a gaveta
  (entradas HDMI reais — sem cabo aparece esmaecida —, atalhos, clima e sistema).
- Tecla INPUT e engrenagem continuam abrindo os painéis da LG.

### Parte 6 — Manutenção

- **Ver o estado:** `npm run tv:root -- status` (home, pré-carregados, hosts, serviços, memória, swap).
- **Atualizar o tvOS:** `git pull && npm install && npm run tv:install`.
- **IP da TV mudou:** atualize `TV_IP` no `.env` e rode `npm run tv:setup`.
- **Voltar à home da LG:** `npm run tv:root -- restore` e reinicie a TV.
- Reset de fábrica apaga root, tvOS e ajustes; faça o root e a Parte 4 de novo.

### Medir antes e depois

1. **Home da LG** (antes do `apply`, ou depois de `restore`): aperte Home e cronometre até conseguir
   navegar; depois cronometre Home → Netflix aberto.
2. **tvOS:** aperte Home e cronometre até a prateleira responder; depois tvOS → Netflix.
3. Na gaveta do tvOS (Sistema), veja FPS (alvo ≥ 55) e memória; `npm run tv:root -- status` mostra a TV inteira. No computador, `npm run tv:monitor` mostra
   CPU e memória do processo do tvOS a cada 2 s.

### Problemas comuns

| Sintoma | O que fazer |
|---|---|
| `tv:setup` não acha a TV | TV ligada (o SSH cai em standby)? Mesma rede? `TV_IP` certo? Chave em `~/.ssh/tvos_root_key`? |
| SSH recusado depois de reiniciar | No Homebrew Channel, desligue e ligue o SSH |
| Home abre a home da LG | `npm run tv:root -- status`; se `defaultApps` não for o tvOS, `npm run tv:root -- apply` |
| Loja da LG com erro ou relógio errado | algum nome em `root/hosts.block` é necessário: tire-o, `apply` e reinicie |
| Tela branca na TV | `npm run tv:debug-install`; depois `npm run tv:inspect` no Chromium 68 e confira **Console** |

### Depurar app na TV (webOS 4.x)

O Inspector legado usa APIs removidas em navegadores Chromium recentes (como `document.registerElement`).
Para esta TV, use o Chromium 68 incluído no webOS TV IDE, não o Chrome atual. Gere e instale pacote de
depuração sem minificação; depois `npm run tv:inspect` imprime URL local. Abra essa URL no Chromium 68
e consulte a aba **Console**:

```bash
npm run tv:debug-install
npm run tv:inspect
```

O pacote sem minificação serve apenas para depuração. `npm run tv:install` continua gerando pacote normal.

---

## Desenvolvimento

```bash
npm run dev            # http://127.0.0.1:8000 (navegador em 1920×1080, só teclado)
npm run check          # typecheck + lint de skills + encoding
npm run tv:package     # gera o .ipk em dist/ sem a TV
npm run tv:debug-install # instala bundle sem minificação para depuração
npm run tv:inspect     # DevTools do app rodando na TV
npm run tv:monitor     # CPU/memória do tvOS na TV
npm run tv:root -- status # estado da TV inteira (home, debloat, memória)
```

Para quem desenvolve com Claude Code: `CLAUDE.md` é a porta de entrada; decisões em
`context/adr/`, specs em `context/specs/`.

## Estrutura

```
app/          casca HTML/CSS, appinfo.json, ícones
src/          código TypeScript (platform/, features/, config.ts)
service/      JS service do webOS (métricas do sistema)
scripts/      build (esbuild), tv-setup, tv-root e checks
root/         roda na TV rootada: tvOS como home e debloat (tvos-root.js, hosts.block)
context/      regras, ADRs e specs (mockups da home em specs/01-home/)
.claude/      skills para o Claude Code
```

## Créditos

Inspirado em [FreeMyTvWebOS](https://github.com/danielthejoker18/FreeMyTvWebOS) e
[free-my-tv](https://github.com/simbasjungles/free-my-tv) (MIT) — veja `THIRD_PARTY_NOTICES.md`.
Dados de filmes e séries: [TMDB](https://www.themoviedb.org/) (este produto usa a API do TMDB, mas
não é endossado nem certificado pelo TMDB). Clima: [Open-Meteo](https://open-meteo.com/).
