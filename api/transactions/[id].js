// api/transactions/[id].js
const { getPool, ensureInit } = require("../../../lib/db");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE,OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  await ensureInit();
  const pool = getPool();
  const client = await pool.connect();
  const id = parseInt(req.query.id, 10);

  if (isNaN(id)) return res.status(400).json({ error: "Неверный ID" });

  try {
    const { rowCount } = await client.query("DELETE FROM transactions WHERE id = $1", [id]);
    if (rowCount === 0) return res.status(404).json({ error: "Транзакция не найдена" });
    res.json({ success: true });
  } catch (e) {
    console.error("Delete TX error:", e);
    res.status(500).json({ error: "Ошибка удаления" });
  } finally {
    client.release();
  }
}