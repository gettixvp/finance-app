// api/db-test.js
import { getPool, ensureInit } from "../lib/db";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  try {
    await ensureInit();
    const pool = getPool();
    const client = await pool.connect();
    const result = await client.query("SELECT NOW() as now, 'DB OK' as status");
    client.release();
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}