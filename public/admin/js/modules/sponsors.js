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

      <!-- Quick Access: Home Page Sponsor Rails -->
      <div style="background:linear-gradient(90deg, rgba(242,89,18,0.14), rgba(20,20,25,0.9)); border:1px solid rgba(242,89,18,0.35); border-radius:10px; padding:16px 20px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
        <div>
          <div style="font-weight:800; color:#FFFFFF; font-size:0.95rem; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-house" style="color:#F25912;"></i> HOME PAGE SPONSOR RAILS CONTROL
          </div>
          <div style="font-size:0.82rem; color:#A0A0B0; margin-top:3px;">
            Horizontally moving tiered marquee rails (Gold, Silver, Bronze, Tech Partners, etc.) are managed live in the Home Page CMS.
          </div>
        </div>
        <a href="/admin/home" onclick="event.preventDefault(); if (window.AdminRouter) window.AdminRouter.navigate('/admin/home');" class="btn btn-sm btn-primary" style="background:#F25912; border-color:#F25912; display:inline-flex; align-items:center; gap:6px; font-weight:700;">
          <i class="fas fa-sliders"></i> Open Home Sponsor Rails
        </a>
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
            <button type="button" id="addSponsorRailBtn" data-action="add-sponsor-rail" class="btn btn-primary btn-sm" style="background:#F25912; border-color:#F25912;">
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
    
    // Add Sponsor to Rail button — pure event listener, zero inline onclick
    const addRailBtn = document.getElementById('addSponsorRailBtn');
    if (addRailBtn) {
      addRailBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        openAddSponsorToRailModal();
      });
    }

    // Event delegation on sponsor cards container (single point of event binding, zero inline handlers)
    const sponsorContainer = document.getElementById('sponsorRailCardsContainer');
    if (sponsorContainer) {
      sponsorContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-action="edit"], .edit-sponsor');
        if (editBtn) {
          e.preventDefault();
          e.stopPropagation();
          const sponsorId = editBtn.getAttribute('data-sponsor-id');
          openEditSponsorModal(sponsorId);
          return;
        }

        const replaceBtn = e.target.closest('[data-action="replace-logo"]');
        if (replaceBtn) {
          e.preventDefault();
          e.stopPropagation();
          const sponsorId = replaceBtn.getAttribute('data-sponsor-id');
          replaceSponsorLogo(sponsorId);
          return;
        }

        const deleteBtn = e.target.closest('[data-action="delete"], .delete-sponsor');
        if (deleteBtn) {
          e.preventDefault();
          e.stopPropagation();
          const sponsorId = deleteBtn.getAttribute('data-sponsor-id');
          deleteSponsor(sponsorId);
          return;
        }

        const moveBtn = e.target.closest('[data-action="move"]');
        if (moveBtn) {
          e.preventDefault();
          e.stopPropagation();
          const sponsorId = moveBtn.getAttribute('data-sponsor-id');
          const dir = parseInt(moveBtn.getAttribute('data-direction'), 10) || 0;
          moveSponsor(sponsorId, dir);
          return;
        }
      });

      sponsorContainer.addEventListener('change', (e) => {
        const toggleInput = e.target.closest('[data-action="toggle-visibility"]');
        if (toggleInput) {
          const sponsorId = toggleInput.getAttribute('data-sponsor-id');
          toggleSponsorVisibility(sponsorId, toggleInput.checked);
        }
      });
    }
  }

  // ============================================================
  //  SPONSOR RAIL ITEM RENDERING (Zero inline onclick handlers)
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

        const sponsorId = item.id || item._id || `sp-${index + 1}`;

        return `
          <div class="sponsor-rail-card" data-sponsor-id="${escapeHtml(sponsorId)}" style="display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.02); border:1px solid #282832; border-radius:8px; padding:12px 18px; gap:16px; flex-wrap:wrap;">
            <div style="display:flex; align-items:center; gap:14px;">
              <!-- Move Up/Down Controls -->
              <div style="display:flex; flex-direction:column; gap:4px;">
                <button type="button" class="btn btn-secondary" style="padding:2px 6px; font-size:0.65rem;" data-action="move" data-direction="-1" data-sponsor-id="${escapeHtml(sponsorId)}" ${index === 0 ? 'disabled style="opacity:0.3;"' : ''} title="Move Up">
                  <i class="fas fa-chevron-up"></i>
                </button>
                <button type="button" class="btn btn-secondary" style="padding:2px 6px; font-size:0.65rem;" data-action="move" data-direction="1" data-sponsor-id="${escapeHtml(sponsorId)}" ${index === items.length - 1 ? 'disabled style="opacity:0.3;"' : ''} title="Move Down">
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
                <input type="checkbox" data-action="toggle-visibility" data-sponsor-id="${escapeHtml(sponsorId)}" ${item.visible !== false ? 'checked' : ''}>
                <span>${item.visible !== false ? 'Enabled' : 'Disabled'}</span>
              </label>
              <button type="button" class="btn btn-secondary btn-sm" data-action="replace-logo" data-sponsor-id="${escapeHtml(sponsorId)}" title="Replace Logo via Media Library">
                <i class="fas fa-image"></i> Replace Logo
              </button>
              <button type="button" class="btn btn-secondary btn-sm edit-sponsor" data-action="edit" data-sponsor-id="${escapeHtml(sponsorId)}" title="Edit Details">
                <i class="fas fa-pen"></i> Edit
              </button>
              <button type="button" class="btn btn-danger btn-sm delete-sponsor" data-action="delete" data-sponsor-id="${escapeHtml(sponsorId)}" style="background:rgba(239,68,68,0.15); color:#EF4444; border:1px solid rgba(239,68,68,0.3);" title="Remove">
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

  /**
   * Universal open modal router (supports both add and edit flows).
   */
  function openSponsorModal(sponsorIdOrIndex = null) {
    if (sponsorIdOrIndex !== null && sponsorIdOrIndex !== undefined && sponsorIdOrIndex !== '') {
      return openEditSponsorModal(sponsorIdOrIndex);
    }
    return openAddSponsorToRailModal();
  }

  /**
   * ADD SPONSOR TO RAIL: Selection / Add Interface
   * Supports selecting from existing eligible sponsors or creating a new sponsor.
   */
  async function openAddSponsorToRailModal() {
    const modalId = 'sponsorAddRailModal';
    const old = document.getElementById(modalId);
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'ar-cms-modal-overlay ar-open';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '999999';
    overlay.style.background = 'rgba(8, 8, 12, 0.85)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.webkitBackdropFilter = 'blur(8px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    overlay.style.overflowY = 'auto';
    overlay.style.boxSizing = 'border-box';

    overlay.innerHTML = `
      <div class="ar-cms-modal" style="max-width:680px; width:100%; max-height:90vh; overflow-y:auto; background:#141419; border:1px solid #282832; border-radius:12px; color:#F5F5F5; box-shadow:0 30px 90px rgba(0,0,0,0.85);">
        <!-- Modal Header -->
        <div class="ar-cms-modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #282832; padding:18px 24px; background:#181820; border-top-left-radius:12px; border-top-right-radius:12px;">
          <div>
            <h3 style="margin:0; font-size:1.15rem; color:#FFF; display:flex; align-items:center; gap:10px;">
              <i class="fas fa-handshake" style="color:#F25912;"></i> Add Sponsor to Marquee Rail
            </h3>
            <p style="margin:4px 0 0 0; font-size:0.8rem; color:#9696A0;">
              Select an existing eligible sponsor from your catalog or enter a new sponsor.
            </p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" id="closeAddModalBtn" title="Close"><i class="fas fa-times"></i></button>
        </div>

        <!-- Tab Navigation -->
        <div style="display:flex; border-bottom:1px solid #282832; background:#121217; padding:0 24px;">
          <button type="button" id="tabSelectExistingBtn" style="padding:14px 20px; font-weight:700; font-size:0.85rem; color:#F25912; background:transparent; border:none; border-bottom:2px solid #F25912; cursor:pointer; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-list-check"></i> Select Existing Sponsor
          </button>
          <button type="button" id="tabCreateNewBtn" style="padding:14px 20px; font-weight:600; font-size:0.85rem; color:#9696A0; background:transparent; border:none; border-bottom:2px solid transparent; cursor:pointer; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-plus"></i> Create New Sponsor
          </button>
        </div>

        <!-- Tab 1: Select Existing Eligible Sponsor -->
        <div id="panelSelectExisting" style="padding:24px;">
          <div style="margin-bottom:16px;">
            <input type="text" class="form-input" id="searchExistingInput" placeholder="Filter eligible sponsors by company name..." style="background:#1C1C24; border:1px solid #2D2D3B;">
          </div>

          <div id="existingSponsorsList" style="display:flex; flex-direction:column; gap:10px; max-height:360px; overflow-y:auto; padding-right:4px;">
            <div style="text-align:center; padding:30px; color:#9696A0;">
              <i class="fas fa-circle-notch fa-spin" style="font-size:1.5rem; color:#F25912; margin-bottom:8px;"></i>
              <p style="margin:0; font-size:0.85rem;">Loading sponsor catalog...</p>
            </div>
          </div>
        </div>

        <!-- Tab 2: Create New Sponsor -->
        <div id="panelCreateNew" style="display:none; padding:24px;">
          <form id="createSponsorForm">
            <div class="form-group" style="margin-bottom:14px;">
              <label class="form-label">Sponsor / Company Name *</label>
              <input type="text" class="form-input" id="cNewName" required placeholder="e.g. Bosch, ANSYS, Carbonext">
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label class="form-label">Sponsorship Tier</label>
                <select class="form-select" id="cNewTier">
                  <option value="Title">Title Sponsor</option>
                  <option value="Platinum">Platinum Tier</option>
                  <option value="Gold" selected>Gold Tier</option>
                  <option value="Silver">Silver Tier</option>
                  <option value="Bronze">Bronze Tier</option>
                  <option value="Equipment Partner">Equipment Partner</option>
                  <option value="Associate">Associate Partner</option>
                </select>
              </div>
              <div>
                <label class="form-label">Display Order</label>
                <input type="number" class="form-input" id="cNewOrder" value="${(currentData?.rail?.items?.length || 0) + 1}">
              </div>
            </div>

            <div class="form-group" style="margin-bottom:14px;">
              <label class="form-label">Sponsor Logo Image</label>
              <div style="display:flex; gap:8px;">
                <input type="text" class="form-input" id="cNewLogoUrl" placeholder="https://res.cloudinary.com/...">
                <button type="button" class="btn btn-secondary btn-sm" id="cPickLogoBtn">
                  <i class="fas fa-folder-open"></i> Pick Logo
                </button>
              </div>
              <div id="cNewLogoPreview" style="margin-top:8px; width:120px; height:46px; background:#0B0B0E; border:1px solid #282832; border-radius:4px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                <i class="fas fa-bolt" style="color:#F25912;"></i>
              </div>
            </div>

            <div class="form-group" style="margin-bottom:14px;">
              <label class="form-label">Website URL</label>
              <input type="text" class="form-input" id="cNewWebsite" placeholder="https://company.com">
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
              <div>
                <label class="form-label">Fallback FontAwesome Icon</label>
                <input type="text" class="form-input" id="cNewIcon" value="fas fa-bolt" placeholder="fas fa-bolt">
              </div>
              <div>
                <label class="form-label">Logo Alt Text</label>
                <input type="text" class="form-input" id="cNewAlt" placeholder="Company Logo">
              </div>
            </div>

            <div style="margin-bottom:18px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer;">
                <input type="checkbox" id="cNewVisible" checked>
                <span>Show in Marquee Rail</span>
              </label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #282832; padding-top:16px;">
              <button type="button" class="btn btn-secondary btn-sm" id="cancelCreateNewBtn">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" id="submitCreateNewBtn" style="background:#F25912; border-color:#F25912;">
                <i class="fas fa-plus"></i> Add to Rail & Save
              </button>
            </div>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#closeAddModalBtn').addEventListener('click', close);
    overlay.querySelector('#cancelCreateNewBtn').addEventListener('click', close);

    // Tab switcher
    const tabSelectExisting = overlay.querySelector('#tabSelectExistingBtn');
    const tabCreateNew = overlay.querySelector('#tabCreateNewBtn');
    const panelSelect = overlay.querySelector('#panelSelectExisting');
    const panelCreate = overlay.querySelector('#panelCreateNew');

    tabSelectExisting.addEventListener('click', () => {
      tabSelectExisting.style.color = '#F25912';
      tabSelectExisting.style.borderBottomColor = '#F25912';
      tabCreateNew.style.color = '#9696A0';
      tabCreateNew.style.borderBottomColor = 'transparent';
      panelSelect.style.display = 'block';
      panelCreate.style.display = 'none';
    });

    tabCreateNew.addEventListener('click', () => {
      tabCreateNew.style.color = '#F25912';
      tabCreateNew.style.borderBottomColor = '#F25912';
      tabSelectExisting.style.color = '#9696A0';
      tabSelectExisting.style.borderBottomColor = 'transparent';
      panelCreate.style.display = 'block';
      panelSelect.style.display = 'none';
    });

    // Wire MediaPicker in Create New tab
    overlay.querySelector('#cPickLogoBtn').addEventListener('click', () => {
      if (!window.MediaPicker) {
        toast('Media Library picker is not initialized.', 'warn');
        return;
      }
      window.MediaPicker.open({
        allowedType: 'image',
        onSelect: (asset) => {
          const inp = overlay.querySelector('#cNewLogoUrl');
          const prev = overlay.querySelector('#cNewLogoPreview');
          if (inp) inp.value = asset.url;
          if (prev) prev.innerHTML = `<img src="${asset.url}" style="max-height:38px; max-width:110px; object-fit:contain;">`;
        },
      });
    });

    // Fetch and render existing eligible sponsors
    let allAvailableSponsors = [];

    const loadExistingSponsors = async () => {
      const containerEl = overlay.querySelector('#existingSponsorsList');
      try {
        let list = [];
        // 1. Fetch standalone sponsors collection
        try {
          const res = await API().get('/admin/sponsors');
          if (res && res.success && Array.isArray(res.data)) {
            list = list.concat(res.data);
          }
        } catch (_) {}

        // 2. Fetch approved sponsor requests
        try {
          const reqRes = await API().get('/admin/sponsor-requests');
          if (reqRes && reqRes.success && Array.isArray(reqRes.data)) {
            const reqItems = reqRes.data.map((r) => ({
              id: r._id,
              name: r.companyName,
              tier: r.sponsorshipType?.includes('Platinum') ? 'Platinum' : (r.sponsorshipType?.includes('Silver') ? 'Silver' : 'Gold'),
              logoUrl: r.companyLogoUrl || '',
              websiteUrl: r.website || '',
              icon: 'fas fa-handshake',
            }));
            list = list.concat(reqItems);
          }
        } catch (_) {}

        // Fallback team partner directory if DB returned empty
        if (list.length === 0) {
          list = [
            { id: 'sp-cat-1', name: 'ANSYS Inc.', tier: 'Platinum', logoUrl: '', websiteUrl: 'https://www.ansys.com', icon: 'fas fa-shield-halved' },
            { id: 'sp-cat-2', name: 'Altair Engineering', tier: 'Gold', logoUrl: '', websiteUrl: 'https://www.altair.com', icon: 'fas fa-microchip' },
            { id: 'sp-cat-3', name: 'SolidWorks (Dassault)', tier: 'Platinum', logoUrl: '', websiteUrl: 'https://www.solidworks.com', icon: 'fas fa-cube' },
            { id: 'sp-cat-4', name: 'Continental AG', tier: 'Gold', logoUrl: '', websiteUrl: 'https://www.continental.com', icon: 'fas fa-car-side' },
            { id: 'sp-cat-5', name: 'SKF Bearings', tier: 'Silver', logoUrl: '', websiteUrl: 'https://www.skf.com', icon: 'fas fa-circle-notch' },
            { id: 'sp-cat-6', name: 'Motul', tier: 'Silver', logoUrl: '', websiteUrl: 'https://www.motul.com', icon: 'fas fa-oil-can' },
          ];
        }

        allAvailableSponsors = list;
        renderExistingList('');
      } catch (err) {
        console.error('Error fetching existing sponsors:', err);
        containerEl.innerHTML = `
          <div style="text-align:center; padding:20px; color:#EF4444;">
            Failed to load sponsor catalog: ${escapeHtml(err.message)}
          </div>
        `;
      }
    };

    const renderExistingList = (query = '') => {
      const containerEl = overlay.querySelector('#existingSponsorsList');
      if (!containerEl) return;

      const currentRailItems = currentData?.rail?.items || [];
      const isAlreadyInRail = (sp) => {
        return currentRailItems.some(
          (r) =>
            (r.id && (String(r.id) === String(sp.id) || String(r.id) === String(sp._id))) ||
            (r._id && (String(r._id) === String(sp.id) || String(r._id) === String(sp._id))) ||
            (r.name && r.name.trim().toLowerCase() === (sp.name || sp.companyName || '').trim().toLowerCase())
        );
      };

      const q = query.trim().toLowerCase();
      const filtered = allAvailableSponsors.filter((sp) => {
        const name = (sp.name || sp.companyName || '').toLowerCase();
        return !q || name.includes(q);
      });

      if (filtered.length === 0) {
        containerEl.innerHTML = `
          <div style="text-align:center; padding:30px; color:#9696A0;">
            <i class="fas fa-search" style="font-size:1.5rem; margin-bottom:8px;"></i>
            <p style="margin:0; font-size:0.85rem;">No sponsors found matching "${escapeHtml(query)}". Use the "Create New Sponsor" tab to add them manually.</p>
          </div>
        `;
        return;
      }

      containerEl.innerHTML = filtered
        .map((sp, idx) => {
          const inRail = isAlreadyInRail(sp);
          const name = sp.name || sp.companyName || 'Sponsor';
          const tier = sp.tier || 'Gold';
          const logo = sp.logoUrl || sp.companyLogoUrl;
          const logoHtml = logo
            ? `<img src="${escapeHtml(logo)}" style="max-height:30px; max-width:80px; object-fit:contain;" alt="${escapeHtml(name)}">`
            : `<i class="${escapeHtml(sp.icon || 'fas fa-award')}" style="color:#F25912; font-size:1.1rem;"></i>`;

          return `
            <div style="display:flex; justify-content:space-between; align-items:center; background:#1C1C24; border:1px solid #2D2D3B; border-radius:8px; padding:12px 16px; gap:12px;">
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:90px; height:40px; background:#0F0F14; border:1px solid #282832; border-radius:4px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
                  ${logoHtml}
                </div>
                <div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <strong style="color:#FFF; font-size:0.9rem;">${escapeHtml(name)}</strong>
                    <span class="badge" style="background:#282832; color:#F25912; font-size:0.68rem; font-weight:700;">${escapeHtml(tier)}</span>
                  </div>
                  <div style="font-size:0.75rem; color:#9696A0; margin-top:2px;">
                    ${sp.websiteUrl ? `<a href="${escapeHtml(sp.websiteUrl)}" target="_blank" style="color:#F25912;"><i class="fas fa-external-link-alt"></i> ${escapeHtml(sp.websiteUrl)}</a>` : 'Available Sponsor'}
                  </div>
                </div>
              </div>

              <div>
                ${
                  inRail
                    ? `<span class="badge badge-success" style="padding:6px 10px; font-size:0.75rem; display:inline-flex; align-items:center; gap:5px;"><i class="fas fa-check"></i> Already in Rail</span>`
                    : `<button type="button" class="btn btn-primary btn-sm add-eligible-sponsor-btn" data-sponsor-idx="${idx}" style="background:#F25912; border-color:#F25912; font-weight:700; padding:6px 14px;">
                        <i class="fas fa-plus"></i> Add to Rail
                       </button>`
                }
              </div>
            </div>
          `;
        })
        .join('');

      // Attach click handlers to add buttons
      containerEl.querySelectorAll('.add-eligible-sponsor-btn').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.preventDefault();
          const sIdx = parseInt(btn.getAttribute('data-sponsor-idx'), 10);
          const targetSponsor = filtered[sIdx];
          if (!targetSponsor) return;

          btn.disabled = true;
          btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

          await handleAddExistingSponsor(targetSponsor, btn);
        });
      });
    };

    // Filter input
    overlay.querySelector('#searchExistingInput').addEventListener('input', (e) => {
      renderExistingList(e.target.value);
    });

    // Helper: Add existing sponsor to rail and persist to MongoDB
    const handleAddExistingSponsor = async (sponsorToAdd, btnElement) => {
      if (!currentData.rail.items) currentData.rail.items = [];

      // Duplicate protection: ensure not already in rail
      const alreadyExists = currentData.rail.items.some(
        (r) =>
          (r.id && (String(r.id) === String(sponsorToAdd.id) || String(r.id) === String(sponsorToAdd._id))) ||
          (r.name && r.name.trim().toLowerCase() === (sponsorToAdd.name || sponsorToAdd.companyName || '').trim().toLowerCase())
      );

      if (alreadyExists) {
        toast(`"${sponsorToAdd.name || sponsorToAdd.companyName}" is already in the rail.`, 'warn');
        if (btnElement) {
          btnElement.disabled = false;
          btnElement.innerHTML = '<i class="fas fa-plus"></i> Add to Rail';
        }
        return;
      }

      const newRailItem = {
        id: sponsorToAdd.id || sponsorToAdd._id || `sp-${Date.now()}`,
        name: (sponsorToAdd.name || sponsorToAdd.companyName || '').trim(),
        tier: sponsorToAdd.tier || 'Gold',
        order: (currentData.rail.items.length || 0) + 1,
        logoUrl: (sponsorToAdd.logoUrl || sponsorToAdd.companyLogoUrl || '').trim(),
        altText: (sponsorToAdd.name || sponsorToAdd.companyName || 'Sponsor').trim(),
        websiteUrl: (sponsorToAdd.websiteUrl || sponsorToAdd.website || '').trim(),
        icon: sponsorToAdd.icon || 'fas fa-bolt',
        visible: true,
      };

      currentData.rail.items.push(newRailItem);
      markDirty();

      try {
        const payload = {
          settings: currentData.settings,
          rail: currentData.rail,
          hero: currentData.hero,
          tiersSection: currentData.tiersSection,
          enquirySection: currentData.enquirySection,
        };

        const res = await API().patch('/admin/sponsors/page', payload);
        if (!res || !res.success) {
          throw new Error(res?.message || 'Failed to update sponsor rail in MongoDB.');
        }

        currentData.status = res.data.status;
        currentData.lastEditedAt = res.data.lastEditedAt;

        toast(`Sponsor "${newRailItem.name}" added to rail without duplicates!`);
        close();
        renderInterface(document.getElementById('adminContent'));
      } catch (err) {
        console.error('Error adding sponsor to rail:', err);
        // Rollback item from in-memory array on failure
        currentData.rail.items = currentData.rail.items.filter((it) => it !== newRailItem);
        toast('Failed to add sponsor: ' + err.message, 'error');
        if (btnElement) {
          btnElement.disabled = false;
          btnElement.innerHTML = '<i class="fas fa-plus"></i> Add to Rail';
        }
      }
    };

    // Tab 2: Create new sponsor submit handler
    overlay.querySelector('#createSponsorForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = overlay.querySelector('#submitCreateNewBtn');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
      }

      const name = overlay.querySelector('#cNewName').value.trim();
      if (!name) {
        toast('Sponsor Name is required.', 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Rail & Save';
        }
        return;
      }

      if (!currentData.rail.items) currentData.rail.items = [];

      // Duplicate protection
      const isDuplicate = currentData.rail.items.some(
        (it) => it.name && it.name.trim().toLowerCase() === name.toLowerCase()
      );
      if (isDuplicate) {
        toast(`A sponsor named "${name}" is already in the rail.`, 'warn');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Rail & Save';
        }
        return;
      }

      const newSponsor = {
        id: `sp-${Date.now()}`,
        name,
        tier: overlay.querySelector('#cNewTier').value,
        order: Number(overlay.querySelector('#cNewOrder').value) || (currentData.rail.items.length + 1),
        logoUrl: overlay.querySelector('#cNewLogoUrl').value.trim(),
        altText: overlay.querySelector('#cNewAlt').value.trim() || name,
        websiteUrl: overlay.querySelector('#cNewWebsite').value.trim(),
        icon: overlay.querySelector('#cNewIcon').value.trim() || 'fas fa-bolt',
        visible: overlay.querySelector('#cNewVisible').checked,
      };

      currentData.rail.items.push(newSponsor);
      markDirty();

      try {
        const payload = {
          settings: currentData.settings,
          rail: currentData.rail,
          hero: currentData.hero,
          tiersSection: currentData.tiersSection,
          enquirySection: currentData.enquirySection,
        };

        const res = await API().patch('/admin/sponsors/page', payload);
        if (!res || !res.success) {
          throw new Error(res?.message || 'Failed to save new sponsor in MongoDB.');
        }

        currentData.status = res.data.status;
        currentData.lastEditedAt = res.data.lastEditedAt;

        toast(`Sponsor "${newSponsor.name}" created and added to rail!`);
        close();
        renderInterface(document.getElementById('adminContent'));
      } catch (err) {
        console.error('Error creating sponsor:', err);
        currentData.rail.items = currentData.rail.items.filter((it) => it !== newSponsor);
        toast('Error saving sponsor: ' + err.message, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add to Rail & Save';
        }
      }
    });

    // Start loading existing sponsors
    await loadExistingSponsors();
  }

  /**
   * EDIT SPONSOR: Opens edit form pre-populated with sponsor data.
   * Persists changes to MongoDB and reloads interface.
   */
  function openEditSponsorModal(sponsorIdOrIndex) {
    const items = currentData?.rail?.items || [];
    let sponsor = null;
    let itemIdx = -1;

    if (typeof sponsorIdOrIndex === 'number') {
      itemIdx = sponsorIdOrIndex;
      sponsor = items[itemIdx];
    } else if (sponsorIdOrIndex !== null && sponsorIdOrIndex !== undefined && sponsorIdOrIndex !== '') {
      itemIdx = items.findIndex(
        (s) => String(s.id) === String(sponsorIdOrIndex) || String(s._id) === String(sponsorIdOrIndex)
      );
      if (itemIdx !== -1) {
        sponsor = items[itemIdx];
      } else if (!isNaN(Number(sponsorIdOrIndex)) && items[Number(sponsorIdOrIndex)]) {
        itemIdx = Number(sponsorIdOrIndex);
        sponsor = items[itemIdx];
      }
    }

    if (!sponsor) {
      toast('Sponsor not found in rail.', 'error');
      return;
    }

    const sponsorId = sponsor.id || sponsor._id || `sp-${itemIdx + 1}`;
    console.log('[Sponsor Edit] Opening form for ID:', sponsorId, 'Name:', sponsor.name);

    const sponsorData = {
      id: sponsorId,
      name: sponsor.name || '',
      tier: sponsor.tier || 'Gold',
      logoUrl: sponsor.logoUrl || '',
      altText: sponsor.altText || '',
      websiteUrl: sponsor.websiteUrl || '',
      icon: sponsor.icon || 'fas fa-bolt',
      order: sponsor.order !== undefined ? sponsor.order : (itemIdx + 1),
      visible: sponsor.visible !== false,
    };

    const modalId = 'sponsorEditModal';
    const old = document.getElementById(modalId);
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.className = 'ar-cms-modal-overlay ar-open';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.zIndex = '999999';
    overlay.style.background = 'rgba(8, 8, 12, 0.85)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.webkitBackdropFilter = 'blur(8px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';
    overlay.style.overflowY = 'auto';
    overlay.style.boxSizing = 'border-box';

    overlay.innerHTML = `
      <div class="ar-cms-modal" style="max-width:540px; width:100%; max-height:90vh; overflow-y:auto; background:#141419; border:1px solid #282832; border-radius:12px; color:#F5F5F5; box-shadow:0 30px 90px rgba(0,0,0,0.85);">
        <div class="ar-cms-modal-header" style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #282832; padding:18px 20px; background:#181820; border-top-left-radius:12px; border-top-right-radius:12px;">
          <h3 style="margin:0; font-size:1.1rem; color:#FFF; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-pen-to-square" style="color:#F25912;"></i> Edit Sponsor: ${escapeHtml(sponsorData.name || sponsorId)}
          </h3>
          <button type="button" class="btn btn-secondary btn-sm" id="closeSponsorModalBtn"><i class="fas fa-times"></i></button>
        </div>

        <form id="sponsorModalForm" style="padding:20px;">
          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label">Sponsor / Company Name *</label>
            <input type="text" class="form-input" id="mSponsorName" value="${escapeHtml(sponsorData.name)}" required placeholder="e.g. Carbonext, MATLAB, ANSYS">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
            <div>
              <label class="form-label">Sponsorship Tier</label>
              <select class="form-select" id="mSponsorTier">
                <option value="Title" ${sponsorData.tier === 'Title' ? 'selected' : ''}>Title Sponsor</option>
                <option value="Platinum" ${sponsorData.tier === 'Platinum' ? 'selected' : ''}>Platinum Tier</option>
                <option value="Gold" ${sponsorData.tier === 'Gold' ? 'selected' : ''}>Gold Tier</option>
                <option value="Silver" ${sponsorData.tier === 'Silver' ? 'selected' : ''}>Silver Tier</option>
                <option value="Bronze" ${sponsorData.tier === 'Bronze' ? 'selected' : ''}>Bronze Tier</option>
                <option value="Equipment Partner" ${sponsorData.tier === 'Equipment Partner' ? 'selected' : ''}>Equipment Partner</option>
                <option value="Associate" ${sponsorData.tier === 'Associate' ? 'selected' : ''}>Associate Partner</option>
              </select>
            </div>
            <div>
              <label class="form-label">Display Order</label>
              <input type="number" class="form-input" id="mSponsorOrder" value="${sponsorData.order}">
            </div>
          </div>

          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label">Sponsor Logo Image</label>
            <div style="display:flex; gap:8px;">
              <input type="text" class="form-input" id="mSponsorLogoUrl" value="${escapeHtml(sponsorData.logoUrl)}" placeholder="https://res.cloudinary.com/...">
              <button type="button" class="btn btn-secondary btn-sm" id="mPickLogoBtn">
                <i class="fas fa-folder-open"></i> Pick Logo
              </button>
            </div>
            <div id="mLogoPreviewBox" style="margin-top:8px; width:120px; height:50px; background:#0B0B0E; border:1px solid #282832; border-radius:4px; display:flex; align-items:center; justify-content:center; overflow:hidden;">
              ${sponsorData.logoUrl ? `<img src="${escapeHtml(sponsorData.logoUrl)}" style="max-height:40px; max-width:110px; object-fit:contain;">` : `<i class="${escapeHtml(sponsorData.icon || 'fas fa-bolt')}" style="color:#F25912;"></i>`}
            </div>
          </div>

          <div class="form-group" style="margin-bottom:14px;">
            <label class="form-label">Website URL</label>
            <input type="text" class="form-input" id="mSponsorWebsite" value="${escapeHtml(sponsorData.websiteUrl)}" placeholder="https://company.com">
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
            <div>
              <label class="form-label">Fallback FontAwesome Icon</label>
              <input type="text" class="form-input" id="mSponsorIcon" value="${escapeHtml(sponsorData.icon || 'fas fa-bolt')}" placeholder="fas fa-bolt">
            </div>
            <div>
              <label class="form-label">Logo Alt Text</label>
              <input type="text" class="form-input" id="mSponsorAlt" value="${escapeHtml(sponsorData.altText)}" placeholder="Company logo">
            </div>
          </div>

          <div style="margin-bottom:18px;">
            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer;">
              <input type="checkbox" id="mSponsorVisible" ${sponsorData.visible ? 'checked' : ''}>
              <span>Show in Marquee Rail</span>
            </label>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #282832; padding-top:14px;">
            <button type="button" class="btn btn-secondary btn-sm" id="cancelSponsorModalBtn">Cancel</button>
            <button type="submit" class="btn btn-secondary btn-sm" id="mSponsorSaveDraftBtn">
              <i class="fas fa-save"></i> Save Changes
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="mSponsorSavePublishBtn" style="background:#F25912; border-color:#F25912;">
              <i class="fas fa-paper-plane"></i> Save & Publish Live
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
      if (!window.MediaPicker) {
        toast('Media Library picker is not initialized.', 'warn');
        return;
      }
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

    const handleSave = async (publishNow = false) => {
      const submitBtn = publishNow
        ? overlay.querySelector('#mSponsorSavePublishBtn')
        : overlay.querySelector('#mSponsorSaveDraftBtn');

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${publishNow ? 'Publishing...' : 'Saving...'}`;
      }

      const updatedSponsor = {
        id: sponsorData.id,
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
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = publishNow
            ? '<i class="fas fa-paper-plane"></i> Save & Publish Live'
            : '<i class="fas fa-save"></i> Save Changes';
        }
        return;
      }

      if (!currentData.rail.items) currentData.rail.items = [];

      const targetIdx = currentData.rail.items.findIndex(
        (s) => String(s.id) === String(updatedSponsor.id) || String(s._id) === String(updatedSponsor.id)
      );

      if (targetIdx !== -1) {
        currentData.rail.items[targetIdx] = updatedSponsor;
      } else {
        currentData.rail.items.push(updatedSponsor);
      }

      try {
        const payload = {
          settings: currentData.settings,
          rail: currentData.rail,
          hero: currentData.hero,
          tiersSection: currentData.tiersSection,
          enquirySection: currentData.enquirySection,
          publishNow: publishNow,
        };

        const res = await API().patch('/admin/sponsors/page', payload);
        if (!res || !res.success) {
          throw new Error(res?.message || 'Failed to update sponsor in MongoDB.');
        }

        currentData.status = res.data.status;
        currentData.lastEditedAt = res.data.lastEditedAt;

        if (publishNow) {
          currentData.lastPublishedAt = res.data.lastPublishedAt;
          toast(`Sponsor "${updatedSponsor.name}" saved & published live!`);
        } else {
          toast(`Sponsor "${updatedSponsor.name}" saved successfully.`);
        }

        close();
        renderInterface(document.getElementById('adminContent'));
      } catch (err) {
        console.error('Error saving sponsor:', err);
        toast('Error saving sponsor: ' + err.message, 'error');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = publishNow
            ? '<i class="fas fa-paper-plane"></i> Save & Publish Live'
            : '<i class="fas fa-save"></i> Save Changes';
        }
      }
    };

    overlay.querySelector('#sponsorModalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      handleSave(false);
    });

    overlay.querySelector('#mSponsorSavePublishBtn')?.addEventListener('click', () => {
      handleSave(true);
    });
  }

  /**
   * REPLACE SPONSOR LOGO:
   * Opens MediaPicker, updates the sponsor's logo URL, and immediately persists to MongoDB.
   */
  async function replaceSponsorLogo(sponsorIdOrIndex) {
    const items = currentData?.rail?.items || [];
    const sponsor = typeof sponsorIdOrIndex === 'number'
      ? items[sponsorIdOrIndex]
      : items.find((s) => String(s.id) === String(sponsorIdOrIndex) || String(s._id) === String(sponsorIdOrIndex));

    if (!sponsor) {
      toast('Sponsor not found.', 'error');
      return;
    }

    const persistLogoUpdate = async (newUrl) => {
      if (!newUrl || !newUrl.trim()) return;
      sponsor.logoUrl = newUrl.trim();
      markDirty();

      try {
        const payload = {
          settings: currentData.settings,
          rail: currentData.rail,
          hero: currentData.hero,
          tiersSection: currentData.tiersSection,
          enquirySection: currentData.enquirySection,
        };

        const res = await API().patch('/admin/sponsors/page', payload);
        if (!res || !res.success) {
          throw new Error(res?.message || 'Failed to persist logo in MongoDB.');
        }

        currentData.status = res.data.status;
        currentData.lastEditedAt = res.data.lastEditedAt;
        renderInterface(document.getElementById('adminContent'));
        toast(`Logo replaced and saved for "${sponsor.name}".`);
      } catch (err) {
        console.error('Error saving replaced logo:', err);
        toast('Error saving logo: ' + err.message, 'error');
      }
    };

    if (window.MediaPicker) {
      window.MediaPicker.open({
        allowedType: 'image',
        onSelect: async (asset) => {
          if (asset && asset.url) {
            await persistLogoUpdate(asset.url);
          }
        },
      });
    } else {
      const fallbackUrl = prompt(`Enter image URL to replace logo for "${sponsor.name}":`, sponsor.logoUrl || '');
      if (fallbackUrl && fallbackUrl.trim()) {
        await persistLogoUpdate(fallbackUrl.trim());
      }
    }
  }

  function toggleSponsorVisibility(sponsorIdOrIndex, isVisible) {
    const items = currentData?.rail?.items || [];
    const sponsor = typeof sponsorIdOrIndex === 'number'
      ? items[sponsorIdOrIndex]
      : items.find((s) => String(s.id) === String(sponsorIdOrIndex) || String(s._id) === String(sponsorIdOrIndex));

    if (sponsor) {
      sponsor.visible = isVisible;
      markDirty();
    }
  }

  function moveSponsor(sponsorIdOrIndex, direction) {
    const items = currentData?.rail?.items;
    if (!items) return;

    const index = typeof sponsorIdOrIndex === 'number'
      ? sponsorIdOrIndex
      : items.findIndex((s) => String(s.id) === String(sponsorIdOrIndex) || String(s._id) === String(sponsorIdOrIndex));

    if (index === -1) return;
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

  function deleteSponsor(sponsorIdOrIndex) {
    const items = currentData?.rail?.items || [];
    const idx = typeof sponsorIdOrIndex === 'number'
      ? sponsorIdOrIndex
      : items.findIndex((s) => String(s.id) === String(sponsorIdOrIndex) || String(s._id) === String(sponsorIdOrIndex));

    if (idx === -1) return;
    const item = items[idx];
    if (!confirm(`Are you sure you want to remove "${item.name}" from the Sponsor Rail?`)) return;

    items.splice(idx, 1);
    items.forEach((it, i) => { it.order = i + 1; });
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
