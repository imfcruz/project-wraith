import {
  Client,
  Events,
  GatewayIntentBits,
  MessageFlags,
  type Interaction,
} from 'discord.js';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { AppConfig } from '../config/env.js';
import { guildConfigs, type teamEnum } from '../infrastructure/database/schema/index.js';
import type * as schema from '../infrastructure/database/schema/index.js';
import type { Logger } from '../shared/logger.js';
import { registerPlayer } from '../application/players/index.js';
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
    ],
  });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info('Cliente Discord conectado.', {
      guildCount: readyClient.guilds.cache.size,
      userId: readyClient.user.id,
    });
  });

  const handleInteraction = async (interaction: Interaction): Promise<void> => {
    try {
      if (interaction.isChatInputCommand()) {
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

          await db
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
            });

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

      if (interaction.isButton() && interaction.customId === REGISTER_BUTTON_ID) {
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