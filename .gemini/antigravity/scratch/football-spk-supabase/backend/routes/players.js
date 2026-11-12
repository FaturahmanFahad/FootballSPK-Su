// ============================================================
// routes/players.js — CRUD Pemain + Eligibility Filter
// ============================================================
const router   = require('express').Router();
const supabase  = require('../config/supabase');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Helper: tambahkan field is_eligible berdasarkan status
function attachEligible(players) {
  return (players || []).map(p => ({
    ...p,
    is_eligible: p.status === 'Aktif'
  }));
}

// ── GET /api/players ──────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { position, status, search, eligible } = req.query;

    let q = supabase
      .from('players')
      .select('*')
      .order('nama_pemain', { ascending: true });

    if (position && position !== 'all') q = q.eq('posisi', position);
    if (status   && status   !== 'all') q = q.eq('status', status);
    // Filter eligibility: hanya pemain Aktif (tidak cedera / akumulasi)
    if (eligible === 'true') q = q.eq('status', 'Aktif');
    if (search) q = q.ilike('nama_pemain', `%${search}%`);

    const { data, error } = await q;
    if (error) throw error;

    res.json({ success: true, data: attachEligible(data) });
  } catch (err) {
    console.error('[PLAYERS/GET]', err.message);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pemain.' });
  }
});

// ── GET /api/players/:id ─────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, message: 'Pemain tidak ditemukan.' });
    }
    res.json({ success: true, data: { ...data, is_eligible: data.status === 'Aktif' } });
  } catch (err) {
    console.error('[PLAYERS/GET_ID]', err.message);
    res.status(500).json({ success: false, message: 'Gagal mengambil data pemain.' });
  }
});

// ── POST /api/players ─────────────────────────────────────
router.post('/', requireRole('admin', 'pelatih'), async (req, res) => {
  try {
    const { nama_pemain, posisi, nomor_punggung, usia, status = 'Aktif', catatan } = req.body;

    if (!nama_pemain || !posisi) {
      return res.status(400).json({ success: false, message: 'Nama pemain dan posisi wajib diisi.' });
    }

    const { data, error } = await supabase
      .from('players')
      .insert([{
        nama_pemain:     nama_pemain.trim(),
        posisi,
        nomor_punggung:  nomor_punggung ? parseInt(nomor_punggung) : null,
        usia:            usia ? parseInt(usia) : null,
        status,
        catatan:         catatan || null
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json({
      success: true,
      message: 'Pemain berhasil ditambahkan.',
      data: { ...data, is_eligible: data.status === 'Aktif' }
    });
  } catch (err) {
    console.error('[PLAYERS/POST]', err.message);
    res.status(500).json({ success: false, message: 'Gagal menambahkan pemain.' });
  }
});

// ── PUT /api/players/:id ──────────────────────────────────
router.put('/:id', requireRole('admin', 'pelatih'), async (req, res) => {
  try {
    const { nama_pemain, posisi, nomor_punggung, usia, status, catatan } = req.body;
    const updates = { updated_at: new Date().toISOString() };

    if (nama_pemain  !== undefined) updates.nama_pemain     = nama_pemain.trim();
    if (posisi       !== undefined) updates.posisi          = posisi;
    if (nomor_punggung !== undefined) updates.nomor_punggung = nomor_punggung ? parseInt(nomor_punggung) : null;
    if (usia         !== undefined) updates.usia            = usia ? parseInt(usia) : null;
    if (status       !== undefined) updates.status          = status;
    if (catatan      !== undefined) updates.catatan         = catatan || null;

    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({
      success: true,
      message: 'Data pemain berhasil diperbarui.',
      data: { ...data, is_eligible: data.status === 'Aktif' }
    });
  } catch (err) {
    console.error('[PLAYERS/PUT]', err.message);
    res.status(500).json({ success: false, message: 'Gagal memperbarui data pemain.' });
  }
});

// ── DELETE /api/players/:id ───────────────────────────────
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { error } = await supabase
      .from('players')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ success: true, message: 'Pemain berhasil dihapus.' });
  } catch (err) {
    console.error('[PLAYERS/DELETE]', err.message);
    res.status(500).json({ success: false, message: 'Gagal menghapus pemain.' });
  }
});

module.exports = router;
