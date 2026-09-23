/* ============================================================
   car.js — Unified Car Page Control Center
   ASHWA RIDERS Formula Student Electric Team

   Structure:
     01. HEADER CONTROL BAR (Draft / Publish / Preview / Versioning)
     02. BLOCK 01: CAR EXPERIENCE (5 STAGES & CANVAS SETTINGS)
     03. BLOCK 02: VEHICLE VALUES / KEY SPECIFICATIONS STRIP
     04. BLOCK 03: ENGINEERING SYSTEMS (TABS, SUBSYSTEM CARDS & SPECS)
     05. BLOCK 04: THE BUILD JOURNEY (HORIZONTAL TIMELINE PHASES)
     06. BLOCK 05: VISUAL BREAKDOWN (IN THE DETAILS MASONRY GRID)
     07. BLOCK 06: OPEN POSITIONS (RECRUITMENT CTA BANNER)
     08. BLOCK 07: GLOBAL FOOTER SYNCHRONIZATION REFERENCE

   Draft / Preview / Publish lifecycle with lightweight JSON only.
============================================================ */

(function () {
  'use strict';

  let currentData = null;
  let isDirty = false;
  let isSaving = false;
  let activeEngTabId = 'chassis';

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
  async function renderCarModule(container) {
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:360px; color:#9696A0;">
        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-right:12px; color:#F25912;"></i>
        <span style="font-family:monospace; font-size:0.95rem;">Loading Car Page Control Center...</span>
      </div>
    `;

    await loadCarData(container);
  }

  async function loadCarData(container) {
    try {
      const res = await API().get('/admin/car/page');
      if (res && res.success && res.data) {
        currentData = res.data;
        normalizeData();
        renderInterface(container);
        isDirty = false;
        updateSaveBadge('saved');
      } else {
        throw new Error(res?.message || 'Failed to load Car page data.');
      }
    } catch (err) {
      console.error('Error loading Car CMS data:', err);
      container.innerHTML = `
        <div style="background:#141419; border:1px solid #FF4D4D; border-radius:12px; padding:40px; text-align:center; max-width:600px; margin:40px auto;">
          <i class="fas fa-triangle-exclamation" style="font-size:2.5rem; color:#FF4D4D; margin-bottom:16px;"></i>
          <h2 style="font-size:1.25rem; font-weight:800; color:#FFFFFF; margin-bottom:8px;">Unable to Load Car Control Center</h2>
          <p style="color:#9696A0; font-size:0.9rem; margin-bottom:24px;">${escapeHtml(err.message)}</p>
          <button type="button" class="btn btn-primary" id="retryCarLoadBtn" style="background:#F25912; border-color:#F25912;">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
      document.getElementById('retryCarLoadBtn')?.addEventListener('click', () => loadCarData(container));
    }
  }

  function normalizeData() {
    if (!currentData) return;
    currentData.settings = currentData.settings || {};

    // 01. CAR EXPERIENCE
    currentData.carExperience = currentData.carExperience || {};
    currentData.carExperience.stages = currentData.carExperience.stages || [];
    currentData.carExperience.totalFrames = currentData.carExperience.totalFrames || 240;
    currentData.carExperience.framePattern = currentData.carExperience.framePattern || 'assets/videotophoto/ezgif-frame-{num}.jpg';

    // 02. KEY SPECS
    currentData.keySpecs = currentData.keySpecs || [];

    // 03. ENGINEERING SYSTEMS
    currentData.engineeringSection = currentData.engineeringSection || {};
    currentData.engineeringSection.categories = currentData.engineeringSection.categories || [];
    currentData.engineeringSection.heading = currentData.engineeringSection.heading || 'Built for Performance';
    currentData.engineeringSection.headingHighlight = currentData.engineeringSection.headingHighlight || 'Performance';
    currentData.engineeringSection.eyebrow = currentData.engineeringSection.eyebrow || 'Engineering Systems';
    currentData.engineeringSection.watermarkText = currentData.engineeringSection.watermarkText || 'TECH';

    // 04. BUILD JOURNEY
    currentData.buildJourneySection = currentData.buildJourneySection || {};
    currentData.buildJourneySection.phases = currentData.buildJourneySection.phases || [];
    currentData.buildJourneySection.heading = currentData.buildJourneySection.heading || 'The Build Journey';
    currentData.buildJourneySection.headingHighlight = currentData.buildJourneySection.headingHighlight || 'Journey';
    currentData.buildJourneySection.eyebrow = currentData.buildJourneySection.eyebrow || 'From Concept to Circuit';

    // 05. VISUAL BREAKDOWN
    currentData.visualBreakdownSection = currentData.visualBreakdownSection || {};
    currentData.visualBreakdownSection.cards = currentData.visualBreakdownSection.cards || [];
    currentData.visualBreakdownSection.heading = currentData.visualBreakdownSection.heading || 'In the Details';
    currentData.visualBreakdownSection.headingHighlight = currentData.visualBreakdownSection.headingHighlight || 'Details';
    currentData.visualBreakdownSection.eyebrow = currentData.visualBreakdownSection.eyebrow || 'Visual Breakdown';

    // 06. OPEN POSITIONS
    currentData.openPositionsSection = currentData.openPositionsSection || {};
    currentData.openPositionsSection.heading = currentData.openPositionsSection.heading || 'Want to Build the Next Machine?';
    currentData.openPositionsSection.headingHighlight = currentData.openPositionsSection.headingHighlight || 'Next Machine?';
    currentData.openPositionsSection.eyebrow = currentData.openPositionsSection.eyebrow || 'Open Positions';
    currentData.openPositionsSection.primaryCta = currentData.openPositionsSection.primaryCta || { text: 'Join the Team', link: 'index.html#recruitment', enabled: true };
    currentData.openPositionsSection.secondaryCta = currentData.openPositionsSection.secondaryCta || { text: 'Get in Touch', link: 'contact.html', enabled: true };
  }

  // ============================================================
  //  RENDER MAIN INTERFACE
  // ============================================================
  function renderInterface(container) {
    const exp = currentData.carExperience || {};
    const stages = exp.stages || [];
    const keySpecs = currentData.keySpecs || [];
    const eng = currentData.engineeringSection || {};
    const categories = eng.categories || [];
    const build = currentData.buildJourneySection || {};
    const phases = build.phases || [];
    const visual = currentData.visualBreakdownSection || {};
    const visualCards = visual.cards || [];
    const openPos = currentData.openPositionsSection || {};

    const isPublished = currentData.status === 'published';
    const versionNum = currentData.version || 1;
    const lastPub = formatDate(currentData.lastPublishedAt);
    const lastEdit = formatDate(currentData.lastEditedAt || currentData.updatedAt);

    container.innerHTML = `
      <div class="car-cms-root" style="max-width:1440px; margin:0 auto; padding-bottom:80px;">
        
        <!-- HEADER CONTROL BAR -->
        <div style="background:#141419; border:1px solid #242430; border-radius:12px; padding:20px 24px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
          <div>
            <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
              <h1 style="font-size:1.4rem; font-weight:800; color:#FFFFFF; margin:0; letter-spacing:-0.02em;">
                Car Page Control Center
              </h1>
              <span style="font-family:monospace; font-size:0.75rem; padding:3px 8px; border-radius:4px; font-weight:700; background:${isPublished ? 'rgba(46,164,79,0.15)' : 'rgba(227,179,65,0.15)'}; color:${isPublished ? '#2EA44F' : '#E3B341'}; border:1px solid ${isPublished ? 'rgba(46,164,79,0.3)' : 'rgba(227,179,65,0.3)'};">
                ${isPublished ? 'PUBLISHED' : 'DRAFT'}
              </span>
              <span style="font-family:monospace; font-size:0.75rem; padding:3px 8px; border-radius:4px; font-weight:700; background:#1C1C24; color:#8E929E; border:1px solid #2D2D3B;">
                v${versionNum}
              </span>
            </div>
            <p style="color:#8E929E; font-size:0.85rem; margin:0;">
              Manage 3D car stages, telemetry stats, engineering tabs &amp; cards, build journey, visual breakdown, and recruitment CTA.
            </p>
          </div>

          <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
            <!-- Save Status Dot -->
            <div id="carSaveBadge" style="display:flex; align-items:center; gap:6px; background:#0B0B0E; padding:6px 12px; border-radius:6px; border:1px solid #242430; font-family:monospace; font-size:0.78rem;">
              <span id="carSaveDot" style="width:8px; height:8px; border-radius:50%; background:#2EA44F;"></span>
              <span id="carSaveText" style="color:#8E929E;">All changes saved</span>
            </div>

            <!-- Action Buttons -->
            <button type="button" class="btn btn-secondary" id="btnCarSaveDraft" style="font-size:0.85rem; padding:8px 16px;">
              <i class="fas fa-save" style="margin-right:6px;"></i> Save Draft
            </button>
            <a href="/car.html?preview=true" target="_blank" class="btn btn-secondary" id="btnCarPreview" style="font-size:0.85rem; padding:8px 16px; text-decoration:none; display:inline-flex; align-items:center;">
              <i class="fas fa-eye" style="margin-right:6px;"></i> Preview
            </a>
            <button type="button" class="btn btn-primary" id="btnCarPublish" style="font-size:0.85rem; padding:8px 18px; background:#F25912; border-color:#F25912;">
              <i class="fas fa-paper-plane" style="margin-right:6px;"></i> Publish Live
            </button>
          </div>
        </div>

        <!-- METADATA STRIP -->
        <div style="display:flex; justify-content:space-between; align-items:center; background:#0E0E12; border:1px solid #1C1C24; border-radius:8px; padding:8px 16px; margin-bottom:24px; font-size:0.78rem; color:#8E929E; font-family:monospace;">
          <div><i class="fas fa-clock" style="margin-right:6px; color:#F25912;"></i> Last Published: <span style="color:#ECECF1;">${lastPub}</span></div>
          <div><i class="fas fa-pencil-alt" style="margin-right:6px;"></i> Last Edited: <span style="color:#ECECF1;">${lastEdit}</span></div>
          <div><i class="fas fa-cube" style="margin-right:6px; color:#2EA44F;"></i> Canvas Frames: <span style="color:#ECECF1;">240</span></div>
        </div>

        <!-- SECTIONS ACCORDION / STACK -->
        <div style="display:flex; flex-direction:column; gap:24px;">

          <!-- ======================================================== -->
          <!-- 01. CAR EXPERIENCE (5 SCROLLING STAGES & CANVAS ENGINE) -->
          <!-- ======================================================== -->
          <div class="cms-block-card" style="background:#141419; border:1px solid #242430; border-radius:12px; overflow:hidden;">
            <div class="cms-block-header" style="padding:18px 24px; background:#181820; border-bottom:1px solid #242430; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-toggle="block-stages">
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-family:monospace; font-size:0.75rem; background:rgba(242,89,18,0.15); color:#F25912; padding:3px 8px; border-radius:4px; font-weight:800;">BLOCK 01</span>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0;">Car Experience — Scroll Deassembly Stages</h3>
                  <span style="font-size:0.78rem; color:#8E929E;">240-frame canvas animation: define scroll ranges, HUD labels, headings &amp; telemetry stats per stage</span>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-family:monospace; font-size:0.75rem; background:#242430; color:#ECECF1; padding:4px 10px; border-radius:4px;">
                  ${stages.length} stages
                </span>
                <i class="fas fa-chevron-down block-chevron" style="color:#8E929E; transition:transform 0.2s ease;"></i>
              </div>
            </div>

            <div class="cms-block-body" id="block-stages" style="padding:22px; display:flex; flex-direction:column; gap:20px;">

              <!-- ── CANVAS ENGINE CONFIG ROW ── -->
              <div style="background:#0E0E12; border:1px solid #1C1C24; border-radius:8px; padding:14px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                  <i class="fas fa-film" style="color:#F25912;"></i>
                  <span style="font-size:0.78rem; font-weight:800; text-transform:uppercase; letter-spacing:0.07em; color:#ECECF1;">3D Canvas Frame Engine</span>
                  <span style="font-size:0.68rem; color:#8E929E; font-family:monospace; margin-left:4px;">— controls the {num} placeholder in frame path</span>
                </div>
                <div style="display:grid; grid-template-columns:120px 1fr auto; gap:12px; align-items:center;">
                  <div>
                    <label style="display:block; font-size:0.68rem; font-weight:700; color:#8E929E; text-transform:uppercase; margin-bottom:4px;">Total Frames</label>
                    <input type="number" id="carTotalFrames" class="cms-input" value="${exp.totalFrames || 240}" min="1" max="999"
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:7px 10px; color:#ECECF1; font-size:0.88rem; font-family:monospace; font-weight:700;" />
                  </div>
                  <div>
                    <label style="display:block; font-size:0.68rem; font-weight:700; color:#8E929E; text-transform:uppercase; margin-bottom:4px;">Frame Filename Pattern</label>
                    <input type="text" id="carFramePattern" class="cms-input" value="${escapeHtml(exp.framePattern || 'assets/videotophoto/ezgif-frame-{num}.jpg')}"
                      style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:7px 10px; color:#ECECF1; font-size:0.82rem; font-family:monospace;" />
                  </div>
                  <div style="display:flex; align-items:center; gap:7px; padding-top:18px;">
                    <input type="checkbox" id="carExpVisible" ${exp.visible !== false ? 'checked' : ''} style="accent-color:#F25912; width:15px; height:15px; cursor:pointer;" />
                    <label for="carExpVisible" style="font-size:0.8rem; font-weight:700; color:#ECECF1; cursor:pointer;">Visible</label>
                  </div>
                </div>
              </div>

              <!-- ── VISUAL SCROLL TIMELINE ── -->
              <div style="background:#0B0B0E; border:1px solid #242430; border-radius:8px; padding:14px 16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                  <span style="font-size:0.72rem; font-weight:800; color:#8E929E; text-transform:uppercase; letter-spacing:0.07em;">
                    <i class="fas fa-scroll" style="margin-right:6px; color:#F25912;"></i>Scroll → Disassembly Progress Map
                  </span>
                  <span style="font-size:0.68rem; color:#6B6F7B; font-family:monospace;">0% scroll ──────── 100% scroll</span>
                </div>
                <!-- Timeline bar -->
                <div id="scrollTimelineBar" style="position:relative; height:36px; background:#141419; border:1px solid #1C1C24; border-radius:6px; overflow:hidden;">
                  ${renderScrollTimeline(stages, exp.totalFrames || 240)}
                </div>
                <!-- Stage labels below timeline -->
                <div id="scrollTimelineLabels" style="position:relative; margin-top:4px; height:18px;">
                  ${renderScrollTimelineLabels(stages)}
                </div>
              </div>

              <!-- ── STAGES ACCORDION LIST ── -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:-6px;">
                <span style="font-size:0.72rem; font-weight:800; color:#8E929E; text-transform:uppercase; letter-spacing:0.07em;">
                  <i class="fas fa-layer-group" style="margin-right:6px; color:#F25912;"></i>Stage Editor Cards
                </span>
                <button type="button" id="btnAddStageBtn" class="btn btn-secondary btn-sm" style="font-size:0.75rem; padding:4px 12px; border-color:#3A3A4C;">
                  <i class="fas fa-plus"></i> Add Stage
                </button>
              </div>

              <div id="stagesListContainer" style="display:flex; flex-direction:column; gap:10px;">
                ${renderStagesList(stages, exp.totalFrames || 240)}
              </div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- 02. VEHICLE VALUES / KEY SPECIFICATIONS -->
          <!-- ======================================================== -->
          <div class="cms-block-card" style="background:#141419; border:1px solid #242430; border-radius:12px; overflow:hidden;">
            <div class="cms-block-header" style="padding:18px 24px; background:#181820; border-bottom:1px solid #242430; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-toggle="block-keyspecs">
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-family:monospace; font-size:0.75rem; background:rgba(242,89,18,0.15); color:#F25912; padding:3px 8px; border-radius:4px; font-weight:800;">
                  BLOCK 02
                </span>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0;">
                    Vehicle Values / Key Specifications Strip
                  </h3>
                  <span style="font-size:0.78rem; color:#8E929E;">
                    High-impact horizontal counter strip (Peak Power, 0–100 Sprint, Downforce, Vehicle Weight)
                  </span>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:12px;">
                <button type="button" class="btn btn-secondary btn-sm" id="btnAddKeySpecBtn" style="font-size:0.78rem; padding:4px 12px; border-color:#3A3A4C;">
                  <i class="fas fa-plus"></i> Add Spec
                </button>
                <i class="fas fa-chevron-down block-chevron" style="color:#8E929E; transition:transform 0.2s ease;"></i>
              </div>
            </div>

            <div class="cms-block-body" id="block-keyspecs" style="padding:22px; display:flex; flex-direction:column; gap:16px;">
              <div id="keySpecsContainer" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
                ${renderKeySpecsList(keySpecs)}
              </div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- 03. ENGINEERING SYSTEMS -->
          <!-- ======================================================== -->
          <div class="cms-block-card" style="background:#141419; border:1px solid #242430; border-radius:12px; overflow:hidden;">
            <div class="cms-block-header" style="padding:18px 24px; background:#181820; border-bottom:1px solid #242430; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-toggle="block-eng">
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-family:monospace; font-size:0.75rem; background:rgba(242,89,18,0.15); color:#F25912; padding:3px 8px; border-radius:4px; font-weight:800;">
                  BLOCK 03
                </span>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0;">
                    Engineering Systems (Tabs, Subsystems &amp; Tech Specs)
                  </h3>
                  <span style="font-size:0.78rem; color:#8E929E;">
                    Subsystems categorized by tabs: Chassis, Suspension, Aerodynamics, Electronics, AI &amp; Data
                  </span>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:12px;">
                <span class="badge" style="background:#242430; color:#ECECF1; font-family:monospace; font-size:0.75rem; padding:4px 10px; border-radius:4px;">
                  ${categories.length} Tabs
                </span>
                <i class="fas fa-chevron-down block-chevron" style="color:#8E929E; transition:transform 0.2s ease;"></i>
              </div>
            </div>

            <div class="cms-block-body" id="block-eng" style="padding:22px; display:flex; flex-direction:column; gap:20px;">
              <!-- Header text inputs -->
              <div style="display:grid; grid-template-columns:1fr 2fr; gap:14px;">
                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Eyebrow</label>
                  <input type="text" id="engEyebrow" class="cms-input" value="${escapeHtml(eng.eyebrow || 'Engineering Systems')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                </div>
                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Heading *</label>
                  <input type="text" id="engHeading" class="cms-input" value="${escapeHtml(eng.heading || 'Built for Performance')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-weight:700;" />
                </div>
              </div>

              <div style="display:grid; grid-template-columns:3fr 1fr; gap:14px;">
                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Description</label>
                  <input type="text" id="engDescription" class="cms-input" value="${escapeHtml(eng.description || 'Every vehicle subsystem is engineered to operate in total harmony at race speed.')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                </div>
                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Watermark Text</label>
                  <input type="text" id="engWatermark" class="cms-input" value="${escapeHtml(eng.watermarkText || 'TECH')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-family:monospace;" />
                </div>
              </div>

              <!-- Categories Navigation Bar -->
              <div style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:12px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div id="engCategoryTabsList" style="display:flex; gap:8px; flex-wrap:wrap;">
                  ${renderCategoryTabs(categories)}
                </div>
                <button type="button" class="btn btn-secondary btn-sm" id="btnAddCategoryTabBtn" style="font-size:0.78rem; padding:5px 12px; border-color:#3A3A4C;">
                  <i class="fas fa-folder-plus"></i> New Tab
                </button>
              </div>

              <!-- Active Tab Content Editor -->
              <div id="activeCategoryContentContainer">
                ${renderActiveCategoryPanel(categories)}
              </div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- 04. THE BUILD JOURNEY -->
          <!-- ======================================================== -->
          <div class="cms-block-card" style="background:#141419; border:1px solid #242430; border-radius:12px; overflow:hidden;">
            <div class="cms-block-header" style="padding:18px 24px; background:#181820; border-bottom:1px solid #242430; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-toggle="block-build">
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-family:monospace; font-size:0.75rem; background:rgba(242,89,18,0.15); color:#F25912; padding:3px 8px; border-radius:4px; font-weight:800;">
                  BLOCK 04
                </span>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0;">
                    The Build Journey (Concept to Circuit Timeline)
                  </h3>
                  <span style="font-size:0.78rem; color:#8E929E;">
                    Chronological horizontal milestones (Concept, CAD, Fabrication, Electronics, Testing, Race Day)
                  </span>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:12px;">
                <button type="button" class="btn btn-secondary btn-sm" id="btnAddBuildPhaseBtn" style="font-size:0.78rem; padding:4px 12px; border-color:#3A3A4C;">
                  <i class="fas fa-plus"></i> Add Phase
                </button>
                <i class="fas fa-chevron-down block-chevron" style="color:#8E929E; transition:transform 0.2s ease;"></i>
              </div>
            </div>

            <div class="cms-block-body" id="block-build" style="padding:22px; display:flex; flex-direction:column; gap:20px;">
              <div style="display:grid; grid-template-columns:1fr 2fr; gap:14px;">
                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Eyebrow</label>
                  <input type="text" id="buildEyebrow" class="cms-input" value="${escapeHtml(build.eyebrow || 'From Concept to Circuit')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                </div>
                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Heading</label>
                  <input type="text" id="buildHeading" class="cms-input" value="${escapeHtml(build.heading || 'The Build Journey')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-weight:700;" />
                </div>
              </div>

              <div class="cms-field">
                <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Description</label>
                <textarea id="buildDescription" rows="2" class="cms-input" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; resize:vertical;">${escapeHtml(build.description || 'Ashwa-3 was designed, fabricated, and tested entirely by our student engineering team over 14 months.')}</textarea>
              </div>

              <!-- Phases List -->
              <div id="buildPhasesContainer" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:14px;">
                ${renderBuildPhasesList(phases)}
              </div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- 05. VISUAL BREAKDOWN -->
          <!-- ======================================================== -->
          <div class="cms-block-card" style="background:#141419; border:1px solid #242430; border-radius:12px; overflow:hidden;">
            <div class="cms-block-header" style="padding:18px 24px; background:#181820; border-bottom:1px solid #242430; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-toggle="block-visual">
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-family:monospace; font-size:0.75rem; background:rgba(242,89,18,0.15); color:#F25912; padding:3px 8px; border-radius:4px; font-weight:800;">
                  BLOCK 05
                </span>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0;">
                    Visual Breakdown (In the Details Masonry Grid)
                  </h3>
                  <span style="font-size:0.78rem; color:#8E929E;">
                    High-resolution masonry grid of precision components (Front Aero Wing, Monocoque, Battery, Diffuser, Suspension)
                  </span>
                </div>
              </div>
              <div style="display:flex; align-items:center; gap:12px;">
                <button type="button" class="btn btn-secondary btn-sm" id="btnAddVisualCardBtn" style="font-size:0.78rem; padding:4px 12px; border-color:#3A3A4C;">
                  <i class="fas fa-plus"></i> Add Photo Card
                </button>
                <i class="fas fa-chevron-down block-chevron" style="color:#8E929E; transition:transform 0.2s ease;"></i>
              </div>
            </div>

            <div class="cms-block-body" id="block-visual" style="padding:22px; display:flex; flex-direction:column; gap:20px;">
              <div style="display:grid; grid-template-columns:1fr 2fr; gap:14px;">
                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Eyebrow</label>
                  <input type="text" id="visualEyebrow" class="cms-input" value="${escapeHtml(visual.eyebrow || 'Visual Breakdown')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                </div>
                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Heading</label>
                  <input type="text" id="visualHeading" class="cms-input" value="${escapeHtml(visual.heading || 'In the Details')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-weight:700;" />
                </div>
              </div>

              <!-- Visual Cards List -->
              <div id="visualCardsContainer" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:14px;">
                ${renderVisualCardsList(visualCards)}
              </div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- 06. OPEN POSITIONS (RECRUITMENT CTA) -->
          <!-- ======================================================== -->
          <div class="cms-block-card" style="background:#141419; border:1px solid #242430; border-radius:12px; overflow:hidden;">
            <div class="cms-block-header" style="padding:18px 24px; background:#181820; border-bottom:1px solid #242430; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-toggle="block-cta">
              <div style="display:flex; align-items:center; gap:12px;">
                <span style="font-family:monospace; font-size:0.75rem; background:rgba(242,89,18,0.15); color:#F25912; padding:3px 8px; border-radius:4px; font-weight:800;">
                  BLOCK 06
                </span>
                <div>
                  <h3 style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0;">
                    Open Positions (Recruitment CTA Banner)
                  </h3>
                  <span style="font-size:0.78rem; color:#8E929E;">
                    High-contrast recruitment invitation banner with primary and secondary call-to-actions
                  </span>
                </div>
              </div>
              <i class="fas fa-chevron-down block-chevron" style="color:#8E929E; transition:transform 0.2s ease;"></i>
            </div>

            <div class="cms-block-body" id="block-cta" style="padding:22px; display:flex; flex-direction:column; gap:20px;">
              <div style="display:grid; grid-template-columns:1fr 2fr; gap:14px;">
                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Eyebrow</label>
                  <input type="text" id="ctaEyebrow" class="cms-input" value="${escapeHtml(openPos.eyebrow || 'Open Positions')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                </div>
                <div class="cms-field">
                  <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Heading</label>
                  <input type="text" id="ctaHeading" class="cms-input" value="${escapeHtml(openPos.heading || 'Want to Build the Next Machine?')}" 
                    style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-weight:700;" />
                </div>
              </div>

              <div class="cms-field">
                <label style="display:block; font-size:0.72rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:4px;">Description</label>
                <textarea id="ctaDescription" rows="2" class="cms-input" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; resize:vertical;">${escapeHtml(openPos.description || 'Join our team of engineers and help design, build, and race the next generation of Ashwa Formula cars.')}</textarea>
              </div>

              <!-- CTA Buttons config -->
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                <div style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:14px;">
                  <span style="font-size:0.78rem; font-weight:700; color:#F25912; text-transform:uppercase; display:block; margin-bottom:10px;">Primary Button</span>
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;">
                    <div>
                      <label style="display:block; font-size:0.7rem; color:#8E929E; margin-bottom:3px;">Text</label>
                      <input type="text" id="ctaPrimaryText" class="cms-input" value="${escapeHtml(openPos.primaryCta?.text || 'Join the Team')}" 
                        style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:6px 10px; color:#fff; font-size:0.82rem;" />
                    </div>
                    <div>
                      <label style="display:block; font-size:0.7rem; color:#8E929E; margin-bottom:3px;">URL</label>
                      <input type="text" id="ctaPrimaryLink" class="cms-input" value="${escapeHtml(openPos.primaryCta?.link || 'index.html#recruitment')}" 
                        style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:6px 10px; color:#fff; font-size:0.82rem;" />
                    </div>
                  </div>
                  <label style="display:inline-flex; align-items:center; gap:6px; font-size:0.75rem; color:#ECECF1; cursor:pointer;">
                    <input type="checkbox" id="ctaPrimaryEnabled" ${openPos.primaryCta?.enabled !== false ? 'checked' : ''} style="accent-color:#F25912;" /> Enabled
                  </label>
                </div>

                <div style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:14px;">
                  <span style="font-size:0.78rem; font-weight:700; color:#ECECF1; text-transform:uppercase; display:block; margin-bottom:10px;">Secondary Button</span>
                  <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:8px;">
                    <div>
                      <label style="display:block; font-size:0.7rem; color:#8E929E; margin-bottom:3px;">Text</label>
                      <input type="text" id="ctaSecondaryText" class="cms-input" value="${escapeHtml(openPos.secondaryCta?.text || 'Get in Touch')}" 
                        style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:6px 10px; color:#fff; font-size:0.82rem;" />
                    </div>
                    <div>
                      <label style="display:block; font-size:0.7rem; color:#8E929E; margin-bottom:3px;">URL</label>
                      <input type="text" id="ctaSecondaryLink" class="cms-input" value="${escapeHtml(openPos.secondaryCta?.link || 'contact.html')}" 
                        style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:6px 10px; color:#fff; font-size:0.82rem;" />
                    </div>
                  </div>
                  <label style="display:inline-flex; align-items:center; gap:6px; font-size:0.75rem; color:#ECECF1; cursor:pointer;">
                    <input type="checkbox" id="ctaSecondaryEnabled" ${openPos.secondaryCta?.enabled !== false ? 'checked' : ''} style="accent-color:#F25912;" /> Enabled
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- ======================================================== -->
          <!-- 07. GLOBAL FOOTER REFERENCE -->
          <!-- ======================================================== -->
          <div style="background:#0E0E12; border:1px dashed #242430; border-radius:12px; padding:20px 24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <div style="display:flex; align-items:center; gap:12px;">
              <div style="width:40px; height:40px; border-radius:8px; background:#181820; display:flex; align-items:center; justify-content:center; color:#8E929E;">
                <i class="fas fa-link"></i>
              </div>
              <div>
                <h4 style="font-size:0.95rem; font-weight:700; color:#FFFFFF; margin:0 0 2px 0;">Global Shared Footer</h4>
                <p style="color:#8E929E; font-size:0.8rem; margin:0;">
                  The Car page inherits the site-wide footer branding, contact details, and social links.
                </p>
              </div>
            </div>
            <a href="/admin/#/navigation" class="btn btn-secondary btn-sm" style="font-size:0.8rem; padding:6px 14px; text-decoration:none;">
              <i class="fas fa-external-link-alt" style="margin-right:6px;"></i> Manage Global Footer
            </a>
          </div>

        </div>

        <!-- MODAL WRAPPER -->
        <div id="carModalWrap"></div>

      </div>
    `;

    bindInterfaceEvents(container);
  }

  // ============================================================
  //  SUB-LIST HTML GENERATORS
  // ============================================================

  // ── Stage colours (cyclic, 5 default stages) ──
  const STAGE_COLORS = ['#F25912', '#3B8BEB', '#2EA44F', '#E3B341', '#A371F7'];

  function stageColor(idx) {
    return STAGE_COLORS[idx % STAGE_COLORS.length];
  }

  // ── Scroll timeline bar (segments) ──
  function renderScrollTimeline(stages, totalFrames) {
    if (!stages || stages.length === 0) {
      return `<div style="display:flex; align-items:center; justify-content:center; height:100%; color:#6B6F7B; font-size:0.72rem; font-family:monospace;">No stages — add stages below</div>`;
    }
    const sorted = [...stages].sort((a, b) => (a.minScroll || 0) - (b.minScroll || 0));
    return sorted.map((st, idx) => {
      const left = Math.round((st.minScroll || 0) * 100);
      const right = Math.round((st.maxScroll || 1) * 100);
      const width = Math.max(right - left, 2);
      const color = stageColor(stages.indexOf(st));
      const frameNum = st.frameNumber || String(Math.round(((st.minScroll || 0) * totalFrames))).padStart(3, '0');
      return `
        <div style="position:absolute; left:${left}%; width:${width}%; top:0; bottom:0;
          background:${color}22; border-right:2px solid ${color}; border-left:${idx === 0 ? `2px solid ${color}` : 'none'};
          display:flex; align-items:center; justify-content:center; overflow:hidden; cursor:default;"
          title="Stage ${st.stageNumber}: ${st.stageName || ''} | Frames ${left}%–${right}%">
          <span style="font-family:monospace; font-size:0.66rem; font-weight:800; color:${color}; white-space:nowrap;">
            S${st.stageNumber}
          </span>
        </div>
      `;
    }).join('');
  }

  function renderScrollTimelineLabels(stages) {
    if (!stages || stages.length === 0) return '';
    const sorted = [...stages].sort((a, b) => (a.minScroll || 0) - (b.minScroll || 0));
    return sorted.map((st, idx) => {
      const left = Math.round((st.minScroll || 0) * 100);
      const color = stageColor(stages.indexOf(st));
      return `
        <span style="position:absolute; left:${left}%; transform:translateX(-50%);
          font-family:monospace; font-size:0.62rem; color:${color}; white-space:nowrap;">
          ${left}%
        </span>
      `;
    }).join('');
  }

  // ── Main stages list (accordion cards, no modal needed) ──
  function renderStagesList(stages, totalFrames) {
    totalFrames = totalFrames || 240;
    if (!stages || stages.length === 0) {
      return `
        <div style="padding:28px; text-align:center; background:#0E0E12; border:1px dashed #2D2D3B; border-radius:8px;">
          <i class="fas fa-layer-group" style="font-size:2rem; color:#3A3A4C; margin-bottom:10px; display:block;"></i>
          <div style="color:#8E929E; font-size:0.85rem; margin-bottom:14px;">No scroll stages configured yet.</div>
          <div style="color:#6B6F7B; font-size:0.75rem; max-width:420px; margin:0 auto; line-height:1.6;">
            Each stage defines a chunk of the scroll journey where the vehicle disassembles on canvas.
            Add 5 stages covering 0%–100% of scroll progress.
          </div>
        </div>
      `;
    }

    return stages.map((st, idx) => {
      const color = stageColor(idx);
      const minPct = Math.round((st.minScroll || 0) * 100);
      const maxPct = Math.round((st.maxScroll || 1) * 100);
      const frameNum = st.frameNumber || String(Math.round((st.minScroll || 0) * totalFrames)).padStart(3, '0');
      const stats = st.stats || [{label:'',value:'',unit:''},{label:'',value:'',unit:''}];
      const s1 = stats[0] || {label:'',value:'',unit:''};
      const s2 = stats[1] || {label:'',value:'',unit:''};

      return `
      <div class="stage-editor-card" data-id="${escapeHtml(st.id)}" data-idx="${idx}"
        style="background:#0E0E12; border:1px solid #242430; border-left:3px solid ${color}; border-radius:8px; overflow:hidden;">

        <!-- Stage Header (click to expand/collapse) -->
        <div class="stage-card-header" data-stage-id="${escapeHtml(st.id)}"
          style="display:flex; justify-content:space-between; align-items:center;
            padding:12px 16px; cursor:pointer; user-select:none;
            background:#0E0E12; gap:12px;">

          <!-- Left: Stage identity -->
          <div style="display:flex; align-items:center; gap:10px; min-width:0;">
            <div style="width:28px; height:28px; border-radius:6px; display:flex; align-items:center; justify-content:center;
              background:${color}20; border:1px solid ${color}40; flex-shrink:0;">
              <span style="font-family:monospace; font-size:0.72rem; font-weight:900; color:${color};">${st.stageNumber}</span>
            </div>
            <div style="min-width:0;">
              <div style="font-family:monospace; font-size:0.82rem; font-weight:800; color:${color};
                white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                ${escapeHtml(st.stageName || 'STAGE')}
              </div>
              <div style="font-size:0.72rem; color:#8E929E; white-space:nowrap;">
                ${escapeHtml(st.heading || '')}${st.headingHighlight ? ` <span style="color:${color}">${escapeHtml(st.headingHighlight)}</span>` : ''}
              </div>
            </div>
          </div>

          <!-- Centre: scroll range pill + frame indicator -->
          <div style="display:flex; align-items:center; gap:8px; flex-shrink:0;">
            <div style="background:#141419; border:1px solid #242430; border-radius:20px; padding:3px 10px;
              display:flex; align-items:center; gap:6px; font-family:monospace; font-size:0.7rem;">
              <span style="color:#8E929E;">scroll</span>
              <span style="color:${color}; font-weight:800;">${minPct}%</span>
              <span style="color:#3A3A4C;">→</span>
              <span style="color:${color}; font-weight:800;">${maxPct}%</span>
            </div>
            <div style="background:#141419; border:1px solid #242430; border-radius:4px; padding:3px 8px;
              font-family:monospace; font-size:0.68rem; color:#8E929E;">
              <i class="fas fa-film" style="margin-right:3px; color:#F25912;"></i>fr. ${frameNum}
            </div>
          </div>

          <!-- Right: actions + chevron -->
          <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
            <button type="button" class="btn-stage-up" data-idx="${idx}" title="Move stage up"
              style="background:#181820; border:1px solid #2D2D3B; color:#8E929E; width:24px; height:24px;
                border-radius:4px; cursor:pointer; font-size:0.65rem;"
              ${idx === 0 ? 'disabled' : ''}>
              <i class="fas fa-chevron-up"></i>
            </button>
            <button type="button" class="btn-stage-down" data-idx="${idx}" title="Move stage down"
              style="background:#181820; border:1px solid #2D2D3B; color:#8E929E; width:24px; height:24px;
                border-radius:4px; cursor:pointer; font-size:0.65rem;"
              ${idx === stages.length - 1 ? 'disabled' : ''}>
              <i class="fas fa-chevron-down"></i>
            </button>
            <button type="button" class="btn-del-stage" data-id="${escapeHtml(st.id)}"
              title="Delete stage"
              style="background:none; border:1px solid rgba(255,77,77,0.2); color:#FF4D4D; width:24px; height:24px;
                border-radius:4px; cursor:pointer; font-size:0.65rem;">
              <i class="fas fa-trash"></i>
            </button>
            <i class="stage-card-chevron fas fa-chevron-right"
              style="color:#3A3A4C; font-size:0.75rem; transition:transform 0.2s ease; margin-left:2px;"></i>
          </div>
        </div>

        <!-- Stage Body (collapsed by default) -->
        <div class="stage-card-body" id="stage-body-${escapeHtml(st.id)}"
          style="display:none; padding:16px; border-top:1px solid #1C1C24;
            background:#090909; flex-direction:column; gap:14px;">

          <!-- Row 1: Identity + Scroll Range -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
              <label style="display:block; font-size:0.68rem; font-weight:700; text-transform:uppercase;
                color:#8E929E; margin-bottom:4px; letter-spacing:0.05em;">Stage Name (HUD Label)</label>
              <input type="text" class="stage-field cms-input" data-field="stageName" data-id="${escapeHtml(st.id)}"
                value="${escapeHtml(st.stageName || '')}" placeholder="e.g. ASSEMBLED"
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px;
                  padding:7px 10px; color:#ECECF1; font-size:0.82rem; font-family:monospace; font-weight:700;
                  letter-spacing:0.06em;" />
            </div>
            <div>
              <label style="display:block; font-size:0.68rem; font-weight:700; text-transform:uppercase;
                color:#8E929E; margin-bottom:4px; letter-spacing:0.05em;">Trigger Frame No.</label>
              <input type="text" class="stage-field cms-input" data-field="frameNumber" data-id="${escapeHtml(st.id)}"
                value="${escapeHtml(st.frameNumber || '001')}" placeholder="e.g. 001"
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px;
                  padding:7px 10px; color:${color}; font-size:0.88rem; font-family:monospace; font-weight:900;" />
            </div>
          </div>

          <!-- Row 2: Scroll Range (minScroll / maxScroll) -->
          <div style="background:#0E0E12; border:1px solid #1C1C24; border-radius:8px; padding:12px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <i class="fas fa-arrows-alt-h" style="color:${color}; font-size:0.75rem;"></i>
              <span style="font-size:0.68rem; font-weight:800; color:#ECECF1; text-transform:uppercase; letter-spacing:0.06em;">Scroll Trigger Range</span>
              <span style="font-size:0.65rem; color:#6B6F7B; font-family:monospace;">— 0.0 = top of section, 1.0 = bottom</span>
            </div>
            <div style="display:grid; grid-template-columns:1fr 40px 1fr; align-items:center; gap:8px;">
              <div>
                <label style="display:block; font-size:0.65rem; color:#8E929E; margin-bottom:3px;">Start (0.0 – 1.0)</label>
                <input type="number" class="stage-field cms-input" data-field="minScroll" data-id="${escapeHtml(st.id)}"
                  value="${st.minScroll !== undefined ? st.minScroll : 0}" min="0" max="1" step="0.01"
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px;
                    padding:7px 10px; color:${color}; font-size:0.9rem; font-family:monospace; font-weight:800;" />
              </div>
              <div style="text-align:center; color:#3A3A4C; font-size:0.75rem; padding-top:14px;">→</div>
              <div>
                <label style="display:block; font-size:0.65rem; color:#8E929E; margin-bottom:3px;">End (0.0 – 1.0)</label>
                <input type="number" class="stage-field cms-input" data-field="maxScroll" data-id="${escapeHtml(st.id)}"
                  value="${st.maxScroll !== undefined ? st.maxScroll : 1}" min="0" max="1" step="0.01"
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px;
                    padding:7px 10px; color:${color}; font-size:0.9rem; font-family:monospace; font-weight:800;" />
              </div>
            </div>
          </div>

          <!-- Row 3: Eyebrow / Heading / Highlight -->
          <div style="display:grid; grid-template-columns:1fr 2fr 1fr; gap:10px;">
            <div>
              <label style="display:block; font-size:0.68rem; font-weight:700; text-transform:uppercase;
                color:#8E929E; margin-bottom:4px; letter-spacing:0.05em;">Eyebrow</label>
              <input type="text" class="stage-field cms-input" data-field="eyebrow" data-id="${escapeHtml(st.id)}"
                value="${escapeHtml(st.eyebrow || '')}" placeholder="Short label"
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px;
                  padding:7px 10px; color:#ECECF1; font-size:0.82rem;" />
            </div>
            <div>
              <label style="display:block; font-size:0.68rem; font-weight:700; text-transform:uppercase;
                color:#8E929E; margin-bottom:4px; letter-spacing:0.05em;">Heading *</label>
              <input type="text" class="stage-field cms-input" data-field="heading" data-id="${escapeHtml(st.id)}"
                value="${escapeHtml(st.heading || '')}" placeholder="Stage main heading"
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px;
                  padding:7px 10px; color:#FFFFFF; font-size:0.85rem; font-weight:700;" />
            </div>
            <div>
              <label style="display:block; font-size:0.68rem; font-weight:700; text-transform:uppercase;
                color:#8E929E; margin-bottom:4px; letter-spacing:0.05em;">Highlight (orange)</label>
              <input type="text" class="stage-field cms-input" data-field="headingHighlight" data-id="${escapeHtml(st.id)}"
                value="${escapeHtml(st.headingHighlight || '')}" placeholder="Orange word"
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px;
                  padding:7px 10px; color:#F25912; font-size:0.82rem;" />
            </div>
          </div>

          <!-- Row 4: Description -->
          <div>
            <label style="display:block; font-size:0.68rem; font-weight:700; text-transform:uppercase;
              color:#8E929E; margin-bottom:4px; letter-spacing:0.05em;">Description</label>
            <textarea class="stage-field cms-input" data-field="description" data-id="${escapeHtml(st.id)}"
              rows="2" placeholder="Short description displayed during this scroll stage"
              style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px;
                padding:7px 10px; color:#ECECF1; font-size:0.82rem; resize:vertical;">${escapeHtml(st.description || '')}</textarea>
          </div>

          <!-- Row 5: Telemetry Stats (2 per stage) -->
          <div style="background:#0E0E12; border:1px solid #1C1C24; border-radius:8px; padding:12px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
              <i class="fas fa-tachometer-alt" style="color:${color}; font-size:0.75rem;"></i>
              <span style="font-size:0.68rem; font-weight:800; color:#ECECF1; text-transform:uppercase; letter-spacing:0.06em;">Telemetry HUD Stats (shown during this stage)</span>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
              <!-- Stat 1 -->
              <div style="background:#141419; border:1px solid #1C1C24; border-radius:6px; padding:10px;">
                <div style="font-family:monospace; font-size:0.65rem; font-weight:800; color:${color}; margin-bottom:6px; text-transform:uppercase;">STAT 1</div>
                <input type="text" class="stage-field cms-input" data-field="stat0_label" data-id="${escapeHtml(st.id)}"
                  value="${escapeHtml(s1.label || '')}" placeholder="Label (e.g. Peak Power)"
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:4px; padding:5px 8px;
                    color:#ECECF1; font-size:0.75rem; margin-bottom:6px;" />
                <div style="display:grid; grid-template-columns:2fr 1fr; gap:5px;">
                  <input type="text" class="stage-field cms-input" data-field="stat0_value" data-id="${escapeHtml(st.id)}"
                    value="${escapeHtml(s1.value || '')}" placeholder="Value"
                    style="background:#0B0B0E; border:1px solid #2D2D3B; border-radius:4px; padding:5px 8px;
                      color:#FFFFFF; font-size:0.8rem; font-family:monospace; font-weight:700;" />
                  <input type="text" class="stage-field cms-input" data-field="stat0_unit" data-id="${escapeHtml(st.id)}"
                    value="${escapeHtml(s1.unit || '')}" placeholder="Unit"
                    style="background:#0B0B0E; border:1px solid #2D2D3B; border-radius:4px; padding:5px 8px;
                      color:#F25912; font-size:0.78rem; font-family:monospace;" />
                </div>
              </div>
              <!-- Stat 2 -->
              <div style="background:#141419; border:1px solid #1C1C24; border-radius:6px; padding:10px;">
                <div style="font-family:monospace; font-size:0.65rem; font-weight:800; color:${color}; margin-bottom:6px; text-transform:uppercase;">STAT 2</div>
                <input type="text" class="stage-field cms-input" data-field="stat1_label" data-id="${escapeHtml(st.id)}"
                  value="${escapeHtml(s2.label || '')}" placeholder="Label (e.g. 0–100 km/h)"
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:4px; padding:5px 8px;
                    color:#ECECF1; font-size:0.75rem; margin-bottom:6px;" />
                <div style="display:grid; grid-template-columns:2fr 1fr; gap:5px;">
                  <input type="text" class="stage-field cms-input" data-field="stat1_value" data-id="${escapeHtml(st.id)}"
                    value="${escapeHtml(s2.value || '')}" placeholder="Value"
                    style="background:#0B0B0E; border:1px solid #2D2D3B; border-radius:4px; padding:5px 8px;
                      color:#FFFFFF; font-size:0.8rem; font-family:monospace; font-weight:700;" />
                  <input type="text" class="stage-field cms-input" data-field="stat1_unit" data-id="${escapeHtml(st.id)}"
                    value="${escapeHtml(s2.unit || '')}" placeholder="Unit"
                    style="background:#0B0B0E; border:1px solid #2D2D3B; border-radius:4px; padding:5px 8px;
                      color:#F25912; font-size:0.78rem; font-family:monospace;" />
                </div>
              </div>
            </div>
          </div>

        </div><!-- /stage-card-body -->
      </div>
      `;
    }).join('');
  }

  function renderKeySpecsList(specs) {
    if (!specs || specs.length === 0) {
      return `<div style="grid-column:1/-1; padding:20px; text-align:center; color:#8E929E;">No key specs configured.</div>`;
    }

    return specs.map((spec, idx) => `
      <div class="keyspec-card" data-id="${escapeHtml(spec.id)}" style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <span style="font-family:monospace; font-size:0.7rem; color:#8E929E; text-transform:uppercase; letter-spacing:0.06em;">
            SPEC 0${idx + 1}
          </span>
          <div style="display:flex; gap:4px;">
            <button type="button" class="btn-keyspec-up" data-idx="${idx}" title="Move Left" style="background:#181820; border:1px solid #2D2D3B; color:#8E929E; width:24px; height:24px; border-radius:4px; cursor:pointer; font-size:0.65rem;" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="fas fa-chevron-left"></i>
            </button>
            <button type="button" class="btn-keyspec-down" data-idx="${idx}" title="Move Right" style="background:#181820; border:1px solid #2D2D3B; color:#8E929E; width:24px; height:24px; border-radius:4px; cursor:pointer; font-size:0.65rem;" ${idx === specs.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="fas fa-chevron-right"></i>
            </button>
            <button type="button" class="btn btn-secondary btn-sm btn-edit-keyspec" data-id="${escapeHtml(spec.id)}" style="font-size:0.72rem; padding:2px 8px; margin-left:4px;">
              <i class="fas fa-pen"></i>
            </button>
            <button type="button" class="btn btn-outline btn-sm btn-del-keyspec" data-id="${escapeHtml(spec.id)}" style="font-size:0.72rem; padding:2px 8px; color:#FF4D4D; border-color:rgba(255,77,77,0.3);">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div>
          <div style="font-size:1.6rem; font-weight:900; color:#FFFFFF; line-height:1; font-family:monospace;">
            ${escapeHtml(spec.value || '0')} <span style="font-size:0.9rem; color:#F25912; font-weight:600;">${escapeHtml(spec.unit || '')}</span>
          </div>
          <div style="font-size:0.85rem; font-weight:700; color:#FFFFFF; margin-top:4px;">
            ${escapeHtml(spec.key || 'Untitled Spec')}
          </div>
          <div style="font-size:0.72rem; color:#8E929E; font-family:monospace; margin-top:2px;">
            ${escapeHtml(spec.subtitle || '')}
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderCategoryTabs(categories) {
    if (!categories || categories.length === 0) return '';
    return categories.map(cat => {
      const isActive = cat.id === activeEngTabId;
      return `
        <button type="button" class="btn-cat-tab" data-id="${escapeHtml(cat.id)}" 
          style="padding:6px 14px; border-radius:6px; font-size:0.8rem; font-family:monospace; font-weight:700; cursor:pointer; transition:all 0.2s ease; border:1px solid ${isActive ? '#F25912' : '#2D2D3B'}; background:${isActive ? 'rgba(242,89,18,0.15)' : '#141419'}; color:${isActive ? '#F25912' : '#ECECF1'};">
          <i class="${escapeHtml(cat.icon || 'fas fa-cube')}" style="margin-right:6px;"></i> ${escapeHtml(cat.title)}
        </button>
      `;
    }).join('');
  }

  function renderActiveCategoryPanel(categories) {
    const active = categories.find(c => c.id === activeEngTabId) || categories[0];
    if (!active) {
      return `<div style="padding:30px; text-align:center; color:#8E929E;">No category selected.</div>`;
    }

    const cards = active.cards || [];

    return `
      <div style="background:#0B0B0E; border:1px solid #242430; border-radius:8px; padding:18px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:10px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <div style="width:34px; height:34px; border-radius:6px; background:#181820; border:1px solid #2D2D3B; display:flex; align-items:center; justify-content:center; color:#F25912;">
              <i class="${escapeHtml(active.icon || 'fas fa-cube')}"></i>
            </div>
            <div>
              <span style="font-size:0.95rem; font-weight:800; color:#FFFFFF;">${escapeHtml(active.title)}</span>
              <span style="font-family:monospace; font-size:0.72rem; color:#8E929E; margin-left:8px;">(slug: ${escapeHtml(active.id)})</span>
            </div>
          </div>

          <div style="display:flex; gap:8px;">
            <button type="button" class="btn btn-secondary btn-sm" id="btnEditCurrentCatTab" data-id="${escapeHtml(active.id)}" style="font-size:0.75rem; padding:4px 10px;">
              <i class="fas fa-cog"></i> Tab Settings
            </button>
            <button type="button" class="btn btn-secondary btn-sm" id="btnAddSysCardBtn" style="font-size:0.75rem; padding:4px 10px; border-color:#3A3A4C;">
              <i class="fas fa-plus"></i> Add Subsystem Card
            </button>
            <button type="button" class="btn btn-outline btn-sm" id="btnDeleteCurrentCatTab" data-id="${escapeHtml(active.id)}" style="font-size:0.75rem; padding:4px 10px; color:#FF4D4D; border-color:rgba(255,77,77,0.3);">
              <i class="fas fa-trash"></i> Delete Tab
            </button>
          </div>
        </div>

        <!-- Cards Inside this category -->
        <div id="sysCardsContainer" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(360px, 1fr)); gap:14px;">
          ${cards.map((card, cIdx) => `
            <div class="sys-card-editor" data-id="${escapeHtml(card.id)}" style="background:#141419; border:1px solid #242430; border-radius:8px; padding:16px;">
              <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px;">
                <div style="display:flex; align-items:center; gap:8px;">
                  <i class="${escapeHtml(card.icon || 'fas fa-cube')}" style="color:#F25912; font-size:0.9rem;"></i>
                  <span style="font-size:0.9rem; font-weight:800; color:#FFFFFF;">${escapeHtml(card.title || 'Untitled Card')}</span>
                  ${card.isFullWidth ? `<span style="font-size:0.65rem; background:#1C1C24; color:#8E929E; padding:1px 5px; border-radius:3px;">Full Width</span>` : ''}
                </div>
                <div style="display:flex; gap:4px;">
                  <button type="button" class="btn btn-secondary btn-sm btn-edit-syscard" data-id="${escapeHtml(card.id)}" style="font-size:0.7rem; padding:2px 8px;">
                    <i class="fas fa-pen"></i> Edit
                  </button>
                  <button type="button" class="btn btn-outline btn-sm btn-del-syscard" data-id="${escapeHtml(card.id)}" style="font-size:0.7rem; padding:2px 8px; color:#FF4D4D; border-color:rgba(255,77,77,0.3);">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </div>

              <p style="font-size:0.78rem; color:#8E929E; margin-bottom:12px; line-height:1.4;">${escapeHtml(card.description || '')}</p>

              <!-- Specs rows table -->
              <div style="background:#0E0E12; border:1px solid #1C1C24; border-radius:6px; padding:8px;">
                <span style="font-size:0.68rem; font-weight:700; color:#8E929E; text-transform:uppercase; letter-spacing:0.04em; display:block; margin-bottom:6px;">Specifications:</span>
                ${(card.specs || []).map(row => `
                  <div style="display:flex; justify-content:space-between; font-size:0.75rem; padding:3px 0; border-bottom:1px dashed rgba(255,255,255,0.05);">
                    <span style="color:#8E929E; font-family:monospace;">${escapeHtml(row.key)}</span>
                    <span style="color:#FFFFFF; font-weight:600;">${escapeHtml(row.value)}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  function renderBuildPhasesList(phases) {
    if (!phases || phases.length === 0) {
      return `<div style="grid-column:1/-1; padding:20px; text-align:center; color:#8E929E;">No build phases configured.</div>`;
    }

    return phases.map((ph, idx) => `
      <div class="build-phase-card" data-id="${escapeHtml(ph.id)}" style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:14px; display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="${escapeHtml(ph.icon || 'fas fa-pencil-ruler')}" style="color:#F25912; font-size:1rem;"></i>
            <span style="font-family:monospace; font-size:0.72rem; color:#F25912; font-weight:800;">
              ${escapeHtml(ph.phaseNumber || '0' + (idx + 1) + ' // Phase')}
            </span>
          </div>

          <div style="display:flex; gap:4px;">
            <button type="button" class="btn-phase-up" data-idx="${idx}" title="Move Up" style="background:#181820; border:1px solid #2D2D3B; color:#8E929E; width:24px; height:24px; border-radius:4px; cursor:pointer; font-size:0.65rem;" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="fas fa-chevron-left"></i>
            </button>
            <button type="button" class="btn-phase-down" data-idx="${idx}" title="Move Down" style="background:#181820; border:1px solid #2D2D3B; color:#8E929E; width:24px; height:24px; border-radius:4px; cursor:pointer; font-size:0.65rem;" ${idx === phases.length - 1 ? 'disabled style="opacity:0.3;"' : ''}>
              <i class="fas fa-chevron-right"></i>
            </button>
            <button type="button" class="btn btn-secondary btn-sm btn-edit-phase" data-id="${escapeHtml(ph.id)}" style="font-size:0.72rem; padding:2px 8px; margin-left:4px;">
              <i class="fas fa-pen"></i>
            </button>
            <button type="button" class="btn btn-outline btn-sm btn-del-phase" data-id="${escapeHtml(ph.id)}" style="font-size:0.72rem; padding:2px 8px; color:#FF4D4D; border-color:rgba(255,77,77,0.3);">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>

        <div>
          <div style="font-size:0.92rem; font-weight:800; color:#FFFFFF; margin-bottom:4px;">
            ${escapeHtml(ph.title || 'Untitled Phase')}
          </div>
          <div style="font-size:0.78rem; color:#8E929E; line-height:1.4; margin-bottom:8px;">
            ${escapeHtml(ph.description || '')}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-family:monospace; font-size:0.7rem;">
            <span style="color:#ECECF1; background:#181820; padding:2px 6px; border-radius:3px;">
              <i class="fas fa-calendar-alt" style="margin-right:4px; color:#8E929E;"></i>${escapeHtml(ph.dateTag || 'Season Tag')}
            </span>
            <span style="color:${ph.isDone ? '#2EA44F' : '#8E929E'};">
              <i class="fas ${ph.isDone ? 'fa-check-circle' : 'fa-circle'}"></i> ${ph.isDone ? 'Completed' : 'Upcoming'}
            </span>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderVisualCardsList(cards) {
    if (!cards || cards.length === 0) {
      return `<div style="grid-column:1/-1; padding:20px; text-align:center; color:#8E929E;">No visual cards configured.</div>`;
    }

    return cards.map((c, idx) => `
      <div class="visual-card-item" data-id="${escapeHtml(c.id)}" style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:12px; display:flex; flex-direction:column; justify-content:space-between; gap:10px;">
        <div style="height:120px; border-radius:6px; background:#000; overflow:hidden; position:relative; border:1px solid #242430;">
          ${c.imageUrl ? `
            <img src="${escapeHtml(c.imageUrl)}" alt="${escapeHtml(c.altText || c.title)}" style="width:100%; height:100%; object-fit:cover;" />
          ` : `
            <div style="display:flex; align-items:center; justify-content:center; height:100%; color:#6B6F7B; font-size:0.75rem; font-family:monospace;">
              No image (Grid pattern)
            </div>
          `}
          ${c.isFeatured ? `
            <span style="position:absolute; top:6px; right:6px; background:#F25912; color:#fff; font-family:monospace; font-size:0.65rem; font-weight:800; padding:2px 6px; border-radius:3px;">
              FEATURED
            </span>
          ` : ''}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <div style="font-size:0.88rem; font-weight:800; color:#FFFFFF;">
              ${escapeHtml(c.title || 'Untitled Card')}
            </div>
            <div style="font-size:0.7rem; color:#8E929E; font-family:monospace;">
              ${escapeHtml(c.altText || '')}
            </div>
          </div>

          <div style="display:flex; gap:4px;">
            <button type="button" class="btn btn-secondary btn-sm btn-edit-visual" data-id="${escapeHtml(c.id)}" style="font-size:0.72rem; padding:2px 8px;">
              <i class="fas fa-pen"></i>
            </button>
            <button type="button" class="btn btn-outline btn-sm btn-del-visual" data-id="${escapeHtml(c.id)}" style="font-size:0.72rem; padding:2px 8px; color:#FF4D4D; border-color:rgba(255,77,77,0.3);">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `).join('');
  }

  // ============================================================
  //  MODAL EDITORS
  // ============================================================

  // openStageModal is no longer used — stages are edited inline.
  // Kept as a no-op stub to avoid reference errors from legacy event binds.
  function openStageModal() {}

  function openKeySpecModal(specId = null) {
    const specs = currentData.keySpecs || [];
    const isNew = !specId;
    const spec = isNew
      ? {
          id: 'spec-' + Date.now(),
          key: '',
          value: '0',
          decimalPlaces: 0,
          unit: '',
          subtitle: '',
          isHighlighted: false,
          order: specs.length + 1,
        }
      : specs.find(s => s.id === specId);

    if (!spec) return;

    const modalWrap = document.getElementById('carModalWrap');
    modalWrap.innerHTML = `
      <div style="position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px);">
        <div style="background:#141419; border:1px solid #242430; border-radius:12px; width:100%; max-width:520px; padding:24px; box-shadow:0 20px 60px rgba(0,0,0,0.7);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #242430; padding-bottom:12px;">
            <h3 style="font-size:1.15rem; font-weight:800; color:#FFFFFF; margin:0;">
              ${isNew ? 'Add Vehicle Key Spec' : 'Edit Key Spec'}
            </h3>
            <button type="button" id="closeSpecModalBtn" style="background:none; border:none; color:#8E929E; font-size:1.2rem; cursor:pointer;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="keySpecModalForm" style="display:flex; flex-direction:column; gap:16px;">
            <div>
              <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Key Spec Title *</label>
              <input type="text" id="mSpecKey" class="cms-input" value="${escapeHtml(spec.key)}" placeholder="e.g. Peak Power, 0–100 km/h" required 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
            </div>

            <div style="display:grid; grid-template-columns:2fr 1fr 1fr; gap:10px;">
              <div>
                <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Target Value</label>
                <input type="text" id="mSpecVal" class="cms-input" value="${escapeHtml(spec.value)}" placeholder="120 or 3.2" required 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-family:monospace;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Unit</label>
                <input type="text" id="mSpecUnit" class="cms-input" value="${escapeHtml(spec.unit)}" placeholder="kW, s, kg" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Decimals</label>
                <input type="number" id="mSpecDec" class="cms-input" value="${spec.decimalPlaces || 0}" min="0" max="2" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Subtitle / Note</label>
              <input type="text" id="mSpecSub" class="cms-input" value="${escapeHtml(spec.subtitle)}" placeholder="e.g. Electric Motor Output, @ 100 km/h" 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
              <button type="button" id="cancelSpecModalBtn" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="background:#F25912; border-color:#F25912;">Save Spec</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => { modalWrap.innerHTML = ''; };
    document.getElementById('closeSpecModalBtn').addEventListener('click', close);
    document.getElementById('cancelSpecModalBtn').addEventListener('click', close);

    document.getElementById('keySpecModalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      spec.key = document.getElementById('mSpecKey').value.trim();
      spec.value = document.getElementById('mSpecVal').value.trim();
      spec.unit = document.getElementById('mSpecUnit').value.trim();
      spec.decimalPlaces = parseInt(document.getElementById('mSpecDec').value || 0, 10);
      spec.subtitle = document.getElementById('mSpecSub').value.trim();

      if (isNew) {
        specs.push(spec);
      }

      close();
      document.getElementById('keySpecsContainer').innerHTML = renderKeySpecsList(specs);
      bindKeySpecsEvents();
      markDirty();
    });
  }

  function openSysCardModal(cardId = null) {
    const categories = currentData.engineeringSection.categories || [];
    const cat = categories.find(c => c.id === activeEngTabId);
    if (!cat) return;

    cat.cards = cat.cards || [];
    const isNew = !cardId;
    const card = isNew
      ? {
          id: 'card-' + Date.now(),
          title: '',
          description: '',
          icon: 'fas fa-cube',
          isFullWidth: false,
          specs: [
            { key: 'Specification', value: 'Value' }
          ],
        }
      : cat.cards.find(c => c.id === cardId);

    if (!card) return;

    const modalWrap = document.getElementById('carModalWrap');
    modalWrap.innerHTML = `
      <div style="position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px);">
        <div style="background:#141419; border:1px solid #242430; border-radius:12px; width:100%; max-width:640px; max-height:90vh; overflow-y:auto; padding:24px; box-shadow:0 20px 60px rgba(0,0,0,0.7);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #242430; padding-bottom:12px;">
            <h3 style="font-size:1.15rem; font-weight:800; color:#FFFFFF; margin:0;">
              ${isNew ? 'Add Subsystem Card' : 'Edit Subsystem Card'}
            </h3>
            <button type="button" id="closeSysCardModalBtn" style="background:none; border:none; color:#8E929E; font-size:1.2rem; cursor:pointer;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="sysCardModalForm" style="display:flex; flex-direction:column; gap:16px;">
            <div style="display:grid; grid-template-columns:2fr 1fr; gap:12px;">
              <div>
                <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Card Title *</label>
                <input type="text" id="mCardTitle" class="cms-input" value="${escapeHtml(card.title)}" placeholder="e.g. Carbon Monocoque Chassis" required 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Icon Class</label>
                <input type="text" id="mCardIcon" class="cms-input" value="${escapeHtml(card.icon || 'fas fa-cube')}" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-family:monospace;" />
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Description</label>
              <textarea id="mCardDesc" rows="2" class="cms-input" 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; resize:vertical;">${escapeHtml(card.description || '')}</textarea>
            </div>

            <div>
              <label style="display:inline-flex; align-items:center; gap:6px; font-size:0.78rem; color:#ECECF1; cursor:pointer;">
                <input type="checkbox" id="mCardFullWidth" ${card.isFullWidth ? 'checked' : ''} style="accent-color:#F25912;" /> Full Width Grid Card (Span across 2 columns)
              </label>
            </div>

            <!-- Specs List rows -->
            <div style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <span style="font-size:0.75rem; font-weight:700; color:#ECECF1; text-transform:uppercase;">Technical Specs Key-Value Rows</span>
                <button type="button" class="btn btn-secondary btn-sm" id="btnAddSpecRowBtn" style="font-size:0.7rem; padding:2px 8px;">
                  <i class="fas fa-plus"></i> Add Row
                </button>
              </div>
              <div id="mSpecRowsContainer" style="display:flex; flex-direction:column; gap:6px;">
                ${(card.specs || []).map((row, rIdx) => `
                  <div class="m-spec-row" style="display:grid; grid-template-columns:1fr 1fr 28px; gap:8px; align-items:center;">
                    <input type="text" class="m-row-key cms-input" value="${escapeHtml(row.key)}" placeholder="Key (e.g. Material)" style="background:#0B0B0E; border:1px solid #2D2D3B; border-radius:4px; padding:5px 8px; color:#fff; font-size:0.78rem;" />
                    <input type="text" class="m-row-val cms-input" value="${escapeHtml(row.value)}" placeholder="Value (e.g. Carbon Fiber)" style="background:#0B0B0E; border:1px solid #2D2D3B; border-radius:4px; padding:5px 8px; color:#fff; font-size:0.78rem;" />
                    <button type="button" class="btn-del-row" style="background:none; border:none; color:#FF4D4D; cursor:pointer; font-size:0.8rem;">
                      <i class="fas fa-times"></i>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
              <button type="button" id="cancelSysCardModalBtn" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="background:#F25912; border-color:#F25912;">Save Card</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => { modalWrap.innerHTML = ''; };
    document.getElementById('closeSysCardModalBtn').addEventListener('click', close);
    document.getElementById('cancelSysCardModalBtn').addEventListener('click', close);

    const rowsWrap = document.getElementById('mSpecRowsContainer');
    document.getElementById('btnAddSpecRowBtn').addEventListener('click', () => {
      const div = document.createElement('div');
      div.className = 'm-spec-row';
      div.style.cssText = 'display:grid; grid-template-columns:1fr 1fr 28px; gap:8px; align-items:center;';
      div.innerHTML = `
        <input type="text" class="m-row-key cms-input" placeholder="Key" style="background:#0B0B0E; border:1px solid #2D2D3B; border-radius:4px; padding:5px 8px; color:#fff; font-size:0.78rem;" />
        <input type="text" class="m-row-val cms-input" placeholder="Value" style="background:#0B0B0E; border:1px solid #2D2D3B; border-radius:4px; padding:5px 8px; color:#fff; font-size:0.78rem;" />
        <button type="button" class="btn-del-row" style="background:none; border:none; color:#FF4D4D; cursor:pointer; font-size:0.8rem;">
          <i class="fas fa-times"></i>
        </button>
      `;
      div.querySelector('.btn-del-row').addEventListener('click', () => div.remove());
      rowsWrap.appendChild(div);
    });

    rowsWrap.querySelectorAll('.btn-del-row').forEach(btn => {
      btn.addEventListener('click', (e) => e.currentTarget.closest('.m-spec-row').remove());
    });

    document.getElementById('sysCardModalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      card.title = document.getElementById('mCardTitle').value.trim();
      card.icon = document.getElementById('mCardIcon').value.trim() || 'fas fa-cube';
      card.description = document.getElementById('mCardDesc').value.trim();
      card.isFullWidth = document.getElementById('mCardFullWidth').checked;

      const newSpecs = [];
      rowsWrap.querySelectorAll('.m-spec-row').forEach(row => {
        const k = row.querySelector('.m-row-key').value.trim();
        const v = row.querySelector('.m-row-val').value.trim();
        if (k || v) newSpecs.push({ key: k, value: v });
      });
      card.specs = newSpecs;

      if (isNew) {
        cat.cards.push(card);
      }

      close();
      document.getElementById('activeCategoryContentContainer').innerHTML = renderActiveCategoryPanel(categories);
      bindSysCardsEvents();
      markDirty();
    });
  }

  function openBuildPhaseModal(phaseId = null) {
    const phases = currentData.buildJourneySection.phases || [];
    const isNew = !phaseId;
    const ph = isNew
      ? {
          id: 'phase-' + Date.now(),
          phaseNumber: '0' + (phases.length + 1) + ' // Phase',
          title: '',
          description: '',
          icon: 'fas fa-pencil-ruler',
          dateTag: '',
          isDone: true,
          order: phases.length + 1,
        }
      : phases.find(p => p.id === phaseId);

    if (!ph) return;

    const modalWrap = document.getElementById('carModalWrap');
    modalWrap.innerHTML = `
      <div style="position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px);">
        <div style="background:#141419; border:1px solid #242430; border-radius:12px; width:100%; max-width:560px; padding:24px; box-shadow:0 20px 60px rgba(0,0,0,0.7);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #242430; padding-bottom:12px;">
            <h3 style="font-size:1.15rem; font-weight:800; color:#FFFFFF; margin:0;">
              ${isNew ? 'Add Build Phase' : 'Edit Build Phase'}
            </h3>
            <button type="button" id="closePhaseModalBtn" style="background:none; border:none; color:#8E929E; font-size:1.2rem; cursor:pointer;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="buildPhaseModalForm" style="display:flex; flex-direction:column; gap:16px;">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Phase Number Tag</label>
                <input type="text" id="mPhaseNum" class="cms-input" value="${escapeHtml(ph.phaseNumber)}" placeholder="e.g. 01 // Phase" required 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Icon Class</label>
                <input type="text" id="mPhaseIcon" class="cms-input" value="${escapeHtml(ph.icon || 'fas fa-pencil-ruler')}" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-family:monospace;" />
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Phase Title *</label>
              <input type="text" id="mPhaseTitle" class="cms-input" value="${escapeHtml(ph.title)}" placeholder="e.g. Concept &amp; Design" required 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; font-weight:700;" />
            </div>

            <div>
              <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Description</label>
              <textarea id="mPhaseDesc" rows="2" class="cms-input" 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem; resize:vertical;">${escapeHtml(ph.description || '')}</textarea>
            </div>

            <div style="display:grid; grid-template-columns:2fr 1fr; gap:12px; align-items:center;">
              <div>
                <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Date / Season Tag</label>
                <input type="text" id="mPhaseDate" class="cms-input" value="${escapeHtml(ph.dateTag)}" placeholder="e.g. Sep 2024 — Nov 2024" 
                  style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
              </div>
              <div style="padding-top:16px;">
                <label style="display:inline-flex; align-items:center; gap:6px; font-size:0.78rem; color:#ECECF1; cursor:pointer;">
                  <input type="checkbox" id="mPhaseDone" ${ph.isDone ? 'checked' : ''} style="accent-color:#2EA44F;" /> Completed
                </label>
              </div>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
              <button type="button" id="cancelPhaseModalBtn" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="background:#F25912; border-color:#F25912;">Save Phase</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => { modalWrap.innerHTML = ''; };
    document.getElementById('closePhaseModalBtn').addEventListener('click', close);
    document.getElementById('cancelPhaseModalBtn').addEventListener('click', close);

    document.getElementById('buildPhaseModalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      ph.phaseNumber = document.getElementById('mPhaseNum').value.trim();
      ph.icon = document.getElementById('mPhaseIcon').value.trim() || 'fas fa-pencil-ruler';
      ph.title = document.getElementById('mPhaseTitle').value.trim();
      ph.description = document.getElementById('mPhaseDesc').value.trim();
      ph.dateTag = document.getElementById('mPhaseDate').value.trim();
      ph.isDone = document.getElementById('mPhaseDone').checked;

      if (isNew) {
        phases.push(ph);
      }

      close();
      document.getElementById('buildPhasesContainer').innerHTML = renderBuildPhasesList(phases);
      bindBuildPhasesEvents();
      markDirty();
    });
  }

  function openVisualCardModal(cardId = null) {
    const cards = currentData.visualBreakdownSection.cards || [];
    const isNew = !cardId;
    const card = isNew
      ? {
          id: 'vcard-' + Date.now(),
          title: '',
          imageUrl: '',
          altText: '',
          isFeatured: false,
          order: cards.length + 1,
        }
      : cards.find(c => c.id === cardId);

    if (!card) return;

    const modalWrap = document.getElementById('carModalWrap');
    modalWrap.innerHTML = `
      <div style="position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(4px);">
        <div style="background:#141419; border:1px solid #242430; border-radius:12px; width:100%; max-width:540px; padding:24px; box-shadow:0 20px 60px rgba(0,0,0,0.7);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #242430; padding-bottom:12px;">
            <h3 style="font-size:1.15rem; font-weight:800; color:#FFFFFF; margin:0;">
              ${isNew ? 'Add Visual Breakdown Card' : 'Edit Visual Card'}
            </h3>
            <button type="button" id="closeVisualModalBtn" style="background:none; border:none; color:#8E929E; font-size:1.2rem; cursor:pointer;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="visualCardModalForm" style="display:flex; flex-direction:column; gap:16px;">
            <div>
              <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Component Title *</label>
              <input type="text" id="mVisualTitle" class="cms-input" value="${escapeHtml(card.title)}" placeholder="e.g. Front Aero Wing" required 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
            </div>

            <!-- MediaPicker field -->
            <div style="background:#0E0E12; border:1px solid #242430; border-radius:8px; padding:12px;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <label style="font-size:0.72rem; font-weight:700; color:#8E929E; text-transform:uppercase;">Photo Image URL</label>
                <button type="button" class="btn btn-secondary btn-sm" id="btnPickVisualImg" style="font-size:0.72rem; padding:3px 10px;">
                  <i class="fas fa-folder-open"></i> MediaPicker
                </button>
              </div>
              <input type="text" id="mVisualImgUrl" class="cms-input" value="${escapeHtml(card.imageUrl)}" placeholder="https://res.cloudinary.com/..." 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.82rem; font-family:monospace; margin-bottom:8px;" />
              <div id="mVisualImgPreview" style="height:100px; border-radius:4px; background:#000; overflow:hidden; border:1px dashed #3A3A4C; display:flex; align-items:center; justify-content:center;">
                ${card.imageUrl ? `
                  <img src="${escapeHtml(card.imageUrl)}" style="width:100%; height:100%; object-fit:cover;" />
                ` : `<span style="color:#6B6F7B; font-size:0.75rem; font-family:monospace;">No image selected</span>`}
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.72rem; font-weight:700; color:#8E929E; margin-bottom:4px;">Alt Text</label>
              <input type="text" id="mVisualAlt" class="cms-input" value="${escapeHtml(card.altText)}" placeholder="e.g. Front wing carbon weave" 
                style="width:100%; background:#0B0B0E; border:1px solid #2D2D3B; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
            </div>

            <div>
              <label style="display:inline-flex; align-items:center; gap:6px; font-size:0.78rem; color:#ECECF1; cursor:pointer;">
                <input type="checkbox" id="mVisualFeatured" ${card.isFeatured ? 'checked' : ''} style="accent-color:#F25912;" /> Featured Card (Takes prominent double-height space)
              </label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:10px;">
              <button type="button" id="cancelVisualModalBtn" class="btn btn-secondary btn-sm">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="background:#F25912; border-color:#F25912;">Save Card</button>
            </div>
          </form>
        </div>
      </div>
    `;

    const close = () => { modalWrap.innerHTML = ''; };
    document.getElementById('closeVisualModalBtn').addEventListener('click', close);
    document.getElementById('cancelVisualModalBtn').addEventListener('click', close);

    document.getElementById('btnPickVisualImg').addEventListener('click', () => {
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
              document.getElementById('mVisualImgUrl').value = clean;
              document.getElementById('mVisualImgPreview').innerHTML = `<img src="${escapeHtml(clean)}" style="width:100%; height:100%; object-fit:cover;" />`;
            }
          }
        },
      });
    });

    document.getElementById('mVisualImgUrl').addEventListener('input', (e) => {
      const u = e.target.value.trim();
      const prev = document.getElementById('mVisualImgPreview');
      if (u) {
        prev.innerHTML = `<img src="${escapeHtml(u)}" style="width:100%; height:100%; object-fit:cover;" />`;
      } else {
        prev.innerHTML = `<span style="color:#6B6F7B; font-size:0.75rem; font-family:monospace;">No image selected</span>`;
      }
    });

    document.getElementById('visualCardModalForm').addEventListener('submit', (e) => {
      e.preventDefault();
      card.title = document.getElementById('mVisualTitle').value.trim();
      card.imageUrl = ensureCleanUrl(document.getElementById('mVisualImgUrl').value);
      card.altText = document.getElementById('mVisualAlt').value.trim();
      card.isFeatured = document.getElementById('mVisualFeatured').checked;

      if (isNew) {
        cards.push(card);
      }

      close();
      document.getElementById('visualCardsContainer').innerHTML = renderVisualCardsList(cards);
      bindVisualCardsEvents();
      markDirty();
    });
  }

  // ============================================================
  //  EVENT BINDINGS
  // ============================================================

  function bindInterfaceEvents(container) {
    // Accordion toggles
    container.querySelectorAll('.cms-block-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const targetId = header.getAttribute('data-toggle');
        const body = document.getElementById(targetId);
        const chevron = header.querySelector('.block-chevron');
        if (body) {
          const isHidden = body.style.display === 'none';
          body.style.display = isHidden ? 'flex' : 'none';
          if (chevron) {
            chevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(-90deg)';
          }
        }
      });
    });

    // Top action bar
    document.getElementById('btnCarSaveDraft')?.addEventListener('click', () => saveDraft(false));
    document.getElementById('btnCarPublish')?.addEventListener('click', () => publishLive());

    // Mark dirty on any input change
    container.querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('input', () => markDirty());
    });

    // Bind sub-managers
    bindStagesEvents();
    bindKeySpecsEvents();
    bindCategoryTabsEvents();
    bindSysCardsEvents();
    bindBuildPhasesEvents();
    bindVisualCardsEvents();
  }

  function refreshStageTimeline() {
    const stages = currentData.carExperience.stages || [];
    const totalFrames = parseInt(document.getElementById('carTotalFrames')?.value || 240, 10);
    const bar = document.getElementById('scrollTimelineBar');
    const labels = document.getElementById('scrollTimelineLabels');
    if (bar) bar.innerHTML = renderScrollTimeline(stages, totalFrames);
    if (labels) labels.innerHTML = renderScrollTimelineLabels(stages);
  }

  function bindStagesEvents() {
    const stages = currentData.carExperience.stages || [];
    const totalFrames = () => parseInt(document.getElementById('carTotalFrames')?.value || 240, 10);

    // ── Add stage ──
    document.getElementById('btnAddStageBtn')?.addEventListener('click', () => {
      const newStage = {
        id: 'stage-' + Date.now(),
        stageNumber: stages.length + 1,
        stageName: 'NEW STAGE',
        frameNumber: String(Math.round((stages.length / 5) * totalFrames())).padStart(3, '0'),
        eyebrow: '',
        heading: 'Stage Heading',
        headingHighlight: '',
        description: '',
        minScroll: parseFloat((stages.length / 5).toFixed(2)),
        maxScroll: parseFloat(((stages.length + 1) / 5).toFixed(2)),
        stats: [
          { label: 'Metric', value: '0', unit: 'unit' },
          { label: 'Metric', value: '0', unit: 'unit' },
        ],
        order: stages.length + 1,
      };
      stages.push(newStage);
      const container = document.getElementById('stagesListContainer');
      if (container) {
        container.innerHTML = renderStagesList(stages, totalFrames());
        bindStagesEvents();
      }
      refreshStageTimeline();
      // Auto-open the new stage
      const newBody = document.getElementById(`stage-body-${newStage.id}`);
      if (newBody) {
        newBody.style.display = 'flex';
        const chevron = newBody.closest('.stage-editor-card')?.querySelector('.stage-card-chevron');
        if (chevron) chevron.style.transform = 'rotate(90deg)';
        newBody.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      markDirty();
    });

    // ── Accordion expand/collapse ──
    document.querySelectorAll('.stage-card-header').forEach(header => {
      header.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        const stId = header.getAttribute('data-stage-id');
        const body = document.getElementById(`stage-body-${stId}`);
        const chevron = header.querySelector('.stage-card-chevron');
        if (!body) return;
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'flex';
        if (chevron) chevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
      });
    });

    // ── Inline field updates → sync to data model ──
    document.querySelectorAll('.stage-field').forEach(input => {
      const handler = (e) => {
        const field = e.currentTarget.getAttribute('data-field');
        const stId = e.currentTarget.getAttribute('data-id');
        const st = stages.find(s => s.id === stId);
        if (!st) return;

        const val = e.currentTarget.value;
        if (field === 'stageName')        { st.stageName = val.trim(); }
        else if (field === 'frameNumber') { st.frameNumber = val.trim(); }
        else if (field === 'eyebrow')     { st.eyebrow = val.trim(); }
        else if (field === 'heading')     { st.heading = val.trim(); }
        else if (field === 'headingHighlight') { st.headingHighlight = val.trim(); }
        else if (field === 'description') { st.description = val.trim(); }
        else if (field === 'minScroll')   { st.minScroll = parseFloat(val) || 0; refreshStageTimeline(); }
        else if (field === 'maxScroll')   { st.maxScroll = parseFloat(val) || 0; refreshStageTimeline(); }
        else if (field === 'stat0_label') { if (!st.stats) st.stats = [{}]; if (!st.stats[0]) st.stats[0] = {}; st.stats[0].label = val.trim(); }
        else if (field === 'stat0_value') { if (!st.stats) st.stats = [{}]; if (!st.stats[0]) st.stats[0] = {}; st.stats[0].value = val.trim(); }
        else if (field === 'stat0_unit')  { if (!st.stats) st.stats = [{}]; if (!st.stats[0]) st.stats[0] = {}; st.stats[0].unit = val.trim(); }
        else if (field === 'stat1_label') { if (!st.stats) st.stats = [{},{}]; if (!st.stats[1]) st.stats[1] = {}; st.stats[1].label = val.trim(); }
        else if (field === 'stat1_value') { if (!st.stats) st.stats = [{},{}]; if (!st.stats[1]) st.stats[1] = {}; st.stats[1].value = val.trim(); }
        else if (field === 'stat1_unit')  { if (!st.stats) st.stats = [{},{}]; if (!st.stats[1]) st.stats[1] = {}; st.stats[1].unit = val.trim(); }

        markDirty();
      };
      input.addEventListener('input', handler);
      input.addEventListener('change', handler);
    });

    // ── Delete stage ──
    document.querySelectorAll('.btn-del-stage').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = e.currentTarget.getAttribute('data-id');
        const st = stages.find(s => s.id === id);
        if (!st) return;
        if (!confirm(`Delete stage "${st.stageName || 'Stage ' + st.stageNumber}"? This cannot be undone.`)) return;
        currentData.carExperience.stages = stages.filter(s => s.id !== id);
        // Re-number remaining stages
        currentData.carExperience.stages.forEach((s, i) => { s.stageNumber = i + 1; });
        const container = document.getElementById('stagesListContainer');
        if (container) {
          container.innerHTML = renderStagesList(currentData.carExperience.stages, totalFrames());
          bindStagesEvents();
        }
        refreshStageTimeline();
        markDirty();
      });
    });

    // ── Reorder: move up ──
    document.querySelectorAll('.btn-stage-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (idx <= 0) return;
        const tmp = stages[idx];
        stages[idx] = stages[idx - 1];
        stages[idx - 1] = tmp;
        stages.forEach((s, i) => { s.stageNumber = i + 1; });
        const container = document.getElementById('stagesListContainer');
        if (container) {
          container.innerHTML = renderStagesList(stages, totalFrames());
          bindStagesEvents();
        }
        refreshStageTimeline();
        markDirty();
      });
    });

    // ── Reorder: move down ──
    document.querySelectorAll('.btn-stage-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (idx >= stages.length - 1) return;
        const tmp = stages[idx];
        stages[idx] = stages[idx + 1];
        stages[idx + 1] = tmp;
        stages.forEach((s, i) => { s.stageNumber = i + 1; });
        const container = document.getElementById('stagesListContainer');
        if (container) {
          container.innerHTML = renderStagesList(stages, totalFrames());
          bindStagesEvents();
        }
        refreshStageTimeline();
        markDirty();
      });
    });
  }

  function bindKeySpecsEvents() {
    const specs = currentData.keySpecs || [];

    document.getElementById('btnAddKeySpecBtn')?.addEventListener('click', () => openKeySpecModal(null));

    document.querySelectorAll('.btn-edit-keyspec').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openKeySpecModal(id);
      });
    });

    document.querySelectorAll('.btn-del-keyspec').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Delete this key spec?')) {
          currentData.keySpecs = specs.filter(s => s.id !== id);
          document.getElementById('keySpecsContainer').innerHTML = renderKeySpecsList(currentData.keySpecs);
          bindKeySpecsEvents();
          markDirty();
        }
      });
    });

    document.querySelectorAll('.btn-keyspec-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (idx > 0) {
          const tmp = specs[idx];
          specs[idx] = specs[idx - 1];
          specs[idx - 1] = tmp;
          document.getElementById('keySpecsContainer').innerHTML = renderKeySpecsList(specs);
          bindKeySpecsEvents();
          markDirty();
        }
      });
    });

    document.querySelectorAll('.btn-keyspec-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (idx < specs.length - 1) {
          const tmp = specs[idx];
          specs[idx] = specs[idx + 1];
          specs[idx + 1] = tmp;
          document.getElementById('keySpecsContainer').innerHTML = renderKeySpecsList(specs);
          bindKeySpecsEvents();
          markDirty();
        }
      });
    });
  }

  function bindCategoryTabsEvents() {
    const categories = currentData.engineeringSection.categories || [];

    document.querySelectorAll('.btn-cat-tab').forEach(btn => {
      btn.addEventListener('click', (e) => {
        activeEngTabId = e.currentTarget.getAttribute('data-id');
        document.getElementById('engCategoryTabsList').innerHTML = renderCategoryTabs(categories);
        document.getElementById('activeCategoryContentContainer').innerHTML = renderActiveCategoryPanel(categories);
        bindCategoryTabsEvents();
        bindSysCardsEvents();
      });
    });

    document.getElementById('btnAddCategoryTabBtn')?.addEventListener('click', () => {
      const title = prompt('Enter new Category Tab Title:');
      if (!title || !title.trim()) return;
      const slug = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
      categories.push({
        id: slug || 'tab-' + Date.now(),
        title: title.trim(),
        icon: 'fas fa-cube',
        cards: [],
        order: categories.length + 1,
        visible: true,
      });
      activeEngTabId = categories[categories.length - 1].id;
      document.getElementById('engCategoryTabsList').innerHTML = renderCategoryTabs(categories);
      document.getElementById('activeCategoryContentContainer').innerHTML = renderActiveCategoryPanel(categories);
      bindCategoryTabsEvents();
      bindSysCardsEvents();
      markDirty();
    });
  }

  function bindSysCardsEvents() {
    const categories = currentData.engineeringSection.categories || [];
    const active = categories.find(c => c.id === activeEngTabId);

    document.getElementById('btnAddSysCardBtn')?.addEventListener('click', () => openSysCardModal(null));

    document.getElementById('btnDeleteCurrentCatTab')?.addEventListener('click', () => {
      if (categories.length <= 1) {
        showToast('At least one engineering category tab must remain.', 'warn');
        return;
      }
      if (confirm(`Delete the "${active?.title}" category and all its cards?`)) {
        currentData.engineeringSection.categories = categories.filter(c => c.id !== activeEngTabId);
        activeEngTabId = currentData.engineeringSection.categories[0].id;
        document.getElementById('engCategoryTabsList').innerHTML = renderCategoryTabs(currentData.engineeringSection.categories);
        document.getElementById('activeCategoryContentContainer').innerHTML = renderActiveCategoryPanel(currentData.engineeringSection.categories);
        bindCategoryTabsEvents();
        bindSysCardsEvents();
        markDirty();
      }
    });

    document.querySelectorAll('.btn-edit-syscard').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openSysCardModal(id);
      });
    });

    document.querySelectorAll('.btn-del-syscard').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Delete this subsystem card?')) {
          if (active) {
            active.cards = (active.cards || []).filter(c => c.id !== id);
            document.getElementById('activeCategoryContentContainer').innerHTML = renderActiveCategoryPanel(categories);
            bindSysCardsEvents();
            markDirty();
          }
        }
      });
    });
  }

  function bindBuildPhasesEvents() {
    const phases = currentData.buildJourneySection.phases || [];

    document.getElementById('btnAddBuildPhaseBtn')?.addEventListener('click', () => openBuildPhaseModal(null));

    document.querySelectorAll('.btn-edit-phase').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openBuildPhaseModal(id);
      });
    });

    document.querySelectorAll('.btn-del-phase').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Delete this build phase?')) {
          currentData.buildJourneySection.phases = phases.filter(p => p.id !== id);
          document.getElementById('buildPhasesContainer').innerHTML = renderBuildPhasesList(currentData.buildJourneySection.phases);
          bindBuildPhasesEvents();
          markDirty();
        }
      });
    });

    document.querySelectorAll('.btn-phase-up').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (idx > 0) {
          const tmp = phases[idx];
          phases[idx] = phases[idx - 1];
          phases[idx - 1] = tmp;
          document.getElementById('buildPhasesContainer').innerHTML = renderBuildPhasesList(phases);
          bindBuildPhasesEvents();
          markDirty();
        }
      });
    });

    document.querySelectorAll('.btn-phase-down').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.getAttribute('data-idx'), 10);
        if (idx < phases.length - 1) {
          const tmp = phases[idx];
          phases[idx] = phases[idx + 1];
          phases[idx + 1] = tmp;
          document.getElementById('buildPhasesContainer').innerHTML = renderBuildPhasesList(phases);
          bindBuildPhasesEvents();
          markDirty();
        }
      });
    });
  }

  function bindVisualCardsEvents() {
    const cards = currentData.visualBreakdownSection.cards || [];

    document.getElementById('btnAddVisualCardBtn')?.addEventListener('click', () => openVisualCardModal(null));

    document.querySelectorAll('.btn-edit-visual').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        openVisualCardModal(id);
      });
    });

    document.querySelectorAll('.btn-del-visual').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.getAttribute('data-id');
        if (confirm('Delete this visual card?')) {
          currentData.visualBreakdownSection.cards = cards.filter(c => c.id !== id);
          document.getElementById('visualCardsContainer').innerHTML = renderVisualCardsList(currentData.visualBreakdownSection.cards);
          bindVisualCardsEvents();
          markDirty();
        }
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
    const dot = document.getElementById('carSaveDot');
    const text = document.getElementById('carSaveText');
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
    const exp = currentData.carExperience || {};
    const payload = {
      carExperience: {
        visible: document.getElementById('carExpVisible')?.checked !== false,
        totalFrames: parseInt(document.getElementById('carTotalFrames')?.value || 240, 10),
        framePattern: (document.getElementById('carFramePattern')?.value || 'assets/videotophoto/ezgif-frame-{num}.jpg').trim(),
        stages: (exp.stages || []).map((s, idx) => ({
          ...s,
          order: idx + 1,
        })),
      },

      keySpecs: (currentData.keySpecs || []).map((s, idx) => ({
        ...s,
        order: idx + 1,
      })),

      engineeringSection: {
        visible: true,
        eyebrow: document.getElementById('engEyebrow')?.value.trim() || 'Engineering Systems',
        heading: document.getElementById('engHeading')?.value.trim() || 'Built for Performance',
        headingHighlight: document.getElementById('engHeadingHighlight')?.value.trim() || 'Performance',
        description: document.getElementById('engDescription')?.value.trim() || '',
        watermarkText: document.getElementById('engWatermark')?.value.trim() || 'TECH',
        categories: (currentData.engineeringSection.categories || []).map((cat, idx) => ({
          ...cat,
          order: idx + 1,
        })),
      },

      buildJourneySection: {
        visible: true,
        eyebrow: document.getElementById('buildEyebrow')?.value.trim() || 'From Concept to Circuit',
        heading: document.getElementById('buildHeading')?.value.trim() || 'The Build Journey',
        headingHighlight: document.getElementById('buildHeadingHighlight')?.value.trim() || 'Journey',
        description: document.getElementById('buildDescription')?.value.trim() || '',
        phases: (currentData.buildJourneySection.phases || []).map((p, idx) => ({
          ...p,
          order: idx + 1,
        })),
      },

      visualBreakdownSection: {
        visible: true,
        eyebrow: document.getElementById('visualEyebrow')?.value.trim() || 'Visual Breakdown',
        heading: document.getElementById('visualHeading')?.value.trim() || 'In the Details',
        headingHighlight: document.getElementById('visualHeadingHighlight')?.value.trim() || 'Details',
        description: document.getElementById('visualDescription')?.value?.trim() || '',
        cards: (currentData.visualBreakdownSection.cards || []).map((c, idx) => ({
          ...c,
          imageUrl: ensureCleanUrl(c.imageUrl),
          order: idx + 1,
        })),
      },

      openPositionsSection: {
        visible: true,
        eyebrow: document.getElementById('ctaEyebrow')?.value.trim() || 'Open Positions',
        heading: document.getElementById('ctaHeading')?.value.trim() || 'Want to Build the Next Machine?',
        headingHighlight: document.getElementById('ctaHeadingHighlight')?.value.trim() || 'Next Machine?',
        description: document.getElementById('ctaDescription')?.value.trim() || '',
        primaryCta: {
          text: document.getElementById('ctaPrimaryText')?.value.trim() || 'Join the Team',
          link: document.getElementById('ctaPrimaryLink')?.value.trim() || 'index.html#recruitment',
          enabled: document.getElementById('ctaPrimaryEnabled')?.checked !== false,
        },
        secondaryCta: {
          text: document.getElementById('ctaSecondaryText')?.value.trim() || 'Get in Touch',
          link: document.getElementById('ctaSecondaryLink')?.value.trim() || 'contact.html',
          enabled: document.getElementById('ctaSecondaryEnabled')?.checked !== false,
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
      const res = await API().patch('/admin/car/page', payload);
      if (res && res.success) {
        isDirty = false;
        updateSaveBadge('saved');
        if (!silent) showToast('Car page draft saved successfully.');
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

    if (!confirm('Are you sure you want to publish these changes live to the public Car page?')) {
      return;
    }

    isSaving = true;
    updateSaveBadge('saving');

    try {
      // First save current draft to ensure all form inputs are stored
      const payload = gatherPayload();
      await API().patch('/admin/car/page', payload);

      // Now trigger publish
      const res = await API().post('/admin/car/page/publish');
      if (res && res.success) {
        isDirty = false;
        updateSaveBadge('saved');
        showToast('Car page published live successfully!');
        if (res.data) {
          currentData.status = res.data.status || 'published';
          currentData.version = res.data.version || currentData.version;
          currentData.lastPublishedAt = res.data.lastPublishedAt;
        }
        // Reload interface with updated publication info
        const container = document.querySelector('.car-cms-root')?.parentElement;
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
      e.returnValue = 'You have unsaved changes in Car Control Center.';
    }
  });

  // Export module to global scope
  window.AdminCarModule = { renderCarModule };
})();
