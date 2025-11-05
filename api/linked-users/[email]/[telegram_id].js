// api/linked-users/[email]/[telegram_id].js
const { getPool, ensureInit } = require("../../../lib/db");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  try {
    await ensureInit();
    const pool = getPool();
    const client = await pool.connect();

    try {
      const { email, telegram_id } = req.query;
      if (!email || !telegram_id) {
        return res.status(400).json({ error: "Email и Telegram ID обязательны" });
      }

      const result = await client.query(
        "DELETE FROM linked_telegram_users WHERE user_email = $1 AND telegram_id = $2 RETURNING *",
        [email, telegram_id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({ error: "Связанный пользователь не найден" });
      }

      res.json({ success: true, deletedUser: result.rows[0] });
    } finally {
      client.release();
    }
  } catch (e) {
    console.error("Delete linked user error:", e);
    res.status(500).json({ error: "Ошибка удаления пользователя: " + e.message });
  }
};