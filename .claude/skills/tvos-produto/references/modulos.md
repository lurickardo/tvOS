# Módulos — comportamento esperado

## Conteúdo
- Casca e navegação
- Prateleira de apps
- Destaques (TMDB)
- Painel do sistema
- Clima
- Entradas
- Ajustes
- Screensaver e dim (depois)

Cada item é ponto de partida para uma spec (`tvos-refine`); a spec decide o detalhe.

## Casca e navegação

- Topo: título da seção + abas (Filmes, Séries) à esquerda; botões só-ícone à direita (Entradas,
  Sistema, Ajustes) com o nome aparecendo no foco.
- Meio: destaques. Base: prateleira de apps.
- **↓ na prateleira abre a gaveta** (entradas, clima, sistema, atalhos); Voltar fecha.
- Voltar na tela inicial devolve ao webOS (`platformBack`); em qualquer outra camada, fecha a camada.
- Foco começa na prateleira (o que a pessoa mais usa) e volta para onde estava ao fechar algo.

## Prateleira de apps

- Lista os apps instalados (`listLaunchPoints`) e mostra os escolhidos, na ordem escolhida (até ~8).
- Ícone: logo da marca quando houver, senão o ícone do webOS, senão o nome em texto.
- OK abre o app (`applicationManager/launch`); tecla repetida durante a abertura é ignorada; sem
  resposta em 8 s → mensagem "Não foi possível abrir <app>".
- Editar na TV: escolher apps e reordenar com ←/→; Voltar cancela.

## Destaques (TMDB)

- Abas Filmes e Séries com "em alta da semana" (`/trending/{movie|tv}/week`).
- Card em foco largo com backdrop `w780`; os outros como pôster `w342`.
- Embaixo do card em foco: título, tipo, gênero, ano/temporadas.
- Sem chave TMDB → a seção mostra como configurar (Ajustes) em vez de cards vazios.
- Sem rede → último cache com "desatualizado".

## Painel do sistema

Pedido explícito do usuário: o tvOS mostra como a TV está rodando.

| Dado | Fonte | Atualiza |
|---|---|---|
| CPU % (total) | JS service lendo `/proc/stat` (2 amostras) | 2 s, só com o painel visível |
| Memória usada % / total | JS service lendo `/proc/meminfo` (`MemAvailable`) | 2 s |
| FPS da interface | `requestAnimationFrame` no app | 1 s |
| Rede (Wi-Fi/cabo, conectado, IP local) | `com.palm.connectionmanager/getStatus` | ao abrir + inscrição |
| Modelo, firmware, versão do webOS | `tv.systemproperty/getSystemInfo`, `systemservice/osInfo/query` | ao abrir |
| Uptime | JS service (`/proc/uptime`) | 60 s |
| Memória do próprio tvOS | `performance.memory` (heap JS) | 5 s |

- Polling **só com o painel visível**: medir não pode pesar.
- Sem acesso ao dado → "—" (nunca número inventado). Um mini indicador (FPS/CPU) pode ficar fixo
  num canto, ligado/desligado nos ajustes.

## Clima

- Agora (temperatura, condição), próximas 6 horas, nascer/pôr do sol, pela cidade configurada
  (Open-Meteo). Sem cidade configurada: pede a cidade nos ajustes.

## Entradas

- HDMI 1 e 2 (a TV tem 2), com estado conectado quando o sistema informar
  (`service.eim/getAllInputStatus`).
- Nome/ícone por porta escolhido na TV (PS5, Xbox, PC…); OK abre `com.webos.app.hdmiN`.

## Ajustes

- Atalho para os ajustes da TV (`com.palm.app.settings`).
- Ajustes do tvOS: cidade, chave TMDB (digitada no teclado da TV), apps da prateleira, formato
  do relógio, indicador de FPS/CPU, "Sobre" (versão, créditos, atribuição TMDB, licenças).

## Screensaver e dim (depois)

- Screensaver próprio após N minutos parado: fundo preto, relógio + clima, posição mudando a cada
  ~25 s; qualquer tecla sai. Registrar no screensaver da LG para ela não sobrepor
  (`tvpower/power/registerScreenSaverRequest`).
- Dim: escurece só as telas do tvOS (automático das 22h às 7h).
