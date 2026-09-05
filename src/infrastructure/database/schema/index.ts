import { pgSchema } from 'drizzle-orm/pg-core';

/** Namespace reservado para as tabelas da aplicação, separado de metadados de ferramentas. */
export const wraithSchema = pgSchema('wraith');
