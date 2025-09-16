// forward.js (CommonJS + Express Router)
require('dotenv').config();
const express = require('express');
const axios = require('axios');

const router = express.Router();

/**
 * POST /api/forward
 * - Meneruskan body request (JSON) ke Power Automate (process.env.WEBHOOK_URL).
 * - Opsi auth sederhana via header: x-app-token (cocokkan dengan process.env.APP_TOKEN).
 */
router.post('/', async (req, res) => {
  const targetUrl = process.env.WEBHOOK_URL;
  if (!targetUrl) {
    return res.status(500).json({
      success: false,
      message: 'Webhook URL tidak dikonfigurasi di server (WEBHOOK_URL).',
    });
  }

  // Auth opsional: pakai x-app-token (atau fallback ke body.token)
  const clientToken = req.headers['x-app-token'] || req.body?.token;
  if (process.env.APP_TOKEN && clientToken !== process.env.APP_TOKEN) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau tidak disertakan.',
    });
  }

  const payload = req.body;

  try {
    const response = await axios.post(targetUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 15000, // 15s timeout agar tidak ngegantung
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

module.exports = router;
