// api/transactions/index.js
const { getPool, ensureInit } = require("../../lib/db")

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,POST")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  await ensureInit()
  const pool = getPool()

  try {
    if (req.method === "GET") {
      const { user_email } = req.query
      if (!user_email) return res.status(400).json({ error: "Email обязателен" })

      const r = await pool.query("SELECT * FROM transactions WHERE user_email = $1 ORDER BY date DESC", [user_email])
      return res.json(r.rows)
    }

    if (req.method === "POST") {
      const {
        user_id,
        type,
        amount,
        description,
        category,
        converted_amount_usd,
        created_by_telegram_id,
        created_by_name,
      } = req.body

      const user_email = user_id

      if (!user_email) {
        return res.status(400).json({ error: "Email пользователя обязателен" })
      }

      const r = await pool.query(
        `INSERT INTO transactions (user_email, type, amount, converted_amount_usd, description, category, created_by_telegram_id, created_by_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [user_email, type, amount || 0, converted_amount_usd, description, category, created_by_telegram_id, created_by_name]
      )
      return res.json(r.rows[0])
    }

    return res.status(405).json({ error: "Method not allowed" })
  } catch (e) {
    console.error("TX error:", e)
    res.status(500).json({ error: "Ошибка транзакции: " + e.message })
  }
}