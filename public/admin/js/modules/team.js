/* ============================================================
   team.js — Unified Team Page Control Center Module
   Ashwa Riders CMS — Formula Student Electric Team
   Controls:
     01 HERO & Media
     02 TEAM MEMBERS & Controlled Department Filters
     03 JOIN TEAM / CTA
     04 GLOBAL FOOTER (Reference)
     05 PAGE SETTINGS & SEO
   Draft / Preview / Publish lifecycle + Media Library + Cross-page sync.
============================================================ */

(function () {
  'use strict';

  let currentData = null;
  let currentMembers = [];
  let footerSummary = {};
  let collapsedSections = {
    hero: false,
    members: false,
    cta: false,
    footer: true,
    settings: true,
  };

  let filterState = {
    query: '',
    department: 'all',
    role: 'all',
    status: 'all',
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
  async function renderTeamModule(container) {
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:360px; color:#9696A0;">
        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-right:12px; color:#FF5A00;"></i>
        <span style="font-family:monospace; font-size:0.95rem;">Loading Ashwa Team Page Control Center...</span>
      </div>
    `;

    await loadTeamData(container);
  }

  async function loadTeamData(container) {
    try {
      const res = await API().get('/admin/team/page');
      if (res && res.success && res.data) {
        currentData = res.data.page;
        currentMembers = res.data.members || [];
        footerSummary = res.data.footerSummary || {};

        normalizeTeamData();
        renderInterface(container);
      } else {
        throw new Error(res?.message || 'Failed to load Team page data.');
      }
    } catch (err) {
      console.error('Error loading Team CMS data:', err);
      container.innerHTML = `
        <div style="background:#141419; border:1px solid #FF4D4D; border-radius:12px; padding:40px; text-align:center; max-width:600px; margin:40px auto;">
          <i class="fas fa-triangle-exclamation" style="font-size:2.5rem; color:#FF4D4D; margin-bottom:16px;"></i>
          <h2 style="font-size:1.25rem; font-weight:800; color:#FFFFFF; margin-bottom:8px;">Unable to Load Team Control Center</h2>
          <p style="color:#9696A0; font-size:0.9rem; margin-bottom:24px;">${escapeHtml(err.message)}</p>
          <button type="button" class="btn btn-primary" id="retryTeamLoadBtn" style="background:#FF5A00; border-color:#FF5A00;">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
      document.getElementById('retryTeamLoadBtn')?.addEventListener('click', () => loadTeamData(container));
    }
  }

  function normalizeTeamData() {
    if (!currentData) return;

    // Use draftVersion if currently editing draft
    const src = currentData.draftVersion || currentData;
    currentData.settings = src.settings || currentData.settings || {};
    currentData.hero = src.hero || currentData.hero || {};
    currentData.membersSection = src.membersSection || currentData.membersSection || {};
    currentData.filters = Array.isArray(src.filters) ? src.filters : (currentData.filters || []);
    currentData.cta = src.cta || currentData.cta || {};

    if (currentData.filters.length === 0) {
      currentData.filters = [
        { id: 'leadership', name: 'Leadership', slug: 'leadership', description: 'Team captains and technical leads', order: 1, visible: true },
        { id: 'mechanical', name: 'Mechanical', slug: 'mechanical', description: 'Chassis, suspension, aerodynamics and manufacturing', order: 2, visible: true },
        { id: 'electrical', name: 'Electrical', slug: 'electrical', description: 'Tractive system, battery pack, electronics and telemetry', order: 3, visible: true },
        { id: 'management', name: 'Management', slug: 'management', description: 'Operations, logistics, marketing and media', order: 4, visible: true },
      ];
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

    let html = `
      <!-- Control Center Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px; background:#141419; padding:22px 26px; border-radius:12px; border:1px solid #282832;">
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
            <h1 style="font-size:1.5rem; font-weight:800; color:#F5F5F5; margin:0; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px;">
              <i class="fas fa-users-gear" style="color:#FF5A00;"></i> TEAM PAGE CONTROL CENTER
            </h1>
            <span class="badge ${statusClass}" id="teamStatusBadge" style="padding:4px 10px; font-size:0.72rem; letter-spacing:0.05em;">${statusText}</span>
          </div>
          <p style="font-size:0.85rem; color:#9696A0; margin:0;">
            Manage the Team page, members, departments, recruitment CTA and public-facing content.
          </p>
          <div style="display:flex; gap:18px; margin-top:8px; font-size:0.75rem; color:#6B7280; font-family:monospace;">
            <span><i class="fas fa-check-circle" style="color:#00AFA5;"></i> Last Published: <strong style="color:#9FA7A6;">${lastPub}</strong></span>
            <span><i class="fas fa-clock" style="color:#FF5A00;"></i> Last Edited: <strong style="color:#9FA7A6;">${lastEdit}</strong></span>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <a href="/team.html?preview=true" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); color:#fff; border:1px solid #282832;">
            <i class="fas fa-eye"></i> Preview Website
          </a>
          <button type="button" class="btn btn-secondary btn-sm" id="teamSaveDraftBtn" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-save"></i> Save Draft
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="teamPublishBtn" style="display:inline-flex; align-items:center; gap:6px; background:#FF5A00; border-color:#FF5A00;">
            <i class="fas fa-paper-plane"></i> Publish Live
          </button>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- 01 TEAM HERO ACCORDION                              -->
      <!-- ════════════════════════════════════════════════════ -->
      <div class="admin-panel" style="margin-bottom:20px; background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:rgba(255,255,255,0.02);" onclick="window.AdminTeamModule.toggleSection('hero')">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:800; color:#FF5A00; font-size:1rem;">01</span>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem; letter-spacing:0.02em;">TEAM HERO</span>
              <span style="font-size:0.75rem; color:#9696A0;">Team introduction, headline, background media, layout & animation</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="badge ${currentData.hero?.visible !== false ? 'badge-success' : 'badge-secondary'}" style="font-size:0.7rem;">
              ${currentData.hero?.visible !== false ? 'VISIBLE' : 'HIDDEN'}
            </span>
            <i class="fas fa-chevron-${collapsedSections['hero'] ? 'down' : 'up'}" style="color:#9696A0;"></i>
          </div>
        </div>

        <div id="section-body-hero" style="display:${collapsedSections['hero'] ? 'none' : 'block'}; padding:24px; border-top:1px solid #282832;">
          <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#F5F5F5; font-size:0.85rem;">
              <input type="checkbox" id="hero_visible" ${currentData.hero?.visible !== false ? 'checked' : ''} onchange="window.AdminTeamModule.updateHeroField('visible', this.checked)">
              <span>Show Hero Section</span>
            </label>
          </div>

          <!-- Hero Content -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
            <div style="grid-column:1 / -1;">
              <label class="form-label">Eyebrow</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.eyebrow || '')}" onchange="window.AdminTeamModule.updateHeroField('eyebrow', this.value)" placeholder="e.g. FORMULA BHARAT — 2026 SEASON">
            </div>
            <div>
              <label class="form-label">Heading Line 1</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.headingLine1 || '')}" onchange="window.AdminTeamModule.updateHeroField('headingLine1', this.value)" placeholder="e.g. THE">
            </div>
            <div>
              <label class="form-label">Heading Highlight (Orange Text)</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.headingHighlight || '')}" onchange="window.AdminTeamModule.updateHeroField('headingHighlight', this.value)" placeholder="e.g. DRIVING FORCE">
            </div>
            <div style="grid-column:1 / -1;">
              <label class="form-label">Heading Line 2</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.headingLine2 || '')}" onchange="window.AdminTeamModule.updateHeroField('headingLine2', this.value)" placeholder="e.g. BEHIND ASHWA RIDERS">
            </div>
            <div style="grid-column:1 / -1;">
              <label class="form-label">Hero Description</label>
              <textarea class="form-input" rows="3" onchange="window.AdminTeamModule.updateHeroField('description', this.value)" placeholder="Enter hero description...">${escapeHtml(currentData.hero?.description || '')}</textarea>
            </div>
          </div>

          <!-- Hero Media -->
          <h4 style="color:#FF5A00; font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; margin:20px 0 12px 0; font-family:monospace;">
            <i class="fas fa-image"></i> Hero Media
          </h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
            <div>
              <label class="form-label">Desktop Background Image</label>
              <div style="display:flex; gap:8px;">
                <input type="text" class="form-input" id="hero_desktop_img" value="${escapeHtml(currentData.hero?.desktopImageUrl || '')}" onchange="window.AdminTeamModule.updateHeroField('desktopImageUrl', this.value)" placeholder="https://res.cloudinary.com/...">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminTeamModule.pickMedia('hero.desktopImageUrl', 'hero_desktop_img')">
                  <i class="fas fa-folder-open"></i> Choose
                </button>
              </div>
              ${currentData.hero?.desktopImageUrl ? `<div style="margin-top:8px; border:1px solid #282832; border-radius:6px; overflow:hidden; max-width:240px; height:100px;"><img src="${escapeHtml(currentData.hero.desktopImageUrl)}" style="width:100%; height:100%; object-fit:cover;"></div>` : ''}
            </div>
            <div>
              <label class="form-label">Mobile Background Image (Optional)</label>
              <div style="display:flex; gap:8px;">
                <input type="text" class="form-input" id="hero_mobile_img" value="${escapeHtml(currentData.hero?.mobileImageUrl || '')}" onchange="window.AdminTeamModule.updateHeroField('mobileImageUrl', this.value)" placeholder="https://res.cloudinary.com/...">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminTeamModule.pickMedia('hero.mobileImageUrl', 'hero_mobile_img')">
                  <i class="fas fa-folder-open"></i> Choose
                </button>
              </div>
            </div>
            <div>
              <label class="form-label">Optional Background Video URL</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.videoUrl || '')}" onchange="window.AdminTeamModule.updateHeroField('videoUrl', this.value)" placeholder="Direct .mp4 video URL">
            </div>
            <div>
              <label class="form-label">Image / Video Alt Text</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.altText || '')}" onchange="window.AdminTeamModule.updateHeroField('altText', this.value)">
            </div>
          </div>

          <!-- Hero Layout & Animation -->
          <h4 style="color:#FF5A00; font-size:0.85rem; text-transform:uppercase; letter-spacing:0.05em; margin:20px 0 12px 0; font-family:monospace;">
            <i class="fas fa-sliders"></i> Layout & Animation
          </h4>
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px;">
            <div>
              <label class="form-label">Text Alignment</label>
              <select class="form-select" onchange="window.AdminTeamModule.updateHeroField('textAlignment', this.value)">
                <option value="left" ${currentData.hero?.textAlignment === 'left' ? 'selected' : ''}>Left Aligned</option>
                <option value="center" ${currentData.hero?.textAlignment === 'center' ? 'selected' : ''}>Center Aligned</option>
                <option value="right" ${currentData.hero?.textAlignment === 'right' ? 'selected' : ''}>Right Aligned</option>
              </select>
            </div>
            <div>
              <label class="form-label">Background Position</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.hero?.backgroundPosition || 'center 30%')}" onchange="window.AdminTeamModule.updateHeroField('backgroundPosition', this.value)">
            </div>
            <div>
              <label class="form-label">Overlay Strength (${currentData.hero?.overlayStrength || 70}%)</label>
              <input type="range" min="0" max="100" value="${currentData.hero?.overlayStrength || 70}" class="form-range" style="width:100%; accent-color:#FF5A00;" oninput="this.nextElementSibling.textContent=this.value+'%'; window.AdminTeamModule.updateHeroField('overlayStrength', Number(this.value))">
              <span style="font-size:0.75rem; color:#9696A0;">${currentData.hero?.overlayStrength || 70}%</span>
            </div>
            <div>
              <label class="form-label">Entrance Animation</label>
              <select class="form-select" onchange="window.AdminTeamModule.updateHeroField('entranceAnimation', this.value)">
                <option value="slide-up" ${currentData.hero?.entranceAnimation === 'slide-up' ? 'selected' : ''}>Slide Up</option>
                <option value="fade" ${currentData.hero?.entranceAnimation === 'fade' ? 'selected' : ''}>Fade</option>
                <option value="zoom-in" ${currentData.hero?.entranceAnimation === 'zoom-in' ? 'selected' : ''}>Zoom In</option>
                <option value="none" ${currentData.hero?.entranceAnimation === 'none' ? 'selected' : ''}>None</option>
              </select>
            </div>
            <div>
              <label class="form-label">Transition Duration (ms)</label>
              <input type="number" class="form-input" value="${currentData.hero?.transitionDuration || 800}" onchange="window.AdminTeamModule.updateHeroField('transitionDuration', Number(this.value))">
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- 02 TEAM MEMBERS & FILTERS ACCORDION                 -->
      <!-- ════════════════════════════════════════════════════ -->
      <div class="admin-panel" style="margin-bottom:20px; background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:rgba(255,255,255,0.02);" onclick="window.AdminTeamModule.toggleSection('members')">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:800; color:#FF5A00; font-size:1rem;">02</span>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem; letter-spacing:0.02em;">TEAM MEMBERS & FILTERS</span>
              <span style="font-size:0.75rem; color:#9696A0;">Manage member roster, academic info, bios, social links & dynamic department filters</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="badge badge-info" style="font-size:0.7rem;">${currentMembers.length} MEMBERS</span>
            <i class="fas fa-chevron-${collapsedSections['members'] ? 'down' : 'up'}" style="color:#9696A0;"></i>
          </div>
        </div>

        <div id="section-body-members" style="display:${collapsedSections['members'] ? 'none' : 'block'}; padding:24px; border-top:1px solid #282832;">
          
          <!-- Section Heading Configuration -->
          <div style="background:#181820; border:1px solid #282832; border-radius:8px; padding:16px; margin-bottom:20px;">
            <h4 style="color:#F5F5F5; font-size:0.85rem; font-weight:700; margin:0 0 12px 0; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-heading" style="color:#FF5A00;"></i> Public Section Heading
            </h4>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px;">
              <div>
                <label class="form-label">Eyebrow</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.membersSection?.eyebrow || 'FILTER')}" onchange="window.AdminTeamModule.updateMembersSectionField('eyebrow', this.value)">
              </div>
              <div>
                <label class="form-label">Heading Line</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.membersSection?.title || 'MEET THE')}" onchange="window.AdminTeamModule.updateMembersSectionField('title', this.value)">
              </div>
              <div>
                <label class="form-label">Heading Highlight</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.membersSection?.highlightText || 'RIDERS')}" onchange="window.AdminTeamModule.updateMembersSectionField('highlightText', this.value)">
              </div>
              <div style="grid-column:1 / -1;">
                <label class="form-label">Section Description / Subtitle</label>
                <input type="text" class="form-input" value="${escapeHtml(currentData.membersSection?.subtitle || 'Click a department to view specific teams.')}" onchange="window.AdminTeamModule.updateMembersSectionField('subtitle', this.value); window.AdminTeamModule.updateMembersSectionField('description', this.value)">
              </div>
            </div>
          </div>

          <!-- Dynamic Department Filters Management -->
          <div style="background:#181820; border:1px solid #282832; border-radius:8px; padding:16px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
              <div>
                <h4 style="color:#F5F5F5; font-size:0.85rem; font-weight:700; margin:0; text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:8px;">
                  <i class="fas fa-filter" style="color:#00AFA5;"></i> Department Filters
                </h4>
                <p style="font-size:0.75rem; color:#9696A0; margin:2px 0 0 0;">
                  Controlled filters displayed above the roster. "ALL" is system-generated.
                </p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminTeamModule.addFilter()">
                <i class="fas fa-plus"></i> Add Filter
              </button>
            </div>

            <div id="filterCardsContainer" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:12px;">
              ${renderFilterCardsHtml()}
            </div>
          </div>

          <!-- Member Roster Search & Action Toolbar -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
            <div style="display:flex; gap:10px; flex-wrap:wrap; flex:1; min-width:280px;">
              <!-- Search -->
              <div style="position:relative; flex:1; min-width:200px;">
                <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#6B7280; font-size:0.8rem;"></i>
                <input type="text" id="adminMemberSearchInput" class="form-input" placeholder="Search members by name, role, department, branch..." style="padding-left:34px;" oninput="window.AdminTeamModule.onSearchChange(this.value)">
              </div>

              <!-- Department Filter -->
              <select id="adminMemberDeptSelect" class="form-select" style="width:auto; min-width:140px;" onchange="window.AdminTeamModule.onFilterDeptChange(this.value)">
                <option value="all">All Departments</option>
                ${(currentData.filters || []).map(f => `<option value="${escapeHtml(f.slug)}">${escapeHtml(f.name)}</option>`).join('')}
              </select>

              <!-- Status Filter -->
              <select id="adminMemberStatusSelect" class="form-select" style="width:auto; min-width:120px;" onchange="window.AdminTeamModule.onFilterStatusChange(this.value)">
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <button type="button" class="btn btn-primary btn-sm" onclick="window.AdminTeamModule.openMemberEditor()" style="background:#FF5A00; border-color:#FF5A00; white-space:nowrap;">
              <i class="fas fa-plus"></i> Add Team Member
            </button>
          </div>

          <!-- Member Roster Grid -->
          <div id="adminMembersGrid">
            ${renderMembersRosterHtml()}
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- 03 JOIN TEAM / CTA ACCORDION                        -->
      <!-- ════════════════════════════════════════════════════ -->
      <div class="admin-panel" style="margin-bottom:20px; background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:rgba(255,255,255,0.02);" onclick="window.AdminTeamModule.toggleSection('cta')">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:800; color:#FF5A00; font-size:1rem;">03</span>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem; letter-spacing:0.02em;">JOIN TEAM / RECRUITMENT CTA</span>
              <span style="font-size:0.75rem; color:#9696A0;">Recruitment call-to-action, headline, button URL, background styling</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="badge ${currentData.cta?.visible !== false ? 'badge-success' : 'badge-secondary'}" style="font-size:0.7rem;">
              ${currentData.cta?.visible !== false ? 'VISIBLE' : 'HIDDEN'}
            </span>
            <i class="fas fa-chevron-${collapsedSections['cta'] ? 'down' : 'up'}" style="color:#9696A0;"></i>
          </div>
        </div>

        <div id="section-body-cta" style="display:${collapsedSections['cta'] ? 'none' : 'block'}; padding:24px; border-top:1px solid #282832;">
          <div style="display:flex; justify-content:flex-end; margin-bottom:16px;">
            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#F5F5F5; font-size:0.85rem;">
              <input type="checkbox" ${currentData.cta?.visible !== false ? 'checked' : ''} onchange="window.AdminTeamModule.updateCtaField('visible', this.checked)">
              <span>Show CTA Section</span>
            </label>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
            <div>
              <label class="form-label">Eyebrow</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.cta?.eyebrow || 'GET INVOLVED')}" onchange="window.AdminTeamModule.updateCtaField('eyebrow', this.value)">
            </div>
            <div>
              <label class="form-label">Heading</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.cta?.heading || 'BECOME A')}" onchange="window.AdminTeamModule.updateCtaField('heading', this.value)">
            </div>
            <div>
              <label class="form-label">Highlighted Heading (Gradient)</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.cta?.highlightedHeading || 'RIDER')}" onchange="window.AdminTeamModule.updateCtaField('highlightedHeading', this.value)">
            </div>
            <div>
              <label class="form-label">Button Label</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.cta?.buttonText || 'APPLY NOW')}" onchange="window.AdminTeamModule.updateCtaField('buttonText', this.value)">
            </div>
            <div style="grid-column:1 / -1;">
              <label class="form-label">CTA Description</label>
              <textarea class="form-input" rows="2" onchange="window.AdminTeamModule.updateCtaField('description', this.value)">${escapeHtml(currentData.cta?.description || '')}</textarea>
            </div>
            <div>
              <label class="form-label">Button Target URL</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.cta?.buttonUrl || 'index.html#recruitment')}" onchange="window.AdminTeamModule.updateCtaField('buttonUrl', this.value)">
            </div>
            <div>
              <label class="form-label">Button Icon (FontAwesome class)</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.cta?.buttonIcon || 'fas fa-user-plus')}" onchange="window.AdminTeamModule.updateCtaField('buttonIcon', this.value)">
            </div>
            <div>
              <label class="form-label">Background Color</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.cta?.backgroundColor || '#000000')}" onchange="window.AdminTeamModule.updateCtaField('backgroundColor', this.value)">
            </div>
            <div style="display:flex; align-items:center; gap:20px; padding-top:24px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#F5F5F5; font-size:0.85rem;">
                <input type="checkbox" ${currentData.cta?.gridEffect !== false ? 'checked' : ''} onchange="window.AdminTeamModule.updateCtaField('gridEffect', this.checked)">
                <span>Dark Grid Effect</span>
              </label>
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#F5F5F5; font-size:0.85rem;">
                <input type="checkbox" ${currentData.cta?.openInNewTab ? 'checked' : ''} onchange="window.AdminTeamModule.updateCtaField('openInNewTab', this.checked)">
                <span>Open in New Tab</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- 04 GLOBAL FOOTER (REFERENCE)                        -->
      <!-- ════════════════════════════════════════════════════ -->
      <div class="admin-panel" style="margin-bottom:20px; background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:rgba(255,255,255,0.02);" onclick="window.AdminTeamModule.toggleSection('footer')">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:800; color:#00AFA5; font-size:1rem;">04</span>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem; letter-spacing:0.02em;">FOOTER</span>
              <span style="font-size:0.75rem; color:#9696A0;">References the shared Global Footer configured across all pages</span>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <span class="badge badge-info" style="font-size:0.7rem;">GLOBAL COMPONENT</span>
            <i class="fas fa-chevron-${collapsedSections['footer'] ? 'down' : 'up'}" style="color:#9696A0;"></i>
          </div>
        </div>

        <div id="section-body-footer" style="display:${collapsedSections['footer'] ? 'none' : 'block'}; padding:24px; border-top:1px solid #282832;">
          <div style="background:#181820; border:1px solid #282832; border-radius:8px; padding:20px; margin-bottom:16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
              <div>
                <h4 style="color:#F5F5F5; font-size:0.9rem; margin:0 0 4px 0;">Current Global Footer Snapshot</h4>
                <p style="color:#9696A0; font-size:0.8rem; margin:0;">
                  Any updates made through the Navigation & Footer module automatically appear on Home, About, Team, Car, Gallery, and Sponsors pages.
                </p>
              </div>
              <a href="/admin/navigation" class="btn btn-secondary btn-sm" style="background:#20202B; color:#00AFA5; border-color:#00AFA5; white-space:nowrap;">
                <i class="fas fa-sliders"></i> Edit Global Footer
              </a>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px; font-size:0.85rem;">
              <div>
                <span style="color:#6B7280; font-family:monospace; display:block; margin-bottom:4px;">SLOGAN</span>
                <span style="color:#E5E7EB;">${escapeHtml(footerSummary.slogan || 'Building Central India’s first Formula Student Electric race car.')}</span>
              </div>
              <div>
                <span style="color:#6B7280; font-family:monospace; display:block; margin-bottom:4px;">COPYRIGHT</span>
                <span style="color:#E5E7EB;">${escapeHtml(footerSummary.copyrightText || '© 2026 Ashwa Riders. All rights reserved.')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ════════════════════════════════════════════════════ -->
      <!-- PAGE SETTINGS & SEO ACCORDION                       -->
      <!-- ════════════════════════════════════════════════════ -->
      <div class="admin-panel" style="margin-bottom:20px; background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:rgba(255,255,255,0.02);" onclick="window.AdminTeamModule.toggleSection('settings')">
          <div style="display:flex; align-items:center; gap:12px;">
            <i class="fas fa-gear" style="color:#FF5A00;"></i>
            <div style="display:flex; flex-direction:column;">
              <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem; letter-spacing:0.02em;">PAGE SETTINGS & SEO</span>
              <span style="font-size:0.75rem; color:#9696A0;">Page Title, SEO Meta Title, Meta Description, OG Image & URL</span>
            </div>
          </div>
          <i class="fas fa-chevron-${collapsedSections['settings'] ? 'down' : 'up'}" style="color:#9696A0;"></i>
        </div>

        <div id="section-body-settings" style="display:${collapsedSections['settings'] ? 'none' : 'block'}; padding:24px; border-top:1px solid #282832;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
              <label class="form-label">Browser Page Title</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.settings?.pageTitle || '')}" onchange="window.AdminTeamModule.updateSettingsField('pageTitle', this.value)">
            </div>
            <div>
              <label class="form-label">SEO Meta Title</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.settings?.seoTitle || '')}" onchange="window.AdminTeamModule.updateSettingsField('seoTitle', this.value)">
            </div>
            <div style="grid-column:1 / -1;">
              <label class="form-label">SEO Meta Description</label>
              <textarea class="form-input" rows="2" onchange="window.AdminTeamModule.updateSettingsField('seoDescription', this.value)">${escapeHtml(currentData.settings?.seoDescription || '')}</textarea>
            </div>
            <div>
              <label class="form-label">OG Share Image URL</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.settings?.ogImageUrl || '')}" onchange="window.AdminTeamModule.updateSettingsField('ogImageUrl', this.value)">
            </div>
            <div>
              <label class="form-label">Canonical URL</label>
              <input type="text" class="form-input" value="${escapeHtml(currentData.settings?.canonicalUrl || 'team.html')}" onchange="window.AdminTeamModule.updateSettingsField('canonicalUrl', this.value)">
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    bindHeaderActions();
  }

  // ============================================================
  //  FILTER CARDS RENDERING
  // ============================================================
  function renderFilterCardsHtml() {
    const filters = currentData.filters || [];
    return filters.map((filter, index) => `
      <div style="background:#141419; border:1px solid #282832; border-radius:6px; padding:12px; position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <span style="font-weight:700; color:#F5F5F5; font-size:0.85rem;">${escapeHtml(filter.name)}</span>
          <div style="display:flex; align-items:center; gap:6px;">
            <label style="font-size:0.7rem; color:#9696A0; cursor:pointer;">
              <input type="checkbox" ${filter.visible !== false ? 'checked' : ''} onchange="window.AdminTeamModule.updateFilterProp(${index}, 'visible', this.checked)">
              Active
            </label>
            <button type="button" style="background:none; border:none; color:#EF4444; cursor:pointer; font-size:0.8rem; padding:2px;" onclick="window.AdminTeamModule.removeFilter(${index})" title="Delete Filter">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:0.75rem;">
          <div>
            <label class="form-label" style="font-size:0.7rem;">Name</label>
            <input type="text" class="form-input" style="font-size:0.78rem; padding:6px;" value="${escapeHtml(filter.name)}" onchange="window.AdminTeamModule.updateFilterProp(${index}, 'name', this.value); window.AdminTeamModule.updateFilterProp(${index}, 'slug', this.value.toLowerCase().replace(/[^a-z0-9]/g, ''))">
          </div>
          <div>
            <label class="form-label" style="font-size:0.7rem;">Slug</label>
            <input type="text" class="form-input" style="font-size:0.78rem; padding:6px;" value="${escapeHtml(filter.slug)}" onchange="window.AdminTeamModule.updateFilterProp(${index}, 'slug', this.value.toLowerCase().trim())">
          </div>
        </div>
      </div>
    `).join('');
  }

  // ============================================================
  //  MEMBER ROSTER RENDERING
  // ============================================================
  function renderMembersRosterHtml() {
    let list = [...currentMembers];

    // Apply client filters
    if (filterState.query) {
      const q = filterState.query.toLowerCase();
      list = list.filter(m => {
        const name = (m.fullName || `${m.firstName || ''} ${m.lastName || ''}`).toLowerCase();
        const pos = (m.position || '').toLowerCase();
        const dept = (m.department || '').toLowerCase();
        const branch = (m.academicBranch || '').toLowerCase();
        return name.includes(q) || pos.includes(q) || dept.includes(q) || branch.includes(q);
      });
    }

    if (filterState.department !== 'all') {
      const dept = filterState.department.toLowerCase();
      list = list.filter(m => (m.department || '').toLowerCase() === dept || (m.categories || []).includes(dept));
    }

    if (filterState.status !== 'all') {
      list = list.filter(m => (m.status || 'published') === filterState.status);
    }

    if (list.length === 0) {
      return `
        <div style="background:#181820; border:1px dashed #282832; border-radius:8px; padding:36px; text-align:center; color:#9696A0;">
          <i class="fas fa-users-slash" style="font-size:2rem; margin-bottom:12px; color:#6B7280;"></i>
          <p style="margin:0 0 8px 0; font-size:0.9rem;">No team members match the current filter.</p>
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminTeamModule.resetMemberFilters()">
            Clear Filters
          </button>
        </div>
      `;
    }

    return `
      <div style="display:flex; flex-direction:column; gap:10px;">
        ${list.map((m) => {
          const name = m.fullName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Untitled Member';
          const pos = m.position || 'Member';
          const dept = m.department || 'mechanical';
          const academic = [m.academicYear, m.academicBranch].filter(Boolean).join(' • ');
          const imgUrl = m.imageUrl || 'https://res.cloudinary.com/frjck4sc/image/upload/v1784469376/Team_Captain_jokdch.png';
          const isFeatured = Boolean(m.isFeatured);
          const isVis = m.isVisible !== false && m.status !== 'archived';

          return `
            <div style="background:#181820; border:1px solid #282832; border-radius:8px; padding:14px 18px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:14px; transition:border-color 0.2s;">
              <div style="display:flex; align-items:center; gap:16px;">
                <!-- Thumbnail -->
                <div style="width:48px; height:48px; border-radius:6px; overflow:hidden; background:#000; border:1px solid #282832; flex-shrink:0;">
                  <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(name)}" style="width:100%; height:100%; object-fit:cover;">
                </div>

                <!-- Info -->
                <div>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem;">${escapeHtml(name)}</span>
                    ${isFeatured ? '<span class="badge" style="background:rgba(255,90,0,0.2); color:#FF5A00; border:1px solid #FF5A00; font-size:0.65rem;"><i class="fas fa-star"></i> FEATURED</span>' : ''}
                    <span class="badge ${m.status === 'published' ? 'badge-success' : (m.status === 'draft' ? 'badge-warning' : 'badge-secondary')}" style="font-size:0.65rem;">
                      ${(m.status || 'published').toUpperCase()}
                    </span>
                    ${!isVis ? '<span class="badge badge-secondary" style="font-size:0.65rem;"><i class="fas fa-eye-slash"></i> HIDDEN</span>' : ''}
                  </div>
                  <div style="font-size:0.8rem; color:#00AFA5; font-family:monospace; margin-top:2px;">
                    ${escapeHtml(pos)} • <span style="text-transform:capitalize; color:#9696A0;">${escapeHtml(dept)}</span>
                  </div>
                  ${academic ? `<div style="font-size:0.75rem; color:#6B7280; margin-top:2px;">${escapeHtml(academic)}</div>` : ''}
                </div>
              </div>

              <!-- Actions -->
              <div style="display:flex; align-items:center; gap:8px;">
                <button type="button" class="btn btn-secondary btn-sm" style="padding:6px 10px; font-size:0.78rem;" onclick="window.AdminTeamModule.openMemberEditor('${m._id}')">
                  <i class="fas fa-edit"></i> Edit
                </button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:6px 10px; font-size:0.78rem;" onclick="window.AdminTeamModule.duplicateMember('${m._id}')" title="Duplicate Member">
                  <i class="fas fa-clone"></i>
                </button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:6px 10px; font-size:0.78rem; color:${isVis ? '#F59E0B' : '#00AFA5'};" onclick="window.AdminTeamModule.toggleMemberVisibility('${m._id}', ${!isVis})" title="${isVis ? 'Hide Member' : 'Show Member'}">
                  <i class="fas fa-${isVis ? 'eye-slash' : 'eye'}"></i>
                </button>
                <button type="button" class="btn btn-secondary btn-sm" style="padding:6px 10px; font-size:0.78rem; color:#EF4444;" onclick="window.AdminTeamModule.archiveMember('${m._id}')" title="Archive Member">
                  <i class="fas fa-archive"></i>
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  // ============================================================
  //  HEADER ACTIONS: SAVE DRAFT & PUBLISH LIVE
  // ============================================================
  function bindHeaderActions() {
    const saveBtn = document.getElementById('teamSaveDraftBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
          const payload = {
            settings: currentData.settings,
            hero: currentData.hero,
            membersSection: currentData.membersSection,
            filters: currentData.filters,
            cta: currentData.cta,
          };

          const res = await API().patch('/admin/team/page', payload);
          if (res && res.success) {
            toast('Team page draft saved successfully!');
            currentData.status = 'draft';
            currentData.lastEditedAt = new Date();
            updateStatusBadge('DRAFT CHANGES', 'badge-warning');
          } else {
            throw new Error(res?.message || 'Save failed.');
          }
        } catch (err) {
          toast('Save failed: ' + err.message, 'error');
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Draft';
        }
      });
    }

    const pubBtn = document.getElementById('teamPublishBtn');
    if (pubBtn) {
      pubBtn.addEventListener('click', async () => {
        pubBtn.disabled = true;
        pubBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';

        try {
          // Persist current state to draft before publishing
          const payload = {
            settings: currentData.settings,
            hero: currentData.hero,
            membersSection: currentData.membersSection,
            filters: currentData.filters,
            cta: currentData.cta,
          };
          await API().patch('/admin/team/page', payload);

          const res = await API().post('/admin/team/page/publish', {});
          if (res && res.success) {
            toast('Team page published LIVE to public website!');
            currentData.status = 'published';
            currentData.lastPublishedAt = new Date();
            updateStatusBadge('LIVE / PUBLISHED', 'badge-success');
            // Refresh members roster
            await refreshMembersList();
          } else {
            throw new Error(res?.message || 'Publishing failed.');
          }
        } catch (err) {
          toast('Publishing failed: ' + err.message, 'error');
        } finally {
          pubBtn.disabled = false;
          pubBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Publish Live';
        }
      });
    }
  }

  function updateStatusBadge(text, className) {
    const badge = document.getElementById('teamStatusBadge');
    if (badge) {
      badge.className = `badge ${className}`;
      badge.textContent = text;
    }
  }

  // ============================================================
  //  MEMBER DRAWER / MODAL EDITOR
  // ============================================================
  function openMemberEditor(memberId = null) {
    const existing = document.getElementById('arTeamMemberModal');
    if (existing) existing.remove();

    const member = memberId ? currentMembers.find(m => m._id === memberId) : null;
    const isEdit = Boolean(member);

    const overlay = document.createElement('div');
    overlay.id = 'arTeamMemberModal';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '999999';
    overlay.style.background = 'rgba(8, 8, 12, 0.85)';
    overlay.style.backdropFilter = 'blur(8px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.padding = '20px';

    const depts = (currentData.filters || []).map(f => f.slug);
    if (!depts.includes('leadership')) depts.push('leadership');
    if (!depts.includes('mechanical')) depts.push('mechanical');
    if (!depts.includes('electrical')) depts.push('electrical');
    if (!depts.includes('management')) depts.push('management');

    overlay.innerHTML = `
      <div style="max-width:680px; width:100%; max-height:90vh; overflow-y:auto; background:#141419; border:1px solid #282832; border-radius:12px; box-shadow:0 30px 90px rgba(0,0,0,0.85); display:flex; flex-direction:column;">
        
        <!-- Modal Header -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid #282832; background:#181820;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:34px; height:34px; border-radius:8px; background:rgba(255,90,0,0.15); color:#FF5A00; display:flex; align-items:center; justify-content:center; font-size:1rem;">
              <i class="fas fa-user-gear"></i>
            </div>
            <h3 style="font-size:1.15rem; font-weight:800; color:#F5F5F5; margin:0;">
              ${isEdit ? 'Edit Team Member' : 'Add Team Member'}
            </h3>
          </div>
          <button type="button" id="memberModalCloseBtn" style="background:none; border:none; color:#9696A0; cursor:pointer; font-size:1.2rem;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Form Body -->
        <form id="teamMemberForm" style="padding:24px; display:flex; flex-direction:column; gap:16px;">
          
          <!-- Identity Fields -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <label class="form-label">First Name</label>
              <input type="text" name="firstName" class="form-input" value="${escapeHtml(member?.firstName || '')}" placeholder="e.g. Aarav">
            </div>
            <div>
              <label class="form-label">Last Name</label>
              <input type="text" name="lastName" class="form-input" value="${escapeHtml(member?.lastName || '')}" placeholder="e.g. Sharma">
            </div>
            <div style="grid-column:1 / -1;">
              <label class="form-label">Display Name *</label>
              <input type="text" name="fullName" class="form-input" value="${escapeHtml(member?.fullName || member?.displayName || '')}" placeholder="e.g. Aarav Sharma" required>
            </div>
          </div>

          <!-- Role & Department -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <label class="form-label">Role / Position *</label>
              <input type="text" name="position" class="form-input" value="${escapeHtml(member?.position || '')}" placeholder="e.g. Vice Captain" required>
            </div>
            <div>
              <label class="form-label">Department *</label>
              <select name="department" class="form-select" required>
                ${depts.map(d => `<option value="${d}" ${(member?.department || 'mechanical').toLowerCase() === d ? 'selected' : ''}>${d.charAt(0).toUpperCase() + d.slice(1)}</option>`).join('')}
              </select>
            </div>
          </div>

          <!-- Academic Information -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <label class="form-label">Academic Year</label>
              <input type="text" name="academicYear" class="form-input" value="${escapeHtml(member?.academicYear || '')}" placeholder="e.g. 4th Year">
            </div>
            <div>
              <label class="form-label">Course / Branch</label>
              <input type="text" name="academicBranch" class="form-input" value="${escapeHtml(member?.academicBranch || '')}" placeholder="e.g. Mechanical Engineering">
            </div>
          </div>

          <!-- Profile Photo -->
          <div>
            <label class="form-label">Profile Image</label>
            <div style="display:flex; gap:8px;">
              <input type="text" name="imageUrl" id="member_img_url" class="form-input" value="${escapeHtml(member?.imageUrl || '')}" placeholder="https://res.cloudinary.com/...">
              <button type="button" class="btn btn-secondary btn-sm" id="chooseMemberMediaBtn">
                <i class="fas fa-folder-open"></i> Choose
              </button>
            </div>
            <div id="memberPhotoPreview" style="margin-top:8px; display:${member?.imageUrl ? 'block' : 'none'};">
              <img src="${escapeHtml(member?.imageUrl || '')}" id="memberPhotoPreviewImg" style="width:72px; height:72px; object-fit:cover; border-radius:6px; border:1px solid #282832;">
            </div>
          </div>

          <!-- Bio -->
          <div>
            <label class="form-label">Short Biography</label>
            <textarea name="description" class="form-input" rows="3" placeholder="Enter member description or responsibilities...">${escapeHtml(member?.description || member?.bio || '')}</textarea>
          </div>

          <!-- Social Links -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <label class="form-label"><i class="fab fa-linkedin" style="color:#0A66C2;"></i> LinkedIn URL</label>
              <input type="text" name="linkedin" class="form-input" value="${escapeHtml(member?.linkedin || '')}" placeholder="https://linkedin.com/in/...">
            </div>
            <div>
              <label class="form-label"><i class="fab fa-github"></i> GitHub URL</label>
              <input type="text" name="github" class="form-input" value="${escapeHtml(member?.github || '')}" placeholder="https://github.com/...">
            </div>
            <div>
              <label class="form-label"><i class="fab fa-instagram" style="color:#E1306C;"></i> Instagram URL</label>
              <input type="text" name="instagram" class="form-input" value="${escapeHtml(member?.instagram || '')}" placeholder="https://instagram.com/...">
            </div>
            <div>
              <label class="form-label">Display Order</label>
              <input type="number" name="order" class="form-input" value="${member?.order !== undefined ? member.order : (member?.displayOrder || 0)}">
            </div>
          </div>

          <!-- Flags -->
          <div style="display:flex; gap:24px; padding:12px 0; border-top:1px solid #282832;">
            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#F5F5F5; font-size:0.85rem;">
              <input type="checkbox" name="isFeatured" ${member?.isFeatured ? 'checked' : ''}>
              <span>Featured Member</span>
            </label>
            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#F5F5F5; font-size:0.85rem;">
              <input type="checkbox" name="isVisible" ${member?.isVisible !== false ? 'checked' : ''}>
              <span>Publicly Visible</span>
            </label>
          </div>

          <!-- Modal Footer -->
          <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:8px; border-top:1px solid #282832; padding-top:16px;">
            <button type="button" class="btn btn-secondary btn-sm" id="memberModalCancelBtn">Cancel</button>
            <button type="submit" class="btn btn-secondary btn-sm" id="memberModalSaveDraftBtn">
              <i class="fas fa-save"></i> Save Draft
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="memberModalSavePublishBtn" style="background:#FF5A00; border-color:#FF5A00;">
              <i class="fas fa-paper-plane"></i> Save & Publish
            </button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#memberModalCloseBtn').addEventListener('click', close);
    overlay.querySelector('#memberModalCancelBtn').addEventListener('click', close);

    // Media Picker button
    overlay.querySelector('#chooseMemberMediaBtn').addEventListener('click', () => {
      window.AdminTeamModule.pickMedia('member.imageUrl', 'member_img_url', (url) => {
        const preview = overlay.querySelector('#memberPhotoPreview');
        const img = overlay.querySelector('#memberPhotoPreviewImg');
        if (preview && img) {
          img.src = url;
          preview.style.display = 'block';
        }
      });
    });

    // Auto update Display Name if first/last typed
    const fnInput = overlay.querySelector('[name="firstName"]');
    const lnInput = overlay.querySelector('[name="lastName"]');
    const dnInput = overlay.querySelector('[name="fullName"]');

    const updateCombinedName = () => {
      if (!isEdit && !dnInput.dataset.manuallyEdited) {
        dnInput.value = `${fnInput.value.trim()} ${lnInput.value.trim()}`.trim();
      }
    };
    fnInput.addEventListener('input', updateCombinedName);
    lnInput.addEventListener('input', updateCombinedName);
    dnInput.addEventListener('input', () => { dnInput.dataset.manuallyEdited = 'true'; });

    // Handle form submission
    const form = overlay.querySelector('#teamMemberForm');
    const handleSave = async (publishNow = false) => {
      const formData = new FormData(form);
      const fullName = (formData.get('fullName') || '').trim();
      const position = (formData.get('position') || '').trim();
      const department = (formData.get('department') || 'mechanical').trim().toLowerCase();

      if (!fullName) {
        toast('Display Name is required.', 'error');
        return;
      }
      if (!position) {
        toast('Position / Role is required.', 'error');
        return;
      }

      // Social URL validation (must be https:// or # or empty)
      const validateHttps = (url, label) => {
        if (!url || url === '#' || url.trim() === '') return true;
        if (!url.startsWith('https://')) {
          toast(`${label} must start with https://`, 'error');
          return false;
        }
        return true;
      };

      const linkedin = (formData.get('linkedin') || '').trim();
      const github = (formData.get('github') || '').trim();
      const instagram = (formData.get('instagram') || '').trim();

      if (!validateHttps(linkedin, 'LinkedIn URL')) return;
      if (!validateHttps(github, 'GitHub URL')) return;
      if (!validateHttps(instagram, 'Instagram URL')) return;

      const payload = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        fullName,
        displayName: fullName,
        position,
        department,
        academicYear: formData.get('academicYear'),
        academicBranch: formData.get('academicBranch'),
        imageUrl: formData.get('imageUrl'),
        description: formData.get('description'),
        linkedin,
        github,
        instagram,
        order: Number(formData.get('order') || 0),
        isFeatured: form.querySelector('[name="isFeatured"]').checked,
        isVisible: form.querySelector('[name="isVisible"]').checked,
        publishNow,
        status: publishNow ? 'published' : 'draft',
      };

      try {
        let res;
        if (isEdit) {
          res = await API().patch(`/admin/team/members/${member._id}`, payload);
        } else {
          res = await API().post('/admin/team/members', payload);
        }

        if (res && res.success) {
          toast(publishNow ? 'Team member saved and published!' : 'Team member draft saved!');
          close();
          await refreshMembersList();
        } else {
          throw new Error(res?.message || 'Save failed.');
        }
      } catch (err) {
        toast('Error saving member: ' + err.message, 'error');
      }
    };

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSave(false);
    });

    overlay.querySelector('#memberModalSavePublishBtn').addEventListener('click', () => {
      handleSave(true);
    });
  }

  async function refreshMembersList() {
    try {
      const res = await API().get('/admin/team/members');
      if (res && res.success) {
        currentMembers = res.data || [];
        const grid = document.getElementById('adminMembersGrid');
        if (grid) grid.innerHTML = renderMembersRosterHtml();
      }
    } catch (e) {
      console.warn('Could not refresh member roster:', e.message);
    }
  }

  // ============================================================
  //  MEMBER ACTIONS: DUPLICATE, VISIBILITY, ARCHIVE
  // ============================================================
  async function duplicateMember(id) {
    try {
      const res = await API().post(`/admin/team/members/${id}/duplicate`, {});
      if (res && res.success) {
        toast('Team member duplicated!');
        await refreshMembersList();
      }
    } catch (err) {
      toast('Failed to duplicate member: ' + err.message, 'error');
    }
  }

  async function toggleMemberVisibility(id, newVis) {
    try {
      const res = await API().patch(`/admin/team/members/${id}`, { isVisible: newVis });
      if (res && res.success) {
        toast(newVis ? 'Member is now publicly visible.' : 'Member hidden from public page.');
        await refreshMembersList();
      }
    } catch (err) {
      toast('Failed to update visibility: ' + err.message, 'error');
    }
  }

  async function archiveMember(id) {
    if (!confirm('Are you sure you want to archive this team member?')) return;
    try {
      const res = await API().post(`/admin/team/members/${id}/archive`, {});
      if (res && res.success) {
        toast('Team member archived.');
        await refreshMembersList();
      }
    } catch (err) {
      toast('Failed to archive member: ' + err.message, 'error');
    }
  }

  // ============================================================
  //  FILTER MANAGEMENT
  // ============================================================
  function addFilter() {
    const name = prompt('Enter Department Filter Name (e.g. Powertrain):');
    if (!name || !name.trim()) return;

    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const currentFilters = currentData.filters || [];
    currentFilters.push({
      id: slug,
      name: name.trim(),
      slug,
      description: '',
      order: currentFilters.length + 1,
      visible: true,
    });

    currentData.filters = currentFilters;
    const container = document.getElementById('filterCardsContainer');
    if (container) container.innerHTML = renderFilterCardsHtml();
    toast('Department filter added. Click Save Draft to persist.');
  }

  function updateFilterProp(index, prop, value) {
    if (currentData.filters && currentData.filters[index]) {
      currentData.filters[index][prop] = value;
      markDraftChanged();
    }
  }

  function removeFilter(index) {
    if (currentData.filters && currentData.filters[index]) {
      currentData.filters.splice(index, 1);
      const container = document.getElementById('filterCardsContainer');
      if (container) container.innerHTML = renderFilterCardsHtml();
      markDraftChanged();
      toast('Filter removed.');
    }
  }

  // ============================================================
  //  FIELD UPDATE HELPERS
  // ============================================================
  function updateHeroField(field, value) {
    if (!currentData.hero) currentData.hero = {};
    currentData.hero[field] = value;
    markDraftChanged();
  }

  function updateMembersSectionField(field, value) {
    if (!currentData.membersSection) currentData.membersSection = {};
    currentData.membersSection[field] = value;
    markDraftChanged();
  }

  function updateCtaField(field, value) {
    if (!currentData.cta) currentData.cta = {};
    currentData.cta[field] = value;
    markDraftChanged();
  }

  function updateSettingsField(field, value) {
    if (!currentData.settings) currentData.settings = {};
    currentData.settings[field] = value;
    markDraftChanged();
  }

  function markDraftChanged() {
    currentData.status = 'draft';
    updateStatusBadge('DRAFT CHANGES', 'badge-warning');
  }

  function toggleSection(sectionKey) {
    collapsedSections[sectionKey] = !collapsedSections[sectionKey];
    const body = document.getElementById(`section-body-${sectionKey}`);
    if (body) {
      body.style.display = collapsedSections[sectionKey] ? 'none' : 'block';
    }
    const icon = body?.previousElementSibling?.querySelector('.fa-chevron-down, .fa-chevron-up');
    if (icon) {
      icon.className = `fas fa-chevron-${collapsedSections[sectionKey] ? 'down' : 'up'}`;
    }
  }

  // ============================================================
  //  SEARCH & CLIENT FILTER HANDLERS
  // ============================================================
  function onSearchChange(val) {
    filterState.query = val.trim();
    const grid = document.getElementById('adminMembersGrid');
    if (grid) grid.innerHTML = renderMembersRosterHtml();
  }

  function onFilterDeptChange(val) {
    filterState.department = val;
    const grid = document.getElementById('adminMembersGrid');
    if (grid) grid.innerHTML = renderMembersRosterHtml();
  }

  function onFilterStatusChange(val) {
    filterState.status = val;
    const grid = document.getElementById('adminMembersGrid');
    if (grid) grid.innerHTML = renderMembersRosterHtml();
  }

  function resetMemberFilters() {
    filterState = { query: '', department: 'all', role: 'all', status: 'all' };
    const searchInput = document.getElementById('adminMemberSearchInput');
    const deptSelect = document.getElementById('adminMemberDeptSelect');
    const statusSelect = document.getElementById('adminMemberStatusSelect');
    if (searchInput) searchInput.value = '';
    if (deptSelect) deptSelect.value = 'all';
    if (statusSelect) statusSelect.value = 'all';
    const grid = document.getElementById('adminMembersGrid');
    if (grid) grid.innerHTML = renderMembersRosterHtml();
  }

  // ============================================================
  //  MEDIA PICKER WRAPPER
  // ============================================================
  function pickMedia(targetField, inputId, callback) {
    if (window.AdminMediaPicker && typeof window.AdminMediaPicker.open === 'function') {
      window.AdminMediaPicker.open({
        onSelect: (asset) => {
          const url = asset.secureUrl || asset.url;
          const input = document.getElementById(inputId);
          if (input) {
            input.value = url;
            input.dispatchEvent(new Event('change'));
          }
          if (callback) callback(url);
        },
      });
    } else {
      // Fallback simple prompt
      const url = prompt('Enter or paste image URL:');
      if (url && url.trim()) {
        const input = document.getElementById(inputId);
        if (input) {
          input.value = url.trim();
          input.dispatchEvent(new Event('change'));
        }
        if (callback) callback(url.trim());
      }
    }
  }

  // ============================================================
  //  EXPORTS
  // ============================================================
  window.AdminTeamModule = {
    renderTeamModule,
    toggleSection,
    updateHeroField,
    updateMembersSectionField,
    updateCtaField,
    updateSettingsField,
    addFilter,
    updateFilterProp,
    removeFilter,
    openMemberEditor,
    duplicateMember,
    toggleMemberVisibility,
    archiveMember,
    onSearchChange,
    onFilterDeptChange,
    onFilterStatusChange,
    resetMemberFilters,
    pickMedia,
  };
})();
