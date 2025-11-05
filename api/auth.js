// api/auth.js
const bcrypt = require("bcrypt")
const { getPool, ensureInit } = require("../lib/db")

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST,PUT")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  await ensureInit()
  const pool = getPool()

  const { email, password, first_name, telegram_id, telegram_name } = req.body

  if (!email) {
    return res.status(400).json({ error: "Email обязателен" })
  }

  try {
    const existing = await pool.query("SELECT * FROM users WHERE email = $1", [email])

    if (existing.rowCount === 0) {
      // Регистрация
      const password_hash = password ? await bcrypt.hash(password, 10) : null
      const userResult = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, balance, income, expenses, savings_usd, goal_savings)
         VALUES ($1, $2, $3, 0, 0, 0, 0, 50000) RETURNING *`,
        [email, password_hash, first_name || email.split("@")[0]]
      )
      const user = userResult.rows[0]

      if (telegram_id && telegram_name) {
        await pool.query(
          `INSERT INTO linked_telegram_users (user_email, telegram_id, telegram_name)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_email, telegram_id) DO UPDATE SET telegram_name = $3`,
          [email, telegram_id, telegram_name]
        )
      }

      return res.json({ user: convertUser(user), transactions: [] })
    }

    // Вход
    const user = existing.rows[0]
    if (user.password_hash && password) {
      const ok = await bcrypt.compare(password, user.password_hash)
      if (!ok) return res.status(401).json({ error: "Неверный пароль" })
    }

    if (telegram_id && telegram_name) {
      await pool.query(
        `INSERT INTO linked_telegram_users (user_email, telegram_id, telegram_name)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_email, telegram_id) DO UPDATE SET telegram_name = $3`,
        [email, telegram_id, telegram_name]
      )
    }

    const tx = await pool.query("SELECT * FROM transactions WHERE user_email = $1 ORDER BY date DESC", [email])

    res.json({ user: convertUser(user), transactions: tx.rows })
  } catch (e) {
    console.error("Auth error:", e)
    res.status(500).json({ error: "Ошибка сервера: " + e.message })
  }
}

function convertUser(u) {
  return {
    email: u.email,
    first_name: u.first_name,
    balance: Number(u.balance || 0),
    income: Number(u.income || 0),
    expenses: Number(u.expenses || 0),
    savings_usd: Number(u.savings_usd || 0),
    goal_savings: Number(u.goal_savings || 50000),
  }
}