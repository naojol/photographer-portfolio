# Silence in Frame - 写真家ポートフォリオ

写真のアップロード・管理機能付きポートフォリオサイトです。

**公開URL（GitHub Pages）**: https://naojol.github.io/photographer-portfolio/

---

## GitHub Pages での写真追加方法

1. `images/` フォルダに写真ファイル（JPG/PNG）を追加
2. `script.js` の `CONFIG.gallery` に写真情報を追記
3. GitHub にプッシュ → 自動で反映

```js
// script.js の CONFIG.gallery に追記する例
{
    id: 6,
    src: 'images/my-photo.jpg',
    title: '作品タイトル',
    category: 'Shrine',
    description: '作品の説明文'
}
```

---

## ローカルでの開発（写真アップロード機能付き）

```bash
npm install
npm start
```

| ページ | URL |
|--------|-----|
| ポートフォリオ | http://localhost:3000 |
| 管理画面（写真アップロード） | http://localhost:3000/admin.html |

管理画面からドラッグ＆ドロップで写真をアップロードできます。

---

## 対応ファイル形式

JPEG / PNG / WebP / GIF（最大20MB）
