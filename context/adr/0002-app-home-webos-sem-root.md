# 0002 — tvOS é um app home webOS instalado pelo Developer Mode, sem root

Status: substituído pelo ADR 0007 (2026-11-04: TV rootada, tvOS virou a home); a TV de destino passou a ser a 43LM631C0SB, webOS 4.x (ADR 0006)
Decisores: Lurickardo

## Contexto

O objetivo é trocar a experiência lenta e cheia de anúncios da home da LG 43UP7500PSF (webOS TV
6.x) por algo rápido. O firmware da TV é assinado pela LG: não dá para trocar o sistema
operacional. O que é possível:

- **App web (`.ipk`) pelo Developer Mode oficial** (conta grátis de desenvolvedor LG). Funciona em
  TV de fábrica, sem root. Abre segurando uma tecla numérica do controle (atalho de acesso
  rápido). É o caminho do FreeMyTvWebOS e do free-my-tv.
- **Root + Homebrew Channel**: abre ao ligar a TV, assume o botão Home e dá acesso amplo ao
  sistema. Depende de exploit para a versão do firmware e traz risco (garantia, brick, superfície
  de ataque).

O usuário pediu para seguir o que o FreeMyTvWebOS recomenda, o mais alinhado possível.

## Decisão

1. O tvOS é um **app web `.ipk`** (`com.lurickardo.tvos`) com um **JS service**
   (`com.lurickardo.tvos.service`) no mesmo pacote, instalado pelo **Developer Mode oficial, sem
   root**. A home da LG continua intacta.
2. Abre por **atalho numérico** (segurar um número com o tvOS aberto e atribuir). Não há gancho no
   botão Home.
3. **Key Server do Developer Mode fica OFF** depois de instalar: com ele ligado, qualquer um no
   Wi-Fi que saiba a passphrase baixa a chave SSH da TV.
4. A sessão do Developer Mode é renovada antes de expirar (cerca de 40 dias) pelo botão EXTEND
   no app Developer Mode. Se expirar, a TV remove os apps de desenvolvedor e é só reinstalar.
5. Código dos projetos de referência (ambos MIT) entra **só em partes provadas e com atribuição**
   (`THIRD_PARTY_NOTICES.md`); o app é reescrito no padrão deste repo.
6. Publicar no repositório do Homebrew Channel (`webosbrew/apps-repo`), root, autostart ou gancho
   no Home: **só com ADR novo**.

## Alternativas consideradas

- Root + Homebrew Channel: mais poder, mas exploit e risco. Fica para ADR futuro, se o atalho
  numérico não bastar.
- Fork completo do FreeMyTvWebOS: mais rápido para ver algo na TV, mas herda um `index.html` de
  145 KB em ES5 (feito para webOS 3) e briga com a modularidade deste repo.

## Consequências

- Positivas: reversível (desinstalar devolve a TV ao original), sem risco de brick, sem
  telemetria da LG no nosso app.
- Negativas: não abre ao ligar a TV; o Developer Mode precisa ser renovado; APIs do sistema
  limitadas ao que um app de desenvolvedor sem root pode chamar.
- Custo: zero.

## Como verificar que está sendo seguida

`app/appinfo.json` com `id` `com.lurickardo.tvos`; nada no repo depende de
`org.webosbrew.hbchannel.service` nem de root; `THIRD_PARTY_NOTICES.md` lista o código reaproveitado.
