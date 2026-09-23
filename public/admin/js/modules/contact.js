/* ============================================================
   contact.js — Unified Contact Page Control Center
   ASHWA RIDERS Formula Student Electric Team

   Structure:
     01. HEADER CONTROL BAR (Draft / Publish / Preview / Versioning)
     02. BLOCK 01: HEADER / HERO & TELEMETRY STATS
     03. BLOCK 02: OPEN CHANNELS & TRANSMIT FORM CONFIGURATION
     04. BLOCK 03: FIND US (MAP & WORKSHOP LOCATION)
     05. BLOCK 04: GLOBAL FOOTER REFERENCE

   Draft / Preview / Publish lifecycle with lightweight JSON only.
============================================================ */

(function () {
  'use strict';

  let currentData = null;
  let isDirty = false;
  let isSaving = false;

  const API = () => window.AdminApi;

  const showToast = (msg, type = 'success') => {
    if (window.AdminToast) {
      if (type === 'error') window.AdminToast.error(msg);
      else if (type === 'warn') window.AdminToast.warn(msg);
      else window.AdminToast.success(msg);
    } else {
      console.log(`[Toast ${type}]: ${msg}`);
    }
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

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    try {
      const d = new Date(dateStr);
      return isNaN(d.getTime()) ? 'Never' : d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'Never';
    }
  };

  // Ensure lightweight JSON URLs only (MediaPicker / Cloudinary), never base64
  const ensureCleanUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    const trimmed = url.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
      showToast('Raw file/base64 uploads are rejected. Please use MediaPicker.', 'warn');
      return '';
    }
    return trimmed;
  };

  // ============================================================
  //  MAIN ENTRY POINT
  // ============================================================
  async function renderContactModule(container) {
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:360px; color:#9696A0;">
        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-right:12px; color:#F25912;"></i>
        <span style="font-family:monospace; font-size:0.95rem;">Loading Contact Page Control Center...</span>
      </div>
    `;

    await loadContactData(container);
  }

  async function loadContactData(container) {
    try {
      const res = await API().get('/admin/contact/page');
      if (res && res.success && res.data) {
        currentData = res.data;
        normalizeData();
        renderInterface(container);
        isDirty = false;
        updateSaveBadge('saved');
      } else {
        throw new Error(res?.message || 'Failed to load Contact page data.');
      }
    } catch (err) {
      console.error('Error loading Contact CMS data:', err);
      container.innerHTML = `
        <div style="background:#141419; border:1px solid #FF4D4D; border-radius:12px; padding:40px; text-align:center; max-width:600px; margin:40px auto;">
          <i class="fas fa-triangle-exclamation" style="font-size:2.5rem; color:#FF4D4D; margin-bottom:16px;"></i>
          <h2 style="font-size:1.25rem; font-weight:800; color:#FFFFFF; margin-bottom:8px;">Unable to Load Contact Control Center</h2>
          <p style="color:#9696A0; font-size:0.9rem; margin-bottom:24px;">${escapeHtml(err.message)}</p>
          <button type="button" class="btn btn-primary" id="retryContactLoadBtn" style="background:#F25912; border-color:#F25912;">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
      document.getElementById('retryContactLoadBtn')?.addEventListener('click', () => loadContactData(container));
    }
  }

  function normalizeData() {
    if (!currentData) return;
    currentData.settings = currentData.settings || {};
    currentData.heroSection = currentData.heroSection || {};
    currentData.heroSection.stats = currentData.heroSection.stats || [];
    currentData.heroSection.title = currentData.heroSection.title || currentData.heroSection.heading || 'TALK TO ASHWA RIDERS';
    currentData.heroSection.titleHighlight = currentData.heroSection.titleHighlight || currentData.heroSection.headingHighlight || 'ASHWA RIDERS';
    currentData.heroSection.backgroundImage = currentData.heroSection.backgroundImage || currentData.heroSection.bgImageUrl || '';
    currentData.heroSection.overlayIntensity = currentData.heroSection.overlayIntensity !== undefined ? currentData.heroSection.overlayIntensity : (currentData.heroSection.overlayStrength !== undefined ? currentData.heroSection.overlayStrength : 0.85);

    currentData.channelsSection = currentData.channelsSection || {};
    currentData.channelsSection.channels = currentData.channelsSection.channels || [];
    currentData.channelsSection.title = currentData.channelsSection.title || currentData.channelsSection.heading || 'PICK A FREQUENCY';
    currentData.channelsSection.titleHighlight = currentData.channelsSection.titleHighlight || currentData.channelsSection.headingHighlight || 'FREQUENCY';
    currentData.channelsSection.formSettings = currentData.channelsSection.formSettings || {};
    
    // Support both subjectOptions and channelOptions
    const opts = currentData.channelsSection.formSettings.subjectOptions || currentData.channelsSection.formSettings.channelOptions || [];
    currentData.channelsSection.formSettings.subjectOptions = opts.map(o => ({
      value: o.value || '',
      label: o.label || o.value || '',
      order: o.order || 1,
      enabled: o.enabled !== false,
    }));
    currentData.channelsSection.formSettings.channelOptions = currentData.channelsSection.formSettings.subjectOptions;

    currentData.findUsSection = currentData.findUsSection || {};
    currentData.findUsSection.title = currentData.findUsSection.title || currentData.findUsSection.heading || 'THE PIT LANE';
    currentData.findUsSection.titleHighlight = currentData.findUsSection.titleHighlight || currentData.findUsSection.headingHighlight || 'PIT LANE';
    currentData.findUsSection.map = currentData.findUsSection.map || {};
    currentData.findUsSection.workshop = currentData.findUsSection.workshop || {};
  }

  // ============================================================
  //  RENDER MAIN INTERFACE
  // ============================================================
  function renderInterface(container) {
    const hero = currentData.heroSection || {};
    const stats = hero.stats || [];
    const channelsSec = currentData.channelsSection || {};
    const channels = channelsSec.channels || [];
    const formSettings = channelsSec.formSettings || {};
    const subjectOpts = formSettings.subjectOptions || [];
    const findUs = currentData.findUsSection || {};
    const map = findUs.map || {};
    const workshop = findUs.workshop || {};

    const overlayPercent = Math.round(((hero.overlayIntensity !== undefined ? hero.overlayIntensity : 0.85) * 100));

    container.innerHTML = `
      <div class="contact-cms-root" style="color:#ECECF1; padding-bottom:80px;">

        <!-- ─── TOP ACTION BAR ────────────────────────────────────── -->
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
              <span style="font-family:monospace; font-size:0.75rem; color:#F25912; background:rgba(242,89,18,0.12); padding:3px 8px; border-radius:4px; font-weight:700; border:1px solid rgba(242,89,18,0.3);">
                MODULE 07
              </span>
              <h2 style="font-size:1.5rem; font-weight:900; color:#FFFFFF; margin:0; letter-spacing:-0.02em; display:flex; align-items:center; gap:8px;">
                <i class="fas fa-tower-broadcast" style="color:#F25912;"></i> Contact Control Center
              </h2>
            </div>
            <p style="font-size:0.85rem; color:#8E929E; margin:0;">
              Manage hero frequency telemetry, open communications channels, transmit console, pit lane location, and map coordinates.
            </p>
          </div>

          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <!-- Save status pill -->
            <div id="contactSavePill" style="display:inline-flex; align-items:center; gap:6px; background:#181820; border:1px solid #2D2D3B; padding:7px 14px; border-radius:20px; font-size:0.8rem; font-weight:600;">
              <span id="contactSaveDot" style="width:8px; height:8px; border-radius:50%; background:#2EA44F;"></span>
              <span id="contactSaveText" style="color:#8E929E;">All changes saved</span>
            </div>

            <span style="font-family:monospace; font-size:0.75rem; color:#6B6F7B; background:#121217; padding:7px 10px; border-radius:6px; border:1px solid #242430;">
              v${currentData.version || 1} &bull; Pub: ${formatDate(currentData.lastPublishedAt)}
            </span>

            <button type="button" class="btn btn-secondary btn-sm" id="btnSaveContactDraft" style="display:inline-flex; align-items:center; gap:6px; border-color:#3A3A4C;">
              <i class="fas fa-floppy-disk"></i> Save Draft
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnPreviewContact" style="display:inline-flex; align-items:center; gap:6px; border-color:#3A3A4C;">
              <i class="fas fa-eye"></i> Preview
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="btnPublishContact" style="display:inline-flex; align-items:center; gap:6px; background:#F25912; border-color:#F25912; font-weight:700;">
              <i class="fas fa-paper-plane"></i> Publish Live
            </button>
          </div>
        </div>

        <form id="contactCmsMainForm" onsubmit="return false;" style="display:flex; flex-direction:column; gap:24px;">

          <!-- ══════════════════════════════════════════════════════════
               BLOCK 01: HEADER / HERO & TELEMETRY STATS
          ══════════════════════════════════════════════════════════ -->
          <div class="cms-card" style="background:#141419; border:1px solid #242430; border-radius:12px; overflow:hidden;">
            <div style="background:#181820; border-bottom:1px solid #242430; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:32px; height:32px; border-radius:6px; background:rgba(242,89,18,0.15); color:#F25912; display:flex; align-items:center; justify-content:center; font-size:0.95rem;">
                  <i class="fas fa-satellite-dish"></i>
                </div>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0;">01. Header / Hero &amp; Telemetry Stats</h3>
                  <p style="font-size:0.78rem; color:#8E929E; margin:0;">Eyebrow, callsign headings, background media, and 4 telemetry status blocks</p>
                </div>
              </div>
            </div>

            <div style="padding:22px; display:flex; flex-direction:column; gap:20px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div class="cms-field">
                  <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                    Hero Eyebrow
                  </label>
                  <input type="text" id="heroEyebrow" class="cms-input" value="${escapeHtml(hero.eyebrow || 'RACE CONTROL — OPEN FREQUENCY')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem;" />
                </div>
                <div class="cms-field">
                  <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                    Title Highlight Text (Orange Accent)
                  </label>
                  <input type="text" id="heroTitleHighlight" class="cms-input" value="${escapeHtml(hero.titleHighlight || 'ASHWA RIDERS')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem;" />
                </div>
              </div>

              <div class="cms-field">
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                  Hero Title *
                </label>
                <input type="text" id="heroTitle" class="cms-input" value="${escapeHtml(hero.title || 'TALK TO ASHWA RIDERS')}" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.95rem; font-weight:700;" />
              </div>

              <div class="cms-field">
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                  Hero Description / Lede
                </label>
                <textarea id="heroDescription" rows="2" class="cms-input" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem; resize:vertical;">${escapeHtml(hero.description || 'Sponsorship, recruitment, media, or just a question about the car — pick a channel below or send a transmission straight to the pit box.')}</textarea>
              </div>

              <!-- MediaPicker Background & Overlay -->
              <div style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                  <span style="font-size:0.8rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#ECECF1;">
                    <i class="fas fa-image" style="color:#F25912; margin-right:6px;"></i> Hero Background Image &amp; Overlay Intensity
                  </span>
                  <div style="display:flex; gap:8px;">
                    <button type="button" class="btn btn-secondary btn-sm" id="btnPickHeroBg" style="font-size:0.78rem; padding:5px 12px;">
                      <i class="fas fa-folder-open"></i> MediaPicker
                    </button>
                    <button type="button" class="btn btn-outline btn-sm" id="btnClearHeroBg" style="font-size:0.78rem; padding:5px 12px; color:#FF4D4D; border-color:rgba(255,77,77,0.3);">
                      <i class="fas fa-times"></i> Clear
                    </button>
                  </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 2fr; gap:16px; align-items:center;">
                  <div id="heroBgPreviewWrap" style="height:110px; border-radius:6px; background:#000; border:1px dashed #3A3A4C; overflow:hidden; position:relative; display:flex; align-items:center; justify-content:center;">
                    ${hero.backgroundImage ? `
                      <img src="${escapeHtml(hero.backgroundImage)}" alt="Hero BG" style="width:100%; height:100%; object-fit:cover;" id="heroBgImgEl" />
                      <div id="heroBgOverlayPreview" style="position:absolute; inset:0; background:rgba(0,0,0,${hero.overlayIntensity !== undefined ? hero.overlayIntensity : 0.85}); pointer-events:none;"></div>
                    ` : `
                      <span style="color:#6B6F7B; font-size:0.78rem; font-family:monospace;">No image selected (Default theme)</span>
                    `}
                  </div>

                  <div>
                    <input type="text" id="heroBackgroundImage" class="cms-input" placeholder="https://res.cloudinary.com/..." value="${escapeHtml(hero.backgroundImage || '')}" 
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-family:monospace; margin-bottom:12px;" />

                    <div>
                      <div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#8E929E; margin-bottom:4px;">
                        <span>Dark Overlay Intensity</span>
                        <span id="heroOverlayValText" style="font-weight:700; color:#F25912;">${overlayPercent}%</span>
                      </div>
                      <input type="range" id="heroOverlayIntensity" min="0" max="1" step="0.05" value="${hero.overlayIntensity !== undefined ? hero.overlayIntensity : 0.85}" 
                        style="width:100%; accent-color:#F25912; cursor:pointer;" />
                    </div>
                  </div>
                </div>
              </div>

              <!-- Telemetry Stats Sub-Manager -->
              <div style="border-top:1px solid #242430; padding-top:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                  <div>
                    <h4 style="font-size:0.92rem; font-weight:800; color:#FFFFFF; margin:0; display:flex; align-items:center; gap:8px;">
                      <i class="fas fa-gauge-high" style="color:#F25912;"></i> Telemetry Statistics Strip (${stats.length})
                    </h4>
                    <p style="font-size:0.76rem; color:#8E929E; margin:0;">Live telemetry indicators shown under hero text (e.g. &lt; 24H Avg Reply, 04 Open Channels)</p>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm" id="btnAddStatBtn" style="font-size:0.78rem; padding:6px 14px; border-color:#3A3A4C;">
                    <i class="fas fa-plus"></i> Add Stat
                  </button>
                </div>

                <div id="statsListContainer" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:12px;">
                  ${renderStatsCards(stats)}
                </div>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════════
               BLOCK 02: OPEN CHANNELS & TRANSMIT FORM CONFIGURATION
          ══════════════════════════════════════════════════════════ -->
          <div class="cms-card" style="background:#141419; border:1px solid #242430; border-radius:12px; overflow:hidden;">
            <div style="background:#181820; border-bottom:1px solid #242430; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:32px; height:32px; border-radius:6px; background:rgba(242,89,18,0.15); color:#F25912; display:flex; align-items:center; justify-content:center; font-size:0.95rem;">
                  <i class="fas fa-network-wired"></i>
                </div>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0;">02. Open Channels &amp; Transmit Form</h3>
                  <p style="font-size:0.78rem; color:#8E929E; margin:0;">Communication channels roster (Email, Voice, Radio, Pit) and Transmit Console form settings</p>
                </div>
              </div>
            </div>

            <div style="padding:22px; display:flex; flex-direction:column; gap:20px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div class="cms-field">
                  <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                    Channels Eyebrow
                  </label>
                  <input type="text" id="channelsEyebrow" class="cms-input" value="${escapeHtml(channelsSec.eyebrow || 'OPEN CHANNELS')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem;" />
                </div>
                <div class="cms-field">
                  <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                    Title Highlight Text
                  </label>
                  <input type="text" id="channelsTitleHighlight" class="cms-input" value="${escapeHtml(channelsSec.titleHighlight || 'FREQUENCY')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem;" />
                </div>
              </div>

              <div class="cms-field">
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                  Channels Section Title
                </label>
                <input type="text" id="channelsTitle" class="cms-input" value="${escapeHtml(channelsSec.title || 'PICK A FREQUENCY')}" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.95rem; font-weight:700;" />
              </div>

              <div class="cms-field">
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                  Channels Description
                </label>
                <textarea id="channelsDescription" rows="2" class="cms-input" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem; resize:vertical;">${escapeHtml(channelsSec.description || 'Every channel is monitored by the team. Choose whichever gets to the right people fastest.')}</textarea>
              </div>

              <!-- Channels Roster List -->
              <div style="border-top:1px solid #242430; padding-top:18px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                  <div>
                    <h4 style="font-size:0.92rem; font-weight:800; color:#FFFFFF; margin:0; display:flex; align-items:center; gap:8px;">
                      <i class="fas fa-list-check" style="color:#F25912;"></i> Active Channels Roster (${channels.length})
                    </h4>
                    <p style="font-size:0.76rem; color:#8E929E; margin:0;">Configure actionable links (mailto:, tel:, wa.me, #pitlane) with live monitoring indicators</p>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm" id="btnAddChannelBtn" style="font-size:0.78rem; padding:6px 14px; border-color:#3A3A4C;">
                    <i class="fas fa-plus"></i> Add Channel
                  </button>
                </div>

                <div id="channelsListContainer" style="display:flex; flex-direction:column; gap:10px;">
                  ${renderChannelsCards(channels)}
                </div>
              </div>

              <!-- Transmit Console Form Settings -->
              <div style="border-top:1px solid #242430; padding-top:18px; background:#0E0E12; border-radius:8px; padding:18px; margin-top:6px;">
                <div style="margin-bottom:14px;">
                  <h4 style="font-size:0.92rem; font-weight:800; color:#FFFFFF; margin:0; display:flex; align-items:center; gap:8px;">
                    <i class="fas fa-terminal" style="color:#F25912;"></i> Transmit Console &amp; Form Fields
                  </h4>
                  <p style="font-size:0.76rem; color:#8E929E; margin:0;">Controls the right-hand race console where visitors submit transmissions</p>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px; margin-bottom:16px;">
                  <div class="cms-field">
                    <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">
                      Form Box Title
                    </label>
                    <input type="text" id="formTitle" class="cms-input" value="${escapeHtml(formSettings.formTitle || 'Transmit Message')}" 
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                  </div>
                  <div class="cms-field">
                    <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">
                      Frequency Header Tag
                    </label>
                    <input type="text" id="formFrequencyLabel" class="cms-input" value="${escapeHtml(formSettings.frequencyLabel || 'FREQ 88.6 MHz')}" 
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                  </div>
                  <div class="cms-field">
                    <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">
                      Submit Button Label
                    </label>
                    <input type="text" id="formSubmitButtonText" class="cms-input" value="${escapeHtml(formSettings.submitButtonText || 'Transmit Message')}" 
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                  </div>
                </div>

                <!-- Subject/Channel Options list -->
                <div style="border-top:1px solid #1F1F28; padding-top:14px;">
                  <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <span style="font-size:0.78rem; font-weight:700; text-transform:uppercase; letter-spacing:0.04em; color:#ECECF1;">
                      Dropdown Channel / Subject Options (${subjectOpts.length})
                    </span>
                    <button type="button" class="btn btn-secondary btn-sm" id="btnAddSubjectOptBtn" style="font-size:0.74rem; padding:4px 10px;">
                      <i class="fas fa-plus"></i> Add Option
                    </button>
                  </div>

                  <div id="subjectOptionsContainer" style="display:flex; flex-direction:column; gap:8px;">
                    ${renderSubjectOptions(subjectOpts)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════════
               BLOCK 03: FIND US (MAP & WORKSHOP LOCATION)
          ══════════════════════════════════════════════════════════ -->
          <div class="cms-card" style="background:#141419; border:1px solid #242430; border-radius:12px; overflow:hidden;">
            <div style="background:#181820; border-bottom:1px solid #242430; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <div style="width:32px; height:32px; border-radius:6px; background:rgba(242,89,18,0.15); color:#F25912; display:flex; align-items:center; justify-content:center; font-size:0.95rem;">
                  <i class="fas fa-map-location-dot"></i>
                </div>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0;">03. Find Us (Map &amp; Workshop Location)</h3>
                  <p style="font-size:0.78rem; color:#8E929E; margin:0;">The Pit Lane workshop address, telemetry GPS coordinates, and Google Maps embed</p>
                </div>
              </div>
            </div>

            <div style="padding:22px; display:flex; flex-direction:column; gap:20px;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div class="cms-field">
                  <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                    Section Eyebrow
                  </label>
                  <input type="text" id="findUsEyebrow" class="cms-input" value="${escapeHtml(findUs.eyebrow || 'FIND US')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem;" />
                </div>
                <div class="cms-field">
                  <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                    Title Highlight Text
                  </label>
                  <input type="text" id="findUsTitleHighlight" class="cms-input" value="${escapeHtml(findUs.titleHighlight || 'PIT LANE')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem;" />
                </div>
              </div>

              <div class="cms-field">
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                  Section Title
                </label>
                <input type="text" id="findUsTitle" class="cms-input" value="${escapeHtml(findUs.title || 'THE PIT LANE')}" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.95rem; font-weight:700;" />
              </div>

              <div class="cms-field">
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">
                  Section Description
                </label>
                <textarea id="findUsDescription" rows="2" class="cms-input" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem; resize:vertical;">${escapeHtml(findUs.description || 'Our workshop at St. Vincent Pallotti College of Engineering & Technology, Nagpur, where our electric Formula car gets built, tested, and race-prepped.')}</textarea>
              </div>

              <!-- Map and Coordinates Configuration -->
              <div style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:18px;">
                <h4 style="font-size:0.88rem; font-weight:800; color:#FFFFFF; margin:0 0 12px 0; display:flex; align-items:center; gap:8px;">
                  <i class="fas fa-satellite" style="color:#F25912;"></i> Map Settings &amp; Telemetry Coordinates
                </h4>

                <div class="cms-field" style="margin-bottom:12px;">
                  <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">
                    Google Maps Embed URL *
                  </label>
                  <input type="text" id="mapEmbedUrl" class="cms-input" value="${escapeHtml(map.embedUrl || 'https://www.google.com/maps?q=St.+Vincent+Pallotti+College+of+Engineering+and+Technology,+Gavsi+Manapur,+Wardha+Road,+Nagpur,+Maharashtra+441108&output=embed')}" 
                    placeholder="https://www.google.com/maps?q=...&output=embed"
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem; font-family:monospace;" />
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
                  <div class="cms-field">
                    <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">
                      Latitude Readout
                    </label>
                    <input type="text" id="mapLatitude" class="cms-input" value="${escapeHtml(map.latitude || '21.0047°N')}" 
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-family:monospace;" />
                  </div>
                  <div class="cms-field">
                    <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">
                      Longitude Readout
                    </label>
                    <input type="text" id="mapLongitude" class="cms-input" value="${escapeHtml(map.longitude || '79.0476°E')}" 
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-family:monospace;" />
                  </div>
                  <div class="cms-field">
                    <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">
                      Zoom Level
                    </label>
                    <input type="number" id="mapZoomLevel" class="cms-input" min="1" max="21" value="${map.zoomLevel || 15}" 
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                  </div>
                </div>
              </div>

              <!-- Workshop Telemetry Panel Information -->
              <div style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:18px;">
                <h4 style="font-size:0.88rem; font-weight:800; color:#FFFFFF; margin:0 0 12px 0; display:flex; align-items:center; gap:8px;">
                  <i class="fas fa-warehouse" style="color:#F25912;"></i> Workshop &amp; Garage Information
                </h4>

                <div class="cms-field" style="margin-bottom:12px;">
                  <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">
                    Workshop Title
                  </label>
                  <input type="text" id="workshopName" class="cms-input" value="${escapeHtml(workshop.name || 'E-Formula Ashwa Riders Workshop')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.9rem; font-weight:700;" />
                </div>

                <div class="cms-field" style="margin-bottom:12px;">
                  <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">
                    Full Physical Address
                  </label>
                  <textarea id="workshopAddress" rows="2" class="cms-input" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.88rem; resize:vertical;">${escapeHtml(workshop.address || 'SVPCET, Gavsi Manapur, Wardha Road, Nagpur, Maharashtra 441108')}</textarea>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
                  <div class="cms-field">
                    <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">
                      Pit Access Protocol
                    </label>
                    <input type="text" id="workshopAccess" class="cms-input" value="${escapeHtml(workshop.access || 'By Appointment')}" 
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                  </div>
                  <div class="cms-field">
                    <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">
                      Operating / Garage Hours
                    </label>
                    <input type="text" id="workshopHours" class="cms-input" value="${escapeHtml(workshop.hours || 'Mon–Sat, 10AM–6PM')}" 
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                  </div>
                </div>

                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">
                    Visitor Instructions / Garage Note
                  </label>
                  <textarea id="workshopNote" rows="2" class="cms-input" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; resize:vertical;">${escapeHtml(workshop.visitorInstructions || 'Coming to visit? Reach out on Channel 01 or 03 first so the team can walk you through the garage.')}</textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- ══════════════════════════════════════════════════════════
               BLOCK 04: GLOBAL FOOTER REFERENCE
          ══════════════════════════════════════════════════════════ -->
          <div class="cms-card" style="background:#141419; border:1px solid #242430; border-radius:12px; padding:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px;">
            <div style="display:flex; align-items:center; gap:14px;">
              <div style="width:40px; height:40px; border-radius:8px; background:rgba(255,255,255,0.06); color:#8E929E; display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
                <i class="fas fa-layer-group"></i>
              </div>
              <div>
                <h4 style="font-size:0.95rem; font-weight:800; color:#FFFFFF; margin:0 0 3px 0;">04. Global Footer Synchronization</h4>
                <p style="font-size:0.8rem; color:#8E929E; margin:0;">
                  Publishing this page automatically keeps public contact numbers, email, address, and hours synced across the whole website.
                </p>
              </div>
            </div>

            <a href="#/navigation" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; border-color:#3A3A4C;">
              <i class="fas fa-arrow-up-right-from-square"></i> Open Global Footer CMS
            </a>
          </div>

        </form>
      </div>

      <!-- Modals Container -->
      <div id="contactModalsContainer"></div>
    `;

    bindInterfaceEvents(container);
  }

  // ============================================================
  //  HTML GENERATORS FOR SUB-LISTS
  // ============================================================
  function renderStatsCards(stats) {
    if (!stats || stats.length === 0) {
      return `
        <div style="grid-column:1/-1; padding:20px; background:#0E0E12; border:1px dashed #2D2D3B; border-radius:8px; text-align:center; color:#8E929E; font-size:0.82rem;">
          No telemetry stats configured. Click "Add Stat" to create one.
        </div>
      `;
    }

    return stats.map((stat, idx) => `
      <div class="stat-card" data-id="${escapeHtml(stat.id)}" style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:12px; display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div>
            <span style="font-family:monospace; font-size:0.72rem; color:#F25912; background:rgba(242,89,18,0.1); padding:2px 6px; border-radius:4px; font-weight:700;">
              STAT 0${idx + 1}
            </span>
            <div style="font-size:1.15rem; font-weight:900; color:#FFFFFF; margin-top:4px;">
              ${escapeHtml(stat.value || '--')}
            </div>
            <div style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.04em; color:#8E929E; margin-top:2px;">
              ${escapeHtml(stat.label || 'UNTITLED')}
            </div>
          </div>

          <div style="display:flex; gap:4px;">
            <button type="button" class="btn-icon-stat btn-stat-up" data-idx="${idx}" title="Move Up" style="background:#181820; border:1px solid #2D2D3B; color:#8E929E; width:26px; height:26px; border-radius:4px; cursor:pointer; font-size:0.7rem;" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="fas fa-chevron-up"></i>
            </button>
            <button type="button" class="btn-icon-stat btn-stat-down" data-idx="${idx}" title="Move Down" style="background:#181820; border:1px solid #2D2D3B; color:#8E929E; width:26px; height:26px; border-radius:4px; cursor:pointer; font-size:0.7rem;" ${idx === stats.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #1C1C24; padding-top:8px;">
          <span style="font-size:0.72rem; font-weight:600; color:${stat.enabled !== false ? '#2EA44F' : '#6B6F7B'}; display:flex; align-items:center; gap:4px;">
            <span style="width:6px; height:6px; border-radius:50%; background:${stat.enabled !== false ? '#2EA44F' : '#6B6F7B'};"></span>
            ${stat.enabled !== false ? 'Active' : 'Disabled'}
          </span>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-stat-edit" data-id="${escapeHtml(stat.id)}" style="background:none; border:none; color:#F25912; font-size:0.78rem; font-weight:600; cursor:pointer; padding:2px 6px;">
              <i class="fas fa-pen"></i> Edit
            </button>
            <button type="button" class="btn-stat-del" data-id="${escapeHtml(stat.id)}" style="background:none; border:none; color:#FF4D4D; font-size:0.78rem; font-weight:600; cursor:pointer; padding:2px 6px;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderChannelsCards(channels) {
    if (!channels || channels.length === 0) {
      return `
        <div style="padding:24px; background:#0E0E12; border:1px dashed #2D2D3B; border-radius:8px; text-align:center; color:#8E929E; font-size:0.82rem;">
          No channels configured. Click "Add Channel" to create one.
        </div>
      `;
    }

    return channels.map((ch, idx) => `
      <div class="channel-card" data-id="${escapeHtml(ch.id)}" style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:12px 16px; display:flex; align-items:center; justify-content:space-between; gap:14px; flex-wrap:wrap;">
        <div style="display:flex; align-items:center; gap:14px; min-width:280px; flex:1;">
          <div style="width:40px; height:40px; border-radius:6px; background:#181820; border:1px solid #2D2D3B; display:flex; align-items:center; justify-content:center; color:#F25912; font-size:1.1rem;">
            <i class="${escapeHtml(ch.icon || 'fas fa-envelope')}"></i>
          </div>

          <div>
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:2px;">
              <span style="font-family:monospace; font-size:0.72rem; color:#F25912; background:rgba(242,89,18,0.12); padding:2px 6px; border-radius:4px; font-weight:800;">
                CH ${escapeHtml(ch.channelNumber || '0' + (idx + 1))}
              </span>
              <span style="font-family:monospace; font-size:0.72rem; color:#8E929E; font-weight:700;">
                ${escapeHtml(ch.type || 'COMM')}
              </span>
              <span style="font-size:0.72rem; color:#2EA44F; background:rgba(46,164,79,0.12); padding:1px 6px; border-radius:3px; font-weight:700;">
                ${escapeHtml(ch.status || 'MONITORED')}
              </span>
            </div>

            <div style="font-size:0.92rem; font-weight:700; color:#FFFFFF;">
              ${escapeHtml(ch.name || 'Untitled Channel')}
            </div>

            <div style="font-size:0.76rem; color:#8E929E; display:flex; gap:10px; margin-top:2px;">
              <span>${escapeHtml(ch.description || '')}</span>
              ${ch.actionUrl ? `<span style="color:#6B6F7B; font-family:monospace;">&bull; ${escapeHtml(ch.actionUrl)}</span>` : ''}
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <div style="display:flex; gap:4px; margin-right:8px;">
            <button type="button" class="btn-channel-up" data-idx="${idx}" title="Move Up" style="background:#181820; border:1px solid #2D2D3B; color:#8E929E; width:26px; height:26px; border-radius:4px; cursor:pointer; font-size:0.7rem;" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="fas fa-chevron-up"></i>
            </button>
            <button type="button" class="btn-channel-down" data-idx="${idx}" title="Move Down" style="background:#181820; border:1px solid #2D2D3B; color:#8E929E; width:26px; height:26px; border-radius:4px; cursor:pointer; font-size:0.7rem;" ${idx === channels.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>

          <button type="button" class="btn btn-secondary btn-sm btn-channel-edit" data-id="${escapeHtml(ch.id)}" style="font-size:0.76rem; padding:4px 10px; border-color:#3A3A4C;">
            <i class="fas fa-pen"></i> Edit
          </button>
          <button type="button" class="btn btn-outline btn-sm btn-channel-del" data-id="${escapeHtml(ch.id)}" style="font-size:0.76rem; padding:4px 8px; color:#FF4D4D; border-color:rgba(255,77,77,0.3);">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
    `).join('');
  }

  function renderSubjectOptions(options) {
    if (!options || options.length === 0) {
      return `
        <div style="padding:10px; color:#8E929E; font-size:0.8rem; font-style:italic;">
          No subject dropdown options. Default fallback options will be used.
        </div>
      `;
    }

    return options.map((opt, idx) => `
      <div class="subject-opt-row" data-idx="${idx}" style="display:flex; align-items:center; gap:8px;">
        <input type="text" class="cms-input opt-val-input" value="${escapeHtml(opt.value || '')}" placeholder="Value (e.g. sponsorship)" 
          style="width:180px; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:6px 10px; color:#fff; font-size:0.8rem; font-family:monospace;" />
        <input type="text" class="cms-input opt-label-input" value="${escapeHtml(opt.label || '')}" placeholder="Label (e.g. Sponsorship & Partnerships)" 
          style="flex:1; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:6px 10px; color:#fff; font-size:0.8rem;" />
        <button type="button" class="btn-opt-del" data-idx="${idx}" style="background:#181820; border:1px solid #2D2D3B; color:#FF4D4D; width:28px; height:28px; border-radius:6px; cursor:pointer;" title="Remove Option">
          <i class="fas fa-trash" style="font-size:0.72rem;"></i>
        </button>
      </div>
    `).join('');
  }

  // ============================================================
  //  MODALS: STAT MODAL & CHANNEL MODAL
  // ============================================================
  function openStatModal(statId = null) {
    const stats = currentData.heroSection.stats || [];
    const isNew = !statId;
    const stat = isNew
      ? { id: 'stat-' + Date.now(), value: '', label: '', order: stats.length + 1, enabled: true }
      : (stats.find(s => s.id === statId) || {});

    const modalWrap = document.getElementById('contactModalsContainer');
    modalWrap.innerHTML = `
      <div class="contact-modal-backdrop" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px;">
        <div style="background:#141419; border:1px solid #2D2D3B; border-radius:12px; width:100%; max-width:440px; overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,0.7);">
          <div style="background:#181820; border-bottom:1px solid #242430; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
            <h3 style="font-size:1rem; font-weight:800; color:#fff; margin:0;">
              ${isNew ? '<i class="fas fa-plus" style="color:#F25912;"></i> Add Telemetry Stat' : '<i class="fas fa-pen" style="color:#F25912;"></i> Edit Telemetry Stat'}
            </h3>
            <button type="button" id="closeStatModalBtn" style="background:none; border:none; color:#8E929E; cursor:pointer; font-size:1.1rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="statModalForm" style="padding:20px; display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; color:#8E929E; margin-bottom:5px;">
                Stat Value * (e.g. &lt; 24H, 04, Nagpur, Mon–Sat)
              </label>
              <input type="text" id="mStatValue" required value="${escapeHtml(stat.value || '')}" 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.9rem;" />
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; color:#8E929E; margin-bottom:5px;">
                Stat Label * (e.g. AVG. REPLY TIME, OPEN CHANNELS)
              </label>
              <input type="text" id="mStatLabel" required value="${escapeHtml(stat.label || '')}" 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.9rem;" />
            </div>

            <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
              <input type="checkbox" id="mStatEnabled" ${stat.enabled !== false ? 'checked' : ''} style="width:16px; height:16px; accent-color:#F25912;" />
              <label for="mStatEnabled" style="font-size:0.85rem; color:#fff; cursor:pointer;">
                Stat is enabled on public page
              </label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:10px;">
              <button type="button" id="cancelStatModalBtn" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="background:#F25912; border-color:#F25912;">Save Stat</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => { modalWrap.innerHTML = ''; };
    document.getElementById('closeStatModalBtn').addEventListener('click', close);
    document.getElementById('cancelStatModalBtn').addEventListener('click', close);

    document.getElementById('statModalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const val = document.getElementById('mStatValue').value.trim();
      const lbl = document.getElementById('mStatLabel').value.trim();
      const en = document.getElementById('mStatEnabled').checked;

      if (!val || !lbl) {
        showToast('Please provide both stat value and label', 'warn');
        return;
      }

      if (isNew) {
        stat.value = val;
        stat.label = lbl;
        stat.enabled = en;
        stats.push(stat);
      } else {
        stat.value = val;
        stat.label = lbl;
        stat.enabled = en;
      }

      close();
      document.getElementById('statsListContainer').innerHTML = renderStatsCards(stats);
      bindStatsEvents();
      markDirty();
    });
  }

  function openChannelModal(channelId = null) {
    const channels = currentData.channelsSection.channels || [];
    const isNew = !channelId;
    const ch = isNew
      ? {
          id: 'ch-' + Date.now(),
          channelNumber: '0' + (channels.length + 1),
          type: 'COMM',
          name: '',
          secondaryValue: '',
          description: '',
          status: 'MONITORED',
          icon: 'fas fa-envelope',
          actionUrl: '',
          order: channels.length + 1,
          published: true,
        }
      : (channels.find(c => c.id === channelId) || {});

    const modalWrap = document.getElementById('contactModalsContainer');
    modalWrap.innerHTML = `
      <div class="contact-modal-backdrop" style="position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:9999; display:flex; align-items:center; justify-content:center; padding:16px;">
        <div style="background:#141419; border:1px solid #2D2D3B; border-radius:12px; width:100%; max-width:560px; max-height:90vh; overflow-y:auto; box-shadow:0 24px 60px rgba(0,0,0,0.7);">
          <div style="background:#181820; border-bottom:1px solid #242430; padding:16px 20px; display:flex; justify-content:space-between; align-items:center;">
            <h3 style="font-size:1rem; font-weight:800; color:#fff; margin:0;">
              ${isNew ? '<i class="fas fa-plus" style="color:#F25912;"></i> Add Communication Channel' : '<i class="fas fa-pen" style="color:#F25912;"></i> Edit Channel CH ' + escapeHtml(ch.channelNumber || '')}
            </h3>
            <button type="button" id="closeChModalBtn" style="background:none; border:none; color:#8E929E; cursor:pointer; font-size:1.1rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="chModalForm" style="padding:20px; display:flex; flex-direction:column; gap:14px;">
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; color:#8E929E; margin-bottom:5px;">
                  Channel No. * (e.g. 01)
                </label>
                <input type="text" id="mChNumber" required value="${escapeHtml(ch.channelNumber || '')}" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 10px; color:#fff; font-size:0.85rem; font-family:monospace;" />
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; color:#8E929E; margin-bottom:5px;">
                  Channel Type *
                </label>
                <input type="text" id="mChType" required value="${escapeHtml(ch.type || 'EMAIL')}" placeholder="EMAIL, VOICE, RADIO" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 10px; color:#fff; font-size:0.85rem; text-transform:uppercase;" />
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; color:#8E929E; margin-bottom:5px;">
                  Status Badge *
                </label>
                <input type="text" id="mChStatus" required value="${escapeHtml(ch.status || 'MONITORED')}" placeholder="MONITORED, ON DUTY, LIVE" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 10px; color:#fff; font-size:0.85rem;" />
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; color:#8E929E; margin-bottom:5px;">
                Channel Display Value / Title * (e.g. contact@ashwariders.com or +91 90961 10224)
              </label>
              <input type="text" id="mChName" required value="${escapeHtml(ch.name || '')}" 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.9rem;" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; color:#8E929E; margin-bottom:5px;">
                  Action URL (href) *
                </label>
                <input type="text" id="mChActionUrl" required value="${escapeHtml(ch.actionUrl || '')}" placeholder="mailto:..., tel:..., https://wa.me/..., #pitlane" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 10px; color:#fff; font-size:0.85rem; font-family:monospace;" />
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; color:#8E929E; margin-bottom:5px;">
                  Icon Class (FontAwesome)
                </label>
                <input type="text" id="mChIcon" value="${escapeHtml(ch.icon || 'fas fa-envelope')}" placeholder="fas fa-envelope, fas fa-phone, fab fa-whatsapp" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 10px; color:#fff; font-size:0.85rem; font-family:monospace;" />
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; color:#8E929E; margin-bottom:5px;">
                Description / Availability Note
              </label>
              <textarea id="mChDesc" rows="2" 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 10px; color:#fff; font-size:0.85rem; resize:vertical;">${escapeHtml(ch.description || '')}</textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:8px;">
              <button type="button" id="cancelChModalBtn" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="background:#F25912; border-color:#F25912;">Save Channel</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => { modalWrap.innerHTML = ''; };
    document.getElementById('closeChModalBtn').addEventListener('click', close);
    document.getElementById('cancelChModalBtn').addEventListener('click', close);

    document.getElementById('chModalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const num = document.getElementById('mChNumber').value.trim();
      const typ = document.getElementById('mChType').value.trim();
      const st = document.getElementById('mChStatus').value.trim();
      const nm = document.getElementById('mChName').value.trim();
      const act = document.getElementById('mChActionUrl').value.trim();
      const icn = document.getElementById('mChIcon').value.trim() || 'fas fa-envelope';
      const desc = document.getElementById('mChDesc').value.trim();

      if (!num || !nm || !act) {
        showToast('Please provide channel number, name, and action URL', 'warn');
        return;
      }

      ch.channelNumber = num;
      ch.type = typ;
      ch.status = st;
      ch.name = nm;
      ch.actionUrl = act;
      ch.icon = icn;
      ch.description = desc;

      if (isNew) {
        channels.push(ch);
      }

      close();
      document.getElementById('channelsListContainer').innerHTML = renderChannelsCards(channels);
      bindChannelsEvents();
      markDirty();
    });
  }

  // ============================================================
  //  BIND INTERFACE EVENTS
  // ============================================================
  function bindInterfaceEvents(container) {
    // Top Bar Actions
    document.getElementById('btnSaveContactDraft')?.addEventListener('click', () => saveDraft(false));
    document.getElementById('btnPreviewContact')?.addEventListener('click', () => {
      window.open('/contact.html?preview=true', '_blank');
    });
    document.getElementById('btnPublishContact')?.addEventListener('click', publishLive);

    // Hero MediaPicker
    document.getElementById('btnPickHeroBg')?.addEventListener('click', () => {
      const picker = window.AdminMediaPicker || window.MediaPicker;
      if (!picker) {
        showToast('MediaPicker component is loading...', 'warn');
        return;
      }
      picker.open({
        multiple: false,
        onSelect: (asset) => {
          if (asset && asset.url) {
            const clean = ensureCleanUrl(asset.url);
            if (clean) {
              document.getElementById('heroBackgroundImage').value = clean;
              updateHeroBgPreview();
              markDirty();
            }
          }
        },
      });
    });

    document.getElementById('btnClearHeroBg')?.addEventListener('click', () => {
      document.getElementById('heroBackgroundImage').value = '';
      updateHeroBgPreview();
      markDirty();
    });

    document.getElementById('heroBackgroundImage')?.addEventListener('input', () => {
      updateHeroBgPreview();
      markDirty();
    });

    const overlaySlider = document.getElementById('heroOverlayIntensity');
    overlaySlider?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      const textEl = document.getElementById('heroOverlayValText');
      if (textEl) textEl.textContent = `${Math.round(val * 100)}%`;
      const prevEl = document.getElementById('heroBgOverlayPreview');
      if (prevEl) prevEl.style.background = `rgba(0,0,0,${val})`;
      markDirty();
    });

    // Form inputs dirty detection
    container.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('input', () => markDirty());
    });

    // Telemetry Stats Sub-Manager
    document.getElementById('btnAddStatBtn')?.addEventListener('click', () => openStatModal(null));
    bindStatsEvents();

    // Channels Sub-Manager
    document.getElementById('btnAddChannelBtn')?.addEventListener('click', () => openChannelModal(null));
    bindChannelsEvents();

    // Subject Options list
    document.getElementById('btnAddSubjectOptBtn')?.addEventListener('click', () => {
      const list = currentData.channelsSection.formSettings.subjectOptions || [];
      list.push({ value: 'subject_' + (list.length + 1), label: 'New Subject Option' });
      document.getElementById('subjectOptionsContainer').innerHTML = renderSubjectOptions(list);
      bindSubjectOptionsEvents();
      markDirty();
    });
    bindSubjectOptionsEvents();
  }

  function updateHeroBgPreview() {
    const url = document.getElementById('heroBackgroundImage')?.value.trim();
    const wrap = document.getElementById('heroBgPreviewWrap');
    const intensity = parseFloat(document.getElementById('heroOverlayIntensity')?.value || 0.85);

    if (!wrap) return;

    if (url) {
      wrap.innerHTML = `
        <img src="${escapeHtml(url)}" alt="Hero BG" style="width:100%; height:100%; object-fit:cover;" id="heroBgImgEl" />
        <div id="heroBgOverlayPreview" style="position:absolute; inset:0; background:rgba(0,0,0,${intensity}); pointer-events:none;"></div>
      `;
    } else {
      wrap.innerHTML = `<span style="color:#6B6F7B; font-size:0.78rem; font-family:monospace;">No image selected (Default theme)</span>`;
    }
  }

  function bindStatsEvents() {
    const stats = currentData.heroSection.stats || [];

    document.querySelectorAll('.btn-stat-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openStatModal(id);
      });
    });

    document.querySelectorAll('.btn-stat-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Delete this telemetry stat?')) {
          currentData.heroSection.stats = stats.filter(s => s.id !== id);
          document.getElementById('statsListContainer').innerHTML = renderStatsCards(currentData.heroSection.stats);
          bindStatsEvents();
          markDirty();
        }
      });
    });

    document.querySelectorAll('.btn-stat-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (idx > 0) {
          const temp = stats[idx];
          stats[idx] = stats[idx - 1];
          stats[idx - 1] = temp;
          document.getElementById('statsListContainer').innerHTML = renderStatsCards(stats);
          bindStatsEvents();
          markDirty();
        }
      });
    });

    document.querySelectorAll('.btn-stat-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (idx < stats.length - 1) {
          const temp = stats[idx];
          stats[idx] = stats[idx + 1];
          stats[idx + 1] = temp;
          document.getElementById('statsListContainer').innerHTML = renderStatsCards(stats);
          bindStatsEvents();
          markDirty();
        }
      });
    });
  }

  function bindChannelsEvents() {
    const channels = currentData.channelsSection.channels || [];

    document.querySelectorAll('.btn-channel-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openChannelModal(id);
      });
    });

    document.querySelectorAll('.btn-channel-del').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Are you sure you want to remove this channel?')) {
          currentData.channelsSection.channels = channels.filter(c => c.id !== id);
          document.getElementById('channelsListContainer').innerHTML = renderChannelsCards(currentData.channelsSection.channels);
          bindChannelsEvents();
          markDirty();
        }
      });
    });

    document.querySelectorAll('.btn-channel-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (idx > 0) {
          const temp = channels[idx];
          channels[idx] = channels[idx - 1];
          channels[idx - 1] = temp;
          document.getElementById('channelsListContainer').innerHTML = renderChannelsCards(channels);
          bindChannelsEvents();
          markDirty();
        }
      });
    });

    document.querySelectorAll('.btn-channel-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (idx < channels.length - 1) {
          const temp = channels[idx];
          channels[idx] = channels[idx + 1];
          channels[idx + 1] = temp;
          document.getElementById('channelsListContainer').innerHTML = renderChannelsCards(channels);
          bindChannelsEvents();
          markDirty();
        }
      });
    });
  }

  function bindSubjectOptionsEvents() {
    const rows = document.querySelectorAll('.subject-opt-row');
    rows.forEach(row => {
      const idx = parseInt(row.getAttribute('data-idx'), 10);
      const valInput = row.querySelector('.opt-val-input');
      const lblInput = row.querySelector('.opt-label-input');
      const delBtn = row.querySelector('.btn-opt-del');

      valInput?.addEventListener('input', (e) => {
        if (currentData.channelsSection.formSettings.subjectOptions[idx]) {
          currentData.channelsSection.formSettings.subjectOptions[idx].value = e.target.value;
          markDirty();
        }
      });

      lblInput?.addEventListener('input', (e) => {
        if (currentData.channelsSection.formSettings.subjectOptions[idx]) {
          currentData.channelsSection.formSettings.subjectOptions[idx].label = e.target.value;
          markDirty();
        }
      });

      delBtn?.addEventListener('click', () => {
        currentData.channelsSection.formSettings.subjectOptions.splice(idx, 1);
        document.getElementById('subjectOptionsContainer').innerHTML = renderSubjectOptions(currentData.channelsSection.formSettings.subjectOptions);
        bindSubjectOptionsEvents();
        markDirty();
      });
    });
  }

  // ============================================================
  //  SAVE & PUBLISH LOGIC
  // ============================================================
  function markDirty() {
    isDirty = true;
    updateSaveBadge('dirty');
  }

  function updateSaveBadge(state) {
    const dot = document.getElementById('contactSaveDot');
    const text = document.getElementById('contactSaveText');
    if (!dot || !text) return;

    if (state === 'saved') {
      dot.style.background = '#2EA44F';
      text.textContent = 'All changes saved';
      text.style.color = '#8E929E';
    } else if (state === 'dirty') {
      dot.style.background = '#E3B341';
      text.textContent = 'Unsaved changes';
      text.style.color = '#E3B341';
    } else if (state === 'saving') {
      dot.style.background = '#F25912';
      text.textContent = 'Saving changes...';
      text.style.color = '#F25912';
    }
  }

  function gatherPayload() {
    const heroBg = ensureCleanUrl(document.getElementById('heroBackgroundImage')?.value);

    const heroTitle = document.getElementById('heroTitle')?.value.trim() || 'TALK TO ASHWA RIDERS';
    const heroHighlight = document.getElementById('heroTitleHighlight')?.value.trim() || 'ASHWA RIDERS';
    const heroOverlay = parseFloat(document.getElementById('heroOverlayIntensity')?.value || 0.85);

    const channelsTitle = document.getElementById('channelsTitle')?.value.trim() || 'PICK A FREQUENCY';
    const channelsHighlight = document.getElementById('channelsTitleHighlight')?.value.trim() || 'FREQUENCY';

    const findUsTitle = document.getElementById('findUsTitle')?.value.trim() || 'THE PIT LANE';
    const findUsHighlight = document.getElementById('findUsTitleHighlight')?.value.trim() || 'PIT LANE';

    const formOpts = (currentData.channelsSection.formSettings.subjectOptions || []).map((o, idx) => ({
      id: o.id || 'opt-' + (idx + 1),
      value: (o.value || '').trim(),
      label: (o.label || '').trim(),
      order: idx + 1,
      enabled: o.enabled !== false,
    }));

    const payload = {
      heroSection: {
        eyebrow: document.getElementById('heroEyebrow')?.value.trim() || 'RACE CONTROL — OPEN FREQUENCY',
        heading: heroTitle,
        title: heroTitle,
        headingHighlight: heroHighlight,
        titleHighlight: heroHighlight,
        description: document.getElementById('heroDescription')?.value.trim() || '',
        backgroundImage: heroBg,
        bgImageUrl: heroBg,
        overlayIntensity: heroOverlay,
        overlayStrength: heroOverlay,
        stats: (currentData.heroSection.stats || []).map((s, idx) => ({
          ...s,
          order: idx + 1,
        })),
      },
      channelsSection: {
        eyebrow: document.getElementById('channelsEyebrow')?.value.trim() || 'OPEN CHANNELS',
        heading: channelsTitle,
        title: channelsTitle,
        headingHighlight: channelsHighlight,
        titleHighlight: channelsHighlight,
        description: document.getElementById('channelsDescription')?.value.trim() || '',
        channels: (currentData.channelsSection.channels || []).map((c, idx) => ({
          ...c,
          order: idx + 1,
        })),
        formSettings: {
          formTitle: document.getElementById('formTitle')?.value.trim() || 'Transmit Message',
          title: document.getElementById('formTitle')?.value.trim() || 'Transmit Message',
          frequencyLabel: document.getElementById('formFrequencyLabel')?.value.trim() || 'FREQ 88.6 MHz',
          submitButtonText: document.getElementById('formSubmitButtonText')?.value.trim() || 'Transmit Message',
          subjectOptions: formOpts,
          channelOptions: formOpts,
        },
      },
      findUsSection: {
        eyebrow: document.getElementById('findUsEyebrow')?.value.trim() || 'FIND US',
        heading: findUsTitle,
        title: findUsTitle,
        headingHighlight: findUsHighlight,
        titleHighlight: findUsHighlight,
        description: document.getElementById('findUsDescription')?.value.trim() || '',
        map: {
          embedUrl: document.getElementById('mapEmbedUrl')?.value.trim() || '',
          latitude: document.getElementById('mapLatitude')?.value.trim() || '21.0047°N',
          longitude: document.getElementById('mapLongitude')?.value.trim() || '79.0476°E',
          zoomLevel: parseInt(document.getElementById('mapZoomLevel')?.value || 15, 10),
          zoom: parseInt(document.getElementById('mapZoomLevel')?.value || 15, 10),
        },
        workshop: {
          name: document.getElementById('workshopName')?.value.trim() || 'E-Formula Ashwa Riders Workshop',
          address: document.getElementById('workshopAddress')?.value.trim() || '',
          coordinates: `${document.getElementById('mapLatitude')?.value.trim() || '21.0047°N'} / ${document.getElementById('mapLongitude')?.value.trim() || '79.0476°E'}`,
          access: document.getElementById('workshopAccess')?.value.trim() || 'By Appointment',
          hours: document.getElementById('workshopHours')?.value.trim() || 'Mon–Sat, 10AM–6PM',
          visitorInstructions: document.getElementById('workshopNote')?.value.trim() || '',
        },
      },
    };

    return payload;
  }

  async function saveDraft(silent = false) {
    if (isSaving) return;
    isSaving = true;
    updateSaveBadge('saving');

    const payload = gatherPayload();

    try {
      const res = await API().patch('/admin/contact/page', payload);
      if (res && res.success) {
        isDirty = false;
        updateSaveBadge('saved');
        if (!silent) showToast('Contact page draft saved successfully.');
        if (res.data) {
          currentData = res.data;
          normalizeData();
        }
      } else {
        throw new Error(res?.message || 'Failed to save draft.');
      }
    } catch (err) {
      console.error('Save Draft Error:', err);
      updateSaveBadge('dirty');
      showToast('Error saving draft: ' + err.message, 'error');
    } finally {
      isSaving = false;
    }
  }

  async function publishLive() {
    if (isSaving) return;

    if (!confirm('Are you sure you want to publish these changes live to the public Contact page?')) {
      return;
    }

    isSaving = true;
    updateSaveBadge('saving');

    try {
      // First save current draft to ensure all form inputs are stored
      const payload = gatherPayload();
      await API().patch('/admin/contact/page', payload);

      // Now trigger publish
      const res = await API().post('/admin/contact/page/publish');
      if (res && res.success) {
        isDirty = false;
        updateSaveBadge('saved');
        showToast('Contact page published live successfully!');
        if (res.data) {
          currentData.status = res.data.status || 'PUBLISHED';
          currentData.version = res.data.version || currentData.version;
          currentData.lastPublishedAt = res.data.lastPublishedAt;
        }
        // Reload interface with updated publication info
        const container = document.querySelector('.contact-cms-root')?.parentElement;
        if (container) renderInterface(container);
      } else {
        throw new Error(res?.message || 'Failed to publish live.');
      }
    } catch (err) {
      console.error('Publish Error:', err);
      updateSaveBadge('dirty');
      showToast('Error publishing live: ' + err.message, 'error');
    } finally {
      isSaving = false;
    }
  }

  // Dirty state warning on window leave
  window.addEventListener('beforeunload', (e) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = 'You have unsaved changes in Contact Control Center.';
    }
  });

  // Export module to global scope
  window.AdminContactModule = { renderContactModule };
})();
