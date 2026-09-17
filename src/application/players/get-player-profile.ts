import { eq } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { balances, players } from '../../infrastructure/database/schema/index.js';
import type * as schema from '../../infrastructure/database/schema/index.js';

export interface PlayerProfile {
  userId: string;
  team: 'HUNTERS' | 'GHOSTS';
  totalPoints: number;
  tiers: {
    common: number;
    rare: number;
    epic: number;
  };
}

export async function getPlayerProfile(
  db: NodePgDatabase<typeof schema>,
  userId: string
): Promise<PlayerProfile | null> {
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.userId, userId))
    .limit(1);

  if (!player) {
    return null;
  }

  const userBalances = await db
    .select()
    .from(balances)
    .where(eq(balances.userId, userId));

  let common = 0;
  let rare = 0;
  let epic = 0;

  for (const item of userBalances) {
    if (item.tier === 'COMMON') common = item.amount;
    if (item.tier === 'RARE') rare = item.amount;
    if (item.tier === 'EPIC') epic = item.amount;
  }

  const totalPoints = common + rare + epic;

  return {
    userId,
    team: player.team as 'HUNTERS' | 'GHOSTS',
    totalPoints,
    tiers: { common, rare, epic },
  };
}