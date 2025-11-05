// api/user/[email]/reset.js
const { getPool, ensureInit } = require("../../../lib/db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    await ensureInit();
    const pool = getPool();
    const client = await pool.connect();

    try {
      const { email } = req.query;
      if (!email) return res.status(400).json({ error: "Email обязателен" });

      await client.query("DELETE FROM transactions WHERE user_email = $1", [email]);
      await client.query(`UPDATE users SET balance=0, income=0, expenses=0, savings_usd=0 WHERE email=$1`, [email]);

      res.json({ success: true });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("Reset error:", e);
    res.status(500).json({ error: "Не удалось сбросить: " + e.message });
  }
};