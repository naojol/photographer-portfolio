/**
 * Silence in Frame - 写真家ポートフォリオ
 * JavaScript
 */

// ============================================
// 設定
// ============================================
const CONFIG = {
    // Instagram API設定
    // Meta Developer Consoleでアプリを作成し、トークンを取得してください
    // https://developers.facebook.com/docs/instagram-basic-display-api/
    instagram: {
        accessToken: '', // ここにInstagram Access Tokenを設定
        userId: '',      // ここにInstagram User IDを設定
        postCount: 8     // 表示する投稿数
    },
    
    // ギャラリー設定
    gallery: [
        {
            id: 1,
            src: 'images/gallery-1.jpg',
            title: '静寂の森',
            category: 'Nature',
            description: '朝霧に包まれた森の静けさ'
        },
        {
            id: 2,
            src: 'images/gallery-2.jpg',
            title: '影の詩',
            category: 'Abstract',
            description: '光と影が織りなす抽象的な美'
        },
        {
            id: 3,
            src: 'images/gallery-3.jpg',
            title: '孤独な旅人',
            category: 'Portrait',
            description: '一人佇む人物の後ろ姿'
        },
        {
            id: 4,
            src: 'images/gallery-4.jpg',
            title: '水面の記憶',
            category: 'Nature',
            description: '穏やかな湖面に映る風景',
            wide: true
        },
        {
            id: 5,
            src: 'images/gallery-5.jpg',
            title: '都市の呼吸',
            category: 'Urban',
            description: '夜明け前の街並み'
        },
        {
            id: 6,
            src: 'images/gallery-6.jpg',
            title: '時の流れ',
            category: 'Architecture',
            description: '歴史を刻んだ建築物'
        }
    ]
};

// ============================================
// DOM要素
// ============================================
const elements = {
    navigation: document.getElementById('navigation'),
    navToggle: document.getElementById('nav-toggle'),
    navMenu: document.getElementById('nav-menu'),
    galleryGrid: document.getElementById('gallery-grid'),
    modal: document.getElementById('gallery-modal'),
    modalImage: document.getElementById('modal-image'),
    modalTitle: document.getElementById('modal-title'),
    modalDescription: document.getElementById('modal-description'),
    modalClose: document.getElementById('modal-close'),
    modalPrev: document.getElementById('modal-prev'),
    modalNext: document.getElementById('modal-next'),
    instagramGrid: document.getElementById('instagram-grid'),
    instagramLoading: document.getElementById('instagram-loading'),
    instagramLink: document.getElementById('instagram-link'),
    aboutImage: document.getElementById('about-image')
};

// ============================================
// 状態管理
// ============================================
let state = {
    currentGalleryIndex: 0,
    isModalOpen: false
};

// ============================================
// 初期化
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initGallery();
    initModal();
    initInstagram();
    initScrollAnimations();
    initPlaceholderImages();
});

// ============================================
// ナビゲーション
// ============================================
function initNavigation() {
    // スクロール時のナビゲーション変更
    let lastScrollY = 0;
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        if (scrollY > 100) {
            elements.navigation.classList.add('scrolled');
        } else {
            elements.navigation.classList.remove('scrolled');
        }
        
        lastScrollY = scrollY;
    });
    
    // モバイルメニュートグル
    elements.navToggle.addEventListener('click', () => {
        elements.navToggle.classList.toggle('active');
        elements.navMenu.classList.toggle('active');
        document.body.style.overflow = elements.navMenu.classList.contains('active') ? 'hidden' : '';
    });
    
    // ナビゲーションリンククリック
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            
            // モバイルメニューを閉じる
            elements.navToggle.classList.remove('active');
            elements.navMenu.classList.remove('active');
            document.body.style.overflow = '';
            
            // スムーズスクロール
            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// ============================================
// ギャラリー
// ============================================
function initGallery() {
    renderGallery();
}

function renderGallery() {
    elements.galleryGrid.innerHTML = CONFIG.gallery.map((item, index) => `
        <div class="gallery-item ${item.wide ? 'wide' : ''} ${item.tall ? 'tall' : ''} fade-in" 
             data-index="${index}">
            <img src="${item.src}" alt="${item.title}" loading="lazy">
            <div class="gallery-item-info">
                <h3 class="gallery-item-title">${item.title}</h3>
                <span class="gallery-item-category">${item.category}</span>
            </div>
        </div>
    `).join('');
    
    // ギャラリーアイテムにクリックイベントを追加
    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => {
            const index = parseInt(item.dataset.index);
            openModal(index);
        });
    });
}

// ============================================
// モーダル
// ============================================
function initModal() {
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalPrev.addEventListener('click', () => navigateModal(-1));
    elements.modalNext.addEventListener('click', () => navigateModal(1));
    
    // モーダル背景クリックで閉じる
    elements.modal.addEventListener('click', (e) => {
        if (e.target === elements.modal) {
            closeModal();
        }
    });
    
    // キーボード操作
    document.addEventListener('keydown', (e) => {
        if (!state.isModalOpen) return;
        
        switch (e.key) {
            case 'Escape':
                closeModal();
                break;
            case 'ArrowLeft':
                navigateModal(-1);
                break;
            case 'ArrowRight':
                navigateModal(1);
                break;
        }
    });
}

function openModal(index) {
    state.currentGalleryIndex = index;
    state.isModalOpen = true;
    updateModalContent();
    elements.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    state.isModalOpen = false;
    elements.modal.classList.remove('active');
    document.body.style.overflow = '';
}

function navigateModal(direction) {
    const newIndex = state.currentGalleryIndex + direction;
    
    if (newIndex >= 0 && newIndex < CONFIG.gallery.length) {
        state.currentGalleryIndex = newIndex;
        updateModalContent();
    }
}

function updateModalContent() {
    const item = CONFIG.gallery[state.currentGalleryIndex];
    elements.modalImage.src = item.src;
    elements.modalImage.alt = item.title;
    elements.modalTitle.textContent = item.title;
    elements.modalDescription.textContent = item.description;
    
    // ナビゲーションボタンの表示/非表示
    elements.modalPrev.style.display = state.currentGalleryIndex === 0 ? 'none' : 'block';
    elements.modalNext.style.display = state.currentGalleryIndex === CONFIG.gallery.length - 1 ? 'none' : 'block';
}

// ============================================
// Instagram連携
// ============================================
function initInstagram() {
    if (CONFIG.instagram.accessToken && CONFIG.instagram.userId) {
        fetchInstagramPosts();
    } else {
        showInstagramSetupMessage();
    }
}

async function fetchInstagramPosts() {
    try {
        const response = await fetch(
            `https://graph.instagram.com/${CONFIG.instagram.userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink&limit=${CONFIG.instagram.postCount}&access_token=${CONFIG.instagram.accessToken}`
        );
        
        if (!response.ok) {
            throw new Error('Instagram API エラー');
        }
        
        const data = await response.json();
        renderInstagramPosts(data.data);
    } catch (error) {
        console.error('Instagram投稿の取得に失敗:', error);
        showInstagramError();
    }
}

function renderInstagramPosts(posts) {
    elements.instagramLoading.style.display = 'none';
    
    elements.instagramGrid.innerHTML = posts.map(post => {
        const imageUrl = post.media_type === 'VIDEO' ? post.thumbnail_url : post.media_url;
        return `
            <a href="${post.permalink}" target="_blank" rel="noopener noreferrer" class="instagram-item fade-in">
                <img src="${imageUrl}" alt="${post.caption || 'Instagram投稿'}" loading="lazy">
                <div class="instagram-item-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="2" y="2" width="20" height="20" rx="5"/>
                        <circle cx="12" cy="12" r="4"/>
                        <circle cx="18" cy="6" r="1"/>
                    </svg>
                </div>
            </a>
        `;
    }).join('');
    
    // アニメーションを適用
    observeElements(document.querySelectorAll('.instagram-item'));
}

function showInstagramSetupMessage() {
    elements.instagramLoading.style.display = 'none';
    
    elements.instagramGrid.innerHTML = `
        <div class="instagram-setup">
            <p>Instagram連携を有効にするには、<code>script.js</code>のCONFIG設定を更新してください。</p>
            <p>詳細は<a href="https://developers.facebook.com/docs/instagram-basic-display-api/" target="_blank" rel="noopener">Meta Developer Docs</a>をご確認ください。</p>
        </div>
    `;
    
    // プレースホルダー画像を表示（デモ用）
    showInstagramPlaceholders();
}

function showInstagramPlaceholders() {
    // デモ用のプレースホルダー画像を表示
    const placeholders = Array(CONFIG.instagram.postCount).fill(null).map((_, i) => `
        <div class="instagram-item fade-in">
            <img src="images/instagram-${i + 1}.jpg" alt="Instagram投稿 ${i + 1}" loading="lazy">
            <div class="instagram-item-overlay">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="2" width="20" height="20" rx="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="18" cy="6" r="1"/>
                </svg>
            </div>
        </div>
    `).join('');
    
    elements.instagramGrid.innerHTML = placeholders;
    
    // アニメーションを適用
    observeElements(document.querySelectorAll('.instagram-item'));
}

function showInstagramError() {
    elements.instagramLoading.innerHTML = `
        <p>Instagram投稿の読み込みに失敗しました。</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">後ほど再度お試しください。</p>
    `;
}

// ============================================
// スクロールアニメーション
// ============================================
function initScrollAnimations() {
    const fadeElements = document.querySelectorAll('.fade-in');
    observeElements(fadeElements);
    
    // セクションにfade-inクラスを追加
    document.querySelectorAll('.section-header, .about-content, .ink-frame, .contact-content').forEach(el => {
        el.classList.add('fade-in');
    });
    
    observeElements(document.querySelectorAll('.fade-in'));
}

function observeElements(elements) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    elements.forEach(el => observer.observe(el));
}

// ============================================
// プレースホルダー画像生成
// ============================================
function initPlaceholderImages() {
    // About画像のプレースホルダー
    createPlaceholderImage(elements.aboutImage, 600, 800, 'Photographer');
    
    // ギャラリー画像のプレースホルダー
    document.querySelectorAll('.gallery-item img').forEach((img, i) => {
        const item = CONFIG.gallery[i];
        const width = item.wide ? 800 : 400;
        const height = item.tall ? 800 : 400;
        createPlaceholderImage(img, width, height, item.title);
    });
    
    // Instagram画像のプレースホルダー
    document.querySelectorAll('.instagram-item img').forEach((img, i) => {
        createPlaceholderImage(img, 400, 400, `IG ${i + 1}`);
    });
}

function createPlaceholderImage(imgElement, width, height, text) {
    // 画像が既に読み込まれている場合はスキップ
    if (imgElement.complete && imgElement.naturalWidth > 0) {
        return;
    }
    
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    
    // グラデーション背景
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e8e8e8');
    gradient.addColorStop(0.5, '#d0d0d0');
    gradient.addColorStop(1, '#c0c0c0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // 水墨画風のパターン
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 100 + 50;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, 'rgba(0,0,0,0.3)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // テキスト
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#333';
    ctx.font = `${Math.min(width, height) / 10}px "Cormorant Garamond", serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
    
    imgElement.src = canvas.toDataURL();
}

// ============================================
// ユーティリティ
// ============================================
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
