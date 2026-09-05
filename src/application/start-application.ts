import type { AppConfig } from '../config/env.js';
import { createDiscordClient } from '../discord/client.js';
import { createDatabase } from '../infrastructure/database/client.js';
import type { Logger } from '../shared/logger.js';

export async function startApplication(config: AppConfig, logger: Logger): Promise<void> {
  const database = createDatabase(config.database);

  await database.checkConnection();
  logger.info('Conexão com PostgreSQL validada.');

  let client;
  try {
    client = await createDiscordClient(config, logger);
  } catch (error: unknown) {
    await database.close();
    throw error;
  }

  let shuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    logger.info('Encerrando aplicação.', { signal });
    await client.destroy();
    await database.close();
    logger.info('Aplicação encerrada com segurança.');
  };

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}
