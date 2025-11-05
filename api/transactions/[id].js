// api/transactions/[id].js
const { getPool, ensureInit } = require("../../lib/db")

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*")
  res.setHeader("Access-Control-Allow-Methods", "DELETE,OPTIONS")
  res.setHeader("Access-Control-Allow-Headers", "Content-Type")

  if (req.method === "OPTIONS") {
    return res.status(200).end()
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  await ensureInit()
  const pool = getPool()

  const { id } = req.query
  const txId = Number.parseInt(id, 10)

  if (isNaN(txId)) {
    return res.status(400).json({ error: "Неверный ID" })
  }

  try {
    const result = await pool.query("DELETE FROM transactions WHERE id = $1 RETURNING *", [txId])
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Транзакция не найдена" })
    }
    res.json({ success: true })
  } catch (e) {
    console.error("TX delete error:", e)
    res.status(500).json({ error: "Ошибка удаления: " + e.message })
  }
}