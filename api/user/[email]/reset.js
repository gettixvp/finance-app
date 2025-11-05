// api/user/reset.js
const { getPool, ensureInit } = require("../../../lib/db");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  await ensureInit();
  const pool = getPool();
  const client = await pool.connect();
  const { email } = req.body;

  if (!email) return res.status(400).json({ error: "Email обязателен" });

  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM transactions WHERE user_email = $1", [email]);
    await client.query("UPDATE users SET balance=0, income=0, expenses=0, savings_usd=0 WHERE email=$1", [email]);
    await client.query("COMMIT");
    res.json({ success: true });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error("Reset error:", e);
    res.status(500).json({ error: "Ошибка сброса" });
  } finally {
    client.release();
  }
}