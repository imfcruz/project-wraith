import { Client, Events, GatewayIntentBits, MessageFlags, type Interaction } from 'discord.js';

import type { AppConfig } from '../config/env.js';
import type { Logger } from '../shared/logger.js';
import { createFoundationPanel, PANEL_BUTTON_ID } from './panel.js';

export async function createDiscordClient(config: AppConfig, logger: Logger): Promise<Client> {
  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info('Cliente Discord conectado.', {
      guildCount: readyClient.guilds.cache.size,
      userId: readyClient.user.id,
    });
  });

  const handleInteraction = async (interaction: Interaction): Promise<void> => {
    try {
      if (interaction.isChatInputCommand() && interaction.commandName === 'wraith') {
        await interaction.reply(createFoundationPanel());
        return;
      }

      if (interaction.isButton() && interaction.customId === PANEL_BUTTON_ID) {
        await interaction.reply({
          content: 'O Project Wraith está online e respondendo.',
          flags: MessageFlags.Ephemeral,
        });
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
