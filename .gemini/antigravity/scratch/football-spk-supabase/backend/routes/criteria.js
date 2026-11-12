// ============================================================
// routes/criteria.js — Kriteria + Bobot ROC
// ============================================================
const router   = require('express').Router();
const supabase  = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// ── Helper: Hitung bobot ROC dari array kriteria ──────────
// Formula: w_k = (1/n) * Σ(i=k..n) 1/i
function computeROCWeights(criteriaArr) {
  const n = criteriaArr.length;
  return criteriaArr.map(c => {
    let sum = 0;
    for (let i = c.roc_rank; i <= n; i++) sum += 1 / i;
    const weight = (1 / n) * sum;
    return {
      ...c,
      // Alias agar kompatibel dengan frontend
      code:   c.kode,
      name:   c.nama_kriteria,
      type:   c.atribut,
      unit:   c.satuan,
      weight
    };
  });
}

// ── GET /api/criteria ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('criteria')
      .select('*')
      .order('roc_rank', { ascending: true });

    if (error) throw error;

    const criteria = computeROCWeights(data || []);
    res.json({ success: true, data: criteria });
  } catch (err) {
    console.error('[CRITERIA/GET]', err.message);
    res.status(500).json({ success: false, message: 'Gagal mengambil data kriteria.' });
  }
});

// ── PUT /api/criteria/weights — simpan urutan ROC ─────────
router.put('/weights', requireRole('admin', 'pelatih'), async (req, res) => {
  try {
    const { rankings } = req.body;

    if (!Array.isArray(rankings) || rankings.length === 0) {
      return res.status(400).json({ success: false, message: 'Data rankings tidak valid.' });
    }

    // Update roc_rank satu per satu (Supabase belum support bulk update yang berbeda nilai)
    const promises = rankings.map(r =>
      supabase
        .from('criteria')
        .update({ roc_rank: r.rank })
        .eq('id', r.id)
    );

    const results = await Promise.all(promises);
    const failed  = results.find(r => r.error);
    if (failed) throw failed.error;

    // Ambil data terbaru dengan bobot baru
    const { data, error: fetchErr } = await supabase
      .from('criteria')
      .select('*')
      .order('roc_rank', { ascending: true });
    if (fetchErr) throw fetchErr;

    const criteria = computeROCWeights(data || []);
    res.json({
      success: true,
      message: 'Urutan bobot ROC berhasil disimpan.',
      data: criteria
    });
  } catch (err) {
    console.error('[CRITERIA/WEIGHTS]', err.message);
    res.status(500).json({ success: false, message: 'Gagal menyimpan bobot ROC.' });
  }
});

module.exports = router;
