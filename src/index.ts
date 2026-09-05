import { startApplication } from './application/start-application.js';
import { parseEnv } from './config/env.js';
import { createLogger } from './shared/logger.js';

async function main(): Promise<void> {
  const config = parseEnv(process.env);
  const logger = createLogger(config.logLevel);
  await startApplication(config, logger);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Erro desconhecido na inicialização.';
  console.error(JSON.stringify({ level: 'error', message }));
  process.exitCode = 1;
});
