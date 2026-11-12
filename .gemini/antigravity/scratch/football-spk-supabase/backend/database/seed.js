// ============================================================
// database/seed.js — Seed Data Dummy ke Supabase
// Jalankan: node database/seed.js
// ============================================================
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const SALT_ROUNDS = 10;
const MUSIM = '2024/2025';

// ── HELPER ───────────────────────────────────────────────
function log(msg, color = '\x1b[32m') {
  console.log(`${color}${msg}\x1b[0m`);
}
function err(msg) { console.error(`\x1b[31m${msg}\x1b[0m`); }

// ── DATA USERS ───────────────────────────────────────────
const USERS = [
  { username: 'admin',   nama_lengkap: 'Administrator',   role: 'admin',   plain: 'admin123'   },
  { username: 'pelatih', nama_lengkap: 'Budi Santoso',    role: 'pelatih', plain: 'pelatih123' },
  { username: 'asisten', nama_lengkap: 'Andi Firmansyah', role: 'asisten', plain: 'asisten123' },
];

// ── DATA PEMAIN ───────────────────────────────────────────
const PLAYERS = [
  { nama_pemain: 'Rafli Maulana',      posisi: 'GK',  nomor_punggung: 1,  usia: 26, status: 'Aktif' },
  { nama_pemain: 'Hendri Kurniawan',   posisi: 'CB',  nomor_punggung: 4,  usia: 24, status: 'Aktif' },
  { nama_pemain: 'Bima Sakti',         posisi: 'CB',  nomor_punggung: 5,  usia: 27, status: 'Aktif' },
  { nama_pemain: 'Doni Setiawan',      posisi: 'LB',  nomor_punggung: 3,  usia: 23, status: 'Aktif' },
  { nama_pemain: 'Rizal Pratama',      posisi: 'RB',  nomor_punggung: 2,  usia: 25, status: 'Cedera' },
  { nama_pemain: 'Sandi Wahyudi',      posisi: 'CDM', nomor_punggung: 6,  usia: 28, status: 'Aktif' },
  { nama_pemain: 'Fajar Nugroho',      posisi: 'CM',  nomor_punggung: 8,  usia: 22, status: 'Aktif' },
  { nama_pemain: 'Yusuf Ramadhan',     posisi: 'CM',  nomor_punggung: 14, usia: 24, status: 'Aktif' },
  { nama_pemain: 'Gilang Ramadhan',    posisi: 'CAM', nomor_punggung: 10, usia: 23, status: 'Akumulasi' },
  { nama_pemain: 'Wahyu Hidayat',      posisi: 'LW',  nomor_punggung: 11, usia: 21, status: 'Aktif' },
  { nama_pemain: 'Irfan Bachdim',      posisi: 'RW',  nomor_punggung: 7,  usia: 29, status: 'Aktif' },
  { nama_pemain: 'Muhammad Fathur',    posisi: 'ST',  nomor_punggung: 9,  usia: 25, status: 'Aktif' },
  { nama_pemain: 'Rendi Juliansyah',   posisi: 'ST',  nomor_punggung: 19, usia: 22, status: 'Aktif' },
  { nama_pemain: 'Angga Prasetyo',     posisi: 'CB',  nomor_punggung: 15, usia: 26, status: 'Aktif' },
  { nama_pemain: 'Zulkifli Syahputra', posisi: 'GK',  nomor_punggung: 22, usia: 24, status: 'Aktif' },
];

// ── DATA EVALUASI (nilai per kriteria) ───────────────────
// Urutan: C1, C2, C3,  C4,  C5,   C6, C7, C8, C9
const EVAL_VALUES = {
  'Rafli Maulana':      [0,  1,  78,  2,   9.2,  1,  0, 0, 90],
  'Hendri Kurniawan':   [1,  2,  82,  8,  10.1,  3,  1, 0, 86],
  'Bima Sakti':         [2,  3,  80,  10, 10.5,  4,  2, 0, 84],
  'Doni Setiawan':      [1,  4,  79,  6,  10.8,  3,  1, 0, 82],
  'Sandi Wahyudi':      [2,  5,  85,  12, 11.0,  5,  2, 0, 88],
  'Fajar Nugroho':      [4,  6,  88,  7,  11.5,  4,  1, 0, 87],
  'Yusuf Ramadhan':     [3,  5,  84,  6,  11.2,  3,  2, 0, 85],
  'Wahyu Hidayat':      [7,  8,  82,  4,  11.8,  3,  1, 0, 89],
  'Irfan Bachdim':      [9,  7,  80,  3,  10.9,  4,  2, 0, 83],
  'Muhammad Fathur':    [12, 6,  76,  2,  10.4,  5,  2, 0, 85],
  'Rendi Juliansyah':   [8,  5,  78,  3,  10.6,  3,  1, 0, 86],
  'Angga Prasetyo':     [1,  3,  83,  9,  10.3,  2,  1, 0, 88],
  'Zulkifli Syahputra': [0,  1,  75,  1,   9.0,  1,  0, 0, 87],
};

// ════════════════════════════════════════════════════════
// MAIN SEED FUNCTION
// ════════════════════════════════════════════════════════
async function seed() {
  console.log('\n╔══════════════════════════════════════╗');
  console.log('║   SPK Football — Database Seeder     ║');
  console.log('╚══════════════════════════════════════╝\n');

  // ── 1. Seed Users ───────────────────────────────────
  log('📋 Seeding users...', '\x1b[36m');
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.plain, SALT_ROUNDS);
    const { error } = await supabase
      .from('users')
      .upsert([{
        username:     u.username,
        email:        `${u.username}@spkfootball.id`,
        password:     hash,
        nama_lengkap: u.nama_lengkap,
        role:         u.role
      }], { onConflict: 'username' });
    if (error) { err(`  ✗ User ${u.username}: ${error.message}`); }
    else { log(`  ✓ User '${u.username}' (${u.role}) — password: ${u.plain}`); }
  }

  // ── 2. Seed Players ──────────────────────────────────
  log('\n📋 Seeding players...', '\x1b[36m');
  for (const p of PLAYERS) {
    const { error } = await supabase
      .from('players')
      .upsert([p], { onConflict: 'nama_pemain' });
    if (error) { err(`  ✗ Player ${p.nama_pemain}: ${error.message}`); }
    else { log(`  ✓ ${p.nama_pemain} (${p.posisi}) — Status: ${p.status}`); }
  }

  // ── 3. Ambil ID players & criteria ──────────────────
  const { data: players } = await supabase.from('players').select('id, nama_pemain, status');
  const { data: criteria } = await supabase.from('criteria').select('id, kode').order('roc_rank');

  if (!players || !criteria) {
    err('Gagal mengambil data players/criteria untuk seed evaluasi.');
    return;
  }

  // ── 4. Seed Evaluations ──────────────────────────────
  log('\n📋 Seeding evaluations...', '\x1b[36m');
  const eligiblePlayers = players.filter(p => p.status === 'Aktif');

  for (const player of eligiblePlayers) {
    const vals = EVAL_VALUES[player.nama_pemain];
    if (!vals) { log(`  ⚠ Skip: ${player.nama_pemain} (tidak ada data evaluasi)`, '\x1b[33m'); continue; }

    const rows = criteria.map((c, i) => ({
      player_id:   player.id,
      criteria_id: c.id,
      nilai:       vals[i] || 0,
      musim:       MUSIM
    }));

    const { error } = await supabase
      .from('evaluations')
      .upsert(rows, { onConflict: 'player_id,criteria_id,musim' });

    if (error) { err(`  ✗ Eval ${player.nama_pemain}: ${error.message}`); }
    else { log(`  ✓ Evaluasi ${player.nama_pemain} (${criteria.length} kriteria)`); }
  }

  console.log('\n╔══════════════════════════════════════╗');
  log('║   ✅  Seed selesai!                  ║', '\x1b[32m');
  console.log('╚══════════════════════════════════════╝');
  console.log('\n📌 Akun login:');
  USERS.forEach(u => console.log(`   ${u.role.padEnd(10)} → ${u.username} / ${u.plain}`));
  console.log('');
  process.exit(0);
}

seed().catch(e => { err(`\nFatal: ${e.message}`); process.exit(1); });
