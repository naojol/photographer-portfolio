# Silence in Frame - 写真家ポートフォリオ

写真のアップロード・管理機能付きポートフォリオサイトです。

---

## セットアップ

```bash
# 依存パッケージをインストール
npm install

# サーバーを起動
npm start
```

サーバーが起動すると、以下のURLにアクセスできます：

| ページ | URL |
|--------|-----|
| ポートフォリオ（公開サイト） | http://localhost:3000 |
| 管理画面（写真アップロード） | http://localhost:3000/admin.html |

---

## 写真のアップロード方法

### 1. 管理画面にアクセス

ブラウザで `http://localhost:3000/admin.html` を開きます。

### 2. 写真をアップロード

- **ドラッグ＆ドロップ**: 写真ファイルをドロップゾーンにドラッグします
- **ファイル選択**: 「ファイルを選択」ボタンをクリックして写真を選びます

### 3. 情報を入力

| 項目 | 説明 |
|------|------|
| タイトル | 作品のタイトル（必須） |
| カテゴリ | Shrine / Temple / Sacred / Nature / Portrait / Street / Other |
| 説明 | 作品の説明文（任意） |

### 4.「アップロード」ボタンを押す

アップロードが完了すると、ポートフォリオのギャラリーに自動的に反映されます。

---

## 写真の管理

管理画面の「写真一覧」から以下の操作ができます：

- **編集**: タイトル・カテゴリ・説明を変更
- **削除**: 写真をギャラリーから削除

---

## 対応ファイル形式

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)
- 最大ファイルサイズ: **20MB**

---

## API エンドポイント

| メソッド | パス | 説明 |
|----------|------|------|
| GET | `/api/photos` | 写真一覧を取得 |
| POST | `/api/photos` | 写真をアップロード（multipart/form-data） |
| PUT | `/api/photos/:id` | 写真のメタデータを更新 |
| DELETE | `/api/photos/:id` | 写真を削除 |

---

## ディレクトリ構成

```
photographer-portfolio/
├── server.js          # Express サーバー
├── index.html         # ポートフォリオ（公開ページ）
├── admin.html         # 管理画面
├── admin.js           # 管理画面 JavaScript
├── admin.css          # 管理画面スタイル
├── script.js          # ポートフォリオ JavaScript
├── styles.css         # ポートフォリオスタイル
├── package.json
├── images/            # デフォルト画像
├── uploads/           # アップロードされた写真（自動生成）
└── data/              # 写真メタデータ JSON（自動生成）
```

---

## ポート番号の変更

環境変数 `PORT` でポート番号を変更できます：

```bash
PORT=8080 npm start
```
