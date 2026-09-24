/* ============================================================
   about.js — Unified About Page Control Center Management Module
   Manages all 14 About Page CMS Blocks:
     01 HERO (Slide & main introduction)
     02 WHO WE ARE (Introductory about content & image)
     03 OUR STORY (Founding history & story blocks)
     04 VISION & MISSION (Vision, Mission & dynamic bullet list)
     05 CORE VALUES (Dynamic values cards)
     06 TEAM STRUCTURE (Organizational hierarchy nodes)
     07 DEPARTMENTS (10 Team departments & responsibilities)
     08 OUR PROCESS (How we build a Formula car — 6 stages)
     09 FORMULA BHARAT (Competition info & event categories)
     10 WORKSHOP (Where it all comes together — visual gallery)
     11 FACULTY & PEOPLE (Faculty & leadership messages)
     12 WHY JOIN (Skills you will actually use)
     13 GET INVOLVED (Call to action & buttons)
     14 FOOTER (Global footer notice & settings)

   Single source of truth lifecycle:
   ADMIN ABOUT CMS -> SAVE DRAFT -> PUBLISH LIVE -> API -> FRONTEND
============================================================ */

window.AdminAboutModule = (function () {
  'use strict';

  let originalAboutData = null;
  let currentAboutData = null;
  let saveState = 'saved'; // 'saved' | 'saving' | 'dirty' | 'error'
  let collapsedSections = {}; // tracks collapse state by section key

  const API = () => window.AdminApi || window.API;
  const Toast = () => window.AdminToast || { success: console.log, error: console.error, info: console.log };

  const SECTION_DEFS = [
    { key: 'hero', num: '01', title: 'HERO SLIDE', icon: 'fas fa-heading', desc: 'Full-width hero media, headline, subtitle & CTA buttons' },
    { key: 'whoWeAre', num: '02', title: 'WHO WE ARE', icon: 'fas fa-shield-halved', desc: 'Introductory content, high-resolution media & paragraphs' },
    { key: 'story', num: '03', title: 'OUR STORY', icon: 'fas fa-book-open', desc: 'Founding history, milestones & dynamic story timeline' },
    { key: 'visionMission', num: '04', title: 'VISION & MISSION', icon: 'fas fa-bullseye', desc: 'Core vision, mission statement & bullet points' },
    { key: 'coreValues', num: '05', title: 'CORE VALUES', icon: 'fas fa-gem', desc: 'Dynamic core values cards with custom icons' },
    { key: 'teamStructure', num: '06', title: 'TEAM STRUCTURE', icon: 'fas fa-sitemap', desc: 'Organizational hierarchy & leadership nodes' },
    { key: 'departments', num: '07', title: 'DEPARTMENTS', icon: 'fas fa-layer-group', desc: 'Formula team departments & key responsibilities' },
    { key: 'process', num: '08', title: 'OUR PROCESS', icon: 'fas fa-sliders-h', desc: '6 build stages: Research, CAD, Sim, Mfg, Assembly' },
    { key: 'formulaBharat', num: '09', title: 'FORMULA BHARAT', icon: 'fas fa-flag-checkered', desc: 'Competition history & event category tags' },
    { key: 'workshop', num: '10', title: 'WORKSHOP', icon: 'fas fa-warehouse', desc: 'Facility gallery, lab descriptions & media cards' },
    { key: 'peopleMessages', num: '11', title: 'FACULTY & PEOPLE', icon: 'fas fa-user-tie', desc: 'Messages from Faculty Coordinator & team leads' },
    { key: 'whyJoin', num: '12', title: 'WHY JOIN (SKILLS)', icon: 'fas fa-bolt', desc: 'Skills & practical experience gained on the team' },
    { key: 'cta', num: '13', title: 'GET INVOLVED (CTA)', icon: 'fas fa-paper-plane', desc: 'Final call-to-action banner & action buttons' },
    { key: 'footer', num: '14', title: 'FOOTER NOTICE', icon: 'fas fa-shoe-prints', desc: 'Global footer notice & footer integration link' }
  ];

  const ICON_OPTIONS = [
    { value: 'fas fa-lightbulb', label: 'Lightbulb (Innovation)' },
    { value: 'fas fa-users', label: 'Users (Teamwork)' },
    { value: 'fas fa-graduation-cap', label: 'Graduation Cap (Education)' },
    { value: 'fas fa-trophy', label: 'Trophy (Excellence)' },
    { value: 'fas fa-leaf', label: 'Leaf / Seedling (Sustainability)' },
    { value: 'fas fa-seedling', label: 'Seedling (Sustainability)' },
    { value: 'fas fa-shield-alt', label: 'Shield (Integrity)' },
    { value: 'fas fa-bolt', label: 'Lightning (Powertrain/Electric)' },
    { value: 'fas fa-cogs', label: 'Gears (Drivetrain/Mech)' },
    { value: 'fas fa-wind', label: 'Wind (Aerodynamics)' },
    { value: 'fas fa-chart-line', label: 'Chart (Data Acquisition)' },
    { value: 'fas fa-car', label: 'Car (Vehicle Dynamics)' },
    { value: 'fas fa-microchip', label: 'Microchip (Firmware/Electronics)' },
    { value: 'fas fa-wrench', label: 'Wrench (Manufacturing/Assembly)' },
    { value: 'fas fa-tools', label: 'Tools (Workshop/Testing)' },
    { value: 'fas fa-flask', label: 'Flask (Testing/Research)' },
    { value: 'fas fa-drafting-compass', label: 'Compass (CAD/Design)' },
    { value: 'fas fa-desktop', label: 'Desktop (Simulation)' },
    { value: 'fas fa-tasks', label: 'Tasks (Project Mgmt)' },
    { value: 'fas fa-crown', label: 'Crown (Leadership)' },
    { value: 'fas fa-bullhorn', label: 'Bullhorn (Marketing)' },
    { value: 'fas fa-handshake', label: 'Handshake (Collaboration)' }
  ];

  /**
   * Main entry point called by router for /admin/about
   */
  async function renderAboutModule(container) {
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:360px; color:var(--text-secondary, #9A9AA5);">
        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-right:12px; color:var(--accent-orange, #FF5A00);"></i>
        <span style="font-family:var(--font-mono, monospace); font-size:0.95rem;">Loading Ashwa About Page Control Center...</span>
      </div>
    `;

    await loadAboutData(container);
  }

  async function loadAboutData(container) {
    try {
      const res = await API().get('/admin/about');
      if (res && res.success && res.data) {
        originalAboutData = JSON.parse(JSON.stringify(res.data));
        currentAboutData = JSON.parse(JSON.stringify(res.data));
        normalizeData();
        updateSaveStatus('saved');
        renderInterface(container);
      } else {
        throw new Error(res?.message || 'Failed to load About page content.');
      }
    } catch (err) {
      console.error('Error loading About CMS data:', err);
      container.innerHTML = `
        <div class="admin-panel" style="padding:40px; text-align:center; max-width:600px; margin:40px auto; border:1px solid #FF4D4D;">
          <i class="fas fa-triangle-exclamation" style="font-size:2.5rem; color:#FF4D4D; margin-bottom:16px;"></i>
          <h2 style="font-size:1.25rem; font-weight:800; color:#FFFFFF; margin-bottom:8px;">Unable to Load About Page CMS</h2>
          <p style="color:#9A9AA5; font-size:0.9rem; margin-bottom:24px;">${escapeHtml(err.message)}</p>
          <button type="button" class="btn btn-primary" id="retryAboutLoadBtn">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
      document.getElementById('retryAboutLoadBtn')?.addEventListener('click', () => loadAboutData(container));
    }
  }

  function normalizeData() {
    if (!currentAboutData) return;

    // Ensure all section objects exist
    SECTION_DEFS.forEach(def => {
      if (!currentAboutData[def.key] || typeof currentAboutData[def.key] !== 'object') {
        currentAboutData[def.key] = {};
      }
    });

    // Normalize Core Values: ensure items array exists
    const cv = currentAboutData.coreValues;
    if (!Array.isArray(cv.items)) {
      if (Array.isArray(cv.values)) cv.items = cv.values;
      else cv.items = [];
    }

    // Normalize Story: ensure blocks array exists
    const st = currentAboutData.story;
    if (!Array.isArray(st.blocks)) {
      if (Array.isArray(st.storyBlocks)) st.blocks = st.storyBlocks;
      else st.blocks = [];
    }

    // Normalize Vision & Mission
    const vm = currentAboutData.visionMission;
    if (!vm.vision) vm.vision = {};
    if (!vm.mission) vm.mission = {};
    if (!Array.isArray(vm.mission.bullets)) vm.mission.bullets = [];

    // Normalize Team Structure: ensure nodes array exists
    const ts = currentAboutData.teamStructure;
    if (!Array.isArray(ts.nodes)) ts.nodes = [];

    // Normalize Departments: ensure items array exists
    const dept = currentAboutData.departments;
    if (!Array.isArray(dept.items)) {
      if (Array.isArray(dept.list)) dept.items = dept.list;
      else dept.items = [];
    }

    // Normalize Process: ensure stages array exists
    const pr = currentAboutData.process;
    if (!Array.isArray(pr.stages)) pr.stages = [];

    // Normalize Formula Bharat: ensure facts array exists
    const fb = currentAboutData.formulaBharat;
    if (!Array.isArray(fb.facts)) {
      if (Array.isArray(fb.categories)) fb.facts = fb.categories;
      else fb.facts = [];
    }

    // Normalize Workshop: ensure items array exists
    const ws = currentAboutData.workshop;
    if (!Array.isArray(ws.items)) ws.items = [];

    // Normalize People Messages: ensure messages array exists
    const pm = currentAboutData.peopleMessages;
    if (!Array.isArray(pm.messages)) {
      if (Array.isArray(pm.people)) pm.messages = pm.people;
      else pm.messages = [];
    }

    // Normalize Why Join: ensure skills array exists
    const wj = currentAboutData.whyJoin;
    if (!Array.isArray(wj.skills)) {
      if (Array.isArray(wj.items)) wj.skills = wj.items;
      else wj.skills = [];
    }

    // Normalize CTA
    if (!currentAboutData.cta) currentAboutData.cta = {};
  }

  function renderInterface(container) {
    const isPub = currentAboutData.status === 'published';
    const statusClass = isPub ? 'badge-success' : 'badge-warning';
    const statusText = isPub ? 'LIVE / PUBLISHED' : 'DRAFT CHANGES';

    let html = `
      <!-- Control Center Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px; background:#141419; padding:20px 24px; border-radius:12px; border:1px solid #282832;">
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
            <h1 style="font-size:1.5rem; font-weight:800; color:#F5F5F5; margin:0; letter-spacing:-0.02em;">
              ABOUT PAGE CONTROL CENTER
            </h1>
            <span class="badge ${statusClass}" id="aboutStatusBadge">${statusText}</span>
          </div>
          <p style="font-size:0.85rem; color:#9696A0; margin:0;">
            Manage all 14 continuous storytelling sections displayed on the public Ashwa Riders About page.
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:12px;">
          <a href="/about.html?preview=true" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-eye"></i> Preview Draft
          </a>
          <button type="button" class="btn btn-secondary btn-sm" id="aboutHeaderSaveDraftBtn" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-save"></i> Save Draft
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="aboutHeaderPublishBtn" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-paper-plane"></i> Publish Live
          </button>
        </div>
      </div>

      <!-- Settings Accordion -->
      <div class="admin-panel" style="margin-bottom:20px; background:#141419; border:1px solid #282832; border-radius:10px;">
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="window.AdminAboutModule.toggleSection('settings')">
          <div style="display:flex; align-items:center; gap:12px;">
            <i class="fas fa-cog" style="color:#FF5A00;"></i>
            <span style="font-weight:700; color:#F5F5F5; font-size:0.95rem;">SEO & PAGE SETTINGS</span>
          </div>
          <i class="fas fa-chevron-${collapsedSections['settings'] ? 'down' : 'up'}" style="color:#9696A0;"></i>
        </div>
        <div id="section-body-settings" style="display:${collapsedSections['settings'] ? 'none' : 'block'}; padding:20px; border-top:1px solid #282832;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
              <label class="form-label">Page Title</label>
              <input type="text" class="form-input" value="${escapeHtml(currentAboutData.settings?.pageTitle || '')}" onchange="window.AdminAboutModule.updateField('settings.pageTitle', this.value)">
            </div>
            <div>
              <label class="form-label">SEO Meta Title</label>
              <input type="text" class="form-input" value="${escapeHtml(currentAboutData.settings?.seoTitle || '')}" onchange="window.AdminAboutModule.updateField('settings.seoTitle', this.value)">
            </div>
          </div>
          <div style="margin-top:12px;">
            <label class="form-label">SEO Description</label>
            <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateField('settings.seoDescription', this.value)">${escapeHtml(currentAboutData.settings?.seoDescription || '')}</textarea>
          </div>
        </div>
      </div>

      <!-- 14 Section Cards -->
      <div id="aboutSectionsContainer" style="display:flex; flex-direction:column; gap:16px; margin-bottom:80px;">
    `;

    SECTION_DEFS.forEach((def) => {
      html += renderSectionCard(def);
    });

    html += `
      </div>

      <!-- Sticky Bottom Action Bar -->
      <div style="position:fixed; bottom:0; left:260px; right:0; background:#141419; border-top:1px solid #282832; padding:16px 32px; display:flex; justify-content:space-between; align-items:center; z-index:900; box-shadow:0 -4px 20px rgba(0,0,0,0.5);">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-family:var(--font-mono, monospace); font-size:0.85rem; color:#9696A0;" id="aboutSaveStateText">All changes saved</span>
        </div>
        <div style="display:flex; align-items:center; gap:12px;">
          <button type="button" class="btn btn-secondary" id="aboutResetBtn">
            <i class="fas fa-undo"></i> Reset
          </button>
          <button type="button" class="btn btn-secondary" id="aboutFooterSaveDraftBtn">
            <i class="fas fa-save"></i> Save Draft
          </button>
          <button type="button" class="btn btn-primary" id="aboutFooterPublishBtn">
            <i class="fas fa-paper-plane"></i> Publish Live
          </button>
        </div>
      </div>
    `;

    container.innerHTML = html;
    bindGlobalEvents();
  }

  function renderSectionCard(def) {
    const key = def.key;
    const isCollapsed = Boolean(collapsedSections[key]);
    const sectionData = currentAboutData[key] || {};
    const isVisible = sectionData.visible !== false && sectionData.isVisible !== false;

    return `
      <div class="admin-panel" style="background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <!-- Card Header -->
        <div style="padding:16px 20px; display:flex; justify-content:space-between; align-items:center; background:#1A1A21; border-bottom:${isCollapsed ? 'none' : '1px solid #282832'}; cursor:pointer;" onclick="window.AdminAboutModule.toggleSection('${key}')">
          <div style="display:flex; align-items:center; gap:16px;">
            <span style="font-family:var(--font-mono, monospace); font-size:1.1rem; font-weight:800; color:#FF5A00; background:rgba(255,90,0,0.1); padding:4px 10px; border-radius:6px; border:1px solid rgba(255,90,0,0.2);">${def.num}</span>
            <div>
              <div style="display:flex; align-items:center; gap:10px;">
                <h3 style="margin:0; font-size:1rem; font-weight:700; color:#F5F5F5;">
                  <i class="${def.icon}" style="margin-right:8px; color:#FF5A00;"></i>${def.title}
                </h3>
                <span class="badge ${isVisible ? 'badge-success' : 'badge-secondary'}" style="font-size:0.7rem;">
                  ${isVisible ? 'VISIBLE' : 'HIDDEN'}
                </span>
              </div>
              <p style="margin:2px 0 0 0; font-size:0.8rem; color:#9696A0;">${def.desc}</p>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:12px;" onclick="event.stopPropagation()">
            <label style="display:inline-flex; align-items:center; gap:6px; font-size:0.8rem; color:#9696A0; cursor:pointer;">
              <input type="checkbox" ${isVisible ? 'checked' : ''} onchange="window.AdminAboutModule.updateSectionVisibility('${key}', this.checked)">
              Show Section
            </label>
            <button type="button" class="btn btn-secondary btn-sm" style="padding:4px 8px;" onclick="window.AdminAboutModule.toggleSection('${key}')">
              <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
            </button>
          </div>
        </div>

        <!-- Card Body -->
        <div id="section-body-${key}" style="display:${isCollapsed ? 'none' : 'block'}; padding:24px;">
          ${renderSectionBody(key, sectionData)}
        </div>
      </div>
    `;
  }

  function renderSectionBody(key, data) {
    switch (key) {
      case 'hero': return renderHeroFields(data);
      case 'whoWeAre': return renderWhoWeAreFields(data);
      case 'story': return renderStoryFields(data);
      case 'visionMission': return renderVisionMissionFields(data);
      case 'coreValues': return renderCoreValuesFields(data);
      case 'teamStructure': return renderTeamStructureFields(data);
      case 'departments': return renderDepartmentsFields(data);
      case 'process': return renderProcessFields(data);
      case 'formulaBharat': return renderFormulaBharatFields(data);
      case 'workshop': return renderWorkshopFields(data);
      case 'peopleMessages': return renderPeopleMessagesFields(data);
      case 'whyJoin': return renderWhyJoinFields(data);
      case 'cta': return renderCtaFields(data);
      case 'footer': return renderFooterFields(data);
      default: return '<p style="color:#9696A0;">No editor configured.</p>';
    }
  }

  // ── 01 HERO ────────────────────────────────────────────────────────
  function renderHeroFields(d) {
    const titleVal = d.title || d.heading || '';
    const desktopImg = d.desktopImageUrl || d.media?.desktopImage || '';
    const mobileImg = d.mobileImageUrl || d.media?.mobileImage || '';

    return `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['hero.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(titleVal)}" onchange="window.AdminAboutModule.updateMultiFields(['hero.title', 'hero.heading'], this.value)">
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:12px;">
        <div>
          <label class="form-label">Highlighted Heading Part</label>
          <input type="text" class="form-input" value="${escapeHtml(d.highlightText || d.highlightedHeading || '')}" onchange="window.AdminAboutModule.updateMultiFields(['hero.highlightText', 'hero.highlightedHeading'], this.value)">
        </div>
        <div>
          <label class="form-label">Subtitle</label>
          <input type="text" class="form-input" value="${escapeHtml(d.subtitle || '')}" onchange="window.AdminAboutModule.updateMultiFields(['hero.subtitle'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Description</label>
        <textarea class="form-input" rows="3" onchange="window.AdminAboutModule.updateMultiFields(['hero.description'], this.value)">${escapeHtml(d.description || '')}</textarea>
      </div>

      <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:20px 0 12px 0;">HERO MEDIA & BACKGROUND</h4>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Desktop Background Image URL</label>
          <div style="display:flex; gap:8px;">
            <input type="text" class="form-input" id="heroDesktopImgInput" value="${escapeHtml(desktopImg)}" onchange="window.AdminAboutModule.updateMultiFields(['hero.desktopImageUrl', 'hero.media.desktopImage'], this.value)">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.triggerFileUpload('heroDesktopImgInput', ['hero.desktopImageUrl', 'hero.media.desktopImage'])">Upload</button>
          </div>
        </div>
        <div>
          <label class="form-label">Mobile Background Image URL</label>
          <div style="display:flex; gap:8px;">
            <input type="text" class="form-input" id="heroMobileImgInput" value="${escapeHtml(mobileImg)}" onchange="window.AdminAboutModule.updateMultiFields(['hero.mobileImageUrl', 'hero.media.mobileImage'], this.value)">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.triggerFileUpload('heroMobileImgInput', ['hero.mobileImageUrl', 'hero.media.mobileImage'])">Upload</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── 02 WHO WE ARE ──────────────────────────────────────────────────
  function renderWhoWeAreFields(d) {
    const titleVal = d.title || d.heading || '';
    const leadVal = d.leadParagraph || d.primaryParagraph || '';
    const imgVal = d.imageUrl || d.media?.image || '';

    return `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['whoWeAre.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(titleVal)}" onchange="window.AdminAboutModule.updateMultiFields(['whoWeAre.title', 'whoWeAre.heading'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Primary / Lead Paragraph</label>
        <textarea class="form-input" rows="3" onchange="window.AdminAboutModule.updateMultiFields(['whoWeAre.leadParagraph', 'whoWeAre.primaryParagraph'], this.value)">${escapeHtml(leadVal)}</textarea>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Closing Statement</label>
        <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateMultiFields(['whoWeAre.closingStatement'], this.value)">${escapeHtml(d.closingStatement || '')}</textarea>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Section Image URL</label>
        <div style="display:flex; gap:8px;">
          <input type="text" class="form-input" id="whoWeAreImgInput" value="${escapeHtml(imgVal)}" onchange="window.AdminAboutModule.updateMultiFields(['whoWeAre.imageUrl', 'whoWeAre.media.image'], this.value)">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.triggerFileUpload('whoWeAreImgInput', ['whoWeAre.imageUrl', 'whoWeAre.media.image'])">Upload</button>
        </div>
      </div>
    `;
  }

  // ── 03 OUR STORY ───────────────────────────────────────────────────
  function renderStoryFields(d) {
    const blocks = Array.isArray(d.blocks) ? d.blocks : (Array.isArray(d.storyBlocks) ? d.storyBlocks : []);
    const titleVal = d.title || d.headingLine1 || '';

    let html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['story.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(titleVal)}" onchange="window.AdminAboutModule.updateMultiFields(['story.title', 'story.headingLine1'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Story Overview / Description</label>
        <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateMultiFields(['story.description'], this.value)">${escapeHtml(d.description || '')}</textarea>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0;">
        <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0;">DYNAMIC STORY BLOCKS (${blocks.length})</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.addArrayItem('story.blocks', { id: 'block-' + Date.now(), title: 'New Milestone', content: '', year: '2026', visible: true })">
          <i class="fas fa-plus"></i> Add Story Block
        </button>
      </div>
    `;

    blocks.forEach((b, idx) => {
      html += `
        <div style="background:#1A1A21; padding:16px; border-radius:8px; border:1px solid #282832; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-weight:700; color:#F5F5F5; font-size:0.85rem;">Story Block #${idx + 1}: ${escapeHtml(b.title || '')}</span>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="window.AdminAboutModule.removeArrayItem('story.blocks', ${idx})">Delete</button>
          </div>
          <div style="margin-top:10px;">
            <label class="form-label">Block Content</label>
            <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateField('story.blocks.${idx}.content', this.value)">${escapeHtml(b.content || '')}</textarea>
          </div>
        </div>
      `;
    });

    return html;
  }

  // ── 04 VISION & MISSION ────────────────────────────────────────────
  function renderVisionMissionFields(d) {
    const v = d.vision || {};
    const m = d.mission || {};
    const bullets = Array.isArray(m.bullets) ? m.bullets : [];

    let html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Section Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['visionMission.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Section Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(d.title || d.heading || '')}" onchange="window.AdminAboutModule.updateMultiFields(['visionMission.title', 'visionMission.heading'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Description</label>
        <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateMultiFields(['visionMission.description'], this.value)">${escapeHtml(d.description || '')}</textarea>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-top:20px;">
        <!-- Vision -->
        <div style="background:#1A1A21; padding:16px; border-radius:8px; border:1px solid #282832;">
          <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0 0 12px 0;">OUR VISION</h4>
          <label class="form-label">Vision Title</label>
          <input type="text" class="form-input" value="${escapeHtml(v.title || '')}" onchange="window.AdminAboutModule.updateField('visionMission.vision.title', this.value)">
          <label class="form-label" style="margin-top:10px;">Vision Description</label>
          <textarea class="form-input" rows="3" onchange="window.AdminAboutModule.updateField('visionMission.vision.description', this.value)">${escapeHtml(v.description || '')}</textarea>
        </div>

        <!-- Mission -->
        <div style="background:#1A1A21; padding:16px; border-radius:8px; border:1px solid #282832;">
          <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0 0 12px 0;">OUR MISSION</h4>
          <label class="form-label">Mission Title</label>
          <input type="text" class="form-input" value="${escapeHtml(m.title || '')}" onchange="window.AdminAboutModule.updateField('visionMission.mission.title', this.value)">
          <label class="form-label" style="margin-top:10px;">Mission Description</label>
          <textarea class="form-input" rows="3" onchange="window.AdminAboutModule.updateField('visionMission.mission.description', this.value)">${escapeHtml(m.description || '')}</textarea>
        </div>
      </div>

      <!-- Mission Bullets -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0;">
        <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0;">MISSION BULLET POINTS (${bullets.length})</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.addArrayItem('visionMission.mission.bullets', 'New mission bullet point')">
          <i class="fas fa-plus"></i> Add Bullet Point
        </button>
      </div>
    `;

    bullets.forEach((b, idx) => {
      const bulletText = typeof b === 'string' ? b : (b.text || '');
      html += `
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px;">
          <input type="text" class="form-input" style="flex:1;" value="${escapeHtml(bulletText)}" onchange="window.AdminAboutModule.updateField('visionMission.mission.bullets.${idx}', this.value)">
          <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="window.AdminAboutModule.removeArrayItem('visionMission.mission.bullets', ${idx})">Delete</button>
        </div>
      `;
    });

    return html;
  }

  // ── 05 CORE VALUES ─────────────────────────────────────────────────
  function renderCoreValuesFields(d) {
    const values = Array.isArray(d.items) ? d.items : (Array.isArray(d.values) ? d.values : []);

    let html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Section Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['coreValues.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Section Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(d.title || d.heading || '')}" onchange="window.AdminAboutModule.updateMultiFields(['coreValues.title', 'coreValues.heading'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Description</label>
        <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateMultiFields(['coreValues.description'], this.value)">${escapeHtml(d.description || '')}</textarea>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0;">
        <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0;">CORE VALUES (${values.length})</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.addArrayItem('coreValues.items', { id: 'val-' + Date.now(), title: 'NEW VALUE', icon: 'fas fa-lightbulb', description: '', visible: true })">
          <i class="fas fa-plus"></i> Add Core Value
        </button>
      </div>
    `;

    values.forEach((val, idx) => {
      html += `
        <div style="background:#1A1A21; padding:16px; border-radius:8px; border:1px solid #282832; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="${val.icon || 'fas fa-gem'}" style="color:#FF5A00;"></i>
              <span style="font-weight:700; color:#F5F5F5; font-size:0.9rem;">${escapeHtml(val.title || 'Value')}</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="window.AdminAboutModule.removeArrayItem('coreValues.items', ${idx})">Delete</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
              <label class="form-label">Title</label>
              <input type="text" class="form-input" value="${escapeHtml(val.title || '')}" onchange="window.AdminAboutModule.updateField('coreValues.items.${idx}.title', this.value)">
            </div>
            <div>
              <label class="form-label">Icon</label>
              <select class="form-input" onchange="window.AdminAboutModule.updateField('coreValues.items.${idx}.icon', this.value)">
                ${ICON_OPTIONS.map(opt => `<option value="${opt.value}" ${val.icon === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="margin-top:10px;">
            <label class="form-label">Description</label>
            <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateField('coreValues.items.${idx}.description', this.value)">${escapeHtml(val.description || val.shortDescription || '')}</textarea>
          </div>
        </div>
      `;
    });

    return html;
  }

  // ── 06 TEAM STRUCTURE ──────────────────────────────────────────────
  function renderTeamStructureFields(d) {
    const nodes = Array.isArray(d.nodes) ? d.nodes : [];
    let html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Section Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(d.title || d.heading || '')}" onchange="window.AdminAboutModule.updateMultiFields(['teamStructure.title', 'teamStructure.heading'], this.value)">
        </div>
        <div>
          <label class="form-label">Section Description</label>
          <input type="text" class="form-input" value="${escapeHtml(d.description || '')}" onchange="window.AdminAboutModule.updateMultiFields(['teamStructure.description'], this.value)">
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0;">
        <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0;">ORGANIZATIONAL NODES (${nodes.length})</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.addArrayItem('teamStructure.nodes', { id: 'node-' + Date.now(), title: 'POSITION', level: 1, linkUrl: 'team.html', visible: true })">
          <i class="fas fa-plus"></i> Add Node
        </button>
      </div>
    `;

    nodes.forEach((n, idx) => {
      html += `
        <div style="background:#1A1A21; padding:16px; border-radius:8px; border:1px solid #282832; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-weight:700; color:#F5F5F5; font-size:0.85rem;">Node #${idx + 1}: ${escapeHtml(n.title || '')}</span>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="window.AdminAboutModule.removeArrayItem('teamStructure.nodes', ${idx})">Delete</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
              <label class="form-label">Position Title</label>
              <input type="text" class="form-input" value="${escapeHtml(n.title || '')}" onchange="window.AdminAboutModule.updateField('teamStructure.nodes.${idx}.title', this.value)">
            </div>
            <div>
              <label class="form-label">Link URL</label>
              <input type="text" class="form-input" value="${escapeHtml(n.linkUrl || 'team.html')}" onchange="window.AdminAboutModule.updateField('teamStructure.nodes.${idx}.linkUrl', this.value)">
            </div>
          </div>
        </div>
      `;
    });

    return html;
  }

  // ── 07 DEPARTMENTS ─────────────────────────────────────────────────
  function renderDepartmentsFields(d) {
    const list = Array.isArray(d.items) ? d.items : (Array.isArray(d.list) ? d.list : []);
    let html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Section Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['departments.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Section Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(d.title || d.heading || '')}" onchange="window.AdminAboutModule.updateMultiFields(['departments.title', 'departments.heading'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Description</label>
        <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateMultiFields(['departments.description'], this.value)">${escapeHtml(d.description || '')}</textarea>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0;">
        <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0;">DEPARTMENTS (${list.length})</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.addArrayItem('departments.items', { id: 'dept-' + Date.now(), name: 'NEW DEPT', icon: 'fas fa-cogs', teamLead: 'Team Lead', description: '', responsibilities: [], visible: true })">
          <i class="fas fa-plus"></i> Add Department
        </button>
      </div>
    `;

    list.forEach((dept, idx) => {
      html += `
        <div style="background:#1A1A21; padding:16px; border-radius:8px; border:1px solid #282832; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="${dept.icon || 'fas fa-cogs'}" style="color:#FF5A00;"></i>
              <span style="font-weight:700; color:#F5F5F5; font-size:0.9rem;">${escapeHtml(dept.name || 'Department')}</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="window.AdminAboutModule.removeArrayItem('departments.items', ${idx})">Delete</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
              <label class="form-label">Department Name</label>
              <input type="text" class="form-input" value="${escapeHtml(dept.name || '')}" onchange="window.AdminAboutModule.updateField('departments.items.${idx}.name', this.value)">
            </div>
            <div>
              <label class="form-label">Icon</label>
              <select class="form-input" onchange="window.AdminAboutModule.updateField('departments.items.${idx}.icon', this.value)">
                ${ICON_OPTIONS.map(opt => `<option value="${opt.value}" ${dept.icon === opt.value ? 'selected' : ''}>${opt.label}</option>`).join('')}
              </select>
            </div>
          </div>
          <div style="margin-top:10px;">
            <label class="form-label">Department Lead</label>
            <input type="text" class="form-input" value="${escapeHtml(dept.teamLead || '')}" onchange="window.AdminAboutModule.updateField('departments.items.${idx}.teamLead', this.value)">
          </div>
          <div style="margin-top:10px;">
            <label class="form-label">Description</label>
            <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateField('departments.items.${idx}.description', this.value)">${escapeHtml(dept.description || '')}</textarea>
          </div>
        </div>
      `;
    });

    return html;
  }

  // ── 08 OUR PROCESS ─────────────────────────────────────────────────
  function renderProcessFields(d) {
    const stages = Array.isArray(d.stages) ? d.stages : [];
    let html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Section Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['process.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Section Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(d.title || d.heading || '')}" onchange="window.AdminAboutModule.updateMultiFields(['process.title', 'process.heading'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Description</label>
        <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateMultiFields(['process.description'], this.value)">${escapeHtml(d.description || '')}</textarea>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0;">
        <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0;">BUILD STAGES (${stages.length})</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.addArrayItem('process.stages', { id: 'stg-' + Date.now(), stepNumber: '07', name: 'NEW STAGE', description: '', details: '', visible: true })">
          <i class="fas fa-plus"></i> Add Build Stage
        </button>
      </div>
    `;

    stages.forEach((stg, idx) => {
      const stageName = stg.name || stg.title || '';
      html += `
        <div style="background:#1A1A21; padding:16px; border-radius:8px; border:1px solid #282832; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-weight:700; color:#FF5A00; font-size:0.85rem;">Stage ${stg.stepNumber || idx + 1}: ${escapeHtml(stageName)}</span>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="window.AdminAboutModule.removeArrayItem('process.stages', ${idx})">Delete</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 3fr; gap:12px;">
            <div>
              <label class="form-label">Step Number</label>
              <input type="text" class="form-input" value="${escapeHtml(stg.stepNumber || '')}" onchange="window.AdminAboutModule.updateField('process.stages.${idx}.stepNumber', this.value)">
            </div>
            <div>
              <label class="form-label">Stage Name / Title</label>
              <input type="text" class="form-input" value="${escapeHtml(stageName)}" onchange="window.AdminAboutModule.updateMultiFields(['process.stages.${idx}.name', 'process.stages.${idx}.title'], this.value)">
            </div>
          </div>
          <div style="margin-top:10px;">
            <label class="form-label">Overview & Description</label>
            <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateField('process.stages.${idx}.description', this.value)">${escapeHtml(stg.description || '')}</textarea>
          </div>
        </div>
      `;
    });

    return html;
  }

  // ── 09 FORMULA BHARAT ──────────────────────────────────────────────
  function renderFormulaBharatFields(d) {
    const facts = Array.isArray(d.facts) ? d.facts : (Array.isArray(d.categories) ? d.categories : []);
    let html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Section Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['formulaBharat.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Section Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(d.title || d.heading || '')}" onchange="window.AdminAboutModule.updateMultiFields(['formulaBharat.title', 'formulaBharat.heading'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Description</label>
        <textarea class="form-input" rows="3" onchange="window.AdminAboutModule.updateMultiFields(['formulaBharat.description'], this.value)">${escapeHtml(d.description || '')}</textarea>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Vehicle / Competition Image URL</label>
        <div style="display:flex; gap:8px;">
          <input type="text" class="form-input" id="fbImgInput" value="${escapeHtml(d.imageUrl || '')}" onchange="window.AdminAboutModule.updateField('formulaBharat.imageUrl', this.value)">
          <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.triggerFileUpload('fbImgInput', ['formulaBharat.imageUrl'])">Upload</button>
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0;">
        <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0;">COMPETITION CATEGORIES / FACTS (${facts.length})</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.addArrayItem('formulaBharat.facts', { id: 'fact-' + Date.now(), label: 'NEW CATEGORY', url: '', visible: true })">
          <i class="fas fa-plus"></i> Add Category
        </button>
      </div>
    `;

    facts.forEach((f, idx) => {
      html += `
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px;">
          <input type="text" class="form-input" style="flex:1;" value="${escapeHtml(f.label || '')}" onchange="window.AdminAboutModule.updateField('formulaBharat.facts.${idx}.label', this.value)">
          <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="window.AdminAboutModule.removeArrayItem('formulaBharat.facts', ${idx})">Delete</button>
        </div>
      `;
    });

    return html;
  }

  // ── 10 WORKSHOP ────────────────────────────────────────────────────
  function renderWorkshopFields(d) {
    const items = Array.isArray(d.items) ? d.items : [];
    let html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Section Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['workshop.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Section Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(d.title || d.heading || '')}" onchange="window.AdminAboutModule.updateMultiFields(['workshop.title', 'workshop.heading'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Description</label>
        <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateMultiFields(['workshop.description'], this.value)">${escapeHtml(d.description || '')}</textarea>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0;">
        <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0;">WORKSHOP GALLERY ITEMS (${items.length})</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.addArrayItem('workshop.items', { id: 'ws-' + Date.now(), title: 'FACILITY ITEM', imageUrl: '', description: '', icon: 'fas fa-tools', visible: true })">
          <i class="fas fa-plus"></i> Add Gallery Item
        </button>
      </div>
    `;

    items.forEach((item, idx) => {
      html += `
        <div style="background:#1A1A21; padding:16px; border-radius:8px; border:1px solid #282832; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-weight:700; color:#F5F5F5; font-size:0.85rem;">Item #${idx + 1}: ${escapeHtml(item.title || '')}</span>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="window.AdminAboutModule.removeArrayItem('workshop.items', ${idx})">Delete</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
              <label class="form-label">Item Title</label>
              <input type="text" class="form-input" value="${escapeHtml(item.title || '')}" onchange="window.AdminAboutModule.updateField('workshop.items.${idx}.title', this.value)">
            </div>
            <div>
              <label class="form-label">Image URL</label>
              <div style="display:flex; gap:8px;">
                <input type="text" class="form-input" id="workshopImgInput_${idx}" value="${escapeHtml(item.imageUrl || '')}" onchange="window.AdminAboutModule.updateField('workshop.items.${idx}.imageUrl', this.value)">
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.triggerFileUpload('workshopImgInput_${idx}', ['workshop.items.${idx}.imageUrl'])">Upload</button>
              </div>
            </div>
          </div>
        </div>
      `;
    });

    return html;
  }

  // ── 11 FACULTY & PEOPLE ────────────────────────────────────────────
  function renderPeopleMessagesFields(d) {
    const msgs = Array.isArray(d.messages) ? d.messages : [];
    let html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Section Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['peopleMessages.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Section Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(d.title || d.heading || '')}" onchange="window.AdminAboutModule.updateMultiFields(['peopleMessages.title', 'peopleMessages.heading'], this.value)">
        </div>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0;">
        <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0;">PEOPLE MESSAGES (${msgs.length})</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.addArrayItem('peopleMessages.messages', { id: 'msg-' + Date.now(), name: 'Person Name', role: 'Faculty Coordinator', quote: '', visible: true })">
          <i class="fas fa-plus"></i> Add Person Message
        </button>
      </div>
    `;

    msgs.forEach((m, idx) => {
      const pName = m.name || m.personName || '';
      html += `
        <div style="background:#1A1A21; padding:16px; border-radius:8px; border:1px solid #282832; margin-bottom:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <span style="font-weight:700; color:#F5F5F5; font-size:0.85rem;">${escapeHtml(pName || 'Person')} — ${escapeHtml(m.role || '')}</span>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="window.AdminAboutModule.removeArrayItem('peopleMessages.messages', ${idx})">Delete</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
              <label class="form-label">Person Name</label>
              <input type="text" class="form-input" value="${escapeHtml(pName)}" onchange="window.AdminAboutModule.updateMultiFields(['peopleMessages.messages.${idx}.name', 'peopleMessages.messages.${idx}.personName'], this.value)">
            </div>
            <div>
              <label class="form-label">Role / Designation</label>
              <input type="text" class="form-input" value="${escapeHtml(m.role || '')}" onchange="window.AdminAboutModule.updateField('peopleMessages.messages.${idx}.role', this.value)">
            </div>
          </div>
          <div style="margin-top:10px;">
            <label class="form-label">Quote Message</label>
            <textarea class="form-input" rows="3" onchange="window.AdminAboutModule.updateField('peopleMessages.messages.${idx}.quote', this.value)">${escapeHtml(m.quote || '')}</textarea>
          </div>
        </div>
      `;
    });

    return html;
  }

  // ── 12 WHY JOIN ────────────────────────────────────────────────────
  function renderWhyJoinFields(d) {
    const skills = Array.isArray(d.skills) ? d.skills : [];
    let html = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Section Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['whyJoin.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Section Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(d.title || d.heading || '')}" onchange="window.AdminAboutModule.updateMultiFields(['whyJoin.title', 'whyJoin.heading'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Description</label>
        <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateMultiFields(['whyJoin.description'], this.value)">${escapeHtml(d.description || '')}</textarea>
      </div>

      <div style="display:flex; justify-content:space-between; align-items:center; margin:24px 0 12px 0;">
        <h4 style="color:#FF5A00; font-size:0.85rem; font-weight:700; margin:0;">SKILLS LIST (${skills.length})</h4>
        <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminAboutModule.addArrayItem('whyJoin.skills', { id: 'sk-' + Date.now(), name: 'NEW SKILL', description: '', icon: 'fas fa-check-circle', visible: true })">
          <i class="fas fa-plus"></i> Add Skill
        </button>
      </div>
    `;

    skills.forEach((sk, idx) => {
      html += `
        <div style="display:flex; gap:10px; align-items:center; margin-bottom:8px;">
          <input type="text" class="form-input" style="flex:1;" value="${escapeHtml(sk.name || '')}" onchange="window.AdminAboutModule.updateField('whyJoin.skills.${idx}.name', this.value)">
          <button type="button" class="btn btn-secondary btn-sm" style="color:#ef4444;" onclick="window.AdminAboutModule.removeArrayItem('whyJoin.skills', ${idx})">Delete</button>
        </div>
      `;
    });

    return html;
  }

  // ── 13 GET INVOLVED (CTA) ──────────────────────────────────────────
  function renderCtaFields(d) {
    const titleVal = d.title || d.heading || '';

    return `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
        <div>
          <label class="form-label">Eyebrow</label>
          <input type="text" class="form-input" value="${escapeHtml(d.eyebrow || '')}" onchange="window.AdminAboutModule.updateMultiFields(['cta.eyebrow'], this.value)">
        </div>
        <div>
          <label class="form-label">Heading</label>
          <input type="text" class="form-input" value="${escapeHtml(titleVal)}" onchange="window.AdminAboutModule.updateMultiFields(['cta.title', 'cta.heading'], this.value)">
        </div>
      </div>
      <div style="margin-top:12px;">
        <label class="form-label">Description</label>
        <textarea class="form-input" rows="2" onchange="window.AdminAboutModule.updateMultiFields(['cta.description'], this.value)">${escapeHtml(d.description || '')}</textarea>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px;">
        <div style="background:#1A1A21; padding:12px; border-radius:8px;">
          <h5 style="color:#FF5A00; font-size:0.8rem; margin:0 0 8px 0;">PRIMARY BUTTON</h5>
          <label class="form-label">Label</label>
          <input type="text" class="form-input" value="${escapeHtml(d.primaryBtnText || '')}" onchange="window.AdminAboutModule.updateField('cta.primaryBtnText', this.value)">
          <label class="form-label" style="margin-top:8px;">Link URL</label>
          <input type="text" class="form-input" value="${escapeHtml(d.primaryBtnUrl || '')}" onchange="window.AdminAboutModule.updateField('cta.primaryBtnUrl', this.value)">
        </div>
        <div style="background:#1A1A21; padding:12px; border-radius:8px;">
          <h5 style="color:#FF5A00; font-size:0.8rem; margin:0 0 8px 0;">SECONDARY BUTTON</h5>
          <label class="form-label">Label</label>
          <input type="text" class="form-input" value="${escapeHtml(d.secondaryBtnText || '')}" onchange="window.AdminAboutModule.updateField('cta.secondaryBtnText', this.value)">
          <label class="form-label" style="margin-top:8px;">Link URL</label>
          <input type="text" class="form-input" value="${escapeHtml(d.secondaryBtnUrl || '')}" onchange="window.AdminAboutModule.updateField('cta.secondaryBtnUrl', this.value)">
        </div>
      </div>
    `;
  }

  // ── 14 FOOTER ──────────────────────────────────────────────────────
  function renderFooterFields(d) {
    return `
      <div>
        <label class="form-label">Footer Notice</label>
        <input type="text" class="form-input" value="${escapeHtml(d.notice || '')}" onchange="window.AdminAboutModule.updateField('footer.notice', this.value)">
      </div>
      <div style="margin-top:16px; background:#1A1A21; padding:16px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <span style="font-weight:700; color:#F5F5F5; font-size:0.9rem;">Global Footer Integration</span>
          <p style="margin:2px 0 0 0; font-size:0.8rem; color:#9696A0;">The About page consumes the global Ashwa Riders footer.</p>
        </div>
        <a href="#/content/footers" class="btn btn-secondary btn-sm">
          <i class="fas fa-external-link-alt"></i> Manage Global Footer
        </a>
      </div>
    `;
  }

  // ────────────────────────────────────────────────────────────────────
  // STATE MANAGEMENT HELPERS
  // ────────────────────────────────────────────────────────────────────

  function toggleSection(key) {
    collapsedSections[key] = !collapsedSections[key];
    const body = document.getElementById(`section-body-${key}`);
    if (body) {
      body.style.display = collapsedSections[key] ? 'none' : 'block';
    }
  }

  function updateSectionVisibility(key, isChecked) {
    if (!currentAboutData[key]) currentAboutData[key] = {};
    currentAboutData[key].visible = isChecked;
    currentAboutData[key].isVisible = isChecked;
    markDirty();
  }

  function updateField(path, value) {
    const parts = path.split('.');
    let obj = currentAboutData;
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i];
      if (!obj[p]) obj[p] = {};
      obj = obj[p];
    }
    obj[parts[parts.length - 1]] = value;
    markDirty();
  }

  function updateMultiFields(paths, value) {
    paths.forEach(p => updateField(p, value));
  }

  function addArrayItem(path, defaultObj) {
    const parts = path.split('.');
    let obj = currentAboutData;
    for (let i = 0; i < parts.length; i++) {
      if (!obj[parts[i]]) obj[parts[i]] = [];
      obj = obj[parts[i]];
    }
    if (Array.isArray(obj)) {
      obj.push(defaultObj);
      markDirty();
      renderInterface(document.getElementById('adminContent'));
    }
  }

  function removeArrayItem(path, index) {
    const parts = path.split('.');
    let obj = currentAboutData;
    for (let i = 0; i < parts.length; i++) {
      obj = obj[parts[i]];
    }
    if (Array.isArray(obj)) {
      obj.splice(index, 1);
      markDirty();
      renderInterface(document.getElementById('adminContent'));
    }
  }

  function markDirty() {
    saveState = 'dirty';
    updateSaveStatus('dirty');
  }

  function updateSaveStatus(state) {
    saveState = state;
    const txt = document.getElementById('aboutSaveStateText');
    if (!txt) return;
    if (state === 'dirty') {
      txt.textContent = 'Unsaved draft changes';
      txt.style.color = '#FF5A00';
    } else if (state === 'saving') {
      txt.textContent = 'Saving draft...';
      txt.style.color = '#9696A0';
    } else {
      txt.textContent = 'All changes saved to draft';
      txt.style.color = '#9696A0';
    }
  }

  function bindGlobalEvents() {
    document.getElementById('aboutHeaderSaveDraftBtn')?.addEventListener('click', handleSaveDraft);
    document.getElementById('aboutFooterSaveDraftBtn')?.addEventListener('click', handleSaveDraft);
    document.getElementById('aboutHeaderPublishBtn')?.addEventListener('click', handlePublish);
    document.getElementById('aboutFooterPublishBtn')?.addEventListener('click', handlePublish);
    document.getElementById('aboutResetBtn')?.addEventListener('click', handleReset);
  }

  async function triggerFileUpload(inputId, fieldPaths) {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*,video/*';
    fileInput.onchange = async () => {
      const file = fileInput.files[0];
      if (!file) return;
      try {
        Toast().info('Preparing upload...');
        let uploadRes;

        if (window.AdminUploader && window.AdminUploader.uploadFile) {
          uploadRes = await window.AdminUploader.uploadFile(file, {
            folder: 'ashwa_about',
            onProgress: (pct, msg) => {
              if (pct % 25 === 0) Toast().info(msg);
            },
          });
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const token = localStorage.getItem('token') || localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
          const res = await fetch('/api/v1/admin/media/upload', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            credentials: 'include',
            body: formData
          });
          const data = await res.json();
          if (data.success && data.data) {
            uploadRes = { url: data.data.secureUrl || data.data.url };
          } else {
            throw new Error(data.message || 'Upload failed');
          }
        }

        const url = uploadRes.url || uploadRes.secureUrl;
        if (url) {
          const el = document.getElementById(inputId);
          if (el) el.value = url;
          if (Array.isArray(fieldPaths)) {
            updateMultiFields(fieldPaths, url);
          } else {
            updateField(fieldPaths, url);
          }
          Toast().success('Upload and verification successful!');
        } else {
          throw new Error('Upload failed: no usable URL returned');
        }
      } catch (err) {
        console.error('File upload error:', err);
        Toast().error('File upload failed: ' + err.message);
      }
    };
    fileInput.click();
  }

  /**
   * Dedicated serializer that extracts ONLY lightweight persistable content
   * and ensures no File, Blob, base64 data, or duplicate snapshot objects are sent.
   */
  function serializeAboutForPublish(data) {
    if (!data || typeof data !== 'object') return {};

    const cleanUrl = (val) => {
      if (typeof val !== 'string') return '';
      const trimmed = val.trim();
      // Guard against base64 / data URIs in media fields
      if (trimmed.startsWith('data:')) {
        console.warn('[ABOUT CMS] Stripped raw base64 data URI from media field:', trimmed.slice(0, 50));
        return '';
      }
      return trimmed;
    };

    const cleanString = (val) => (typeof val === 'string' ? val.trim() : (val ? String(val) : ''));
    const cleanBool = (val, defaultVal = true) => (val === false ? false : defaultVal);
    const cleanNum = (val, defaultVal = 0) => {
      const n = Number(val);
      return isNaN(n) ? defaultVal : n;
    };

    return {
      settings: {
        pageTitle: cleanString(data.settings?.pageTitle),
        seoTitle: cleanString(data.settings?.seoTitle),
        seoDescription: cleanString(data.settings?.seoDescription),
        ogImageUrl: cleanUrl(data.settings?.ogImageUrl),
        canonicalUrl: cleanString(data.settings?.canonicalUrl),
      },
      hero: {
        visible: cleanBool(data.hero?.visible),
        eyebrow: cleanString(data.hero?.eyebrow),
        title: cleanString(data.hero?.title || data.hero?.heading),
        highlightText: cleanString(data.hero?.highlightText),
        subtitle: cleanString(data.hero?.subtitle),
        description: cleanString(data.hero?.description),
        desktopImageUrl: cleanUrl(data.hero?.desktopImageUrl || data.hero?.media?.desktopImage),
        mobileImageUrl: cleanUrl(data.hero?.mobileImageUrl || data.hero?.media?.mobileImage),
        videoUrl: cleanUrl(data.hero?.videoUrl),
        posterUrl: cleanUrl(data.hero?.posterUrl),
        primaryBtnText: cleanString(data.hero?.primaryBtnText),
        primaryBtnUrl: cleanString(data.hero?.primaryBtnUrl || data.hero?.primaryBtnLink),
        secondaryBtnText: cleanString(data.hero?.secondaryBtnText),
        secondaryBtnUrl: cleanString(data.hero?.secondaryBtnUrl || data.hero?.secondaryBtnLink),
        overlayOpacity: cleanNum(data.hero?.overlayOpacity, 70),
        textAlignment: cleanString(data.hero?.textAlignment || 'left'),
        transition: cleanString(data.hero?.transition || 'fade'),
        duration: cleanNum(data.hero?.duration, 700),
      },
      whoWeAre: {
        visible: cleanBool(data.whoWeAre?.visible),
        eyebrow: cleanString(data.whoWeAre?.eyebrow),
        title: cleanString(data.whoWeAre?.title || data.whoWeAre?.heading),
        leadParagraph: cleanString(data.whoWeAre?.leadParagraph || data.whoWeAre?.primaryParagraph),
        closingStatement: cleanString(data.whoWeAre?.closingStatement),
        imageUrl: cleanUrl(data.whoWeAre?.imageUrl || data.whoWeAre?.media?.image),
        altText: cleanString(data.whoWeAre?.altText),
      },
      story: {
        visible: cleanBool(data.story?.visible),
        eyebrow: cleanString(data.story?.eyebrow),
        title: cleanString(data.story?.title || data.story?.heading),
        description: cleanString(data.story?.description),
        blocks: (Array.isArray(data.story?.blocks) ? data.story.blocks : []).map((b, i) => ({
          content: cleanString(b.content),
          order: cleanNum(b.order, i),
          visible: cleanBool(b.visible),
        })),
      },
      visionMission: {
        visible: cleanBool(data.visionMission?.visible),
        eyebrow: cleanString(data.visionMission?.eyebrow),
        title: cleanString(data.visionMission?.title || data.visionMission?.heading),
        description: cleanString(data.visionMission?.description),
        vision: {
          title: cleanString(data.visionMission?.vision?.title),
          description: cleanString(data.visionMission?.vision?.description),
          icon: cleanString(data.visionMission?.vision?.icon || 'fas fa-eye'),
        },
        mission: {
          title: cleanString(data.visionMission?.mission?.title),
          description: cleanString(data.visionMission?.mission?.description),
          icon: cleanString(data.visionMission?.mission?.icon || 'fas fa-bullseye'),
          bullets: (Array.isArray(data.visionMission?.mission?.bullets) ? data.visionMission.mission.bullets : []).map(cleanString).filter(Boolean),
        },
      },
      coreValues: {
        visible: cleanBool(data.coreValues?.visible),
        eyebrow: cleanString(data.coreValues?.eyebrow),
        title: cleanString(data.coreValues?.title || data.coreValues?.heading),
        description: cleanString(data.coreValues?.description),
        items: (Array.isArray(data.coreValues?.items) ? data.coreValues.items : []).map((v, i) => ({
          title: cleanString(v.title),
          description: cleanString(v.description),
          icon: cleanString(v.icon || 'fas fa-lightbulb'),
          order: cleanNum(v.order, i),
          visible: cleanBool(v.visible),
        })),
      },
      teamStructure: {
        visible: cleanBool(data.teamStructure?.visible),
        eyebrow: cleanString(data.teamStructure?.eyebrow),
        title: cleanString(data.teamStructure?.title || data.teamStructure?.heading),
        description: cleanString(data.teamStructure?.description),
        nodes: (Array.isArray(data.teamStructure?.nodes) ? data.teamStructure.nodes : []).map((n, i) => ({
          title: cleanString(n.title),
          linkUrl: cleanString(n.linkUrl || 'team.html'),
          level: cleanNum(n.level, i + 1),
          order: cleanNum(n.order, i),
          visible: cleanBool(n.visible),
        })),
      },
      departments: {
        visible: cleanBool(data.departments?.visible),
        eyebrow: cleanString(data.departments?.eyebrow),
        title: cleanString(data.departments?.title || data.departments?.heading),
        description: cleanString(data.departments?.description),
        items: (Array.isArray(data.departments?.items) ? data.departments.items : []).map((d, i) => ({
          name: cleanString(d.name),
          icon: cleanString(d.icon || 'fas fa-cogs'),
          teamLead: cleanString(d.teamLead || 'Team Lead'),
          responsibilities: (Array.isArray(d.responsibilities) ? d.responsibilities : []).map(cleanString).filter(Boolean),
          order: cleanNum(d.order, i),
          visible: cleanBool(d.visible),
        })),
      },
      process: {
        visible: cleanBool(data.process?.visible),
        eyebrow: cleanString(data.process?.eyebrow),
        title: cleanString(data.process?.title || data.process?.heading),
        description: cleanString(data.process?.description),
        stages: (Array.isArray(data.process?.stages) ? data.process.stages : []).map((st, i) => ({
          stepNumber: cleanString(st.stepNumber || ('0' + (i + 1))),
          name: cleanString(st.name || st.title),
          description: cleanString(st.description || st.details),
          order: cleanNum(st.order, i),
          visible: cleanBool(st.visible),
        })),
      },
      formulaBharat: {
        visible: cleanBool(data.formulaBharat?.visible),
        eyebrow: cleanString(data.formulaBharat?.eyebrow),
        title: cleanString(data.formulaBharat?.title || data.formulaBharat?.heading),
        description: cleanString(data.formulaBharat?.description),
        imageUrl: cleanUrl(data.formulaBharat?.imageUrl || data.formulaBharat?.image),
        altText: cleanString(data.formulaBharat?.altText),
        facts: (Array.isArray(data.formulaBharat?.facts) ? data.formulaBharat.facts : []).map((f, i) => ({
          label: cleanString(f.label),
          order: cleanNum(f.order, i),
          visible: cleanBool(f.visible),
        })),
      },
      workshop: {
        visible: cleanBool(data.workshop?.visible),
        eyebrow: cleanString(data.workshop?.eyebrow),
        title: cleanString(data.workshop?.title || data.workshop?.heading),
        description: cleanString(data.workshop?.description),
        items: (Array.isArray(data.workshop?.items) ? data.workshop.items : []).map((ws, i) => ({
          title: cleanString(ws.title),
          icon: cleanString(ws.icon || 'fas fa-tools'),
          imageUrl: cleanUrl(ws.imageUrl || ws.image),
          order: cleanNum(ws.order, i),
          visible: cleanBool(ws.visible),
        })),
      },
      peopleMessages: {
        visible: cleanBool(data.peopleMessages?.visible),
        eyebrow: cleanString(data.peopleMessages?.eyebrow),
        title: cleanString(data.peopleMessages?.title || data.peopleMessages?.heading),
        description: cleanString(data.peopleMessages?.description),
        messages: (Array.isArray(data.peopleMessages?.messages) ? data.peopleMessages.messages : []).map((m, i) => ({
          name: cleanString(m.name || m.personName),
          role: cleanString(m.role),
          quote: cleanString(m.quote),
          photoUrl: cleanUrl(m.photoUrl || m.photo),
          linkedinUrl: cleanUrl(m.linkedinUrl || m.linkedin),
          order: cleanNum(m.order, i),
          visible: cleanBool(m.visible),
        })),
      },
      whyJoin: {
        visible: cleanBool(data.whyJoin?.visible),
        eyebrow: cleanString(data.whyJoin?.eyebrow),
        title: cleanString(data.whyJoin?.title || data.whyJoin?.heading),
        description: cleanString(data.whyJoin?.description),
        skills: (Array.isArray(data.whyJoin?.skills) ? data.whyJoin.skills : []).map((sk, i) => ({
          name: cleanString(sk.name),
          order: cleanNum(sk.order, i),
          visible: cleanBool(sk.visible),
        })),
      },
      cta: {
        visible: cleanBool(data.cta?.visible),
        eyebrow: cleanString(data.cta?.eyebrow),
        title: cleanString(data.cta?.title || data.cta?.heading),
        description: cleanString(data.cta?.description),
        primaryBtnText: cleanString(data.cta?.primaryBtnText),
        primaryBtnUrl: cleanString(data.cta?.primaryBtnUrl),
        secondaryBtnText: cleanString(data.cta?.secondaryBtnText),
        secondaryBtnUrl: cleanString(data.cta?.secondaryBtnUrl),
      },
    };
  }

  function formatErrorMessage(err) {
    if (err && (err.status === 413 || (err.message && (err.message.includes('413') || err.message.toLowerCase().includes('entity too large'))))) {
      return 'Publish payload is too large. Media files must be uploaded separately and only their URLs should be included in the About page content.';
    }
    return err?.message || 'Operation failed.';
  }

  async function handleSaveDraft() {
    try {
      updateSaveStatus('saving');
      const payload = serializeAboutForPublish(currentAboutData);
      const payloadSize = new Blob([JSON.stringify(payload)]).size;
      const payloadSizeKb = (payloadSize / 1024).toFixed(2);
      console.log(`[ABOUT CMS] Save draft payload size: ${payloadSizeKb} KB`);

      if (payloadSize > 250 * 1024) {
        Toast().error(`About page draft is unusually large (${payloadSizeKb} KB). Check media fields — ensure images are uploaded to Cloudinary, not embedded as base64.`);
        updateSaveStatus('dirty');
        return;
      }

      const res = await API().patch('/admin/about', payload);
      if (res && res.success) {
        originalAboutData = JSON.parse(JSON.stringify(res.data || payload));
        updateSaveStatus('saved');
        Toast().success('Draft saved successfully!');
      } else {
        throw new Error(res?.message || 'Failed to save draft');
      }
    } catch (err) {
      console.error('Save draft error:', err);
      updateSaveStatus('dirty');
      Toast().error('Save draft failed: ' + formatErrorMessage(err));
    }
  }

  async function handlePublish() {
    try {
      updateSaveStatus('saving');
      const payload = serializeAboutForPublish(currentAboutData);
      const payloadSize = new Blob([JSON.stringify(payload)]).size;
      const payloadSizeKb = (payloadSize / 1024).toFixed(2);
      console.log(`[ABOUT CMS] Publish payload size: ${payloadSizeKb} KB`);

      if (payloadSize > 250 * 1024) {
        Toast().error(`About page draft is unusually large (${payloadSizeKb} KB). Check media fields — ensure images are uploaded to Cloudinary, not embedded as base64.`);
        updateSaveStatus('dirty');
        return;
      }

      // 1. Sync serialized clean draft first
      const draftRes = await API().patch('/admin/about', payload);
      if (!draftRes || !draftRes.success) {
        throw new Error(draftRes?.message || 'Draft sync failed prior to publish');
      }

      // 2. Publish
      const res = await API().post('/admin/about/publish', {});
      if (res && res.success) {
        originalAboutData = JSON.parse(JSON.stringify(payload));
        currentAboutData.status = 'published';
        updateSaveStatus('saved');
        const badge = document.getElementById('aboutStatusBadge');
        if (badge) {
          badge.className = 'badge badge-success';
          badge.textContent = 'LIVE / PUBLISHED';
        }
        Toast().success('About Page published live successfully!');
      } else {
        throw new Error(res?.message || 'Publishing failed');
      }
    } catch (err) {
      console.error('Publish error:', err);
      updateSaveStatus('dirty');
      Toast().error('Publishing failed: ' + formatErrorMessage(err));
    }
  }

  function handleReset() {
    if (originalAboutData) {
      currentAboutData = JSON.parse(JSON.stringify(originalAboutData));
      normalizeData();
      updateSaveStatus('saved');
      renderInterface(document.getElementById('adminContent'));
      Toast().info('Changes reset to last saved state.');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  return {
    renderAboutModule,
    toggleSection,
    updateSectionVisibility,
    updateField,
    updateMultiFields,
    addArrayItem,
    removeArrayItem,
    triggerFileUpload
  };
})();
