require('dotenv').config();
const axios = require('axios');

// Handler default Vercel
export default async function handler(req, res) {
  // 1. Pastikan ini adalah request POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Metode tidak diizinkan, harus POST.' });
  }

  // 2. Ambil URL Power Automate dari Environment Variables Vercel
  const targetUrl = process.env.WEBHOOK_URL;
  if (!targetUrl) {
    return res.status(500).json({ message: 'Webhook URL tidak dikonfigurasi di server jembatan.' });
  }

  // 3. Ambil seluruh payload (kartu adaptif, dll) yang dikirim oleh server internal Anda
  const payload = req.body;

  try {
    // 4. Teruskan (forward) payload tersebut ke Power Automate
    const response = await axios.post(targetUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    // 5. Kembalikan sukses jika Power Automate menerima
    res.status(200).json({ success: true, message: 'Berhasil diteruskan ke Power Automate.' });

  } catch (error) {
    // 6. Kembalikan error jika gagal
    console.error("Gagal meneruskan ke Power Automate:", error.message);
    res.status(502).json({ 
        success: false, 
        message: 'Gagal meneruskan ke Power Automate.', 
        error: error.message 
    });
  }
}