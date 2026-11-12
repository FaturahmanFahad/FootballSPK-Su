// ============================================================
// js/players.js — CRUD Pemain
// ============================================================

let editingId = null, deletingId = null;

const POS_OPTS = ['GK','CB','LB','RB','CDM','CM','CAM','LM','RM','LW','RW','ST','CF'];

function sBadge(s) {
  const m = { Aktif:['rgba(16,185,129,.15)','#34d399'], Cedera:['rgba(239,68,68,.15)','#f87171'], Akumulasi:['rgba(245,158,11,.15)','#fbbf24'], Skors:['rgba(249,115,22,.15)','#fb923c'] }[s] || ['rgba(156,163,175,.15)','#9ca3af'];
  return `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:${m[0]};color:${m[1]}"><span style="width:5px;height:5px;border-radius:50%;background:${m[1]}"></span>${s}</span>`;
}
function eBadge(v) {
  return v
    ? `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:rgba(16,185,129,.12);color:#34d399">✓ Layak</span>`
    : `<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:rgba(239,68,68,.12);color:#f87171">✗ Tidak</span>`;
}

async function loadPlayers(filters = {}) {
  const tbody = document.getElementById('player-table-body');
  tbody.innerHTML = `<tr><td colspan="8" style="padding:40px;text-align:center;color:#4b5563;font-size:13px">Memuat data pemain...</td></tr>`;
  let url = '/api/players?';
  if (filters.position && filters.position !== 'all') url += 'position=' + filters.position + '&';
  if (filters.status   && filters.status   !== 'all') url += 'status='   + filters.status   + '&';
  if (filters.search)  url += 'search=' + encodeURIComponent(filters.search) + '&';

  const res = await api.get(url);
  if (!res.ok) { tbody.innerHTML = `<tr><td colspan="8" style="padding:40px;text-align:center;color:#ef4444">Gagal: ${escapeHtml(res.data.message)}</td></tr>`; return; }

  const players = res.data.data || [];
  const cntEl = document.getElementById('player-count');
  if (cntEl) cntEl.textContent = players.length + ' pemain';

  if (!players.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="padding:48px;text-align:center;color:#4b5563;font-size:13px">Tidak ada pemain sesuai filter.</td></tr>`;
    return;
  }

  const user = getUser();
  const canEdit   = user && (user.role === 'admin' || user.role === 'pelatih');
  const canDelete = user && user.role === 'admin';

  tbody.innerHTML = players.map((p, i) => `
    <tr style="border-bottom:1px solid rgba(255,255,255,.04);transition:background .15s"
        onmouseover="this.style.background='rgba(255,255,255,.025)'"
        onmouseout="this.style.background='transparent'">
      <td style="padding:12px 16px;color:#6b7280;font-size:13px">${i+1}</td>
      <td style="padding:12px 16px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,rgba(16,185,129,.2),rgba(5,150,105,.1));border:1px solid rgba(16,185,129,.2);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#34d399">${escapeHtml(p.nama_pemain[0])}</div>
          <div>
            <div style="font-size:13px;font-weight:600;color:#f9fafb">${escapeHtml(p.nama_pemain)}</div>
            ${p.catatan ? `<div style="font-size:11px;color:#6b7280;max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(p.catatan)}</div>` : ''}
          </div>
        </div>
      </td>
      <td style="padding:12px 16px"><span style="padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;background:rgba(59,130,246,.12);color:#60a5fa">${p.posisi}</span></td>
      <td style="padding:12px 16px;color:#d1d5db;font-size:13px">${p.usia ? p.usia + ' thn' : '—'}</td>
      <td style="padding:12px 16px;color:#d1d5db;font-size:13px">${p.nomor_punggung ? '#' + p.nomor_punggung : '—'}</td>
      <td style="padding:12px 16px">${sBadge(p.status)}</td>
      <td style="padding:12px 16px">${eBadge(p.is_eligible)}</td>
      <td style="padding:12px 16px;text-align:center">
        <div style="display:inline-flex;gap:6px">
          ${canEdit   ? `<button class="btn-ie" title="Edit"  onclick="openEdit(${p.id})"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>` : ''}
          ${canDelete ? `<button class="btn-id" title="Hapus" onclick="openDelete(${p.id},'${escapeHtml(p.nama_pemain)}')"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg></button>` : ''}
          ${!canEdit && !canDelete ? '<span style="color:#4b5563;font-size:12px">—</span>' : ''}
        </div>
      </td>
    </tr>`).join('');
}

// ── Modal Add ─────────────────────────────────────────────
function openAdd() {
  editingId = null;
  document.getElementById('modal-title').textContent = 'Tambah Pemain Baru';
  document.getElementById('btn-submit-text').textContent = 'Simpan Pemain';
  document.getElementById('player-form').reset();
  document.getElementById('form-id').value = '';
  document.getElementById('modal-player').style.display = 'flex';
}

// ── Modal Edit ────────────────────────────────────────────
async function openEdit(id) {
  editingId = id;
  document.getElementById('modal-title').textContent = 'Edit Data Pemain';
  document.getElementById('btn-submit-text').textContent = 'Perbarui';
  document.getElementById('modal-player').style.display = 'flex';

  const res = await api.get('/api/players/' + id);
  if (!res.ok) { showToast('Gagal memuat data pemain.', 'error'); return; }
  const p = res.data.data;
  document.getElementById('form-id').value           = p.id;
  document.getElementById('form-nama').value         = p.nama_pemain  || '';
  document.getElementById('form-posisi').value       = p.posisi        || '';
  document.getElementById('form-usia').value         = p.usia          || '';
  document.getElementById('form-jersey').value       = p.nomor_punggung || '';
  document.getElementById('form-status').value       = p.status        || 'Aktif';
  document.getElementById('form-catatan').value      = p.catatan       || '';
}
function closeModal() { document.getElementById('modal-player').style.display = 'none'; editingId = null; }

// ── Form Submit ───────────────────────────────────────────
document.getElementById('player-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const nama_pemain     = document.getElementById('form-nama').value.trim();
  const posisi          = document.getElementById('form-posisi').value;
  const usia            = document.getElementById('form-usia').value;
  const nomor_punggung  = document.getElementById('form-jersey').value;
  const status          = document.getElementById('form-status').value;
  const catatan         = document.getElementById('form-catatan').value.trim();

  if (!nama_pemain || !posisi) { showToast('Nama pemain dan posisi wajib diisi.', 'warning'); return; }

  const btn = document.getElementById('btn-submit'); const txt = document.getElementById('btn-submit-text'); const spn = document.getElementById('btn-submit-spinner');
  btn.disabled = true; txt.textContent = 'Menyimpan...'; spn.style.display = 'block';

  const body = { nama_pemain, posisi, usia: usia ? parseInt(usia) : null, nomor_punggung: nomor_punggung ? parseInt(nomor_punggung) : null, status, catatan };
  const res = editingId ? await api.put('/api/players/' + editingId, body) : await api.post('/api/players', body);

  btn.disabled = false; txt.textContent = editingId ? 'Perbarui' : 'Simpan Pemain'; spn.style.display = 'none';

  if (res.ok) { showToast(res.data.message || 'Berhasil disimpan.', 'success'); closeModal(); loadPlayers(getFilters()); }
  else { showToast(res.data.message || 'Gagal menyimpan.', 'error'); }
});

// ── Delete ────────────────────────────────────────────────
function openDelete(id, name) { deletingId = id; document.getElementById('del-name').textContent = name; document.getElementById('modal-delete').style.display = 'flex'; }
function closeDelete() { document.getElementById('modal-delete').style.display = 'none'; deletingId = null; }
async function confirmDelete() {
  if (!deletingId) return;
  document.getElementById('btn-confirm-del').disabled = true;
  document.getElementById('del-btn-text').textContent = 'Menghapus...';
  document.getElementById('del-spinner').style.display = 'block';

  const res = await api.delete('/api/players/' + deletingId);
  document.getElementById('btn-confirm-del').disabled = false;
  document.getElementById('del-btn-text').textContent = 'Ya, Hapus';
  document.getElementById('del-spinner').style.display = 'none';

  if (res.ok) { showToast(res.data.message || 'Pemain dihapus.', 'success'); closeDelete(); loadPlayers(getFilters()); }
  else { showToast(res.data.message || 'Gagal menghapus.', 'error'); }
}

function getFilters() {
  return {
    position: document.getElementById('filter-position')?.value,
    status:   document.getElementById('filter-status')?.value,
    search:   document.getElementById('search-player')?.value?.trim()
  };
}
function initFilters() {
  const dbl = debounce(() => loadPlayers(getFilters()), 300);
  document.getElementById('filter-position')?.addEventListener('change', () => loadPlayers(getFilters()));
  document.getElementById('filter-status')?.addEventListener('change',   () => loadPlayers(getFilters()));
  document.getElementById('search-player')?.addEventListener('input', dbl);
}
function applyRoles() {
  const user = getUser(); if (!user) return;
  if (user.role === 'asisten') { const b = document.getElementById('btn-add-player'); if (b) b.style.display = 'none'; }
}

document.addEventListener('DOMContentLoaded', () => { initAuth(); applyRoles(); loadPlayers(); initFilters(); });
