import { eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { guildConfigs, players, type teamEnum } from '../../infrastructure/database/schema/index.js';

export type TeamType = (typeof teamEnum.enumValues)[number];

export interface RegisterPlayerInput {
  userId: string;
  guildId: string;
  memberRoleIds: string[];
}

export type RegisterPlayerResult =
  | { success: true; team: TeamType; isNewRegistration: boolean }
  | { success: false; reason: 'BANNED_ENGAGEMENT' };

export async function registerPlayer(
  db: NodePgDatabase<Record<string, unknown>>,
  input: RegisterPlayerInput
): Promise<RegisterPlayerResult> {
  const { userId, guildId, memberRoleIds } = input;

  // 1. Busca configurações ativas da guilda
  const [config] = await db
    .select()
    .from(guildConfigs)
    .where(eq(guildConfigs.guildId, guildId))
    .limit(1);

  // 2. Trava estrita de cargo proibido
  if (config?.banEngagementRoleId && memberRoleIds.includes(config.banEngagementRoleId)) {
    return { success: false, reason: 'BANNED_ENGAGEMENT' };
  }

  // 3. Verifica se o usuário já tem registro prévio (time imutável)
  const [existingPlayer] = await db
    .select()
    .from(players)
    .where(eq(players.userId, userId))
    .limit(1);

  if (existingPlayer) {
    return {
      success: true,
      team: existingPlayer.team as TeamType,
      isNewRegistration: false,
    };
  }

  // 4. Contagem atômica de membros em cada equipe para balanceamento
  const counts = await db
    .select({
      team: players.team,
      count: sql<number>`count(*)::int`,
    })
    .from(players)
    .where(eq(players.guildId, guildId))
    .groupBy(players.team);

  let huntersCount = 0;
  let ghostsCount = 0;

  for (const row of counts) {
    if (row.team === 'HUNTERS') huntersCount = row.count;
    if (row.team === 'GHOSTS') ghostsCount = row.count;
  }

  // 5. Atribuição: time com menor número ou sorteio aleatório em empate
  let assignedTeam: TeamType;
  if (huntersCount < ghostsCount) {
    assignedTeam = 'HUNTERS';
  } else if (ghostsCount < huntersCount) {
    assignedTeam = 'GHOSTS';
  } else {
    assignedTeam = Math.random() < 0.5 ? 'HUNTERS' : 'GHOSTS';
  }

  // 6. Persistência do registro no banco
  await db.insert(players).values({
    userId,
    guildId,
    team: assignedTeam,
  });

  return {
    success: true,
    team: assignedTeam,
    isNewRegistration: true,
  };
}