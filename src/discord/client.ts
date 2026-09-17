import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  type Interaction,
  type Message,
} from 'discord.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { getCauldronStatus } from '../application/cauldron/index.js';
import { registerPlayer, getPlayerProfile } from '../application/players/index.js';
import { eq } from 'drizzle-orm';
import type { AppConfig } from '../config/env.js';
import { guildConfigs } from '../infrastructure/database/schema/index.js';
import type * as schema from '../infrastructure/database/schema/index.js';
import type { Logger } from '../shared/logger.js';
import {
  DropService,
  COLLECT_CANDY_BUTTON_ID,
  claimCandy,
} from '../application/drops/index.js';
import { createRegistrationPanel, REGISTER_BUTTON_ID } from './panel.js';

export async function createDiscordClient(
  config: AppConfig,
  logger: Logger,
  db: NodePgDatabase<typeof schema>
): Promise<Client> {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
    ],
  });

  const dropService = new DropService();

  // Cache em memória simples das configurações da guilda para alta performance
  let cachedConfig: typeof guildConfigs.$inferSelect | null = null;

  async function getConfig(guildId: string): Promise<typeof guildConfigs.$inferSelect | null> {
    if (cachedConfig && cachedConfig.guildId === guildId) return cachedConfig;
    const [found] = await db
      .select()
      .from(guildConfigs)
      .where(eq(guildConfigs.guildId, guildId))
      .limit(1);
    if (found) cachedConfig = found;
    return found ?? null;
  }

  client.once(Events.ClientReady, (readyClient) => {
    logger.info('Cliente Discord conectado.', {
      guildCount: readyClient.guilds.cache.size,
      userId: readyClient.user.id,
    });
  });

  // Handler de Mensagens para acionar Drops
  client.on(Events.MessageCreate, async (message: Message) => {
    if (message.author.bot || !message.guildId) return;

    try {
      const guildCfg = await getConfig(message.guildId);
      if (!guildCfg) return;

      // Restrição de canais configurados
      const allowedChannels = guildCfg.dropChannelIds ?? [];
      if (allowedChannels.length > 0 && !allowedChannels.includes(message.channelId)) {
        return;
      }

      if (dropService.shouldTriggerDrop(message.channelId)) {
        if (!message.channel.isSendable()) return;

        const reward = dropService.rollCandy();
        const dropPayload = dropService.createDropPayload(reward);
        const dropMessage = await message.channel.send(dropPayload);
        dropService.registerActiveDrop(dropMessage.id, reward);
      }
    } catch (error: unknown) {
      logger.error('Erro ao processar verificação de drop.', {
        error: error instanceof Error ? error.message : 'erro desconhecido',
        channelId: message.channelId,
      });
    }
  });

  const handleInteraction = async (interaction: Interaction): Promise<void> => {
    try {
      if (interaction.isChatInputCommand()) {

        if (interaction.commandName === 'caldeirao') {
          await interaction.deferReply();

          const status = await getCauldronStatus(db);

          const filledBlocks = Math.round(status.progressPercentage / 10);
          const emptyBlocks = 10 - filledBlocks;
          const progressBar = '🟩'.repeat(filledBlocks) + '⬛'.repeat(emptyBlocks);

          const embed = {
            title: '🧙 Caldeirão das Bruxas — Progresso Global',
            description:
              `O servidor já acumulou **${status.totalCandies} doces** no caldeirão comunitário!\n\n` +
              `**Meta do Nível ${status.currentTier + 1}:** [${progressBar}] ${status.progressPercentage}%\n` +
              `Faltam **${Math.max(0, status.nextTierGoal - status.totalCandies)}** doces para a próxima recompensa global.\n\n` +
              `### 🏆 Placar das Equipes\n` +
              `🏹 **Caçadores:** ${status.huntersScore} doces\n` +
              `👻 **Assombrações:** ${status.ghostsScore} doces\n\n` +
              `*(A equipe vencedora garante cargos e vantagens exclusivas ao final do evento)*`,
            color: 0x9b59b6,
            footer: { text: 'Project Wraith • Atualizado em tempo real' },
          };

          await interaction.editReply({ embeds: [embed] });
          return;
        }

        if (interaction.commandName === 'wraith') {
          await interaction.reply(createRegistrationPanel());
          return;
        }

        if (interaction.commandName === 'setup') {
          if (!interaction.guildId || !interaction.inCachedGuild()) {
            await interaction.reply({
              content: 'Este comando só pode ser usado dentro de um servidor.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
          

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          const banRole = interaction.options.getRole('ban_engagement', true);
          const hunterRole = interaction.options.getRole('cacadores', true);
          const ghostRole = interaction.options.getRole('assombracoes', true);
          const dropChannel = interaction.options.getChannel('drop_channel');

          const updated = await db
            .insert(guildConfigs)
            .values({
              guildId: interaction.guildId,
              banEngagementRoleId: banRole.id,
              hunterRoleId: hunterRole.id,
              ghostRoleId: ghostRole.id,
              dropChannelIds: dropChannel ? [dropChannel.id] : [],
            })
            .onConflictDoUpdate({
              target: guildConfigs.guildId,
              set: {
                banEngagementRoleId: banRole.id,
                hunterRoleId: hunterRole.id,
                ghostRoleId: ghostRole.id,
                dropChannelIds: dropChannel ? [dropChannel.id] : [],
                updatedAt: new Date(),
              },
            })
            .returning();

          cachedConfig = updated[0] ?? null;

          await interaction.editReply({
            content: `✅ Configuração do evento salva com sucesso!\n• **Cargo Bloqueado:** <@&${banRole.id}>\n• **Caçadores:** <@&${hunterRole.id}>\n• **Assombrações:** <@&${ghostRole.id}>`,
          });
          return;
        }

        if (interaction.commandName === 'participar') {
          if (!interaction.guildId || !interaction.inCachedGuild()) {
            await interaction.reply({
              content: 'Este comando só pode ser usado dentro de um servidor.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          const roleIds = Array.from(interaction.member.roles.cache.keys());
          const result = await registerPlayer(db as unknown as NodePgDatabase<Record<string, unknown>>, {
            userId: interaction.user.id,
            guildId: interaction.guildId,
            memberRoleIds: roleIds,
          });

          if (!result.success) {
            await interaction.editReply({
              content: '❌ Você possui um cargo restrito e não pode participar das atividades deste evento.',
            });
            return;
          }

          const teamName = result.team === 'HUNTERS' ? '🏹 Caçadores' : '👻 Assombrações';
          const msg = result.isNewRegistration
            ? `🎉 Você foi alocado para a equipe **${teamName}**!`
            : `Você já está registrado na equipe **${teamName}**.`;

          await interaction.editReply({ content: msg });
          return;
        }
      }

      if (interaction.isButton()) {
        // 1. Botão de Registro do Painel
        if (interaction.customId === REGISTER_BUTTON_ID) {
          if (!interaction.guildId || !interaction.inCachedGuild()) {
            await interaction.reply({
              content: 'Essa interação só pode ser usada em um servidor.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          await interaction.deferReply({ flags: MessageFlags.Ephemeral });

          const roleIds = Array.from(interaction.member.roles.cache.keys());
          const result = await registerPlayer(db as unknown as NodePgDatabase<Record<string, unknown>>, {
            userId: interaction.user.id,
            guildId: interaction.guildId,
            memberRoleIds: roleIds,
          });

          if (!result.success) {
            await interaction.editReply({
              content: '❌ Você possui um cargo restrito e não pode participar das atividades deste evento.',
            });
            return;
          }

          const teamName = result.team === 'HUNTERS' ? '🏹 Caçadores' : '👻 Assombrações';
          const msg = result.isNewRegistration
            ? `🎉 Você foi alocado para a equipe **${teamName}**!`
            : `Você já está registrado na equipe **${teamName}**.`;

          await interaction.editReply({ content: msg });
          return;
        }

        // 2. Botão de Coletar Doce
        if (interaction.customId === COLLECT_CANDY_BUTTON_ID) {
          if (!interaction.guildId || !interaction.inCachedGuild()) {
            await interaction.reply({
              content: 'Essa ação só pode ser realizada dentro do servidor.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const reward = dropService.claimDrop(interaction.message.id);

          if (!reward) {
            await interaction.reply({
              content: '💨 Tarde demais! Outro participante já coletou esse doce.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          // Trava de engajamento no resgate
          const guildCfg = await getConfig(interaction.guildId);
          if (
            guildCfg?.banEngagementRoleId &&
            interaction.member.roles.cache.has(guildCfg.banEngagementRoleId)
          ) {
            await interaction.reply({
              content: '❌ Você possui um cargo restrito e não pode coletar doces.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          const result = await claimCandy(db, {
            userId: interaction.user.id,
            guildId: interaction.guildId,
            reward,
          });

          if (!result.success) {
            await interaction.reply({
              content: '⚠️ Você precisa entrar no evento primeiro usando `/participar` ou pelo painel.',
              flags: MessageFlags.Ephemeral,
            });
            return;
          }

          // Edita a mensagem do drop desabilitando o botão e mostrando quem venceu
          await interaction.message.edit({
            content: `🍬 Coletado por <@${interaction.user.id}> (+${result.points} doces para **${result.team === 'HUNTERS' ? 'Caçadores' : 'Assombrações'}**)!`,
            components: [],
          });

          await interaction.reply({
            content: `✨ Você garantiu **+${result.points} doces**! Saldo atual: ${result.totalUserPoints}.`,
            flags: MessageFlags.Ephemeral,
          });
        }
      }
    } catch (error: unknown) {
      logger.error('Falha ao processar interação do Discord.', {
        error: error instanceof Error ? error.message : 'erro desconhecido',
        interactionId: interaction.id,
      });
    }
  };

  client.on(Events.InteractionCreate, (interaction) => {
    void handleInteraction(interaction);
  });

  client.on(Events.Error, (error) => {
    logger.error('Erro emitido pelo cliente Discord.', { error: error.message });
  });

  await client.login(config.discord.token);
  return client;
}