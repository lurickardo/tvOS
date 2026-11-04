---
name: tvos-refine
description: >-
  Refina uma ideia crua de feature do tvOS numa spec curta e verificável antes do planejamento
  (spec-driven development inspirado em Kiro/spec-kit): entende o que já existe, checa encaixe
  com a experiência de TV (controle remoto, 3 metros, pouca memória), faz perguntas objetivas com
  recomendação, escreve requisitos no formato EARS ("QUANDO … O SISTEMA DEVE …"), fora de escopo,
  riscos e tarefas numeradas rastreáveis, e salva em context/specs/<slug>/spec.md; ideia grande
  vira várias specs sequenciadas. Acione quando o usuário mandar uma ideia solta, "refina essa
  ideia", "me ajuda a lapidar essa feature", "vale a pena fazer X?", ou para transformar um
  módulo do MVP (tvos-produto) em spec. NÃO implementa nem desce a arquivos — isso é tvos-plan-prompt.
---

# tvOS — Refinar ideia em spec

> **Regra de ouro:** spec descreve **comportamento observável na TV**, não código. Se um requisito
> não dá para testar olhando a tela com o controle na mão, reescreva.

## Fluxo

1. **Entender o hoje.** Leia `CLAUDE.md` (estado e "Em aberto"), `tvos-produto` (princípios e módulos) e `tvos-context`. Confirme
   no código se a ideia já existe.
2. **Encaixe.** Funciona só com o controle? Legível a 3 m? Cabe na memória/CPU da TV? Precisa de
   rede/serviço pago? Se conflita, diga e proponha variação.
3. **Perguntas (máx. 4 por rodada).** Só o que muda o comportamento: o que aparece, o que persiste,
   o que acontece offline/erro, de onde vem o conteúdo, quem usa (perfis?). Cada pergunta com
   opções e a recomendada primeiro, com o porquê.
4. **Tamanho.** Se > ~1 semana ou cruza várias áreas, quebre em specs `NN-<slug>` que entregam
   valor sozinhas.
5. **Escrever** `context/specs/<slug>/spec.md` (template abaixo). Slug kebab-case sem acento.
6. **Entregar** o caminho + resumo de 3 linhas + próximo passo: decisão duradoura → `tvos-adr`;
   depois "use `tvos-plan-prompt` com esta spec".

## Template

```markdown
# <Título da feature>

Status: rascunho | aprovada   ·   Data: AAAA-MM-DD

## Problema
<quem sofre, quando, por quê — 3 a 5 linhas>

## Resultado esperado
<como a tela fica depois, na voz de quem está no sofá>

## Requisitos (EARS)
1. QUANDO <gatilho> O SISTEMA DEVE <comportamento>.
2. ENQUANTO <estado> O SISTEMA DEVE <comportamento>.
3. SE <condição indesejada> ENTÃO O SISTEMA DEVE <tratamento>.
4. O SISTEMA DEVE <comportamento sempre verdadeiro>.

## Navegação
<de onde se chega, ordem de foco, o que o Voltar faz, teclas especiais (cores, mídia)>

## Fora de escopo
- ...

## Riscos e perguntas abertas
- ...

## Tarefas
1. <tarefa entregável> — cobre R1, R2

## Como verificar
- <passo com o controle/teclado por requisito>
```

## Regras

- Um requisito = uma frase testável; numerados para rastrear nas tarefas.
- Sempre: o que o Voltar faz, estados vazio/carregando/erro e o caso offline.
- Não inventar arquivo, lib ou endpoint — isso é do plano.
- Custo cloud envolvido → sinalizar em "Riscos" (gate de custo do `CLAUDE.md`).

## Skills irmãs

- `tvos-plan-prompt` — próximo passo.
- `tvos-adr` — se a ideia muda arquitetura.
- `tvos-context` — limites da plataforma.

---

Fontes: padrão EARS (Mavin et al.), Kiro specs, GitHub spec-kit, skill `fantasy-quest-refine` do
autor. Em conflito, a necessidade do usuário vence o template.
