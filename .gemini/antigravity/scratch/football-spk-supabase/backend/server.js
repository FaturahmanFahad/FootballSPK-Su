// ============================================================
// server.js — Entry Point SPK Football (Supabase Edition)
// ============================================================
require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const app = express();

// ── Middleware ────────────────────────────────────────────
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/players',     require('./routes/players'));
app.use('/api/criteria',    require('./routes/criteria'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/spk',         require('./routes/spk'));

// ── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SPK Football API — Supabase Edition',
    timestamp: new Date().toISOString()
  });
});

// ── 404 ──────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.method} ${req.path} tidak ditemukan.` });
});

// ── Global Error Handler ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message);
  res.status(500).json({ success: false, message: 'Terjadi kesalahan internal server.' });
});

// ── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   SPK FOOTBALL — Supabase Edition    ║');
  console.log('╚══════════════════════════════════════╝');
  console.log(`\n🚀 Server     : http://localhost:${PORT}`);
  console.log(`📡 Supabase   : ${process.env.SUPABASE_URL || '⚠️  Belum dikonfigurasi!'}`);
  console.log(`🌍 CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
  console.log(`🔑 JWT Expires: ${process.env.JWT_EXPIRES_IN || '8h'}\n`);
});

module.exports = app;
