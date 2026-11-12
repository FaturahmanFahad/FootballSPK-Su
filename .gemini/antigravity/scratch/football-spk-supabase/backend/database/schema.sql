-- ============================================================
-- SPK Football — Schema Supabase (PostgreSQL)
-- Jalankan SELURUH isi file ini di:
-- Supabase Dashboard → SQL Editor → New Query → Run
-- ============================================================

-- ── Drop tables (urutan penting: child dulu) ──────────────
DROP TABLE IF EXISTS evaluations CASCADE;
DROP TABLE IF EXISTS weights     CASCADE;
DROP TABLE IF EXISTS criteria    CASCADE;
DROP TABLE IF EXISTS players     CASCADE;
DROP TABLE IF EXISTS users       CASCADE;

-- ══════════════════════════════════════════════════════════
-- TABLE: users
-- ══════════════════════════════════════════════════════════
CREATE TABLE users (
  id           SERIAL PRIMARY KEY,
  username     VARCHAR(50)  NOT NULL UNIQUE,
  email        VARCHAR(100),
  password     VARCHAR(255) NOT NULL,
  nama_lengkap VARCHAR(100),
  role         VARCHAR(20)  NOT NULL DEFAULT 'asisten'
                CHECK (role IN ('admin', 'pelatih', 'asisten')),
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
-- TABLE: players
-- ══════════════════════════════════════════════════════════
CREATE TABLE players (
  id             SERIAL PRIMARY KEY,
  nama_pemain    VARCHAR(100) NOT NULL,
  posisi         VARCHAR(10)  NOT NULL,
  nomor_punggung INTEGER,
  usia           INTEGER,
  status         VARCHAR(20)  NOT NULL DEFAULT 'Aktif'
                 CHECK (status IN ('Aktif', 'Cedera', 'Akumulasi', 'Skors')),
  catatan        TEXT,
  created_at     TIMESTAMPTZ  DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
-- TABLE: criteria
-- ══════════════════════════════════════════════════════════
CREATE TABLE criteria (
  id             SERIAL PRIMARY KEY,
  kode           VARCHAR(10)  NOT NULL UNIQUE,
  nama_kriteria  VARCHAR(100) NOT NULL,
  dimensi        VARCHAR(20)  CHECK (dimensi IN ('Fisik', 'Teknis', 'Taktis')),
  atribut        VARCHAR(10)  NOT NULL CHECK (atribut IN ('benefit', 'cost')),
  satuan         VARCHAR(50),
  roc_rank       INTEGER      NOT NULL DEFAULT 1
);

-- ══════════════════════════════════════════════════════════
-- TABLE: evaluations
-- ══════════════════════════════════════════════════════════
CREATE TABLE evaluations (
  id          SERIAL PRIMARY KEY,
  player_id   INTEGER      NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  criteria_id INTEGER      NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  nilai       NUMERIC(10,4) NOT NULL DEFAULT 0,
  musim       VARCHAR(20)  NOT NULL DEFAULT '2024/2025',
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (player_id, criteria_id, musim)
);

-- ══════════════════════════════════════════════════════════
-- TABLE: weights (cache bobot ROC — opsional)
-- ══════════════════════════════════════════════════════════
CREATE TABLE weights (
  id          SERIAL PRIMARY KEY,
  criteria_id INTEGER      NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
  roc_rank    INTEGER      NOT NULL,
  bobot_akhir NUMERIC(10,8),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- ══════════════════════════════════════════════════════════
-- INDEX untuk performa query
-- ══════════════════════════════════════════════════════════
CREATE INDEX idx_evaluations_player  ON evaluations (player_id);
CREATE INDEX idx_evaluations_musim   ON evaluations (musim);
CREATE INDEX idx_players_status      ON players (status);

-- ══════════════════════════════════════════════════════════
-- SEED: Kriteria C1–C9
-- ══════════════════════════════════════════════════════════
INSERT INTO criteria (kode, nama_kriteria, dimensi, atribut, satuan, roc_rank) VALUES
  ('C1', 'Jumlah Gol',              'Teknis', 'benefit', 'Gol',         1),
  ('C2', 'Jumlah Assist',           'Teknis', 'benefit', 'Assist',      2),
  ('C3', 'Akurasi Passing',         'Teknis', 'benefit', '%',           3),
  ('C4', 'Tekel Sukses',            'Teknis', 'benefit', 'Tekel',       4),
  ('C5', 'Jarak Lari Per Match',    'Fisik',  'benefit', 'Km',          5),
  ('C6', 'Jumlah Pelanggaran',      'Taktis', 'cost',    'Pelanggaran', 6),
  ('C7', 'Kartu Kuning',            'Taktis', 'cost',    'Kartu',       7),
  ('C8', 'Kartu Merah',             'Taktis', 'cost',    'Kartu',       8),
  ('C9', 'Tingkat Kebugaran Fisik', 'Fisik',  'benefit', '%',           9);

-- ══════════════════════════════════════════════════════════
-- CATATAN:
-- Jalankan "node database/seed.js" setelah ini untuk:
--   • Menambah akun user (admin/pelatih/asisten) dengan bcrypt hash
--   • Menambah data 15 pemain dummy
--   • Menambah data evaluasi lengkap
-- ══════════════════════════════════════════════════════════
