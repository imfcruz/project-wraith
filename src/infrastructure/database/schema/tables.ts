import {
  pgSchema,
  text,
  timestamp,
  integer,
  bigint,
  pgEnum,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

/** Namespace reservado para as tabelas da aplicação */
export const wraithSchema = pgSchema('wraith');

// Enums para integridade estrita
export const teamEnum = wraithSchema.enum('team_type', ['HUNTERS', 'GHOSTS']);
export const candyTierEnum = wraithSchema.enum('candy_tier', ['COMMON', 'RARE', 'EPIC']);

// 1. Configuração dinâmica gerenciada via /setup
export const guildConfigs = wraithSchema.table('guild_configs', {
  guildId: text('guild_id').primaryKey(),
  banEngagementRoleId: text('ban_engagement_role_id'),
  hunterRoleId: text('hunter_role_id'),
  ghostRoleId: text('ghost_role_id'),
  adminRoleId: text('admin_role_id'),
  dropChannelIds: text('drop_channel_ids').array(),
  commandChannelIds: text('command_channel_ids').array(),
  peakStartHour: integer('peak_start_hour').default(17).notNull(),
  peakEndHour: integer('peak_end_hour').default(2).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// 2. Participantes registrados (time fixo gravado no banco)
export const players = wraithSchema.table('players', {
  userId: text('user_id').primaryKey(),
  guildId: text('guild_id').notNull(),
  team: teamEnum('team').notNull(),
  joinedAt: timestamp('joined_at', { withTimezone: true }).defaultNow().notNull(),
  curseCooldownUntil: timestamp('curse_cooldown_until', { withTimezone: true }),
});

// 3. Saldos individuais de doces por raridade
export const balances = wraithSchema.table(
  'balances',
  {
    id: text('id').primaryKey(), // `${userId}_${tier}`
    userId: text('user_id').references(() => players.userId).notNull(),
    tier: candyTierEnum('tier').notNull(),
    amount: integer('amount').default(0).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('user_tier_idx').on(table.userId, table.tier),
  ]
);

// 4. Livro-razão (Ledger): auditoria estrita de transações econômicas
export const ledgerEntries = wraithSchema.table('ledger_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  tier: candyTierEnum('tier').notNull(),
  amount: integer('amount').notNull(),
  operationType: text('operation_type').notNull(), // 'DROP', 'SHOP_PURCHASE', 'TRADE', 'ADMIN'
  metadata: text('metadata'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 5. Histórico cumulativo do Caldeirão Coletivo
export const cauldronContributions = wraithSchema.table('cauldron_contributions', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => players.userId).notNull(),
  team: teamEnum('team').notNull(),
  candiesContributed: integer('candies_contributed').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// 6. Telemetria diária para o comando /metricas
export const dailyMetrics = wraithSchema.table('daily_metrics', {
  dateKey: text('date_key').primaryKey(), // YYYY-MM-DD
  messagesRead: bigint('messages_read', { mode: 'number' }).default(0).notNull(),
  commandsExecuted: integer('commands_executed').default(0).notNull(),
  candiesDropped: integer('candies_dropped').default(0).notNull(),
  cursesApplied: integer('curses_applied').default(0).notNull(),
});