// ============================================================
// middleware/auth.js — JWT Verify + RBAC
// ============================================================
const jwt = require('jsonwebtoken');

/**
 * Verifikasi Bearer token dari header Authorization.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak ditemukan. Silakan login terlebih dahulu.'
    });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: err.name === 'TokenExpiredError'
        ? 'Sesi habis. Silakan login kembali.'
        : 'Token tidak valid.'
    });
  }
}

/**
 * Middleware RBAC — batasi akses berdasarkan role.
 * @param {...string} roles - Role yang diizinkan: 'admin', 'pelatih', 'asisten'
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Diperlukan role: ${roles.join(' / ')}.`
      });
    }
    next();
  };
}

module.exports = { verifyToken, requireRole };
