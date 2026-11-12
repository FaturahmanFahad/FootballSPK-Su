// ============================================================
// js/evaluations.js — Bobot ROC drag & drop + Input Evaluasi
// ============================================================

let criteriaList = [], dragSrc = null;

// ── ROC Calculation (client-side preview) ────────────────
function calcROC(arr) {
  const n = arr.length;
  return arr.map((c, i) => {
    const rank = i + 1;
    let sum = 0;
    for (let j = rank; j <= n; j++) sum += 1 / j;
    return { ...c, roc_rank: rank, weight: (1 / n) * sum };
  });
}

// ── Load & Render Criteria ────────────────────────────────
async function loadCriteria() {
  const res = await api.get('/api/criteria');
  if (!res.ok) { showToast('Gagal memuat kriteria.', 'error'); return; }
  criteriaList = [...(res.data.data || [])].sort((a, b) => a.roc_rank - b.roc_rank);
  criteriaList = calcROC(criteriaList);
  renderROCList();
  updateTotalWeight();
}

function renderROCList() {
  const wrap = document.getElementById('roc-drag-list'); if (!wrap) return;
  const user = getUser();
  const canEdit = user && (user.role === 'admin' || user.role === 'pelatih');

  if (!criteriaList.length) { wrap.innerHTML = '<p style="text-align:center;color:#4b5563;font-size:13px;padding:20px">Tidak ada kriteria.</p>'; return; }

  wrap.innerHTML = criteriaList.map((c, i) => {
    const tb = c.atribut === 'benefit'
      ? { bg:'rgba(16,185,129,.1)', color:'#34d399', label:'Benefit ↑' }
      : { bg:'rgba(239,68,68,.1)',  color:'#f87171', label:'Cost ↓' };
    return `
    <div class="drag-item" id="di-${i}" draggable="${canEdit}" data-index="${i}"
         ondragstart="dStart(event,${i})" ondragover="dOver(event,${i})"
         ondragleave="dLeave(event,${i})" ondrop="dDrop(event,${i})" ondragend="dEnd(event)">
      <div style="width:26px;height:26px;border-radius:6px;background:rgba(16,185,129,.15);border:1px solid rgba(16,185,129,.25);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:#34d399;flex-shrink:0">${i+1}</div>
      ${canEdit ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="flex-shrink:0;cursor:grab"><circle cx="9" cy="5" r="1.2" fill="#374151"/><circle cx="9" cy="12" r="1.2" fill="#374151"/><circle cx="9" cy="19" r="1.2" fill="#374151"/><circle cx="15" cy="5" r="1.2" fill="#374151"/><circle cx="15" cy="12" r="1.2" fill="#374151"/><circle cx="15" cy="19" r="1.2" fill="#374151"/></svg>` : ''}
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:6px">
          <span style="font-size:12px;font-weight:700;color:#60a5fa">${escapeHtml(c.kode || c.code)}</span>
          <span style="font-size:13px;color:#d1d5db;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escapeHtml(c.nama_kriteria || c.name)}</span>
        </div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:3px">
          <span style="padding:2px 7px;border-radius:999px;font-size:10px;font-weight:600;background:${tb.bg};color:${tb.color}">${tb.label}</span>
          <span style="font-size:11px;color:#6b7280">${escapeHtml(c.satuan || c.unit || '')}</span>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div style="font-size:13px;font-weight:700;color:#34d399" id="w-${i}">${(c.weight*100).toFixed(4)}%</div>
        <div style="font-size:10px;color:#4b5563">${c.weight.toFixed(6)}</div>
      </div>
    </div>`;
  }).join('');

  if (!canEdit) { const a = document.getElementById('roc-actions'); if (a) a.style.display = 'none'; }
}

// ── Drag & Drop ───────────────────────────────────────────
function dStart(e, i) { dragSrc = i; e.currentTarget.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
function dOver(e, i)  { e.preventDefault(); if (i !== dragSrc) e.currentTarget.classList.add('drag-over'); }
function dLeave(e)    { e.currentTarget.classList.remove('drag-over'); }
function dDrop(e, i)  {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  if (dragSrc === null || dragSrc === i) return;
  const moved = criteriaList.splice(dragSrc, 1)[0];
  criteriaList.splice(i, 0, moved);
  criteriaList = calcROC(criteriaList);
  dragSrc = null; renderROCList(); updateTotalWeight();
}
function dEnd(e) {
  e.currentTarget.classList.remove('dragging');
  document.querySelectorAll('.drag-item').forEach(el => el.classList.remove('drag-over'));
  dragSrc = null;
}
function updateTotalWeight() {
  const el = document.getElementById('roc-total-weight');
  if (el) el.textContent = criteriaList.reduce((s, c) => s + c.weight, 0).toFixed(6);
}

// ── Save ROC Weights ──────────────────────────────────────
async function saveROCWeights() {
  const btn = document.getElementById('btn-save-roc');
  const txt = document.getElementById('btn-save-roc-text');
  const spn = document.getElementById('btn-save-roc-spinner');
  btn.disabled = true; txt.textContent = 'Menyimpan...'; spn.style.display = 'block';

  const rankings = criteriaList.map((c, i) => ({ id: c.id, rank: i + 1 }));
  const res = await api.put('/api/criteria/weights', { rankings });

  btn.disabled = false; txt.textContent = 'Simpan Urutan Bobot ROC'; spn.style.display = 'none';

  if (res.ok) { showToast(res.data.message || 'Bobot ROC berhasil disimpan.', 'success'); await loadCriteria(); }
  else { showToast(res.data.message || 'Gagal menyimpan bobot ROC.', 'error'); }
}

// ── Load Players Select ───────────────────────────────────
async function loadPlayersSelect() {
  const res = await api.get('/api/players?eligible=true');
  if (!res.ok) return;
  const sel = document.getElementById('eval-player-select'); if (!sel) return;
  const players = res.data.data || [];
  sel.innerHTML = '<option value="">— Pilih Pemain —</option>'
    + players.map(p => `<option value="${p.id}">#${p.nomor_punggung || '?'} ${escapeHtml(p.nama_pemain)} (${p.posisi})</option>`).join('');
}

// ── Load Evaluation for Player ────────────────────────────
async function loadPlayerEval(playerId) {
  const grid = document.getElementById('eval-criteria-grid');
  const saveBtn = document.getElementById('btn-save-eval');
  const delBtn  = document.getElementById('btn-delete-eval');
  if (!playerId) {
    grid.innerHTML = `<div style="grid-column:1/-1;padding:32px;text-align:center;color:#4b5563;font-size:13px;border:1px dashed rgba(255,255,255,.08);border-radius:8px">Pilih pemain untuk memuat nilai evaluasi</div>`;
    if (saveBtn) saveBtn.disabled = true;
    if (delBtn)  delBtn.disabled  = true;
    return;
  }
  grid.innerHTML = `<div style="grid-column:1/-1;padding:20px;text-align:center;color:#4b5563">Memuat...</div>`;
  const season = document.getElementById('eval-season')?.value || '2024/2025';
  const res = await api.get(`/api/evaluations/player/${playerId}?season=${encodeURIComponent(season)}`);
  if (!res.ok) { grid.innerHTML = `<div style="grid-column:1/-1;padding:20px;text-align:center;color:#ef4444">Gagal memuat evaluasi.</div>`; return; }

  const evalData = res.data.data || [];
  if (!evalData.length) { grid.innerHTML = `<div style="grid-column:1/-1;padding:20px;text-align:center;color:#4b5563">Belum ada kriteria.</div>`; return; }

  grid.innerHTML = evalData.map(c => {
    const tc = c.type === 'benefit' ? { color:'#34d399', label:'Benefit' } : { color:'#f87171', label:'Cost' };
    return `
    <div style="background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.07);border-radius:10px;padding:12px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div><span style="font-size:11px;font-weight:700;color:#60a5fa">${escapeHtml(c.code)}</span><span style="font-size:12px;color:#d1d5db;margin-left:6px">${escapeHtml(c.name)}</span></div>
        <span style="font-size:10px;font-weight:600;color:${tc.color};background:${tc.color}18;padding:1px 7px;border-radius:999px">${tc.label}</span>
      </div>
      <div style="display:flex;align-items:center;gap:6px">
        <input type="number" id="ei-${c.criteria_id}" class="input-field" value="${c.value || 0}" min="0" step="0.01" placeholder="0" style="font-size:14px;font-weight:600;text-align:center;padding:8px"/>
        <span style="font-size:11px;color:#4b5563;white-space:nowrap">${escapeHtml(c.unit || '')}</span>
      </div>
    </div>`;
  }).join('');

  grid.dataset.criteriaIds = JSON.stringify(evalData.map(c => c.criteria_id));
  if (saveBtn) saveBtn.disabled = false;
  if (delBtn)  delBtn.disabled  = false;
}

// ── Save Evaluation ───────────────────────────────────────
async function saveEvaluation() {
  const pid    = document.getElementById('eval-player-select')?.value;
  const season = document.getElementById('eval-season')?.value || '2024/2025';
  const grid   = document.getElementById('eval-criteria-grid');
  if (!pid) { showToast('Pilih pemain terlebih dahulu.', 'warning'); return; }
  const criteriaIds = JSON.parse(grid.dataset.criteriaIds || '[]');
  if (!criteriaIds.length) { showToast('Tidak ada kriteria.', 'warning'); return; }

  const evaluations = criteriaIds.map(cid => ({ criteria_id: cid, value: parseFloat(document.getElementById('ei-' + cid)?.value || '0') || 0 }));

  const btn = document.getElementById('btn-save-eval'); const txt = document.getElementById('btn-save-eval-text'); const spn = document.getElementById('btn-save-eval-spinner');
  btn.disabled = true; txt.textContent = 'Menyimpan...'; spn.style.display = 'block';

  const res = await api.post('/api/evaluations/bulk', { player_id: parseInt(pid), season, evaluations });
  btn.disabled = false; txt.textContent = 'Simpan Evaluasi'; spn.style.display = 'none';

  if (res.ok) showToast(res.data.message || 'Evaluasi disimpan.', 'success');
  else showToast(res.data.message || 'Gagal menyimpan.', 'error');
}

// ── Delete Evaluation ─────────────────────────────────────
async function deleteEvaluation() {
  const pid    = document.getElementById('eval-player-select')?.value;
  const season = document.getElementById('eval-season')?.value || '2024/2025';
  if (!pid) return;
  if (!confirm(`Hapus semua evaluasi pemain ini untuk musim ${season}?`)) return;
  const res = await api.delete(`/api/evaluations?player_id=${pid}&season=${encodeURIComponent(season)}`);
  if (res.ok) { showToast(res.data.message || 'Evaluasi dihapus.', 'success'); loadPlayerEval(pid); }
  else showToast(res.data.message || 'Gagal.', 'error');
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  const user = getUser();
  if (user && user.role === 'asisten') { const d = document.getElementById('btn-delete-eval'); if (d) d.style.display = 'none'; }
  loadCriteria();
  loadPlayersSelect();
  document.getElementById('eval-season')?.addEventListener('change', () => {
    const pid = document.getElementById('eval-player-select')?.value;
    if (pid) loadPlayerEval(pid);
  });
});
