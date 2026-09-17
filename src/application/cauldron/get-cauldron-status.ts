import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { cauldronContributions } from '../../infrastructure/database/schema/index.js';
import type * as schema from '../../infrastructure/database/schema/index.js';

export interface CauldronStatus {
  totalCandies: number;
  huntersScore: number;
  ghostsScore: number;
  currentTier: number;
  nextTierGoal: number;
  progressPercentage: number;
}

const MILESTONES = [500, 1500, 3000, 6000, 10000];

export async function getCauldronStatus(
  db: NodePgDatabase<typeof schema>
): Promise<CauldronStatus> {
  const scores = await db
    .select({
      team: cauldronContributions.team,
      total: sql<number>`coalesce(sum(${cauldronContributions.candiesContributed}), 0)::int`,
    })
    .from(cauldronContributions)
    .groupBy(cauldronContributions.team);

  let huntersScore = 0;
  let ghostsScore = 0;

  for (const row of scores) {
    if (row.team === 'HUNTERS') huntersScore = row.total;
    if (row.team === 'GHOSTS') ghostsScore = row.total;
  }

  const totalCandies = huntersScore + ghostsScore;

  let currentTier = 0;
  let nextTierGoal = MILESTONES[0] ?? 500;

  for (let i = 0; i < MILESTONES.length; i++) {
    const goal = MILESTONES[i]!;
    if (totalCandies >= goal) {
      currentTier = i + 1;
      nextTierGoal = MILESTONES[i + 1] ?? goal;
    } else {
      nextTierGoal = goal;
      break;
    }
  }

  const progressPercentage = Math.min(
    100,
    Math.round((totalCandies / nextTierGoal) * 100)
  );

  return {
    totalCandies,
    huntersScore,
    ghostsScore,
    currentTier,
    nextTierGoal,
    progressPercentage,
  };
}