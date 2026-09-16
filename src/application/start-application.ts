import type { AppConfig } from '../config/env.js';
import { createDiscordClient } from '../discord/client.js';
import { createDatabase } from '../infrastructure/database/client.js';
import type { Logger } from '../shared/logger.js';

export async function startApplication(config: AppConfig, logger: Logger): Promise<void> {
  logger.info('Iniciando Project Wraith...');

  const dbContext = createDatabase(config.database);
  await dbContext.checkConnection();
  logger.info('Conexão com PostgreSQL estabelecida com sucesso.');

  await createDiscordClient(config, logger, dbContext.db);

  logger.info('Project Wraith iniciado com sucesso.');
}