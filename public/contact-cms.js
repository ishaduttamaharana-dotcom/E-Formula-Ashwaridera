/* ============================================================
   contact-cms.js — Unified Contact Page Dynamic Hydration Engine
   Ashwa Riders Formula Student Electric Team

   Connects:
     Admin Dashboard -> MongoDB -> Public API -> Contact Frontend

   Hydrates:
     01. HERO SECTION (Eyebrow, title, highlight, description,
         background image, dark overlay intensity, and telemetry stats)
     02. OPEN CHANNELS (Eyebrow, title, highlight, description,
         and channel list with status dots and actionable links)
     03. TRANSMIT CONSOLE (Form title, frequency badge, submit button text,
         and dynamic subject/channel options)
     04. BROADCAST SOCIAL LINKS (Instagram, LinkedIn, YouTube, Twitter/X, GitHub, WhatsApp)
     05. FIND US / PIT LANE (Map iframe embed, lat/long coordinates,
         workshop name, physical address, access, hours, visitor instructions)
     06. PREVIEW MODE SUPPORT (?preview=true)
============================================================ */

(function () {
  'use strict';

  // Prevent duplicate script execution
  if (window._ashwaContactCmsLoaded) return;
  window._ashwaContactCmsLoaded = true;

  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get('preview') === 'true';

  const getApiEndpoint = () => {
    const base = '/api/v1/contact/page';
    const params = new URLSearchParams();
    if (isPreview) params.set('preview', 'true');
    params.set('_t', Date.now().toString());
    return `${base}?${params.toString()}`;
  };

  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };


  /**
   * Fetch authoritative Contact Page content from live API.
   * Never falls back to stale caches (localStorage or sessionStorage).
   */
  async function fetchContactPageData() {
    const res = await fetch(getApiEndpoint(), {
      headers: { 'Accept': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.success && data.data) {
      return data.data;
    }
    throw new Error(data?.message || 'Invalid Contact API response format');
  }

  function hydrateHeroSection(hero) {
    if (!hero) return;

    const heroSection = document.getElementById('contactHeroSection');
    const badgeText = document.getElementById('contactHeroBadgeText');
    const titleEl = document.getElementById('contactHeroTitle');
    const descEl = document.getElementById('contactHeroDesc') || document.getElementById('contactHeroLede');
    const telemetryWrap = document.getElementById('contactHeroTelemetry');

    // 1. Eyebrow badge
    if (badgeText && hero.eyebrow) {
      badgeText.textContent = hero.eyebrow;
    }

    // 2. Title with highlight
    const titleText = hero.title || hero.heading;
    const highlightText = hero.titleHighlight || hero.headingHighlight;
    if (titleEl && titleText) {
      if (highlightText && titleText.includes(highlightText)) {
        const parts = titleText.split(highlightText);
        titleEl.innerHTML = `${escapeHtml(parts[0])}<span class="text-gradient">${escapeHtml(highlightText)}</span>${escapeHtml(parts.slice(1).join(highlightText))}`;
      } else {
        titleEl.textContent = titleText;
      }
    }

    // 3. Description
    if (descEl && hero.description) {
      descEl.textContent = hero.description;
    }

    // 4. Background image and dark overlay
    if (heroSection) {
      const bgImg = hero.backgroundImage || hero.bgImageUrl;
      if (bgImg) {
        heroSection.style.backgroundImage = `url("${bgImg}")`;
      }
      const overlay = hero.overlayIntensity !== undefined ? hero.overlayIntensity : hero.overlayStrength;
      if (overlay !== undefined) {
        heroSection.style.setProperty('--hero-overlay', `rgba(0, 0, 0, ${overlay})`);
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
    const titleText = channelsSec.title || channelsSec.heading;
    const highlightText = channelsSec.titleHighlight || channelsSec.headingHighlight;
    if (titleEl && titleText) {
      if (highlightText && titleText.includes(highlightText)) {
        const parts = titleText.split(highlightText);
        titleEl.innerHTML = `${escapeHtml(parts[0])}<span class="text-gradient">${escapeHtml(highlightText)}</span>${escapeHtml(parts.slice(1).join(highlightText))}`;
      } else {
        titleEl.textContent = titleText;
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
          let href = ch.actionUrl || '#';
          if (ch.type === 'EMAIL' && !href.startsWith('mailto:')) {
            href = `mailto:${ch.name}`;
          } else if (ch.type === 'VOICE' && !href.startsWith('tel:') && !href.startsWith('http')) {
            href = `tel:${ch.name.replace(/\s+/g, '')}`;
          }
          const isExternal = href.startsWith('http://') || href.startsWith('https://');
          const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
          const secondaryDisplay = ch.secondaryValue ? ` &nbsp;/&nbsp; ${escapeHtml(ch.secondaryValue)}` : '';

          return `
            <a href="${escapeHtml(href)}" class="channel-row" ${targetAttr}>
              <div class="ch-id">CH ${escapeHtml(ch.channelNumber || '01')}<b>${escapeHtml(ch.type || 'COMM')}</b></div>
              <div class="ch-icon"><i class="${escapeHtml(ch.icon || 'fas fa-envelope')}"></i></div>
              <div class="ch-body">
                <h4>${escapeHtml(ch.name || '')}${secondaryDisplay}</h4>
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

    const formTitle = formSettings.formTitle || formSettings.title;
    if (consoleTitleEl && formTitle) {
      consoleTitleEl.innerHTML = `<span class="dot"></span> ${escapeHtml(formTitle)}`;
    }
    if (consoleFreqEl && formSettings.frequencyLabel) {
      consoleFreqEl.textContent = formSettings.frequencyLabel;
    }
    if (submitTextEl && formSettings.submitButtonText) {
      submitTextEl.textContent = formSettings.submitButtonText;
    }

    // Dynamic Subject Dropdown Options
    const opts = formSettings.subjectOptions || formSettings.channelOptions;
    if (subjectSelect && Array.isArray(opts) && opts.length > 0) {
      const currentSelected = subjectSelect.value;
      let optionsHtml = `<option value="">Select a subject...</option>`;
      opts
        .filter(opt => opt.enabled !== false)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .forEach(opt => {
          const isSelected = opt.value === currentSelected ? 'selected' : '';
          optionsHtml += `<option value="${escapeHtml(opt.value)}" ${isSelected}>${escapeHtml(opt.label || opt.value)}</option>`;
        });
      subjectSelect.innerHTML = optionsHtml;
    }
  }

  function hydrateSocialLinks(socialLinks) {
    if (!socialLinks || typeof socialLinks !== 'object') return;

    // Helper to update link by query selector
    const updateLink = (container, selector, url) => {
      if (!url || url === '#') return;
      const el = container.querySelector(selector);
      if (el) {
        el.href = url;
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
      }
    };

    // 1. Broadcast Grid on Contact Page
    const broadcastGrid = document.getElementById('contactBroadcastGrid') || document.querySelector('.broadcast-grid');
    if (broadcastGrid) {
      if (socialLinks.instagram) updateLink(broadcastGrid, 'a[aria-label="Instagram"], a i.fa-instagram', socialLinks.instagram);
      if (socialLinks.linkedin) updateLink(broadcastGrid, 'a[aria-label="LinkedIn"], a i.fa-linkedin-in', socialLinks.linkedin);
      if (socialLinks.youtube) updateLink(broadcastGrid, 'a[aria-label="YouTube"], a i.fa-youtube', socialLinks.youtube);
      if (socialLinks.twitter) updateLink(broadcastGrid, 'a[aria-label="Twitter"], a i.fa-x-twitter', socialLinks.twitter);
      if (socialLinks.github) updateLink(broadcastGrid, 'a[aria-label="GitHub"], a i.fa-github', socialLinks.github);
      if (socialLinks.whatsapp) updateLink(broadcastGrid, 'a[aria-label="WhatsApp"], a i.fa-whatsapp', socialLinks.whatsapp);
    }

    // 2. Footer Social Links
    const footerSocial = document.querySelector('.footer .social-links');
    if (footerSocial) {
      if (socialLinks.instagram) {
        const el = footerSocial.querySelector('a i.fa-instagram')?.parentElement;
        if (el) el.href = socialLinks.instagram;
      }
      if (socialLinks.linkedin) {
        const el = footerSocial.querySelector('a i.fa-linkedin-in')?.parentElement;
        if (el) el.href = socialLinks.linkedin;
      }
      if (socialLinks.youtube) {
        const el = footerSocial.querySelector('a i.fa-youtube')?.parentElement;
        if (el) el.href = socialLinks.youtube;
      }
      if (socialLinks.twitter) {
        const el = footerSocial.querySelector('a i.fa-x-twitter')?.parentElement;
        if (el) el.href = socialLinks.twitter;
      }
      if (socialLinks.github) {
        const el = footerSocial.querySelector('a i.fa-github')?.parentElement;
        if (el) el.href = socialLinks.github;
      }
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
    const titleText = findUs.title || findUs.heading;
    const highlightText = findUs.titleHighlight || findUs.headingHighlight;
    if (titleEl && titleText) {
      if (highlightText && titleText.includes(highlightText)) {
        const parts = titleText.split(highlightText);
        titleEl.innerHTML = `${escapeHtml(parts[0])}<span class="text-gradient">${escapeHtml(highlightText)}</span>${escapeHtml(parts.slice(1).join(highlightText))}`;
      } else {
        titleEl.textContent = titleText;
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
    // Admin bar removed — public auth eliminated
    return;

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

  function renderErrorState(errorMessage) {
    const channelListWrap = document.getElementById('contactChannelList');
    if (channelListWrap) {
      channelListWrap.innerHTML = `
        <div style="background: rgba(255, 77, 77, 0.08); border: 1px solid rgba(255, 77, 77, 0.3); border-radius: 4px; padding: 28px; text-align: center; margin: 16px 0;">
          <i class="fas fa-triangle-exclamation" style="font-size: 2rem; color: #FF4D4D; margin-bottom: 12px; display: block;"></i>
          <h4 style="font-size: 1rem; color: #fff; margin-bottom: 8px; font-family: var(--font-display); text-transform: uppercase;">
            Unable to Load Contact Channels
          </h4>
          <p style="color: rgba(255,255,255,0.65); font-size: 0.85rem; margin-bottom: 16px; font-family: var(--font-mono);">
            ${escapeHtml(errorMessage || 'Unable to establish connection with Race Control servers.')}
          </p>
          <button type="button" id="retryContactChannelsBtn" class="btn btn-secondary" style="padding: 9px 20px; font-size: 0.78rem;">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
      document.getElementById('retryContactChannelsBtn')?.addEventListener('click', loadContactPage);
    }
  }

  function applyContactData(data) {
    if (!data) return;
    hydrateHeroSection(data.heroSection);
    hydrateChannelsSection(data.channelsSection);
    hydrateSocialLinks(data.socialLinks || data.channelsSection?.socialLinks);
    hydrateFindUsSection(data.findUsSection);


    document.querySelectorAll('[data-cms-pending="true"]').forEach(el => {
      el.setAttribute('data-cms-pending', 'false');
    });
  }

  /**
   * Main authoritative Contact loader
   */
  async function loadContactPage() {
    try {
      const data = await fetchContactPageData();
      applyContactData(data);
    } catch (err) {
      console.error('[Contact CMS] Error hydrating live contact content:', err);
      renderErrorState(err.message);
    }
  }

  // Single authoritative initialization path
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadContactPage);
  } else {
    loadContactPage();
  }

  // Expose authoritative loader for programmatic refresh
  window.loadContactPage = loadContactPage;
})();
