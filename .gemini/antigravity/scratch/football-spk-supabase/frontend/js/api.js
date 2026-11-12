// ============================================================
// js/api.js — Fetch Wrapper + Toast + Loading
// SPK Football | Supabase Edition
// BASE_URL → Backend Express di port 5000
// ============================================================

const BASE_URL = 'http://localhost:5000';

// ── Token & Auth ─────────────────────────────────────────
function getToken()   { return localStorage.getItem('spk_token'); }
function getUser()    { try { return JSON.parse(localStorage.getItem('spk_user') || 'null'); } catch { return null; } }
function isLoggedIn() { return !!getToken(); }
function clearAuth()  { localStorage.removeItem('spk_token'); localStorage.removeItem('spk_user'); }

// ── Core Request ─────────────────────────────────────────
async function request(url, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: 'Bearer ' + token } : {}),
    ...(options.headers || {})
  };
  try {
    const res = await fetch(BASE_URL + url, { ...options, headers });
    if (res.status === 401) {
      clearAuth();
      window.location.href = 'index.html';
      return { ok: false, status: 401, data: {} };
    }
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('[API Error]', err);
    return { ok: false, status: 0, data: { success: false, message: 'Koneksi ke server gagal. Pastikan backend berjalan di port 5000.' } };
  }
}

const api = {
  get:    (url)       => request(url, { method: 'GET' }),
  post:   (url, body) => request(url, { method: 'POST',   body: JSON.stringify(body) }),
  put:    (url, body) => request(url, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (url)       => request(url, { method: 'DELETE' })
};

// ── Toast Notification ───────────────────────────────────
function showToast(message, type = 'success') {
  if (!document.getElementById('_toast_style')) {
    const s = document.createElement('style'); s.id = '_toast_style';
    s.textContent = `
      @keyframes _tIn  { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
      @keyframes _tOut { from{opacity:1} to{opacity:0;transform:translateX(110%)} }
      ._toast { animation:_tIn .3s ease forwards; }
      ._toast.hide { animation:_tOut .3s ease forwards; }`;
    document.head.appendChild(s);
  }
  let wrap = document.getElementById('_toast_wrap');
  if (!wrap) {
    wrap = document.createElement('div'); wrap.id = '_toast_wrap';
    Object.assign(wrap.style, { position:'fixed',top:'20px',right:'20px',zIndex:'99999',display:'flex',flexDirection:'column',gap:'10px',pointerEvents:'none' });
    document.body.appendChild(wrap);
  }
  const cfg = { success:{c:'#10b981',p:'M5 13l4 4L19 7'}, error:{c:'#ef4444',p:'M6 18L18 6M6 6l12 12'}, warning:{c:'#f59e0b',p:'M12 9v3m0 3h.01'}, info:{c:'#3b82f6',p:'M13 16h-1v-4h-1m1-4h.01'} }[type] || {c:'#3b82f6',p:'M13 16h-1v-4h-1m1-4h.01'};
  const id = '_t' + Date.now();
  const el = document.createElement('div'); el.id = id; el.className = '_toast';
  el.style.cssText = `pointer-events:all;display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;border-left:4px solid ${cfg.c};min-width:260px;max-width:380px;background:rgba(13,20,36,.97);border:1px solid rgba(255,255,255,.08);border-left-color:${cfg.c};box-shadow:0 8px 32px rgba(0,0,0,.5);font-family:Inter,sans-serif;`;
  el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="${cfg.c}" stroke-width="2.5" stroke-linecap="round"><path d="${cfg.p}"/></svg><span style="flex:1;font-size:13px;color:#f9fafb;line-height:1.4">${message}</span><button onclick="document.getElementById('${id}').remove()" style="background:none;border:none;color:#6b7280;cursor:pointer;font-size:20px;line-height:1">&times;</button>`;
  wrap.appendChild(el);
  setTimeout(() => { el.classList.add('hide'); setTimeout(() => el.remove(), 350); }, 4500);
}

// ── Loading Overlay ──────────────────────────────────────
function showLoading(show = true) {
  if (!document.getElementById('_spin_s')) {
    const s = document.createElement('style'); s.id = '_spin_s';
    s.textContent = '@keyframes _spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }
  let ov = document.getElementById('_loading_ov');
  if (!ov && show) {
    ov = document.createElement('div'); ov.id = '_loading_ov';
    ov.style.cssText = 'position:fixed;inset:0;z-index:99998;background:rgba(10,15,30,.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;flex-direction:column;gap:14px;';
    ov.innerHTML = '<div style="width:44px;height:44px;border:3px solid rgba(16,185,129,.3);border-top-color:#10b981;border-radius:50%;animation:_spin .7s linear infinite"></div><p style="color:#d1d5db;font-size:13px;font-family:Inter,sans-serif">Memproses...</p>';
    document.body.appendChild(ov);
  } else if (ov) { ov.style.display = show ? 'flex' : 'none'; }
}

// ── Utilities ────────────────────────────────────────────
function formatNumber(n, d = 2) { return (n === null || n === undefined || isNaN(n)) ? '-' : Number(n).toFixed(d); }
function debounce(fn, ms = 300) { let t; return function() { clearTimeout(t); t = setTimeout(() => fn.apply(this, arguments), ms); }; }
function escapeHtml(s) { const d = document.createElement('div'); d.textContent = String(s || ''); return d.innerHTML; }
