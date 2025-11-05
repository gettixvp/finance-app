// api/transactions/index.js
const { getPool, ensureInit } = require("../../lib/db");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  await ensureInit();
  const pool = getPool();
  const client = await pool.connect();

  try {
    if (req.method === "GET") {
      const { user_email } = req.query;
      if (!user_email) return res.status(400).json({ error: "user_email обязателен" });
      const { rows } = await client.query(
        "SELECT * FROM transactions WHERE user_email = $1 ORDER BY date DESC",
        [user_email]
      );
      return res.json(rows);
    }

    if (req.method === "POST") {
      const {
        user_email,
        type,
        amount,
        converted_amount_usd,
        description,
        category,
        created_by_telegram_id,
        created_by_name,
      } = req.body;

      if (!user_email || !type || !amount || !category)
        return res.status(400).json({ error: "Обязательные поля: user_email, type, amount, category" });

      const validTypes = ["income", "expense", "savings"];
      if (!validTypes.includes(type))
        return res.status(400).json({ error: "type должен быть income, expense или savings" });

      const { rows: [tx] } = await client.query(
        `INSERT INTO transactions 
         (user_email, type, amount, converted_amount_usd, description, category, created_by_telegram_id, created_by_name)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [user_email, type, amount, converted_amount_usd, description, category, created_by_telegram_id, created_by_name]
      );

      return res.json(tx);
    }
  } catch (e) {
    console.error("TX error:", e);
    res.status(500).json({ error: "Ошибка транзакции" });
  } finally {
    client.release();
  }
}