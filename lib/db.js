// lib/db.js
const { Pool } = require("pg");

let pool;
let initialized = false;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false, // Render требует
      },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
};

const ensureInit = async () => {
  if (initialized) return;
  const client = getPool();

  try {
    console.log("Инициализация БД (без изменений данных)...");

    // Пользователи
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS savings_usd NUMERIC DEFAULT 0,
      ADD COLUMN IF NOT EXISTS goal_savings NUMERIC DEFAULT 50000,
      ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BYN';
    `);

    // Транзакции
    await client.query(`
      ALTER TABLE transactions 
      ADD COLUMN IF NOT EXISTS converted_amount_usd NUMERIC,
      ADD COLUMN IF NOT EXISTS created_by_telegram_id BIGINT,
      ADD COLUMN IF NOT EXISTS created_by_name TEXT;
    `);

    // Связанные пользователи
    await client.query(`
      CREATE TABLE IF NOT EXISTS linked_telegram_users (
        id SERIAL PRIMARY KEY,
        user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        telegram_id BIGINT NOT NULL,
        telegram_name TEXT,
        linked_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_email, telegram_id)
      );
    `);

    console.log("БД готова (данные сохранены)");
    initialized = true;
  } catch (error) {
    console.error("Ошибка инициализации БД:", error);
    throw error;
  }
};

module.exports = { getPool, ensureInit };