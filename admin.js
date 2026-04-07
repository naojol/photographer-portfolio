/**
 * Silence in Frame - 管理画面 (Supabase版)
 */

// --- DOM要素 ---
const els = {
    // ログイン
    loginScreen: document.getElementById('login-screen'),
    loginForm: document.getElementById('login-form'),
    loginEmail: document.getElementById('login-email'),
    loginPassword: document.getElementById('login-password'),
    loginError: document.getElementById('login-error'),
    loginButton: document.getElementById('login-button'),
    loginButtonText: document.querySelector('.login-button-text'),
    loginButtonLoading: document.querySelector('.login-button-loading'),
    // アプリ
    appScreen: document.getElementById('app-screen'),
    logoutButton: document.getElementById('logout-button'),
    // アップロード
    uploadForm: document.getElementById('upload-form'),
    dropzone: document.getElementById('dropzone'),
    dropzoneContent: document.getElementById('dropzone-content'),
    photoInput: document.getElementById('photo-input'),
    batchPreview: document.getElementById('batch-preview'),
    batchPreviewGrid: document.getElementById('batch-preview-grid'),
    batchCount: document.getElementById('batch-count'),
    batchClear: document.getElementById('batch-clear'),
    uploadFields: document.getElementById('upload-fields'),
    titleInput: document.getElementById('photo-title'),
    categorySelect: document.getElementById('photo-category'),
    descriptionInput: document.getElementById('photo-description'),
    submitButton: document.getElementById('submit-button'),
    uploadProgress: document.getElementById('upload-progress'),
    progressFill: document.getElementById('progress-fill'),
    progressText: document.getElementById('progress-text'),
    // 移行
    migrateBanner: document.getElementById('migrate-banner'),
    migrateButton: document.getElementById('migrate-button'),
    // 写真一覧
    photosGrid: document.getElementById('photos-grid'),
    photosLoading: document.getElementById('photos-loading'),
    photoCount: document.getElementById('photo-count'),
    // 編集モーダル
    editModal: document.getElementById('edit-modal'),
    editForm: document.getElementById('edit-form'),
    editId: document.getElementById('edit-id'),
    editImagePreview: document.getElementById('edit-image-preview'),
    editTitle: document.getElementById('edit-title'),
    editCategory: document.getElementById('edit-category'),
    editDescription: document.getElementById('edit-description'),
    // 削除モーダル
    deleteModal: document.getElementById('delete-modal'),
    deleteId: document.getElementById('delete-id'),
    deleteStoragePath: document.getElementById('delete-storage-path'),
    deletePreview: document.getElementById('delete-preview'),
    deleteConfirm: document.getElementById('delete-confirm'),
    // トースト
    toastContainer: document.getElementById('toast-container')
};

let selectedFiles = [];
let draggedCard = null;

// ============================================
// 初期化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initDropzone();
    initUploadForm();
    initEditModal();
    initDeleteModal();
    initMigration();
});

// ============================================
// 認証
// ============================================
async function initAuth() {
    if (!isSupabaseConfigured()) {
        showLogin();
        els.loginError.textContent = 'Supabaseが未設定です。supabase-config.jsを確認してください。';
        els.loginError.style.display = 'block';
        els.loginButton.disabled = true;
        return;
    }

    const { data: { session } } = await supabaseClient.auth.getSession();
    if (session) {
        showApp();
    } else {
        showLogin();
    }
}

els.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    els.loginError.style.display = 'none';
    setLoginLoading(true);

    const { error } = await supabaseClient.auth.signInWithPassword({
        email: els.loginEmail.value,
        password: els.loginPassword.value
    });

    if (error) {
        els.loginError.textContent = 'メールアドレスまたはパスワードが正しくありません。';
        els.loginError.style.display = 'block';
        setLoginLoading(false);
    } else {
        showApp();
    }
});

els.logoutButton.addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    showLogin();
});

function showLogin() {
    els.loginScreen.style.display = 'flex';
    els.appScreen.style.display = 'none';
}

function showApp() {
    els.loginScreen.style.display = 'none';
    els.appScreen.style.display = 'block';
    setLoginLoading(false);
    loadPhotos();
}

function setLoginLoading(loading) {
    els.loginButton.disabled = loading;
    els.loginButtonText.style.display = loading ? 'none' : 'inline';
    els.loginButtonLoading.style.display = loading ? 'inline-flex' : 'none';
}

// ============================================
// ドロップゾーン
// ============================================
function initDropzone() {
    els.dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.dropzone.classList.add('dragover');
    });

    els.dropzone.addEventListener('dragleave', () => {
        els.dropzone.classList.remove('dragover');
    });

    els.dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        els.dropzone.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) addFiles(files);
    });

    els.photoInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) addFiles(files);
        els.photoInput.value = '';
    });

    els.batchClear.addEventListener('click', clearFiles);
}

function addFiles(newFiles) {
    selectedFiles = selectedFiles.concat(newFiles);
    renderBatchPreview();
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    if (selectedFiles.length === 0) {
        clearFiles();
    } else {
        renderBatchPreview();
    }
}

function clearFiles() {
    selectedFiles = [];
    els.batchPreview.style.display = 'none';
    els.uploadFields.style.display = 'none';
    els.submitButton.style.display = 'none';
    els.dropzoneContent.style.display = 'flex';
}

function renderBatchPreview() {
    els.dropzoneContent.style.display = 'none';
    els.batchPreview.style.display = 'block';
    els.uploadFields.style.display = 'grid';
    els.submitButton.style.display = 'block';
    els.batchCount.textContent = `${selectedFiles.length}枚選択中`;

    els.batchPreviewGrid.innerHTML = selectedFiles.map((file, i) => {
        const url = URL.createObjectURL(file);
        return `
            <div class="batch-item">
                <img src="${url}" alt="${file.name}">
                <button type="button" class="batch-item-remove" data-index="${i}">&times;</button>
                <span class="batch-item-name">${file.name}</span>
            </div>
        `;
    }).join('');

    els.batchPreviewGrid.querySelectorAll('.batch-item-remove').forEach(btn => {
        btn.addEventListener('click', () => removeFile(parseInt(btn.dataset.index)));
    });
}

// ============================================
// アップロード
// ============================================
function initUploadForm() {
    els.uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (selectedFiles.length === 0) return;

        const title = els.titleInput.value || '無題';
        const category = els.categorySelect.value;
        const description = els.descriptionInput.value;

        els.submitButton.disabled = true;
        els.uploadProgress.style.display = 'block';

        let uploaded = 0;
        const total = selectedFiles.length;

        for (const file of selectedFiles) {
            updateProgress(uploaded, total, file.name);
            try {
                await uploadSinglePhoto(file, title, category, description);
                uploaded++;
            } catch (err) {
                showToast(`${file.name}: ${err.message}`, 'error');
            }
        }

        updateProgress(total, total, '完了');
        els.uploadProgress.style.display = 'none';
        els.submitButton.disabled = false;

        if (uploaded > 0) {
            showToast(`${uploaded}枚の写真をアップロードしました`, 'success');
            clearFiles();
            els.uploadForm.reset();
            loadPhotos();
        }
    });
}

async function uploadSinglePhoto(file, title, category, description) {
    const ext = file.name.split('.').pop().toLowerCase();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${ext}`;
    const storagePath = `photos/${filename}`;

    // Storage にアップロード
    const { error: uploadError } = await supabaseClient.storage
        .from('photos')
        .upload(storagePath, file, { cacheControl: '3600', upsert: false });

    if (uploadError) throw new Error(uploadError.message);

    // 公開URLを取得
    const publicUrl = getPublicUrl(storagePath);

    // 現在の最大 sort_order を取得
    const { data: maxData } = await supabaseClient
        .from('photos')
        .select('sort_order')
        .order('sort_order', { ascending: false })
        .limit(1);

    const nextSort = (maxData && maxData.length > 0) ? maxData[0].sort_order + 1 : 0;

    // DB にメタデータを挿入
    const { error: dbError } = await supabaseClient.from('photos').insert({
        title,
        description,
        category,
        storage_path: storagePath,
        public_url: publicUrl,
        sort_order: nextSort
    });

    if (dbError) throw new Error(dbError.message);
}

function updateProgress(current, total, label) {
    const pct = total > 0 ? Math.round((current / total) * 100) : 0;
    els.progressFill.style.width = `${pct}%`;
    els.progressText.textContent = `${current}/${total} ${label}`;
}

// ============================================
// 写真一覧
// ============================================
async function loadPhotos() {
    if (!isSupabaseConfigured()) return;

    els.photosLoading.style.display = 'flex';

    const { data, error } = await supabaseClient
        .from('photos')
        .select('*')
        .order('sort_order', { ascending: true });

    els.photosLoading.style.display = 'none';

    if (error) {
        els.photosGrid.innerHTML = '<p class="empty-message">写真の読み込みに失敗しました。</p>';
        return;
    }

    els.photoCount.textContent = `${data.length}枚`;

    // デフォルト写真移行バナーの表示判定
    if (data.length === 0) {
        els.migrateBanner.style.display = 'flex';
    } else {
        els.migrateBanner.style.display = 'none';
    }

    renderPhotos(data);
}

function renderPhotos(photos) {
    if (photos.length === 0) {
        els.photosGrid.innerHTML = '<p class="empty-message">写真がありません。上のフォームからアップロードしてください。</p>';
        return;
    }

    els.photosGrid.innerHTML = photos.map((photo, index) => `
        <div class="photo-card" draggable="true" data-id="${photo.id}" data-sort="${photo.sort_order}" data-index="${index}">
            <div class="photo-card-drag-handle" title="ドラッグで並べ替え">
                <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                    <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                    <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                    <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                </svg>
            </div>
            <div class="photo-card-image">
                <img src="${photo.public_url}" alt="${escapeHtml(photo.title)}" loading="lazy">
            </div>
            <div class="photo-card-info">
                <h3 class="photo-card-title">${escapeHtml(photo.title)}</h3>
                <span class="photo-card-category">${escapeHtml(photo.category)}</span>
                <p class="photo-card-description">${escapeHtml(photo.description || '')}</p>
            </div>
            <div class="photo-card-actions">
                <button class="btn-reorder btn-up" data-index="${index}" title="上に移動">&uarr;</button>
                <button class="btn-reorder btn-down" data-index="${index}" title="下に移動">&darr;</button>
                <button class="btn-edit" data-id="${photo.id}">編集</button>
                <button class="btn-delete" data-id="${photo.id}" data-path="${photo.storage_path}" data-url="${photo.public_url}" data-title="${escapeAttr(photo.title)}">削除</button>
            </div>
        </div>
    `).join('');

    // イベントバインド
    initDragReorder();
    initMobileReorder(photos);

    els.photosGrid.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const photo = photos.find(p => p.id === btn.dataset.id);
            if (photo) openEditModal(photo);
        });
    });

    els.photosGrid.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            openDeleteModal(btn.dataset.id, btn.dataset.path, btn.dataset.url, btn.dataset.title);
        });
    });
}

// ============================================
// ドラッグ＆ドロップ並べ替え
// ============================================
function initDragReorder() {
    const cards = els.photosGrid.querySelectorAll('.photo-card');

    cards.forEach(card => {
        card.addEventListener('dragstart', (e) => {
            draggedCard = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            draggedCard = null;
            document.querySelectorAll('.photo-card.drag-over').forEach(c => c.classList.remove('drag-over'));
        });

        card.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (draggedCard && draggedCard !== card) {
                card.classList.add('drag-over');
            }
        });

        card.addEventListener('dragleave', () => {
            card.classList.remove('drag-over');
        });

        card.addEventListener('drop', async (e) => {
            e.preventDefault();
            card.classList.remove('drag-over');
            if (!draggedCard || draggedCard === card) return;

            // DOM上で並べ替え
            const allCards = Array.from(els.photosGrid.querySelectorAll('.photo-card'));
            const fromIndex = allCards.indexOf(draggedCard);
            const toIndex = allCards.indexOf(card);

            if (fromIndex < toIndex) {
                card.after(draggedCard);
            } else {
                card.before(draggedCard);
            }

            // sort_order をDBに保存
            await saveSortOrder();
        });
    });
}

// モバイル用上下ボタン
function initMobileReorder(photos) {
    els.photosGrid.querySelectorAll('.btn-up').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = parseInt(btn.dataset.index);
            if (idx === 0) return;
            await swapPhotos(photos[idx], photos[idx - 1]);
            loadPhotos();
        });
    });

    els.photosGrid.querySelectorAll('.btn-down').forEach(btn => {
        btn.addEventListener('click', async () => {
            const idx = parseInt(btn.dataset.index);
            if (idx >= photos.length - 1) return;
            await swapPhotos(photos[idx], photos[idx + 1]);
            loadPhotos();
        });
    });
}

async function swapPhotos(a, b) {
    const tmpSort = a.sort_order;
    await supabaseClient.from('photos').update({ sort_order: b.sort_order }).eq('id', a.id);
    await supabaseClient.from('photos').update({ sort_order: tmpSort }).eq('id', b.id);
}

async function saveSortOrder() {
    const cards = els.photosGrid.querySelectorAll('.photo-card');
    const updates = [];

    cards.forEach((card, index) => {
        updates.push({ id: card.dataset.id, sort_order: index });
    });

    for (const { id, sort_order } of updates) {
        await supabaseClient.from('photos').update({ sort_order }).eq('id', id);
    }

    showToast('並び順を更新しました', 'success');
}

// ============================================
// 編集モーダル
// ============================================
function initEditModal() {
    els.editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = els.editId.value;

        const { error } = await supabaseClient.from('photos').update({
            title: els.editTitle.value,
            category: els.editCategory.value,
            description: els.editDescription.value
        }).eq('id', id);

        if (error) {
            showToast('更新に失敗しました', 'error');
        } else {
            showToast('写真情報を更新しました', 'success');
            closeModal('edit');
            loadPhotos();
        }
    });

    // 閉じるボタン
    document.querySelectorAll('[data-close="edit"]').forEach(el => {
        el.addEventListener('click', () => closeModal('edit'));
    });
}

function openEditModal(photo) {
    els.editId.value = photo.id;
    els.editTitle.value = photo.title;
    els.editCategory.value = photo.category;
    els.editDescription.value = photo.description || '';
    els.editImagePreview.innerHTML = `<img src="${photo.public_url}" alt="${escapeHtml(photo.title)}">`;
    els.editModal.style.display = 'flex';
}

// ============================================
// 削除モーダル
// ============================================
function initDeleteModal() {
    els.deleteConfirm.addEventListener('click', async () => {
        const id = els.deleteId.value;
        const storagePath = els.deleteStoragePath.value;

        els.deleteConfirm.disabled = true;

        // Storage から削除
        await supabaseClient.storage.from('photos').remove([storagePath]);

        // DB から削除
        const { error } = await supabaseClient.from('photos').delete().eq('id', id);

        els.deleteConfirm.disabled = false;

        if (error) {
            showToast('削除に失敗しました', 'error');
        } else {
            showToast('写真を削除しました', 'success');
            closeModal('delete');
            loadPhotos();
        }
    });

    document.querySelectorAll('[data-close="delete"]').forEach(el => {
        el.addEventListener('click', () => closeModal('delete'));
    });
}

function openDeleteModal(id, storagePath, publicUrl, title) {
    els.deleteId.value = id;
    els.deleteStoragePath.value = storagePath;
    els.deletePreview.innerHTML = `
        <img src="${publicUrl}" alt="${escapeHtml(title)}">
        <span>${escapeHtml(title)}</span>
    `;
    els.deleteModal.style.display = 'flex';
}

// ============================================
// モーダル共通
// ============================================
function closeModal(type) {
    if (type === 'edit') els.editModal.style.display = 'none';
    if (type === 'delete') els.deleteModal.style.display = 'none';
}

// ============================================
// デフォルト写真移行
// ============================================
function initMigration() {
    els.migrateButton.addEventListener('click', migrateDefaultPhotos);
}

async function migrateDefaultPhotos() {
    const defaults = [
        { file: 'images/gallery-1.png', title: '境界', category: 'Shrine', description: '朝霧に佇む鳥居、現世と神域の狭間' },
        { file: 'images/gallery-2.png', title: '静寂の刻', category: 'Temple', description: '雪に覆われた寺院、時が止まったかのような静けさ' },
        { file: 'images/gallery-3.png', title: '結界', category: 'Sacred', description: '注連縄と紙垂、神聖な空間を守る結界' },
        { file: 'images/gallery-4.png', title: '参道', category: 'Shrine', description: '石灯籠が導く祈りの道' },
        { file: 'images/gallery-5.png', title: '木漏れ日', category: 'Shrine', description: '光が差し込む鳥居、自然と神域の調和' }
    ];

    els.migrateButton.disabled = true;
    els.migrateButton.textContent = '移行中...';

    let migrated = 0;
    for (let i = 0; i < defaults.length; i++) {
        try {
            const response = await fetch(defaults[i].file);
            if (!response.ok) continue;
            const blob = await response.blob();
            const storagePath = `photos/default-${i + 1}.png`;

            const { error: uploadError } = await supabaseClient.storage
                .from('photos')
                .upload(storagePath, blob, { cacheControl: '3600', upsert: true });

            if (uploadError) continue;

            const publicUrl = getPublicUrl(storagePath);

            await supabaseClient.from('photos').insert({
                title: defaults[i].title,
                description: defaults[i].description,
                category: defaults[i].category,
                storage_path: storagePath,
                public_url: publicUrl,
                sort_order: i
            });

            migrated++;
        } catch (err) {
            console.error(`Migration failed for ${defaults[i].file}:`, err);
        }
    }

    els.migrateButton.disabled = false;
    els.migrateButton.textContent = 'デフォルト写真を移行';

    if (migrated > 0) {
        showToast(`${migrated}枚のデフォルト写真を移行しました`, 'success');
        els.migrateBanner.style.display = 'none';
        loadPhotos();
    } else {
        showToast('移行に失敗しました', 'error');
    }
}

// ============================================
// トースト通知
// ============================================
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    els.toastContainer.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('visible'));
    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// ユーティリティ
// ============================================
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function escapeAttr(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;');
}
