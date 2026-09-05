const snowflakePattern = /^\d{17,20}$/;
const logLevels = ['debug', 'info', 'warn', 'error'] as const;

export type LogLevel = (typeof logLevels)[number];

function isLogLevel(value: string): value is LogLevel {
  return logLevels.some((level) => level === value);
}

export interface AppConfig {
  readonly database: {
    readonly poolMax: number;
    readonly url: string;
  };
  readonly discord: {
    readonly applicationId: string;
    readonly guildId?: string;
    readonly token: string;
  };
  readonly logLevel: LogLevel;
}

function databaseUrl(env: NodeJS.ProcessEnv): string {
  const rawUrl = required(env, 'DATABASE_URL');

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') throw new Error();
    if (!url.hostname || !url.pathname.slice(1)) throw new Error();
  } catch {
    throw new Error('DATABASE_URL deve ser uma URL válida do PostgreSQL.');
  }

  return rawUrl;
}

function positiveInteger(env: NodeJS.ProcessEnv, name: string, fallback: number): number {
  const rawValue = env[name]?.trim();
  if (!rawValue) return fallback;

  const value = Number(rawValue);
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new Error(`${name} deve ser um número inteiro positivo.`);
  }
  return value;
}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`A variável de ambiente ${name} é obrigatória.`);
  return value;
}

function snowflake(env: NodeJS.ProcessEnv, name: string, optional = false): string | undefined {
  const value = env[name]?.trim();
  if (!value && optional) return undefined;
  if (!value || !snowflakePattern.test(value)) {
    throw new Error(`${name} deve ser um snowflake válido do Discord.`);
  }
  return value;
}

export function parseEnv(env: NodeJS.ProcessEnv): AppConfig {
  const token = required(env, 'DISCORD_TOKEN');
  const applicationId = required(env, 'DISCORD_APPLICATION_ID');
  if (!snowflakePattern.test(applicationId)) {
    throw new Error('DISCORD_APPLICATION_ID deve ser um snowflake válido do Discord.');
  }
  const guildId = snowflake(env, 'DISCORD_GUILD_ID', true);
  const rawLogLevel = env['LOG_LEVEL']?.trim() ?? 'info';

  if (!isLogLevel(rawLogLevel)) {
    throw new Error(`LOG_LEVEL deve ser um destes valores: ${logLevels.join(', ')}.`);
  }

  return {
    database: {
      poolMax: positiveInteger(env, 'DATABASE_POOL_MAX', 10),
      url: databaseUrl(env),
    },
    discord: {
      applicationId,
      ...(guildId ? { guildId } : {}),
      token,
    },
    logLevel: rawLogLevel,
  };
}
