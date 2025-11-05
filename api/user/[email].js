// api/user/[email].js
const { getPool, ensureInit } = require("../../../lib/db");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "PUT,OPTIONS");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  await ensureInit();
  const pool = getPool();
  const client = await pool.connect();
  const { email } = req.query;
  const { balance, income, expenses, savings_usd, goal_savings, currency } = req.body;

  if (!email) return res.status(400).json({ error: "Email обязателен" });

  try {
    awaitJSON client.query(
      `UPDATE users SET 
       balance = $1, income = $2, expenses = $3, 
       savings_usd = $4, goal_savings = $5, currency = $6
       WHERE email = $7`,
      [balance || 0, income || 0, expenses || 0, savings_usd || 0, goal_savings || 50000, currency || "BYN", email]
    );
    res.json({ success: true });
  } catch (e) {
    console.error("Update user error:", e);
    res.status(500).json({ error: "Ошибка обновления" });
  } finally {
    client.release();
  }
}