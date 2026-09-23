/* ============================================================
   sponsors.js — Unified Sponsor Page Control Center Module
   Ashwa Riders CMS — Formula Student Electric Team
   Controls:
     01 HEADER & SETTINGS
     02 SPONSOR RAIL (Moving logos, speed, direction, pause on hover)
     03 SPONSORSHIP CONTENT:
        - Hero & Intro (media, headings, CTA buttons)
        - Sponsorship Tiers (cards, benefits, popular ribbon)
        - Sponsor Enquiry & Form (contact details, brochure, dynamic tiers)
     04 GLOBAL FOOTER (Shared reference)
   Draft / Preview / Publish lifecycle + Media Library integration.
============================================================ */

(function () {
  'use strict';

  let currentData = null;
  let footerSummary = {};
  let collapsedSections = {
    header: true,
    rail: false,
    content: false,
    footer: true,
  };

  const API = () => window.AdminApi;
  const toast = (msg, type = 'success') => {
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

  // ============================================================
  //  MAIN ENTRY POINT
  // ============================================================
  async function renderSponsorsModule(container) {
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:360px; color:#9696A0;">
        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-right:12px; color:#F25912;"></i>
        <span style="font-family:monospace; font-size:0.95rem;">Loading Ashwa Sponsor Page Control Center...</span>
      </div>
    `;

    await loadSponsorData(container);
  }

  async function loadSponsorData(container) {
    try {
      const res = await API().get('/admin/sponsors/page');
      if (res && res.success && res.data) {
        currentData = res.data.page;
        footerSummary = res.data.footerSummary || {};

        normalizeSponsorData();
        renderInterface(container);
      } else {
        throw new Error(res?.message || 'Failed to load Sponsor page data.');
      }
    } catch (err) {
      console.error('Error loading Sponsor CMS data:', err);
      container.innerHTML = `
        <div style="background:#141419; border:1px solid #FF4D4D; border-radius:12px; padding:40px; text-align:center; max-width:600px; margin:40px auto;">
          <i class="fas fa-triangle-exclamation" style="font-size:2.5rem; color:#FF4D4D; margin-bottom:16px;"></i>
          <h2 style="font-size:1.25rem; font-weight:800; color:#FFFFFF; margin-bottom:8px;">Unable to Load Sponsor Control Center</h2>
          <p style="color:#9696A0; font-size:0.9rem; margin-bottom:24px;">${escapeHtml(err.message)}</p>
          <button type="button" class="btn btn-primary" id="retrySponsorLoadBtn" style="background:#F25912; border-color:#F25912;">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
      document.getElementById('retrySponsorLoadBtn')?.addEventListener('click', () => loadSponsorData(container));
    }
  }

  function normalizeSponsorData() {
    if (!currentData) return;

    // Use draftVersion if currently editing draft
    const src = currentData.draftVersion || currentData;
    currentData.settings = src.settings || currentData.settings || {};
    currentData.rail = src.rail || currentData.rail || {};
    currentData.hero = src.hero || currentData.hero || {};
    currentData.tiersSection = src.tiersSection || currentData.tiersSection || {};
    currentData.enquirySection = src.enquirySection || currentData.enquirySection || {};

    if (!Array.isArray(currentData.rail.items)) {
      currentData.rail.items = [];
    }
    if (!Array.isArray(currentData.tiersSection.tiers)) {
      currentData.tiersSection.tiers = [];
    }
  }

  // ============================================================
  //  UI RENDERING
  // ============================================================
  function renderInterface(container) {
    const isPub = currentData.status === 'published';
    const statusClass = isPub ? 'badge-success' : 'badge-warning';
    const statusText = isPub ? 'LIVE / PUBLISHED' : 'DRAFT CHANGES';

    const lastPub = currentData.lastPublishedAt ? new Date(currentData.lastPublishedAt).toLocaleString() : 'Never';
    const lastEdit = currentData.lastEditedAt ? new Date(currentData.lastEditedAt).toLocaleString() : 'Just now';

    const railItems = currentData.rail?.items || [];
    const tiers = currentData.tiersSection?.tiers || [];

    let html = `
      <!-- Control Center Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px; background:#141419; padding:22px 26px; border-radius:12px; border:1px solid #282832;">
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
            <h1 style="font-size:1.5rem; font-weight:800; color:#F5F5F5; margin:0; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px;">
              <i class="fas fa-handshake" style="color:#F25912;"></i> SPONSOR PAGE CONTROL CENTER
            </h1>
            <span class="badge ${statusClass}" id="sponsorStatusBadge" style="padding:4px 10px; font-size:0.72rem; letter-spacing:0.05em;">${statusText}</span>
          </div>
          <p style="font-size:0.85rem; color:#9696A0; margin:0;">
            Manage sponsor logos, continuous rail marquee, tiers, benefits, hero banner, enquiry form & settings.
          </p>
          <div style="display:flex; gap:18px; margin-top:8px; font-size:0.75rem; color:#6B7280; font-family:monospace;">
            <span><i class="fas fa-check-circle" style="color:#00AFA5;"></i> Last Published: <strong style="color:#9FA7A6;">${lastPub}</strong></span>
            <span><i class="fas fa-clock" style="color:#F25912;"></i> Last Edited: <strong style="color:#9FA7A6;">${lastEdit}</strong></span>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <a href="/sponsors.html?preview=true" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); color:#fff; border:1px solid #282832;">
            <i class="fas fa-eye"></i> Preview Website
          </a>
          <button type="button" class="btn btn-secondary btn-sm" id="sponsorSaveDraftBtn" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-save"></i> Save Draft
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="sponsorPublishBtn" style="display:inline-flex; align-items:center; gap:6px; background:#F25912; border-color:#F25912;">
            <i class="fas fa-paper-plane"></i> Publish Live
          </button>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- 01 HEADER & SETTINGS ACCORDION                       -->
      <!-- ════════════════════════════════════════════════════ -->
      <div class="admin-panel" style="margin-bottom:20px; background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:rgba(255,255,255,0.02);" onclick="window.AdminSponsorsModule.toggleSection('header')">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:800; color:#F25912; font-size:1rem;">01</span>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem; letter-spacing:0.02em;">HEADER & PAGE SETTINGS</span>
              <span style="font-size:0.75rem; color:#9696A0;">Global Sponsor-page header settings, page meta & shared navigation reference</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="badge badge-success" style="font-size:0.7rem;">ACTIVE</span>
            <i class="fas fa-chevron-${collapsedSections['header'] ? 'down' : 'up'}" style="color:#9696A0;"></i>
          </div>
        </div>

        <div id="section-body-header" style="display:${collapsedSections['header'] ? 'none' : 'block'}; padding:24px; border-top:1px solid #282832;">
          <div style="background:rgba(242,89,18,0.07); border-left:3px solid #F25912; padding:14px 18px; border-radius:4px; margin-bottom:20px;">
            <p style="margin:0; font-size:0.85rem; color:#E8ECEB; line-height:1.6;">
              <i class="fas fa-circle-info" style="color:#F25912; margin-right:6px;"></i>
              <strong>Shared Website Header:</strong> The public Sponsor page automatically displays the standard Ashwa Riders website navigation bar (Logo, Home, About, Team, Car, Gallery, Sponsors, Achievements, Contact, Join Team).
              To edit menu links or brand identity, use
              <a href="/admin/navigation" onclick="event.preventDefault(); window.location.hash='#/admin/navigation';" style="color:#F25912; text-decoration:underline;">Navigation & Footer Settings</a>.
            </p>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
              <label class="form-label">Page Title (Browser Tab)</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.settings?.pageTitle || '')}" onchange="window.AdminSponsorsModule.updateField('settings.pageTitle', this.value)" placeholder="Ashwa Riders — Become A Sponsor">
            </div>
            <div>
              <label class="form-label">SEO Meta Title</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.settings?.seoTitle || '')}" onchange="window.AdminSponsorsModule.updateField('settings.seoTitle', this.value)" placeholder="Sponsor Us | Ashwa Riders Formula Student">
            </div>
            <div style="grid-column:1 / -1;">
              <label class="form-label">SEO Meta Description</label>
              <textarea class="form-input" rows="2" onchange="window.AdminSponsorsModule.updateField('settings.seoDescription', this.value)" placeholder="Partner with Ashwa Riders Formula Student Electric racing team...">${escapeHtml(currentData.settings?.seoDescription || '')}</textarea>
            </div>
            <div style="grid-column:1 / -1;">
              <label class="form-label">Social Share Preview Image (OG Image)</label>
              <div style="display:flex; gap:8px;">
                <input type="text" class="form-input" id="settings_og_img" value="${escapeHtml(currentData.settings?.ogImageUrl || '')}" onchange="window.AdminSponsorsModule.updateField('settings.ogImageUrl', this.value)" placeholder="https://res.cloudinary.com/...">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminSponsorsModule.pickMedia('settings.ogImageUrl', 'settings_og_img')">
                  <i class="fas fa-folder-open"></i> Media Library
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- 02 SPONSOR RAIL ACCORDION                            -->
      <!-- ════════════════════════════════════════════════════ -->
      <div class="admin-panel" style="margin-bottom:20px; background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:rgba(255,255,255,0.02);" onclick="window.AdminSponsorsModule.toggleSection('rail')">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:800; color:#F25912; font-size:1rem;">02</span>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem; letter-spacing:0.02em;">SPONSOR RAIL</span>
              <span style="font-size:0.75rem; color:#9696A0;">Moving sponsor logos marquee, speed, direction, sponsor roster & logos</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="badge badge-info" style="font-size:0.7rem;">${railItems.length} SPONSORS</span>
            <i class="fas fa-chevron-${collapsedSections['rail'] ? 'down' : 'up'}" style="color:#9696A0;"></i>
          </div>
        </div>

        <div id="section-body-rail" style="display:${collapsedSections['rail'] ? 'none' : 'block'}; padding:24px; border-top:1px solid #282832;">
          <!-- Rail Animation Controls -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid #282832; border-radius:8px; padding:16px; margin-bottom:20px;">
            <h4 style="margin:0 0 12px 0; font-size:0.85rem; color:#F5F5F5; text-transform:uppercase; letter-spacing:0.05em; font-family:monospace;">
              <i class="fas fa-film" style="color:#F25912;"></i> Rail Animation Settings
            </h4>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
              <div>
                <label class="form-label">Scroll Direction</label>
                <select class="form-select" onchange="window.AdminSponsorsModule.updateField('rail.direction', this.value)">
                  <option value="right-to-left" ${currentData.rail?.direction !== 'left-to-right' ? 'selected' : ''}>Right → Left (Default)</option>
                  <option value="left-to-right" ${currentData.rail?.direction === 'left-to-right' ? 'selected' : ''}>Left → Right</option>
                </select>
              </div>
              <div>
                <label class="form-label">Loop Speed (Seconds per cycle)</label>
                <input type="number" class="form-input" min="10" max="120" value="${currentData.rail?.speed || 32}" onchange="window.AdminSponsorsModule.updateField('rail.speed', Number(this.value))">
              </div>
              <div style="display:flex; align-items:center; gap:16px; padding-top:20px;">
                <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#F5F5F5; font-size:0.85rem;">
                  <input type="checkbox" ${currentData.rail?.animationEnabled !== false ? 'checked' : ''} onchange="window.AdminSponsorsModule.updateField('rail.animationEnabled', this.checked)">
                  <span>Animation Enabled</span>
                </label>
                <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#F5F5F5; font-size:0.85rem;">
                  <input type="checkbox" ${currentData.rail?.pauseOnHover !== false ? 'checked' : ''} onchange="window.AdminSponsorsModule.updateField('rail.pauseOnHover', this.checked)">
                  <span>Pause on Hover</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Add Sponsor Action Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h4 style="margin:0; font-size:0.9rem; color:#F5F5F5; font-weight:700;">
              Active Sponsor Logos in Marquee
            </h4>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.AdminSponsorsModule.openSponsorModal()" style="background:#F25912; border-color:#F25912;">
              <i class="fas fa-plus"></i> Add Sponsor to Rail
            </button>
          </div>

          <!-- Sponsor Cards Roster -->
          <div id="sponsorRailCardsContainer" style="display:flex; flex-direction:column; gap:10px;">
            ${renderRailCards(railItems)}
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- 03 SPONSORSHIP CONTENT ACCORDION                     -->
      <!-- ════════════════════════════════════════════════════ -->
      <div class="admin-panel" style="margin-bottom:20px; background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:rgba(255,255,255,0.02);" onclick="window.AdminSponsorsModule.toggleSection('content')">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:800; color:#F25912; font-size:1rem;">03</span>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem; letter-spacing:0.02em;">SPONSORSHIP CONTENT</span>
              <span style="font-size:0.75rem; color:#9696A0;">Hero banner, dynamic sponsorship tiers, benefits list & enquiry section</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="badge badge-info" style="font-size:0.7rem;">${tiers.length} TIERS</span>
            <i class="fas fa-chevron-${collapsedSections['content'] ? 'down' : 'up'}" style="color:#9696A0;"></i>
          </div>
        </div>

        <div id="section-body-content" style="display:${collapsedSections['content'] ? 'none' : 'block'}; padding:24px; border-top:1px solid #282832;">

          <!-- ──────────────────────────────────────────────── -->
          <!-- PART A: HERO / INTRO                             -->
          <!-- ──────────────────────────────────────────────── -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid #282832; border-radius:8px; padding:20px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #282832; padding-bottom:12px;">
              <h4 style="margin:0; font-size:0.95rem; color:#F25912; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; font-family:monospace;">
                <i class="fas fa-star"></i> Part A: Sponsor Hero Section
              </h4>
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#F5F5F5; font-size:0.85rem;">
                <input type="checkbox" ${currentData.hero?.visible !== false ? 'checked' : ''} onchange="window.AdminSponsorsModule.updateField('hero.visible', this.checked)">
                <span>Visible on Live Website</span>
              </label>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
              <div>
                <label class="form-label">Eyebrow Text</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.eyebrow || '')}" onchange="window.AdminSponsorsModule.updateField('hero.eyebrow', this.value)" placeholder="Partner With Us">
              </div>
              <div>
                <label class="form-label">Eyebrow Icon (FontAwesome)</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.eyebrowIcon || 'fas fa-handshake')}" onchange="window.AdminSponsorsModule.updateField('hero.eyebrowIcon', this.value)" placeholder="fas fa-handshake">
              </div>
              <div>
                <label class="form-label">Main Heading Line 1</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.headingLine1 || '')}" onchange="window.AdminSponsorsModule.updateField('hero.headingLine1', this.value)" placeholder="Become A">
              </div>
              <div>
                <label class="form-label">Highlighted Heading Text (Orange Accent)</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.headingHighlight || '')}" onchange="window.AdminSponsorsModule.updateField('hero.headingHighlight', this.value)" placeholder="Sponsor">
              </div>
              <div style="grid-column:1 / -1;">
                <label class="form-label">Hero Description Text</label>
                <textarea class="form-input" rows="3" onchange="window.AdminSponsorsModule.updateField('hero.description', this.value)" placeholder="Put your brand on Tarkshya...">${escapeHtml(currentData.hero?.description || '')}</textarea>
              </div>
            </div>

            <!-- Hero Media & Buttons -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
              <div>
                <label class="form-label">Hero Background Image</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="form-input" id="hero_bg_img" value="${escapeHtml(currentData.hero?.bgImageUrl || '')}" onchange="window.AdminSponsorsModule.updateField('hero.bgImageUrl', this.value)" placeholder="https://res.cloudinary.com/...">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminSponsorsModule.pickMedia('hero.bgImageUrl', 'hero_bg_img')">
                    <i class="fas fa-folder-open"></i> Media Library
                  </button>
                </div>
                ${currentData.hero?.bgImageUrl ? `<div style="margin-top:8px; border:1px solid #282832; border-radius:4px; max-width:260px; height:90px; overflow:hidden;"><img src="${escapeHtml(currentData.hero.bgImageUrl)}" style="width:100%; height:100%; object-fit:cover;"></div>` : ''}
              </div>
              <div>
                <label class="form-label">Overlay Strength (${currentData.hero?.overlayStrength || 72}%)</label>
                <input type="range" min="0" max="100" value="${currentData.hero?.overlayStrength || 72}" class="form-range" style="width:100%; accent-color:#F25912; margin-top:10px;" oninput="this.nextElementSibling.textContent=this.value+'%'; window.AdminSponsorsModule.updateField('hero.overlayStrength', Number(this.value))">
                <span style="font-size:0.75rem; color:#9696A0;">${currentData.hero?.overlayStrength || 72}% Dark Dim Overlay</span>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
              <div>
                <label class="form-label">Primary Button Text</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.buttonPrimaryText || 'Start Here')}" onchange="window.AdminSponsorsModule.updateField('hero.buttonPrimaryText', this.value)">
              </div>
              <div>
                <label class="form-label">Primary Button Link</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.buttonPrimaryUrl || '#sponsor-form')}" onchange="window.AdminSponsorsModule.updateField('hero.buttonPrimaryUrl', this.value)">
              </div>
              <div>
                <label class="form-label">Brochure Button Text</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.buttonBrochureText || 'Brochure')}" onchange="window.AdminSponsorsModule.updateField('hero.buttonBrochureText', this.value)">
              </div>
              <div>
                <label class="form-label">Brochure Document / URL</label>
                <div style="display:flex; gap:6px;">
                  <input type="text" class="form-input" id="hero_brochure_url" value="${escapeHtml(currentData.hero?.buttonBrochureUrl || '')}" onchange="window.AdminSponsorsModule.updateField('hero.buttonBrochureUrl', this.value)" placeholder="https://res.cloudinary.com/...">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminSponsorsModule.pickMedia('hero.buttonBrochureUrl', 'hero_brochure_url', 'all')">
                    <i class="fas fa-file-pdf"></i> Pick
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- ──────────────────────────────────────────────── -->
          <!-- PART B: SPONSORSHIP TIERS                        -->
          <!-- ──────────────────────────────────────────────── -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid #282832; border-radius:8px; padding:20px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #282832; padding-bottom:12px;">
              <h4 style="margin:0; font-size:0.95rem; color:#F25912; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; font-family:monospace;">
                <i class="fas fa-layer-group"></i> Part B: Sponsorship Tiers & Packages
              </h4>
              <button type="button" class="btn btn-primary btn-sm" onclick="window.AdminSponsorsModule.addTier()" style="background:#F25912; border-color:#F25912;">
                <i class="fas fa-plus"></i> Add New Tier
              </button>
            </div>

            <!-- Tier Intro Header Controls -->
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
              <div>
                <label class="form-label">Tiers Section Heading</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.tiersSection?.headingLine1 || 'Choose Your')}" onchange="window.AdminSponsorsModule.updateField('tiersSection.headingLine1', this.value)">
              </div>
              <div>
                <label class="form-label">Highlighted Word</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.tiersSection?.headingHighlight || 'Level')}" onchange="window.AdminSponsorsModule.updateField('tiersSection.headingHighlight', this.value)">
              </div>
              <div style="grid-column:1 / -1;">
                <label class="form-label">Tiers Section Subtitle</label>
                <textarea class="form-input" rows="2" onchange="window.AdminSponsorsModule.updateField('tiersSection.description', this.value)">${escapeHtml(currentData.tiersSection?.description || '')}</textarea>
              </div>
              <div style="grid-column:1 / -1;">
                <label class="form-label">Tiers Section Background Image</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="form-input" id="tiers_bg_img" value="${escapeHtml(currentData.tiersSection?.bgImageUrl || '')}" onchange="window.AdminSponsorsModule.updateField('tiersSection.bgImageUrl', this.value)" placeholder="https://res.cloudinary.com/...">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminSponsorsModule.pickMedia('tiersSection.bgImageUrl', 'tiers_bg_img')">
                    <i class="fas fa-folder-open"></i> Media Library
                  </button>
                </div>
              </div>
            </div>

            <!-- Tier Cards Container -->
            <div id="sponsorTiersContainer" style="display:flex; flex-direction:column; gap:16px;">
              ${renderTierCards(tiers)}
            </div>
          </div>

          <!-- ──────────────────────────────────────────────── -->
          <!-- PART C: ENQUIRY SECTION & FORM                   -->
          <!-- ──────────────────────────────────────────────── -->
          <div style="background:rgba(255,255,255,0.02); border:1px solid #282832; border-radius:8px; padding:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #282832; padding-bottom:12px;">
              <h4 style="margin:0; font-size:0.95rem; color:#F25912; font-weight:800; text-transform:uppercase; letter-spacing:0.05em; font-family:monospace;">
                <i class="fas fa-paper-plane"></i> Part C: Sponsor Enquiry Section & Form
              </h4>
              <span class="badge badge-success" style="font-size:0.7rem;">INBOX CONNECTED</span>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
              <div>
                <label class="form-label">Section Eyebrow</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.enquirySection?.eyebrow || 'Get Started')}" onchange="window.AdminSponsorsModule.updateField('enquirySection.eyebrow', this.value)">
              </div>
              <div>
                <label class="form-label">Main Heading</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.enquirySection?.headingLine1 || 'Become A')}" onchange="window.AdminSponsorsModule.updateField('enquirySection.headingLine1', this.value)">
              </div>
              <div style="grid-column:1 / -1;">
                <label class="form-label">Section Description</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.enquirySection?.description || "Tell us about your organisation and we'll get back to you with a custom proposal.")}" onchange="window.AdminSponsorsModule.updateField('enquirySection.description', this.value)">
              </div>
            </div>

            <h5 style="color:#F5F5F5; font-size:0.85rem; margin:16px 0 10px 0; text-transform:uppercase; font-family:monospace;">
              <i class="fas fa-id-card"></i> Contact Card Information (Left Panel)
            </h5>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
              <div>
                <label class="form-label">Contact Box Heading</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.enquirySection?.contactHeading || "Let's Talk")}" onchange="window.AdminSponsorsModule.updateField('enquirySection.contactHeading', this.value)">
              </div>
              <div>
                <label class="form-label">Sponsorship Team Email</label>
                <input type="email" class="form-input" value="${escapeHtml(currentData.enquirySection?.email || 'sponsors@ashwariders.in')}" onchange="window.AdminSponsorsModule.updateField('enquirySection.email', this.value)">
              </div>
              <div>
                <label class="form-label">Sponsorship Team Phone</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.enquirySection?.phone || '+91 00000 00000')}" onchange="window.AdminSponsorsModule.updateField('enquirySection.phone', this.value)">
              </div>
              <div>
                <label class="form-label">Workshop / College Address</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.enquirySection?.address || 'St. Vincent Pallotti CET, Nagpur')}" onchange="window.AdminSponsorsModule.updateField('enquirySection.address', this.value)">
              </div>
              <div style="grid-column:1 / -1;">
                <label class="form-label">Contact Description</label>
                <textarea class="form-input" rows="2" onchange="window.AdminSponsorsModule.updateField('enquirySection.contactDescription', this.value)">${escapeHtml(currentData.enquirySection?.contactDescription || '')}</textarea>
              </div>
              <div style="grid-column:1 / -1;">
                <label class="form-label">Brochure Download File URL</label>
                <div style="display:flex; gap:8px;">
                  <input type="text" class="form-input" id="enquiry_brochure_url" value="${escapeHtml(currentData.enquirySection?.brochureUrl || '')}" onchange="window.AdminSponsorsModule.updateField('enquirySection.brochureUrl', this.value)" placeholder="https://res.cloudinary.com/.../brochure.pdf">
                  <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminSponsorsModule.pickMedia('enquirySection.brochureUrl', 'enquiry_brochure_url', 'all')">
                    <i class="fas fa-file-pdf"></i> Upload / Pick PDF
                  </button>
                </div>
              </div>
            </div>

            <h5 style="color:#F5F5F5; font-size:0.85rem; margin:16px 0 10px 0; text-transform:uppercase; font-family:monospace;">
              <i class="fas fa-paper-plane"></i> Form Actions & Messages (Right Panel)
            </h5>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
              <div>
                <label class="form-label">Submit Button Label</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.enquirySection?.submitButtonText || 'Send Enquiry')}" onchange="window.AdminSponsorsModule.updateField('enquirySection.submitButtonText', this.value)">
              </div>
              <div>
                <label class="form-label">Success Notification Message</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.enquirySection?.successMessage || 'Thank you for your enquiry! Our sponsorship team will get back to you shortly.')}" onchange="window.AdminSponsorsModule.updateField('enquirySection.successMessage', this.value)">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- 04 GLOBAL FOOTER ACCORDION                           -->
      <!-- ════════════════════════════════════════════════════ -->
      <div class="admin-panel" style="margin-bottom:20px; background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:rgba(255,255,255,0.02);" onclick="window.AdminSponsorsModule.toggleSection('footer')">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:800; color:#F25912; font-size:1rem;">04</span>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem; letter-spacing:0.02em;">GLOBAL FOOTER</span>
              <span style="font-size:0.75rem; color:#9696A0;">Existing global footer integration & shared site copyright reference</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="badge badge-success" style="font-size:0.7rem;">INHERITED</span>
            <i class="fas fa-chevron-${collapsedSections['footer'] ? 'down' : 'up'}" style="color:#9696A0;"></i>
          </div>
        </div>

        <div id="section-body-footer" style="display:${collapsedSections['footer'] ? 'none' : 'block'}; padding:24px; border-top:1px solid #282832;">
          <div style="background:rgba(255,255,255,0.02); border:1px solid #282832; border-radius:8px; padding:18px;">
            <p style="font-size:0.85rem; color:#E8ECEB; margin:0 0 10px 0;">
              The Sponsor page uses the existing global Ashwa Riders footer layout.
            </p>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:0.8rem; color:#9696A0; font-family:monospace;">
              <div>Copyright: <span style="color:#FFF;">${escapeHtml(footerSummary.copyrightText || '© 2026 Ashwa Riders')}</span></div>
              <div>Team Email: <span style="color:#FFF;">${escapeHtml(footerSummary.email || 'sponsors@ashwariders.in')}</span></div>
            </div>
            <div style="margin-top:16px;">
              <a href="/admin/navigation" onclick="event.preventDefault(); window.location.hash='#/admin/navigation';" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px;">
                <i class="fas fa-bars-staggered"></i> Manage Global Footer Settings
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach Action Buttons
    document.getElementById('sponsorSaveDraftBtn')?.addEventListener('click', handleSaveDraft);
    document.getElementById('sponsorPublishBtn')?.addEventListener('click', handlePublish);
  }

  // ============================================================
  //  SPONSOR RAIL ITEM RENDERING
  // ============================================================
  function renderRailCards(items) {
    if (!items || items.length === 0) {
      return `
        <div style="padding:24px; text-align:center; color:#9696A0; border:1px dashed #282832; border-radius:6px;">
          <i class="fas fa-handshake" style="font-size:1.5rem; margin-bottom:8px; color:#F25912;"></i>
          <p style="margin:0;">No sponsors currently added to the rail. Click <strong>Add Sponsor to Rail</strong> to add your first sponsor.</p>
        </div>
      `;
    }

    return items
      .map((item, index) => {
        const logoDisplay = item.logoUrl
          ? `<img src="${escapeHtml(item.logoUrl)}" style="max-height:36px; max-width:100px; object-fit:contain;" alt="${escapeHtml(item.name)}">`
          : `<i class="${escapeHtml(item.icon || 'fas fa-bolt')}" style="color:#F25912; font-size:1.2rem;"></i>`;

        return `
          <div style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); border:1px solid #282832; border-radius:8px; padding:12px 18px; gap:16px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:14px;">
              <!-- Move Up/Down Controls -->
              <div style="display:flex; flex-direction:column; gap:4px;">
                <button type="button" class="btn btn-secondary" style="padding:2px 6px; font-size:0.65rem;" onclick="window.AdminSponsorsModule.moveSponsor(${index}, -1)" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''}>
                  <i class="fas fa-chevron-up"></i>
                </button>
                <button type="button" class="btn btn-secondary" style="padding:2px 6px; font-size:0.65rem;" onclick="window.AdminSponsorsModule.moveSponsor(${index}, 1)" ${index === items.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
                  <i class="fas fa-chevron-down"></i>
                </button>
              </div>

              <!-- Logo Box -->
              <div style="width:110px; height:48px; background:#0B0B0E; border:1px solid #282832; border-radius:4px; display:flex; align-items:center; justify-content:center; padding:4px; overflow:hidden;">
                ${logoDisplay}
              </div>

              <!-- Sponsor Details -->
              <div>
                <div style="display:flex; align-items:center; gap:8px;">
                  <strong style="color:#FFF; font-size:0.95rem;">${escapeHtml(item.name)}</strong>
                  <span class="badge" style="background:#282832; color:#F25912; font-size:0.7rem; font-weight:700;">${escapeHtml(item.tier || 'Gold')}</span>
                </div>
                <div style="font-size:0.75rem; color:#9696A0; margin-top:2px;">
                  ${item.websiteUrl ? `<a href="${escapeHtml(item.websiteUrl)}" target="_blank" style="color:#F25912;"><i class="fas fa-external-link-alt"></i> ${escapeHtml(item.websiteUrl)}</a>` : '<span style="color:#666;">No website link</span>'}
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div style="display:flex; align-items:center; gap:10px;">
              <label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer; font-size:0.8rem; color:#9696A0; margin-right:8px;">
                <input type="checkbox" ${item.visible !== false ? 'checked' : ''} onchange="window.AdminSponsorsModule.toggleSponsorVisibility(${index}, this.checked)">
                <span>${item.visible !== false ? 'Enabled' : 'Disabled'}</span>
              </label>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminSponsorsModule.replaceSponsorLogo(${index})" title="Replace Logo via Media Library">
                <i class="fas fa-image"></i> Replace Logo
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminSponsorsModule.openSponsorModal(${index})" title="Edit Details">
                <i class="fas fa-pen"></i> Edit
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="window.AdminSponsorsModule.deleteSponsor(${index})" style="background:rgba(239,68,68,0.15); color:#EF4444; border:1px solid rgba(239,68,68,0.3);" title="Remove">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');
  }

  // ============================================================
  //  SPONSORSHIP TIERS RENDERING
  // ============================================================
  function renderTierCards(tiers) {
    if (!tiers || tiers.length === 0) {
      return `
        <div style="padding:24px; text-align:center; color:#9696A0; border:1px dashed #282832; border-radius:6px;">
          <p style="margin:0;">No tiers configured. Click <strong>Add New Tier</strong> to create a sponsorship package.</p>
        </div>
      `;
    }

    return tiers
      .map((tier, tIdx) => {
        const benefitsListHtml = (tier.benefits || [])
          .map((b, bIdx) => `
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:6px;">
              <span style="color:#F25912; font-size:0.8rem;"><i class="fas fa-check"></i></span>
              <input type="text" class="form-input" style="padding:6px 10px; font-size:0.85rem;" value="${escapeHtml(b)}" onchange="window.AdminSponsorsModule.updateBenefit(${tIdx}, ${bIdx}, this.value)">
              <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px; color:#EF4444;" onclick="window.AdminSponsorsModule.deleteBenefit(${tIdx}, ${bIdx})" title="Remove benefit">
                <i class="fas fa-times"></i>
              </button>
            </div>
          `)
          .join('');

        return `
          <div style="background:#0F0F13; border:1px solid ${tier.isPopular ? '#F25912' : '#282832'}; border-radius:8px; padding:18px; position:relative;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span class="badge" style="background:${escapeHtml(tier.badgeColor || '#F25912')}; color:#000; font-weight:800; font-size:0.75rem;">
                  ${escapeHtml(tier.name || 'Tier')}
                </span>
                <strong style="font-size:1.05rem; color:#FFF;">${escapeHtml(tier.title || 'Package Title')}</strong>
                ${tier.isPopular ? `<span class="badge" style="background:#F25912; color:#10141c; font-weight:800; font-size:0.7rem;">★ ${escapeHtml(tier.popularRibbonText || 'POPULAR')}</span>` : ''}
              </div>

              <!-- Reorder / Actions -->
              <div style="display:flex; align-items:center; gap:8px;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminSponsorsModule.moveTier(${tIdx}, -1)" ${tIdx === 0 ? 'disabled style="opacity:0.3;"' : ''}>
                  <i class="fas fa-chevron-up"></i>
                </button>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminSponsorsModule.moveTier(${tIdx}, 1)" ${tIdx === tiers.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
                  <i class="fas fa-chevron-down"></i>
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="window.AdminSponsorsModule.deleteTier(${tIdx})" style="background:rgba(239,68,68,0.15); color:#EF4444; border:1px solid rgba(239,68,68,0.3);">
                  <i class="fas fa-trash"></i> Delete Tier
                </button>
              </div>
            </div>

            <!-- Tier Fields -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin-bottom:14px;">
              <div>
                <label class="form-label">Tier Level / Label</label>
                <input type="text" class="form-input" value="${escapeHtml(tier.name || '')}" onchange="window.AdminSponsorsModule.updateTierField(${tIdx}, 'name', this.value)" placeholder="e.g. Bronze, Gold, Title">
              </div>
              <div>
                <label class="form-label">Tier Title</label>
                <input type="text" class="form-input" value="${escapeHtml(tier.title || '')}" onchange="window.AdminSponsorsModule.updateTierField(${tIdx}, 'title', this.value)" placeholder="e.g. Associate Sponsor">
              </div>
              <div>
                <label class="form-label">Value / Range Description</label>
                <input type="text" class="form-input" value="${escapeHtml(tier.description || '')}" onchange="window.AdminSponsorsModule.updateTierField(${tIdx}, 'description', this.value)" placeholder="e.g. Cash or in-kind support">
              </div>
              <div>
                <label class="form-label">Badge Color</label>
                <div style="display:flex; gap:6px;">
                  <input type="color" value="${escapeHtml(tier.badgeColor || '#F25912')}" style="width:36px; height:36px; padding:2px; background:transparent; border:none; cursor:pointer;" onchange="window.AdminSponsorsModule.updateTierField(${tIdx}, 'badgeColor', this.value)">
                  <input type="text" class="form-input" value="${escapeHtml(tier.badgeColor || '#F25912')}" onchange="window.AdminSponsorsModule.updateTierField(${tIdx}, 'badgeColor', this.value)">
                </div>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:14px; background:rgba(255,255,255,0.02); padding:10px; border-radius:6px;">
              <div>
                <label class="form-label">Button Text</label>
                <input type="text" class="form-input" value="${escapeHtml(tier.buttonText || 'Get In Touch')}" onchange="window.AdminSponsorsModule.updateTierField(${tIdx}, 'buttonText', this.value)">
              </div>
              <div>
                <label class="form-label">Button Link URL</label>
                <input type="text" class="form-input" value="${escapeHtml(tier.buttonUrl || '#sponsor-form')}" onchange="window.AdminSponsorsModule.updateTierField(${tIdx}, 'buttonUrl', this.value)">
              </div>
              <div style="display:flex; align-items:center; gap:12px; padding-top:18px;">
                <label style="display:inline-flex; align-items:center; gap:6px; cursor:pointer; color:#F5F5F5; font-size:0.85rem;">
                  <input type="checkbox" ${tier.isPopular ? 'checked' : ''} onchange="window.AdminSponsorsModule.setPopularTier(${tIdx}, this.checked)">
                  <span style="font-weight:700; color:#F25912;">Mark as Popular Tier</span>
                </label>
              </div>
            </div>

            <!-- Tier Benefits -->
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <label class="form-label" style="margin:0;">Included Benefits & Deliverables</label>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:2px 8px; font-size:0.75rem;" onclick="window.AdminSponsorsModule.addBenefit(${tIdx})">
                  <i class="fas fa-plus"></i> Add Benefit
                </button>
              </div>
              ${benefitsListHtml || '<p style="color:#666; font-size:0.8rem; margin:0 0 6px 0;">No benefits listed.</p>'}
            </div>
          </div>
        `;
      })
      .join('');
  }

  // ============================================================
  //  INTERACTIVE ACTIONS & HANDLERS
  // ============================================================

  function toggleSection(secKey) {
    collapsedSections[secKey] = !collapsedSections[secKey];
    const el = document.getElementById(`section-body-${secKey}`);
    if (el) {
      el.style.display = collapsedSections[secKey] ? 'none' : 'block';
    }
    const icon = el?.previousElementSibling?.querySelector('.fa-chevron-down, .fa-chevron-up');
    if (icon) {
      icon.className = `fas fa-chevron-${collapsedSections[secKey] ? 'down' : 'up'}`;
    }
  }

  function updateField(path, val) {
    if (!currentData) return;
    const parts = path.split('.');
    let target = currentData;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!target[parts[i]]) target[parts[i]] = {};
      target = target[parts[i]];
    }
    target[parts[parts.length - 1]] = val;
    markDirty();
  }

  function markDirty() {
    if (currentData) {
      currentData.status = 'draft';
      const badge = document.getElementById('sponsorStatusBadge');
      if (badge) {
        badge.className = 'badge badge-warning';
        badge.textContent = 'DRAFT CHANGES';
      }
    }
  }

  function pickMedia(targetField, inputId, allowedType = 'image') {
    if (!window.MediaPicker) {
      toast('MediaPicker is not initialized.', 'error');
      return;
    }
    window.MediaPicker.open({
      allowedType,
      onSelect: (asset) => {
        const inp = document.getElementById(inputId);
        if (inp) inp.value = asset.url;
        updateField(targetField, asset.url);
        renderInterface(document.getElementById('adminContent'));
      },
    });
  }

  // ─── SPONSOR RAIL ACTIONS ──────────────────────────────────
  function openSponsorModal(index = null) {
    const isEdit = index !== null;
    const existing = isEdit ? (currentData.rail.items[index] || {}) : {};

    const sponsor = {
      id: existing.id || `sp-${Date.now()}`,
      name: existing.name || '',
      tier: existing.tier || 'Gold',
      logoUrl: existing.logoUrl || '',
      altText: existing.altText || '',
      websiteUrl: existing.websiteUrl || '',
      icon: existing.icon || 'fas fa-bolt',
      order: existing.order !== undefined ? existing.order : ((currentData.rail?.items?.length || 0) + 1),
      visible: existing.visible !== false,
    };

    const modalId = 'sponsorEditModal';
    const old = document.getElementById(modalId);
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'ar-cms-modal-overlay ar-open';

    overlay.innerHTML = `
      <div class="ar-cms-modal" style="max-width:540px; background:#141419; border:1px solid #282832; border-radius:10px; color:#F5F5F5;">
        <div class="ar-cms-modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #282832; padding:16px 20px;">
          <h3 style="margin:0; font-size:1.1rem; color:#FFF; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-handshake" style="color:#F25912;"></i> ${isEdit ? 'Edit Sponsor' : 'Add Sponsor to Rail'}
          </h3>
          <button type="button" class="btn btn-secondary btn-sm" id="closeSponsorModalBtn"><i class="fas fa-times"></i></button>
        </div>

        <form id="sponsorModalForm" style="padding:20px;">
          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label">Sponsor / Company Name *</label>
            <input type="text" class="form-input" id="mSponsorName" value="${escapeHtml(sponsor.name)}" required placeholder="e.g. Carbonext, MATLAB, ANSYS">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
            <div>
              <label class="form-label">Sponsorship Tier</label>
              <select class="form-select" id="mSponsorTier">
                <option value="Title" ${sponsor.tier === 'Title' ? 'selected' : ''}>Title Sponsor</option>
                <option value="Platinum" ${sponsor.tier === 'Platinum' ? 'selected' : ''}>Platinum Tier</option>
                <option value="Gold" ${sponsor.tier === 'Gold' ? 'selected' : ''}>Gold Tier</option>
                <option value="Silver" ${sponsor.tier === 'Silver' ? 'selected' : ''}>Silver Tier</option>
                <option value="Bronze" ${sponsor.tier === 'Bronze' ? 'selected' : ''}>Bronze Tier</option>
                <option value="Technical Partner" ${sponsor.tier === 'Technical Partner' ? 'selected' : ''}>Technical Partner</option>
                <option value="Equipment Partner" ${sponsor.tier === 'Equipment Partner' ? 'selected' : ''}>Equipment Partner</option>
                <option value="Associate" ${sponsor.tier === 'Associate' ? 'selected' : ''}>Associate Partner</option>
              </select>
            </div>
            <div>
              <label class="form-label">Display Order</label>
              <input type="number" class="form-input" id="mSponsorOrder" value="${sponsor.order}">
            </div>
          </div>

          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label">Sponsor Logo Image</label>
            <div style="display:flex; gap:8px;">
              <input type="text" class="form-input" id="mSponsorLogoUrl" value="${escapeHtml(sponsor.logoUrl)}" placeholder="https://res.cloudinary.com/...">
              <button type="button" class="btn btn-secondary btn-sm" id="mPickLogoBtn">
                <i class="fas fa-folder-open"></i> Pick Logo
              </button>
            </div>
            <div id="mLogoPreviewBox" style="margin-top:8px; width:120px; height:50px; background:#0B0B0E; border:1px solid #282832; border-radius:4px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
              ${sponsor.logoUrl ? `<img src="${escapeHtml(sponsor.logoUrl)}" style="max-height:40px; max-width:110px; object-fit:contain;">` : `<i class="${escapeHtml(sponsor.icon || 'fas fa-bolt')}" style="color:#F25912;"></i>`}
            </div>
          </div>

          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label">Website URL</label>
            <input type="text" class="form-input" id="mSponsorWebsite" value="${escapeHtml(sponsor.websiteUrl)}" placeholder="https://company.com">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
            <div>
              <label class="form-label">Fallback FontAwesome Icon</label>
              <input type="text" class="form-input" id="mSponsorIcon" value="${escapeHtml(sponsor.icon || 'fas fa-bolt')}" placeholder="fas fa-bolt">
            </div>
            <div>
              <label class="form-label">Logo Alt Text</label>
              <input type="text" class="form-input" id="mSponsorAlt" value="${escapeHtml(sponsor.altText)}" placeholder="Company logo">
            </div>
          </div>

          <div style="margin-bottom:18px;">
            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="mSponsorVisible" ${sponsor.visible ? 'checked' : ''}>
              <span>Show in Marquee Rail</span>
            </label>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #282832; padding-top:14px;">
            <button type="button" class="btn btn-secondary btn-sm" id="cancelSponsorModalBtn">Cancel</button>
            <button type="submit" class="btn btn-primary btn-sm" style="background:#F25912; border-color:#F25912;">
              <i class="fas fa-save"></i> ${isEdit ? 'Update Sponsor' : 'Add Sponsor'}
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#closeSponsorModalBtn').addEventListener('click', close);
    overlay.querySelector('#cancelSponsorModalBtn').addEventListener('click', close);

    overlay.querySelector('#mPickLogoBtn').addEventListener('click', () => {
      if (!window.MediaPicker) return;
      window.MediaPicker.open({
        allowedType: 'image',
        onSelect: (asset) => {
          const inp = overlay.querySelector('#mSponsorLogoUrl');
          const prev = overlay.querySelector('#mLogoPreviewBox');
          if (inp) inp.value = asset.url;
          if (prev) prev.innerHTML = `<img src="${asset.url}" style="max-height:40px; max-width:110px; object-fit:contain;">`;
        },
      });
    });

    overlay.querySelector('#sponsorModalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedSponsor = {
        id: sponsor.id,
        name: overlay.querySelector('#mSponsorName').value.trim(),
        tier: overlay.querySelector('#mSponsorTier').value,
        order: Number(overlay.querySelector('#mSponsorOrder').value) || 0,
        logoUrl: overlay.querySelector('#mSponsorLogoUrl').value.trim(),
        altText: overlay.querySelector('#mSponsorAlt').value.trim(),
        websiteUrl: overlay.querySelector('#mSponsorWebsite').value.trim(),
        icon: overlay.querySelector('#mSponsorIcon').value.trim() || 'fas fa-bolt',
        visible: overlay.querySelector('#mSponsorVisible').checked,
      };

      if (!updatedSponsor.name) {
        toast('Sponsor Name is required.', 'error');
        return;
      }

      if (!currentData.rail.items) currentData.rail.items = [];

      if (isEdit) {
        currentData.rail.items[index] = updatedSponsor;
      } else {
        currentData.rail.items.push(updatedSponsor);
      }

      markDirty();
      close();
      renderInterface(document.getElementById('adminContent'));
      toast(`Sponsor ${isEdit ? 'updated' : 'added'} to draft.`);
    });
  }

  function replaceSponsorLogo(index) {
    if (!window.MediaPicker) return;
    window.MediaPicker.open({
      allowedType: 'image',
      onSelect: (asset) => {
        if (currentData?.rail?.items?.[index]) {
          currentData.rail.items[index].logoUrl = asset.url;
          markDirty();
          renderInterface(document.getElementById('adminContent'));
          toast('Sponsor logo replaced.');
        }
      },
    });
  }

  function toggleSponsorVisibility(index, isVisible) {
    if (currentData?.rail?.items?.[index]) {
      currentData.rail.items[index].visible = isVisible;
      markDirty();
    }
  }

  function moveSponsor(index, direction) {
    const items = currentData?.rail?.items;
    if (!items) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    // re-assign orders
    items.forEach((item, i) => { item.order = i + 1; });

    markDirty();
    renderInterface(document.getElementById('adminContent'));
  }

  function deleteSponsor(index) {
    const item = currentData?.rail?.items?.[index];
    if (!item) return;
    if (!confirm(`Are you sure you want to remove "${item.name}" from the Sponsor Rail?`)) return;

    currentData.rail.items.splice(index, 1);
    currentData.rail.items.forEach((it, i) => { it.order = i + 1; });
    markDirty();
    renderInterface(document.getElementById('adminContent'));
    toast('Sponsor removed from rail.');
  }

  // ─── SPONSORSHIP TIERS ACTIONS ─────────────────────────────
  function addTier() {
    if (!currentData.tiersSection.tiers) currentData.tiersSection.tiers = [];
    const newTier = {
      id: `tier-${Date.now()}`,
      name: 'Custom',
      title: 'Partner Package',
      description: 'Support description',
      benefits: ['Custom team benefit', 'Social media mention'],
      buttonText: 'Get In Touch',
      buttonUrl: '#sponsor-form',
      isPopular: false,
      popularRibbonText: 'Popular',
      badgeColor: '#F25912',
      order: currentData.tiersSection.tiers.length + 1,
      visible: true,
    };
    currentData.tiersSection.tiers.push(newTier);
    markDirty();
    renderInterface(document.getElementById('adminContent'));
    toast('New tier added. Customize fields and save draft.');
  }

  function updateTierField(tIdx, field, val) {
    if (currentData?.tiersSection?.tiers?.[tIdx]) {
      currentData.tiersSection.tiers[tIdx][field] = val;
      markDirty();
    }
  }

  function setPopularTier(tIdx, isChecked) {
    if (!currentData?.tiersSection?.tiers) return;
    // Uncheck popular on all other tiers
    currentData.tiersSection.tiers.forEach((t, idx) => {
      t.isPopular = idx === tIdx ? isChecked : false;
    });
    markDirty();
    renderInterface(document.getElementById('adminContent'));
  }

  function moveTier(index, direction) {
    const tiers = currentData?.tiersSection?.tiers;
    if (!tiers) return;
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= tiers.length) return;

    const temp = tiers[index];
    tiers[index] = tiers[targetIdx];
    tiers[targetIdx] = temp;

    tiers.forEach((t, i) => { t.order = i + 1; });

    markDirty();
    renderInterface(document.getElementById('adminContent'));
  }

  function deleteTier(index) {
    const tier = currentData?.tiersSection?.tiers?.[index];
    if (!tier) return;
    if (!confirm(`Are you sure you want to delete the "${tier.name} - ${tier.title}" tier?`)) return;

    currentData.tiersSection.tiers.splice(index, 1);
    currentData.tiersSection.tiers.forEach((t, i) => { t.order = i + 1; });
    markDirty();
    renderInterface(document.getElementById('adminContent'));
    toast('Tier removed.');
  }

  function addBenefit(tIdx) {
    const tier = currentData?.tiersSection?.tiers?.[tIdx];
    if (!tier) return;
    if (!Array.isArray(tier.benefits)) tier.benefits = [];
    tier.benefits.push('New sponsorship benefit');
    markDirty();
    renderInterface(document.getElementById('adminContent'));
  }

  function updateBenefit(tIdx, bIdx, val) {
    const tier = currentData?.tiersSection?.tiers?.[tIdx];
    if (tier?.benefits?.[bIdx] !== undefined) {
      tier.benefits[bIdx] = val;
      markDirty();
    }
  }

  function deleteBenefit(tIdx, bIdx) {
    const tier = currentData?.tiersSection?.tiers?.[tIdx];
    if (tier?.benefits) {
      tier.benefits.splice(bIdx, 1);
      markDirty();
      renderInterface(document.getElementById('adminContent'));
    }
  }

  // ─── SAVE DRAFT & PUBLISH LIVE ─────────────────────────────
  async function handleSaveDraft() {
    const btn = document.getElementById('sponsorSaveDraftBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
      const payload = {
        settings: currentData.settings,
        rail: currentData.rail,
        hero: currentData.hero,
        tiersSection: currentData.tiersSection,
        enquirySection: currentData.enquirySection,
      };

      const res = await API().patch('/admin/sponsors/page', payload);
      if (res && res.success) {
        toast('Sponsor Page draft saved successfully!');
        currentData.status = res.data.status;
        currentData.lastEditedAt = res.data.lastEditedAt;
        renderInterface(document.getElementById('adminContent'));
      } else {
        throw new Error(res?.message || 'Save draft failed');
      }
    } catch (err) {
      toast('Draft save error: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save"></i> Save Draft';
      }
    }
  }

  async function handlePublish() {
    const btn = document.getElementById('sponsorPublishBtn');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    }

    try {
      // First save current draft state
      const payload = {
        settings: currentData.settings,
        rail: currentData.rail,
        hero: currentData.hero,
        tiersSection: currentData.tiersSection,
        enquirySection: currentData.enquirySection,
      };
      await API().patch('/admin/sponsors/page', payload);

      // Now publish
      const res = await API().post('/admin/sponsors/page/publish');
      if (res && res.success) {
        toast('🎉 Sponsor Page published to live website!');
        currentData.status = 'published';
        currentData.version = res.data.version;
        currentData.lastPublishedAt = res.data.lastPublishedAt;
        currentData.lastEditedAt = res.data.lastPublishedAt;
        renderInterface(document.getElementById('adminContent'));
      } else {
        throw new Error(res?.message || 'Publish failed');
      }
    } catch (err) {
      toast('Publish error: ' + err.message, 'error');
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Live';
      }
    }
  }

  window.AdminSponsorsModule = {
    renderSponsorsModule,
    toggleSection,
    updateField,
    pickMedia,
    openSponsorModal,
    replaceSponsorLogo,
    toggleSponsorVisibility,
    moveSponsor,
    deleteSponsor,
    addTier,
    updateTierField,
    setPopularTier,
    moveTier,
    deleteTier,
    addBenefit,
    updateBenefit,
    deleteBenefit,
  };
})();
