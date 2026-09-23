/* ============================================================
   car-cms.js — Dynamic Hydration Engine for Car Page (Ashwa-3)
   Injected into public/car.html.
   Hydrates:
     01. Car Experience 5 Stages & Timeline HUD
     02. Vehicle Values / Key Specifications Counters Strip
     03. Engineering Systems Tabs, Cards & Technical Specs
     04. The Build Journey Horizontal Timeline Phases
     05. Visual Breakdown In-the-Details Masonry Grid
     06. Open Positions Recruitment CTA Section
   Preserves Canvas 240-frame sequence and interactive timeline navigation.
============================================================ */

(function () {
  'use strict';

  const CAR_API = '/api/v1/content/car/page' + window.location.search;

  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatHeadingWithHighlight = (heading, highlight) => {
    if (!heading) return '';
    if (!highlight || !heading.includes(highlight)) {
      return escapeHtml(heading);
    }
    const safeH = escapeHtml(heading);
    const safeHigh = escapeHtml(highlight);
    return safeH.replace(safeHigh, `<em>${safeHigh}</em>`);
  };

  const showPreviewBanner = () => {
    if (!window.location.search.includes('preview=true')) return;
    const banner = document.createElement('div');
    banner.id = 'cmsPreviewBanner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: linear-gradient(90deg, #F25912, #FF751F);
      color: #FFFFFF;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 16px;
      text-align: center;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    banner.innerHTML = `
      <span><i class="fas fa-eye" style="margin-right:8px;"></i> PREVIEW MODE: Viewing Unpublished Car Draft</span>
      <a href="/admin/#/car" style="color:#FFFFFF; text-decoration:underline; font-size:0.7rem;">Return to Control Center</a>
    `;
    document.body.prepend(banner);

    // Push down fixed navbar slightly if banner present
    const navbar = document.getElementById('navbar');
    if (navbar) navbar.style.top = '30px';
  };

  const initCounterAnimation = () => {
    const counters = document.querySelectorAll('.counter');
    if (!counters.length) return;

    let animated = false;
    const run = () => {
      if (animated) return;
      const s = document.querySelector('.stats-strip');
      if (!s) return;
      if (s.getBoundingClientRect().top < window.innerHeight * 0.95) {
        animated = true;
        counters.forEach(el => {
          const target = parseFloat(el.dataset.target || 0);
          const isD = el.dataset.decimal;
          const dur = 1600;
          const st = performance.now();
          function step(now) {
            const p = Math.min((now - st) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            el.textContent = isD ? (target * e).toFixed(1) : Math.round(target * e);
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }
    };

    window.addEventListener('scroll', run);
    run();
  };

  // ============================================================
  //  HYDRATION HANDLERS
  // ============================================================

  const hydrateStages = (carExp) => {
    if (!carExp) return;
    const stages = carExp.stages || [];
    if (!stages.length) return;

    stages.forEach((st, idx) => {
      const panel = document.getElementById('stage-' + (st.stageNumber !== undefined ? st.stageNumber : idx));
      if (!panel) return;

      // Eyebrow badge
      const badge = panel.querySelector('.stage-badge');
      if (badge && st.eyebrow) {
        badge.textContent = st.eyebrow;
      }

      // Title
      const titleEl = panel.querySelector('.stage-title');
      if (titleEl && st.heading) {
        titleEl.innerHTML = formatHeadingWithHighlight(st.heading, st.headingHighlight);
      }

      // Description
      const descEl = panel.querySelector('.stage-desc');
      if (descEl && st.description) {
        descEl.textContent = st.description;
      }

      // Stats
      const statsWrap = panel.querySelector('.stage-stats');
      if (statsWrap && st.stats && st.stats.length > 0) {
        statsWrap.innerHTML = st.stats.map(s => `
          <div>
            <div class="stage-stat-label">${escapeHtml(s.label)}</div>
            <div class="stage-stat-val">${escapeHtml(s.value)}<sub>${escapeHtml(s.unit || '')}</sub></div>
          </div>
        `).join('');
      }

      // Button row
      const btnRow = panel.querySelector('.stage-btn-row');
      if (btnRow) {
        let btnsHtml = '';
        if (st.primaryCta && st.primaryCta.enabled && st.primaryCta.text) {
          btnsHtml += `<a href="${escapeHtml(st.primaryCta.link || '#')}" class="btn btn-primary"><i class="fas fa-play"></i> ${escapeHtml(st.primaryCta.text)}</a>`;
        }
        if (st.secondaryCta && st.secondaryCta.enabled && st.secondaryCta.text) {
          btnsHtml += `<a href="${escapeHtml(st.secondaryCta.link || '#')}" class="btn btn-outline"><i class="fas fa-user-plus"></i> ${escapeHtml(st.secondaryCta.text)}</a>`;
        }
        if (btnsHtml) {
          btnRow.innerHTML = btnsHtml;
          btnRow.style.display = 'flex';
        } else {
          btnRow.style.display = 'none';
        }
      }

      // Update timeline bottom HUD step label
      const tlStep = document.querySelector(`.tl-step[data-step="${idx}"]`);
      if (tlStep) {
        const tlLabel = tlStep.querySelector('.tl-label');
        if (tlLabel && st.stageName) {
          tlLabel.textContent = st.stageName;
        }
      }
    });
  };

  const hydrateKeySpecs = (specs) => {
    if (!specs || !specs.length) return;
    const stripInner = document.querySelector('.stats-strip-inner');
    if (!stripInner) return;

    stripInner.innerHTML = specs.map(s => `
      <div class="stat-block">
        <div class="stat-key">${escapeHtml(s.key)}</div>
        <div class="stat-num">
          <span class="counter" data-target="${escapeHtml(s.value)}" ${s.decimalPlaces ? `data-decimal="${s.decimalPlaces}"` : ''}>0</span>
          <span class="unit">${escapeHtml(s.unit || '')}</span>
        </div>
        <div class="stat-sub">${escapeHtml(s.subtitle || '')}</div>
      </div>
    `).join('');

    initCounterAnimation();
  };

  const hydrateEngineering = (eng) => {
    if (!eng) return;
    const sec = document.getElementById('specs-section');
    if (!sec) return;

    // Watermark
    const wm = sec.querySelector('.tech-watermark');
    if (wm && eng.watermarkText) wm.textContent = eng.watermarkText;

    // Header
    const eyebrow = sec.querySelector('.tech-header .eyebrow');
    if (eyebrow && eng.eyebrow) eyebrow.textContent = eng.eyebrow;

    const title = sec.querySelector('.tech-header .section-title');
    if (title && eng.heading) {
      title.innerHTML = formatHeadingWithHighlight(eng.heading, eng.headingHighlight);
    }

    const sub = sec.querySelector('.tech-header .section-subtitle');
    if (sub && eng.description) sub.textContent = eng.description;

    // Categories / Tabs
    const categories = eng.categories || [];
    if (!categories.length) return;

    const tabsWrap = sec.querySelector('.sys-tabs');
    if (tabsWrap) {
      tabsWrap.innerHTML = categories.map((cat, idx) => `
        <button class="sys-tab ${idx === 0 ? 'active' : ''}" data-tab="${escapeHtml(cat.id)}">
          <i class="${escapeHtml(cat.icon || 'fas fa-cube')}"></i> ${escapeHtml(cat.title)}
        </button>
      `).join('');
    }

    // Panels
    const panelsWrap = sec.querySelector('.container');
    if (panelsWrap) {
      // Remove existing panels
      sec.querySelectorAll('.sys-panel').forEach(p => p.remove());

      // Append new panels
      categories.forEach((cat, idx) => {
        const panel = document.createElement('div');
        panel.className = `sys-panel ${idx === 0 ? 'active' : ''}`;
        panel.id = `tab-${cat.id}`;

        const cards = cat.cards || [];
        panel.innerHTML = cards.map(c => `
          <div class="sys-card ${c.isFullWidth ? 'full' : ''}">
            <div class="sys-card-icon"><i class="${escapeHtml(c.icon || 'fas fa-cube')}"></i></div>
            <h3>${escapeHtml(c.title)}</h3>
            <p>${escapeHtml(c.description || '')}</p>
            ${c.specs && c.specs.length > 0 ? `
              <ul class="spec-list">
                ${c.specs.map(row => `
                  <li>
                    <span class="k">${escapeHtml(row.key)}</span>
                    <span class="v">${escapeHtml(row.value)}</span>
                  </li>
                `).join('')}
              </ul>
            ` : ''}
          </div>
        `).join('');

        panelsWrap.appendChild(panel);
      });

      // Bind tab switching
      sec.querySelectorAll('.sys-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          sec.querySelectorAll('.sys-tab').forEach(t => t.classList.remove('active'));
          sec.querySelectorAll('.sys-panel').forEach(p => p.classList.remove('active'));
          tab.classList.add('active');
          const p = document.getElementById('tab-' + tab.dataset.tab);
          if (p) p.classList.add('active');
        });
      });
    }
  };

  const hydrateBuildJourney = (build) => {
    if (!build) return;
    const sec = document.querySelector('.build-section');
    if (!sec) return;

    const eyebrow = sec.querySelector('.eyebrow');
    if (eyebrow && build.eyebrow) eyebrow.textContent = build.eyebrow;

    const title = sec.querySelector('.section-title');
    if (title && build.heading) {
      title.innerHTML = formatHeadingWithHighlight(build.heading, build.headingHighlight);
    }

    const sub = sec.querySelector('.section-subtitle');
    if (sub && build.description) sub.textContent = build.description;

    const phases = build.phases || [];
    if (!phases.length) return;

    const timeline = sec.querySelector('.build-timeline');
    if (timeline) {
      timeline.innerHTML = phases.map(ph => `
        <div class="build-step ${ph.isDone ? 'done' : ''}">
          <div class="build-step-num">${escapeHtml(ph.phaseNumber)}</div>
          <div class="build-step-icon"><i class="${escapeHtml(ph.icon || 'fas fa-pencil-ruler')}"></i></div>
          <h4>${escapeHtml(ph.title)}</h4>
          <p>${escapeHtml(ph.description || '')}</p>
          <div class="build-step-tag">${escapeHtml(ph.dateTag || '')}</div>
        </div>
      `).join('');
    }
  };

  const hydrateVisualBreakdown = (visual) => {
    if (!visual) return;
    const sec = document.querySelector('.gallery-section');
    if (!sec) return;

    const eyebrow = sec.querySelector('.eyebrow');
    if (eyebrow && visual.eyebrow) eyebrow.textContent = visual.eyebrow;

    const title = sec.querySelector('.section-title');
    if (title && visual.heading) {
      title.innerHTML = formatHeadingWithHighlight(visual.heading, visual.headingHighlight);
    }

    const sub = sec.querySelector('.section-subtitle');
    if (sub && visual.description) sub.textContent = visual.description;

    const cards = visual.cards || [];
    if (!cards.length) return;

    const masonry = sec.querySelector('.gallery-masonry');
    if (masonry) {
      masonry.innerHTML = cards.map((c, idx) => `
        <div class="g-item" style="${c.imageUrl ? `background-image:url('${escapeHtml(c.imageUrl)}'); background-size:cover; background-position:center;` : ''}">
          <div class="g-label">${escapeHtml(c.title)}</div>
          <div class="g-overlay"><i class="fas fa-expand"></i></div>
        </div>
      `).join('');
    }
  };

  const hydrateOpenPositions = (openPos) => {
    if (!openPos) return;
    const sec = document.querySelector('.cta-section');
    if (!sec) return;

    const eyebrow = sec.querySelector('.eyebrow');
    if (eyebrow && openPos.eyebrow) eyebrow.textContent = openPos.eyebrow;

    const title = sec.querySelector('.section-title');
    if (title && openPos.heading) {
      title.innerHTML = formatHeadingWithHighlight(openPos.heading, openPos.headingHighlight);
    }

    const sub = sec.querySelector('.section-subtitle');
    if (sub && openPos.description) sub.textContent = openPos.description;

    const btnWrap = sec.querySelector('div[style*="inline-flex"]');
    if (btnWrap) {
      let html = '';
      if (openPos.primaryCta && openPos.primaryCta.enabled && openPos.primaryCta.text) {
        html += `<a href="${escapeHtml(openPos.primaryCta.link || '#')}" class="btn btn-primary"><i class="fas fa-user-plus"></i> ${escapeHtml(openPos.primaryCta.text)}</a>`;
      }
      if (openPos.secondaryCta && openPos.secondaryCta.enabled && openPos.secondaryCta.text) {
        html += `<a href="${escapeHtml(openPos.secondaryCta.link || '#')}" class="btn btn-outline"><i class="fas fa-envelope"></i> ${escapeHtml(openPos.secondaryCta.text)}</a>`;
      }
      if (html) btnWrap.innerHTML = html;
    }
  };

  // ============================================================
  //  MAIN HYDRATION EXECUTION
  // ============================================================
  const hydrateCarPage = async () => {
    try {
      showPreviewBanner();

      const res = await fetch(CAR_API, { credentials: 'include' });
      const json = await res.json();

      if (json && json.success && json.data) {
        const data = json.data;

        // 01. Car Experience
        hydrateStages(data.carExperience);

        // 02. Key Specs Strip
        hydrateKeySpecs(data.keySpecs);

        // 03. Engineering Systems
        hydrateEngineering(data.engineeringSection);

        // 04. The Build Journey
        hydrateBuildJourney(data.buildJourneySection);

        // 05. Visual Breakdown
        hydrateVisualBreakdown(data.visualBreakdownSection);

        // 06. Open Positions
        hydrateOpenPositions(data.openPositionsSection);

        console.log(`[Ashwa Car CMS] Page hydrated successfully (v${data.version || 1}).`);
      }
    } catch (err) {
      console.warn('[Ashwa Car CMS] Hydration notice:', err.message);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateCarPage);
  } else {
    hydrateCarPage();
  }
})();
