/**
 * Silence in Frame - Supabase 設定
 *
 * セットアップ手順:
 * 1. https://supabase.com でプロジェクトを作成
 * 2. Settings → API から URL と anon key をコピー
 * 3. 下の SUPABASE_URL と SUPABASE_ANON_KEY を書き換え
 */

const SUPABASE_URL = https://dfozqpeclxdqkgqdbers.supabase.co;
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmb3pxcGVjbHhkcWtncWRiZXJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTIyNDksImV4cCI6MjA5MTEyODI0OX0.m7TOUm7LkGUkglxjlHufn0AQmi3Tkw538lIr899qQWg;

// Supabase クライアント初期化
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Supabase が設定済みかどうかを確認
 */
function isSupabaseConfigured() {
    return SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';
}

/**
 * Storage の公開URLを取得
 */
function getPublicUrl(storagePath) {
    const { data } = supabaseClient.storage.from('photos').getPublicUrl(storagePath);
    return data.publicUrl;
}
