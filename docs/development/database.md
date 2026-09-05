# PostgreSQL em desenvolvimento

O projeto usa PostgreSQL 18 e Drizzle ORM com o driver `node-postgres`. O schema TypeScript é a
fonte de verdade e toda mudança deve gerar SQL versionado em `drizzle/`.

## Preparação

1. Instale Docker Engine com o plugin Compose pelo procedimento oficial da sua distribuição.
2. Copie `.env.example` para `.env` e troque `POSTGRES_PASSWORD` e a senha dentro de
   `DATABASE_URL` pelo mesmo valor.
3. Inicie o banco com `npm run db:up`.
4. Acompanhe a inicialização com `npm run db:logs`.
5. Aplique migrations existentes com `npm run db:migrate`.

O serviço publica a porta somente em `127.0.0.1`; não fica exposto à rede local. Os dados ficam no
volume nomeado `project-wraith_postgres_data`. `npm run db:down` remove os containers e a rede,
mas preserva esse volume.

## Fluxo de migrations

Após alterar um arquivo em `src/infrastructure/database/schema/`:

1. execute `npm run db:generate`;
2. revise o SQL gerado em `drizzle/`;
3. execute `npm run db:check`;
4. aplique localmente com `npm run db:migrate`;
5. execute os testes antes de versionar schema, snapshot e migration juntos.

Não use `drizzle-kit push`: ele altera o banco sem produzir o histórico SQL revisável adotado pelo
projeto. Migrations de produção devem rodar como etapa única de implantação, nunca em todas as
réplicas do bot ao iniciarem simultaneamente.
