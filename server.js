/**
 * Silence in Frame - 写真アップロードサーバー
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// データファイルのパス
const DATA_FILE = path.join(__dirname, 'data', 'photos.json');
const UPLOAD_DIR = path.join(__dirname, 'uploads');

// ディレクトリを作成
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// 初期データファイルが存在しなければ作成
if (!fs.existsSync(DATA_FILE)) {
    // 既存のギャラリー画像をデフォルトデータとして使用
    const defaultPhotos = [
        { id: 1, filename: 'gallery-1.png', title: '境界', category: 'Shrine', description: '朝霧に佇む鳥居、現世と神域の狭間', uploadedAt: new Date().toISOString(), isDefault: true },
        { id: 2, filename: 'gallery-2.png', title: '静寂の刻', category: 'Temple', description: '雪に覆われた寺院、時が止まったかのような静けさ', uploadedAt: new Date().toISOString(), isDefault: true },
        { id: 3, filename: 'gallery-3.png', title: '結界', category: 'Sacred', description: '注連縄と紙垂、神聖な空間を守る結界', uploadedAt: new Date().toISOString(), isDefault: true },
        { id: 4, filename: 'gallery-4.png', title: '参道', category: 'Shrine', description: '石灯籠が導く祈りの道', uploadedAt: new Date().toISOString(), isDefault: true },
        { id: 5, filename: 'gallery-5.png', title: '木漏れ日', category: 'Shrine', description: '光が差し込む鳥居、自然と神域の調和', uploadedAt: new Date().toISOString(), isDefault: true }
    ];
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultPhotos, null, 2));
}

// --- Multer設定 ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('許可されていないファイル形式です。JPEG, PNG, WebP, GIF のみアップロードできます。'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 20 * 1024 * 1024 } // 最大20MB
});

// --- ミドルウェア ---
app.use(express.json());
app.use(express.static(__dirname)); // HTML, CSS, JS, images/
app.use('/uploads', express.static(UPLOAD_DIR));

// --- ヘルパー関数 ---
function readPhotos() {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
}

function writePhotos(photos) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(photos, null, 2));
}

// --- API エンドポイント ---

// 写真一覧を取得
app.get('/api/photos', (req, res) => {
    const photos = readPhotos();
    // src パスを付与して返す
    const photosWithSrc = photos.map(photo => ({
        ...photo,
        src: photo.isDefault ? `images/${photo.filename}` : `uploads/${photo.filename}`
    }));
    res.json(photosWithSrc);
});

// 写真をアップロード
app.post('/api/photos', upload.single('photo'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'ファイルが選択されていません。' });
    }

    const photos = readPhotos();
    const maxId = photos.length > 0 ? Math.max(...photos.map(p => p.id)) : 0;

    const newPhoto = {
        id: maxId + 1,
        filename: req.file.filename,
        title: req.body.title || '無題',
        category: req.body.category || 'Other',
        description: req.body.description || '',
        uploadedAt: new Date().toISOString(),
        isDefault: false
    };

    photos.push(newPhoto);
    writePhotos(photos);

    res.status(201).json({
        ...newPhoto,
        src: `uploads/${newPhoto.filename}`
    });
});

// 写真のメタデータを更新
app.put('/api/photos/:id', (req, res) => {
    const photos = readPhotos();
    const index = photos.findIndex(p => p.id === parseInt(req.params.id));

    if (index === -1) {
        return res.status(404).json({ error: '写真が見つかりません。' });
    }

    const { title, category, description } = req.body;
    if (title !== undefined) photos[index].title = title;
    if (category !== undefined) photos[index].category = category;
    if (description !== undefined) photos[index].description = description;

    writePhotos(photos);
    res.json(photos[index]);
});

// 写真を削除
app.delete('/api/photos/:id', (req, res) => {
    const photos = readPhotos();
    const index = photos.findIndex(p => p.id === parseInt(req.params.id));

    if (index === -1) {
        return res.status(404).json({ error: '写真が見つかりません。' });
    }

    const photo = photos[index];

    // アップロードされたファイルを削除（デフォルト画像は残す）
    if (!photo.isDefault) {
        const filePath = path.join(UPLOAD_DIR, photo.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    photos.splice(index, 1);
    writePhotos(photos);
    res.json({ message: '写真を削除しました。' });
});

// Multerエラーハンドリング
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'ファイルサイズが大きすぎます。20MB以下にしてください。' });
        }
        return res.status(400).json({ error: `アップロードエラー: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

// --- サーバー起動 ---
app.listen(PORT, () => {
    console.log(`\n========================================`);
    console.log(`  Silence in Frame - サーバー起動`);
    console.log(`========================================`);
    console.log(`  ポートフォリオ: http://localhost:${PORT}`);
    console.log(`  管理画面:       http://localhost:${PORT}/admin.html`);
    console.log(`========================================\n`);
});
