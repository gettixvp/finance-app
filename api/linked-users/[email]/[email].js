// api/linked-users/[email].js
const { getPool, ensureInit } = require("../../lib/db")

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  await ensureInit()
  const pool = getPool()

  const { email } = req.query

  if (!email) {
    return res.status(400).json({ error: "Email обязателен" })
  }

  try {
    const result = await pool.query(
      "SELECT telegram_id, telegram_name, linked_at FROM linked_telegram_users WHERE user_email = $1 ORDER BY linked_at",
      [email]
    )
    return res.json({ linkedUsers: result.rows })
  } catch (e) {
    console.error("Linked users error:", e)
    res.status(500).json({ error: "Ошибка получения пользователей: " + e.message })
  }
}