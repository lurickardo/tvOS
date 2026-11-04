# Home do tvOS (casca, destaques, prateleira e gaveta)

Status: rascunho   ·   Data: 2026-11-04

## Problema
A home do webOS 6 da LG 43UP7500PSF é lenta (travadas ao abrir, banners e anúncios carregando) e
não mostra nada útil sobre a TV. A casa quer uma tela que abra na hora, leve aos apps em um clique
e mostre clima, entradas e como o sistema está rodando.

## Resultado esperado
A tela das referências `mockup-home.jpg` e `mockup-drawer.jpg` (layout do free-my-tv em modo
escuro): "Para você" com abas, três destaques, prateleira de apps; ↓ abre a gaveta com Entradas,
Atalhos, Clima e Sistema. Tudo com o controle, a 60 fps.

## Requisitos (EARS)
1. QUANDO o tvOS abre O SISTEMA DEVE mostrar a home com o foco na prateleira em menos de 1 s.
2. O SISTEMA DEVE mostrar no topo o título, as abas Explorar/Filmes/Séries, os botões TV ao vivo,
   Entradas e Ajustes, e a linha CPU · memória · FPS · clima.
3. QUANDO uma aba recebe foco O SISTEMA DEVE trocar os destaques para os em alta da semana daquela
   aba (TMDB, `w780` no card em foco, `w342` nos pôsteres).
4. QUANDO um destaque recebe foco O SISTEMA DEVE alargá-lo e mostrar título, gênero, duração e
   serviço embaixo.
5. QUANDO OK é pressionado num app da prateleira O SISTEMA DEVE abrir o app; SE não houver
   resposta em 8 s ENTÃO O SISTEMA DEVE avisar "Não foi possível abrir <app>".
6. QUANDO ↓ é pressionado na prateleira O SISTEMA DEVE abrir a gaveta (home sobe, topo e destaques
   somem) com Entradas (TV ao vivo, HDMI 1, HDMI 2), Atalhos (Todos os apps, Sistema, Ajustes do
   tvOS, Ajustes da TV), painel de Clima e painel de Sistema.
7. ENQUANTO a gaveta estiver aberta O SISTEMA DEVE atualizar CPU e memória a cada 2 s e FPS a cada
   1 s; QUANDO fechar O SISTEMA DEVE parar essas leituras.
8. SE um dado do sistema não estiver disponível ENTÃO O SISTEMA DEVE mostrar "—".
9. SE `TMDB_TOKEN` ou `CITY` não estiverem no `.env` ENTÃO O SISTEMA DEVE mostrar como configurar no
   lugar dos destaques/clima, sem quebrar o resto.
10. QUANDO Voltar é pressionado com a gaveta aberta O SISTEMA DEVE fechá-la; na home, devolver ao
    webOS.
11. O SISTEMA DEVE manter ≥ 55 fps ao mover o foco por toda a home e a gaveta.

## Navegação
Foco inicial na prateleira. ↑ da prateleira → destaques → abas/botões. ↓ da prateleira → gaveta;
↑ ou Voltar fecham. ←/→ dentro de cada linha. Foco volta ao último elemento ao fechar a gaveta.

## Fora de escopo
Screensaver, dim, editar a prateleira na TV, deep link para o título no serviço, criptomoedas.

## Riscos e perguntas abertas
- `listLaunchPoints` pode ser negado a apps de Developer Mode → fallback SSAP (`tvos-webos-api`).
- Leitura de `/proc` pelo service sem root: confirmar na TV.
- Logos de marca: usar Simple Icons (CC0) com fonte registrada.

## Tarefas
1. Tokens e estrutura da casca (topo, palco, foco) — R1, R2, R10
2. Gerenciador de foco e pilha de camadas — R1, R6, R10
3. Prateleira (lista, abrir app, erro) — R5
4. Destaques TMDB com cache — R3, R4, R9
5. Gaveta: entradas e atalhos — R6
6. Painéis de Clima e Sistema — R7, R8, R9
7. Medição na TV (tempo de abrir, FPS, memória) — R1, R11

## Como verificar
- `npm run dev` em 1920×1080, só teclado: comparar com os mockups; percorrer todos os focos.
- Na TV: cronometrar o tvOS × home da LG (ver README, "Isso deixa a TV mais rápida?"); FPS no
  painel ≥ 55 navegando; `npm run tv:monitor` sem memória subindo sem parar.
