# Silence in Frame - 写真家ポートフォリオ

写真のアップロード・管理機能付きポートフォリオサイトです。
GitHub Pages + Supabase で完全無料で運用できます。

---

## セットアップ手順

### 1. Supabase プロジェクトを作成

1. [https://supabase.com](https://supabase.com) でアカウントを作成（GitHub ログイン可）
2. 「New Project」をクリック
3. プロジェクト名とデータベースパスワードを設定
4. Region は「Northeast Asia (Tokyo)」を選択
5. 「Create new project」をクリック

### 2. データベースを設定

Supabase ダッシュボードの **SQL Editor** で以下を実行:

```sql
CREATE TABLE albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_photo_id UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE photos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '無題',
  description TEXT DEFAULT '',
  category TEXT DEFAULT 'Other',
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_photos_sort_order ON photos(sort_order);
CREATE INDEX idx_photos_album_id ON photos(album_id);

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Public read albums" ON albums FOR SELECT USING (true);
CREATE POLICY "Auth insert photos" ON photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update photos" ON photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete photos" ON photos FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth manage albums" ON albums FOR ALL USING (auth.role() = 'authenticated');
```

### 3. ストレージを設定

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

CREATE POLICY "Public read storage" ON storage.objects FOR SELECT USING (bucket_id = 'photos');
CREATE POLICY "Auth upload storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete storage" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
```

### 4. 管理者アカウントを作成

1. Authentication → Users → 「Add User」
2. メールアドレスとパスワードを入力
3. 「Auto Confirm User」にチェック

### 5. API キーを設定

Settings → API から Project URL と anon key をコピーし、`supabase-config.js` を編集:

```js
const SUPABASE_URL = 'https://xxxxx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';
```

### 6. GitHub Pages にデプロイ

Settings → Pages → Source: `main` / `/ (root)` → Save

---

## 使い方

1. `admin.html` にアクセスしてログイン
2. 写真をドラッグ＆ドロップ（複数選択可）
3. タイトル・カテゴリ・説明を入力
4. 「アップロード」をクリック → ポートフォリオに自動反映
