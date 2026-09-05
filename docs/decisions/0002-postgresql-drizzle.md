# ADR 0002 — PostgreSQL com Drizzle ORM

**Estado:** aceita em 2026-09-04

## Contexto

A economia futura exigirá transações explícitas, bloqueios e constraints revisáveis. A modelagem
definitiva ainda depende da hospedagem e das regras do produto.

## Decisão

- PostgreSQL 18 é o banco principal; desenvolvimento local usa a imagem oficial
  `postgres:18.6-alpine3.23`.
- Drizzle ORM com `node-postgres` fornece acesso tipado sem esconder SQL e primitivas transacionais.
- O schema TypeScript é a fonte de verdade. Drizzle Kit gera migrations SQL versionadas; `push` não
  faz parte do fluxo do projeto.
- A aplicação valida a conexão antes de entrar no Discord e encerra pool e cliente ordenadamente.
- O pool começa limitado a 10 conexões por processo e poderá ser ajustado conforme a hospedagem.
- Nenhuma entidade de jogo será criada até o modelo correspondente ser definido.

O `drizzle-kit` está restrito ao desenvolvimento e migrations. A versão estável atual carrega uma
dependência transitiva antiga do `esbuild`, sinalizada pelo npm para servidores de desenvolvimento;
o projeto não expõe o Studio e a árvore de produção passa em `npm audit --omit=dev`. Não foi usado
`audit fix --force`, pois ele faria downgrade incompatível. A dependência deve ser atualizada assim
que o canal estável do Drizzle corrigir a árvore transitiva.

## Alternativas

Prisma oferece uma experiência de cliente mais abstrata e migrations maduras, mas adiciona geração
e uma camada maior entre os casos econômicos e o SQL. Para este bot, a transparência do Drizzle é
mais útil para revisar atomicidade, locks e constraints.
