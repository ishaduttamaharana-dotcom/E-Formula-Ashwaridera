/* ============================================================
   home-cms.js — Home Page Dynamic Hydration & Inline CMS Engine
   Injected into public/index.html.

   Responsibilities:
     • Dynamically hydrates Hero, Garage Cards, News Cards,
       Stats Counter, and Sponsors Preview from MongoDB Atlas.
     • Role-Aware Behavior:
         - Visitors & Normal Users: Read-only live site.
         - Admin (role === "admin"): Renders inline Edit, Delete,
           Add Card, Video/Image Upload, Save, and Cancel controls.
     • Real-Time DOM updates without page refreshes.
============================================================ */

(function () {
  'use strict';

  const HOME_API   = '/api/v1/home';
  const CMS_UPLOAD = '/api/v1/cms/upload';
  const STORAGE_KEY = 'ar_user';

  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const isAdmin = () => {
    const user = getStoredUser();
    return user && user.role === 'admin';
  };

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    return res.json();
  };

  // Helper from ARCms or fallback toast
  const notify = (msg, type = 'success') => {
    if (window.ARCms && window.ARCms.showSuccessNotification) {
      if (type === 'success') window.ARCms.showSuccessNotification(msg);
      else window.ARCms.showErrorNotification(msg);
    } else {
      console.log(`[CMS ${type}]: ${msg}`);
    }
  };

  // ============================================================
  //  1. HERO SECTION HYDRATION & INLINE EDITING
  // ============================================================
  let heroSlidesList = [];
  let currentSlideIndex = 0;
  let heroCarouselTimer = null;
  let heroTransitionType = 'fade';
  let heroTransitionInterval = 7000;
  let heroTransitionTimeout = null;

  const hydrateHero = async () => {
    try {
      const res = await apiFetch(`${HOME_API}/hero`);
      if (res.success) {
        if (res.meta && res.meta.slides && res.meta.slides.length > 0) {
          heroSlidesList = res.meta.slides;
        } else if (res.data) {
          heroSlidesList = [res.data];
        }
        if (res.meta && res.meta.transition) {
          if (res.meta.transition.type) heroTransitionType = res.meta.transition.type;
          if (res.meta.transition.interval) heroTransitionInterval = res.meta.transition.interval;
        }
        if (heroSlidesList.length > 0) {
          renderHeroSlide(heroSlidesList[0]);
          if (heroSlidesList.length > 1) {
            initHeroCarousel();
          }
        }
      }
    } catch (err) {
      console.warn('Hero hydration notice:', err.message);
    }
  };

  const renderHeroSlide = (heroData) => {
    const heroSection = document.querySelector('.hero#home');
    if (!heroSection) return;

    // Overlay Opacity
    const overlay = heroSection.querySelector('.hero-video-overlay');
    if (overlay && heroData.overlayOpacity !== undefined) {
      const op = heroData.overlayOpacity / 100;
      overlay.style.background = `linear-gradient(100deg, rgba(35, 34, 40, ${op}) 26%, rgba(35, 34, 40, ${Math.max(0.2, op - 0.2)}) 100%)`;
    }

    // Media Type & Background (Responsive Image vs Video)
    const videoElement = heroSection.querySelector('.hero-video');
    const videoSource = heroSection.querySelector('.hero-video source');

    const isMobile = window.innerWidth <= 768;
    const targetImage = (isMobile && heroData.mobileImageUrl) ? heroData.mobileImageUrl : heroData.imageUrl;

    if (heroData.mediaType === 'image' && targetImage) {
      if (videoElement) videoElement.style.display = 'none';
      heroSection.style.backgroundImage = `url('${targetImage}')`;
      heroSection.style.backgroundSize = 'cover';
      heroSection.style.backgroundPosition = 'center';
    } else if (videoSource && heroData.videoUrl) {
      heroSection.style.backgroundImage = 'none';
      if (videoElement) videoElement.style.display = 'block';
      if (videoSource.src !== heroData.videoUrl) {
        videoSource.src = heroData.videoUrl;
        if (videoElement) {
          videoElement.load();
          videoElement.play().catch(() => {});
        }
      }
    }

    // Badge
    const badgeEl = heroSection.querySelector('.hero-badge');
    if (badgeEl && heroData.badgeText) {
      badgeEl.innerHTML = `<span class="dot"></span> ${heroData.badgeText}`;
    }

    // Kinetic Headline (Split words cleanly to prevent duplication)
    const headline = heroSection.querySelector('#kineticHeadline');
    if (headline && heroData.heading) {
      const words = heroData.heading.trim().split(/\s+/);
      const wordsHtml = words.map((w) => `<span class="word">${w}</span>`).join(' ');
      headline.innerHTML = `<span class="line">${wordsHtml}</span>`;
      headline.classList.add('kinetic-in');
    }

    // Subtitle / Tagline
    const tagline = heroSection.querySelector('#heroTagline');
    if (tagline && heroData.subtitle) {
      tagline.innerHTML = `<span>${heroData.subtitle}</span>`;
      tagline.classList.add('in');
    }

    // Buttons
    const actions = heroSection.querySelector('#heroActions');
    if (actions) {
      const pText = heroData.primaryBtnText || 'Explore Our Car';
      const pLink = heroData.primaryBtnLink || 'car.html';
      const sText = heroData.secondaryBtnText || 'Become a Sponsor';
      const sLink = heroData.secondaryBtnLink || 'sponsors.html';

      actions.innerHTML = `
        <a href="${pLink}" class="btn btn-primary"><i class="fas fa-car"></i> ${pText}</a>
        <a href="${sLink}" class="btn btn-secondary"><i class="fas fa-handshake"></i> ${sText}</a>
      `;
      actions.classList.add('in');
    }
  };

  const applyHeroTransition = (heroSection, type, callback) => {
    const content = heroSection.querySelector('.hero-content');
    const duration = 350;

    if (heroTransitionTimeout) {
      clearTimeout(heroTransitionTimeout);
      heroTransitionTimeout = null;
    }

    if (!content || type === 'none') {
      if (content) {
        content.style.opacity = '1';
        content.style.transform = 'none';
      }
      callback();
      return;
    }

    content.style.transition = `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;

    if (type === 'fade' || type === 'crossfade') {
      content.style.opacity = '0';
      heroTransitionTimeout = setTimeout(() => {
        callback();
        content.style.opacity = '1';
        heroTransitionTimeout = null;
      }, duration);
    } else if (type === 'slide') {
      content.style.opacity = '0';
      content.style.transform = 'translateX(-30px)';
      heroTransitionTimeout = setTimeout(() => {
        callback();
        content.style.transition = 'none';
        content.style.transform = 'translateX(30px)';
        content.style.opacity = '0';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            content.style.transition = `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
            content.style.opacity = '1';
            content.style.transform = 'translateX(0)';
            heroTransitionTimeout = null;
          });
        });
      }, duration);
    } else if (type === 'zoom') {
      content.style.opacity = '0';
      content.style.transform = 'scale(0.95)';
      heroTransitionTimeout = setTimeout(() => {
        callback();
        content.style.transition = 'none';
        content.style.transform = 'scale(1.05)';
        content.style.opacity = '0';
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            content.style.transition = `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
            content.style.opacity = '1';
            content.style.transform = 'scale(1)';
            heroTransitionTimeout = null;
          });
        });
      }, duration);
    } else {
      callback();
    }
  };

  const initHeroCarousel = () => {
    const heroSection = document.querySelector('.hero#home');
    if (!heroSection || heroSlidesList.length <= 1) return;

    let controlsWrap = heroSection.querySelector('.ar-hero-carousel-controls');
    if (!controlsWrap) {
      controlsWrap = document.createElement('div');
      controlsWrap.className = 'ar-hero-carousel-controls';
      controlsWrap.style.cssText = 'position:absolute; bottom:24px; right:32px; z-index:10; display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.6); padding:6px 14px; border-radius:20px; backdrop-filter:blur(10px); border:1px solid rgba(255,255,255,0.1);';
      
      const dotsHtml = heroSlidesList.map((_, idx) => `<span class="ar-hero-dot ${idx === 0 ? 'active' : ''}" data-idx="${idx}" style="width:8px; height:8px; border-radius:50%; background:${idx === 0 ? 'var(--signal-bright)' : 'rgba(255,255,255,0.3)'}; cursor:pointer; display:inline-block; transition:all 0.2s;"></span>`).join('');
      
      controlsWrap.innerHTML = `
        <button type="button" id="heroPrevSlide" style="background:none; border:none; color:#fff; cursor:pointer; font-size:14px; min-width:44px; min-height:44px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-chevron-left"></i></button>
        <div style="display:flex; gap:8px; align-items:center;">${dotsHtml}</div>
        <button type="button" id="heroNextSlide" style="background:none; border:none; color:#fff; cursor:pointer; font-size:14px; min-width:44px; min-height:44px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-chevron-right"></i></button>
      `;

      heroSection.appendChild(controlsWrap);

      controlsWrap.querySelector('#heroPrevSlide').addEventListener('click', () => {
        currentSlideIndex = (currentSlideIndex - 1 + heroSlidesList.length) % heroSlidesList.length;
        updateSlide();
      });

      controlsWrap.querySelector('#heroNextSlide').addEventListener('click', () => {
        currentSlideIndex = (currentSlideIndex + 1) % heroSlidesList.length;
        updateSlide();
      });

      controlsWrap.querySelectorAll('.ar-hero-dot').forEach((dot) => {
        dot.addEventListener('click', (e) => {
          currentSlideIndex = parseInt(e.target.getAttribute('data-idx'), 10);
          updateSlide();
        });
      });

      // Mobile Touch & Swipe Support
      let touchStartX = 0;
      let touchEndX = 0;

      heroSection.addEventListener('touchstart', (e) => {
        if (e.changedTouches && e.changedTouches.length > 0) {
          touchStartX = e.changedTouches[0].screenX;
        }
      }, { passive: true });

      heroSection.addEventListener('touchend', (e) => {
        if (e.changedTouches && e.changedTouches.length > 0) {
          touchEndX = e.changedTouches[0].screenX;
          const diff = touchEndX - touchStartX;
          if (Math.abs(diff) > 40) {
            if (diff < 0) {
              currentSlideIndex = (currentSlideIndex + 1) % heroSlidesList.length;
            } else {
              currentSlideIndex = (currentSlideIndex - 1 + heroSlidesList.length) % heroSlidesList.length;
            }
            updateSlide();
          }
        }
      }, { passive: true });
    }

    const updateSlide = () => {
      applyHeroTransition(heroSection, heroTransitionType, () => {
        renderHeroSlide(heroSlidesList[currentSlideIndex]);
      });
      const dots = controlsWrap.querySelectorAll('.ar-hero-dot');
      dots.forEach((d, idx) => {
        d.style.background = idx === currentSlideIndex ? 'var(--signal-bright)' : 'rgba(255,255,255,0.3)';
        d.style.width = idx === currentSlideIndex ? '20px' : '8px';
        d.style.borderRadius = idx === currentSlideIndex ? '10px' : '50%';
      });
    };

    // Auto rotate unless prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!prefersReducedMotion) {
      const intervalMs = Math.max(2000, Number(heroTransitionInterval) || 7000);
      clearInterval(heroCarouselTimer);
      heroCarouselTimer = setInterval(() => {
        currentSlideIndex = (currentSlideIndex + 1) % heroSlidesList.length;
        updateSlide();
      }, intervalMs);

      heroSection.addEventListener('mouseenter', () => clearInterval(heroCarouselTimer));
      heroSection.addEventListener('mouseleave', () => {
        clearInterval(heroCarouselTimer);
        heroCarouselTimer = setInterval(() => {
          currentSlideIndex = (currentSlideIndex + 1) % heroSlidesList.length;
          updateSlide();
        }, intervalMs);
      });
    }
  };

  const openHeroEditModal = (heroData) => {
    if (window.ARCms && window.ARCms.showAddContentModal) {
      const modalHtml = `
        <div class="ar-cms-modal-overlay ar-open" id="arHeroModal">
          <div class="ar-cms-modal">
            <div class="ar-cms-modal-header">
              <h3>Edit Hero Section</h3>
              <button class="ar-cms-modal-close" id="arHeroClose"><i class="fas fa-times"></i></button>
            </div>
            <form id="arHeroForm">
              <div class="ar-cms-form-group">
                <label>Main Heading</label>
                <input type="text" name="heading" value="${heroData.heading || 'ASHWA RIDERS'}" required />
              </div>
              <div class="ar-cms-form-group">
                <label>Subtitle / Tagline</label>
                <input type="text" name="subtitle" value="${heroData.subtitle || ''}" required />
              </div>
              <div class="ar-cms-form-group">
                <label>Badge Text</label>
                <input type="text" name="badgeText" value="${heroData.badgeText || ''}" />
              </div>
              <div class="ar-cms-form-group">
                <label>Background Video URL (Cloudinary)</label>
                <input type="text" name="videoUrl" value="${heroData.videoUrl || ''}" placeholder="https://res.cloudinary.com/..." />
              </div>
              <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                  <label>Primary Button Text</label>
                  <input type="text" name="primaryBtnText" value="${heroData.primaryBtnText || ''}" />
                </div>
                <div>
                  <label>Primary Button Link</label>
                  <input type="text" name="primaryBtnLink" value="${heroData.primaryBtnLink || ''}" />
                </div>
              </div>
              <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                <div>
                  <label>Secondary Button Text</label>
                  <input type="text" name="secondaryBtnText" value="${heroData.secondaryBtnText || ''}" />
                </div>
                <div>
                  <label>Secondary Button Link</label>
                  <input type="text" name="secondaryBtnLink" value="${heroData.secondaryBtnLink || ''}" />
                </div>
              </div>
              <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
                <button type="button" class="ar-cms-btn ar-cms-btn--cancel" id="arHeroCancel">Cancel</button>
                <button type="submit" class="ar-cms-btn ar-cms-btn--save" id="arHeroSave"><i class="fas fa-save"></i> Save Hero</button>
              </div>
            </form>
          </div>
        </div>
      `;

      const existing = document.getElementById('arHeroModal');
      if (existing) existing.remove();
      document.body.insertAdjacentHTML('beforeend', modalHtml);

      const modal = document.getElementById('arHeroModal');
      const close = () => modal.remove();

      modal.querySelector('#arHeroClose').addEventListener('click', close);
      modal.querySelector('#arHeroCancel').addEventListener('click', close);

      modal.querySelector('#arHeroForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const saveBtn = modal.querySelector('#arHeroSave');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        const body = {
          heading:          modal.querySelector('[name="heading"]').value,
          subtitle:         modal.querySelector('[name="subtitle"]').value,
          badgeText:        modal.querySelector('[name="badgeText"]').value,
          videoUrl:         modal.querySelector('[name="videoUrl"]').value,
          primaryBtnText:   modal.querySelector('[name="primaryBtnText"]').value,
          primaryBtnLink:   modal.querySelector('[name="primaryBtnLink"]').value,
          secondaryBtnText: modal.querySelector('[name="secondaryBtnText"]').value,
          secondaryBtnLink: modal.querySelector('[name="secondaryBtnLink"]').value,
        };

        try {
          const res = await apiFetch(`${HOME_API}/hero`, {
            method: 'PUT',
            body: JSON.stringify(body),
          });

          if (res.success) {
            close();
            notify('Hero section updated successfully!');
            renderHero(res.data); // Update DOM immediately
          } else {
            notify(res.message || 'Save failed', 'error');
            saveBtn.disabled = false;
          }
        } catch (err) {
          notify('Save error: ' + err.message, 'error');
          saveBtn.disabled = false;
        }
      });
    }
  };

  // ============================================================
  //  2. WHAT'S HAPPENING (NEWS CARDS) HYDRATION & CMS
  // ============================================================
  const hydrateNews = async () => {
    try {
      const res = await apiFetch(`${HOME_API}/news`);
      if (res.success && res.data && res.data.length > 0) {
        renderNews(res.data);
      } else if (isAdmin()) {
        renderNews([]); // Render empty with Add Card button for Admin
      }
    } catch (err) {
      console.warn('News hydration notice:', err.message);
    }
  };

  const renderNews = (items) => {
    const newsTrack = document.getElementById('newsTrack');
    if (!newsTrack) return;

    const newsCarousel = newsTrack.closest('.news-carousel');
    const adminActive  = isAdmin();

    // Admin Add Button for News Section
    if (adminActive && newsCarousel) {
      let addBtnWrap = newsCarousel.querySelector('.ar-cms-news-add');
      if (!addBtnWrap) {
        addBtnWrap = document.createElement('div');
        addBtnWrap.className = 'ar-cms-news-add';
        addBtnWrap.style.marginBottom = '20px';
        addBtnWrap.innerHTML = window.ARCms ? window.ARCms.renderAddButton('Add News Article') : '<button class="ar-cms-btn ar-cms-btn--add">+ Add News</button>';
        newsCarousel.insertBefore(addBtnWrap, newsTrack);

        addBtnWrap.querySelector('#arCmsAddBtn').addEventListener('click', () => {
          openNewsModal('Add News Article', {}, async (formData) => {
            const res = await apiFetch(`${HOME_API}/news`, {
              method: 'POST',
              body: JSON.stringify(formData),
            });
            if (res.success) {
              notify('News article added successfully!');
              await hydrateNews();
            } else {
              notify(res.message || 'Add failed', 'error');
            }
          });
        });
      }
    }

    if (items.length > 0) {
      newsTrack.innerHTML = '';
      items.forEach((item) => {
        const card = document.createElement('a');
        card.className = 'news-card';
        card.href = item.ctaUrl || item.link || 'blog.html';
        card.style.display = 'block';
        card.style.textDecoration = 'none';

        const tagText = item.category || 'News';
        const imgHtml = item.imageUrl
          ? `<div class="news-image" style="background-image:url('${item.imageUrl}');background-size:cover;background-position:center;height:160px;"><span class="icon"><i class="${item.icon || 'fas fa-newspaper'}"></i></span><span class="tag">${tagText}</span></div>`
          : `<div class="news-image"><span class="icon"><i class="${item.icon || 'fas fa-newspaper'}"></i></span><span class="tag">${tagText}</span></div>`;

        card.innerHTML = `
          ${imgHtml}
          <div class="news-body">
            <div class="meta">${item.date || ''}</div>
            <h4 class="ar-cms-field-title">${item.title}</h4>
            <p class="ar-cms-field-desc">${item.description || item.excerpt || ''}</p>
          </div>
        `;

        newsTrack.appendChild(card);

        if (adminActive) {
          const bodyEl = card.querySelector('.news-body');
          if (window.ARCms && window.ARCms.setupInlineEdit) {
            window.ARCms.setupInlineEdit(bodyEl, item, hydrateNews, hydrateNews);
          }
        }
      });

      // Update counter total if counter element exists
      const totalCounter = document.getElementById('newsCounterTotal');
      if (totalCounter) {
        totalCounter.textContent = String(items.length).padStart(2, '0');
      }
    }
  };

  const openNewsModal = (title, data = {}, onSave) => {
    if (window.ARCms && window.ARCms.showAddContentModal) {
      window.ARCms.showAddContentModal({ title, data, onSave });
    }
  };

  // ============================================================
  //  3. STATISTICS COUNTER STRIP HYDRATION & CMS
  // ============================================================
  const hydrateStats = async () => {
    try {
      const res = await apiFetch(`${HOME_API}/stats`);
      if (res.success && res.data && res.data.length > 0) {
        renderStats(res.data);
      }
    } catch (err) {
      console.warn('Stats hydration notice:', err.message);
    }
  };

  const renderStats = (statsList) => {
    const statsWrap = document.getElementById('heroStats');
    if (!statsWrap) return;

    statsWrap.innerHTML = '';
    statsList.forEach((stat) => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'stat-item';
      itemDiv.innerHTML = `
        <div class="stat-number" data-count="${stat.value}">${stat.value}</div>
        <div class="stat-label">${stat.label}</div>
      `;
      statsWrap.appendChild(itemDiv);

      if (isAdmin() && window.ARCms) {
        const controls = document.createElement('div');
        controls.className = 'ar-cms-controls';
        controls.innerHTML = window.ARCms.renderEditButton(stat._id, 'Edit');
        itemDiv.appendChild(controls);

        controls.querySelector('.ar-cms-btn--edit').addEventListener('click', () => {
          openStatEditModal(stat);
        });
      }
    });
  };

  const openStatEditModal = (stat) => {
    const modalHtml = `
      <div class="ar-cms-modal-overlay ar-open" id="arStatModal">
        <div class="ar-cms-modal" style="max-width:400px;">
          <div class="ar-cms-modal-header">
            <h3>Edit Stat Counter</h3>
            <button class="ar-cms-modal-close" id="arStatClose"><i class="fas fa-times"></i></button>
          </div>
          <form id="arStatForm">
            <div class="ar-cms-form-group">
              <label>Stat Label</label>
              <input type="text" name="label" value="${stat.label}" required />
            </div>
            <div class="ar-cms-form-group">
              <label>Stat Value</label>
              <input type="text" name="value" value="${stat.value}" required />
            </div>
            <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px;">
              <button type="button" class="ar-cms-btn ar-cms-btn--cancel" id="arStatCancel">Cancel</button>
              <button type="submit" class="ar-cms-btn ar-cms-btn--save" id="arStatSave"><i class="fas fa-save"></i> Save Stat</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const existing = document.getElementById('arStatModal');
    if (existing) existing.remove();
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('arStatModal');
    const close = () => modal.remove();

    modal.querySelector('#arStatClose').addEventListener('click', close);
    modal.querySelector('#arStatCancel').addEventListener('click', close);

    modal.querySelector('#arStatForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = modal.querySelector('#arStatSave');
      saveBtn.disabled = true;

      try {
        const res = await apiFetch(`${HOME_API}/stats/${stat._id}`, {
          method: 'PUT',
          body: JSON.stringify({
            label: modal.querySelector('[name="label"]').value,
            value: modal.querySelector('[name="value"]').value,
          }),
        });

        if (res.success) {
          close();
          notify('Stat counter updated successfully!');
          await hydrateStats();
        } else {
          notify(res.message || 'Save failed', 'error');
          saveBtn.disabled = false;
        }
      } catch (err) {
        notify('Save error: ' + err.message, 'error');
        saveBtn.disabled = false;
      }
    });
  };

  // ============================================================
  //  4. SPONSORS PREVIEW HYDRATION & CMS
  // ============================================================
  const hydrateSponsors = async () => {
    try {
      const res = await apiFetch(HOME_API);
      if (res && res.success && res.data) {
        const tiers = res.data.footerSponsors?.sponsorSection?.tiers || [];
        if (tiers.length > 0) {
          renderSponsorsFromTiers(tiers);
          return;
        }
      }
      const rawRes = await apiFetch(`${HOME_API}/sponsors`);
      if (rawRes && rawRes.success && rawRes.data && rawRes.data.length > 0) {
        renderSponsors(rawRes.data);
      }
    } catch (err) {
      console.warn('Sponsors hydration notice:', err.message);
    }
  };

  const renderSponsorsFromTiers = (tiersList) => {
    const container = document.getElementById('homeSponsorTiersContainer') || document.querySelector('.sponsor-tier')?.parentElement;
    const sponsorSec = container ? container.closest('section') : document.querySelector('.sponsor-tier')?.closest('section');
    if (!container) return;

    if (!Array.isArray(tiersList) || tiersList.length === 0) {
      container.innerHTML = '';
      return;
    }

    // Sort tiers by order / displayOrder
    const sortedTiers = tiersList.slice().sort((a, b) => {
      const orderA = a.order !== undefined ? a.order : (a.displayOrder !== undefined ? a.displayOrder : 0);
      const orderB = b.order !== undefined ? b.order : (b.displayOrder !== undefined ? b.displayOrder : 0);
      return orderA - orderB;
    });

    // Level 1: Filter out hidden tiers (visible === false)
    // Empty tier behavior: Filter out tiers that have 0 visible sponsors
    const activeTiers = sortedTiers.filter((tier) => {
      if (tier.visible === false) return false;
      const visibleSponsors = (tier.sponsors || []).filter((s) => s.visible !== false);
      return visibleSponsors.length > 0;
    });

    if (activeTiers.length === 0) {
      container.innerHTML = '';
      return;
    }

    let allTiersHtml = '';

    activeTiers.forEach((tier) => {
      // Direction
      const isReverse = tier.direction === 'reverse' || tier.direction === 'right';

      // Speed duration mapping: Slow -> 55s, Normal -> 35s, Fast -> 20s
      let speedDuration = '35s';
      if (tier.animationSpeed === 'slow') speedDuration = '55s';
      else if (tier.animationSpeed === 'fast') speedDuration = '20s';

      // Animation enabled
      let trackStyle = `animation-duration: ${speedDuration};`;
      if (tier.animationEnabled === false) {
        trackStyle += ' animation: none;';
      }

      // Level 2: Filter and sort individual sponsors
      const sponsors = (tier.sponsors || [])
        .filter((s) => s.visible !== false)
        .sort((a, b) => {
          const ordA = a.order !== undefined ? a.order : (a.displayOrder !== undefined ? a.displayOrder : 0);
          const ordB = b.order !== undefined ? b.order : (b.displayOrder !== undefined ? b.displayOrder : 0);
          return ordA - ordB;
        });

      if (sponsors.length === 0) return;

      // Tier visual style class
      const tierNameLower = (tier.name || '').toLowerCase();
      let tierClass = 'silver';
      if (tierNameLower.includes('gold') || tierNameLower.includes('title') || tierNameLower.includes('platinum')) {
        tierClass = 'gold';
      } else if (tierNameLower.includes('bronze')) {
        tierClass = 'bronze';
      }

      let marqueeHtml = '';
      sponsors.forEach((s) => {
        const logoContent = s.logoUrl
          ? `<img src="${s.logoUrl}" class="sponsor-logo-img" alt="${s.altText || s.name || 'Sponsor'}" loading="lazy" />`
          : `<i class="${s.icon || 'fas fa-award'} logo"></i>`;

        const itemContent = `${logoContent} <span class="sponsor-name">${s.name || ''}</span>`;

        if (s.websiteUrl && s.websiteUrl.trim() !== '' && s.websiteUrl.trim() !== '#') {
          marqueeHtml += `<a href="${s.websiteUrl.trim()}" target="_blank" rel="noopener noreferrer" class="sponsor-item ${tierClass}">${itemContent}</a>`;
        } else {
          marqueeHtml += `<span class="sponsor-item ${tierClass}" style="cursor:default;">${itemContent}</span>`;
        }
      });

      // Repeat items so each half comfortably spans across wide displays (min 24 items per half)
      // This ensures 0 to -50% translation is completely continuous, starts and ends outside viewport on any resolution
      const repeatCount = Math.max(2, Math.ceil(24 / sponsors.length));
      let oneHalf = '';
      for (let r = 0; r < repeatCount; r++) {
        oneHalf += marqueeHtml;
      }
      const fullContent = oneHalf + oneHalf;

      allTiersHtml += `
        <div class="sponsor-tier reveal-scale">
          <span class="sponsor-tier-label container">${tier.name || 'Sponsor Tier'}</span>
          <div class="marquee ${isReverse ? 'reverse' : ''}">
            <div class="marquee-track" style="${trackStyle}">${fullContent}</div>
          </div>
        </div>
      `;
    });

    container.innerHTML = allTiersHtml;
  };

  const renderSponsors = (sponsorsList) => {
    const marquees = document.querySelectorAll('.marquee-track');
    if (!marquees || marquees.length === 0) return;

    const gold = sponsorsList.filter((s) => s.tier === 'Gold' || s.tier === 'Title' || s.tier === 'Platinum' || (s.tier && s.tier.includes('Gold')));
    const silver = sponsorsList.filter((s) => s.tier === 'Silver' || (s.tier && s.tier.includes('Technical')));
    const bronze = sponsorsList.filter((s) => s.tier === 'Bronze' || (s.tier && s.tier.includes('Associate')) || (s.tier && s.tier.includes('Equipment')));

    const updateMarquee = (track, list) => {
      if (!track || list.length === 0) return;
      let html = '';
      list.forEach((s) => {
        const logoContent = s.logoUrl
          ? `<img src="${s.logoUrl}" class="sponsor-logo-img" alt="${s.name}" />`
          : `<i class="${s.icon || 'fas fa-award'} logo"></i>`;

        const itemContent = `
          ${logoContent}
          <span class="sponsor-name">${s.name}</span>
        `;

        if (s.websiteUrl) {
          html += `<a href="${s.websiteUrl}" target="_blank" rel="noopener noreferrer" class="sponsor-item ${s.tier ? s.tier.toLowerCase().replace(/\s+/g, '-') : 'gold'}">${itemContent}</a>`;
        } else {
          html += `<span class="sponsor-item ${s.tier ? s.tier.toLowerCase().replace(/\s+/g, '-') : 'gold'}">${itemContent}</span>`;
        }
      });
      const repeatCount = Math.max(2, Math.ceil(18 / list.length));
      let oneHalf = '';
      for (let r = 0; r < repeatCount; r++) {
        oneHalf += html;
      }
      track.innerHTML = oneHalf + oneHalf; // Two identical halves for continuous smooth looping across screen
    };

    if (marquees[0] && gold.length > 0) updateMarquee(marquees[0], gold);

    if (marquees[1] && silver.length > 0) {
      const parentMarquee = marquees[1].closest('.marquee');
      if (parentMarquee) parentMarquee.classList.add('reverse'); // Middle line moves from left to right!
      updateMarquee(marquees[1], silver);
    }

    if (marquees[2] && bronze.length > 0) updateMarquee(marquees[2], bronze);
  };

  // ============================================================
  //  5. GARAGE-TO-GRID BUILD STORY HYDRATION
  // ============================================================
  const hydrateBuildStages = async () => {
    try {
      const res = await apiFetch(`${HOME_API}/build-stages`);
      if (res.success && res.data && res.data.length > 0) {
        renderBuildStages(res.data);
      }
    } catch (err) {
      console.warn('Build stages hydration notice:', err.message);
    }
  };

  const renderBuildStages = (stages) => {
    const track = document.querySelector('.g2g-track, #buildStagesTrack');
    if (!track) return;

    track.innerHTML = stages
      .map((stage, idx) => {
        const accentColor = (stage.appearance && stage.appearance.accentColor) || '#ff6b00';
        
        // Render nested content blocks if present
        let blocksHtml = '';
        if (stage.blocks && Array.isArray(stage.blocks) && stage.blocks.length > 0) {
          blocksHtml = stage.blocks
            .filter(b => b.visible !== false)
            .map(b => {
              const c = b.content || {};
              switch (b.type) {
                case 'heading':
                  return `<h4 class="g2g-block-heading" style="font-size:1.1rem;font-weight:700;color:#fff;margin:12px 0 6px 0;">${c.text || ''}</h4>`;
                case 'text':
                  return `<p class="g2g-block-text" style="font-size:0.9rem;color:#b4b4c0;line-height:1.5;margin:6px 0;">${c.text || ''}</p>`;
                case 'image':
                  return c.url ? `<div class="g2g-block-img-wrap" style="margin:10px 0;"><img src="${c.url}" alt="${c.caption || c.altText || stage.title || ''}" style="width:100%;border-radius:6px;max-height:300px;object-fit:cover;" />${c.caption ? `<span style="font-size:0.78rem;color:#8a8a9e;display:block;margin-top:4px;">${c.caption}</span>` : ''}</div>` : '';
                case 'button':
                  return c.text ? `<a href="${c.link || '#'}" class="btn btn-secondary btn-sm" style="display:inline-block;margin:8px 0;"><i class="fas fa-external-link-alt"></i> ${c.text}</a>` : '';
                case 'quote':
                  return `<blockquote style="border-left:3px solid ${accentColor};padding-left:12px;margin:12px 0;font-style:italic;color:#e2e2e8;">"${c.text || ''}" ${c.author ? `<footer style="font-style:normal;font-size:0.82rem;color:${accentColor};margin-top:4px;">— ${c.author}</footer>` : ''}</blockquote>`;
                case 'specification':
                  return `
                    <div class="g2g-block-spec" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:8px 14px;display:flex;align-items:center;justify-content:space-between;margin:6px 0;">
                      <span style="font-size:0.85rem;color:#8a8a9e;">${c.name || 'Specification'}</span>
                      <span style="font-family:var(--font-mono, monospace);font-size:0.9rem;font-weight:700;color:${accentColor};">${c.value || '0'} ${c.unit || ''}</span>
                    </div>
                  `;
                case 'divider':
                  return `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:14px 0;" />`;
                default:
                  return '';
              }
            }).join('');
        }

        return `
          <div class="g2g-stage ${stage.advanced && stage.advanced.cssClass ? stage.advanced.cssClass : ''}" data-stage="${stage.stageNumber || idx + 1}" id="${stage.advanced && stage.advanced.slug ? stage.advanced.slug : `stage-${stage.stageNumber || idx + 1}`}">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
              <div class="g2g-stage-badge">STAGE 0${stage.stageNumber || idx + 1}</div>
              ${stage.icon ? `<i class="${stage.icon}" style="font-size:18px;color:${accentColor};"></i>` : ''}
            </div>
            
            ${stage.subtitle ? `<div style="font-size:0.8rem;font-family:var(--font-mono, monospace);color:var(--signal-bright, #ff6b00);margin-bottom:4px;">${stage.subtitle}</div>` : ''}
            <h3 class="g2g-stage-title">${stage.title}</h3>
            
            <p class="g2g-stage-desc">${stage.description}</p>
            ${stage.imageUrl ? `<img src="${stage.imageUrl}" alt="${stage.altText || stage.title}" style="width:100%; max-height:240px; object-fit:cover; border-radius:6px; margin-top:12px;" />` : ''}
            
            ${blocksHtml}

            ${stage.buttonText ? `
              <div style="margin-top:16px;">
                <a href="${stage.buttonLink || '#'}" class="btn btn-primary btn-sm"><i class="fas fa-chevron-right"></i> ${stage.buttonText}</a>
              </div>
            ` : ''}
          </div>
        `;
      })
      .join('');
  };

  // ============================================================
  //  6. UNIFIED HOMEPAGE HYDRATION & PREVIEW MODE ENGINE
  // ============================================================
  const renderPreviewBanner = () => {
    if (document.getElementById('arPreviewBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'arPreviewBanner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      z-index: 9999999;
      background: linear-gradient(90deg, #FF5A00, #FF7A1F);
      color: #FFFFFF;
      font-family: 'JetBrains Mono', monospace, sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 8px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      letter-spacing: 0.02em;
    `;
    banner.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#fff; animation:pulse 1.2s infinite;"></span>
        <span><i class="fas fa-eye"></i> DRAFT PREVIEW MODE — You are viewing unpublished draft changes for Ashwa Riders Home.</span>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <a href="/admin/home" style="color:#fff; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.3); padding:4px 12px; border-radius:4px; text-decoration:none; font-size:0.75rem; transition:background 0.2s;">
          <i class="fas fa-arrow-left"></i> Return to Editor
        </a>
      </div>
    `;
    document.body.prepend(banner);

    // Shift navbar down if needed
    const nav = document.querySelector('.navbar');
    if (nav) nav.style.top = '34px';
  };

  const hydrateFromUnifiedData = (data) => {
    console.log('[HOME CMS] Hydrating homepage with published unified data:', data);

    // 1. Hero Block
    if (data.hero) {
      if (data.hero.transition) {
        if (data.hero.transition.type) heroTransitionType = data.hero.transition.type;
        if (data.hero.transition.interval) heroTransitionInterval = data.hero.transition.interval;
      }
      if (data.hero.slides && data.hero.slides.length > 0) {
        heroSlidesList = data.hero.slides;
        renderHeroSlide(heroSlidesList[0]);
        if (heroSlidesList.length > 1) {
          initHeroCarousel();
        }
      }
      if (data.hero.statsStrip && data.hero.statsStrip.length > 0) {
        renderStats(data.hero.statsStrip);
      } else if (data.hero.stats && data.hero.stats.length > 0) {
        renderStats(data.hero.stats);
      }
    } else if (data.heroSlides && data.heroSlides.length > 0) {
      heroSlidesList = data.heroSlides;
      renderHeroSlide(heroSlidesList[0]);
      if (heroSlidesList.length > 1) initHeroCarousel();
    }

    // 2. Car Story / Scrolling Info Block
    if (data.carStory) {
      const g2gOuter = document.getElementById('buildTimelineSection') || document.querySelector('.g2g-outer');
      if (g2gOuter) {
        g2gOuter.style.display = (data.carStory.sectionVisible !== false) ? '' : 'none';
      }

      // Main vehicle media
      const carImg = document.getElementById('g2gCarImg');
      const mediaUrl = data.carStory.mainMedia?.desktopImageUrl || data.carStory.mainMedia?.videoUrl || data.carStory.mainMediaUrl || data.carStory.posterUrl;
      if (carImg && mediaUrl) {
        carImg.src = mediaUrl;
      }
      if (carImg && data.carStory.mainMedia?.altText) {
        carImg.alt = data.carStory.mainMedia.altText;
      }

      // Section label
      const secLabel = document.querySelector('.g2g-section-label');
      if (secLabel && (data.carStory.sectionLabel || data.carStory.subheading)) {
        secLabel.textContent = data.carStory.sectionLabel || data.carStory.subheading;
      }

      // Build story cards
      const storyCards = data.carStory.cards || [];
      if (storyCards.length > 0) {
        const cardsInDom = document.querySelectorAll('.g2g-card');
        storyCards.forEach((card, idx) => {
          const targetCard = cardsInDom[idx];
          if (targetCard) {
            const stepNum = card.stepNumber || ('0' + (idx + 1));
            const stepEl = targetCard.querySelector('.g2g-card-step');
            if (stepEl) stepEl.textContent = stepNum;

            const titleEl = targetCard.querySelector('.g2g-card-title');
            if (titleEl && card.title) titleEl.innerHTML = card.title;

            const descEl = targetCard.querySelector('.g2g-card-desc');
            if (descEl && card.description) descEl.textContent = card.description;

            const eyebrowEl = targetCard.querySelector('.g2g-card-eyebrow');
            if (eyebrowEl && card.eyebrow) {
              eyebrowEl.innerHTML = `<span class="g2g-card-step">${stepNum}</span> ${card.eyebrow}`;
            }
          }
        });
      }
    } else if (data.buildStory && data.buildStory.length > 0) {
      renderBuildStages(data.buildStory);
    }

    // 3. News Block
    if (data.news) {
      const newsTrack = document.getElementById('newsTrack');
      const newsSec = newsTrack ? newsTrack.closest('section') : null;
      const settings = data.news.sectionSettings || {};

      if (newsSec) {
        if (settings.visible === false) {
          newsSec.style.display = 'none';
        } else {
          newsSec.style.display = '';
          const eb = newsSec.querySelector('.eyebrow');
          if (eb && settings.eyebrow) eb.textContent = settings.eyebrow;

          const heading = newsSec.querySelector('.section-title');
          if (heading && settings.heading) {
            heading.innerHTML = settings.heading;
          }

          const sub = newsSec.querySelector('.section-subtitle');
          if (sub && settings.description) sub.textContent = settings.description;

          const viewAll = newsSec.querySelector('.view-all');
          if (viewAll) {
            if (settings.viewAllUrl) viewAll.href = settings.viewAllUrl;
            if (settings.viewAllText) viewAll.innerHTML = `${settings.viewAllText} <i class="fas fa-arrow-right"></i>`;
          }
        }
      }

      const articles = data.news.articles || (Array.isArray(data.news) ? data.news : []);
      if (articles.length > 0) {
        renderNews(articles);
      }
    }

    // 4. Footer & Sponsors Block
    if (data.footerSponsors) {
      const sponsorSecData = data.footerSponsors.sponsorSection || {};
      const sponsorSec = document.querySelector('.sponsor-tier')?.closest('section');
      
      if (sponsorSec) {
        if (sponsorSecData.visible === false) {
          sponsorSec.style.display = 'none';
        } else {
          sponsorSec.style.display = '';
          const eb = sponsorSec.querySelector('.eyebrow');
          if (eb && sponsorSecData.eyebrow) eb.textContent = sponsorSecData.eyebrow;

          const heading = sponsorSec.querySelector('.section-title');
          if (heading && sponsorSecData.heading) heading.innerHTML = sponsorSecData.heading;

          const sub = sponsorSec.querySelector('.section-subtitle');
          if (sub && sponsorSecData.description) sub.textContent = sponsorSecData.description;

          const viewAll = sponsorSec.querySelector('.view-all');
          if (viewAll && sponsorSecData.viewAllUrl) viewAll.href = sponsorSecData.viewAllUrl;
        }
      }

      const tiers = sponsorSecData.tiers || data.footerSponsors.tiers || [];
      if (tiers.length > 0) {
        renderSponsorsFromTiers(tiers);
      } else if (data.sponsors && data.sponsors.length > 0) {
        renderSponsors(data.sponsors);
      }

      // Sponsor CTA Banner
      const ctaData = data.footerSponsors.sponsorCTA || data.footerSponsors.sponsorCta || {};
      const ctaSec = document.querySelector('.cta-sponsor');
      if (ctaSec) {
        if (ctaData.visible === false) {
          ctaSec.style.display = 'none';
        } else {
          ctaSec.style.display = '';
          const eb = ctaSec.querySelector('.eyebrow');
          if (eb && ctaData.eyebrow) eb.textContent = ctaData.eyebrow;

          const h2 = ctaSec.querySelector('h2');
          if (h2 && (ctaData.heading || ctaData.title)) h2.innerHTML = ctaData.heading || ctaData.title;

          const p = ctaSec.querySelector('p');
          if (p && (ctaData.description || ctaData.subtitle)) p.textContent = ctaData.description || ctaData.subtitle;

          const btnPrimary = ctaSec.querySelector('.btn-primary');
          if (btnPrimary) {
            if (ctaData.primaryBtnText || ctaData.btnText) {
              btnPrimary.innerHTML = `<i class="fas fa-handshake"></i> ${ctaData.primaryBtnText || ctaData.btnText}`;
            }
            if (ctaData.primaryBtnUrl || ctaData.btnLink) {
              btnPrimary.href = ctaData.primaryBtnUrl || ctaData.btnLink;
            }
          }

          const btnSecondary = ctaSec.querySelector('.btn-secondary');
          if (btnSecondary) {
            if (ctaData.secondaryBtnText) {
              btnSecondary.innerHTML = `<i class="fas fa-file-download"></i> ${ctaData.secondaryBtnText}`;
            }
            if (ctaData.brochureFile || ctaData.secondaryBtnUrl) {
              btnSecondary.href = ctaData.brochureFile || ctaData.secondaryBtnUrl;
            }
          }
        }
      }

      // Footer Company Info
      const companyData = data.footerSponsors.company || {};
      if (companyData) {
        const footerBrandP = document.querySelector('.footer-brand p');
        if (footerBrandP && companyData.description) {
          footerBrandP.textContent = companyData.description;
        }
        const copyEl = document.querySelector('.footer-bottom span:first-child');
        if (copyEl && (companyData.copyrightText || companyData.copyright)) {
          copyEl.textContent = companyData.copyrightText || companyData.copyright;
        }
        const brandLogo = document.querySelector('.footer-brand .logo');
        if (brandLogo && companyData.brandName) {
          brandLogo.innerHTML = companyData.brandName;
        }
      }

      // Footer Social Links
      if (data.footerSponsors.socialLinks) {
        const socialRaw = data.footerSponsors.socialLinks;
        const socialMap = {};
        if (Array.isArray(socialRaw)) {
          socialRaw.forEach((item) => {
            if (item && item.platform && item.url) {
              const key = item.platform.toLowerCase().replace(/[^a-z]/g, '');
              socialMap[key] = { url: item.url, visible: item.visible !== false };
            }
          });
        } else if (typeof socialRaw === 'object') {
          Object.entries(socialRaw).forEach(([k, v]) => {
            socialMap[k.toLowerCase()] = { url: typeof v === 'string' ? v : v.url, visible: true };
          });
        }

        const socialContainer = document.querySelector('.footer-brand .social-links');
        if (socialContainer) {
          const insta = socialContainer.querySelector('a:has(.fa-instagram), a:nth-child(1)');
          if (insta && (socialMap.instagram || socialMap.insta)) {
            insta.href = (socialMap.instagram || socialMap.insta).url;
            insta.style.display = (socialMap.instagram || socialMap.insta).visible ? '' : 'none';
          }

          const linkedin = socialContainer.querySelector('a:has(.fa-linkedin-in), a:nth-child(2)');
          if (linkedin && socialMap.linkedin) {
            linkedin.href = socialMap.linkedin.url;
            linkedin.style.display = socialMap.linkedin.visible ? '' : 'none';
          }

          const yt = socialContainer.querySelector('a:has(.fa-youtube), a:nth-child(3)');
          if (yt && socialMap.youtube) {
            yt.href = socialMap.youtube.url;
            yt.style.display = socialMap.youtube.visible ? '' : 'none';
          }

          const tw = socialContainer.querySelector('a:has(.fa-x-twitter), a:has(.fa-twitter), a:nth-child(4)');
          if (tw && (socialMap.xtwitter || socialMap.twitter || socialMap.x)) {
            const tData = socialMap.xtwitter || socialMap.twitter || socialMap.x;
            tw.href = tData.url;
            tw.style.display = tData.visible ? '' : 'none';
          }

          const gh = socialContainer.querySelector('a:has(.fa-github), a:nth-child(5)');
          if (gh && socialMap.github) {
            gh.href = socialMap.github.url;
            gh.style.display = socialMap.github.visible ? '' : 'none';
          }
        }
      }
    } else if (data.sponsors && data.sponsors.length > 0) {
      renderSponsors(data.sponsors);
    }
  };

  // ============================================================
  //  INITIALIZATION FOR HOME PAGE CMS
  // ============================================================
  const initHomeCms = async () => {
    const isPreview = window.location.search.includes('preview=true');

    if (isPreview) {
      renderPreviewBanner();
    }

    try {
      const url = isPreview ? `${HOME_API}?preview=true` : HOME_API;
      const res = await apiFetch(url);
      if (res && res.success && res.data) {
        hydrateFromUnifiedData(res.data);
        return; // Complete hydration succeeded in one unified pass!
      }
    } catch (err) {
      console.warn('Unified home fetch notice, falling back to modular endpoints:', err.message);
    }

    // Fallback to individual endpoints if unified format not available
    await hydrateHero();
    await hydrateNews();
    await hydrateStats();
    await hydrateBuildStages();
    await hydrateSponsors();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHomeCms);
  } else {
    initHomeCms();
  }

})();

