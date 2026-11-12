// ============================================================
// js/auth.js — Autentikasi, Role, Navigasi Aktif
// ============================================================

const ROLE_LABELS = {
  admin:   { label: 'Administrator', color: '#ef4444', bg: 'rgba(239,68,68,.15)' },
  pelatih: { label: 'Pelatih',       color: '#10b981', bg: 'rgba(16,185,129,.15)' },
  asisten: { label: 'Asisten',       color: '#3b82f6', bg: 'rgba(59,130,246,.15)' }
};

function checkAuth() {
  if (!isLoggedIn()) { window.location.href = 'index.html'; return false; }
  renderUserInfo();
  return true;
}

function renderUserInfo() {
  const user = getUser();
  if (!user) return;
  const el = document.getElementById('user-info');
  if (!el) return;
  const rc = ROLE_LABELS[user.role] || { label: user.role, color: '#9ca3af', bg: 'rgba(156,163,175,.15)' };
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid rgba(255,255,255,.06)">
      <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#10b981,#059669);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;font-size:14px;flex-shrink:0">${(user.name || user.username || '?')[0].toUpperCase()}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:13px;font-weight:600;color:#f9fafb;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${escapeHtml(user.name || user.username)}</div>
        <div style="display:inline-flex;padding:2px 8px;border-radius:999px;margin-top:2px;font-size:10px;font-weight:600;color:${rc.color};background:${rc.bg}">${rc.label}</div>
      </div>
    </div>`;
}

function logout() {
  clearAuth();
  window.location.href = 'index.html';
}

function initAuth() {
  checkAuth();
  const btn = document.getElementById('btn-logout');
  if (btn) btn.addEventListener('click', e => { e.preventDefault(); logout(); });
  highlightActiveNav();
}

function highlightActiveNav() {
  const page = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('[data-nav-page]').forEach(a => {
    a.classList.toggle('nav-active', a.getAttribute('data-nav-page') === page);
  });
}

function hasRole(...roles) { const u = getUser(); return u && roles.includes(u.role); }
function isAdmin()          { return hasRole('admin'); }
function isAdminOrPelatih() { return hasRole('admin', 'pelatih'); }
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = String(s||''); return d.innerHTML; }

window.checkAuth = checkAuth; window.renderUserInfo = renderUserInfo;
window.logout    = logout;    window.initAuth       = initAuth;
window.hasRole   = hasRole;   window.isAdmin        = isAdmin;
window.isAdminOrPelatih = isAdminOrPelatih;
window.escapeHtml = escapeHtml; window.ROLE_LABELS = ROLE_LABELS;
