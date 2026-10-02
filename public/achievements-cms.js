/* ============================================================
   achievements-cms.js — Achievements Page Authoritative CMS Hydration Engine
   Single source of truth for public/achievements.html.
   Hydrates:
     • Settings & SEO Title
     • Achievements Section (eyebrow, title, subtitle, categories, grid)
     • Journey Timeline Section (eyebrow, title, subtitle, timeline cards)
   Features:
     • Instant 0ms paint from sessionStorage cache (ar_achievements_cache)
     • Revalidation in background without layout shifts
     • Admin edit deep links
============================================================ */

(function () {
  'use strict';

  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';
  const CACHE_KEY = 'ar_achievements_cache';

  // ─── Preview Mode Indicator ───
  if (isPreview) {
    const previewBanner = document.createElement('div');
    previewBanner.style.cssText = 'position:fixed; top:0; left:0; right:0; z-index:99999; background:#F25912; color:#10141c; font-weight:800; font-size:0.8rem; text-align:center; padding:7px 16px; letter-spacing:0.06em; text-transform:uppercase; box-shadow:0 4px 20px rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; gap:10px;';
    previewBanner.innerHTML = '<i class="fas fa-eye"></i> CMS PREVIEW MODE — Viewing Draft Changes <a href="/admin/achievements" style="color:#10141c; text-decoration:underline; margin-left:8px; font-weight:900;">Return to CMS</a>';
    document.body.prepend(previewBanner);
    document.body.style.paddingTop = '32px';
  }

  const grid = document.getElementById('achievementGrid');
  const emptyState = document.getElementById('emptyState');
  const filterBar = document.getElementById('filterBar');
  const timelineModern = document.getElementById('timelineModern');
  const timelineSection = document.getElementById('timelineSection');
  const achievementsSection = document.getElementById('achievementsSection');

  const categoryMeta = {
    competition: { label: 'Competition', icon: 'fas fa-flag-checkered' },
    award:       { label: 'Award',       icon: 'fas fa-star' },
    record:      { label: 'Milestone',   icon: 'fas fa-flag' },
    certificate: { label: 'Recognition', icon: 'fas fa-award' },
  };

  let currentAchievements = [];

  // Fast-path: immediate paint from session cache
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && typeof parsed === 'object') {
        applyCmsData(parsed);
      }
    }
  } catch (e) {}

  async function fetchAchievementsContent() {
    try {
      const url = `/api/v1/achievements/page${isPreview ? '?preview=true' : ''}`;
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data && data.success && data.data) {
        applyCmsData(data.data);
        try {
          sessionStorage.setItem(CACHE_KEY, JSON.stringify(data.data));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('[Achievements CMS] Notice:', err.message);
    }
  }

  function applyCmsData(data) {
    if (!data) return;

    // 01 Settings / Meta
    if (data.settings && data.settings.seoTitle) {
      document.title = data.settings.seoTitle;
    }

    // 02 Our Achievements Section Settings
    const achSec = data.achievementsSection;
    if (achSec) {
      if (achSec.visible === false && achievementsSection) {
        achievementsSection.style.display = 'none';
      } else if (achievementsSection) {
        achievementsSection.style.display = '';
      }

      const achEyebrow = document.getElementById('achEyebrow');
      if (achEyebrow && achSec.eyebrow) {
        const icon = achSec.eyebrowIcon || 'fas fa-medal';
        achEyebrow.innerHTML = `<i class="${icon}"></i> ${achSec.eyebrow}`;
      }

      const achHeading = document.getElementById('achHeading');
      if (achHeading && achSec.heading) {
        const highlight = achSec.headingHighlight || '';
        if (highlight && achSec.heading.includes(highlight)) {
          achHeading.innerHTML = achSec.heading.replace(
            highlight,
            `<span class="text-gradient">${highlight}</span>`
          );
        } else {
          achHeading.textContent = achSec.heading;
        }
      }

      const achSubtitle = document.getElementById('achSubtitle');
      if (achSubtitle && achSec.description) {
        achSubtitle.textContent = achSec.description;
      }

      const categories = achSec.categories || [];
      currentAchievements = achSec.achievements || [];

      renderCategoriesToolbar(categories, achSec.allCount || currentAchievements.length);
      renderAchievementsGrid(currentAchievements);
    }

    // 03 Our Journey Timeline Section
    const tlSec = data.timelineSection;
    if (tlSec) {
      if (tlSec.visible === false && timelineSection) {
        timelineSection.style.display = 'none';
      } else if (timelineSection) {
        timelineSection.style.display = '';
      }

      const tlEyebrow = document.getElementById('tlEyebrow');
      if (tlEyebrow && tlSec.eyebrow) {
        const icon = tlSec.eyebrowIcon || 'fas fa-history';
        tlEyebrow.innerHTML = `<i class="${icon}"></i> ${tlSec.eyebrow}`;
      }

      const tlHeading = document.getElementById('tlHeading');
      if (tlHeading && tlSec.heading) {
        const highlight = tlSec.headingHighlight || '';
        if (highlight && tlSec.heading.includes(highlight)) {
          tlHeading.innerHTML = tlSec.heading.replace(
            highlight,
            `<span class="text-gradient">${highlight}</span>`
          );
        } else {
          tlHeading.textContent = tlSec.heading;
        }
      }

      const tlSubtitle = document.getElementById('tlSubtitle');
      if (tlSubtitle && tlSec.description) {
        tlSubtitle.textContent = tlSec.description;
      }

      if (tlSec.bgImageUrl && timelineSection) {
        timelineSection.style.backgroundImage = `url('${tlSec.bgImageUrl}')`;
      }

      renderTimelineEvents(tlSec.events || []);
    }

    // Remove pending states
    document.querySelectorAll('[data-cms-pending="true"]').forEach(el => {
      el.setAttribute('data-cms-pending', 'false');
    });
  }

  function renderCategoriesToolbar(categories, allCount) {
    if (!filterBar) return;
    filterBar.innerHTML = '';

    // "ALL" button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.dataset.filter = 'all';
    allBtn.innerHTML = `All <span class="count">(${allCount})</span>`;
    filterBar.appendChild(allBtn);

    // Dynamic categories
    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.filter = (cat.slug || '').toLowerCase();
      btn.innerHTML = `${cat.name} <span class="count">(${cat.count !== undefined ? cat.count : 0})</span>`;
      filterBar.appendChild(btn);
    });

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        filterBar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterCards(btn.dataset.filter);
      });
    });
  }

  function filterCards(filter) {
    if (!grid) return;
    const cards = grid.querySelectorAll('.achievement-card');
    let visibleCount = 0;
    cards.forEach(card => {
      const cat = (card.dataset.category || '').toLowerCase();
      const matches = filter === 'all' || cat === filter;
      card.style.display = matches ? 'block' : 'none';
      if (matches) visibleCount++;
    });

    if (emptyState) {
      emptyState.style.display = visibleCount === 0 ? 'block' : 'none';
    }
  }

  function renderAchievementsGrid(items) {
    if (!grid) return;
    grid.innerHTML = '';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'achievement-card reveal-scale visible';
      const catSlug = (item.category || 'competition').toLowerCase();
      card.dataset.category = catSlug;

      const meta = categoryMeta[catSlug] || { label: item.category, icon: 'fas fa-trophy' };
      const mediaHtml = item.imageUrl
        ? `<div class="card-media"><img src="${item.imageUrl}" alt="${item.imageAlt || item.title}" loading="lazy" /></div>`
        : `<div class="card-icon"><i class="${meta.icon}"></i></div>`;

      card.innerHTML = `
        <span class="card-badge ${catSlug}"><i class="${meta.icon}"></i> ${meta.label}</span>
        ${mediaHtml}
        <div class="card-year">${item.year || ''}</div>
        <h3>${item.title || ''}</h3>
        <p>${item.description || ''}</p>
        <div class="card-footer">
          <span class="location"><i class="fas fa-map-marker-alt"></i> ${item.location || 'India'}</span>
          <span class="result">${item.rank || ''}</span>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  function renderTimelineEvents(events) {
    if (!timelineModern) return;
    timelineModern.innerHTML = '';

    events.forEach((ev, idx) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'timeline-item-modern visible';
      itemEl.dataset.delay = (idx * 100).toString();

      const tags = Array.isArray(ev.tags) ? ev.tags : [];
      const tagsHtml = tags.map(t => {
        const isHighlight = t.includes('⚡') || t.includes('AIR') || t.includes('First') || t.includes('Rank');
        return `<span class="${isHighlight ? 'gold-tag' : ''}">${t}</span>`;
      }).join('');

      itemEl.innerHTML = `
        <div class="tl-card">
          <div class="tl-year"><span class="year-line"></span> ${ev.year}</div>
          <div class="tl-title">${ev.title}</div>
          <div class="tl-desc">${ev.description || ''}</div>
          ${tags.length ? `<div class="tl-tags">${tagsHtml}</div>` : ''}
        </div>
      `;

      timelineModern.appendChild(itemEl);
    });
  }

  // Check user role for add button visibility
  const openAddBtn = document.getElementById('openAddModal');
  if (openAddBtn) {
    try {
      const userRaw = localStorage.getItem('ar_user');
      const user = userRaw ? JSON.parse(userRaw) : null;
      if (user && user.role === 'admin') {
        openAddBtn.style.display = 'inline-flex';
        openAddBtn.onclick = () => { window.location.href = '/admin/achievements'; };
      } else {
        openAddBtn.style.display = 'none';
      }
    } catch {
      openAddBtn.style.display = 'none';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAchievementsContent);
  } else {
    fetchAchievementsContent();
  }
})();
