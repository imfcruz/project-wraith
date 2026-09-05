import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseEnv } from './env.js';

const validEnv = {
  DISCORD_APPLICATION_ID: '12345678901234567',
  DISCORD_TOKEN: 'token-de-teste',
  DATABASE_URL: 'postgresql://wraith:secret@localhost:5432/wraith',
};

void describe('parseEnv', () => {
  void it('aceita a configuração mínima e aplica o nível de log padrão', () => {
    const config = parseEnv(validEnv);
    assert.equal(config.logLevel, 'info');
    assert.equal(config.discord.guildId, undefined);
  });

  void it('não expõe o token ao relatar uma configuração inválida', () => {
    assert.throws(
      () => parseEnv({ ...validEnv, DISCORD_APPLICATION_ID: 'inválido' }),
      /DISCORD_APPLICATION_ID deve ser um snowflake válido/,
    );
  });

  void it('rejeita nível de log desconhecido', () => {
    assert.throws(() => parseEnv({ ...validEnv, LOG_LEVEL: 'verbose' }), /LOG_LEVEL/);
  });

  void it('rejeita uma conexão que não seja PostgreSQL', () => {
    assert.throws(
      () => parseEnv({ ...validEnv, DATABASE_URL: 'mysql://localhost/wraith' }),
      /DATABASE_URL deve ser uma URL válida do PostgreSQL/,
    );
  });

  void it('valida o tamanho máximo do pool', () => {
    assert.throws(
      () => parseEnv({ ...validEnv, DATABASE_POOL_MAX: '0' }),
      /DATABASE_POOL_MAX deve ser um número inteiro positivo/,
    );
  });
});
