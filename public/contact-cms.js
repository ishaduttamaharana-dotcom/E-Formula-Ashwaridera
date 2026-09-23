/* ============================================================
   contact-cms.js — Unified Contact Page Dynamic Hydration Engine
   Ashwa Riders Formula Student Electric Team

   Hydrates:
     01. HERO SECTION (Eyebrow, title, highlight, description,
         background image, dark overlay intensity, and telemetry stats)
     02. OPEN CHANNELS (Eyebrow, title, highlight, description,
         and channel list with status dots and actionable links)
     03. TRANSMIT CONSOLE (Form title, frequency badge, submit button text,
         and dynamic subject/channel options)
     04. FIND US / PIT LANE (Map iframe embed, lat/long coordinates,
         workshop name, physical address, access, hours, visitor instructions)
     05. PREVIEW MODE SUPPORT (?preview=true)
============================================================ */

(function () {
  'use strict';

  // Prevent double-initialization
  if (window._ashwaContactCmsLoaded) return;
  window._ashwaContactCmsLoaded = true;

  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get('preview') === 'true';

  const API_ENDPOINT = isPreview
    ? '/api/v1/contact/page?preview=true'
    : '/api/v1/contact/page';

  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem('ar_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const isAdmin = () => {
    const user = getStoredUser();
    return user && user.role === 'admin';
  };

  async function fetchContactPageData() {
    try {
      const res = await fetch(API_ENDPOINT, {
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
      });
      const data = await res.json();
      if (data && data.success && data.data) {
        return data.data;
      }
    } catch (err) {
      console.warn('[Contact CMS] Failed to fetch live content, falling back to static HTML:', err.message);
    }
    return null;
  }

  function hydrateHeroSection(hero) {
    if (!hero) return;

    const heroSection = document.getElementById('contactHeroSection');
    const badgeText = document.getElementById('contactHeroBadgeText');
    const titleEl = document.getElementById('contactHeroTitle');
    const descEl = document.getElementById('contactHeroLede');
    const telemetryWrap = document.getElementById('contactHeroTelemetry');

    // 1. Eyebrow badge
    if (badgeText && hero.eyebrow) {
      badgeText.textContent = hero.eyebrow;
    }

    // 2. Title with highlight
    if (titleEl && hero.title) {
      if (hero.titleHighlight && hero.title.includes(hero.titleHighlight)) {
        const parts = hero.title.split(hero.titleHighlight);
        titleEl.innerHTML = `${escapeHtml(parts[0])}<span class="text-gradient">${escapeHtml(hero.titleHighlight)}</span>${escapeHtml(parts.slice(1).join(hero.titleHighlight))}`;
      } else {
        titleEl.textContent = hero.title;
      }
    }

    // 3. Description
    if (descEl && hero.description) {
      descEl.textContent = hero.description;
    }

    // 4. Background image and dark overlay
    if (heroSection) {
      if (hero.backgroundImage) {
        heroSection.style.backgroundImage = `url("${hero.backgroundImage}")`;
      }
      if (hero.overlayIntensity !== undefined) {
        heroSection.style.setProperty('--hero-overlay', `rgba(0, 0, 0, ${hero.overlayIntensity})`);
      }
    }

    // 5. Telemetry stats
    if (telemetryWrap && Array.isArray(hero.stats) && hero.stats.length > 0) {
      const activeStats = hero.stats
        .filter(s => s.enabled !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      if (activeStats.length > 0) {
        telemetryWrap.innerHTML = activeStats.map((stat, idx) => `
          <div class="t-item">
            <div class="t-num">${idx === 0 ? '<span class="live-dot"></span> ' : ''}${escapeHtml(stat.value || '')}</div>
            <div class="t-label">${escapeHtml(stat.label || '')}</div>
          </div>
        `).join('');
      }
    }
  }

  function hydrateChannelsSection(channelsSec) {
    if (!channelsSec) return;

    const eyebrowEl = document.getElementById('channelsEyebrowEl');
    const titleEl = document.getElementById('channelsTitleEl');
    const descEl = document.getElementById('channelsDescEl');
    const channelListWrap = document.getElementById('contactChannelList');
    const formSettings = channelsSec.formSettings || {};

    // 1. Eyebrow
    if (eyebrowEl && channelsSec.eyebrow) {
      eyebrowEl.textContent = channelsSec.eyebrow;
    }

    // 2. Title with highlight
    if (titleEl && channelsSec.title) {
      if (channelsSec.titleHighlight && channelsSec.title.includes(channelsSec.titleHighlight)) {
        const parts = channelsSec.title.split(channelsSec.titleHighlight);
        titleEl.innerHTML = `${escapeHtml(parts[0])}<span class="text-gradient">${escapeHtml(channelsSec.titleHighlight)}</span>${escapeHtml(parts.slice(1).join(channelsSec.titleHighlight))}`;
      } else {
        titleEl.textContent = channelsSec.title;
      }
    }

    // 3. Description
    if (descEl && channelsSec.description) {
      descEl.textContent = channelsSec.description;
    }

    // 4. Channel rows
    if (channelListWrap && Array.isArray(channelsSec.channels) && channelsSec.channels.length > 0) {
      const activeChannels = channelsSec.channels
        .filter(c => c.published !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      if (activeChannels.length > 0) {
        channelListWrap.innerHTML = activeChannels.map(ch => {
          const isExternal = ch.actionUrl && (ch.actionUrl.startsWith('http://') || ch.actionUrl.startsWith('https://'));
          const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
          return `
            <a href="${escapeHtml(ch.actionUrl || '#')}" class="channel-row" ${targetAttr}>
              <div class="ch-id">CH ${escapeHtml(ch.channelNumber || '01')}<b>${escapeHtml(ch.type || 'COMM')}</b></div>
              <div class="ch-icon"><i class="${escapeHtml(ch.icon || 'fas fa-envelope')}"></i></div>
              <div class="ch-body">
                <h4>${escapeHtml(ch.name || '')}</h4>
                <p>${escapeHtml(ch.description || '')}</p>
              </div>
              <div class="ch-status"><span class="dot"></span> ${escapeHtml(ch.status || 'ONLINE')}</div>
            </a>
          `;
        }).join('');
      }
    }

    // 5. Transmit Console Form Settings
    const consoleTitleEl = document.getElementById('consoleFormTitle');
    const consoleFreqEl = document.getElementById('consoleFormFreq');
    const submitTextEl = document.getElementById('formSubmitText');
    const subjectSelect = document.getElementById('formSubject');

    if (consoleTitleEl && formSettings.formTitle) {
      consoleTitleEl.innerHTML = `<span class="dot"></span> ${escapeHtml(formSettings.formTitle)}`;
    }
    if (consoleFreqEl && formSettings.frequencyLabel) {
      consoleFreqEl.textContent = formSettings.frequencyLabel;
    }
    if (submitTextEl && formSettings.submitButtonText) {
      submitTextEl.textContent = formSettings.submitButtonText;
    }

    // Dynamic Subject Dropdown Options
    if (subjectSelect && Array.isArray(formSettings.subjectOptions) && formSettings.subjectOptions.length > 0) {
      const currentSelected = subjectSelect.value;
      let optionsHtml = `<option value="">Select a subject...</option>`;
      formSettings.subjectOptions
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(opt => {
          const isSelected = opt.value === currentSelected ? 'selected' : '';
          optionsHtml += `<option value="${escapeHtml(opt.value)}" ${isSelected}>${escapeHtml(opt.label || opt.value)}</option>`;
        });
      subjectSelect.innerHTML = optionsHtml;
    }
  }

  function hydrateFindUsSection(findUs) {
    if (!findUs) return;

    const eyebrowEl = document.getElementById('pitlaneEyebrowEl');
    const titleEl = document.getElementById('pitlaneTitleEl');
    const descEl = document.getElementById('pitlaneSubtitleEl');
    const mapIframe = document.getElementById('pitlaneMapIframe');
    const workshopNameEl = document.getElementById('workshopNameEl');
    const locationEl = document.getElementById('workshopLocationEl');
    const coordEl = document.getElementById('coordReadout');
    const accessEl = document.getElementById('workshopAccessEl');
    const hoursEl = document.getElementById('workshopHoursEl');
    const noteEl = document.getElementById('workshopNoteEl');

    // 1. Eyebrow
    if (eyebrowEl && findUs.eyebrow) {
      eyebrowEl.textContent = findUs.eyebrow;
    }

    // 2. Title with highlight
    if (titleEl && findUs.title) {
      if (findUs.titleHighlight && findUs.title.includes(findUs.titleHighlight)) {
        const parts = findUs.title.split(findUs.titleHighlight);
        titleEl.innerHTML = `${escapeHtml(parts[0])}<span class="text-gradient">${escapeHtml(findUs.titleHighlight)}</span>${escapeHtml(parts.slice(1).join(findUs.titleHighlight))}`;
      } else {
        titleEl.textContent = findUs.title;
      }
    }

    // 3. Description
    if (descEl && findUs.description) {
      descEl.textContent = findUs.description;
    }

    // 4. Map Embed & Coordinates
    const map = findUs.map || {};
    if (mapIframe && map.embedUrl && mapIframe.src !== map.embedUrl) {
      mapIframe.src = map.embedUrl;
    }
    if (coordEl && (map.latitude || map.longitude)) {
      coordEl.textContent = `${map.latitude || ''} / ${map.longitude || ''}`.trim().replace(/^ \/ | \/ $/g, '');
    }

    // 5. Workshop Data Readout
    const workshop = findUs.workshop || {};
    if (workshopNameEl && workshop.name) {
      workshopNameEl.textContent = workshop.name;
    }
    if (locationEl && workshop.address) {
      locationEl.textContent = workshop.address;
    }
    if (accessEl && workshop.access) {
      accessEl.textContent = workshop.access;
    }
    if (hoursEl && workshop.hours) {
      hoursEl.textContent = workshop.hours;
    }
    if (noteEl && workshop.visitorInstructions) {
      noteEl.textContent = workshop.visitorInstructions;
    }
  }

  function renderAdminBar(pageData) {
    if (!isAdmin()) return;

    let adminBar = document.getElementById('ashwaContactAdminBar');
    if (adminBar) adminBar.remove();

    adminBar = document.createElement('div');
    adminBar.id = 'ashwaContactAdminBar';
    adminBar.style.cssText = `
      position: fixed;
      top: 80px;
      right: 24px;
      z-index: 10000;
      background: rgba(18, 18, 23, 0.95);
      border: 1px solid #F25912;
      border-radius: 8px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      backdrop-filter: blur(8px);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
    `;

    adminBar.innerHTML = `
      <span style="color:#F25912; display:flex; align-items:center; gap:6px;">
        <span style="width:7px; height:7px; border-radius:50%; background:#F25912; animation:pulse-dot 1.5s infinite;"></span>
        ${isPreview ? 'PREVIEW MODE' : 'ADMIN ACTIVE'}
      </span>
      <span style="color:#8E929E;">v${pageData.version || 1}</span>
      <a href="/admin/#/contact" target="_blank" style="background:#F25912; color:#10141c; text-decoration:none; padding:4px 8px; border-radius:4px; font-weight:700;">
        <i class="fas fa-sliders"></i> Edit Page
      </a>
    `;

    document.body.appendChild(adminBar);
  }

  async function init() {
    const data = await fetchContactPageData();
    if (!data) return;

    hydrateHeroSection(data.heroSection);
    hydrateChannelsSection(data.channelsSection);
    hydrateFindUsSection(data.findUsSection);
    renderAdminBar(data);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
