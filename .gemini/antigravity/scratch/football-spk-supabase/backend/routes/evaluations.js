// ============================================================
// routes/evaluations.js — CRUD Evaluasi Pemain
// ============================================================
const router  = require('express').Router();
const supabase = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// ── GET /api/evaluations/player/:id ──────────────────────
// Ambil nilai evaluasi satu pemain untuk musim tertentu
router.get('/player/:id', async (req, res) => {
  try {
    const playerId = parseInt(req.params.id);
    const musim    = req.query.season || '2024/2025';

    // 1. Ambil semua kriteria (urut by roc_rank)
    const { data: criteriaList, error: cErr } = await supabase
      .from('criteria')
      .select('*')
      .order('roc_rank', { ascending: true });
    if (cErr) throw cErr;

    // 2. Ambil evaluasi yang sudah ada untuk player + musim ini
    const { data: evalData, error: eErr } = await supabase
      .from('evaluations')
      .select('*')
      .eq('player_id', playerId)
      .eq('musim', musim);
    if (eErr) throw eErr;

    // 3. Buat map criteria_id → nilai
    const evalMap = {};
    (evalData || []).forEach(e => {
      evalMap[e.criteria_id] = parseFloat(e.nilai) || 0;
    });

    // 4. Gabungkan: semua kriteria + nilai yg sudah ada (default 0 jika belum)
    const result = criteriaList.map(c => ({
      criteria_id: c.id,
      code:        c.kode,
      name:        c.nama_kriteria,
      type:        c.atribut,
      unit:        c.satuan,
      value:       evalMap[c.id] !== undefined ? evalMap[c.id] : 0
    }));

    res.json({ success: true, data: result });
  } catch (err) {
    console.error('[EVAL/GET]', err.message);
    res.status(500).json({ success: false, message: 'Gagal mengambil data evaluasi.' });
  }
});

// ── POST /api/evaluations/bulk — upsert semua nilai ───────
router.post('/bulk', requireRole('admin', 'pelatih', 'asisten'), async (req, res) => {
  try {
    const { player_id, season = '2024/2025', evaluations } = req.body;

    if (!player_id || !Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({ success: false, message: 'Data tidak lengkap.' });
    }

    const rows = evaluations.map(e => ({
      player_id:   parseInt(player_id),
      criteria_id: parseInt(e.criteria_id),
      nilai:       parseFloat(e.value) || 0,
      musim:       season,
      updated_at:  new Date().toISOString()
    }));

    // Upsert — jika sudah ada (player_id, criteria_id, musim) → update
    const { error } = await supabase
      .from('evaluations')
      .upsert(rows, { onConflict: 'player_id,criteria_id,musim' });

    if (error) throw error;
    res.json({ success: true, message: 'Data evaluasi berhasil disimpan.' });
  } catch (err) {
    console.error('[EVAL/BULK]', err.message);
    res.status(500).json({ success: false, message: 'Gagal menyimpan evaluasi.' });
  }
});

// ── DELETE /api/evaluations — hapus evaluasi pemain ───────
router.delete('/', requireRole('admin', 'pelatih'), async (req, res) => {
  try {
    const { player_id, season } = req.query;

    if (!player_id) {
      return res.status(400).json({ success: false, message: 'player_id diperlukan.' });
    }

    let q = supabase.from('evaluations').delete().eq('player_id', parseInt(player_id));
    if (season) q = q.eq('musim', season);

    const { error } = await q;
    if (error) throw error;

    res.json({ success: true, message: 'Data evaluasi berhasil dihapus.' });
  } catch (err) {
    console.error('[EVAL/DELETE]', err.message);
    res.status(500).json({ success: false, message: 'Gagal menghapus evaluasi.' });
  }
});

module.exports = router;
