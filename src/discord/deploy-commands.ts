import {
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';
import { parseEnv } from '../config/env.js';
import { createLogger } from '../shared/logger.js';

export async function deployCommands(): Promise<void> {
  const config = parseEnv(process.env);
  const logger = createLogger(config.logLevel);

  const commands = [
    new SlashCommandBuilder()
      .setName('wraith')
      .setDescription('Envia o painel interativo de entrada do evento de Halloween.')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    new SlashCommandBuilder()
      .setName('participar')
      .setDescription('Entra no evento de Halloween e recebe sua equipe balanceada.'),

      new SlashCommandBuilder()
      .setName('caldeirao')
      .setDescription('Exibe o progresso do Caldeirão global e o placar das equipes.'),

    new SlashCommandBuilder()
      .setName('setup')
      .setDescription('Configura os cargos e canais operacionais do evento.')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addRoleOption((opt) =>
        opt
          .setName('ban_engagement')
          .setDescription('Cargo impedido de interagir no evento')
          .setRequired(true)
      )
      .addRoleOption((opt) =>
        opt
          .setName('cacadores')
          .setDescription('Cargo da equipe Hunters')
          .setRequired(true)
      )
      .addRoleOption((opt) =>
        opt
          .setName('assombracoes')
          .setDescription('Cargo da equipe Ghosts')
          .setRequired(true)
      )
      .addChannelOption((opt) =>
        opt
          .setName('drop_channel')
          .setDescription('Canal permitido para drops de doces')
          .addChannelTypes(ChannelType.GuildText)
          .setRequired(false)
      ),
  ].map((cmd) => cmd.toJSON());

  const rest = new REST({ version: '10' }).setToken(config.discord.token);

  logger.info('Iniciando deploy de slash commands...');

  await rest.put(Routes.applicationCommands(config.discord.applicationId), {
    body: commands,
  });

  logger.info('Slash commands registrados globalmente com sucesso.');
}

// Execução direta via terminal
if (process.argv[1]?.endsWith('deploy-commands.ts') || process.argv[1]?.endsWith('deploy-commands.js')) {
  deployCommands().catch((error: unknown) => {
    console.error('Falha ao registrar slash commands:', error);
    process.exitCode = 1;
  });
}