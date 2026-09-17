import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  type BaseMessageOptions,
} from 'discord.js';

export const COLLECT_CANDY_BUTTON_ID = 'wraith:collect_candy';

export type CandyRarity = 'COMMON' | 'RARE' | 'EPIC';

export interface CandyReward {
  rarity: CandyRarity;
  points: number;
  label: string;
}

export class DropService {
  private messageCounters = new Map<string, number>();
  private channelCooldowns = new Map<string, number>();
  private activeDrops = new Map<string, CandyReward>();

  // Configurações da cadência
  private readonly minMessagesBetweenDrops = 15;
  private readonly cooldownMs = 60_000; // 1 minuto mínimo entre drops por canal

  public shouldTriggerDrop(channelId: string): boolean {
    const now = Date.now();
    const lastDrop = this.channelCooldowns.get(channelId) ?? 0;

    if (now - lastDrop < this.cooldownMs) {
      return false;
    }

    const currentCount = (this.messageCounters.get(channelId) ?? 0) + 1;
    this.messageCounters.set(channelId, currentCount);

    if (currentCount >= this.minMessagesBetweenDrops) {
      // 30% de chance de spawn após bater o número mínimo de mensagens
      if (Math.random() <= 0.3) {
        this.messageCounters.set(channelId, 0);
        this.channelCooldowns.set(channelId, now);
        return true;
      }
    }

    return false;
  }

  public rollCandy(): CandyReward {
    const roll = Math.random();

    if (roll <= 0.10) {
      return { rarity: 'EPIC', points: 5, label: 'Docinho Lendário Dourado 🌟' };
    }
    if (roll <= 0.40) {
      return { rarity: 'RARE', points: 3, label: 'Pirulito Sinistro 🍭' };
    }
    return { rarity: 'COMMON', points: 1, label: 'Bala Fantasmagórica 🍬' };
  }

  public createDropPayload(reward: CandyReward): BaseMessageOptions {
    const embed = new EmbedBuilder()
      .setTitle('🍬 UM DOCE APARECEU!')
      .setDescription(
        `Um **${reward.label}** caiu no canal!\n\n` +
          `O primeiro jogador a clicar no botão abaixo garantirá **${reward.points} doce(s)** para sua equipe!`
      )
      .setColor(reward.rarity === 'EPIC' ? 0xf1c40f : reward.rarity === 'RARE' ? 0x9b59b6 : 0xe67e22)
      .setFooter({ text: 'Project Wraith • Seja o mais rápido!' });

    const button = new ButtonBuilder()
      .setCustomId(COLLECT_CANDY_BUTTON_ID)
      .setLabel('Coletar!')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎃');

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    return {
      embeds: [embed],
      components: [row],
    };
  }

  public registerActiveDrop(messageId: string, reward: CandyReward): void {
    this.activeDrops.set(messageId, reward);
  }

  public claimDrop(messageId: string): CandyReward | null {
    const reward = this.activeDrops.get(messageId);
    if (!reward) return null;
    this.activeDrops.delete(messageId);
    return reward;
  }
}