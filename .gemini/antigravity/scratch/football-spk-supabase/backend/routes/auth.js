// ============================================================
// routes/auth.js — Autentikasi Login + Profile
// ============================================================
const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

// ── POST /api/auth/login ──────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username dan password wajib diisi.'
      });
    }

    // Cari user berdasarkan username (case-insensitive)
    const { data: user, error } = await supabase
      .from('users')
      .select('id, username, password, nama_lengkap, role')
      .ilike('username', username.trim())
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      });
    }

    // Verifikasi password dengan bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.'
      });
    }

    // Generate JWT
    const payload = {
      id:       user.id,
      username: user.username,
      name:     user.nama_lengkap,
      role:     user.role
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h'
    });

    res.json({
      success: true,
      message: `Selamat datang, ${user.nama_lengkap}!`,
      token,
      user: payload
    });

  } catch (err) {
    console.error('[AUTH/LOGIN]', err.message);
    res.status(500).json({ success: false, message: 'Terjadi kesalahan server.' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────
router.get('/me', verifyToken, (req, res) => {
  res.json({ success: true, data: req.user });
});

module.exports = router;
