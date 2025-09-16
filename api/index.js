// index.js (all-in-one, tanpa token)
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');

const app = express();

// ===== Database Pool =====
const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
});

app.use(express.json());

// ===================================================================
// POST /api/forward
// Meneruskan body request ke Power Automate (WEBHOOK_URL).
// ===================================================================
app.post('/api/forward', async (req, res) => {
  const targetUrl = process.env.WEBHOOK_URL;
  if (!targetUrl) {
    return res.status(500).json({
      success: false,
      message: 'Webhook URL tidak dikonfigurasi di server (WEBHOOK_URL).',
    });
  }

  const payload = req.body;

  try {
    const response = await axios.post(targetUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000,
    });

    return res.status(200).json({
      success: true,
      forwardStatus: response.status,
      forwardStatusText: response.statusText,
      targetResponse: response.data ?? null,
    });
  } catch (err) {
    return res.status(502).json({
      success: false,
      message: 'Gagal meneruskan ke Power Automate.',
      error: err.message,
      targetStatus: err.response?.status,
      targetData: err.response?.data,
    });
  }
});

// ===================================================================
// GET /api/test-db
// ===================================================================
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await dbPool.query('SELECT 1 + 1 AS solution');
    res.json({ success: true, result: rows[0].solution });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ success: false, message: 'Database query error' });
  }
});

// ===================================================================
// GET /api/fms
// ===================================================================
app.get('/api/fms', async (req, res) => {
  try {
    const sql = 'SELECT * FROM FMS_REPORT ORDER BY DATE DESC LIMIT 1;';
    const [rows] = await dbPool.query(sql);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Data laporan tidak ditemukan.' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Terjadi kesalahan saat mengambil data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// ===================================================================
// GET /api/webhook (tes manual kirim payload sederhana ke WEBHOOK_URL)
// ===================================================================
app.get('/api/webhook', async (req, res) => {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('Error: WEBHOOK_URL belum diatur!');
    return res
      .status(500)
      .json({ message: 'Konfigurasi server error: URL webhook tujuan tidak ditemukan.' });
  }

  const payload = {
    text: 'Hello from Mojopait Teams - Express Js',
    app_name: 'Bot Pertama',
  };

  console.log(`Mencoba mengirim POST request ke: ${webhookUrl}`);
  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15_000,
    });

    return res.status(200).json({
      message: 'Webhook berhasil dikirim ke tujuan!',
      targetStatus: response.status,
      targetStatusText: response.statusText,
      targetResponse: response.data ?? null,
    });
  } catch (error) {
    console.error('Gagal mengirim webhook:', error.message);
    return res.status(500).json({
      message: 'Gagal mengirim webhook ke tujuan.',
      error: error.message,
      targetStatus: error.response?.status,
      targetData: error.response?.data,
    });
  }
});

// ===== Start Server =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

module.exports = app;
