/* ============================================================
   gallery-cms.js — Dynamic Hydration & Interactive Lightbox Engine
   Ashwa Riders — Formula Student Electric Team
   Hydrates:
     01. HERO (Eyebrow, Heading, Highlight, Description, Image/Video BG, Overlay)
     02. DYNAMIC CATEGORIES & COUNTS (Configurable CMS Tabs)
     03. MEDIA GRID (Images & Videos, Responsive Cards, Badges)
     04. INTERACTIVE LIGHTBOX (Full Image + HTML5 Video Player + Keyboard Nav)
     05. PAGE SETTINGS & SEO
   Supports SSR Preload (__INITIAL_GALLERY_DATA__) + Preview Mode.
============================================================ */

(function () {
  'use strict';

  const GALLERY_API = '/api/v1/gallery';
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get('preview') === 'true' || urlParams.get('draft') === 'true';

  let currentGalleryData = null;
  let activeFilter = 'all';
  let visibleMedia = [];
  let currentLightboxIndex = 0;

  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // ============================================================
  //  DATA FETCHING & PRELOAD
  // ============================================================
  async function fetchGalleryData() {
    const base = isPreview ? `${GALLERY_API}?preview=true` : GALLERY_API;
    const sep = base.includes('?') ? '&' : '?';
    const endpoint = `${base}${sep}_t=${Date.now()}`;

    const res = await fetch(endpoint, {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || json;
  }

  // ============================================================
  //  HYDRATION LOGIC
  // ============================================================
  function hydrateGalleryPage(data) {
    if (!data) return;
    currentGalleryData = data;

    const { settings, hero, categories, media, albums, cta } = data;
    const mediaItems = media || data.images || [];

    // 00. Page Settings & SEO
    if (settings) {
      if (settings.pageTitle) document.title = settings.pageTitle;
      if (settings.seoDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', settings.seoDescription);
      }
    }

    // 01. Hero Section
    hydrateHero(hero);

    // 02. Dynamic Categories
    hydrateCategories(categories || [], mediaItems);

    // 03. Media Grid
    hydrateMediaGrid(mediaItems);

    // 04. Lightbox Event Bindings
    setupLightbox();

    // 05. CTA Section (if present)
    if (cta) hydrateCTA(cta);
  }

  // ============================================================
  //  01. HERO HYDRATION
  // ============================================================
  function hydrateHero(hero) {
    const heroSec = document.querySelector('.gallery-hero');
    if (!heroSec) return;

    if (hero && hero.visible === false) {
      heroSec.style.display = 'none';
      return;
    }
    heroSec.style.display = 'flex';

    if (!hero) return;

    // Eyebrow badge
    const badge = heroSec.querySelector('.hero-badge');
    if (badge) {
      badge.innerHTML = `<span class="dot"></span> ${escapeHtml(hero.eyebrow || 'Gallery')}`;
    }

    // Heading Line 1 + Highlight
    const h1 = heroSec.querySelector('h1');
    if (h1) {
      const l1 = escapeHtml(hero.headingLine1 || 'Moments in');
      const hl = escapeHtml(hero.headingHighlight || 'Motion');
      h1.innerHTML = `${l1} <span class="text-gradient">${hl}</span>`;
    }

    // Description
    const desc = heroSec.querySelector('p');
    if (desc && hero.description) {
      desc.textContent = hero.description;
    }

    // Background Alignment & Spacing
    if (hero.backgroundPosition) {
      heroSec.style.backgroundPosition = hero.backgroundPosition;
    }

    // Overlay strength
    if (hero.overlayStrength !== undefined) {
      const strength = (hero.overlayStrength / 100).toFixed(2);
      heroSec.style.setProperty('--hero-overlay-color', `rgba(0, 0, 0, ${strength})`);
    }

    // Background Media (Image or Video)
    let videoEl = heroSec.querySelector('.hero-bg-video');
    if (!videoEl) {
      videoEl = document.createElement('video');
      videoEl.className = 'hero-bg-video';
      videoEl.autoplay = true;
      videoEl.loop = true;
      videoEl.muted = true;
      videoEl.playsInline = true;
      videoEl.style.cssText = 'position:absolute; inset:0; width:100%; height:100%; object-fit:cover; z-index:0; display:none; pointer-events:none;';
      heroSec.insertBefore(videoEl, heroSec.firstChild);
    }

    if (hero.mediaType === 'video' && hero.videoUrl) {
      videoEl.src = hero.videoUrl;
      if (hero.videoPoster) videoEl.poster = hero.videoPoster;
      videoEl.style.display = 'block';
      heroSec.style.backgroundImage = 'none';
    } else {
      videoEl.style.display = 'none';
      videoEl.pause();
      const bgImg = hero.desktopImageUrl || 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg';
      heroSec.style.backgroundImage = `url("${bgImg}")`;
      heroSec.style.backgroundSize = 'cover';
    }
  }

  // ============================================================
  //  02. DYNAMIC CATEGORIES HYDRATION
  // ============================================================
  function hydrateCategories(categories, mediaItems) {
    const filterBar = document.getElementById('filterBar');
    if (!filterBar) return;

    // Calculate dynamic counts
    const counts = { all: mediaItems.length, image: 0, video: 0 };
    mediaItems.forEach(item => {
      const t = (item.mediaType || item.type || 'image').toLowerCase();
      if (t === 'image') counts.image = (counts.image || 0) + 1;
      if (t === 'video') counts.video = (counts.video || 0) + 1;

      const cat = (item.category || '').toLowerCase();
      if (cat) counts[cat] = (counts[cat] || 0) + 1;
    });

    // Default categories if CMS categories empty
    const catsToRender = (categories && categories.length > 0)
      ? categories.filter(c => c.isVisible !== false)
      : [
          { id: 'all', label: 'All', order: 0 },
          { id: 'image', label: 'Images', order: 1 },
          { id: 'video', label: 'Videos', order: 2 },
          { id: 'competition', label: 'Competition', order: 3 },
          { id: 'workshop', label: 'Workshop', order: 4 },
          { id: 'testing', label: 'Testing', order: 5 },
          { id: 'events', label: 'Events', order: 6 },
        ];

    let html = '';
    catsToRender.forEach(cat => {
      const catId = (cat.id || '').toLowerCase();
      const count = counts[catId] !== undefined ? counts[catId] : (cat.count !== undefined ? cat.count : 0);
      const isActive = activeFilter === catId;

      html += `
        <button class="filter-btn ${isActive ? 'active' : ''}" data-filter="${escapeHtml(catId)}">
          ${escapeHtml(cat.label)} <span class="count">(${count})</span>
        </button>
      `;
    });

    filterBar.innerHTML = html;

    // Attach click listeners
    const buttons = filterBar.querySelectorAll('.filter-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', () => {
        buttons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeFilter = btn.dataset.filter;
        hydrateMediaGrid(mediaItems);
      });
    });
  }

  // ============================================================
  //  03. MEDIA GRID HYDRATION
  // ============================================================
  function hydrateMediaGrid(mediaItems) {
    const grid = document.getElementById('galleryGrid');
    const emptyState = document.getElementById('emptyState');
    if (!grid) return;

    // Filter items
    visibleMedia = mediaItems.filter(item => {
      if (activeFilter === 'all') return true;
      const t = (item.mediaType || item.type || 'image').toLowerCase();
      if (activeFilter === 'image') return t === 'image';
      if (activeFilter === 'video') return t === 'video';

      const cat = (item.category || '').toLowerCase();
      return cat === activeFilter;
    });

    if (visibleMedia.length === 0) {
      grid.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'block';
      } else {
        grid.innerHTML = `
          <div style="grid-column:1/-1; padding:70px 20px; text-align:center; color:var(--ink-faint);">
            <i class="fas fa-camera" style="font-size:3rem; opacity:0.15; margin-bottom:16px; display:block;"></i>
            <h3 style="font-size:1.15rem; text-transform:uppercase; margin-bottom:6px;">No Media Items Found</h3>
            <p style="font-family:var(--font-mono); font-size:0.85rem; margin:0;">There are currently no media items listed under this category.</p>
          </div>
        `;
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    let html = '';
    visibleMedia.forEach((item, index) => {
      const isVideo = (item.mediaType || item.type || 'image').toLowerCase() === 'video';
      const thumb = item.thumbnailUrl || item.imageUrl || item.mediaUrl || 'https://res.cloudinary.com/frjck4sc/image/upload/v1784484192/car-hero-DAWajS8q_dt2ddg.png';
      const title = item.title || item.caption || 'Ashwa Riders';
      const desc = item.description || (isVideo ? 'Video highlight' : 'Race & event gallery');
      const cat = item.category || (isVideo ? 'Video' : 'Gallery');

      html += `
        <div class="gallery-item reveal-scale visible" data-index="${index}" data-type="${isVideo ? 'video' : 'image'}" data-category="${escapeHtml(cat)}">
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(title)}" loading="lazy" />
          <span class="badge ${isVideo ? 'video' : 'event'}">${escapeHtml(cat)}</span>
          ${isVideo ? `
            <div class="play-icon" style="opacity:0.9;"><i class="fas fa-play" style="margin-left:3px;"></i></div>
          ` : `
            <div class="overlay"><i class="fas fa-expand"></i></div>
          `}
          <div class="gallery-info">
            <h4>${escapeHtml(title)}</h4>
            <p>${escapeHtml(desc)}</p>
          </div>
        </div>
      `;
    });

    grid.innerHTML = html;

    // Attach click events for lightbox
    const items = grid.querySelectorAll('.gallery-item');
    items.forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index, 10);
        openLightbox(idx);
      });
    });
  }

  // ============================================================
  //  04. INTERACTIVE LIGHTBOX ENGINE
  // ============================================================
  let lightboxInitialized = false;

  function setupLightbox() {
    if (lightboxInitialized) return;
    lightboxInitialized = true;

    const lightbox = document.getElementById('lightbox');
    const closeBtn = document.getElementById('closeLightbox');
    const prevBtn = document.getElementById('prevLightbox');
    const nextBtn = document.getElementById('nextLightbox');

    if (!lightbox) return;

    if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    if (prevBtn) prevBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(-1);
    });

    if (nextBtn) nextBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      navigateLightbox(1);
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  function openLightbox(index) {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox || visibleMedia.length === 0) return;

    currentLightboxIndex = Math.max(0, Math.min(index, visibleMedia.length - 1));
    updateLightboxContent(currentLightboxIndex);

    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function updateLightboxContent(index) {
    const item = visibleMedia[index];
    if (!item) return;

    const mediaContainer = document.getElementById('lightboxMedia');
    const titleEl = document.getElementById('lightboxTitle');
    const descEl = document.getElementById('lightboxDesc');
    const prevBtn = document.getElementById('prevLightbox');
    const nextBtn = document.getElementById('nextLightbox');

    const isVideo = (item.mediaType || item.type || 'image').toLowerCase() === 'video';
    const mediaUrl = item.mediaUrl || item.imageUrl || '';
    const title = item.title || item.caption || 'Ashwa Riders';
    const desc = item.description || (item.category ? `Category: ${item.category}` : '');

    if (mediaContainer) {
      if (isVideo) {
        mediaContainer.innerHTML = `
          <video src="${escapeHtml(mediaUrl)}" controls autoplay playsinline style="max-width:100%; max-height:78vh; object-fit:contain; border-radius:2px; display:block; outline:none; background:#000;"></video>
        `;
      } else {
        mediaContainer.innerHTML = `
          <img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(title)}" style="max-width:100%; max-height:78vh; object-fit:contain; display:block;" />
        `;
      }
    }

    if (titleEl) titleEl.textContent = title;
    if (descEl) descEl.textContent = desc;

    if (prevBtn) prevBtn.style.display = visibleMedia.length > 1 ? 'flex' : 'none';
    if (nextBtn) nextBtn.style.display = visibleMedia.length > 1 ? 'flex' : 'none';
  }

  function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (lightbox) {
      lightbox.classList.remove('open');
      const mediaContainer = document.getElementById('lightboxMedia');
      if (mediaContainer) {
        const vid = mediaContainer.querySelector('video');
        if (vid) vid.pause();
        mediaContainer.innerHTML = '';
      }
    }
    document.body.style.overflow = '';
  }

  function navigateLightbox(direction) {
    const newIdx = currentLightboxIndex + direction;
    if (newIdx < 0 || newIdx >= visibleMedia.length) return;
    currentLightboxIndex = newIdx;
    updateLightboxContent(currentLightboxIndex);
  }

  // ============================================================
  //  05. CTA HYDRATION
  // ============================================================
  function hydrateCTA(cta) {
    const ctaSec = document.querySelector('.cta-section');
    if (!ctaSec || !cta) return;

    if (cta.visible === false) {
      ctaSec.style.display = 'none';
      return;
    }
    ctaSec.style.display = 'block';

    const titleEl = ctaSec.querySelector('h2');
    if (titleEl && (cta.title || cta.highlightText)) {
      titleEl.innerHTML = `${escapeHtml(cta.title || 'Ready to')} <span class="text-gradient">${escapeHtml(cta.highlightText || 'Race With Us?')}</span>`;
    }

    const descEl = ctaSec.querySelector('p');
    if (descEl && cta.description) {
      descEl.textContent = cta.description;
    }

    const btnEl = ctaSec.querySelector('.btn');
    if (btnEl) {
      if (cta.buttonText) btnEl.textContent = cta.buttonText;
      if (cta.buttonLink) btnEl.setAttribute('href', cta.buttonLink);
    }
  }

  // ============================================================
  //  BOOTSTRAP ENGINE
  // ============================================================
  async function init() {
    // 1. SSR Preload check
    if (window.__INITIAL_GALLERY_DATA__) {
      try {
        hydrateGalleryPage(window.__INITIAL_GALLERY_DATA__);
      } catch (err) {
        console.warn('Initial gallery data hydration warning:', err);
      }
    }

    // 2. Fetch fresh live/preview data asynchronously
    try {
      const liveData = await fetchGalleryData();
      if (liveData) {
        hydrateGalleryPage(liveData);
      }
    } catch (err) {
      console.warn('Background gallery data fetch note:', err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public export for debugging or preview
  window.AshwaGalleryCMS = {
    hydrate: hydrateGalleryPage,
    refresh: init,
  };
})();
