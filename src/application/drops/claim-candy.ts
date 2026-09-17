import { and, eq, sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import {
  balances,
  cauldronContributions,
  ledgerEntries,
  players,
} from '../../infrastructure/database/schema/index.js';
import type * as schema from '../../infrastructure/database/schema/index.js';
import type { CandyReward } from './drop-service.js';

export interface ClaimCandyInput {
  userId: string;
  guildId: string;
  reward: CandyReward;
}

export type ClaimCandyResult =
  | { success: true; team: string; points: number; totalUserPoints: number }
  | { success: false; reason: 'NOT_REGISTERED' };

export async function claimCandy(
  db: NodePgDatabase<typeof schema>,
  input: ClaimCandyInput
): Promise<ClaimCandyResult> {
  const { userId, reward } = input;

  return await db.transaction(async (tx) => {
    // 1. Verifica se o usuário é participante registrado
    const [player] = await tx
      .select()
      .from(players)
      .where(eq(players.userId, userId))
      .limit(1);

    if (!player) {
      return { success: false, reason: 'NOT_REGISTERED' };
    }

    // 2. Incrementa o saldo individual por tier (upsert atômico)
    const [balance] = await tx
      .insert(balances)
      .values({
        id: `${userId}:${reward.rarity}`,
        userId,
        tier: reward.rarity,
        amount: reward.points,
      })
      .onConflictDoUpdate({
        target: [balances.userId, balances.tier],
        set: {
          amount: sql`${balances.amount} + ${reward.points}`,
          updatedAt: new Date(),
        },
      })
      .returning({ amount: balances.amount });

    // 3. Registra no livro-razão (ledger) para histórico e auditoria
    await tx.insert(ledgerEntries).values({
      id: crypto.randomUUID(),
      userId,
      tier: reward.rarity,
      amount: reward.points,
      operationType: 'DROP_CLAIM',
      metadata: JSON.stringify({ label: reward.label }),
    });

    // 4. Registra contribuição no Caldeirão coletivo
    await tx.insert(cauldronContributions).values({
      id: crypto.randomUUID(),
      userId,
      team: player.team,
      candiesContributed: reward.points,
    });

    return {
      success: true,
      team: player.team,
      points: reward.points,
      totalUserPoints: balance?.amount ?? reward.points,
    };
  });
}