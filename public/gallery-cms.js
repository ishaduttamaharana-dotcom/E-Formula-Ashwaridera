/* ============================================================
   gallery-cms.js — Authoritative Gallery CMS Hydration & Interactive Engine
   Ashwa Riders — Formula Student Electric Team
   Hydrates:
     01. HERO (Eyebrow, Heading, Highlight, Description, Background Media, Overlay)
     02. DYNAMIC CATEGORIES & LIVE COUNTS (Configurable CMS Filter Tabs)
     03. MEDIA GRID (Images & Videos, Responsive Cards, Badges, Live Filters)
     04. INTERACTIVE LIGHTBOX (HTML5 Full Video Player + Image Viewer + Keyboard Nav)
     05. RECRUITMENT CTA (Heading, Highlight, Description, Button Link & Icon)
     06. PAGE SETTINGS & SEO
   Strictly authoritative from MongoDB / Public API (no localStorage / sessionStorage cache).
============================================================ */

(function () {
  'use strict';

  const PRIMARY_API = '/api/v1/gallery';
  const FALLBACK_API = '/api/v1/content/gallery';
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get('preview') === 'true' || urlParams.get('draft') === 'true';

  let currentGalleryData = null;
  let activeFilter = 'all';
  let visibleMedia = [];
  let currentLightboxIndex = 0;
  let lightboxInitialized = false;

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
  //  DATA FETCHING (Direct from API, no cache override)
  // ============================================================
  async function fetchGalleryData() {
    const endpoints = [PRIMARY_API, FALLBACK_API];
    let lastError = null;

    for (const ep of endpoints) {
      try {
        const queryParams = new URLSearchParams();
        if (isPreview) queryParams.set('preview', 'true');
        queryParams.set('_t', Date.now().toString());

        const res = await fetch(`${ep}?${queryParams.toString()}`, {
          cache: 'no-store',
          credentials: 'include',
        });

        if (res.ok) {
          const json = await res.json();
          if (json && json.success && json.data) return json.data;
          if (json && json.data) return json.data;
        } else {
          lastError = new Error(`HTTP ${res.status}`);
        }
      } catch (err) {
        lastError = err;
      }
    }

    throw lastError || new Error('Failed to retrieve Gallery CMS data.');
  }

  // ============================================================
  //  CONTROLLED ERROR STATE
  // ============================================================
  function showControlledError(msg) {
    const grid = document.getElementById('galleryGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="gallery-error-state" style="grid-column:1/-1; padding:60px 20px; text-align:center; color:var(--ink-faint, #9696A0); background:rgba(255,255,255,0.02); border:1px dashed var(--hairline, rgba(211,218,217,0.15)); border-radius:4px;">
          <i class="fas fa-triangle-exclamation" style="font-size:2.2rem; color:var(--signal, #F25912); margin-bottom:14px; display:block;"></i>
          <h3 style="font-size:1.15rem; text-transform:uppercase; margin-bottom:6px; color:var(--ink, #222126); font-family:var(--font-display, sans-serif);">Gallery Media Unavailable</h3>
          <p style="font-family:var(--font-mono, monospace); font-size:0.85rem; margin:0 0 16px;">${escapeHtml(msg || 'Unable to connect to CMS. Please verify your connection.')}</p>
          <button class="btn btn-primary" onclick="window.location.reload()" style="padding:10px 22px; font-size:0.75rem; cursor:pointer;">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
    }
  }

  // ============================================================
  //  PREVIEW BANNER
  // ============================================================
  function showPreviewBanner() {
    if (!isPreview) return;
    if (document.getElementById('gallery-preview-banner')) return;

    const banner = document.createElement('div');
    banner.id = 'gallery-preview-banner';
    banner.style.cssText = [
      'position: fixed',
      'top: 0',
      'left: 0',
      'width: 100%',
      'background: linear-gradient(90deg, #F25912, #FF8C00)',
      'color: #000',
      'font-weight: 800',
      'font-size: 0.75rem',
      'text-transform: uppercase',
      'letter-spacing: 0.12em',
      'text-align: center',
      'padding: 8px 16px',
      'z-index: 99999',
      'box-shadow: 0 2px 10px rgba(0,0,0,0.5)',
      'font-family: var(--font-mono, monospace)',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'gap: 10px',
    ].join(';');

    banner.innerHTML = `
      <i class="fas fa-eye"></i>
      <span>CMS Live Preview Mode — Viewing Unpublished Draft Revisions</span>
      <a href="gallery.html" style="color:#000; text-decoration:underline; font-weight:900; margin-left:12px;">Exit Preview</a>
    `;
    document.body.prepend(banner);
  }

  // ============================================================
  //  HYDRATION ENTRY POINT
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

    // 05. Recruitment CTA
    if (cta) hydrateCTA(cta);
  }

  // ============================================================
  //  01. HERO HYDRATION
  // ============================================================
  function hydrateHero(hero) {
    const heroSec = document.querySelector('.gallery-hero');
    if (!heroSec) return;

    if (hero && hero.visible === false && !isPreview) {
      heroSec.style.display = 'none';
      return;
    }
    heroSec.style.display = 'flex';

    if (!hero) return;

    // Eyebrow badge
    const badgeText = heroSec.querySelector('.hero-badge-text') || heroSec.querySelector('.hero-badge');
    const eyebrowStr = hero.eyebrow || hero.label || 'Gallery';
    if (heroSec.querySelector('.hero-badge-text')) {
      heroSec.querySelector('.hero-badge-text').textContent = eyebrowStr;
    } else if (badgeText) {
      badgeText.innerHTML = `<span class="dot"></span> ${escapeHtml(eyebrowStr)}`;
    }

    // Heading Line 1 + Highlight
    const h1 = heroSec.querySelector('h1');
    if (h1) {
      const l1 = hero.headingLine1 || 'Moments in';
      const hl = hero.headingHighlight || 'Motion';
      h1.innerHTML = `${escapeHtml(l1)} <span class="text-gradient">${escapeHtml(hl)}</span>`;
    }

    // Description
    const desc = heroSec.querySelector('.hero-desc') || heroSec.querySelector('p');
    if (desc && hero.description !== undefined) {
      desc.textContent = hero.description;
    }

    // Background Alignment
    if (hero.backgroundPosition) {
      heroSec.style.backgroundPosition = hero.backgroundPosition;
    }

    // Overlay strength
    if (hero.overlayStrength !== undefined) {
      const strength = (hero.overlayStrength / 100).toFixed(2);
      heroSec.style.setProperty('--hero-overlay-color', `rgba(0, 0, 0, ${strength})`);
    } else if (hero.overlay === false) {
      heroSec.style.setProperty('--hero-overlay-color', 'rgba(0, 0, 0, 0)');
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
      if (hero.videoPoster || hero.posterUrl) videoEl.poster = hero.videoPoster || hero.posterUrl;
      videoEl.style.display = 'block';
      heroSec.style.backgroundImage = 'none';
    } else {
      videoEl.style.display = 'none';
      videoEl.pause();
      const bgImg = hero.desktopImageUrl || hero.bgImageUrl || hero.imageUrl || 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg';
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
      const isVid = (item.mediaType || item.type || '').toLowerCase() === 'video' || Boolean(item.videoUrl && item.videoUrl.trim());
      if (isVid) {
        counts.video = (counts.video || 0) + 1;
      } else {
        counts.image = (counts.image || 0) + 1;
      }

      const cat = (item.category || '').toLowerCase().trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    // Default categories if CMS categories empty
    const rawCats = (categories && categories.length > 0)
      ? categories.filter(c => isPreview || (c.visible !== false && c.isVisible !== false))
      : [
          { id: 'all', name: 'All', order: 1 },
          { id: 'image', name: 'Images', order: 2 },
          { id: 'video', name: 'Videos', order: 3 },
          { id: 'competition', name: 'Competition', order: 4 },
          { id: 'workshop', name: 'Workshop', order: 5 },
          { id: 'testing', name: 'Testing', order: 6 },
          { id: 'events', name: 'Events', order: 7 },
          { id: 'formula-bharat', name: 'Formula Bharat', order: 8 },
        ];

    let html = '';
    rawCats.forEach(cat => {
      const catId = (cat.slug || cat.id || cat.name || '').toLowerCase().trim();
      const label = cat.label || cat.name || cat.id || 'Category';
      const count = counts[catId] !== undefined ? counts[catId] : (cat.count !== undefined ? cat.count : 0);
      const isActive = activeFilter === catId;

      html += `
        <button class="filter-btn ${isActive ? 'active' : ''}" data-filter="${escapeHtml(catId)}">
          ${escapeHtml(label)} <span class="count">(${count})</span>
        </button>
      `;
    });

    filterBar.innerHTML = html;

    // Attach click listeners to filter buttons
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
      const isVid = (item.mediaType || item.type || '').toLowerCase() === 'video' || Boolean(item.videoUrl && item.videoUrl.trim());
      if (activeFilter === 'image') return !isVid;
      if (activeFilter === 'video') return isVid;

      const cat = (item.category || '').toLowerCase().trim();
      return cat === activeFilter;
    });

    if (visibleMedia.length === 0) {
      grid.innerHTML = '';
      if (emptyState) {
        emptyState.style.display = 'block';
      } else {
        grid.innerHTML = `
          <div style="grid-column:1/-1; padding:70px 20px; text-align:center; color:var(--ink-faint, #9696A0);">
            <i class="fas fa-camera" style="font-size:3rem; opacity:0.15; margin-bottom:16px; display:block;"></i>
            <h3 style="font-size:1.15rem; text-transform:uppercase; margin-bottom:6px;">No Media Items Found</h3>
            <p style="font-family:var(--font-mono, monospace); font-size:0.85rem; margin:0;">There are currently no media items listed under this category.</p>
          </div>
        `;
      }
      return;
    }

    if (emptyState) emptyState.style.display = 'none';

    let html = '';
    visibleMedia.forEach((item, index) => {
      const isVideo = (item.mediaType || item.type || '').toLowerCase() === 'video' || Boolean(item.videoUrl && item.videoUrl.trim());
      const thumb = item.thumbnailUrl || item.imageUrl || item.mediaUrl || 'https://res.cloudinary.com/frjck4sc/image/upload/v1784484192/car-hero-DAWajS8q_dt2ddg.png';
      const title = item.title || item.caption || 'Ashwa Riders';
      const desc = item.description || item.caption || (isVideo ? 'Video highlight' : 'Race & event gallery');
      const cat = item.category || (isVideo ? 'video' : 'gallery');

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

    const isVideo = (item.mediaType || item.type || '').toLowerCase() === 'video' || Boolean(item.videoUrl && item.videoUrl.trim());
    const mediaUrl = isVideo ? (item.videoUrl || item.mediaUrl || item.imageUrl || '') : (item.imageUrl || item.mediaUrl || '');
    const title = item.title || item.caption || 'Ashwa Riders';
    const desc = item.description || item.caption || (item.category ? `Category: ${item.category}` : '');

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
  //  05. RECRUITMENT CTA HYDRATION
  // ============================================================
  function hydrateCTA(cta) {
    const ctaSec = document.querySelector('.cta-section');
    if (!ctaSec || !cta) return;

    if (cta.visible === false && !isPreview) {
      ctaSec.style.display = 'none';
      return;
    }
    ctaSec.style.display = 'block';

    const headingText = cta.heading || cta.title || 'Be Part of the';
    const highlightText = cta.highlightedHeading || cta.highlightText || 'Story';
    const titleEl = ctaSec.querySelector('h2');
    if (titleEl) {
      titleEl.innerHTML = `${escapeHtml(headingText)} <span class="text-gradient">${escapeHtml(highlightText)}</span>`;
    }

    const descEl = ctaSec.querySelector('p');
    if (descEl && cta.description !== undefined) {
      descEl.textContent = cta.description;
    }

    const btnEl = ctaSec.querySelector('.btn');
    if (btnEl) {
      const btnText = cta.buttonText || 'Join the Team';
      const btnUrl = cta.buttonUrl || cta.buttonLink || 'index.html#recruitment';
      const iconClass = cta.buttonIcon || 'fas fa-user-plus';
      btnEl.innerHTML = `<i class="${escapeHtml(iconClass)}"></i> ${escapeHtml(btnText)}`;
      btnEl.setAttribute('href', btnUrl);
      if (cta.openInNewTab) {
        btnEl.setAttribute('target', '_blank');
        btnEl.setAttribute('rel', 'noopener noreferrer');
      } else {
        btnEl.removeAttribute('target');
        btnEl.removeAttribute('rel');
      }
    }

    if (cta.backgroundColor) {
      ctaSec.style.backgroundColor = cta.backgroundColor;
    }
    if (cta.bgImageUrl) {
      ctaSec.style.backgroundImage = `url("${escapeHtml(cta.bgImageUrl)}")`;
      ctaSec.style.backgroundSize = 'cover';
      ctaSec.style.backgroundPosition = 'center';
    }
  }

  // ============================================================
  //  BOOTSTRAP ENGINE
  // ============================================================
  async function init() {
    showPreviewBanner();

    // 1. SSR Preload check (if server injected)
    if (window.__INITIAL_GALLERY_DATA__) {
      try {
        hydrateGalleryPage(window.__INITIAL_GALLERY_DATA__);
      } catch (err) {
        console.warn('Initial gallery preload notice:', err);
      }
    }

    // 2. Fetch fresh live/preview CMS data asynchronously
    try {
      const liveData = await fetchGalleryData();
      if (liveData) {
        hydrateGalleryPage(liveData);
        console.log(`[Ashwa Gallery CMS] Page hydrated successfully (${liveData.media ? liveData.media.length : 0} items).`);
      }
    } catch (err) {
      console.warn('[Ashwa Gallery CMS] Hydration notice:', err.message);
      showControlledError(err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Public export for debugging, preview, or testing
  window.AshwaGalleryCMS = {
    hydrate: hydrateGalleryPage,
    refresh: init,
  };
})();
