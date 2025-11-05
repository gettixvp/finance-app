// lib/db.js
const { Pool } = require("pg");

let pool;
let initialized = false;

const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is not set in environment variables");
    }

    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false // Для Render
      },
      max: 5,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  return pool;
};

const ensureInit = async () => {
  if (initialized) return;

  const client = getPool();

  try {
    console.log("Инициализация БД (без изменений данных)...");

    // Таблица users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        email TEXT PRIMARY KEY NOT NULL,
        password_hash TEXT,
        first_name TEXT,
        balance NUMERIC DEFAULT 0,
        income NUMERIC DEFAULT 0,
        expenses NUMERIC DEFAULT 0,
        savings_usd NUMERIC DEFAULT 0,
        goal_savings NUMERIC DEFAULT 50000,
        currency TEXT DEFAULT 'BYN'
      );
    `);

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS savings_usd NUMERIC DEFAULT 0;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS goal_savings NUMERIC DEFAULT 50000;`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'BYN';`);

    // Таблица transactions
    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id BIGSERIAL PRIMARY KEY,
        user_email TEXT NOT NULL REFERENCES users(email) ON DELETE CASCADE,
        type TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        converted_amount_usd NUMERIC,
        description TEXT,
        category TEXT,
        date TIMESTAMP DEFAULT NOW(),
        created_by_telegram_id BIGINT,
        created_by_name TEXT
      );
    `);

    await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS converted_amount_usd NUMERIC;`);
    await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_by_telegram_id BIGINT;`);
    await client.query(`ALTER TABLE transactions ADD COLUMN IF NOT EXISTS created_by_name TEXT;`);

    // Таблица linked_telegram_users
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

    console.log("БД готова! (Данные сохранены)");
    initialized = true;
  } catch (error) {
    console.error("Ошибка инициализации БД:", error);
    throw error;
  }
};

module.exports = { getPool, ensureInit };