# ADR 0001 — Fundação TypeScript e Discord

**Estado:** aceita em 2026-09-04

## Decisão

- npm é o gerenciador do projeto; `package-lock.json` é o único lockfile.
- Node.js 24 LTS é o runtime mínimo (24.11 marcou a entrada dessa linha em LTS).
- O projeto usa ESM e TypeScript estrito. A linha 6.0 foi mantida por ser a mais nova aceita
  pelo `typescript-eslint` 8.69; TypeScript 7 será reavaliado quando houver suporte oficial.
- ESLint com regras tipadas, Prettier, o test runner nativo do Node e `tsx` formam a esteira de
  qualidade sem adicionar um framework de testes neste estágio.
- A configuração vem somente de variáveis de ambiente validadas na inicialização. Tokens nunca
  são incluídos nos dados estruturados do logger.
- O cliente Discord solicita apenas o intent `Guilds`. O comando `/wraith` demonstra Components
  V2 com `Container`, `TextDisplay`, botão e a flag `IsComponentsV2`.

## Consequências

O comando pode ser publicado em um servidor de desenvolvimento com `DISCORD_GUILD_ID`, onde a
atualização é mais rápida, ou globalmente quando essa variável for omitida. Banco, ORM e módulos
de jogo continuam deliberadamente fora desta fundação até as decisões pendentes serem resolvidas.
