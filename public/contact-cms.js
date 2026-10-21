/* ============================================================
   contact-cms.js — Unified Contact Page Dynamic Hydration Engine
   Ashwa Riders Formula Student Electric Team

   Connects:
     Admin Dashboard -> MongoDB -> Public API -> Contact Frontend

   Hydrates:
     01. HERO SECTION (Eyebrow, title, highlight, description,
         background image, dark overlay intensity, and telemetry stats)
     02. OPEN CHANNELS (Eyebrow, title, highlight, description,
         actionable email mailto:, voice tel:, and status indicators)
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
   * Fetch authoritative Contact Page content from live API with 10s abort timeout.
   * Never falls back to stale caches (localStorage or sessionStorage).
   */
  async function fetchContactPageData() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(getApiEndpoint(), {
        signal: controller.signal,
        headers: { 'Accept': 'application/json' },
        credentials: 'include',
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}: ${res.statusText || 'Error'}`);
      }

      const data = await res.json();
      if (data && data.success && data.data) {
        return data.data;
      }
      throw new Error(data?.message || 'Invalid Contact API response format');
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Contact data request timed out. Please check your connection and retry.');
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function renderHighlightedText(fullText, highlight) {
    if (!fullText) return '';
    if (!highlight) return escapeHtml(fullText);

    // Normalize multiple spaces into single space and allow flexible whitespace/hyphen matching
    const escapedWords = highlight
      .trim()
      .split(/[\s\-]+/)
      .filter(Boolean)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

    if (escapedWords.length === 0) return escapeHtml(fullText);

    const pattern = new RegExp(`(${escapedWords.join('[\\s\\-]+')})`, 'i');
    if (!pattern.test(fullText)) {
      return escapeHtml(fullText);
    }
    const parts = fullText.split(pattern);
    return parts.map(part => {
      if (pattern.test(part)) {
        return `<span class="text-gradient">${escapeHtml(part)}</span>`;
      }
      return escapeHtml(part);
    }).join('');
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
    const titleText = (hero.title || hero.heading || '').trim();
    const highlightText = (hero.titleHighlight || hero.headingHighlight || '').trim();
    if (titleEl && titleText) {
      titleEl.innerHTML = renderHighlightedText(titleText, highlightText);
    }

    // 3. Description
    if (descEl && hero.description) {
      descEl.textContent = hero.description;
    }

    // 4. Background image and dark overlay
    if (heroSection) {
      const bgImg = (hero.backgroundImage || hero.bgImageUrl || '').trim();
      if (bgImg) {
        heroSection.style.backgroundImage = `url("${bgImg}")`;
      } else {
        // Deliberate neutral fallback: ensure no hardcoded or stale photo displays
        heroSection.style.backgroundImage = 'none';
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

  function hydrateChannelsSection(channelsSec, rootData = {}) {
    const channelListWrap = document.getElementById('contactChannelList');
    if (!channelListWrap) return;

    channelListWrap.removeAttribute('aria-busy');

    const eyebrowEl = document.getElementById('channelsEyebrowEl');
    const titleEl = document.getElementById('channelsTitleEl');
    const descEl = document.getElementById('channelsDescEl');
    const formSettings = (channelsSec && channelsSec.formSettings) || {};

    // 1. Eyebrow
    if (eyebrowEl && channelsSec && channelsSec.eyebrow) {
      const eb = channelsSec.eyebrow.trim();
      eyebrowEl.textContent = eb.startsWith('//') ? eb : `// ${eb}`;
    }

    // 2. Title with highlight
    const titleText = (channelsSec && (channelsSec.title || channelsSec.heading)) || 'HOW TO REACH US';
    const highlightText = channelsSec && (channelsSec.titleHighlight || channelsSec.headingHighlight);
    if (titleEl && titleText) {
      if (highlightText && titleText.toLowerCase().includes(highlightText.toLowerCase())) {
        const regex = new RegExp(`(${highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
        const parts = titleText.split(regex);
        titleEl.innerHTML = parts.map(part => {
          if (part.toLowerCase() === highlightText.toLowerCase()) {
            return `<span class="text-gradient">${escapeHtml(part)}</span>`;
          }
          return escapeHtml(part);
        }).join('');
      } else {
        titleEl.textContent = titleText;
      }
    }

    // 3. Description
    if (descEl && channelsSec && channelsSec.description) {
      descEl.textContent = channelsSec.description;
    }

    // 4. Channel rows resolution
    let channelsToRender = [];
    if (channelsSec && Array.isArray(channelsSec.channels) && channelsSec.channels.length > 0) {
      channelsToRender = channelsSec.channels.filter(c => c.published !== false);
    }

    // Discover authoritative contact details
    const emailCh = channelsToRender.find(c => c.type === 'EMAIL');
    const authEmail = (rootData.email || rootData.contactInfo?.email || (emailCh ? emailCh.name : '') || '').trim();

    const voiceCh = channelsToRender.find(c => c.type === 'VOICE');
    const authPhone = (rootData.phone || rootData.contactInfo?.phone || (voiceCh ? voiceCh.name : '') || '').trim();
    const authAltPhone = (rootData.alternatePhone || rootData.contactInfo?.alternatePhone || (voiceCh ? voiceCh.secondaryValue : '') || '').trim();

    if (channelsToRender.length === 0) {
      // Build default channels from authoritative CMS values
      if (authEmail) {
        channelsToRender.push({
          id: 'ch-email',
          channelNumber: '01',
          type: 'EMAIL',
          name: authEmail,
          secondaryValue: '',
          description: 'Best for sponsorship, press, and detailed queries',
          status: 'MONITORED',
          icon: 'fas fa-envelope',
          actionUrl: `mailto:${authEmail}`,
          order: 1,
          published: true,
        });
      }
      if (authPhone) {
        channelsToRender.push({
          id: 'ch-voice',
          channelNumber: '02',
          type: 'VOICE',
          name: authPhone,
          secondaryValue: authAltPhone,
          description: rootData.officeHours || rootData.contactInfo?.officeHours || 'Mon–Sat, 9:00 AM – 7:00 PM IST',
          status: 'ON DUTY',
          icon: 'fas fa-phone',
          actionUrl: `tel:${authPhone.replace(/\s+/g, '')}`,
          order: 2,
          published: true,
        });
      }
    } else {
      // If EMAIL channel exists in array, ensure it uses authoritative email
      if (emailCh && authEmail && !emailCh.name) {
        emailCh.name = authEmail;
        emailCh.actionUrl = `mailto:${authEmail}`;
      } else if (!emailCh && authEmail) {
        channelsToRender.unshift({
          id: 'ch-email',
          channelNumber: '01',
          type: 'EMAIL',
          name: authEmail,
          secondaryValue: '',
          description: 'Best for sponsorship, press, and detailed queries',
          status: 'MONITORED',
          icon: 'fas fa-envelope',
          actionUrl: `mailto:${authEmail}`,
          order: 1,
          published: true,
        });
      }

      // If VOICE channel exists in array, ensure it uses authoritative phone
      if (voiceCh && authPhone && !voiceCh.name) {
        voiceCh.name = authPhone;
        voiceCh.actionUrl = `tel:${authPhone.replace(/\s+/g, '')}`;
        if (authAltPhone && !voiceCh.secondaryValue) voiceCh.secondaryValue = authAltPhone;
      } else if (!voiceCh && authPhone) {
        const emIdx = channelsToRender.findIndex(c => c.type === 'EMAIL');
        const vObj = {
          id: 'ch-voice',
          channelNumber: '02',
          type: 'VOICE',
          name: authPhone,
          secondaryValue: authAltPhone,
          description: rootData.officeHours || rootData.contactInfo?.officeHours || 'Mon–Sat, 9:00 AM – 7:00 PM IST',
          status: 'ON DUTY',
          icon: 'fas fa-phone',
          actionUrl: `tel:${authPhone.replace(/\s+/g, '')}`,
          order: 2,
          published: true,
        };
        if (emIdx >= 0) channelsToRender.splice(emIdx + 1, 0, vObj);
        else channelsToRender.push(vObj);
      }
    }

    channelsToRender.sort((a, b) => (a.order || 0) - (b.order || 0));

    // If still no channels at all, render a clear unavailable state
    if (channelsToRender.length === 0) {
      channelListWrap.innerHTML = `
        <div class="channel-row channel-unavailable" style="opacity: 0.7; padding: 22px 14px;">
          <div class="ch-id">CH 00<b>STATUS</b></div>
          <div class="ch-icon"><i class="fas fa-tower-broadcast"></i></div>
          <div class="ch-body">
            <h4>No Active Channels Configured</h4>
            <p>Direct communication channels are temporarily unconfigured. Please use the Transmit Console to reach our pit box.</p>
          </div>
          <div class="ch-status"><span class="dot" style="background: #8E929E;"></span> STANDBY</div>
        </div>
      `;
      return;
    }

    // Render channels list with authoritative data
    channelListWrap.innerHTML = channelsToRender.map(ch => {
      const type = (ch.type || 'COMM').toUpperCase();
      const rawVal = (ch.name || '').trim();

      // EMAIL CHANNEL
      if (type === 'EMAIL') {
        if (!rawVal) {
          return `
            <div class="channel-row channel-unavailable" style="opacity: 0.6; cursor: default;">
              <div class="ch-id">CH ${escapeHtml(ch.channelNumber || '01')}<b>EMAIL</b></div>
              <div class="ch-icon"><i class="${escapeHtml(ch.icon || 'fas fa-envelope')}"></i></div>
              <div class="ch-body">
                <h4 style="color: var(--ink-soft);">Channel Unavailable</h4>
                <p>Email address not currently configured.</p>
              </div>
              <div class="ch-status"><span class="dot" style="background: #8E929E;"></span> OFFLINE</div>
            </div>
          `;
        }
        const href = ch.actionUrl && ch.actionUrl.startsWith('mailto:') ? ch.actionUrl : `mailto:${rawVal}`;
        return `
          <a href="${escapeHtml(href)}" class="channel-row" id="contactEmailChannel" aria-label="Send email to ${escapeHtml(rawVal)}">
            <div class="ch-id">CH ${escapeHtml(ch.channelNumber || '01')}<b>EMAIL</b></div>
            <div class="ch-icon"><i class="${escapeHtml(ch.icon || 'fas fa-envelope')}"></i></div>
            <div class="ch-body">
              <h4>${escapeHtml(rawVal)}</h4>
              <p>${escapeHtml(ch.description || 'Best for sponsorship, press, and detailed queries')}</p>
            </div>
            <div class="ch-status"><span class="dot"></span> ${escapeHtml(ch.status || 'MONITORED')}</div>
          </a>
        `;
      }

      // VOICE CHANNEL
      if (type === 'VOICE') {
        if (!rawVal) {
          return `
            <div class="channel-row channel-unavailable" style="opacity: 0.6; cursor: default;">
              <div class="ch-id">CH ${escapeHtml(ch.channelNumber || '02')}<b>VOICE</b></div>
              <div class="ch-icon"><i class="${escapeHtml(ch.icon || 'fas fa-phone')}"></i></div>
              <div class="ch-body">
                <h4 style="color: var(--ink-soft);">Channel Unavailable</h4>
                <p>Voice / telephone line not currently configured.</p>
              </div>
              <div class="ch-status"><span class="dot" style="background: #8E929E;"></span> OFFLINE</div>
            </div>
          `;
        }
        const phoneClean = rawVal.replace(/\s+/g, '');
        const href = ch.actionUrl && (ch.actionUrl.startsWith('tel:') || ch.actionUrl.startsWith('http')) ? ch.actionUrl : `tel:${phoneClean}`;
        const secondary = (ch.secondaryValue || '').trim();
        const secondaryDisplay = secondary ? ` &nbsp;/&nbsp; ${escapeHtml(secondary)}` : '';
        return `
          <a href="${escapeHtml(href)}" class="channel-row" id="contactVoiceChannel" aria-label="Call telephone ${escapeHtml(rawVal)}">
            <div class="ch-id">CH ${escapeHtml(ch.channelNumber || '02')}<b>VOICE</b></div>
            <div class="ch-icon"><i class="${escapeHtml(ch.icon || 'fas fa-phone')}"></i></div>
            <div class="ch-body">
              <h4>${escapeHtml(rawVal)}${secondaryDisplay}</h4>
              <p>${escapeHtml(ch.description || 'Mon–Sat, 9:00 AM – 7:00 PM IST')}</p>
            </div>
            <div class="ch-status"><span class="dot"></span> ${escapeHtml(ch.status || 'ON DUTY')}</div>
          </a>
        `;
      }

      // OTHER CHANNELS (WhatsApp / Radio, Pit workshop, etc.)
      let href = ch.actionUrl || '#';
      if ((type === 'RADIO' || type === 'WHATSAPP') && !href.startsWith('http') && rawVal) {
        href = `https://wa.me/${rawVal.replace(/\D/g, '')}`;
      } else if (type === 'PIT' && !href.startsWith('#') && !href.startsWith('http')) {
        href = '#pitlane';
      }

      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      const targetAttr = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
      const secondaryDisplay = ch.secondaryValue ? ` &nbsp;/&nbsp; ${escapeHtml(ch.secondaryValue)}` : '';

      return `
        <a href="${escapeHtml(href)}" class="channel-row" ${targetAttr}>
          <div class="ch-id">CH ${escapeHtml(ch.channelNumber || '01')}<b>${escapeHtml(ch.type || 'COMM')}</b></div>
          <div class="ch-icon"><i class="${escapeHtml(ch.icon || 'fas fa-envelope')}"></i></div>
          <div class="ch-body">
            <h4>${escapeHtml(rawVal || '')}${secondaryDisplay}</h4>
            <p>${escapeHtml(ch.description || '')}</p>
          </div>
          <div class="ch-status"><span class="dot"></span> ${escapeHtml(ch.status || 'ONLINE')}</div>
        </a>
      `;
    }).join('');

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

    const broadcastGrid = document.getElementById('contactBroadcastGrid') || document.querySelector('.broadcast-grid');

    const updateSocialLink = (container, selector, rawUrl) => {
      if (!container) return;
      const el = container.querySelector(selector);
      if (!el) return;

      const url = (rawUrl || '').trim();
      if (url && url !== '#' && !url.startsWith('javascript:')) {
        el.href = url;
        el.target = '_blank';
        el.rel = 'noopener noreferrer';
        el.removeAttribute('aria-disabled');
        el.style.opacity = '1';
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
      } else {
        // Missing or placeholder URL handled gracefully without broken navigation
        el.removeAttribute('href');
        el.setAttribute('aria-disabled', 'true');
        el.setAttribute('title', 'Not configured');
        el.style.opacity = '0.35';
        el.style.pointerEvents = 'none';
        el.style.cursor = 'default';
      }
    };

    if (broadcastGrid) {
      updateSocialLink(broadcastGrid, 'a[aria-label="Instagram"], a i.fa-instagram', socialLinks.instagram);
      updateSocialLink(broadcastGrid, 'a[aria-label="LinkedIn"], a i.fa-linkedin-in', socialLinks.linkedin);
      updateSocialLink(broadcastGrid, 'a[aria-label="YouTube"], a i.fa-youtube', socialLinks.youtube);
      updateSocialLink(broadcastGrid, 'a[aria-label="Twitter"], a i.fa-x-twitter', socialLinks.twitter);
      updateSocialLink(broadcastGrid, 'a[aria-label="GitHub"], a i.fa-github', socialLinks.github);
      updateSocialLink(broadcastGrid, 'a[aria-label="WhatsApp"], a i.fa-whatsapp', socialLinks.whatsapp);
    }

    const footerSocial = document.querySelector('.footer .social-links');
    if (footerSocial) {
      updateSocialLink(footerSocial, 'a i.fa-instagram', socialLinks.instagram);
      updateSocialLink(footerSocial, 'a i.fa-linkedin-in', socialLinks.linkedin);
      updateSocialLink(footerSocial, 'a i.fa-youtube', socialLinks.youtube);
      updateSocialLink(footerSocial, 'a i.fa-x-twitter', socialLinks.twitter);
      updateSocialLink(footerSocial, 'a i.fa-github', socialLinks.github);
      updateSocialLink(footerSocial, 'a i.fa-whatsapp', socialLinks.whatsapp);
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
      if (highlightText && titleText.toLowerCase().includes(highlightText.toLowerCase())) {
        const regex = new RegExp(`(${highlightText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i');
        const parts = titleText.split(regex);
        titleEl.innerHTML = parts.map(part => {
          if (part.toLowerCase() === highlightText.toLowerCase()) {
            return `<span class="text-gradient">${escapeHtml(part)}</span>`;
          }
          return escapeHtml(part);
        }).join('');
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

  function renderLoadingState() {
    const channelListWrap = document.getElementById('contactChannelList');
    if (channelListWrap) {
      channelListWrap.setAttribute('aria-busy', 'true');
      channelListWrap.innerHTML = `
        <div class="channel-row channel-skeleton" style="opacity: 0.7; pointer-events: none;">
          <div class="ch-id">CH 01<b>EMAIL</b></div>
          <div class="ch-icon"><i class="fas fa-circle-notch fa-spin"></i></div>
          <div class="ch-body">
            <div style="height: 16px; width: 220px; background: currentColor; opacity: 0.15; border-radius: 2px; margin-bottom: 6px;"></div>
            <div style="height: 12px; width: 260px; background: currentColor; opacity: 0.08; border-radius: 2px;"></div>
          </div>
          <div class="ch-status"><span class="dot" style="background: var(--signal);"></span> Loading...</div>
        </div>
        <div class="channel-row channel-skeleton" style="opacity: 0.5; pointer-events: none;">
          <div class="ch-id">CH 02<b>VOICE</b></div>
          <div class="ch-icon"><i class="fas fa-circle-notch fa-spin"></i></div>
          <div class="ch-body">
            <div style="height: 16px; width: 180px; background: currentColor; opacity: 0.15; border-radius: 2px; margin-bottom: 6px;"></div>
            <div style="height: 12px; width: 200px; background: currentColor; opacity: 0.08; border-radius: 2px;"></div>
          </div>
          <div class="ch-status"><span class="dot" style="background: var(--signal);"></span> Loading...</div>
        </div>
      `;
    }
  }

  function renderErrorState(errorMessage) {
    const channelListWrap = document.getElementById('contactChannelList');
    if (channelListWrap) {
      channelListWrap.removeAttribute('aria-busy');
      channelListWrap.innerHTML = `
        <div style="background: rgba(255, 77, 77, 0.08); border: 1px solid rgba(255, 77, 77, 0.3); border-radius: 4px; padding: 28px; text-align: center; margin: 16px 0;">
          <i class="fas fa-triangle-exclamation" style="font-size: 2rem; color: #FF4D4D; margin-bottom: 12px; display: block;"></i>
          <h4 style="font-size: 1rem; color: #fff; margin-bottom: 8px; font-family: var(--font-display, inherit); text-transform: uppercase;">
            Unable to Load Contact Channels
          </h4>
          <p style="color: rgba(255,255,255,0.65); font-size: 0.85rem; margin-bottom: 16px; font-family: var(--font-mono, monospace);">
            ${escapeHtml(errorMessage || 'Unable to establish connection with Race Control servers.')}
          </p>
          <button type="button" id="retryContactChannelsBtn" class="btn btn-secondary" style="padding: 9px 20px; font-size: 0.78rem; cursor: pointer;">
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
    hydrateChannelsSection(data.channelsSection, data);
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
    renderLoadingState();
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
