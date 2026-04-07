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
5. 「Create new project」をクリック（数分かかります）

### 2. データベースを設定

Supabase ダッシュボードの **SQL Editor** を開き、以下の SQL をすべてコピーして実行してください：

```sql
-- ============================================
-- テーブル作成
-- ============================================

-- アルバム（将来用）
CREATE TABLE albums (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_photo_id UUID,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 写真
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
CREATE INDEX idx_albums_sort_order ON albums(sort_order);

-- ============================================
-- Row Level Security（アクセス制御）
-- ============================================

ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

-- 誰でも閲覧OK（公開ポートフォリオ用）
CREATE POLICY "Public read photos" ON photos FOR SELECT USING (true);
CREATE POLICY "Public read albums" ON albums FOR SELECT USING (true);

-- ログインユーザーのみ追加・編集・削除可
CREATE POLICY "Auth insert photos" ON photos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Auth update photos" ON photos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth delete photos" ON photos FOR DELETE USING (auth.role() = 'authenticated');
CREATE POLICY "Auth manage albums" ON albums FOR ALL USING (auth.role() = 'authenticated');
```

### 3. ストレージを設定

同じく **SQL Editor** で以下を実行：

```sql
-- 写真用バケット作成（公開読み取り）
INSERT INTO storage.buckets (id, name, public) VALUES ('photos', 'photos', true);

-- 誰でも閲覧OK
CREATE POLICY "Public read storage" ON storage.objects FOR SELECT USING (bucket_id = 'photos');

-- ログインユーザーのみアップロード・削除可
CREATE POLICY "Auth upload storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'photos' AND auth.role() = 'authenticated');
CREATE POLICY "Auth delete storage" ON storage.objects FOR DELETE USING (bucket_id = 'photos' AND auth.role() = 'authenticated');
```

### 4. 管理者アカウントを作成

1. Supabase ダッシュボード → **Authentication** → **Users**
2. 「Add User」→「Create New User」をクリック
3. メールアドレスとパスワードを入力
4. 「Auto Confirm User」にチェック
5. 「Create User」をクリック

> **重要**: Authentication → Settings → 「Enable email confirmations」を OFF にすると便利です。
> また、「Allow new users to sign up」を OFF にすると、第三者がアカウントを作れなくなります。

### 5. API キーを設定

1. Supabase ダッシュボード → **Settings** → **API**
2. **Project URL** と **anon public** キーをコピー
3. `supabase-config.js` を開いて書き換え：

```js
const SUPABASE_URL = 'https://xxxxx.supabase.co';     // ← Project URL
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';  // ← anon key
```

### 6. GitHub Pages にデプロイ

```bash
git add -A
git commit -m "Setup Supabase configuration"
git push
```

GitHub リポジトリの **Settings** → **Pages** → Source を `main` / `/ (root)` に設定。

数分後にサイトが公開されます：
`https://naojol.github.io/photographer-portfolio/`

---

## 使い方

### 写真をアップロード

1. `https://naojol.github.io/photographer-portfolio/admin.html` にアクセス
2. メールアドレスとパスワードでログイン
3. 写真をドラッグ＆ドロップ（複数選択可）
4. タイトル・カテゴリ・説明を入力
5. 「アップロード」をクリック
6. ポートフォリオに自動で反映されます

### 写真を管理

管理画面の写真一覧から：
- **編集**: タイトル・カテゴリ・説明を変更
- **削除**: 写真を削除（確認ダイアログ付き）
- **並べ替え**: PC はドラッグ＆ドロップ、スマホは矢印ボタン

### 初回：デフォルト写真の移行

管理画面に初めてログインすると「デフォルト写真を移行」バナーが表示されます。
クリックすると、元々の5枚のサンプル写真を Supabase に移行して管理できるようになります。

---

## 対応ファイル形式

JPEG / PNG / WebP / GIF（最大20MB）

---

## ディレクトリ構成

```
photographer-portfolio/
├── index.html          # ポートフォリオ（公開ページ）
├── admin.html          # 管理画面
├── admin.js            # 管理画面 JavaScript
├── admin.css           # 管理画面スタイル
├── script.js           # ポートフォリオ JavaScript
├── styles.css          # ポートフォリオスタイル
├── supabase-config.js  # Supabase 接続設定
├── images/             # フォールバック用デフォルト画像
└── README.md
```

---

## 技術構成

| 役割 | サービス |
|------|---------|
| ホスティング | GitHub Pages（無料） |
| 画像ストレージ | Supabase Storage（無料枠: 1GB） |
| データベース | Supabase PostgreSQL（無料枠: 500MB） |
| 認証 | Supabase Auth（無料） |
