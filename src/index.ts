import { parseEnv } from './config/env.js';
import { createLogger } from './shared/logger.js';
import { createDatabase } from './infrastructure/database/client.js';
import { createDiscordClient } from './discord/client.js';

async function bootstrap(): Promise<void> {
  const config = parseEnv(process.env);
  const logger = createLogger(config.logLevel);

  logger.info('Iniciando Project Wraith...');

  const databaseContext = createDatabase(config.database);
  await databaseContext.checkConnection();
  logger.info('Conexão com PostgreSQL Neon estabelecida.');

  await createDiscordClient(config, logger, databaseContext.db);
}

bootstrap().catch((error: unknown) => {
  console.error('Falha fatal na inicialização da aplicação:', error);
  process.exit(1);
});