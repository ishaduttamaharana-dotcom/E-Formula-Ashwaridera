/* ============================================================
   achievements-cms.js — Achievements Page Authoritative CMS Hydration Engine
   Single source of truth for public/achievements.html.
   Hydrates:
     • Settings & SEO Title
     • Achievements Section (eyebrow, title, subtitle, dynamic categories, roster)
     • Journey Timeline Section (eyebrow, title, subtitle, timeline cards)
   Features:
     • 100% database-driven from MongoDB via /api/v1/achievements/page
     • Zero stale cache overrides (no localStorage/sessionStorage production state)
     • Graceful error and loading states with retry capability
     • Real-time category filtering and count badges
     • Admin edit deep links
============================================================ */

(function () {
  'use strict';

  const isPreview = new URLSearchParams(window.location.search).get('preview') === 'true';

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

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  async function fetchAchievementsContent() {
    try {
      const url = `/api/v1/achievements/page?_t=${Date.now()}${isPreview ? '&preview=true' : ''}`;
      const res = await fetch(url, { credentials: 'include', cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const data = await res.json();
      if (data && data.success && data.data) {
        applyCmsData(data.data);
      } else {
        throw new Error(data?.message || 'Failed to load achievements data.');
      }
    } catch (err) {
      console.warn('[Achievements CMS] Notice:', err.message);
      showErrorState(err.message);
    }
  }

  function showErrorState(message) {
    if (grid) {
      grid.innerHTML = `
        <div class="ach-error-state" style="grid-column: 1 / -1; background: rgba(255, 77, 77, 0.08); border: 1px solid rgba(255, 77, 77, 0.25); border-radius: 4px; padding: 40px 20px; text-align: center; color: var(--ink);">
          <i class="fas fa-triangle-exclamation" style="font-size: 2rem; color: #ff4d4d; margin-bottom: 12px; display: block;"></i>
          <h3 style="font-size: 1.1rem; text-transform: uppercase; margin-bottom: 6px;">Unable to load achievements</h3>
          <p style="font-size: 0.85rem; color: var(--ink-soft); max-width: 440px; margin: 0 auto 18px;">${escapeHtml(message || 'Please check your connection and try again.')}</p>
          <button type="button" class="btn btn-primary" id="retryAchBtn" style="cursor: pointer;">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
      document.getElementById('retryAchBtn')?.addEventListener('click', fetchAchievementsContent);
    }
    if (timelineModern) {
      timelineModern.innerHTML = `
        <div class="tl-error-state" style="background: rgba(255, 77, 77, 0.08); border: 1px solid rgba(255, 77, 77, 0.25); border-radius: 4px; padding: 30px 20px; text-align: center; color: #fff;">
          <p style="font-size: 0.9rem; color: rgba(255,255,255,0.7);">Unable to load journey timeline. Please try again later.</p>
        </div>
      `;
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
        achEyebrow.innerHTML = `<i class="${escapeHtml(icon)}"></i> ${escapeHtml(achSec.eyebrow)}`;
      }

      const achHeading = document.getElementById('achHeading');
      if (achHeading && achSec.heading) {
        const highlight = achSec.headingHighlight || '';
        if (highlight && achSec.heading.includes(highlight)) {
          achHeading.innerHTML = escapeHtml(achSec.heading).replace(
            escapeHtml(highlight),
            `<span class="text-gradient">${escapeHtml(highlight)}</span>`
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

      renderCategoriesToolbar(categories, achSec.allCount !== undefined ? achSec.allCount : currentAchievements.length);
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
        tlEyebrow.innerHTML = `<i class="${escapeHtml(icon)}"></i> ${escapeHtml(tlSec.eyebrow)}`;
      }

      const tlHeading = document.getElementById('tlHeading');
      if (tlHeading && tlSec.heading) {
        const highlight = tlSec.headingHighlight || '';
        if (highlight && tlSec.heading.includes(highlight)) {
          tlHeading.innerHTML = escapeHtml(tlSec.heading).replace(
            escapeHtml(highlight),
            `<span class="text-gradient">${escapeHtml(highlight)}</span>`
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
    filterBar.removeAttribute('data-cms-pending');

    // "ALL" button
    const allBtn = document.createElement('button');
    allBtn.className = 'filter-btn active';
    allBtn.dataset.filter = 'all';
    allBtn.innerHTML = `All <span class="count">(${allCount !== undefined ? allCount : 0})</span>`;
    filterBar.appendChild(allBtn);

    // Dynamic categories
    (categories || []).forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.filter = (cat.slug || '').toLowerCase();
      btn.innerHTML = `${escapeHtml(cat.name)} <span class="count">(${cat.count !== undefined ? cat.count : 0})</span>`;
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

    if (!items || items.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'achievement-card reveal-scale visible';
      const catSlug = (item.category || 'competition').toLowerCase();
      card.dataset.category = catSlug;

      const meta = categoryMeta[catSlug] || { label: item.category || 'Achievement', icon: 'fas fa-trophy' };
      const mediaHtml = item.imageUrl
        ? `<div class="card-media"><img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.imageAlt || item.title)}" loading="lazy" onerror="this.onerror=null; this.parentElement.style.display='none';" /></div>`
        : `<div class="card-icon"><i class="${escapeHtml(meta.icon)}"></i></div>`;

      const yearDisplay = item.year || item.date || '';
      const titleDisplay = item.title || '';
      const descDisplay = item.description || '';
      const locationDisplay = item.location || 'India';
      const resultDisplay = item.rank || item.position || '';

      let externalHtml = '';
      if (item.externalUrl || item.buttonLink) {
        externalHtml = `<a href="${escapeHtml(item.externalUrl || item.buttonLink)}" target="_blank" rel="noopener noreferrer" class="card-link" style="color:var(--signal); font-family:var(--font-mono); font-size:0.75rem; text-decoration:underline; margin-top:8px; display:inline-block;"><i class="fas fa-external-link-alt"></i> Learn More</a>`;
      }

      card.innerHTML = `
        <span class="card-badge ${escapeHtml(catSlug)}"><i class="${escapeHtml(meta.icon)}"></i> ${escapeHtml(meta.label)}</span>
        ${mediaHtml}
        <div class="card-year">${escapeHtml(yearDisplay)}</div>
        <h3>${escapeHtml(titleDisplay)}</h3>
        <p>${escapeHtml(descDisplay)}</p>
        ${externalHtml}
        <div class="card-footer">
          <span class="location"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(locationDisplay)}</span>
          <span class="result">${escapeHtml(resultDisplay)}</span>
        </div>
      `;

      grid.appendChild(card);
    });
  }

  function renderTimelineEvents(events) {
    if (!timelineModern) return;
    timelineModern.innerHTML = '';

    if (!events || events.length === 0) {
      timelineModern.innerHTML = '<div style="color:rgba(255,255,255,0.6); text-align:center; padding:30px 0; font-family:var(--font-mono);">No timeline events recorded yet.</div>';
      return;
    }

    events.forEach((ev, idx) => {
      const itemEl = document.createElement('div');
      itemEl.className = 'timeline-item-modern visible';
      itemEl.dataset.delay = (idx * 100).toString();

      const tags = Array.isArray(ev.tags) ? ev.tags : [];
      const tagsHtml = tags.map(t => {
        const isHighlight = t.includes('⚡') || t.includes('AIR') || t.includes('First') || t.includes('Rank');
        return `<span class="${isHighlight ? 'gold-tag' : ''}">${escapeHtml(t)}</span>`;
      }).join('');

      itemEl.innerHTML = `
        <div class="tl-card">
          <div class="tl-year"><span class="year-line"></span> ${escapeHtml(ev.year)}</div>
          <div class="tl-title">${escapeHtml(ev.title)}</div>
          <div class="tl-desc">${escapeHtml(ev.description || '')}</div>
          ${tags.length ? `<div class="tl-tags">${tagsHtml}</div>` : ''}
        </div>
      `;

      timelineModern.appendChild(itemEl);
    });
  }

  window.fetchAchievementsContent = fetchAchievementsContent;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fetchAchievementsContent);
  } else {
    fetchAchievementsContent();
  }
})();
