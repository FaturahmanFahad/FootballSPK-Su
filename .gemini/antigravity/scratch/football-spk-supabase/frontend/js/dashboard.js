// ============================================================
// js/dashboard.js — Halaman Dashboard
// ============================================================

const POS_MAP = {
  GK:'Penjaga Gawang',CB:'Bek Tengah',LB:'Bek Kiri',RB:'Bek Kanan',
  CDM:'Gelandang Bertahan',CM:'Gelandang Tengah',CAM:'Gelandang Serang',
  LM:'Gelandang Kiri',RM:'Gelandang Kanan',LW:'Sayap Kiri',RW:'Sayap Kanan',
  ST:'Striker',CF:'Penyerang'
};

function statusBadge(s) {
  const m = {
    Aktif:     ['rgba(16,185,129,.15)','#34d399','Aktif'],
    Cedera:    ['rgba(239,68,68,.15)', '#f87171','Cedera'],
    Akumulasi: ['rgba(245,158,11,.15)','#fbbf24','Akumulasi'],
    Skors:     ['rgba(249,115,22,.15)','#fb923c','Skors']
  }[s] || ['rgba(156,163,175,.15)','#9ca3af',s];
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${m[0]};color:${m[1]}"><span style="width:5px;height:5px;border-radius:50%;background:${m[1]}"></span>${m[2]}</span>`;
}

function eligibleBadge(ok) {
  return ok
    ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:rgba(16,185,129,.12);color:#34d399"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 5l2.5 2.5L8 3" stroke="#34d399" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>Layak</span>`
    : `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:rgba(239,68,68,.12);color:#f87171"><svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 3l4 4M7 3l-4 4" stroke="#f87171" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>Tidak</span>`;
}

async function loadStats() {
  try {
    const [resP, resC] = await Promise.all([api.get('/api/players'), api.get('/api/criteria')]);
    const players  = resP.ok  ? (resP.data.data  || []) : [];
    const criteria = resC.ok  ? (resC.data.data  || []) : [];
    const eligible = players.filter(p => p.status === 'Aktif').length;

    setCard('stat-total',    players.length,  'Total Pemain');
    setCard('stat-aktif',    eligible,         'Pemain Eligible');
    setCard('stat-kriteria', criteria.length,  'Total Kriteria');
    document.getElementById('stat-musim') && (document.getElementById('stat-musim').textContent = '2024/2025');
  } catch(e) { console.error('loadStats:', e); }
}

function setCard(id, val, lbl) {
  const el = document.getElementById(id);
  if (el) el.textContent = typeof val === 'number' ? val.toLocaleString('id-ID') : val;
}

async function loadPlayers(filters = {}) {
  const tbody = document.getElementById('player-table-body');
  if (!tbody) return;
  tbody.innerHTML = `<tr><td colspan="7" style="padding:40px;text-align:center;color:#4b5563">Memuat data...</td></tr>`;

  let url = '/api/players?';
  if (filters.position && filters.position !== 'all') url += 'position=' + filters.position + '&';
  if (filters.status   && filters.status   !== 'all') url += 'status='   + filters.status   + '&';
  if (filters.search)  url += 'search=' + encodeURIComponent(filters.search) + '&';

  const res = await api.get(url);
  if (!res.ok) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:40px;text-align:center;color:#ef4444">Gagal memuat data.</td></tr>`;
    return;
  }

  const players = res.data.data || [];
  const countEl = document.getElementById('player-count');
  if (countEl) countEl.textContent = players.length + ' pemain';

  if (!players.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="padding:48px;text-align:center;color:#4b5563;font-size:14px">Tidak ada data pemain.</td></tr>`;
    return;
  }

  tbody.innerHTML = players.map((p, i) => `
    <tr style="border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s"
        onmouseover="this.style.background='rgba(255,255,255,.025)'"
        onmouseout="this.style.background='transparent'">
      <td style="padding:12px 16px;color:#6b7280;font-size:13px">${i+1}</td>
      <td style="padding:12px 16px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,rgba(16,185,129,.2),rgba(5,150,105,.1));border:1px solid rgba(16,185,129,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:#34d399">${escapeHtml(p.nama_pemain[0])}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#f9fafb">${escapeHtml(p.nama_pemain)}</div>
            <div style="font-size:11px;color:#6b7280">${POS_MAP[p.posisi] || p.posisi}</div>
          </div>
        </div>
      </td>
      <td style="padding:12px 16px"><span style="padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;background:rgba(59,130,246,.12);color:#60a5fa">${escapeHtml(p.posisi)}</span></td>
      <td style="padding:12px 16px;color:#d1d5db;font-size:13px">${p.usia ? p.usia + ' thn' : '—'}</td>
      <td style="padding:12px 16px;color:#d1d5db;font-size:13px">${p.nomor_punggung ? '#' + p.nomor_punggung : '—'}</td>
      <td style="padding:12px 16px">${statusBadge(p.status)}</td>
      <td style="padding:12px 16px">${eligibleBadge(p.is_eligible)}</td>
    </tr>`).join('');
}

function initFilters() {
  const fp = document.getElementById('filter-position');
  const fs = document.getElementById('filter-status');
  const si = document.getElementById('search-player');
  const getF = () => ({ position: fp?.value, status: fs?.value, search: si?.value?.trim() });
  const dbl = debounce(() => loadPlayers(getF()), 300);
  fp?.addEventListener('change', () => loadPlayers(getF()));
  fs?.addEventListener('change', () => loadPlayers(getF()));
  si?.addEventListener('input', dbl);
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  loadStats();
  loadPlayers();
  initFilters();
  const lu = document.getElementById('last-updated');
  if (lu) lu.textContent = 'Update: ' + new Date().toLocaleTimeString('id-ID');
});
