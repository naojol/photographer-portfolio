/**
 * Silence in Frame - 写真家ポートフォリオ
 * JavaScript
 */

// ============================================
// 設定
// ============================================
const CONFIG = {
    instagram: {
        accessToken: '',
        userId: '',
        postCount: 8
    },

    // ギャラリー設定（Supabase 未接続時のフォールバック用）
    gallery: [
        { id: 1, src: 'images/gallery-1.png', title: '境界', category: 'Shrine', description: '朝霧に佇む鳥居、現世と神域の狭間' },
        { id: 2, src: 'images/gallery-2.png', title: '静寂の刻', category: 'Temple', description: '雪に覆われた寺院、時が止まったかのような静けさ' },
        { id: 3, src: 'images/gallery-3.png', title: '結界', category: 'Sacred', description: '注連縄と紙垂、神聖な空間を守る結界' },
        { id: 4, src: 'images/gallery-4.png', title: '参道', category: 'Shrine', description: '石灯籠が導く祈りの道' },
        { id: 5, src: 'images/gallery-5.png', title: '木漏れ日', category: 'Shrine', description: '光が差し込む鳥居、自然と神域の調和' }
    ]
};

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

let state = { currentGalleryIndex: 0, isModalOpen: false };

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initGallery();
    initModal();
    initInstagram();
    initScrollAnimations();
    initPlaceholderImages();
});

function initNavigation() {
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        if (scrollY > 100) { elements.navigation.classList.add('scrolled'); }
        else { elements.navigation.classList.remove('scrolled'); }
        lastScrollY = scrollY;
    });

    elements.navToggle.addEventListener('click', () => {
        elements.navToggle.classList.toggle('active');
        elements.navMenu.classList.toggle('active');
        document.body.style.overflow = elements.navMenu.classList.contains('active') ? 'hidden' : '';
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            elements.navToggle.classList.remove('active');
            elements.navMenu.classList.remove('active');
            document.body.style.overflow = '';
            if (target) {
                window.scrollTo({ top: target.offsetTop - 80, behavior: 'smooth' });
            }
        });
    });
}

async function initGallery() {
    try {
        if (typeof isSupabaseConfigured === 'function' && isSupabaseConfigured()) {
            const { data, error } = await supabaseClient
                .from('photos')
                .select('*')
                .order('sort_order', { ascending: true });

            if (!error && data && data.length > 0) {
                CONFIG.gallery = data.map(photo => ({
                    id: photo.id,
                    src: photo.public_url,
                    title: photo.title,
                    category: photo.category,
                    description: photo.description
                }));
            }
        }
    } catch (e) {
        // Supabase 未接続時はフォールバックを使用
    }
    renderGallery();
}

function renderGallery() {
    elements.galleryGrid.innerHTML = CONFIG.gallery.map((item, index) => `
        <div class="gallery-item ${item.wide ? 'wide' : ''} ${item.tall ? 'tall' : ''} fade-in" data-index="${index}">
            <img src="${item.src}" alt="${item.title}" loading="lazy">
            <div class="gallery-item-info">
                <h3 class="gallery-item-title">${item.title}</h3>
                <span class="gallery-item-category">${item.category}</span>
            </div>
        </div>
    `).join('');

    document.querySelectorAll('.gallery-item').forEach(item => {
        item.addEventListener('click', () => openModal(parseInt(item.dataset.index)));
    });
}

function initModal() {
    elements.modalClose.addEventListener('click', closeModal);
    elements.modalPrev.addEventListener('click', () => navigateModal(-1));
    elements.modalNext.addEventListener('click', () => navigateModal(1));
    elements.modal.addEventListener('click', (e) => { if (e.target === elements.modal) closeModal(); });
    document.addEventListener('keydown', (e) => {
        if (!state.isModalOpen) return;
        if (e.key === 'Escape') closeModal();
        else if (e.key === 'ArrowLeft') navigateModal(-1);
        else if (e.key === 'ArrowRight') navigateModal(1);
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
    elements.modalPrev.style.display = state.currentGalleryIndex === 0 ? 'none' : 'block';
    elements.modalNext.style.display = state.currentGalleryIndex === CONFIG.gallery.length - 1 ? 'none' : 'block';
}

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
        if (!response.ok) throw new Error('Instagram API error');
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
        return `<a href="${post.permalink}" target="_blank" rel="noopener noreferrer" class="instagram-item fade-in">
            <img src="${imageUrl}" alt="${post.caption || 'Instagram投稿'}" loading="lazy">
            <div class="instagram-item-overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1"/></svg></div>
        </a>`;
    }).join('');
    observeElements(document.querySelectorAll('.instagram-item'));
}

function showInstagramSetupMessage() {
    elements.instagramLoading.style.display = 'none';
    elements.instagramGrid.innerHTML = `<div class="instagram-setup"><p>Instagram連携を有効にするには、<code>script.js</code>のCONFIG設定を更新してください。</p></div>`;
    showInstagramPlaceholders();
}

function showInstagramPlaceholders() {
    const placeholders = Array(CONFIG.instagram.postCount).fill(null).map((_, i) => `
        <div class="instagram-item fade-in">
            <img src="images/instagram-${i + 1}.jpg" alt="Instagram投稿 ${i + 1}" loading="lazy">
            <div class="instagram-item-overlay"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r="1"/></svg></div>
        </div>
    `).join('');
    elements.instagramGrid.innerHTML = placeholders;
    observeElements(document.querySelectorAll('.instagram-item'));
}

function showInstagramError() {
    elements.instagramLoading.innerHTML = `<p>Instagram投稿の読み込みに失敗しました。</p><p style="font-size:0.875rem;margin-top:0.5rem">後ほど再度お試しください。</p>`;
}

function initScrollAnimations() {
    observeElements(document.querySelectorAll('.fade-in'));
    document.querySelectorAll('.section-header, .about-content, .ink-frame, .contact-content').forEach(el => el.classList.add('fade-in'));
    observeElements(document.querySelectorAll('.fade-in'));
}

function observeElements(els) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    els.forEach(el => observer.observe(el));
}

function initPlaceholderImages() {
    createPlaceholderImage(elements.aboutImage, 600, 800, 'Photographer');
    document.querySelectorAll('.gallery-item img').forEach((img, i) => {
        const item = CONFIG.gallery[i];
        createPlaceholderImage(img, item && item.wide ? 800 : 400, item && item.tall ? 800 : 400, item ? item.title : '');
    });
    document.querySelectorAll('.instagram-item img').forEach((img, i) => createPlaceholderImage(img, 400, 400, `IG ${i + 1}`));
}

function createPlaceholderImage(imgElement, width, height, text) {
    if (imgElement.complete && imgElement.naturalWidth > 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e8e8e8'); gradient.addColorStop(0.5, '#d0d0d0'); gradient.addColorStop(1, '#c0c0c0');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        const x = Math.random() * width, y = Math.random() * height, radius = Math.random() * 100 + 50;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        grad.addColorStop(0, 'rgba(0,0,0,0.3)'); grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad; ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 0.3; ctx.fillStyle = '#333';
    ctx.font = `${Math.min(width, height) / 10}px "Cormorant Garamond", serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, width / 2, height / 2);
    imgElement.src = canvas.toDataURL();
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
