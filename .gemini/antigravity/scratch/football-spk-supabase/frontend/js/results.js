// ============================================================
// js/results.js — Tampilan Hasil SPK (ROC + SAW)
// ============================================================

let spkResult = null, currentTab = 1;

async function triggerCalculate() {
  const season = document.getElementById('season-select')?.value || '2024/2025';
  const btn = document.getElementById('btn-calculate');
  const txt = document.getElementById('btn-calc-text');
  const spn = document.getElementById('btn-calc-spinner');

  btn.disabled = true; txt.textContent = 'Menghitung...'; spn.style.display = 'block';
  document.getElementById('empty-state').style.display    = 'none';
  document.getElementById('results-container').style.display = 'none';

  try {
    const res = await api.get('/api/spk/calculate?season=' + encodeURIComponent(season));
    if (!res.ok || !res.data.success) {
      showToast(res.data.message || 'Gagal menghitung SPK.', 'error');
      document.getElementById('empty-state').style.display = 'block';
      return;
    }
    spkResult = res.data.data;
    renderAll(spkResult);
    document.getElementById('results-container').style.display = 'block';
    const meta = document.getElementById('result-meta'); if (meta) meta.style.display = 'block';
    const lbl  = document.getElementById('result-season-label'); if (lbl) lbl.textContent = spkResult.season;
    showToast(`Perhitungan selesai. ${spkResult.total_players} pemain dievaluasi.`, 'success');
    switchTab(1);
  } catch (e) {
    console.error(e);
    showToast('Terjadi kesalahan saat menghitung SPK.', 'error');
    document.getElementById('empty-state').style.display = 'block';
  } finally {
    btn.disabled = false; txt.textContent = 'Hitung SPK'; spn.style.display = 'none';
  }
}

function renderAll(data) {
  const te = document.getElementById('sum-total'); if (te) te.textContent = data.total_players;
  const ce = document.getElementById('sum-criteria'); if (ce) ce.textContent = data.criteria.length;
  renderROCTable(data.criteria);
  renderDecisionMatrix(data.criteria, data.decision_matrix);
  renderNormalized(data.criteria, data.normalized_matrix, data.rankings);
  renderRankings(data.rankings);
}

// ── Tab 1a: Bobot ROC ──────────────────────────────────────
function renderROCTable(criteria) {
  const tbody = document.getElementById('roc-table-body'); if (!tbody) return;
  const totalW = criteria.reduce((s, c) => s + c.weight, 0);
  tbody.innerHTML = criteria.map(c => {
    const tb = c.type === 'benefit' ? { bg:'rgba(16,185,129,.1)',color:'#34d399',lbl:'Benefit ↑' } : { bg:'rgba(239,68,68,.1)',color:'#f87171',lbl:'Cost ↓' };
    return `<tr>
      <td><span style="display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;background:rgba(16,185,129,.15);font-size:11px;font-weight:800;color:#34d399">${c.roc_rank}</span></td>
      <td><span style="font-size:12px;font-weight:700;color:#60a5fa">${escapeHtml(c.code)}</span></td>
      <td style="color:#f9fafb;font-weight:500">${escapeHtml(c.name)}</td>
      <td><span style="display:inline-block;padding:2px 9px;border-radius:999px;font-size:11px;font-weight:600;background:${tb.bg};color:${tb.color}">${tb.lbl}</span></td>
      <td style="color:#9ca3af">${escapeHtml(c.unit || '—')}</td>
      <td style="text-align:right;font-weight:700;color:#34d399">${(c.weight*100).toFixed(4)}%</td>
      <td style="text-align:right;font-family:monospace;font-size:12px;color:#9ca3af">${c.weight.toFixed(6)}</td>
    </tr>`;
  }).join('')
  + `<tr style="border-top:2px solid rgba(16,185,129,.3)">
       <td colspan="5" style="font-weight:700;color:#f9fafb;padding:10px 14px">Total Bobot</td>
       <td style="text-align:right;font-weight:800;color:#34d399;padding:10px 14px">${(totalW*100).toFixed(4)}%</td>
       <td style="text-align:right;font-family:monospace;font-weight:700;color:#34d399;padding:10px 14px">${totalW.toFixed(6)}</td>
     </tr>`;
}

// ── Tab 1b: Matriks Keputusan ─────────────────────────────
function renderDecisionMatrix(criteria, matrix) {
  const hdr  = document.getElementById('decision-matrix-header');
  const body = document.getElementById('decision-matrix-body');
  if (!hdr || !body) return;
  const thS = 'padding:10px 14px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;background:rgba(0,0,0,.3)';
  hdr.innerHTML = `<th style="${thS}">No</th><th style="${thS}">Nama Pemain</th><th style="${thS}">Posisi</th>`
    + criteria.map(c => `<th style="${thS};text-align:right;white-space:nowrap">${escapeHtml(c.code)}<br><span style="font-size:9px;font-weight:400;text-transform:capitalize;color:#4b5563">${c.type}</span></th>`).join('');
  body.innerHTML = matrix.map((row, i) =>
    `<tr><td style="padding:10px 14px;color:#6b7280">${i+1}</td>
     <td style="padding:10px 14px;font-weight:600;color:#f9fafb;white-space:nowrap">${escapeHtml(row.player_name)}</td>
     <td style="padding:10px 14px"><span style="padding:2px 8px;border-radius:5px;font-size:11px;font-weight:700;background:rgba(59,130,246,.12);color:#60a5fa">${escapeHtml(row.position)}</span></td>
     ${criteria.map(c => `<td style="text-align:right;padding:10px 14px;font-family:monospace;font-size:12px">${formatNumber(row.values[c.code],2)}</td>`).join('')}
    </tr>`).join('');
}

// ── Tab 2: Matriks Normalisasi ────────────────────────────
function renderNormalized(criteria, matrix, rankings) {
  const hdr  = document.getElementById('normalized-header');
  const body = document.getElementById('normalized-body');
  if (!hdr || !body) return;
  const thS = 'padding:10px 14px;font-size:11px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.06em;background:rgba(0,0,0,.3)';
  hdr.innerHTML = `<th style="${thS}">No</th><th style="${thS}">Nama Pemain</th><th style="${thS}">Posisi</th>`
    + criteria.map(c => { const cl = c.type === 'benefit' ? '#34d399' : '#f87171'; return `<th style="${thS};text-align:right;color:${cl};white-space:nowrap">${escapeHtml(c.code)}</th>`; }).join('')
    + `<th style="${thS};text-align:right;color:#34d399;border-left:2px solid rgba(16,185,129,.3)">V<sub>i</sub></th>`;
  body.innerHTML = matrix.map((row, i) => {
    const rd  = rankings ? rankings.find(r => r.player_id === row.player_id) : null;
    const vi  = rd ? rd.preference_score : 0;
    return `<tr>
      <td style="padding:10px 14px;color:#6b7280">${i+1}</td>
      <td style="padding:10px 14px;font-weight:600;color:#f9fafb;white-space:nowrap">${escapeHtml(row.player_name)}</td>
      <td style="padding:10px 14px"><span style="padding:2px 8px;border-radius:5px;font-size:11px;font-weight:700;background:rgba(59,130,246,.12);color:#60a5fa">${escapeHtml(row.position)}</span></td>
      ${criteria.map(c => `<td style="text-align:right;padding:10px 14px;font-family:monospace;font-size:12px">${(row.normalized[c.code] || 0).toFixed(4)}</td>`).join('')}
      <td style="text-align:right;padding:10px 14px;font-weight:800;color:#34d399;font-family:monospace;border-left:2px solid rgba(16,185,129,.3)">${vi.toFixed(6)}</td>
    </tr>`;
  }).join('');
}

// ── Tab 3: Perangkingan ───────────────────────────────────
function renderRankings(rankings) {
  const tbody = document.getElementById('ranking-body'); if (!tbody) return;
  const medals = {1:'🥇',2:'🥈',3:'🥉'};
  tbody.innerHTML = rankings.map(r => {
    const isXI = r.is_starting_xi;
    const rdisp = medals[r.rank]
      ? `<span style="font-size:20px">${medals[r.rank]}</span>`
      : `<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;background:rgba(255,255,255,.05);font-size:13px;font-weight:700;color:#6b7280">${r.rank}</span>`;
    const badge = isXI
      ? `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(16,185,129,.15);color:#34d399;border:1px solid rgba(16,185,129,.3)"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>Starting XI</span>`
      : `<span style="padding:3px 10px;border-radius:999px;font-size:11px;font-weight:600;background:rgba(255,255,255,.05);color:#6b7280">Cadangan</span>`;
    const rowBg = isXI ? 'linear-gradient(90deg,rgba(16,185,129,.07),transparent)' : 'transparent';
    return `<tr style="background:${rowBg};border-bottom:1px solid rgba(255,255,255,.04)">
      <td style="padding:12px 14px">${rdisp}</td>
      <td style="padding:12px 14px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:8px;background:${isXI?'linear-gradient(135deg,rgba(16,185,129,.25),rgba(5,150,105,.1))':'rgba(255,255,255,.05)'};border:1px solid ${isXI?'rgba(16,185,129,.25)':'rgba(255,255,255,.08)'};display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:${isXI?'#34d399':'#6b7280'}">${escapeHtml(r.player_name[0])}</div>
          <span style="font-weight:${isXI?700:500};color:${isXI?'#f9fafb':'#9ca3af'};white-space:nowrap">${escapeHtml(r.player_name)}</span>
        </div>
      </td>
      <td style="padding:12px 14px"><span style="padding:2px 8px;border-radius:5px;font-size:11px;font-weight:700;background:rgba(59,130,246,.12);color:#60a5fa">${escapeHtml(r.position)}</span></td>
      <td style="padding:12px 14px;color:#9ca3af">${r.jersey_number != null ? '#'+r.jersey_number : '—'}</td>
      <td style="padding:12px 14px;text-align:right;font-family:monospace;font-weight:800;font-size:14px;color:${isXI?'#34d399':'#6b7280'}">${r.preference_score.toFixed(6)}</td>
      <td style="padding:12px 14px;text-align:center">${badge}</td>
    </tr>`;
  }).join('');
}

// ── Tab Switching ──────────────────────────────────────────
function switchTab(tab) {
  currentTab = tab;
  for (let i = 1; i <= 3; i++) {
    const p = document.getElementById('tab-panel-' + i); if (p) p.style.display = i === tab ? 'block' : 'none';
    const b = document.getElementById('tab-btn-'   + i); if (b) b.classList.toggle('active', i === tab);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  triggerCalculate();
});
