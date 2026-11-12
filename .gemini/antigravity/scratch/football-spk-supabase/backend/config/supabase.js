// ============================================================
// config/supabase.js — Supabase Client (Service Role)
// ============================================================
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
  console.error('\n❌ [Supabase] SUPABASE_URL dan SUPABASE_SERVICE_KEY wajib diisi di .env!\n');
  process.exit(1);
}

// Service role key → bypass RLS, untuk operasi backend
const supabase = createClient(url, key, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('[Supabase] Client initialized ✓');
module.exports = supabase;
