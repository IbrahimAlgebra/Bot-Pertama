require('dotenv').config();
const express = require('express');
const axios = require('axios');
const mysql = require('mysql2/promise');
const app = express();
const forwardRouter = require('./forward');

// Buat koneksi pool ke database
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

app.use('/api/forward', forwardRouter);

app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await dbPool.query('SELECT 1 + 1 AS solution');
        res.json({ success: true, result: rows[0].solution });
    } catch (error) {
        console.error('Database query error:', error);
        res.status(500).json({ success: false, message: 'Database query error' });
    }
});

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

app.get('/api/webhook', async (req, res) => {
    
    const webhookUrl = process.env.WEBHOOK_URL;

  if (!webhookUrl) {
    console.error('Error: TARGET_WEBHOOK_URL belum diatur!');
    return res.status(500).json({ message: 'Konfigurasi server error: URL webhook tujuan tidak ditemukan.' });
  }

  const payload = {
    text: "Hello from Mojopait Teams - Express Js",
    app_name: "Bot Pertama",
    token: process.env.APP_TOKEN || "token" 
  };

  console.log(`Mencoba mengirim POST request ke: ${webhookUrl}`);

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Request gagal dengan status: ${response.status} ${response.statusText}`);
    }

    const responseText = await response.text();
  let responseData = null;

  // 2. Cek apakah teks responnya tidak kosong
  if (responseText) {
    try {
      // 3. Jika tidak kosong, baru coba parse sebagai JSON
      responseData = JSON.parse(responseText);
    } catch (parseError) {
      // Jika gagal parse, anggap saja responnya teks biasa
      console.warn("Respon dari server tujuan bukan JSON, akan dianggap sebagai teks biasa.");
      responseData = responseText;
    }
  } else {
    console.log("Request berhasil, namun server tujuan tidak memberikan body respon.");
  }

    console.log('Request berhasil dikirim. Respon dari server tujuan:', responseData);

    // Kirim respon sukses untuk Vercel Cron Job
    res.status(200).json({
      message: 'Webhook berhasil dikirim ke tujuan!',
      targetResponse: responseData
    });

  } catch (error) {
    console.error('Gagal mengirim webhook:', error.message);
    res.status(500).json({
      message: 'Gagal mengirim webhook ke tujuan.',
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});

module.exports = app;