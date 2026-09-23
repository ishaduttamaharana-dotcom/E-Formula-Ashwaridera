/* ============================================================
   public/admin/js/modules/home.js
   Home Page CMS — Professional Admin Redesign
   Ashwa Riders Formula Student Team

   UI REDESIGN — admin experience only.
   Data model, API calls, normalizers, and denormalizers are
   preserved exactly. Only the render/HTML layer changes.

   Sections:
     01  HERO            — Slides + Quick Stats
     02  CAR & STORY     — Vehicle Showcase + Build Journey
     03  NEWS            — Homepage articles
     04  SPONSORS        — Partner CTA + Sponsor Tiers
============================================================ */

window.AdminHomeModule = (function () {
  'use strict';

  let homeData = null;
  let isDirty = false;
  let openEditorIdx = {}; // tracks which card editors are open per section

  const API = () => window.AdminApi || window.API;
  const Toast = () => window.AdminToast || { success: console.log, error: console.error, info: console.log };

  // ──────────────────────────────────────────────────────────
  // ENTRY POINT
  // ──────────────────────────────────────────────────────────
  async function renderHomeModule(container) {
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:360px; color:var(--text-secondary,#9A9AA5);">
        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-right:12px; color:var(--accent-orange,#FF5A00);"></i>
        <span style="font-family:var(--font-mono,monospace); font-size:0.95rem;">Loading Home Page CMS...</span>
      </div>
    `;

    try {
      const res = await API().get('/admin/home');
      if (res && res.success && res.data) {
        homeData = normalizeHomeData(res.data);
        isDirty = false;
        openEditorIdx = {};
        renderInterface(container);
      } else {
        throw new Error(res?.message || 'Failed to load home page content.');
      }
    } catch (err) {
      console.error('Failed to load Home CMS data:', err);
      container.innerHTML = `
        <div class="admin-panel" style="padding:40px; text-align:center; max-width:600px; margin:40px auto; border:1px solid var(--badge-red,#FF4D4D);">
          <i class="fas fa-triangle-exclamation" style="font-size:2.5rem; color:var(--badge-red,#FF4D4D); margin-bottom:16px;"></i>
          <h2 style="font-size:1.25rem; font-weight:800; color:#FFFFFF; margin-bottom:8px;">Unable to Load Home Page CMS</h2>
          <p style="color:var(--text-secondary,#9A9AA5); font-size:0.9rem; margin-bottom:24px;">${escapeHtml(err.message)}</p>
          <button type="button" class="btn btn-primary" id="retryHomeLoadBtn">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
      document.getElementById('retryHomeLoadBtn')?.addEventListener('click', () => renderHomeModule(container));
    }
  }

  // ──────────────────────────────────────────────────────────
  // DATA NORMALIZER — API → UI flat format  (UNCHANGED)
  // ──────────────────────────────────────────────────────────
  function normalizeHomeData(raw) {
    const hero = raw.hero || {};
    const carStory = raw.carStory || {};
    const news = raw.news || {};
    const fp = raw.footerSponsors || {};
    const sponsorSection = fp.sponsorSection || {};
    const sponsorCTA = fp.sponsorCTA || {};
    const company = fp.company || {};
    const socialArr = Array.isArray(fp.socialLinks) ? fp.socialLinks : [];
    const socialObj = {};
    socialArr.forEach((s) => {
      const key = (s.platform || '').toLowerCase().replace(/[^a-z]/g, '');
      if (key && s.url) socialObj[key] = s.url;
    });
    if (!socialObj.twitter) socialObj.twitter = socialObj.x || socialObj.xtwitter || '';

    return {
      _id: raw._id,
      status: raw.status,
      version: raw.version,
      isPublished: raw.status === 'published',
      lastPublishedAt: raw.lastPublishedAt,
      lastEditedAt: raw.lastEditedAt,

      hero: {
        autoplayInterval: Math.round((hero.transition?.interval || 5000) / 1000),
        transition: hero.transition?.type || 'fade',
        defaultOverlay: 40,
        slides: (hero.slides || []).map((s) => ({ ...s })),
        statsStrip: (hero.stats || []).map((st) => ({
          value: st.value || '',
          unit: st.unit || '',
          label: st.label || '',
          subtitle: st.subtitle || '',
        })),
      },

      carStory: {
        heading: carStory.sectionLabel || 'THE EVOLUTION OF ASHWA',
        subheading: 'ENGINEERING & BUILD STORY',
        description: '',
        mainMediaUrl: carStory.mainMedia?.videoUrl || carStory.mainMedia?.desktopImageUrl || '',
        posterUrl: carStory.mainMedia?.desktopImageUrl || '',
        ctaText: 'Inspect Car Specs',
        ctaLink: 'car.html',
        cards: (carStory.cards || []).map((c) => ({
          stageNumber: c.stepNumber || c.stageNumber || '01',
          title: c.title || '',
          subtitle: c.eyebrow || c.subtitle || '',
          description: c.description || '',
          imageUrl: c.imageUrl || '',
          order: c.order || 0,
        })),
        stats: [],
      },

      news: {
        heading: news.sectionSettings?.heading || "What's Happening",
        subheading: news.sectionSettings?.eyebrow || 'Latest News',
        articles: (news.articles || []).map((a) => ({
          title: a.title || '',
          category: a.category || 'News',
          date: a.date || '',
          excerpt: a.description || a.excerpt || '',
          imageUrl: a.imageUrl || '',
          readTime: a.readTime || '3 min read',
          link: a.ctaUrl || a.link || 'news.html',
          featured: a.featured || false,
          status: a.status || 'published',
        })),
      },

      footerSponsors: {
        sponsorCta: {
          title: sponsorCTA.heading || 'ACCELERATE WITH US',
          subtitle: sponsorCTA.description || 'Empower the next generation of Formula Student engineers.',
          btnText: sponsorCTA.primaryBtnText || 'Become a Partner',
          btnLink: sponsorCTA.primaryBtnUrl || 'sponsors.html',
        },
        tiers: (sponsorSection.tiers || []).map((t) => ({
          name: t.name || 'Tier',
          displaySize: t.displaySize || 'medium',
          sponsors: (t.sponsors || []).map((s) => ({
            name: s.name || '',
            logoUrl: s.logoUrl || '',
            websiteUrl: s.websiteUrl || '',
          })),
        })),
        company: {
          tagline: 'Formula Student Electric Team',
          description: company.description || '',
          copyright: company.copyrightText || '© 2026 Ashwa Riders. All rights reserved.',
        },
        socialLinks: socialObj,
      },
    };
  }

  // ──────────────────────────────────────────────────────────
  // DATA DENORMALIZER — UI → API schema  (UNCHANGED)
  // ──────────────────────────────────────────────────────────
  function denormalizeForSave(ui) {
    const socialPlatforms = {
      instagram: { platform: 'Instagram', icon: 'fab fa-instagram' },
      linkedin: { platform: 'LinkedIn', icon: 'fab fa-linkedin' },
      youtube: { platform: 'YouTube', icon: 'fab fa-youtube' },
      twitter: { platform: 'X (Twitter)', icon: 'fab fa-x-twitter' },
      facebook: { platform: 'Facebook', icon: 'fab fa-facebook' },
    };
    const socialArr = Object.entries(ui.footerSponsors.socialLinks || {})
      .filter(([, v]) => v)
      .map(([k, v]) => ({ ...(socialPlatforms[k] || { platform: k, icon: 'fas fa-link' }), url: v, visible: true }));

    return {
      hero: {
        transition: {
          type: ui.hero.transition || 'fade',
          duration: 700,
          autoplay: true,
          interval: (parseInt(ui.hero.autoplayInterval, 10) || 7) * 1000,
          pauseOnHover: true,
        },
        slides: ui.hero.slides,
        stats: ui.hero.statsStrip,
      },
      carStory: {
        sectionLabel: ui.carStory.heading,
        sectionVisible: true,
        mainMedia: {
          desktopImageUrl: ui.carStory.posterUrl || ui.carStory.mainMediaUrl,
          mobileImageUrl: '',
          videoUrl: ui.carStory.mainMediaUrl || '',
          altText: 'Ashwa Riders Formula Student Car',
          position: 'center',
        },
        cards: (ui.carStory.cards || []).map((c, i) => ({
          stepNumber: c.stageNumber || ('0' + (i + 1)),
          title: c.title,
          eyebrow: c.subtitle,
          description: c.description,
          imageUrl: c.imageUrl,
          order: i,
          stageIndex: i,
          visible: true,
        })),
      },
      news: {
        sectionSettings: {
          visible: true,
          heading: ui.news.heading,
          eyebrow: ui.news.subheading,
          highlightText: '',
          description: '',
          viewAllText: 'View All News',
          viewAllUrl: 'blog.html',
        },
        articles: (ui.news.articles || []).map((a, i) => ({
          title: a.title,
          category: a.category,
          date: a.date,
          description: a.excerpt,
          imageUrl: a.imageUrl,
          readTime: a.readTime,
          ctaUrl: a.link,
          featured: a.featured,
          status: a.status || 'published',
          order: i,
        })),
      },
      footerSponsors: {
        sponsorSection: {
          visible: true,
          tiers: (ui.footerSponsors.tiers || []).map((t, i) => ({
            name: t.name,
            direction: 'forward',
            visible: true,
            order: i,
            displaySize: t.displaySize,
            sponsors: (t.sponsors || []).map((s, j) => ({
              name: s.name,
              logoUrl: s.logoUrl,
              websiteUrl: s.websiteUrl,
              visible: true,
              order: j,
            })),
          })),
        },
        sponsorCTA: {
          visible: true,
          heading: ui.footerSponsors.sponsorCta.title,
          description: ui.footerSponsors.sponsorCta.subtitle,
          primaryBtnText: ui.footerSponsors.sponsorCta.btnText,
          primaryBtnUrl: ui.footerSponsors.sponsorCta.btnLink,
        },
        company: {
          description: ui.footerSponsors.company.description,
          copyrightText: ui.footerSponsors.company.copyright,
        },
        socialLinks: socialArr,
      },
    };
  }

  // ──────────────────────────────────────────────────────────
  // MAIN RENDER
  // ──────────────────────────────────────────────────────────
  function renderInterface(container) {
    const isPub = homeData.isPublished;
    const version = homeData.version || 1;
    const lastPubText = homeData.lastPublishedAt
      ? new Date(homeData.lastPublishedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Never published';

    const slides = homeData.hero.slides || [];
    const stats = homeData.hero.statsStrip || [];
    const stages = homeData.carStory.cards || [];
    const articles = homeData.news.articles || [];
    const tiers = homeData.footerSponsors.tiers || [];

    container.innerHTML = `
      <div class="hcms-wrapper" id="hcmsWrapper">

        <!-- ══ PUBLISH CONFIRMATION MODAL ══ -->
        <div class="hcms-modal-backdrop" id="hcmsPublishModal" role="dialog" aria-modal="true" aria-labelledby="hcmsModalTitle">
          <div class="hcms-modal">
            <div class="hcms-modal-icon"><i class="fas fa-rocket-launch"></i></div>
            <div class="hcms-modal-title" id="hcmsModalTitle">Publish Home Page?</div>
            <div class="hcms-modal-desc">Your saved changes will become visible on the public Ashwa Riders website immediately.</div>
            <div class="hcms-modal-changes">
              <i class="fas fa-info-circle"></i>
              <span>All draft changes will go live for public visitors.</span>
            </div>
            <div class="hcms-modal-actions">
              <button type="button" class="hcms-modal-cancel" id="hcmsModalCancel">Cancel</button>
              <button type="button" class="hcms-modal-confirm" id="hcmsModalConfirm">
                <i class="fas fa-upload"></i> Publish Live
              </button>
            </div>
          </div>
        </div>

        <!-- ══ PAGE HEADER ══ -->
        <div class="hcms-page-header">
          <div class="hcms-breadcrumb">
            <a data-link href="/admin/dashboard"><i class="fas fa-house" style="margin-right:4px;"></i> Admin</a>
            <span class="hcms-breadcrumb-sep">/</span>
            <span>Website</span>
            <span class="hcms-breadcrumb-sep">/</span>
            <span style="color:var(--text-secondary,#9A9AA5);">Home</span>
          </div>

          <div class="hcms-header-row">
            <div class="hcms-header-left">
              <h1 class="hcms-page-title">Home Page</h1>
              <p class="hcms-page-subtitle">Manage the content visitors see on the Ashwa Riders homepage.</p>
              <div class="hcms-status-row">
                <span class="hcms-status-badge ${isPub ? 'published' : 'draft'}" id="hcmsStatusBadge">
                  <span class="hcms-status-dot"></span>
                  <span id="hcmsStatusText">${isPub ? 'Published' : 'Draft Changes'}</span>
                </span>
                <span class="hcms-last-pub" id="hcmsLastPub">
                  <i class="fas fa-clock" style="margin-right:4px;"></i>Last published: ${escapeHtml(lastPubText)}
                </span>
              </div>
            </div>

            <div class="hcms-header-actions">
              <a href="/?preview=true" target="_blank" class="hcms-btn-preview" title="Preview the public homepage">
                <i class="fas fa-eye"></i> <span>Preview Website</span>
              </a>
              <button type="button" class="hcms-btn-draft" id="hcmsSaveDraftBtn" title="Save as draft without publishing">
                <i class="fas fa-floppy-disk"></i> <span>Save Draft</span>
              </button>
              <button type="button" class="hcms-btn-publish" id="hcmsPublishBtn" title="Publish all changes to the live website">
                <i class="fas fa-upload"></i> <span>Publish Live</span>
              </button>
            </div>
          </div>
        </div>

        <!-- ══ SUMMARY BAR ══ -->
        <div class="hcms-summary-bar">
          <span class="hcms-summary-label">4 Sections</span>
          <div class="hcms-summary-items">
            <span class="hcms-summary-item"><span class="hcms-summary-num" id="hcmsSumSlides">${slides.length}</span> Hero Slides</span>
            <span class="hcms-summary-item"><span class="hcms-summary-num" id="hcmsSumStages">${stages.length}</span> Build Stages</span>
            <span class="hcms-summary-item"><span class="hcms-summary-num" id="hcmsSumArticles">${articles.length}</span> News Articles</span>
            <span class="hcms-summary-item"><span class="hcms-summary-num" id="hcmsSumTiers">${tiers.length}</span> Sponsor Tiers</span>
          </div>
        </div>

        <!-- ══ STICKY SECTION NAV ══ -->
        <nav class="hcms-section-nav" id="hcmsSectionNav" aria-label="Page sections">
          <button class="hcms-section-nav-btn active" data-target="hcmsSection01" aria-label="Jump to Hero section">
            <span class="hcms-section-nav-num">01</span> HERO
          </button>
          <button class="hcms-section-nav-btn" data-target="hcmsSection02" aria-label="Jump to Car & Story section">
            <span class="hcms-section-nav-num">02</span> CAR & STORY
          </button>
          <button class="hcms-section-nav-btn" data-target="hcmsSection03" aria-label="Jump to News section">
            <span class="hcms-section-nav-num">03</span> NEWS
          </button>
          <button class="hcms-section-nav-btn" data-target="hcmsSection04" aria-label="Jump to Sponsors section">
            <span class="hcms-section-nav-num">04</span> SPONSORS
          </button>
        </nav>

        <!-- ══ ACCORDION SECTIONS ══ -->
        <div class="hcms-body">

          <!-- SECTION 01: HERO -->
          ${renderSectionHero(homeData.hero)}

          <!-- SECTION 02: CAR & STORY -->
          ${renderSectionCarStory(homeData.carStory)}

          <!-- SECTION 03: NEWS -->
          ${renderSectionNews(homeData.news)}

          <!-- SECTION 04: SPONSORS -->
          ${renderSectionSponsors(homeData.footerSponsors)}

        </div>

        <!-- ══ STICKY BOTTOM ACTION BAR ══ -->
        <div class="hcms-sticky-bar" id="hcmsStickyBar">
          <span class="hcms-sticky-page-label">Home Page</span>
          <span class="hcms-status-badge ${isPub ? 'published' : 'draft'}" id="hcmsStickyStatus">
            <span class="hcms-status-dot"></span>
            <span id="hcmsStickyStatusText">${isPub ? 'Published' : 'Draft Changes'}</span>
          </span>
          <div class="hcms-sticky-actions">
            <a href="/?preview=true" target="_blank" class="hcms-btn-preview" style="font-size:0.72rem;">
              <i class="fas fa-eye"></i> Preview
            </a>
            <button type="button" class="hcms-btn-draft" id="hcmsStickySaveDraftBtn" style="font-size:0.72rem;">
              <i class="fas fa-floppy-disk"></i> Save Draft
            </button>
            <button type="button" class="hcms-btn-publish" id="hcmsStickyPublishBtn" style="font-size:0.72rem;">
              <i class="fas fa-upload"></i> Publish
            </button>
          </div>
        </div>

      </div>
    `;

    bindEvents(container);
  }

  // ──────────────────────────────────────────────────────────
  // SECTION 01 — HERO
  // ──────────────────────────────────────────────────────────
  function renderSectionHero(hero = {}) {
    const slides = hero.slides || [];
    const stats = hero.statsStrip || [];

    return `
      <section class="hcms-section open" id="hcmsSection01">
        <div class="hcms-section-header" data-toggle="hcmsSection01">
          <div class="hcms-section-num">01</div>
          <div class="hcms-section-meta">
            <h2 class="hcms-section-name">HERO</h2>
            <p class="hcms-section-desc">Main homepage opening — fullscreen slides, background media, headline, and quick stats.</p>
          </div>
          <div class="hcms-section-header-right">
            <span class="hcms-count-badge">${slides.length} Slide${slides.length !== 1 ? 's' : ''}</span>
            <span class="hcms-count-badge">${stats.length} Stat${stats.length !== 1 ? 's' : ''}</span>
            <i class="fas fa-chevron-down hcms-chevron"></i>
          </div>
        </div>

        <div class="hcms-section-body">
          <div class="hcms-context-help">
            <i class="fas fa-circle-info"></i>
            These slides appear at the top of the homepage as a fullscreen rotating carousel.
          </div>

          <!-- Hero Slides -->
          <div class="hcms-sub-panel">
            <div class="hcms-sub-panel-header">
              <div>
                <h3 class="hcms-sub-panel-title"><i class="fas fa-images"></i> Hero Slides</h3>
                <p class="hcms-sub-panel-desc">Each slide appears in the homepage carousel with its own media, headline, and buttons.</p>
              </div>
              <button type="button" class="hcms-add-btn" id="hcmsAddSlideBtn">
                <i class="fas fa-plus"></i> Add Slide
              </button>
            </div>
            <div class="hcms-sub-panel-body">
              <div class="hcms-card-list" id="hcmsSlidesList">
                ${slides.length === 0
                  ? renderEmptyState('fa-image', 'No hero slides yet', 'Add your first slide to start building the homepage carousel.', 'hcmsAddSlideBtn2', '+ Add First Slide')
                  : slides.map((s, idx) => renderSlideCard(s, idx, slides.length)).join('')
                }
              </div>
              ${slides.length > 0 ? `
                <button type="button" class="hcms-add-btn hcms-add-btn-large" id="hcmsAddSlideBtn2">
                  <i class="fas fa-plus"></i> Add Slide
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="hcms-sub-panel">
            <div class="hcms-sub-panel-header">
              <div>
                <h3 class="hcms-sub-panel-title"><i class="fas fa-gauge-high"></i> Homepage Quick Stats</h3>
                <p class="hcms-sub-panel-desc">Key metrics displayed on the hero section (e.g. 0–100 km/h, Top Speed, Best Rank).</p>
              </div>
              <button type="button" class="hcms-add-btn" id="hcmsAddStatBtn">
                <i class="fas fa-plus"></i> Add Stat
              </button>
            </div>
            <div class="hcms-sub-panel-body">
              <div class="hcms-stats-grid" id="hcmsStatsList">
                ${stats.length === 0
                  ? `<div style="grid-column:1/-1;">${renderEmptyState('fa-gauge-high', 'No stats yet', 'Add performance stats to display on the hero.', 'hcmsAddStatBtn2', '+ Add Stat')}</div>`
                  : stats.map((st, idx) => renderStatCard(st, idx)).join('')
                }
              </div>
              ${stats.length > 0 ? `
                <button type="button" class="hcms-add-btn hcms-add-btn-large" id="hcmsAddStatBtn2" style="margin-top:12px;">
                  <i class="fas fa-plus"></i> Add Stat
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Advanced: Carousel Settings -->
          <div class="hcms-sub-panel">
            <div class="hcms-sub-panel-header">
              <h3 class="hcms-sub-panel-title"><i class="fas fa-sliders"></i> Carousel Settings</h3>
            </div>
            <div class="hcms-sub-panel-body">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                <div class="hcms-field-group">
                  <label class="hcms-label" for="hero_autoplayInterval">Autoplay Interval <span class="hcms-label-hint">(seconds)</span></label>
                  <input type="number" id="hero_autoplayInterval" class="hcms-input" min="2" max="30" value="${hero.autoplayInterval || 7}" />
                </div>
                <div class="hcms-field-group">
                  <label class="hcms-label" for="hero_transition">Transition Style</label>
                  <select id="hero_transition" class="hcms-destination-select">
                    <option value="fade" ${hero.transition === 'fade' ? 'selected' : ''}>Fade</option>
                    <option value="slide" ${hero.transition === 'slide' ? 'selected' : ''}>Slide</option>
                    <option value="crossfade" ${hero.transition === 'crossfade' ? 'selected' : ''}>Crossfade</option>
                    <option value="zoom" ${hero.transition === 'zoom' ? 'selected' : ''}>Zoom</option>
                    <option value="none" ${hero.transition === 'none' ? 'selected' : ''}>None (Instant)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    `;
  }

  function renderSlideCard(slide, idx, total) {
    const isVideo = slide.mediaType === 'video';
    const previewMedia = isVideo ? (slide.posterUrl || slide.imageUrl) : slide.imageUrl;
    const isEditorOpen = openEditorIdx['slide_' + idx] === true;

    return `
      <div class="hcms-content-card ${isEditorOpen ? 'editing' : ''}" id="hcmsSlideCard_${idx}" data-slide-index="${idx}">

        <!-- Card Top Bar -->
        <div class="hcms-card-top">
          <div class="hcms-card-id-row">
            <span class="hcms-card-num">SLIDE ${String(idx + 1).padStart(2, '0')}</span>
            <span class="hcms-card-label">${escapeHtml(slide.heading || 'Untitled Slide')}</span>
            <span class="hcms-card-type-pill ${isVideo ? 'video' : 'image'}">
              <i class="fas ${isVideo ? 'fa-video' : 'fa-image'}"></i>
              ${isVideo ? 'VIDEO' : 'IMAGE'}
            </span>
          </div>
          <span class="hcms-card-status published">✓ Active</span>
        </div>

        <!-- Visual Preview -->
        <div class="hcms-card-preview">
          <div class="hcms-card-media-thumb">
            ${previewMedia
              ? `<img src="${escapeHtml(previewMedia)}" alt="Slide ${idx + 1} preview" onerror="this.style.display='none'" /><div class="hcms-card-media-overlay"></div>`
              : `<div class="hcms-no-media"><i class="fas fa-image"></i><span>No media yet</span></div>`
            }
            <div class="hcms-card-media-type-badge">
              <i class="fas ${isVideo ? 'fa-video' : 'fa-image'}"></i> ${isVideo ? 'Video' : 'Image'}
            </div>
          </div>
          <div class="hcms-card-content">
            <div class="hcms-card-content-top">
              ${slide.badgeText ? `<div class="hcms-card-badge-text">${escapeHtml(slide.badgeText)}</div>` : ''}
              <div class="hcms-card-headline">${escapeHtml(slide.heading || 'No heading set')}</div>
              ${slide.subtitle ? `<div class="hcms-card-subtitle">${escapeHtml(slide.subtitle)}</div>` : ''}
              ${slide.description ? `<div class="hcms-card-excerpt">${escapeHtml(slide.description)}</div>` : ''}
            </div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:10px; flex-wrap:wrap;">
              ${slide.primaryBtnText ? `<span style="font-size:0.7rem; padding:3px 9px; background:var(--accent-orange,#FF5A00); color:#fff; border-radius:3px; font-weight:700;">${escapeHtml(slide.primaryBtnText)}</span>` : ''}
              ${slide.secondaryBtnText ? `<span style="font-size:0.7rem; padding:3px 9px; background:transparent; border:1px solid rgba(255,255,255,0.2); color:var(--text-secondary,#9A9AA5); border-radius:3px;">${escapeHtml(slide.secondaryBtnText)}</span>` : ''}
            </div>
          </div>
        </div>

        <!-- Card Actions -->
        <div class="hcms-card-actions">
          <button type="button" class="hcms-action-btn primary" data-action="edit-slide" data-idx="${idx}">
            <i class="fas fa-pen-to-square"></i> Edit Content
          </button>
          <button type="button" class="hcms-action-btn" data-action="replace-slide-media" data-idx="${idx}">
            <i class="fas fa-image"></i> Replace Media
          </button>
          <div class="hcms-action-sep"></div>
          <button type="button" class="hcms-action-btn" data-action="move-slide-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Move Up">
            <i class="fas fa-arrow-up"></i>
          </button>
          <button type="button" class="hcms-action-btn" data-action="move-slide-down" data-idx="${idx}" ${idx === total - 1 ? 'disabled' : ''} title="Move Down">
            <i class="fas fa-arrow-down"></i>
          </button>
          <button type="button" class="hcms-action-btn danger" data-action="delete-slide" data-idx="${idx}" title="Delete slide">
            <i class="fas fa-trash"></i>
          </button>
        </div>

        <!-- Inline Editor -->
        <div class="hcms-inline-editor ${isEditorOpen ? 'open' : ''}" id="hcmsSlideEditor_${idx}">
          <div class="hcms-editor-groups">

            <!-- Group 1: Text Content -->
            <div class="hcms-editor-group">
              <div class="hcms-editor-group-header"><i class="fas fa-text-width"></i> Text Content</div>
              <div class="hcms-editor-group-body">
                <div class="hcms-editor-grid-2">
                  <div class="hcms-field-group">
                    <label class="hcms-label" for="slide_badge_${idx}">Badge Text <span class="hcms-label-hint">(top pill)</span></label>
                    <input type="text" id="slide_badge_${idx}" class="hcms-input slide-field" data-idx="${idx}" data-key="badgeText"
                      value="${escapeHtml(slide.badgeText || '')}" placeholder="e.g. Ashwa Riders — 2026 Season" />
                  </div>
                  <div class="hcms-field-group">
                    <label class="hcms-label" for="slide_highlight_${idx}">Highlighted Word <span class="hcms-label-hint">(shown in orange)</span></label>
                    <input type="text" id="slide_highlight_${idx}" class="hcms-input slide-field" data-idx="${idx}" data-key="highlightText"
                      value="${escapeHtml(slide.highlightText || '')}" placeholder="e.g. RIDERS" />
                  </div>
                </div>
                <div class="hcms-field-group">
                  <label class="hcms-label" for="slide_heading_${idx}">Main Heading</label>
                  <input type="text" id="slide_heading_${idx}" class="hcms-input slide-field" data-idx="${idx}" data-key="heading"
                    value="${escapeHtml(slide.heading || '')}" placeholder="e.g. ASHWA RIDERS" />
                </div>
                <div class="hcms-field-group">
                  <label class="hcms-label" for="slide_subtitle_${idx}">Subtitle / Motto</label>
                  <input type="text" id="slide_subtitle_${idx}" class="hcms-input slide-field" data-idx="${idx}" data-key="subtitle"
                    value="${escapeHtml(slide.subtitle || '')}" placeholder="e.g. Engineering Speed. Building Innovation." />
                </div>
                <div class="hcms-field-group">
                  <label class="hcms-label" for="slide_desc_${idx}">Description <span class="hcms-label-hint">(optional)</span></label>
                  <textarea id="slide_desc_${idx}" class="hcms-textarea slide-field" data-idx="${idx}" data-key="description"
                    placeholder="Brief supporting text...">${escapeHtml(slide.description || '')}</textarea>
                </div>
              </div>
            </div>

            <!-- Group 2: Background Media -->
            <div class="hcms-editor-group">
              <div class="hcms-editor-group-header"><i class="fas fa-photo-film"></i> Background Media</div>
              <div class="hcms-editor-group-body">
                <div class="hcms-field-group">
                  <label class="hcms-label">Media Type</label>
                  <div class="hcms-media-type-toggle">
                    <button type="button" class="hcms-media-type-btn ${!isVideo ? 'active' : ''} slide-media-type-btn" data-idx="${idx}" data-type="image">
                      <i class="fas fa-image"></i> Image
                    </button>
                    <button type="button" class="hcms-media-type-btn ${isVideo ? 'active' : ''} slide-media-type-btn" data-idx="${idx}" data-type="video">
                      <i class="fas fa-video"></i> Video
                    </button>
                  </div>
                </div>
                <div class="hcms-field-group">
                  <label class="hcms-label">${isVideo ? 'Background Video' : 'Background Image'}</label>
                  <div class="hcms-media-block">
                    <div class="hcms-media-preview-area" id="slideMediaPreview_${idx}">
                      ${previewMedia
                        ? `<img src="${escapeHtml(previewMedia)}" alt="Media preview" style="max-height:200px; width:100%; object-fit:cover;" onerror="this.parentElement.innerHTML='<div class=hcms-media-empty-state><i class=\\'fas fa-image\\'></i><span>Could not load preview</span></div>'" />`
                        : `<div class="hcms-media-empty-state"><i class="fas ${isVideo ? 'fa-video' : 'fa-image'}"></i><span>No ${isVideo ? 'video' : 'image'} selected</span></div>`
                      }
                    </div>
                    <div class="hcms-media-actions">
                      <button type="button" class="hcms-media-replace-btn open-media-picker-btn"
                        data-target="slideMediaUrl_${idx}" data-type="${isVideo ? 'video' : 'image'}">
                        <i class="fas fa-folder-open"></i> Replace ${isVideo ? 'Video' : 'Image'}
                      </button>
                      <input type="hidden" id="slideMediaUrl_${idx}" class="slide-field" data-idx="${idx}"
                        data-key="${isVideo ? 'videoUrl' : 'imageUrl'}" value="${escapeHtml(isVideo ? (slide.videoUrl || '') : (slide.imageUrl || ''))}" />
                    </div>
                  </div>
                </div>
                ${isVideo ? `
                  <div class="hcms-field-group">
                    <label class="hcms-label">Poster / Fallback Image <span class="hcms-label-hint">(shown before video loads)</span></label>
                    <div class="hcms-url-field-wrap">
                      <input type="text" id="imageUrl_${idx}" class="hcms-input slide-field" data-idx="${idx}" data-key="imageUrl"
                        value="${escapeHtml(slide.imageUrl || '')}" placeholder="https://..." />
                      <button type="button" class="hcms-media-replace-btn open-media-picker-btn" data-target="imageUrl_${idx}" data-type="image"
                        style="flex-shrink:0; white-space:nowrap;">
                        <i class="fas fa-image"></i> Pick
                      </button>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Group 3: Buttons -->
            <div class="hcms-editor-group">
              <div class="hcms-editor-group-header"><i class="fas fa-hand-pointer"></i> Action Buttons</div>
              <div class="hcms-editor-group-body">
                <div class="hcms-btn-editor-pair">
                  <div class="hcms-btn-editor-card">
                    <div class="hcms-btn-editor-label">Primary Button</div>
                    <span class="hcms-btn-preview-chip primary-chip">${escapeHtml(slide.primaryBtnText || 'Explore Our Car')}</span>
                    <div class="hcms-field-group">
                      <label class="hcms-label" for="slide_pBtnText_${idx}">Button Text</label>
                      <input type="text" id="slide_pBtnText_${idx}" class="hcms-input hcms-input-sm slide-field" data-idx="${idx}" data-key="primaryBtnText"
                        value="${escapeHtml(slide.primaryBtnText || 'Explore Our Car')}" />
                    </div>
                    <div class="hcms-field-group">
                      <label class="hcms-label" for="slide_pBtnLink_${idx}">Destination</label>
                      <select id="slide_pBtnLink_${idx}" class="hcms-destination-select slide-link-select" data-idx="${idx}" data-key="primaryBtnLink">
                        ${renderDestinationOptions(slide.primaryBtnLink || 'car.html')}
                      </select>
                    </div>
                  </div>
                  <div class="hcms-btn-editor-card">
                    <div class="hcms-btn-editor-label">Secondary Button</div>
                    <span class="hcms-btn-preview-chip secondary-chip">${escapeHtml(slide.secondaryBtnText || 'Become a Sponsor')}</span>
                    <div class="hcms-field-group">
                      <label class="hcms-label" for="slide_sBtnText_${idx}">Button Text</label>
                      <input type="text" id="slide_sBtnText_${idx}" class="hcms-input hcms-input-sm slide-field" data-idx="${idx}" data-key="secondaryBtnText"
                        value="${escapeHtml(slide.secondaryBtnText || 'Become a Sponsor')}" />
                    </div>
                    <div class="hcms-field-group">
                      <label class="hcms-label" for="slide_sBtnLink_${idx}">Destination</label>
                      <select id="slide_sBtnLink_${idx}" class="hcms-destination-select slide-link-select" data-idx="${idx}" data-key="secondaryBtnLink">
                        ${renderDestinationOptions(slide.secondaryBtnLink || 'sponsors.html')}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Group 4: Advanced Settings -->
            <div>
              <button type="button" class="hcms-advanced-toggle" data-adv="slideAdv_${idx}">
                <i class="fas fa-cog"></i> Advanced Settings
                <i class="fas fa-chevron-down hcms-adv-chevron"></i>
              </button>
              <div class="hcms-advanced-body" id="slideAdv_${idx}">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
                  <div class="hcms-field-group">
                    <label class="hcms-label" for="slide_overlay_${idx}">Overlay Darkness <span class="hcms-label-hint">(%)</span></label>
                    <input type="range" min="0" max="90" step="5" class="form-range slide-field" id="slide_overlay_${idx}" data-idx="${idx}" data-key="overlayOpacity"
                      value="${slide.overlayOpacity !== undefined ? slide.overlayOpacity : 40}"
                      oninput="document.getElementById('slideOverlayVal_${idx}').textContent = this.value + '%'" />
                    <div style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-secondary); margin-top:4px;" id="slideOverlayVal_${idx}">${slide.overlayOpacity !== undefined ? slide.overlayOpacity : 40}%</div>
                  </div>
                  <div class="hcms-field-group">
                    <label class="hcms-label">Video URL <span class="hcms-label-hint">(advanced)</span></label>
                    <input type="text" class="hcms-input hcms-input-sm slide-field" data-idx="${idx}" data-key="videoUrl"
                      value="${escapeHtml(slide.videoUrl || '')}" placeholder="https://..." />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    `;
  }

  function renderStatCard(stat, idx) {
    return `
      <div class="hcms-stat-card" data-stat-index="${idx}">
        <div class="hcms-stat-card-header">
          <span class="hcms-stat-card-tag">STAT ${String(idx + 1).padStart(2, '0')}</span>
          <button type="button" class="hcms-action-btn danger" data-action="delete-hero-stat" data-idx="${idx}" title="Remove stat"
            style="padding:3px 8px; font-size:0.65rem;">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="hcms-stat-preview">
          <div class="hcms-stat-preview-val">${escapeHtml(stat.value || '—')}<span>${escapeHtml(stat.unit || '')}</span></div>
          <div class="hcms-stat-preview-label">${escapeHtml(stat.label || 'Label')}</div>
        </div>
        <div class="hcms-field-group">
          <label class="hcms-label" for="stat_val_${idx}">Value</label>
          <input type="text" id="stat_val_${idx}" class="hcms-input hcms-input-sm stat-field" data-idx="${idx}" data-key="value"
            value="${escapeHtml(stat.value || '')}" placeholder="e.g. 3.2" />
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
          <div class="hcms-field-group">
            <label class="hcms-label" for="stat_unit_${idx}">Unit</label>
            <input type="text" id="stat_unit_${idx}" class="hcms-input hcms-input-sm stat-field" data-idx="${idx}" data-key="unit"
              value="${escapeHtml(stat.unit || '')}" placeholder="s, km/h" />
          </div>
          <div class="hcms-field-group">
            <label class="hcms-label" for="stat_sub_${idx}">Subtext</label>
            <input type="text" id="stat_sub_${idx}" class="hcms-input hcms-input-sm stat-field" data-idx="${idx}" data-key="subtitle"
              value="${escapeHtml(stat.subtitle || '')}" placeholder="e.g. Acceleration" />
          </div>
        </div>
        <div class="hcms-field-group">
          <label class="hcms-label" for="stat_label_${idx}">Label</label>
          <input type="text" id="stat_label_${idx}" class="hcms-input hcms-input-sm stat-field" data-idx="${idx}" data-key="label"
            value="${escapeHtml(stat.label || '')}" placeholder="e.g. 0-100 KM/H" />
        </div>
      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // SECTION 02 — CAR & STORY
  // ──────────────────────────────────────────────────────────
  function renderSectionCarStory(story = {}) {
    const cards = story.cards || [];
    const previewMedia = story.posterUrl || story.mainMediaUrl;

    return `
      <section class="hcms-section open" id="hcmsSection02">
        <div class="hcms-section-header" data-toggle="hcmsSection02">
          <div class="hcms-section-num">02</div>
          <div class="hcms-section-meta">
            <h2 class="hcms-section-name">CAR & STORY</h2>
            <p class="hcms-section-desc">Vehicle showcase and the engineering journey shown below the hero.</p>
          </div>
          <div class="hcms-section-header-right">
            <span class="hcms-count-badge">${cards.length} Build Stage${cards.length !== 1 ? 's' : ''}</span>
            <i class="fas fa-chevron-down hcms-chevron"></i>
          </div>
        </div>

        <div class="hcms-section-body">
          <div class="hcms-context-help">
            <i class="fas fa-circle-info"></i>
            The vehicle showcase appears after the hero. The build stages form the horizontal engineering story below it.
          </div>

          <!-- Vehicle Showcase -->
          <div class="hcms-sub-panel">
            <div class="hcms-sub-panel-header">
              <h3 class="hcms-sub-panel-title"><i class="fas fa-car-side"></i> Vehicle Showcase</h3>
            </div>
            <div class="hcms-sub-panel-body">
              <div class="hcms-showcase-card" id="hcmsShowcaseCard">
                <div class="hcms-showcase-preview">
                  <div class="hcms-showcase-media">
                    ${previewMedia
                      ? `<img src="${escapeHtml(previewMedia)}" alt="Vehicle media" onerror="this.style.display='none'" />`
                      : `<div class="hcms-no-media" style="display:flex;flex-direction:column;align-items:center;gap:6px;color:var(--text-muted);padding:30px;"><i class="fas fa-car" style="font-size:2rem;opacity:0.3;"></i><span style="font-size:0.75rem;">No media</span></div>`
                    }
                  </div>
                  <div class="hcms-showcase-info">
                    <div>
                      <div class="hcms-showcase-badge">${escapeHtml(story.subheading || 'ENGINEERING & BUILD STORY')}</div>
                      <div class="hcms-showcase-heading">${escapeHtml(story.heading || 'THE EVOLUTION OF ASHWA')}</div>
                      <div class="hcms-showcase-cta-preview"><i class="fas fa-arrow-right" style="margin-right:4px;color:var(--accent-orange,#FF5A00);"></i> ${escapeHtml(story.ctaText || 'Inspect Car Specs')}</div>
                    </div>
                  </div>
                </div>
                <div class="hcms-showcase-edit-row">
                  <button type="button" class="hcms-action-btn primary" data-action="edit-showcase">
                    <i class="fas fa-pen-to-square"></i> Edit Showcase
                  </button>
                </div>
              </div>

              <!-- Showcase Inline Editor -->
              <div class="hcms-inline-editor ${openEditorIdx['showcase'] ? 'open' : ''}" id="hcmsShowcaseEditor" style="border-radius:6px; border:1px solid rgba(255,90,0,0.15); margin-top:12px; border-top:1px solid rgba(255,90,0,0.15);">
                <div class="hcms-editor-groups">
                  <div class="hcms-editor-grid-2">
                    <div class="hcms-field-group">
                      <label class="hcms-label" for="carStory_heading">Section Heading</label>
                      <input type="text" id="carStory_heading" class="hcms-input" value="${escapeHtml(story.heading || '')}" />
                    </div>
                    <div class="hcms-field-group">
                      <label class="hcms-label" for="carStory_subheading">Badge / Subheading</label>
                      <input type="text" id="carStory_subheading" class="hcms-input" value="${escapeHtml(story.subheading || '')}" />
                    </div>
                    <div class="hcms-field-group">
                      <label class="hcms-label" for="carStory_ctaText">CTA Button Text</label>
                      <input type="text" id="carStory_ctaText" class="hcms-input" value="${escapeHtml(story.ctaText || 'Inspect Car Specs')}" />
                    </div>
                    <div class="hcms-field-group">
                      <label class="hcms-label" for="carStory_ctaLink">CTA Destination</label>
                      <select id="carStory_ctaLink" class="hcms-destination-select">
                        ${renderDestinationOptions(story.ctaLink || 'car.html')}
                      </select>
                    </div>
                  </div>
                  <div class="hcms-field-group">
                    <label class="hcms-label">Vehicle Media</label>
                    <div class="hcms-media-block">
                      <div class="hcms-media-preview-area">
                        ${previewMedia
                          ? `<img src="${escapeHtml(previewMedia)}" alt="Vehicle preview" style="max-height:180px;width:100%;object-fit:cover;" />`
                          : `<div class="hcms-media-empty-state"><i class="fas fa-car"></i><span>No media selected</span></div>`
                        }
                      </div>
                      <div class="hcms-media-actions">
                        <button type="button" class="hcms-media-replace-btn open-media-picker-btn" data-target="carStory_mainMediaUrl" data-type="all">
                          <i class="fas fa-folder-open"></i> Replace Media
                        </button>
                        <input type="text" id="carStory_mainMediaUrl" class="hcms-input hcms-input-sm" style="display:none;"
                          value="${escapeHtml(story.mainMediaUrl || '')}" />
                        <input type="text" id="carStory_posterUrl" class="hcms-input hcms-input-sm" style="display:none;"
                          value="${escapeHtml(story.posterUrl || '')}" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Build Journey -->
          <div class="hcms-sub-panel">
            <div class="hcms-sub-panel-header">
              <div>
                <h3 class="hcms-sub-panel-title"><i class="fas fa-layer-group"></i> Build Journey</h3>
                <p class="hcms-sub-panel-desc">These cards create the horizontal engineering story on the homepage.</p>
              </div>
              <button type="button" class="hcms-add-btn" id="hcmsAddStageBtn">
                <i class="fas fa-plus"></i> Add Stage
              </button>
            </div>
            <div class="hcms-sub-panel-body">
              <div class="hcms-card-list" id="hcmsStagesList">
                ${cards.length === 0
                  ? renderEmptyState('fa-layer-group', 'No build stages yet', 'Add stages to build the engineering journey section.', 'hcmsAddStageBtn2', '+ Add First Stage')
                  : cards.map((c, idx) => renderStageCard(c, idx, cards.length)).join('')
                }
              </div>
              ${cards.length > 0 ? `
                <button type="button" class="hcms-add-btn hcms-add-btn-large" id="hcmsAddStageBtn2">
                  <i class="fas fa-plus"></i> Add Stage
                </button>
              ` : ''}
            </div>
          </div>

        </div>
      </section>
    `;
  }

  function renderStageCard(card, idx, total) {
    const isEditorOpen = openEditorIdx['stage_' + idx] === true;
    return `
      <div class="hcms-content-card ${isEditorOpen ? 'editing' : ''}" id="hcmsStageCard_${idx}" data-stage-index="${idx}">

        <div class="hcms-card-top">
          <div class="hcms-card-id-row">
            <span class="hcms-card-num">STAGE ${escapeHtml(card.stageNumber || String(idx + 1).padStart(2, '0'))}</span>
            <span class="hcms-card-label">${escapeHtml(card.title || 'Untitled Stage')}</span>
          </div>
        </div>

        <div class="hcms-card-preview">
          <div class="hcms-card-media-thumb">
            ${card.imageUrl
              ? `<img src="${escapeHtml(card.imageUrl)}" alt="Stage ${idx + 1}" onerror="this.style.display='none'" /><div class="hcms-card-media-overlay"></div>`
              : `<div class="hcms-no-media"><i class="fas fa-image"></i><span>No photo</span></div>`
            }
          </div>
          <div class="hcms-card-content">
            <div class="hcms-card-content-top">
              ${card.subtitle ? `<div class="hcms-card-badge-text">${escapeHtml(card.subtitle)}</div>` : ''}
              <div class="hcms-card-headline">${escapeHtml(card.title || 'Stage title')}</div>
              ${card.description ? `<div class="hcms-card-excerpt">${escapeHtml(card.description)}</div>` : ''}
            </div>
          </div>
        </div>

        <div class="hcms-card-actions">
          <button type="button" class="hcms-action-btn primary" data-action="edit-stage" data-idx="${idx}">
            <i class="fas fa-pen-to-square"></i> Edit Stage
          </button>
          <div class="hcms-action-sep"></div>
          <button type="button" class="hcms-action-btn" data-action="move-stage-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button type="button" class="hcms-action-btn" data-action="move-stage-down" data-idx="${idx}" ${idx === total - 1 ? 'disabled' : ''} title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button type="button" class="hcms-action-btn danger" data-action="delete-stage" data-idx="${idx}" title="Delete stage"><i class="fas fa-trash"></i></button>
        </div>

        <!-- Inline Editor -->
        <div class="hcms-inline-editor ${isEditorOpen ? 'open' : ''}" id="hcmsStageEditor_${idx}">
          <div class="hcms-editor-groups">
            <div class="hcms-editor-grid-2">
              <div class="hcms-field-group">
                <label class="hcms-label" for="stage_title_${idx}">Stage Title</label>
                <input type="text" id="stage_title_${idx}" class="hcms-input stage-field" data-idx="${idx}" data-key="title"
                  value="${escapeHtml(card.title || '')}" placeholder="e.g. Concept & Targets" />
              </div>
              <div class="hcms-field-group">
                <label class="hcms-label" for="stage_sub_${idx}">Milestone / Year</label>
                <input type="text" id="stage_sub_${idx}" class="hcms-input stage-field" data-idx="${idx}" data-key="subtitle"
                  value="${escapeHtml(card.subtitle || '')}" placeholder="e.g. Formula Bharat 2026" />
              </div>
            </div>
            <div class="hcms-field-group">
              <label class="hcms-label" for="stage_desc_${idx}">Description</label>
              <textarea id="stage_desc_${idx}" class="hcms-textarea stage-field" data-idx="${idx}" data-key="description"
                placeholder="Stage details...">${escapeHtml(card.description || '')}</textarea>
            </div>
            <div class="hcms-field-group">
              <label class="hcms-label">Stage Photo</label>
              <div class="hcms-media-block">
                <div class="hcms-media-preview-area" id="stageMediaPreview_${idx}">
                  ${card.imageUrl
                    ? `<img src="${escapeHtml(card.imageUrl)}" alt="Stage preview" style="max-height:160px;width:100%;object-fit:cover;" />`
                    : `<div class="hcms-media-empty-state"><i class="fas fa-image"></i><span>No photo selected</span></div>`
                  }
                </div>
                <div class="hcms-media-actions">
                  <button type="button" class="hcms-media-replace-btn open-media-picker-btn" data-target="stageImg_${idx}" data-type="image">
                    <i class="fas fa-folder-open"></i> Replace Photo
                  </button>
                  <input type="text" id="stageImg_${idx}" class="stage-field" data-idx="${idx}" data-key="imageUrl"
                    value="${escapeHtml(card.imageUrl || '')}" style="display:none;" />
                </div>
              </div>
            </div>
            <div>
              <button type="button" class="hcms-advanced-toggle" data-adv="stageAdv_${idx}">
                <i class="fas fa-cog"></i> Advanced Settings <i class="fas fa-chevron-down hcms-adv-chevron"></i>
              </button>
              <div class="hcms-advanced-body" id="stageAdv_${idx}">
                <div class="hcms-field-group">
                  <label class="hcms-label" for="stage_num_${idx}">Stage Code / Number</label>
                  <input type="text" id="stage_num_${idx}" class="hcms-input hcms-input-sm stage-field" data-idx="${idx}" data-key="stageNumber"
                    value="${escapeHtml(card.stageNumber || String(idx + 1).padStart(2, '0'))}" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // SECTION 03 — NEWS
  // ──────────────────────────────────────────────────────────
  function renderSectionNews(news = {}) {
    const articles = news.articles || [];

    return `
      <section class="hcms-section open" id="hcmsSection03">
        <div class="hcms-section-header" data-toggle="hcmsSection03">
          <div class="hcms-section-num">03</div>
          <div class="hcms-section-meta">
            <h2 class="hcms-section-name">NEWS & TRACK UPDATES</h2>
            <p class="hcms-section-desc">Latest team updates and engineering news displayed on the homepage.</p>
          </div>
          <div class="hcms-section-header-right">
            <span class="hcms-count-badge">${articles.length} Article${articles.length !== 1 ? 's' : ''}</span>
            <i class="fas fa-chevron-down hcms-chevron"></i>
          </div>
        </div>

        <div class="hcms-section-body">
          <div class="hcms-context-help">
            <i class="fas fa-circle-info"></i>
            These articles appear in the homepage news section. Add cover images for best visual impact.
          </div>

          <div class="hcms-sub-panel">
            <div class="hcms-sub-panel-header">
              <div>
                <h3 class="hcms-sub-panel-title"><i class="fas fa-newspaper"></i> Homepage Articles</h3>
                <p class="hcms-sub-panel-desc">Manage the news cards displayed on the homepage.</p>
              </div>
              <button type="button" class="hcms-add-btn" id="hcmsAddArticleBtn">
                <i class="fas fa-plus"></i> Add Article
              </button>
            </div>
            <div class="hcms-sub-panel-body">
              <div class="hcms-card-list" id="hcmsArticlesList">
                ${articles.length === 0
                  ? renderEmptyState('fa-newspaper', 'No homepage articles yet', 'Add articles to populate the news section.', 'hcmsAddArticleBtn2', '+ Add Article')
                  : articles.map((a, idx) => renderArticleCard(a, idx, articles.length)).join('')
                }
              </div>
              ${articles.length > 0 ? `
                <button type="button" class="hcms-add-btn hcms-add-btn-large" id="hcmsAddArticleBtn2">
                  <i class="fas fa-plus"></i> Add Article
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Section Heading (Advanced) -->
          <div class="hcms-sub-panel">
            <div class="hcms-sub-panel-header">
              <h3 class="hcms-sub-panel-title"><i class="fas fa-heading"></i> Section Heading</h3>
            </div>
            <div class="hcms-sub-panel-body">
              <div class="hcms-editor-grid-2">
                <div class="hcms-field-group">
                  <label class="hcms-label" for="news_heading">Section Heading</label>
                  <input type="text" id="news_heading" class="hcms-input" value="${escapeHtml(news.heading || "What's Happening")}" />
                </div>
                <div class="hcms-field-group">
                  <label class="hcms-label" for="news_subheading">Subheading / Badge</label>
                  <input type="text" id="news_subheading" class="hcms-input" value="${escapeHtml(news.subheading || 'Latest News')}" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    `;
  }

  function renderArticleCard(article, idx, total) {
    const isEditorOpen = openEditorIdx['article_' + idx] === true;
    const dateStr = article.date || '';

    return `
      <div class="hcms-content-card ${isEditorOpen ? 'editing' : ''}" id="hcmsArticleCard_${idx}" data-article-index="${idx}">

        <div class="hcms-card-top">
          <div class="hcms-card-id-row">
            <span class="hcms-card-num">${escapeHtml(article.category || 'News')}</span>
            <span class="hcms-card-label">${escapeHtml(article.title || 'Untitled Article')}</span>
          </div>
          <span style="font-size:0.72rem; color:var(--text-muted,#666672);">${escapeHtml(dateStr)}</span>
        </div>

        <div class="hcms-card-preview">
          <div class="hcms-card-media-thumb">
            ${article.imageUrl
              ? `<img src="${escapeHtml(article.imageUrl)}" alt="Article cover" onerror="this.style.display='none'" /><div class="hcms-card-media-overlay"></div>`
              : `<div class="hcms-no-media"><i class="fas fa-image"></i><span>No cover</span></div>`
            }
          </div>
          <div class="hcms-card-content">
            <div class="hcms-card-content-top">
              <div class="hcms-card-headline">${escapeHtml(article.title || 'Article Title')}</div>
              ${article.excerpt ? `<div class="hcms-card-excerpt">${escapeHtml(article.excerpt)}</div>` : ''}
            </div>
            <div style="margin-top:8px; font-size:0.72rem; color:var(--text-muted,#666672);">
              ${article.readTime ? `<i class="fas fa-clock" style="margin-right:4px;"></i>${escapeHtml(article.readTime)}` : ''}
              ${article.featured ? '<span style="margin-left:10px; background:rgba(255,90,0,0.1); color:var(--accent-orange,#FF5A00); padding:2px 7px; border-radius:3px; font-size:0.65rem; font-weight:700; border:1px solid rgba(255,90,0,0.2);">FEATURED</span>' : ''}
            </div>
          </div>
        </div>

        <div class="hcms-card-actions">
          <button type="button" class="hcms-action-btn primary" data-action="edit-article" data-idx="${idx}">
            <i class="fas fa-pen-to-square"></i> Edit Article
          </button>
          <div class="hcms-action-sep"></div>
          <button type="button" class="hcms-action-btn" data-action="move-article-up" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''} title="Move Up"><i class="fas fa-arrow-up"></i></button>
          <button type="button" class="hcms-action-btn" data-action="move-article-down" data-idx="${idx}" ${idx === total - 1 ? 'disabled' : ''} title="Move Down"><i class="fas fa-arrow-down"></i></button>
          <button type="button" class="hcms-action-btn danger" data-action="delete-article" data-idx="${idx}" title="Delete article"><i class="fas fa-trash"></i></button>
        </div>

        <!-- Inline Editor -->
        <div class="hcms-inline-editor ${isEditorOpen ? 'open' : ''}" id="hcmsArticleEditor_${idx}">
          <div class="hcms-editor-groups">
            <div class="hcms-editor-group">
              <div class="hcms-editor-group-header"><i class="fas fa-pen"></i> Article Content</div>
              <div class="hcms-editor-group-body">
                <div class="hcms-field-group">
                  <label class="hcms-label" for="art_title_${idx}">Title</label>
                  <input type="text" id="art_title_${idx}" class="hcms-input article-field" data-idx="${idx}" data-key="title"
                    value="${escapeHtml(article.title || '')}" placeholder="Article headline" />
                </div>
                <div class="hcms-editor-grid-2">
                  <div class="hcms-field-group">
                    <label class="hcms-label" for="art_cat_${idx}">Category</label>
                    <input type="text" id="art_cat_${idx}" class="hcms-input article-field" data-idx="${idx}" data-key="category"
                      value="${escapeHtml(article.category || 'News Update')}" placeholder="e.g. Engineering, Track Report" />
                  </div>
                  <div class="hcms-field-group">
                    <label class="hcms-label" for="art_date_${idx}">Publication Date</label>
                    <input type="text" id="art_date_${idx}" class="hcms-input article-field" data-idx="${idx}" data-key="date"
                      value="${escapeHtml(article.date || '')}" placeholder="e.g. Sep 16, 2026" />
                  </div>
                </div>
                <div class="hcms-field-group">
                  <label class="hcms-label" for="art_excerpt_${idx}">Summary</label>
                  <textarea id="art_excerpt_${idx}" class="hcms-textarea article-field" data-idx="${idx}" data-key="excerpt"
                    placeholder="Short description...">${escapeHtml(article.excerpt || '')}</textarea>
                </div>
              </div>
            </div>

            <div class="hcms-editor-group">
              <div class="hcms-editor-group-header"><i class="fas fa-image"></i> Cover Image</div>
              <div class="hcms-editor-group-body">
                <div class="hcms-media-block">
                  <div class="hcms-media-preview-area">
                    ${article.imageUrl
                      ? `<img src="${escapeHtml(article.imageUrl)}" alt="Cover" style="max-height:180px;width:100%;object-fit:cover;" />`
                      : `<div class="hcms-media-empty-state"><i class="fas fa-image"></i><span>No cover image</span></div>`
                    }
                  </div>
                  <div class="hcms-media-actions">
                    <button type="button" class="hcms-media-replace-btn open-media-picker-btn" data-target="artImg_${idx}" data-type="image">
                      <i class="fas fa-folder-open"></i> Replace Image
                    </button>
                    <input type="text" id="artImg_${idx}" class="article-field" data-idx="${idx}" data-key="imageUrl"
                      value="${escapeHtml(article.imageUrl || '')}" style="display:none;" />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <button type="button" class="hcms-advanced-toggle" data-adv="artAdv_${idx}">
                <i class="fas fa-cog"></i> Advanced Settings <i class="fas fa-chevron-down hcms-adv-chevron"></i>
              </button>
              <div class="hcms-advanced-body" id="artAdv_${idx}">
                <div class="hcms-editor-grid-2">
                  <div class="hcms-field-group">
                    <label class="hcms-label" for="art_link_${idx}">Article URL</label>
                    <input type="text" id="art_link_${idx}" class="hcms-input hcms-input-sm article-field" data-idx="${idx}" data-key="link"
                      value="${escapeHtml(article.link || 'news.html')}" placeholder="news.html" />
                  </div>
                  <div class="hcms-field-group">
                    <label class="hcms-label" for="art_read_${idx}">Read Time</label>
                    <input type="text" id="art_read_${idx}" class="hcms-input hcms-input-sm article-field" data-idx="${idx}" data-key="readTime"
                      value="${escapeHtml(article.readTime || '3 min read')}" placeholder="3 min read" />
                  </div>
                </div>
                <div class="hcms-field-group" style="margin-top:10px;">
                  <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.82rem; color:var(--text-secondary,#9A9AA5);">
                    <input type="checkbox" class="article-field-check" data-idx="${idx}" data-key="featured" ${article.featured ? 'checked' : ''} />
                    Feature this article on the homepage banner
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // SECTION 04 — SPONSORS & PARTNERS
  // ──────────────────────────────────────────────────────────
  function renderSectionSponsors(footer = {}) {
    const tiers = footer.tiers || [];
    const sponsorCta = footer.sponsorCta || {};

    return `
      <section class="hcms-section open" id="hcmsSection04">
        <div class="hcms-section-header" data-toggle="hcmsSection04">
          <div class="hcms-section-num">04</div>
          <div class="hcms-section-meta">
            <h2 class="hcms-section-name">SPONSORS & PARTNERS</h2>
            <p class="hcms-section-desc">Partner CTA banner and sponsor logos shown on the homepage.</p>
          </div>
          <div class="hcms-section-header-right">
            <span class="hcms-count-badge">${tiers.length} Tier${tiers.length !== 1 ? 's' : ''}</span>
            <i class="fas fa-chevron-down hcms-chevron"></i>
          </div>
        </div>

        <div class="hcms-section-body">
          <div class="hcms-context-help">
            <i class="fas fa-circle-info"></i>
            These logos and the partner invitation appear in the homepage sponsor area.
          </div>

          <!-- Partner CTA -->
          <div class="hcms-sub-panel">
            <div class="hcms-sub-panel-header">
              <h3 class="hcms-sub-panel-title"><i class="fas fa-handshake"></i> Partner with Ashwa Riders</h3>
            </div>
            <div class="hcms-sub-panel-body">
              <div class="hcms-cta-preview-card">
                <div class="hcms-cta-preview-heading">${escapeHtml(sponsorCta.title || 'ACCELERATE WITH US')}</div>
                <div class="hcms-cta-preview-sub">${escapeHtml(sponsorCta.subtitle || 'Empower the next generation of Formula Student engineers.')}</div>
                <div class="hcms-cta-preview-btn"><i class="fas fa-handshake"></i> ${escapeHtml(sponsorCta.btnText || 'Become a Partner')}</div>
              </div>
              <div class="hcms-editor-grid-2">
                <div class="hcms-field-group">
                  <label class="hcms-label" for="sponsorCta_title">Heading</label>
                  <input type="text" id="sponsorCta_title" class="hcms-input" value="${escapeHtml(sponsorCta.title || 'ACCELERATE WITH US')}" />
                </div>
                <div class="hcms-field-group">
                  <label class="hcms-label" for="sponsorCta_subtitle">Subtitle</label>
                  <input type="text" id="sponsorCta_subtitle" class="hcms-input" value="${escapeHtml(sponsorCta.subtitle || '')}" />
                </div>
                <div class="hcms-field-group">
                  <label class="hcms-label" for="sponsorCta_btnText">Button Text</label>
                  <input type="text" id="sponsorCta_btnText" class="hcms-input" value="${escapeHtml(sponsorCta.btnText || 'Become a Partner')}" />
                </div>
                <div class="hcms-field-group">
                  <label class="hcms-label" for="sponsorCta_btnLink">Button Destination</label>
                  <select id="sponsorCta_btnLink" class="hcms-destination-select">
                    ${renderDestinationOptions(sponsorCta.btnLink || 'sponsors.html')}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Sponsor Tiers -->
          <div class="hcms-sub-panel">
            <div class="hcms-sub-panel-header">
              <div>
                <h3 class="hcms-sub-panel-title"><i class="fas fa-building"></i> Sponsor Tiers</h3>
                <p class="hcms-sub-panel-desc">Organized by sponsorship tier. Each tier shows its logos on the homepage.</p>
              </div>
              <button type="button" class="hcms-add-btn" id="hcmsAddTierBtn">
                <i class="fas fa-plus"></i> Add Tier
              </button>
            </div>
            <div class="hcms-sub-panel-body">
              <div id="hcmsTiersList">
                ${tiers.length === 0
                  ? renderEmptyState('fa-building', 'No sponsor tiers added', 'Add tiers to show partner logos on the homepage.', 'hcmsAddTierBtn2', '+ Add Sponsor Tier')
                  : tiers.map((t, idx) => renderTierCard(t, idx, tiers.length)).join('')
                }
              </div>
              ${tiers.length > 0 ? `
                <button type="button" class="hcms-add-btn hcms-add-btn-large" id="hcmsAddTierBtn2">
                  <i class="fas fa-plus"></i> Add Tier
                </button>
              ` : ''}
            </div>
          </div>

          <!-- Global Footer Redirect -->
          <div class="hcms-sub-panel">
            <div class="hcms-sub-panel-header">
              <h3 class="hcms-sub-panel-title"><i class="fas fa-globe"></i> Global Footer</h3>
            </div>
            <div class="hcms-sub-panel-body">
              <div class="hcms-redirect-notice">
                <div class="hcms-redirect-icon"><i class="fas fa-arrow-right-arrow-left"></i></div>
                <div class="hcms-redirect-info">
                  <div class="hcms-redirect-label">Footer Branding &amp; Social Links</div>
                  <div class="hcms-redirect-desc">Tagline, social media links, and copyright notice are managed globally in Navigation &amp; Footer settings.</div>
                </div>
                <a href="#" class="hcms-redirect-link-btn" data-link="/admin/navigation">
                  <i class="fas fa-external-link-alt"></i> Open Footer Settings
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>
    `;
  }

  function renderTierCard(tier, tIdx, total) {
    const sponsors = tier.sponsors || [];
    return `
      <div class="hcms-tier-card" data-tier-index="${tIdx}">
        <div class="hcms-tier-header">
          <div class="hcms-tier-name-block">
            <span class="hcms-tier-badge">TIER ${String(tIdx + 1).padStart(2, '0')}</span>
            <input type="text" class="hcms-tier-name-input tier-name-input" data-tidx="${tIdx}"
              value="${escapeHtml(tier.name || 'Tier ' + (tIdx + 1))}" placeholder="Tier name" aria-label="Tier name" />
            <select class="hcms-tier-size-select tier-size-select" data-tidx="${tIdx}" aria-label="Logo display size">
              <option value="large" ${tier.displaySize === 'large' ? 'selected' : ''}>Large Logos</option>
              <option value="medium" ${(!tier.displaySize || tier.displaySize === 'medium') ? 'selected' : ''}>Medium</option>
              <option value="small" ${tier.displaySize === 'small' ? 'selected' : ''}>Small</option>
            </select>
          </div>
          <div class="hcms-tier-actions">
            <button type="button" class="hcms-add-btn add-sponsor-to-tier-btn" data-tidx="${tIdx}" style="border-style:solid; font-size:0.68rem;">
              <i class="fas fa-plus"></i> Add Logo
            </button>
            <button type="button" class="hcms-action-btn danger" data-action="delete-tier" data-tidx="${tIdx}" title="Delete tier"
              style="padding:5px 10px; font-size:0.72rem;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="hcms-tier-logos-grid" id="tierLogosGrid_${tIdx}">
          ${sponsors.length === 0
            ? `<div style="grid-column:1/-1; color:var(--text-muted,#666672); font-size:0.78rem; text-align:center; padding:16px 0;">No logos yet — click Add Logo to add partners.</div>`
            : sponsors.map((s, sIdx) => renderLogoCard(s, tIdx, sIdx)).join('')
          }
        </div>
      </div>
    `;
  }

  function renderLogoCard(sponsor, tIdx, sIdx) {
    return `
      <div class="hcms-logo-card" data-tidx="${tIdx}" data-sidx="${sIdx}">
        <div class="hcms-logo-card-header">
          <span class="hcms-logo-name-preview">${escapeHtml(sponsor.name || 'Partner')}</span>
          <button type="button" class="hcms-action-btn danger" data-action="delete-tier-sponsor" data-tidx="${tIdx}" data-sidx="${sIdx}"
            style="padding:2px 7px; font-size:0.65rem;"><i class="fas fa-times"></i></button>
        </div>
        ${sponsor.logoUrl ? `
          <div class="hcms-logo-img-preview">
            <img src="${escapeHtml(sponsor.logoUrl)}" alt="${escapeHtml(sponsor.name || 'logo')}" onerror="this.style.display='none'" />
          </div>
        ` : ''}
        <div class="hcms-field-group" style="margin-bottom:6px;">
          <input type="text" class="hcms-input hcms-input-sm tier-sponsor-field" data-tidx="${tIdx}" data-sidx="${sIdx}" data-key="name"
            value="${escapeHtml(sponsor.name || '')}" placeholder="Company Name" />
        </div>
        <div class="hcms-field-group" style="margin-bottom:6px;">
          <div style="display:flex; gap:6px;">
            <input type="text" id="spLogo_${tIdx}_${sIdx}" class="hcms-input hcms-input-sm tier-sponsor-field" data-tidx="${tIdx}" data-sidx="${sIdx}" data-key="logoUrl"
              value="${escapeHtml(sponsor.logoUrl || '')}" placeholder="Logo URL" style="flex:1;" />
            <button type="button" class="hcms-media-replace-btn open-media-picker-btn" data-target="spLogo_${tIdx}_${sIdx}" data-type="image"
              style="flex-shrink:0; padding:4px 8px; font-size:0.65rem; white-space:nowrap;">
              <i class="fas fa-image"></i>
            </button>
          </div>
        </div>
        <div class="hcms-field-group" style="margin-bottom:0;">
          <input type="text" class="hcms-input hcms-input-sm tier-sponsor-field" data-tidx="${tIdx}" data-sidx="${sIdx}" data-key="websiteUrl"
            value="${escapeHtml(sponsor.websiteUrl || '')}" placeholder="Website URL (https://...)" />
        </div>
      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // HELPER: Destination Dropdown Options
  // ──────────────────────────────────────────────────────────
  function renderDestinationOptions(current) {
    const pages = [
      { label: 'Home', value: 'index.html' },
      { label: 'About', value: 'about.html' },
      { label: 'Team', value: 'Team.html' },
      { label: 'Car', value: 'car.html' },
      { label: 'Gallery', value: 'gallery.html' },
      { label: 'Sponsors', value: 'sponsors.html' },
      { label: 'Achievements', value: 'achievements.html' },
      { label: 'Contact', value: 'contact.html' },
      { label: 'Join Team', value: 'join.html' },
    ];

    const exactMatch = pages.find(p => p.value === current);
    const isCustom = !exactMatch && current;

    return pages.map(p =>
      `<option value="${p.value}" ${(current === p.value) ? 'selected' : ''}>${p.label}</option>`
    ).join('') +
    `<option value="__custom__" ${isCustom ? 'selected' : ''}>Custom URL...</option>` +
    (isCustom ? `<option value="${escapeHtml(current)}" selected style="display:none;">${escapeHtml(current)}</option>` : '');
  }

  // ──────────────────────────────────────────────────────────
  // HELPER: Empty State
  // ──────────────────────────────────────────────────────────
  function renderEmptyState(icon, title, desc, btnId, btnLabel) {
    return `
      <div class="hcms-empty-state">
        <i class="fas ${icon}"></i>
        <div class="hcms-empty-title">${escapeHtml(title)}</div>
        <div class="hcms-empty-desc">${escapeHtml(desc)}</div>
        <button type="button" class="hcms-add-btn" id="${escapeHtml(btnId)}" style="margin:0 auto;">
          <i class="fas fa-plus"></i> ${escapeHtml(btnLabel)}
        </button>
      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  // EVENT BINDINGS
  // ──────────────────────────────────────────────────────────
  function bindEvents(container) {

    // 1. Section accordion toggles
    container.querySelectorAll('.hcms-section-header').forEach(hdr => {
      hdr.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select') || e.target.closest('a')) return;
        const targetId = hdr.getAttribute('data-toggle');
        const section = document.getElementById(targetId);
        if (section) {
          section.classList.toggle('open');
          updateSectionNav();
        }
      });
    });

    // 2. Section nav scroll
    container.querySelectorAll('.hcms-section-nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const section = document.getElementById(targetId);
        if (section) {
          if (!section.classList.contains('open')) section.classList.add('open');
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          updateSectionNav();
        }
      });
    });

    function updateSectionNav() {
      const sections = ['hcmsSection01', 'hcmsSection02', 'hcmsSection03', 'hcmsSection04'];
      container.querySelectorAll('.hcms-section-nav-btn').forEach((btn, i) => {
        const sec = document.getElementById(sections[i]);
        btn.classList.toggle('active', sec ? sec.classList.contains('open') : false);
      });
    }

    // 3. Sticky bar scroll reveal
    const stickyBar = document.getElementById('hcmsStickyBar');
    const pageHeader = container.querySelector('.hcms-page-header');
    if (stickyBar && pageHeader) {
      const observer = new IntersectionObserver(([entry]) => {
        stickyBar.classList.toggle('visible', !entry.isIntersecting);
      }, { threshold: 0 });
      observer.observe(pageHeader);
    }

    // 4. Card edit toggles (slides, stages, articles, showcase)
    container.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;
      const action = actionBtn.getAttribute('data-action');
      const idx = parseInt(actionBtn.getAttribute('data-idx') ?? '-1', 10);

      switch (action) {
        case 'edit-slide':
          openEditorIdx['slide_' + idx] = !openEditorIdx['slide_' + idx];
          toggleEditor('hcmsSlideEditor_' + idx, openEditorIdx['slide_' + idx]);
          document.getElementById('hcmsSlideCard_' + idx)?.classList.toggle('editing', openEditorIdx['slide_' + idx]);
          break;

        case 'replace-slide-media':
          openMediaPickerForSlide(idx);
          break;

        case 'move-slide-up':
          if (idx > 0) {
            syncFormDataToState();
            const tmp = homeData.hero.slides[idx - 1];
            homeData.hero.slides[idx - 1] = homeData.hero.slides[idx];
            homeData.hero.slides[idx] = tmp;
            markDirty();
            renderInterface(container);
          }
          break;

        case 'move-slide-down':
          if (idx < homeData.hero.slides.length - 1) {
            syncFormDataToState();
            const tmp2 = homeData.hero.slides[idx + 1];
            homeData.hero.slides[idx + 1] = homeData.hero.slides[idx];
            homeData.hero.slides[idx] = tmp2;
            markDirty();
            renderInterface(container);
          }
          break;

        case 'delete-slide':
          showDeleteConfirm('Delete this slide from the homepage carousel?', () => {
            syncFormDataToState();
            homeData.hero.slides.splice(idx, 1);
            markDirty();
            renderInterface(container);
          });
          break;

        case 'edit-showcase':
          openEditorIdx['showcase'] = !openEditorIdx['showcase'];
          toggleEditor('hcmsShowcaseEditor', openEditorIdx['showcase']);
          break;

        case 'edit-stage':
          openEditorIdx['stage_' + idx] = !openEditorIdx['stage_' + idx];
          toggleEditor('hcmsStageEditor_' + idx, openEditorIdx['stage_' + idx]);
          document.getElementById('hcmsStageCard_' + idx)?.classList.toggle('editing', openEditorIdx['stage_' + idx]);
          break;

        case 'move-stage-up':
          if (idx > 0) {
            syncFormDataToState();
            const t3 = homeData.carStory.cards[idx - 1];
            homeData.carStory.cards[idx - 1] = homeData.carStory.cards[idx];
            homeData.carStory.cards[idx] = t3;
            markDirty(); renderInterface(container);
          }
          break;

        case 'move-stage-down':
          if (idx < homeData.carStory.cards.length - 1) {
            syncFormDataToState();
            const t4 = homeData.carStory.cards[idx + 1];
            homeData.carStory.cards[idx + 1] = homeData.carStory.cards[idx];
            homeData.carStory.cards[idx] = t4;
            markDirty(); renderInterface(container);
          }
          break;

        case 'delete-stage':
          showDeleteConfirm('Delete this build stage?', () => {
            syncFormDataToState();
            homeData.carStory.cards.splice(idx, 1);
            markDirty(); renderInterface(container);
          });
          break;

        case 'edit-article':
          openEditorIdx['article_' + idx] = !openEditorIdx['article_' + idx];
          toggleEditor('hcmsArticleEditor_' + idx, openEditorIdx['article_' + idx]);
          document.getElementById('hcmsArticleCard_' + idx)?.classList.toggle('editing', openEditorIdx['article_' + idx]);
          break;

        case 'move-article-up':
          if (idx > 0) {
            syncFormDataToState();
            const t5 = homeData.news.articles[idx - 1];
            homeData.news.articles[idx - 1] = homeData.news.articles[idx];
            homeData.news.articles[idx] = t5;
            markDirty(); renderInterface(container);
          }
          break;

        case 'move-article-down':
          if (idx < homeData.news.articles.length - 1) {
            syncFormDataToState();
            const t6 = homeData.news.articles[idx + 1];
            homeData.news.articles[idx + 1] = homeData.news.articles[idx];
            homeData.news.articles[idx] = t6;
            markDirty(); renderInterface(container);
          }
          break;

        case 'delete-article':
          showDeleteConfirm('Delete this article from the homepage?', () => {
            syncFormDataToState();
            homeData.news.articles.splice(idx, 1);
            markDirty(); renderInterface(container);
          });
          break;

        case 'delete-tier': {
          const tidx = parseInt(actionBtn.getAttribute('data-tidx') ?? '-1', 10);
          showDeleteConfirm('Delete this entire sponsor tier and its logos?', () => {
            syncFormDataToState();
            homeData.footerSponsors.tiers.splice(tidx, 1);
            markDirty(); renderInterface(container);
          });
          break;
        }

        case 'delete-tier-sponsor': {
          const ti = parseInt(actionBtn.getAttribute('data-tidx') ?? '-1', 10);
          const si = parseInt(actionBtn.getAttribute('data-sidx') ?? '-1', 10);
          syncFormDataToState();
          if (homeData.footerSponsors.tiers[ti]) {
            homeData.footerSponsors.tiers[ti].sponsors.splice(si, 1);
            markDirty(); renderInterface(container);
          }
          break;
        }

        case 'delete-hero-stat': {
          syncFormDataToState();
          homeData.hero.statsStrip.splice(idx, 1);
          markDirty(); renderInterface(container);
          break;
        }
      }
    });

    // 5. Add Slide
    const addSlideHandler = () => {
      syncFormDataToState();
      homeData.hero.slides.push({
        id: 'slide_' + Date.now(),
        badgeText: 'Ashwa Riders — 2026 Season',
        heading: 'NEW HERO SLIDE',
        highlightText: 'SLIDE',
        subtitle: 'Engineering Speed. Building Innovation. Racing the Future.',
        description: '',
        mediaType: 'image',
        imageUrl: '',
        videoUrl: '',
        posterUrl: '',
        primaryBtnText: 'Explore Our Car',
        primaryBtnLink: 'car.html',
        primaryBtnVisible: true,
        secondaryBtnText: 'Become a Sponsor',
        secondaryBtnLink: 'sponsors.html',
        secondaryBtnVisible: true,
        overlayOpacity: 40,
        textAlignment: 'center',
        status: 'published',
        order: homeData.hero.slides.length,
      });
      openEditorIdx['slide_' + (homeData.hero.slides.length - 1)] = true;
      markDirty();
      renderInterface(container);
    };
    document.getElementById('hcmsAddSlideBtn')?.addEventListener('click', addSlideHandler);
    document.getElementById('hcmsAddSlideBtn2')?.addEventListener('click', addSlideHandler);

    // 6. Add Stat
    const addStatHandler = () => {
      syncFormDataToState();
      homeData.hero.statsStrip.push({ value: '100', unit: '%', label: 'CUSTOM METRIC', subtitle: 'Telemetry Spec' });
      markDirty(); renderInterface(container);
    };
    document.getElementById('hcmsAddStatBtn')?.addEventListener('click', addStatHandler);
    document.getElementById('hcmsAddStatBtn2')?.addEventListener('click', addStatHandler);

    // 7. Add Stage
    const addStageHandler = () => {
      syncFormDataToState();
      const num = homeData.carStory.cards.length + 1;
      homeData.carStory.cards.push({
        stageNumber: String(num).padStart(2, '0'),
        title: 'New Build Stage',
        subtitle: 'Engineering Milestone',
        description: 'Detailed description of this vehicle construction stage...',
        imageUrl: '',
        order: num - 1,
      });
      openEditorIdx['stage_' + (homeData.carStory.cards.length - 1)] = true;
      markDirty(); renderInterface(container);
    };
    document.getElementById('hcmsAddStageBtn')?.addEventListener('click', addStageHandler);
    document.getElementById('hcmsAddStageBtn2')?.addEventListener('click', addStageHandler);

    // 8. Add Article
    const addArticleHandler = () => {
      syncFormDataToState();
      homeData.news.articles.push({
        title: 'New Track Announcement',
        category: 'Track Report',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        excerpt: 'Summary of the recent testing session or team update...',
        imageUrl: '',
        readTime: '3 min read',
        link: 'news.html',
        featured: false,
        status: 'published',
      });
      openEditorIdx['article_' + (homeData.news.articles.length - 1)] = true;
      markDirty(); renderInterface(container);
    };
    document.getElementById('hcmsAddArticleBtn')?.addEventListener('click', addArticleHandler);
    document.getElementById('hcmsAddArticleBtn2')?.addEventListener('click', addArticleHandler);

    // 9. Add Sponsor Tier
    const addTierHandler = () => {
      syncFormDataToState();
      homeData.footerSponsors.tiers.push({ name: 'New Tier', displaySize: 'medium', sponsors: [] });
      markDirty(); renderInterface(container);
    };
    document.getElementById('hcmsAddTierBtn')?.addEventListener('click', addTierHandler);
    document.getElementById('hcmsAddTierBtn2')?.addEventListener('click', addTierHandler);

    // 10. Add Sponsor to Tier
    container.querySelectorAll('.add-sponsor-to-tier-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tidx = parseInt(btn.getAttribute('data-tidx'), 10);
        syncFormDataToState();
        if (homeData.footerSponsors.tiers[tidx]) {
          homeData.footerSponsors.tiers[tidx].sponsors.push({ name: 'New Partner', logoUrl: '', websiteUrl: '' });
          markDirty(); renderInterface(container);
        }
      });
    });

    // 11. Media picker integration
    container.querySelectorAll('.open-media-picker-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetInputId = btn.getAttribute('data-target');
        const allowedType = btn.getAttribute('data-type') || 'all';
        const targetInput = document.getElementById(targetInputId);
        if (window.AdminMediaPicker && targetInput) {
          window.AdminMediaPicker.open({
            allowedType,
            onSelect: (asset) => {
              const url = asset.secureUrl || asset.url || '';
              targetInput.value = url;
              targetInput.dispatchEvent(new Event('input', { bubbles: true }));
              markDirty();
              // Update visible preview if it exists nearby
              const parent = targetInput.closest('.hcms-media-block') || targetInput.closest('.form-group');
              if (parent) {
                let img = parent.querySelector('img');
                if (img) {
                  img.src = url;
                  img.style.display = 'block';
                }
                const emptyState = parent.querySelector('.hcms-media-empty-state');
                if (emptyState) emptyState.style.display = 'none';
              }
            },
          });
        }
      });
    });

    // 12. Media type toggle buttons (image/video) for slides
    container.querySelectorAll('.slide-media-type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        const type = btn.getAttribute('data-type');
        if (homeData.hero.slides[idx]) {
          homeData.hero.slides[idx].mediaType = type;
          markDirty();
          syncFormDataToState();
          renderInterface(container);
        }
      });
    });

    // 13. Advanced settings toggles
    container.querySelectorAll('.hcms-advanced-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const advId = toggle.getAttribute('data-adv');
        const advBody = document.getElementById(advId);
        if (advBody) {
          const isOpen = advBody.classList.toggle('open');
          toggle.classList.toggle('open', isOpen);
        }
      });
    });

    // 14. Live input → markDirty
    container.querySelectorAll('input, textarea, select').forEach(el => {
      el.addEventListener('input', () => markDirty());
      el.addEventListener('change', () => markDirty());
    });

    // 15. Destination select custom URL handler
    container.querySelectorAll('.slide-link-select').forEach(sel => {
      sel.addEventListener('change', () => {
        if (sel.value === '__custom__') {
          const custom = prompt('Enter a custom URL:');
          if (custom) {
            const opt = document.createElement('option');
            opt.value = custom;
            opt.text = custom;
            opt.selected = true;
            sel.add(opt);
            sel.value = custom;
          }
        }
      });
    });

    // 16. Save Draft
    const saveDraftHandler = () => saveDraft();
    document.getElementById('hcmsSaveDraftBtn')?.addEventListener('click', saveDraftHandler);
    document.getElementById('hcmsStickySaveDraftBtn')?.addEventListener('click', saveDraftHandler);

    // 17. Publish — show modal
    const publishHandler = () => showPublishModal();
    document.getElementById('hcmsPublishBtn')?.addEventListener('click', publishHandler);
    document.getElementById('hcmsStickyPublishBtn')?.addEventListener('click', publishHandler);

    // Modal buttons
    document.getElementById('hcmsModalCancel')?.addEventListener('click', hidePublishModal);
    document.getElementById('hcmsModalConfirm')?.addEventListener('click', () => {
      hidePublishModal();
      publishLive();
    });
    document.getElementById('hcmsPublishModal')?.addEventListener('click', (e) => {
      if (e.target === document.getElementById('hcmsPublishModal')) hidePublishModal();
    });
  }

  // ──────────────────────────────────────────────────────────
  // UI HELPERS
  // ──────────────────────────────────────────────────────────
  function toggleEditor(id, open) {
    const el = document.getElementById(id);
    if (el) el.classList.toggle('open', open);
  }

  function openMediaPickerForSlide(idx) {
    const slide = homeData.hero.slides[idx];
    if (!slide) return;
    const isVideo = slide.mediaType === 'video';
    if (window.AdminMediaPicker) {
      window.AdminMediaPicker.open({
        allowedType: isVideo ? 'video' : 'image',
        onSelect: (asset) => {
          const url = asset.secureUrl || asset.url || '';
          if (isVideo) {
            slide.videoUrl = url;
          } else {
            slide.imageUrl = url;
          }
          markDirty();
          const container = document.getElementById('adminContent');
          if (container) renderInterface(container);
        },
      });
    }
  }

  function showPublishModal() {
    const modal = document.getElementById('hcmsPublishModal');
    if (modal) modal.classList.add('open');
  }

  function hidePublishModal() {
    const modal = document.getElementById('hcmsPublishModal');
    if (modal) modal.classList.remove('open');
  }

  function showDeleteConfirm(message, onConfirm) {
    if (window.confirm(message)) onConfirm();
  }

  function markDirty() {
    isDirty = true;
    const updateStatus = (badgeId, textId) => {
      const badge = document.getElementById(badgeId);
      const text = document.getElementById(textId);
      if (badge) {
        badge.className = 'hcms-status-badge draft';
        badge.innerHTML = '<span class="hcms-status-dot"></span><span id="' + textId + '">Unsaved Changes</span>';
      }
    };
    updateStatus('hcmsStatusBadge', 'hcmsStatusText');
    updateStatus('hcmsStickyStatus', 'hcmsStickyStatusText');
  }

  function setStatus(type, message) {
    const updateBadge = (badgeId, textId) => {
      const badge = document.getElementById(badgeId);
      if (badge) {
        badge.className = 'hcms-status-badge ' + type;
        badge.innerHTML = '<span class="hcms-status-dot"></span><span id="' + textId + '">' + escapeHtml(message) + '</span>';
      }
    };
    updateBadge('hcmsStatusBadge', 'hcmsStatusText');
    updateBadge('hcmsStickyStatus', 'hcmsStickyStatusText');
  }

  // ──────────────────────────────────────────────────────────
  // SYNC FORM → STATE  (UNCHANGED logic, updated selectors)
  // ──────────────────────────────────────────────────────────
  function syncFormDataToState() {
    if (!homeData) return;

    // Hero carousel settings
    const autoInt = document.getElementById('hero_autoplayInterval');
    if (autoInt) homeData.hero.autoplayInterval = parseInt(autoInt.value, 10) || 7;
    const trans = document.getElementById('hero_transition');
    if (trans) homeData.hero.transition = trans.value;

    // Slide fields
    document.querySelectorAll('.slide-field').forEach(el => {
      const idx = parseInt(el.getAttribute('data-idx'), 10);
      const key = el.getAttribute('data-key');
      if (homeData.hero.slides[idx] && key) {
        homeData.hero.slides[idx][key] = el.value;
      }
    });

    // Stat fields
    document.querySelectorAll('.stat-field').forEach(el => {
      const idx = parseInt(el.getAttribute('data-idx'), 10);
      const key = el.getAttribute('data-key');
      if (homeData.hero.statsStrip[idx] && key) {
        homeData.hero.statsStrip[idx][key] = el.value;
      }
    });

    // Slide destination selects
    document.querySelectorAll('.slide-link-select').forEach(sel => {
      const idx = parseInt(sel.getAttribute('data-idx'), 10);
      const key = sel.getAttribute('data-key');
      const val = sel.value === '__custom__' ? (homeData.hero.slides[idx]?.[key] || '') : sel.value;
      if (homeData.hero.slides[idx] && key) homeData.hero.slides[idx][key] = val;
    });

    // Car story fields
    const csHead = document.getElementById('carStory_heading');
    if (csHead) homeData.carStory.heading = csHead.value;
    const csSub = document.getElementById('carStory_subheading');
    if (csSub) homeData.carStory.subheading = csSub.value;
    const csDesc = document.getElementById('carStory_description');
    if (csDesc) homeData.carStory.description = csDesc.value;
    const csMedia = document.getElementById('carStory_mainMediaUrl');
    if (csMedia) homeData.carStory.mainMediaUrl = csMedia.value;
    const csPost = document.getElementById('carStory_posterUrl');
    if (csPost) homeData.carStory.posterUrl = csPost.value;
    const csCtaT = document.getElementById('carStory_ctaText');
    if (csCtaT) homeData.carStory.ctaText = csCtaT.value;
    const csCtaL = document.getElementById('carStory_ctaLink');
    if (csCtaL) homeData.carStory.ctaLink = csCtaL.value;

    // Stage fields
    document.querySelectorAll('.stage-field').forEach(el => {
      const idx = parseInt(el.getAttribute('data-idx'), 10);
      const key = el.getAttribute('data-key');
      if (homeData.carStory.cards[idx] && key) homeData.carStory.cards[idx][key] = el.value;
    });

    // News section settings
    const newsHead = document.getElementById('news_heading');
    if (newsHead) homeData.news.heading = newsHead.value;
    const newsSub = document.getElementById('news_subheading');
    if (newsSub) homeData.news.subheading = newsSub.value;

    // Article fields
    document.querySelectorAll('.article-field').forEach(el => {
      const idx = parseInt(el.getAttribute('data-idx'), 10);
      const key = el.getAttribute('data-key');
      if (homeData.news.articles[idx] && key) homeData.news.articles[idx][key] = el.value;
    });
    document.querySelectorAll('.article-field-check').forEach(el => {
      const idx = parseInt(el.getAttribute('data-idx'), 10);
      const key = el.getAttribute('data-key');
      if (homeData.news.articles[idx] && key) homeData.news.articles[idx][key] = el.checked;
    });

    // Sponsor CTA
    const spCtaT = document.getElementById('sponsorCta_title');
    if (spCtaT) homeData.footerSponsors.sponsorCta.title = spCtaT.value;
    const spCtaS = document.getElementById('sponsorCta_subtitle');
    if (spCtaS) homeData.footerSponsors.sponsorCta.subtitle = spCtaS.value;
    const spCtaBtn = document.getElementById('sponsorCta_btnText');
    if (spCtaBtn) homeData.footerSponsors.sponsorCta.btnText = spCtaBtn.value;
    const spCtaLnk = document.getElementById('sponsorCta_btnLink');
    if (spCtaLnk) homeData.footerSponsors.sponsorCta.btnLink = spCtaLnk.value;

    // Tiers
    document.querySelectorAll('.tier-name-input').forEach(el => {
      const tidx = parseInt(el.getAttribute('data-tidx'), 10);
      if (homeData.footerSponsors.tiers[tidx]) homeData.footerSponsors.tiers[tidx].name = el.value;
    });
    document.querySelectorAll('.tier-size-select').forEach(el => {
      const tidx = parseInt(el.getAttribute('data-tidx'), 10);
      if (homeData.footerSponsors.tiers[tidx]) homeData.footerSponsors.tiers[tidx].displaySize = el.value;
    });
    document.querySelectorAll('.tier-sponsor-field').forEach(el => {
      const tidx = parseInt(el.getAttribute('data-tidx'), 10);
      const sidx = parseInt(el.getAttribute('data-sidx'), 10);
      const key = el.getAttribute('data-key');
      if (homeData.footerSponsors.tiers[tidx]?.sponsors[sidx] && key) {
        homeData.footerSponsors.tiers[tidx].sponsors[sidx][key] = el.value;
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  // SAVE DRAFT  (UNCHANGED API call)
  // ──────────────────────────────────────────────────────────
  async function saveDraft() {
    syncFormDataToState();
    const btns = [document.getElementById('hcmsSaveDraftBtn'), document.getElementById('hcmsStickySaveDraftBtn')];
    btns.forEach(btn => { if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Saving...'; } });

    try {
      const payload = denormalizeForSave(homeData);
      const res = await API().patch('/admin/home', payload);
      if (res && res.success) {
        Toast().success('Home draft saved successfully!');
        isDirty = false;
        homeData = normalizeHomeData(res.data);
        setStatus('saved', 'Draft Saved');
        const lastPub = document.getElementById('hcmsLastPub');
        if (lastPub && homeData.lastEditedAt) {
          lastPub.innerHTML = `<i class="fas fa-clock" style="margin-right:4px;"></i>Last saved: ${new Date(homeData.lastEditedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
        }
      } else {
        throw new Error(res?.message || 'Failed to save draft.');
      }
    } catch (err) {
      console.error('Save draft error:', err);
      Toast().error('Error saving draft: ' + err.message);
      setStatus('draft', 'Unsaved Changes');
    } finally {
      btns.forEach(btn => {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = '<i class="fas fa-floppy-disk"></i> <span>Save Draft</span>';
        }
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // PUBLISH LIVE  (UNCHANGED API call)
  // ──────────────────────────────────────────────────────────
  async function publishLive() {
    syncFormDataToState();

    const confirmBtn = document.getElementById('hcmsModalConfirm');
    const publishBtns = [document.getElementById('hcmsPublishBtn'), document.getElementById('hcmsStickyPublishBtn')];

    if (confirmBtn) { confirmBtn.disabled = true; confirmBtn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Publishing...'; }
    publishBtns.forEach(btn => { if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i>'; } });

    try {
      const saveRes = await API().patch('/admin/home', denormalizeForSave(homeData));
      if (!saveRes.success) throw new Error(saveRes.message || 'Draft sync failed prior to publish.');

      const pubRes = await API().post('/admin/home/publish', {});
      if (pubRes && pubRes.success) {
        Toast().success('Homepage published live! All changes are now active.');
        isDirty = false;
        homeData = normalizeHomeData(pubRes.data);
        const container = document.getElementById('adminContent');
        if (container) renderInterface(container);
      } else {
        throw new Error(pubRes?.message || 'Failed to publish live.');
      }
    } catch (err) {
      console.error('Publish error:', err);
      Toast().error('Publishing failed: ' + err.message);
    } finally {
      if (confirmBtn) { confirmBtn.disabled = false; confirmBtn.innerHTML = '<i class="fas fa-upload"></i> Publish Live'; }
      publishBtns.forEach(btn => {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-upload"></i> <span>Publish Live</span>'; }
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // ESCAPE HELPER
  // ──────────────────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ──────────────────────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────────────────────
  return {
    renderHomeModule,
    saveDraft,
    publishLive,
  };
})();
