// ============================================================
// routes/spk.js — Engine Perhitungan ROC + SAW
// ============================================================
const router  = require('express').Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// ═══════════════════════════════════════════════════════════
// 1. ROC WEIGHT CALCULATION
//    w_k = (1/n) × Σ(i=k…n) 1/i
// ═══════════════════════════════════════════════════════════
function calcROCWeights(criteriaArr) {
  const n = criteriaArr.length;
  return criteriaArr.map(c => {
    let sum = 0;
    for (let i = c.roc_rank; i <= n; i++) sum += 1 / i;
    return {
      ...c,
      code:   c.kode,
      name:   c.nama_kriteria,
      type:   c.atribut,
      unit:   c.satuan,
      weight: (1 / n) * sum
    };
  });
}

// ═══════════════════════════════════════════════════════════
// 2. SAW NORMALIZATION
//    Benefit : r_ij = x_ij / max(x_j)
//    Cost    : r_ij = min(x_j) / x_ij  → jika min=0: 1/(1+x_ij)
// ═══════════════════════════════════════════════════════════
function normalizeMatrix(criteria, decisionMatrix) {
  return decisionMatrix.map(row => {
    const normalized = {};

    criteria.forEach(c => {
      const allVals = decisionMatrix.map(r => parseFloat(r.values[c.code]) || 0);
      const val     = parseFloat(row.values[c.code]) || 0;

      if (c.type === 'benefit') {
        const maxVal = Math.max(...allVals);
        normalized[c.code] = maxVal === 0 ? 0 : val / maxVal;
      } else {
        // cost
        const minVal = Math.min(...allVals);
        if (val === 0) {
          normalized[c.code] = minVal === 0 ? 1 : minVal / 0.0001; // avoid div/0
        } else if (minVal === 0) {
          normalized[c.code] = 1 / (1 + val);
        } else {
          normalized[c.code] = minVal / val;
        }
      }
    });

    return { ...row, normalized };
  });
}

// ═══════════════════════════════════════════════════════════
// GET /api/spk/calculate?season=2024/2025
// ═══════════════════════════════════════════════════════════
router.get('/calculate', async (req, res) => {
  try {
    const season = req.query.season || '2024/2025';

    // ── Step 1: Ambil kriteria (urut roc_rank) ────────────
    const { data: rawCriteria, error: cErr } = await supabase
      .from('criteria')
      .select('*')
      .order('roc_rank', { ascending: true });
    if (cErr) throw cErr;

    if (!rawCriteria || rawCriteria.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Data kriteria belum ada. Pastikan tabel criteria sudah terisi.'
      });
    }

    // ── Step 2: Hitung bobot ROC ──────────────────────────
    const criteria = calcROCWeights(rawCriteria);

    // ── Step 3: Ambil pemain eligible (status = 'Aktif') ──
    const { data: players, error: pErr } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'Aktif')
      .order('nama_pemain', { ascending: true });
    if (pErr) throw pErr;

    if (!players || players.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Tidak ada pemain Aktif/Eligible yang dapat dievaluasi.'
      });
    }

    // ── Step 4: Ambil semua evaluasi untuk musim ini ──────
    const playerIds = players.map(p => p.id);
    const { data: evalData, error: eErr } = await supabase
      .from('evaluations')
      .select('*')
      .in('player_id', playerIds)
      .eq('musim', season);
    if (eErr) throw eErr;

    // Build eval map: { player_id: { criteria_id: nilai } }
    const evalMap = {};
    (evalData || []).forEach(e => {
      if (!evalMap[e.player_id]) evalMap[e.player_id] = {};
      evalMap[e.player_id][e.criteria_id] = parseFloat(e.nilai) || 0;
    });

    // ── Step 5: Bangun matriks keputusan ──────────────────
    // Hanya pemain yang punya minimal 1 nilai evaluasi
    const decisionMatrix = players
      .filter(p => evalMap[p.id] && Object.keys(evalMap[p.id]).length > 0)
      .map(p => {
        const values = {};
        criteria.forEach(c => {
          values[c.code] = evalMap[p.id]?.[c.id] || 0;
        });
        return {
          player_id:    p.id,
          player_name:  p.nama_pemain,
          position:     p.posisi,
          jersey_number: p.nomor_punggung,
          values
        };
      });

    if (decisionMatrix.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Belum ada data evaluasi untuk musim ini. Silakan input nilai evaluasi terlebih dahulu.'
      });
    }

    // ── Step 6: Normalisasi SAW ───────────────────────────
    const normalizedMatrix = normalizeMatrix(criteria, decisionMatrix);

    // ── Step 7: Hitung Nilai Preferensi V_i ──────────────
    // V_i = Σ (w_j × r_ij)
    const rankings = normalizedMatrix
      .map(row => {
        let vi = 0;
        criteria.forEach(c => {
          vi += (c.weight || 0) * (row.normalized[c.code] || 0);
        });
        return {
          player_id:        row.player_id,
          player_name:      row.player_name,
          position:         row.position,
          jersey_number:    row.jersey_number,
          preference_score: vi
        };
      })
      .sort((a, b) => b.preference_score - a.preference_score)
      .map((r, i) => ({
        ...r,
        rank:           i + 1,
        is_starting_xi: i < 11
      }));

    // ── Response ─────────────────────────────────────────
    res.json({
      success: true,
      data: {
        season,
        total_players:    decisionMatrix.length,
        criteria,
        decision_matrix:  decisionMatrix,
        normalized_matrix: normalizedMatrix,
        rankings
      }
    });

  } catch (err) {
    console.error('[SPK/CALCULATE]', err.message);
    res.status(500).json({ success: false, message: 'Gagal melakukan perhitungan SPK.' });
  }
});

module.exports = router;
