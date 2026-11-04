# Development Rules

## 1. Commits e autoria de IA
- Nunca commit ou push com coautoria de IA (Claude ou qualquer outra). O único autor é o dono da
  conta do GitHub, salvo pedido nominal.

## 2. Repositório público
- Nada pessoal ou sensível entra no git: segredo, token, IP/MAC da TV, chave do Developer Mode,
  e-mail, dado de conta de streaming. Config pessoal fica em `.env*` ou arquivo ignorado.
- Segredo apagado continua no histórico: vazou → **rotacionar** (ação humana) antes de qualquer
  limpeza.

## 3. Comandos sem efeito colateral
- Leitura, checks (`scripts/check-*.mjs`), testes e builds locais rodam sem pedir confirmação.
- Comando que **altera a TV** (instalar/remover app, mudar config, SSH no Developer Mode) ou o
  GitHub (push, PR, release, settings) só quando a tarefa pede.
- Segredos nunca são lidos nem exibidos sem liberação expressa; nome de variável pode, valor nunca.

## 4. Nuvem e custo
- Recurso pago novo com custo estimado **> US$ 5/mês** (ou bem acima do atual): pare e apresente
  decisão, custo mensal, comparação com hoje; espere aprovação. < US$ 2 não precisa.
- Recurso de nuvem, se um dia existir, nasce por código (IaC) com interruptor para pausar — nunca
  por console. Decisão em ADR.

## 5. Dependências
- Antes de adicionar: existe na stdlib/plataforma? já há dependência que resolve? Se não: checar
  manutenção, licença, tamanho no bundle e se roda no Chromium 53. Fixar versão (lockfile).
- Skill/MCP de terceiro: auditar antes de instalar (`tvos-skills`).

## 6. Documentação e skills
- Mudança que desatualiza o que uma doc/skill descreve atualiza a skill no mesmo trabalho
  (REGRA 1 do `CLAUDE.md`).
