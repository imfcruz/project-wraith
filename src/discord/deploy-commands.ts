import { REST, Routes, SlashCommandBuilder } from 'discord.js';

import { parseEnv } from '../config/env.js';

const config = parseEnv(process.env);
const commands = [
  new SlashCommandBuilder()
    .setName('wraith')
    .setDescription('Abre o painel de diagnóstico do Project Wraith.'),
].map((command) => command.toJSON());

const rest = new REST().setToken(config.discord.token);
const route = config.discord.guildId
  ? Routes.applicationGuildCommands(config.discord.applicationId, config.discord.guildId)
  : Routes.applicationCommands(config.discord.applicationId);

await rest.put(route, { body: commands });
console.log(`Comando registrado no escopo ${config.discord.guildId ? 'do servidor' : 'global'}.`);
