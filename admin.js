/**
 * Silence in Frame - 管理画面 JavaScript
 */

// --- DOM要素 ---
const els = {
    form: document.getElementById('upload-form'),
    dropzone: document.getElementById('dropzone'),
    dropzoneContent: document.getElementById('dropzone-content'),
    dropzonePreview: document.getElementById('dropzone-preview'),
    previewImage: document.getElementById('preview-image'),
    previewRemove: document.getElementById('preview-remove'),
    photoInput: document.getElementById('photo-input'),
    titleInput: document.getElementById('photo-title'),
    categorySelect: document.getElementById('photo-category'),
    descriptionInput: document.getElementById('photo-description'),
    submitButton: document.getElementById('submit-button'),
    submitText: document.querySelector('.submit-text'),
    submitLoading: document.querySelector('.submit-loading'),
    photosGrid: document.getElementById('photos-grid'),
    photosLoading: document.getElementById('photos-loading'),
    photoCount: document.getElementById('photo-count'),
    editModal: document.getElementById('edit-modal'),
    editOverlay: document.getElementById('edit-modal-overlay'),
    editForm: document.getElementById('edit-form'),
    editId: document.getElementById('edit-id'),
    editTitle: document.getElementById('edit-title'),
    editCategory: document.getElementById('edit-category'),
    editDescription: document.getElementById('edit-description'),
    editCancel: document.getElementById('edit-cancel'),
    toastContainer: document.getElementById('toast-container')
};

let selectedFile = null;

// --- 初期化 ---
document.addEventListener('DOMContentLoaded', () => {
    loadPhotos();
    initDropzone();
    initForm();
    initEditModal();
});

// --- ドロップゾーン ---
function initDropzone() {
    // ドラッグ＆ドロップ
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
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            setSelectedFile(file);
        }
    });

    // ファイル選択
    els.photoInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    });

    // プレビュー削除
    els.previewRemove.addEventListener('click', () => {
        clearSelectedFile();
    });
}

function setSelectedFile(file) {
    selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e) => {
        els.previewImage.src = e.target.result;
        els.dropzoneContent.style.display = 'none';
        els.dropzonePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
    els.submitButton.disabled = false;
}

function clearSelectedFile() {
    selectedFile = null;
    els.photoInput.value = '';
    els.dropzoneContent.style.display = 'flex';
    els.dropzonePreview.style.display = 'none';
    els.previewImage.src = '';
    els.submitButton.disabled = true;
}

// --- フォーム送信 ---
function initForm() {
    els.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!selectedFile) return;

        setLoading(true);

        const formData = new FormData();
        formData.append('photo', selectedFile);
        formData.append('title', els.titleInput.value || '無題');
        formData.append('category', els.categorySelect.value);
        formData.append('description', els.descriptionInput.value);

        try {
            const res = await fetch('/api/photos', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'アップロードに失敗しました。');
            }

            showToast('写真をアップロードしました', 'success');
            clearSelectedFile();
            els.form.reset();
            loadPhotos();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoading(false);
        }
    });
}

function setLoading(loading) {
    els.submitButton.disabled = loading;
    els.submitText.style.display = loading ? 'none' : 'inline';
    els.submitLoading.style.display = loading ? 'inline-flex' : 'none';
}

// --- 写真一覧 ---
async function loadPhotos() {
    try {
        const res = await fetch('/api/photos');
        const photos = await res.json();
        renderPhotos(photos);
        els.photoCount.textContent = `${photos.length}枚`;
    } catch (err) {
        els.photosGrid.innerHTML = '<p class="error-message">写真の読み込みに失敗しました。</p>';
    }
}

function renderPhotos(photos) {
    if (photos.length === 0) {
        els.photosGrid.innerHTML = '<p class="empty-message">写真がありません。上のフォームからアップロードしてください。</p>';
        return;
    }

    els.photosGrid.innerHTML = photos.map(photo => `
        <div class="photo-card" data-id="${photo.id}">
            <div class="photo-card-image">
                <img src="${photo.src}" alt="${photo.title}" loading="lazy">
                ${photo.isDefault ? '<span class="badge-default">デフォルト</span>' : ''}
            </div>
            <div class="photo-card-info">
                <h3 class="photo-card-title">${escapeHtml(photo.title)}</h3>
                <span class="photo-card-category">${escapeHtml(photo.category)}</span>
                <p class="photo-card-description">${escapeHtml(photo.description)}</p>
            </div>
            <div class="photo-card-actions">
                <button class="btn-edit" onclick="openEditModal(${photo.id}, '${escapeAttr(photo.title)}', '${escapeAttr(photo.category)}', '${escapeAttr(photo.description)}')">編集</button>
                <button class="btn-delete" onclick="deletePhoto(${photo.id})">削除</button>
            </div>
        </div>
    `).join('');
}

// --- 編集モーダル ---
function initEditModal() {
    els.editCancel.addEventListener('click', closeEditModal);
    els.editOverlay.addEventListener('click', closeEditModal);

    els.editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = els.editId.value;

        try {
            const res = await fetch(`/api/photos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: els.editTitle.value,
                    category: els.editCategory.value,
                    description: els.editDescription.value
                })
            });

            if (!res.ok) throw new Error('更新に失敗しました。');

            showToast('写真情報を更新しました', 'success');
            closeEditModal();
            loadPhotos();
        } catch (err) {
            showToast(err.message, 'error');
        }
    });
}

function openEditModal(id, title, category, description) {
    els.editId.value = id;
    els.editTitle.value = title;
    els.editCategory.value = category;
    els.editDescription.value = description;
    els.editModal.classList.add('active');
}

function closeEditModal() {
    els.editModal.classList.remove('active');
}

// --- 削除 ---
async function deletePhoto(id) {
    if (!confirm('この写真を削除しますか？')) return;

    try {
        const res = await fetch(`/api/photos/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('削除に失敗しました。');

        showToast('写真を削除しました', 'success');
        loadPhotos();
    } catch (err) {
        showToast(err.message, 'error');
    }
}

// --- トースト通知 ---
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

// --- ユーティリティ ---
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
}

function escapeAttr(str) {
    return (str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
