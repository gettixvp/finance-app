// api/user/[email].js
const { getPool, ensureInit } = require("../../lib/db")

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "PUT,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  await ensureInit()
  const pool = getPool()

  const { email } = req.query

  if (!email) {
    return res.status(400).json({ error: "Email обязателен" })
  }

  try {
    const { balance, income, expenses, savings, goalSavings } = req.body

    await pool.query(
      `UPDATE users
       SET balance=$1, income=$2, expenses=$3, savings_usd=$4, goal_savings=$5
       WHERE email=$6`,
      [balance || 0, income || 0, expenses || 0, savings || 0, goalSavings || 50000, email]
    )
    return res.json({ success: true })
  } catch (e) {
    console.error("User update error:", e)
    res.status(500).json({ error: "Не удалось сохранить: " + e.message })
  }
}