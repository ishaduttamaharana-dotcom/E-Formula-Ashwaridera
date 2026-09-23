/* ============================================================
   achievements.js — Unified Achievements Page Control Center
   ASHWA RIDERS Formula Student Electric Team

   Structure:
     01. HEADER & SETTINGS
     02. OUR ACHIEVEMENTS (Eyebrow, title, highlight, description,
         dynamic categories with auto-counts, achievements roster)
     03. OUR JOURNEY (Timeline section, background image & overlay,
         chronological timeline events)
     04. FOOTER (Shared global footer reference)

   Draft / Preview / Publish lifecycle with lightweight JSON only.
============================================================ */

(function () {
  'use strict';

  let currentData = null;
  let isDirty = false;
  let activeCategoryFilter = 'all';
  let searchQuery = '';

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

  // ============================================================
  //  MAIN ENTRY POINT
  // ============================================================
  async function renderAchievementsModule(container) {
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:360px; color:#9696A0;">
        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-right:12px; color:#F25912;"></i>
        <span style="font-family:monospace; font-size:0.95rem;">Loading Achievements Page Control Center...</span>
      </div>
    `;

    await loadAchievementsData(container);
  }

  async function loadAchievementsData(container) {
    try {
      const res = await API().get('/admin/achievements/page');
      if (res && res.success && res.data) {
        currentData = res.data;
        normalizeData();
        renderInterface(container);
      } else {
        throw new Error(res?.message || 'Failed to load Achievements page data.');
      }
    } catch (err) {
      console.error('Error loading Achievements CMS data:', err);
      container.innerHTML = `
        <div style="background:#141419; border:1px solid #FF4D4D; border-radius:12px; padding:40px; text-align:center; max-width:600px; margin:40px auto;">
          <i class="fas fa-triangle-exclamation" style="font-size:2.5rem; color:#FF4D4D; margin-bottom:16px;"></i>
          <h2 style="font-size:1.25rem; font-weight:800; color:#FFFFFF; margin-bottom:8px;">Unable to Load Achievements Control Center</h2>
          <p style="color:#9696A0; font-size:0.9rem; margin-bottom:24px;">${escapeHtml(err.message)}</p>
          <button type="button" class="btn btn-primary" id="retryAchieveLoadBtn" style="background:#F25912; border-color:#F25912;">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
      document.getElementById('retryAchieveLoadBtn')?.addEventListener('click', () => loadAchievementsData(container));
    }
  }

  function normalizeData() {
    if (!currentData) return;
    currentData.settings = currentData.settings || {};
    currentData.achievementsSection = currentData.achievementsSection || {};
    currentData.achievementsSection.categories = currentData.achievementsSection.categories || [];
    currentData.achievementsSection.achievements = currentData.achievementsSection.achievements || [];
    currentData.timelineSection = currentData.timelineSection || {};
    currentData.timelineSection.events = currentData.timelineSection.events || [];
  }

  function calculateActiveCounts() {
    const achievements = currentData.achievementsSection.achievements || [];
    const categories = currentData.achievementsSection.categories || [];

    const activeAchievements = achievements.filter(a => a.published !== false);
    const totalCount = activeAchievements.length;

    const counts = { all: totalCount };
    categories.forEach(cat => {
      const slug = (cat.slug || '').toLowerCase();
      counts[slug] = activeAchievements.filter(a => (a.category || '').toLowerCase() === slug).length;
    });

    return counts;
  }

  // ============================================================
  //  RENDER MAIN INTERFACE
  // ============================================================
  function renderInterface(container) {
    const isDraft = currentData.status === 'draft';
    const statusColor = isDraft ? '#E3B341' : '#2EA44F';
    const statusBg = isDraft ? 'rgba(227, 179, 65, 0.12)' : 'rgba(46, 164, 79, 0.12)';
    const statusBorder = isDraft ? 'rgba(227, 179, 65, 0.3)' : 'rgba(46, 164, 79, 0.3)';
    const statusText = isDraft ? 'Draft Changes' : 'Published Live';

    container.innerHTML = `
      <!-- TOP STATUS & ACTION BAR -->
      <div style="background:#141419; border:1px solid #282832; border-radius:12px; padding:20px 24px; margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
            <h1 style="font-size:1.35rem; font-weight:800; color:#FFFFFF; margin:0; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px;">
              <i class="fas fa-trophy" style="color:#F25912;"></i> ACHIEVEMENTS PAGE CONTROL CENTER
            </h1>
            <span id="cmsLiveStatusBadge" style="display:inline-flex; align-items:center; gap:6px; background:${statusBg}; border:1px solid ${statusBorder}; color:${statusColor}; padding:4px 10px; border-radius:12px; font-size:0.75rem; font-weight:700;">
              <span style="width:7px; height:7px; border-radius:50%; background:${statusColor};"></span>
              ${statusText}
            </span>
          </div>
          <div style="font-size:0.8rem; color:#8E929E; display:flex; gap:16px; flex-wrap:wrap;">
            <span><i class="fas fa-clock" style="margin-right:5px;"></i> Last Saved: <strong style="color:#FFFFFF;" id="statusLastEdited">${formatDate(currentData.lastEditedAt)}</strong></span>
            <span><i class="fas fa-globe" style="margin-right:5px;"></i> Last Published: <strong style="color:#FFFFFF;" id="statusLastPublished">${formatDate(currentData.lastPublishedAt)}</strong></span>
            <span><i class="fas fa-code-branch" style="margin-right:5px;"></i> Version: <strong style="color:#FFFFFF;">v${currentData.version || 1}</strong></span>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <a href="/achievements.html?preview=true" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; padding:8px 14px; text-decoration:none; background:#1C1C24; color:#FFFFFF; border:1px solid #333340; border-radius:6px; font-weight:600;">
            <i class="fas fa-arrow-up-right-from-square"></i> PREVIEW WEBSITE
          </a>
          <button type="button" class="btn btn-secondary btn-sm" id="btnSaveDraft" style="display:inline-flex; align-items:center; gap:6px; padding:8px 16px; background:#242430; color:#FFFFFF; border:1px solid #3B3B4D; border-radius:6px; font-weight:600;">
            <i class="fas fa-floppy-disk"></i> SAVE DRAFT
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="btnPublishLive" style="display:inline-flex; align-items:center; gap:6px; padding:8px 18px; background:#F25912; color:#FFFFFF; border:1px solid #F25912; border-radius:6px; font-weight:700;">
            <i class="fas fa-paper-plane"></i> PUBLISH LIVE
          </button>
        </div>
      </div>

      <!-- ACCORDION SECTIONS -->
      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- BLOCK 01: HEADER -->
        ${renderBlock01Header()}

        <!-- BLOCK 02: OUR ACHIEVEMENTS -->
        ${renderBlock02Achievements()}

        <!-- BLOCK 03: OUR JOURNEY -->
        ${renderBlock03Journey()}

        <!-- BLOCK 04: FOOTER -->
        ${renderBlock04Footer()}
      </div>
    `;

    bindAccordionToggles(container);
    bindHeaderForm(container);
    bindAchievementsSection(container);
    bindTimelineSection(container);
    bindGlobalActions(container);
  }

  // ============================================================
  //  BLOCK 01: HEADER & SETTINGS
  // ============================================================
  function renderBlock01Header() {
    const s = currentData.settings || {};
    return `
      <div class="cms-accordion-card" style="background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div class="cms-accordion-header" data-toggle="block01" style="padding:18px 24px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:#181820;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:700; color:#F25912; font-size:0.9rem;">01</span>
            <div>
              <h3 style="font-size:1rem; font-weight:700; color:#FFFFFF; margin:0;">HEADER</h3>
              <p style="font-size:0.78rem; color:#8E929E; margin:2px 0 0 0;">Existing global website header & SEO metadata</p>
            </div>
          </div>
          <i class="fas fa-chevron-down cms-accordion-chevron" style="color:#8E929E; transition:transform 0.2s;"></i>
        </div>

        <div class="cms-accordion-body" id="body-block01" style="display:none; padding:24px; border-top:1px solid #22222B;">
          <div style="background:#1A1A24; border:1px solid #2E2E3D; border-left:3px solid #F25912; border-radius:6px; padding:14px 16px; margin-bottom:20px;">
            <div style="display:flex; align-items:center; gap:8px; font-weight:700; color:#FFFFFF; font-size:0.85rem; margin-bottom:4px;">
              <i class="fas fa-circle-info" style="color:#F25912;"></i> Shared Global Header Notice
            </div>
            <p style="font-size:0.8rem; color:#9FA7A6; margin:0; line-height:1.5;">
              The Achievements page uses the shared Ashwa Riders global header. Logo, navigation items (Home, About, Team, Car, Gallery, Sponsors, Achievements, Contact, Join Team), and auth controls remain consistent with other pages. The <strong>Achievements</strong> navigation item is active on this page.
            </p>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:18px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">Page Window Title</label>
              <input type="text" id="settingPageTitle" value="${escapeHtml(s.pageTitle || '')}" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.88rem;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">Canonical URL</label>
              <input type="text" id="settingCanonicalUrl" value="${escapeHtml(s.canonicalUrl || 'achievements.html')}" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.88rem;" />
            </div>
          </div>

          <div style="margin-top:16px;">
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">SEO Meta Title</label>
            <input type="text" id="settingSeoTitle" value="${escapeHtml(s.seoTitle || '')}" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.88rem;" />
          </div>

          <div style="margin-top:16px;">
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">SEO Meta Description</label>
            <textarea id="settingSeoDesc" rows="2" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.88rem; resize:vertical;">${escapeHtml(s.seoDescription || '')}</textarea>
          </div>

          <div style="margin-top:16px;">
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#8E929E; margin-bottom:6px;">Social Sharing (OG) Image URL</label>
            <div style="display:flex; gap:10px; align-items:center;">
              <input type="text" id="settingOgImage" value="${escapeHtml(s.ogImageUrl || '')}" placeholder="https://res.cloudinary.com/..." style="flex:1; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.88rem;" />
              <button type="button" class="btn btn-secondary btn-sm" id="btnPickOgImage" style="padding:10px 14px; white-space:nowrap; background:#22222E; border:1px solid #333345; color:#FFFFFF; border-radius:6px;">
                <i class="fas fa-image"></i> MediaPicker
              </button>
            </div>
            ${s.ogImageUrl ? `<div style="margin-top:8px;"><img src="${escapeHtml(s.ogImageUrl)}" style="max-height:80px; border-radius:6px; border:1px solid #333345;" /></div>` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  //  BLOCK 02: OUR ACHIEVEMENTS
  // ============================================================
  function renderBlock02Achievements() {
    const sec = currentData.achievementsSection || {};
    const categories = sec.categories || [];
    const achievements = sec.achievements || [];
    const counts = calculateActiveCounts();

    // Filter achievements based on UI selection
    const filteredAchievements = achievements.filter(item => {
      const matchCat = activeCategoryFilter === 'all' || (item.category || '').toLowerCase() === activeCategoryFilter.toLowerCase();
      const matchQuery = !searchQuery || (
        (item.title || '').toLowerCase().includes(searchQuery) ||
        (item.event || '').toLowerCase().includes(searchQuery) ||
        (item.description || '').toLowerCase().includes(searchQuery) ||
        (item.rank || '').toLowerCase().includes(searchQuery) ||
        (item.year || '').toString().includes(searchQuery)
      );
      return matchCat && matchQuery;
    });

    return `
      <div class="cms-accordion-card" style="background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div class="cms-accordion-header" data-toggle="block02" style="padding:18px 24px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:#181820;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:700; color:#F25912; font-size:0.9rem;">02</span>
            <div>
              <h3 style="font-size:1rem; font-weight:700; color:#FFFFFF; margin:0;">OUR ACHIEVEMENTS</h3>
              <p style="font-size:0.78rem; color:#8E929E; margin:2px 0 0 0;">Achievement cards, dynamic categories, real-time counts & section settings</p>
            </div>
          </div>
          <i class="fas fa-chevron-down cms-accordion-chevron" style="color:#8E929E; transition:transform 0.2s;"></i>
        </div>

        <div class="cms-accordion-body" id="body-block02" style="display:block; padding:24px; border-top:1px solid #22222B;">
          <!-- PART A: SECTION SETTINGS -->
          <div style="background:#101015; border:1px solid #22222C; border-radius:8px; padding:18px; margin-bottom:24px;">
            <h4 style="font-size:0.85rem; font-weight:700; color:#FFFFFF; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.04em; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-sliders" style="color:#F25912;"></i> Section Settings
            </h4>

            <div style="display:grid; grid-template-columns:1fr 2fr 1fr; gap:14px; margin-bottom:14px;">
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Eyebrow</label>
                <input type="text" id="achSecEyebrow" value="${escapeHtml(sec.eyebrow || 'OUR ACHIEVEMENTS')}" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:9px 12px; color:#FFFFFF; font-size:0.88rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Main Heading</label>
                <input type="text" id="achSecHeading" value="${escapeHtml(sec.heading || 'MILESTONES THAT DEFINE US')}" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:9px 12px; color:#FFFFFF; font-size:0.88rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Highlighted Text</label>
                <input type="text" id="achSecHighlight" value="${escapeHtml(sec.headingHighlight || 'DEFINE US')}" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:9px 12px; color:#FFFFFF; font-size:0.88rem;" />
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Description</label>
              <textarea id="achSecDescription" rows="2" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:9px 12px; color:#FFFFFF; font-size:0.88rem; resize:vertical;">${escapeHtml(sec.description || '')}</textarea>
            </div>

            <div style="display:flex; align-items:center; gap:16px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-size:0.85rem;">
                <input type="checkbox" id="achSecVisible" ${sec.visible !== false ? 'checked' : ''} style="accent-color:#F25912; width:16px; height:16px;" />
                Section Visible on Live Website
              </label>
            </div>
          </div>

          <!-- PART B: DYNAMIC CATEGORIES MANAGER -->
          <div style="background:#101015; border:1px solid #22222C; border-radius:8px; padding:18px; margin-bottom:24px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
              <div>
                <h4 style="font-size:0.85rem; font-weight:700; color:#FFFFFF; margin:0; text-transform:uppercase; letter-spacing:0.04em; display:flex; align-items:center; gap:8px;">
                  <i class="fas fa-tags" style="color:#F25912;"></i> Achievement Categories & Live Counts
                </h4>
                <p style="font-size:0.78rem; color:#8E929E; margin:2px 0 0 0;">Counts are automatically computed from published achievements. "ALL" is generated dynamically.</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" id="btnAddCategory" style="padding:6px 12px; background:#1C1C24; border:1px solid #333342; color:#FFFFFF; border-radius:6px; font-size:0.78rem;">
                <i class="fas fa-plus"></i> Add Category
              </button>
            </div>

            <!-- Categories pills / summary -->
            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px;">
              <div style="background:#1C1C24; border:1px solid #F25912; border-radius:6px; padding:6px 12px; font-size:0.8rem; color:#FFFFFF; font-weight:700;">
                ALL <span style="background:rgba(242,89,18,0.25); color:#F25912; padding:2px 6px; border-radius:4px; font-size:0.72rem; margin-left:4px;">(${counts.all || 0})</span>
              </div>
              ${categories.map((c, i) => {
                const count = counts[(c.slug || '').toLowerCase()] || 0;
                return `
                  <div style="background:#181822; border:1px solid #2E2E3E; border-radius:6px; padding:6px 10px; font-size:0.8rem; color:#FFFFFF; display:flex; align-items:center; gap:8px;">
                    <i class="${escapeHtml(c.icon || 'fas fa-trophy')}" style="color:#F25912; font-size:0.75rem;"></i>
                    <span>${escapeHtml(c.name)}</span>
                    <span style="background:rgba(255,255,255,0.06); color:#8E929E; padding:1px 6px; border-radius:4px; font-size:0.72rem;">(${count})</span>
                    <button type="button" data-action="edit-cat" data-index="${i}" title="Edit Category" style="background:none; border:none; color:#8E929E; cursor:pointer; padding:0 2px;">
                      <i class="fas fa-pen-to-square" style="font-size:0.72rem;"></i>
                    </button>
                    <button type="button" data-action="delete-cat" data-index="${i}" title="Delete Category" style="background:none; border:none; color:#FF4D4D; cursor:pointer; padding:0 2px;">
                      <i class="fas fa-trash-can" style="font-size:0.72rem;"></i>
                    </button>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <!-- PART C: ACHIEVEMENTS ROSTER -->
          <div style="background:#101015; border:1px solid #22222C; border-radius:8px; padding:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; flex-wrap:wrap; gap:12px;">
              <div>
                <h4 style="font-size:0.85rem; font-weight:700; color:#FFFFFF; margin:0; text-transform:uppercase; letter-spacing:0.04em; display:flex; align-items:center; gap:8px;">
                  <i class="fas fa-list-check" style="color:#F25912;"></i> Achievement Cards Roster (${achievements.length})
                </h4>
              </div>
              <button type="button" class="btn btn-primary btn-sm" id="btnAddAchievement" style="background:#F25912; border-color:#F25912; color:#FFFFFF; padding:8px 16px; border-radius:6px; font-weight:700;">
                <i class="fas fa-plus"></i> ADD ACHIEVEMENT
              </button>
            </div>

            <!-- Toolbar: Filter buttons + Search -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:18px; border-bottom:1px solid #1C1C26; padding-bottom:14px;">
              <!-- Category Filter Buttons -->
              <div style="display:flex; gap:6px; flex-wrap:wrap;" id="achieveFilterTabs">
                <button type="button" data-filter="all" class="cms-filter-tab ${activeCategoryFilter === 'all' ? 'active' : ''}" style="padding:6px 12px; border-radius:4px; font-size:0.76rem; font-weight:700; text-transform:uppercase; border:1px solid ${activeCategoryFilter === 'all' ? '#F25912' : '#2A2A38'}; background:${activeCategoryFilter === 'all' ? '#F25912' : '#181822'}; color:#FFFFFF; cursor:pointer;">
                  ALL (${counts.all || 0})
                </button>
                ${categories.map(c => {
                  const slug = (c.slug || '').toLowerCase();
                  const isActive = activeCategoryFilter.toLowerCase() === slug;
                  return `
                    <button type="button" data-filter="${slug}" class="cms-filter-tab ${isActive ? 'active' : ''}" style="padding:6px 12px; border-radius:4px; font-size:0.76rem; font-weight:700; text-transform:uppercase; border:1px solid ${isActive ? '#F25912' : '#2A2A38'}; background:${isActive ? '#F25912' : '#181822'}; color:#FFFFFF; cursor:pointer;">
                      ${escapeHtml(c.name)} (${counts[slug] || 0})
                    </button>
                  `;
                }).join('')}
              </div>

              <!-- Search Bar -->
              <div style="position:relative; width:220px;">
                <i class="fas fa-search" style="position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#666675; font-size:0.8rem;"></i>
                <input type="text" id="achieveSearchInput" value="${escapeHtml(searchQuery)}" placeholder="Search achievements..." style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:7px 12px 7px 30px; color:#FFFFFF; font-size:0.8rem;" />
              </div>
            </div>

            <!-- Achievement Cards Grid -->
            <div id="achievementsGridList" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
              ${filteredAchievements.length === 0 ? `
                <div style="grid-column:1/-1; text-align:center; padding:40px; color:#6B7280;">
                  <i class="fas fa-trophy" style="font-size:2rem; opacity:0.3; margin-bottom:10px; display:block;"></i>
                  <p style="margin:0;">No achievements found in this category.</p>
                </div>
              ` : filteredAchievements.map((item, index) => renderAchievementCardItem(item, index)).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderAchievementCardItem(item, index) {
    const isPub = item.published !== false;
    const catObj = (currentData.achievementsSection.categories || []).find(c => (c.slug || '').toLowerCase() === (item.category || '').toLowerCase());
    const catName = catObj ? catObj.name : item.category;

    return `
      <div style="background:#16161F; border:1px solid ${isPub ? '#282836' : '#3E2525'}; border-radius:8px; padding:16px; position:relative; display:flex; flex-direction:column; justify-content:space-between; transition:border-color 0.2s;">
        <div>
          <!-- Top Row: Year, Category Badge, Status -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-family:monospace; font-weight:800; color:#F25912; font-size:0.95rem;">${escapeHtml(item.year || '2026')}</span>
              <span style="background:rgba(255,255,255,0.06); color:#9FA7A6; padding:2px 8px; border-radius:4px; font-size:0.72rem; text-transform:uppercase; font-weight:600;">
                ${escapeHtml(catName)}
              </span>
            </div>
            <div>
              <span style="background:${isPub ? 'rgba(46,164,79,0.12)' : 'rgba(239,68,68,0.12)'}; color:${isPub ? '#2EA44F' : '#EF4444'}; border:1px solid ${isPub ? 'rgba(46,164,79,0.25)' : 'rgba(239,68,68,0.25)'}; padding:2px 8px; border-radius:10px; font-size:0.68rem; font-weight:700;">
                ${isPub ? 'PUBLISHED' : 'HIDDEN'}
              </span>
            </div>
          </div>

          <!-- Thumbnail Image / Icon -->
          <div style="width:100%; height:110px; border-radius:6px; background:#0E0E14; overflow:hidden; margin-bottom:12px; display:flex; align-items:center; justify-content:center; border:1px solid #22222E;">
            ${item.imageUrl ? `
              <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.imageAlt || item.title)}" style="width:100%; height:100%; object-fit:cover;" />
            ` : `
              <div style="color:#666675; text-align:center;">
                <i class="fas fa-trophy fa-2x"></i>
                <div style="font-size:0.7rem; margin-top:4px;">No Photo</div>
              </div>
            `}
          </div>

          <!-- Title & Description -->
          <h4 style="font-size:0.95rem; font-weight:700; color:#FFFFFF; margin:0 0 6px 0; line-height:1.35;">${escapeHtml(item.title)}</h4>
          <p style="font-size:0.8rem; color:#8E929E; margin:0 0 10px 0; line-height:1.5; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${escapeHtml(item.description || 'No description.')}
          </p>

          <!-- Location & Rank -->
          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #22222E; padding-top:8px; margin-top:8px; font-size:0.75rem;">
            <span style="color:#6B7280;"><i class="fas fa-map-marker-alt" style="margin-right:4px;"></i> ${escapeHtml(item.location || 'India')}</span>
            <span style="font-weight:700; color:#F25912;">${escapeHtml(item.rank || '')}</span>
          </div>
        </div>

        <!-- Card Actions Footer -->
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; pt:10px; border-top:1px solid #1C1C26; padding-top:10px;">
          <div style="display:flex; align-items:center; gap:6px;">
            <button type="button" data-action="move-ach-up" data-id="${item.id}" title="Move Up" style="background:#20202C; border:1px solid #2E2E3E; color:#FFFFFF; border-radius:4px; padding:4px 8px; font-size:0.72rem; cursor:pointer;">
              <i class="fas fa-chevron-up"></i>
            </button>
            <button type="button" data-action="move-ach-down" data-id="${item.id}" title="Move Down" style="background:#20202C; border:1px solid #2E2E3E; color:#FFFFFF; border-radius:4px; padding:4px 8px; font-size:0.72rem; cursor:pointer;">
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" data-action="duplicate-ach" data-id="${item.id}" title="Duplicate" style="background:#20202C; border:1px solid #2E2E3E; color:#FFFFFF; border-radius:4px; padding:5px 8px; font-size:0.72rem; cursor:pointer;">
              <i class="fas fa-copy"></i>
            </button>
            <button type="button" data-action="edit-ach" data-id="${item.id}" title="Edit" style="background:#F25912; border:1px solid #F25912; color:#FFFFFF; border-radius:4px; padding:5px 12px; font-size:0.72rem; font-weight:700; cursor:pointer;">
              <i class="fas fa-pen"></i> EDIT
            </button>
            <button type="button" data-action="delete-ach" data-id="${item.id}" title="Delete" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#EF4444; border-radius:4px; padding:5px 8px; font-size:0.72rem; cursor:pointer;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  //  BLOCK 03: OUR JOURNEY (TIMELINE)
  // ============================================================
  function renderBlock03Journey() {
    const tl = currentData.timelineSection || {};
    const events = tl.events || [];

    return `
      <div class="cms-accordion-card" style="background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div class="cms-accordion-header" data-toggle="block03" style="padding:18px 24px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:#181820;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:700; color:#F25912; font-size:0.9rem;">03</span>
            <div>
              <h3 style="font-size:1rem; font-weight:700; color:#FFFFFF; margin:0;">OUR JOURNEY</h3>
              <p style="font-size:0.78rem; color:#8E929E; margin:2px 0 0 0;">Timeline events, chronological milestones, background photo & overlay</p>
            </div>
          </div>
          <i class="fas fa-chevron-down cms-accordion-chevron" style="color:#8E929E; transition:transform 0.2s;"></i>
        </div>

        <div class="cms-accordion-body" id="body-block03" style="display:none; padding:24px; border-top:1px solid #22222B;">
          <!-- PART A: TIMELINE SECTION SETTINGS -->
          <div style="background:#101015; border:1px solid #22222C; border-radius:8px; padding:18px; margin-bottom:24px;">
            <h4 style="font-size:0.85rem; font-weight:700; color:#FFFFFF; margin:0 0 14px 0; text-transform:uppercase; letter-spacing:0.04em; display:flex; align-items:center; gap:8px;">
              <i class="fas fa-sliders" style="color:#F25912;"></i> Timeline Settings & Background
            </h4>

            <div style="display:grid; grid-template-columns:1fr 2fr 1fr; gap:14px; margin-bottom:14px;">
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Eyebrow</label>
                <input type="text" id="tlSecEyebrow" value="${escapeHtml(tl.eyebrow || 'OUR JOURNEY')}" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:9px 12px; color:#FFFFFF; font-size:0.88rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Main Heading</label>
                <input type="text" id="tlSecHeading" value="${escapeHtml(tl.heading || 'OUR TIMELINE')}" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:9px 12px; color:#FFFFFF; font-size:0.88rem;" />
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Highlighted Text</label>
                <input type="text" id="tlSecHighlight" value="${escapeHtml(tl.headingHighlight || 'TIMELINE')}" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:9px 12px; color:#FFFFFF; font-size:0.88rem;" />
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Description</label>
              <textarea id="tlSecDescription" rows="2" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:9px 12px; color:#FFFFFF; font-size:0.88rem; resize:vertical;">${escapeHtml(tl.description || '')}</textarea>
            </div>

            <!-- Background Image & Overlay -->
            <div style="display:grid; grid-template-columns:2fr 1fr; gap:16px; margin-bottom:14px;">
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Timeline Background Image</label>
                <div style="display:flex; gap:10px; align-items:center;">
                  <input type="text" id="tlBgImageUrl" value="${escapeHtml(tl.bgImageUrl || '')}" placeholder="https://res.cloudinary.com/..." style="flex:1; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:9px 12px; color:#FFFFFF; font-size:0.88rem;" />
                  <button type="button" class="btn btn-secondary btn-sm" id="btnPickTlBgImage" style="padding:9px 14px; white-space:nowrap; background:#22222E; border:1px solid #333345; color:#FFFFFF; border-radius:6px;">
                    <i class="fas fa-image"></i> MediaPicker
                  </button>
                </div>
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">
                  Overlay Darkness (<span id="tlOverlayVal">${Math.round((tl.overlayStrength || 0.78) * 100)}%</span>)
                </label>
                <input type="range" id="tlOverlayStrength" min="0" max="1" step="0.05" value="${tl.overlayStrength !== undefined ? tl.overlayStrength : 0.78}" style="width:100%; accent-color:#F25912; margin-top:10px;" />
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:16px;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-size:0.85rem;">
                <input type="checkbox" id="tlSecVisible" ${tl.visible !== false ? 'checked' : ''} style="accent-color:#F25912; width:16px; height:16px;" />
                Timeline Section Visible
              </label>
            </div>
          </div>

          <!-- PART B: TIMELINE EVENTS -->
          <div style="background:#101015; border:1px solid #22222C; border-radius:8px; padding:18px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <div>
                <h4 style="font-size:0.85rem; font-weight:700; color:#FFFFFF; margin:0; text-transform:uppercase; letter-spacing:0.04em; display:flex; align-items:center; gap:8px;">
                  <i class="fas fa-timeline" style="color:#F25912;"></i> Chronological Timeline Events (${events.length})
                </h4>
                <p style="font-size:0.78rem; color:#8E929E; margin:2px 0 0 0;">Events are rendered in vertical chronological order using the dark motorsport card layout.</p>
              </div>
              <button type="button" class="btn btn-primary btn-sm" id="btnAddTlEvent" style="background:#F25912; border-color:#F25912; color:#FFFFFF; padding:8px 16px; border-radius:6px; font-weight:700;">
                <i class="fas fa-plus"></i> ADD TIMELINE EVENT
              </button>
            </div>

            <!-- Events List -->
            <div style="display:flex; flex-direction:column; gap:12px;" id="timelineEventsList">
              ${events.length === 0 ? `
                <div style="text-align:center; padding:30px; color:#6B7280;">No timeline events recorded.</div>
              ` : events.map((ev, index) => renderTimelineEventItem(ev, index)).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderTimelineEventItem(ev, index) {
    const isPub = ev.published !== false;
    const tags = Array.isArray(ev.tags) ? ev.tags : [];

    return `
      <div style="background:#16161F; border:1px solid ${isPub ? '#282836' : '#3E2525'}; border-radius:8px; padding:16px; display:flex; justify-content:space-between; align-items:flex-start; gap:16px;">
        <div style="flex:1;">
          <div style="display:flex; align-items:center; gap:10px; margin-bottom:6px;">
            <span style="font-family:monospace; font-weight:800; font-size:1.05rem; color:#F25912;">${escapeHtml(ev.year)}</span>
            <span style="font-weight:700; color:#FFFFFF; font-size:0.95rem; text-transform:uppercase;">${escapeHtml(ev.title)}</span>
            <span style="background:${isPub ? 'rgba(46,164,79,0.12)' : 'rgba(239,68,68,0.12)'}; color:${isPub ? '#2EA44F' : '#EF4444'}; border:1px solid ${isPub ? 'rgba(46,164,79,0.25)' : 'rgba(239,68,68,0.25)'}; padding:2px 8px; border-radius:10px; font-size:0.68rem; font-weight:700;">
              ${isPub ? 'PUBLISHED' : 'HIDDEN'}
            </span>
          </div>

          <p style="font-size:0.84rem; color:#9FA7A6; margin:0 0 10px 0; line-height:1.6;">${escapeHtml(ev.description || '')}</p>

          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            ${tags.map(t => `<span style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#D3DAD9; padding:2px 8px; border-radius:3px; font-size:0.7rem; font-family:monospace;">${escapeHtml(t)}</span>`).join('')}
          </div>
        </div>

        <div style="display:flex; flex-direction:column; gap:6px; align-items:flex-end;">
          <div style="display:flex; gap:6px;">
            <button type="button" data-action="move-tl-up" data-id="${ev.id}" title="Move Up" style="background:#20202C; border:1px solid #2E2E3E; color:#FFFFFF; border-radius:4px; padding:5px 8px; font-size:0.72rem; cursor:pointer;">
              <i class="fas fa-chevron-up"></i>
            </button>
            <button type="button" data-action="move-tl-down" data-id="${ev.id}" title="Move Down" style="background:#20202C; border:1px solid #2E2E3E; color:#FFFFFF; border-radius:4px; padding:5px 8px; font-size:0.72rem; cursor:pointer;">
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>
          <div style="display:flex; gap:6px;">
            <button type="button" data-action="edit-tl" data-id="${ev.id}" title="Edit" style="background:#F25912; border:1px solid #F25912; color:#FFFFFF; border-radius:4px; padding:5px 12px; font-size:0.72rem; font-weight:700; cursor:pointer;">
              <i class="fas fa-pen"></i> EDIT
            </button>
            <button type="button" data-action="delete-tl" data-id="${ev.id}" title="Delete" style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#EF4444; border-radius:4px; padding:5px 8px; font-size:0.72rem; cursor:pointer;">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  //  BLOCK 04: FOOTER
  // ============================================================
  function renderBlock04Footer() {
    return `
      <div class="cms-accordion-card" style="background:#141419; border:1px solid #282832; border-radius:10px; overflow:hidden;">
        <div class="cms-accordion-header" data-toggle="block04" style="padding:18px 24px; display:flex; justify-content:space-between; align-items:center; cursor:pointer; background:#181820;">
          <div style="display:flex; align-items:center; gap:12px;">
            <span style="font-family:monospace; font-weight:700; color:#F25912; font-size:0.9rem;">04</span>
            <div>
              <h3 style="font-size:1rem; font-weight:700; color:#FFFFFF; margin:0;">FOOTER</h3>
              <p style="font-size:0.78rem; color:#8E929E; margin:2px 0 0 0;">Existing global website footer</p>
            </div>
          </div>
          <i class="fas fa-chevron-down cms-accordion-chevron" style="color:#8E929E; transition:transform 0.2s;"></i>
        </div>

        <div class="cms-accordion-body" id="body-block04" style="display:none; padding:24px; border-top:1px solid #22222B;">
          <div style="background:#1A1A24; border:1px solid #2E2E3D; border-left:3px solid #2EA44F; border-radius:6px; padding:16px 20px;">
            <div style="display:flex; align-items:center; gap:8px; font-weight:700; color:#FFFFFF; font-size:0.88rem; margin-bottom:6px;">
              <i class="fas fa-shield-halved" style="color:#2EA44F;"></i> Inherited Global Footer Architecture
            </div>
            <p style="font-size:0.82rem; color:#9FA7A6; margin:0 0 14px 0; line-height:1.6;">
              The Achievements page automatically connects to the global Ashwa Riders footer architecture. Branding, social handles, resources, contact information, and copyright are managed uniformly from the centralized Navigation & Footer Control Center.
            </p>
            <a href="/admin/navigation" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; padding:7px 14px; background:#242432; border:1px solid #36364A; color:#FFFFFF; border-radius:6px; font-size:0.8rem; text-decoration:none;">
              <i class="fas fa-arrow-up-right-from-square"></i> Open Navigation & Footer CMS
            </a>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  //  EVENT BINDINGS & INTERACTIONS
  // ============================================================
  function bindAccordionToggles(container) {
    container.querySelectorAll('.cms-accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const toggleKey = header.dataset.toggle;
        const body = container.querySelector(`#body-${toggleKey}`);
        const icon = header.querySelector('.cms-accordion-chevron');

        if (body) {
          const isOpen = body.style.display !== 'none';
          body.style.display = isOpen ? 'none' : 'block';
          if (icon) icon.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
        }
      });
    });
  }

  function bindHeaderForm(container) {
    const bindInput = (id, path) => {
      const el = container.querySelector(`#${id}`);
      if (el) {
        el.addEventListener('input', () => {
          path(el.value);
          markDirty();
        });
      }
    };

    bindInput('settingPageTitle', val => { currentData.settings.pageTitle = val; });
    bindInput('settingCanonicalUrl', val => { currentData.settings.canonicalUrl = val; });
    bindInput('settingSeoTitle', val => { currentData.settings.seoTitle = val; });
    bindInput('settingSeoDesc', val => { currentData.settings.seoDescription = val; });
    bindInput('settingOgImage', val => { currentData.settings.ogImageUrl = val; });

    const btnOgPick = container.querySelector('#btnPickOgImage');
    if (btnOgPick) {
      btnOgPick.addEventListener('click', () => {
        if (window.MediaPicker) {
          window.MediaPicker.open({
            allowedType: 'image',
            onSelect: (asset) => {
              const url = asset.secureUrl || asset.url;
              currentData.settings.ogImageUrl = url;
              const input = container.querySelector('#settingOgImage');
              if (input) input.value = url;
              markDirty();
            },
          });
        }
      });
    }
  }

  function bindAchievementsSection(container) {
    const sec = currentData.achievementsSection;

    // Section Settings
    const bindSecInput = (id, prop) => {
      const el = container.querySelector(`#${id}`);
      if (el) {
        el.addEventListener('input', () => {
          sec[prop] = el.value;
          markDirty();
        });
      }
    };

    bindSecInput('achSecEyebrow', 'eyebrow');
    bindSecInput('achSecHeading', 'heading');
    bindSecInput('achSecHighlight', 'headingHighlight');
    bindSecInput('achSecDescription', 'description');

    const cbSecVisible = container.querySelector('#achSecVisible');
    if (cbSecVisible) {
      cbSecVisible.addEventListener('change', () => {
        sec.visible = cbSecVisible.checked;
        markDirty();
      });
    }

    // Category Tabs Filter
    container.querySelectorAll('#achieveFilterTabs button').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategoryFilter = btn.dataset.filter || 'all';
        renderInterface(container);
      });
    });

    // Search Input
    const searchInput = container.querySelector('#achieveSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        renderInterface(container);
      });
    }

    // Add Category Button
    const btnAddCategory = container.querySelector('#btnAddCategory');
    if (btnAddCategory) {
      btnAddCategory.addEventListener('click', () => openCategoryModal());
    }

    // Edit/Delete Category Actions
    container.querySelectorAll('[data-action="edit-cat"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index, 10);
        openCategoryModal(index);
      });
    });

    container.querySelectorAll('[data-action="delete-cat"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const index = parseInt(btn.dataset.index, 10);
        const cat = sec.categories[index];
        if (!cat) return;
        if (confirm(`Delete category "${cat.name}"? Achievements in this category will not be deleted but will appear under "ALL".`)) {
          sec.categories.splice(index, 1);
          markDirty();
          renderInterface(container);
        }
      });
    });

    // Add Achievement Button
    const btnAddAch = container.querySelector('#btnAddAchievement');
    if (btnAddAch) {
      btnAddAch.addEventListener('click', () => openAchievementModal(null));
    }

    // Cards actions: Edit, Duplicate, Delete, Move Up, Move Down
    container.querySelectorAll('[data-action="edit-ach"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        openAchievementModal(id);
      });
    });

    container.querySelectorAll('[data-action="duplicate-ach"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const orig = sec.achievements.find(a => a.id === id);
        if (!orig) return;
        const clone = JSON.parse(JSON.stringify(orig));
        clone.id = 'ach-' + Date.now();
        clone.title = clone.title + ' (Copy)';
        clone.order = (clone.order || 0) + 1;
        sec.achievements.push(clone);
        markDirty();
        renderInterface(container);
        showToast('Achievement duplicated.');
      });
    });

    container.querySelectorAll('[data-action="delete-ach"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = sec.achievements.find(a => a.id === id);
        if (!item) return;
        if (confirm(`Are you sure you want to delete "${item.title}"?`)) {
          sec.achievements = sec.achievements.filter(a => a.id !== id);
          markDirty();
          renderInterface(container);
          showToast('Achievement deleted.');
        }
      });
    });

    container.querySelectorAll('[data-action="move-ach-up"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const idx = sec.achievements.findIndex(a => a.id === id);
        if (idx > 0) {
          const temp = sec.achievements[idx - 1];
          sec.achievements[idx - 1] = sec.achievements[idx];
          sec.achievements[idx] = temp;
          reindexOrders(sec.achievements);
          markDirty();
          renderInterface(container);
        }
      });
    });

    container.querySelectorAll('[data-action="move-ach-down"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const idx = sec.achievements.findIndex(a => a.id === id);
        if (idx >= 0 && idx < sec.achievements.length - 1) {
          const temp = sec.achievements[idx + 1];
          sec.achievements[idx + 1] = sec.achievements[idx];
          sec.achievements[idx] = temp;
          reindexOrders(sec.achievements);
          markDirty();
          renderInterface(container);
        }
      });
    });
  }

  function bindTimelineSection(container) {
    const tl = currentData.timelineSection;

    // Timeline Settings
    const bindTlInput = (id, prop) => {
      const el = container.querySelector(`#${id}`);
      if (el) {
        el.addEventListener('input', () => {
          tl[prop] = el.value;
          markDirty();
        });
      }
    };

    bindTlInput('tlSecEyebrow', 'eyebrow');
    bindTlInput('tlSecHeading', 'heading');
    bindTlInput('tlSecHighlight', 'headingHighlight');
    bindTlInput('tlSecDescription', 'description');
    bindTlInput('tlBgImageUrl', 'bgImageUrl');

    const overlaySlider = container.querySelector('#tlOverlayStrength');
    const overlayLabel = container.querySelector('#tlOverlayVal');
    if (overlaySlider) {
      overlaySlider.addEventListener('input', () => {
        const val = parseFloat(overlaySlider.value);
        tl.overlayStrength = val;
        if (overlayLabel) overlayLabel.textContent = `${Math.round(val * 100)}%`;
        markDirty();
      });
    }

    const cbTlVisible = container.querySelector('#tlSecVisible');
    if (cbTlVisible) {
      cbTlVisible.addEventListener('change', () => {
        tl.visible = cbTlVisible.checked;
        markDirty();
      });
    }

    // MediaPicker for Timeline BG
    const btnTlBg = container.querySelector('#btnPickTlBgImage');
    if (btnTlBg) {
      btnTlBg.addEventListener('click', () => {
        if (window.MediaPicker) {
          window.MediaPicker.open({
            allowedType: 'image',
            onSelect: (asset) => {
              const url = asset.secureUrl || asset.url;
              tl.bgImageUrl = url;
              const input = container.querySelector('#tlBgImageUrl');
              if (input) input.value = url;
              markDirty();
            },
          });
        }
      });
    }

    // Add Timeline Event Button
    const btnAddTl = container.querySelector('#btnAddTlEvent');
    if (btnAddTl) {
      btnAddTl.addEventListener('click', () => openTimelineModal(null));
    }

    // Timeline actions: Edit, Delete, Move Up, Move Down
    container.querySelectorAll('[data-action="edit-tl"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        openTimelineModal(id);
      });
    });

    container.querySelectorAll('[data-action="delete-tl"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const item = tl.events.find(e => e.id === id);
        if (!item) return;
        if (confirm(`Delete timeline event "${item.title}"?`)) {
          tl.events = tl.events.filter(e => e.id !== id);
          markDirty();
          renderInterface(container);
          showToast('Timeline event deleted.');
        }
      });
    });

    container.querySelectorAll('[data-action="move-tl-up"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const idx = tl.events.findIndex(e => e.id === id);
        if (idx > 0) {
          const temp = tl.events[idx - 1];
          tl.events[idx - 1] = tl.events[idx];
          tl.events[idx] = temp;
          reindexOrders(tl.events);
          markDirty();
          renderInterface(container);
        }
      });
    });

    container.querySelectorAll('[data-action="move-tl-down"]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const idx = tl.events.findIndex(e => e.id === id);
        if (idx >= 0 && idx < tl.events.length - 1) {
          const temp = tl.events[idx + 1];
          tl.events[idx + 1] = tl.events[idx];
          tl.events[idx] = temp;
          reindexOrders(tl.events);
          markDirty();
          renderInterface(container);
        }
      });
    });
  }

  function reindexOrders(array) {
    array.forEach((item, idx) => { item.order = idx + 1; });
  }

  function markDirty() {
    isDirty = true;
    currentData.status = 'draft';
    const badge = document.getElementById('cmsLiveStatusBadge');
    if (badge) {
      badge.style.background = 'rgba(227, 179, 65, 0.12)';
      badge.style.borderColor = 'rgba(227, 179, 65, 0.3)';
      badge.style.color = '#E3B341';
      badge.innerHTML = '<span style="width:7px; height:7px; border-radius:50%; background:#E3B341;"></span> Draft Changes';
    }
  }

  function bindGlobalActions(container) {
    const btnDraft = container.querySelector('#btnSaveDraft');
    const btnPublish = container.querySelector('#btnPublishLive');

    if (btnDraft) {
      btnDraft.addEventListener('click', async () => {
        btnDraft.disabled = true;
        btnDraft.innerHTML = '<i class="fas fa-spinner fa-spin"></i> SAVING...';
        try {
          const payload = {
            settings: currentData.settings,
            achievementsSection: currentData.achievementsSection,
            timelineSection: currentData.timelineSection,
          };
          const res = await API().patch('/admin/achievements/page', payload);
          if (res && res.success) {
            isDirty = false;
            showToast('Achievements draft saved.');
            await loadAchievementsData(container);
          } else {
            throw new Error(res?.message || 'Save failed.');
          }
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          btnDraft.disabled = false;
          btnDraft.innerHTML = '<i class="fas fa-floppy-disk"></i> SAVE DRAFT';
        }
      });
    }

    if (btnPublish) {
      btnPublish.addEventListener('click', async () => {
        if (!confirm('Publish all achievements, categories, and timeline events live to the public website?')) return;

        btnPublish.disabled = true;
        btnPublish.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PUBLISHING...';
        try {
          // Save draft first
          const payload = {
            settings: currentData.settings,
            achievementsSection: currentData.achievementsSection,
            timelineSection: currentData.timelineSection,
          };
          await API().patch('/admin/achievements/page', payload);

          // Promote to published
          const res = await API().post('/admin/achievements/page/publish');
          if (res && res.success) {
            isDirty = false;
            showToast('Achievements published live to public website!');
            await loadAchievementsData(container);
          } else {
            throw new Error(res?.message || 'Publish failed.');
          }
        } catch (err) {
          showToast(err.message, 'error');
        } finally {
          btnPublish.disabled = false;
          btnPublish.innerHTML = '<i class="fas fa-paper-plane"></i> PUBLISH LIVE';
        }
      });
    }
  }

  // ============================================================
  //  MODAL: CATEGORY ADD / EDIT
  // ============================================================
  function openCategoryModal(index = null) {
    const isEdit = index !== null;
    const cat = isEdit ? currentData.achievementsSection.categories[index] : {
      id: 'cat-' + Date.now(),
      name: '',
      slug: '',
      icon: 'fas fa-trophy',
      order: (currentData.achievementsSection.categories.length + 1),
      enabled: true,
    };

    const modalId = 'arCategoryModal';
    document.getElementById(modalId)?.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.8); backdrop-filter:blur(6px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

    overlay.innerHTML = `
      <div style="background:#141419; border:1px solid #282836; border-radius:10px; width:100%; max-width:440px; overflow:hidden;">
        <div style="padding:18px 24px; border-bottom:1px solid #22222E; display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:1rem; font-weight:700; color:#FFFFFF; margin:0;">
            ${isEdit ? 'Edit Category' : 'Add Category'}
          </h3>
          <button type="button" id="closeCatModal" style="background:none; border:none; color:#8E929E; cursor:pointer; font-size:1.1rem;"><i class="fas fa-times"></i></button>
        </div>
        <form id="catForm" style="padding:20px 24px; display:flex; flex-direction:column; gap:16px;">
          <div>
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Category Name *</label>
            <input type="text" id="catNameInput" required value="${escapeHtml(cat.name)}" placeholder="e.g. Competitions" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
          </div>
          <div>
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Category Slug * (Filter ID)</label>
            <input type="text" id="catSlugInput" required value="${escapeHtml(cat.slug)}" placeholder="e.g. competition" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
          </div>
          <div>
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Icon Class</label>
            <input type="text" id="catIconInput" value="${escapeHtml(cat.icon || 'fas fa-trophy')}" placeholder="fas fa-flag-checkered" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
          </div>
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
            <button type="button" id="cancelCatModal" style="padding:8px 16px; background:#242430; border:1px solid #333345; color:#FFFFFF; border-radius:6px; font-weight:600; cursor:pointer;">Cancel</button>
            <button type="submit" style="padding:8px 18px; background:#F25912; border:1px solid #F25912; color:#FFFFFF; border-radius:6px; font-weight:700; cursor:pointer;">Save Category</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#closeCatModal').addEventListener('click', close);
    overlay.querySelector('#cancelCatModal').addEventListener('click', close);

    const nameInput = overlay.querySelector('#catNameInput');
    const slugInput = overlay.querySelector('#catSlugInput');
    if (!isEdit) {
      nameInput.addEventListener('input', () => {
        slugInput.value = nameInput.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      });
    }

    overlay.querySelector('#catForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const updatedCat = {
        id: cat.id,
        name: nameInput.value.trim(),
        slug: slugInput.value.trim().toLowerCase(),
        icon: overlay.querySelector('#catIconInput').value.trim() || 'fas fa-trophy',
        order: cat.order || 1,
        enabled: true,
      };

      if (!updatedCat.name || !updatedCat.slug) return;

      if (isEdit) {
        currentData.achievementsSection.categories[index] = updatedCat;
      } else {
        currentData.achievementsSection.categories.push(updatedCat);
      }

      markDirty();
      close();
      const mainContainer = document.getElementById('achievementsContainer') || document.querySelector('[data-module="achievements"]');
      renderInterface(mainContainer || document.body);
      showToast('Category saved.');
    });
  }

  // ============================================================
  //  MODAL: ACHIEVEMENT ADD / EDIT
  // ============================================================
  function openAchievementModal(id = null) {
    const isEdit = id !== null;
    const item = isEdit ? currentData.achievementsSection.achievements.find(a => a.id === id) : {
      id: 'ach-' + Date.now(),
      year: new Date().getFullYear().toString(),
      title: '',
      description: '',
      category: currentData.achievementsSection.categories[0]?.slug || 'competition',
      imageUrl: '',
      imageAlt: '',
      event: '',
      rank: '',
      awardName: '',
      location: 'India',
      organization: '',
      externalUrl: '',
      tags: [],
      order: currentData.achievementsSection.achievements.length + 1,
      published: true,
      featured: false,
    };

    if (!item) return;

    const modalId = 'arAchievementCardModal';
    document.getElementById(modalId)?.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

    const categories = currentData.achievementsSection.categories || [];

    overlay.innerHTML = `
      <div style="background:#141419; border:1px solid #282836; border-radius:10px; width:100%; max-width:680px; max-height:90vh; display:flex; flex-direction:column; overflow:hidden;">
        <!-- Header -->
        <div style="padding:18px 24px; border-bottom:1px solid #22222E; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
          <h3 style="font-size:1.1rem; font-weight:800; color:#FFFFFF; margin:0; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-medal" style="color:#F25912;"></i> ${isEdit ? 'Edit Achievement' : 'Add Achievement'}
          </h3>
          <button type="button" id="closeAchModal" style="background:none; border:none; color:#8E929E; cursor:pointer; font-size:1.1rem;"><i class="fas fa-times"></i></button>
        </div>

        <!-- Form Body -->
        <form id="achForm" style="padding:24px; overflow-y:auto; display:flex; flex-direction:column; gap:18px;">
          <!-- Row 1: Year, Category, Status -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Year *</label>
              <input type="text" id="achYear" required value="${escapeHtml(item.year)}" placeholder="2025" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Category *</label>
              <select id="achCategory" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;">
                ${categories.map(c => `
                  <option value="${escapeHtml(c.slug)}" ${(c.slug || '').toLowerCase() === (item.category || '').toLowerCase() ? 'selected' : ''}>
                    ${escapeHtml(c.name)}
                  </option>
                `).join('')}
              </select>
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Display Order</label>
              <input type="number" id="achOrder" value="${item.order || 1}" min="1" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
            </div>
          </div>

          <!-- Row 2: Title -->
          <div>
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Title *</label>
            <input type="text" id="achTitle" required value="${escapeHtml(item.title)}" placeholder="e.g. 1st Place — Altair Simulation Challenge 2025" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
          </div>

          <!-- Row 3: Event, Position/Rank, Location -->
          <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:14px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Competition / Event</label>
              <input type="text" id="achEvent" value="${escapeHtml(item.event || '')}" placeholder="Formula Bharat" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Position / Rank / Award</label>
              <input type="text" id="achRank" value="${escapeHtml(item.rank || '')}" placeholder="1st Place / AIR 8" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Location</label>
              <input type="text" id="achLocation" value="${escapeHtml(item.location || 'India')}" placeholder="e.g. Coimbatore, India" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
            </div>
          </div>

          <!-- Row 4: Description -->
          <div>
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Description</label>
            <textarea id="achDesc" rows="3" placeholder="Summary of this accomplishment..." style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.88rem; resize:vertical;">${escapeHtml(item.description || '')}</textarea>
          </div>

          <!-- Row 5: Image Upload via MediaPicker -->
          <div>
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Achievement Image</label>
            <div style="display:flex; gap:10px; align-items:center;">
              <input type="text" id="achImgUrl" value="${escapeHtml(item.imageUrl || '')}" placeholder="https://res.cloudinary.com/..." style="flex:1; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
              <button type="button" class="btn btn-secondary btn-sm" id="btnPickAchImg" style="padding:10px 14px; white-space:nowrap; background:#22222E; border:1px solid #333345; color:#FFFFFF; border-radius:6px;">
                <i class="fas fa-image"></i> ${item.imageUrl ? 'Replace' : 'Upload / Select'}
              </button>
              <button type="button" class="btn btn-danger btn-sm" id="btnRemoveAchImg" style="padding:10px 14px; white-space:nowrap; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#EF4444; border-radius:6px;">
                <i class="fas fa-times"></i>
              </button>
            </div>
            <div id="achImgPreviewBox" style="margin-top:8px;">
              ${item.imageUrl ? `<img src="${escapeHtml(item.imageUrl)}" style="max-height:100px; border-radius:6px; border:1px solid #333345;" />` : ''}
            </div>
          </div>

          <!-- Row 6: Tags & URL -->
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Tags (comma-separated)</label>
              <input type="text" id="achTags" value="${escapeHtml(Array.isArray(item.tags) ? item.tags.join(', ') : '')}" placeholder="Formula Bharat, Electric, AIR 8" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">External URL (Optional)</label>
              <input type="text" id="achExtUrl" value="${escapeHtml(item.externalUrl || '')}" placeholder="https://..." style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
            </div>
          </div>

          <!-- Row 7: Toggles -->
          <div style="display:flex; gap:20px; align-items:center; padding-top:6px;">
            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-size:0.85rem;">
              <input type="checkbox" id="achPublished" ${item.published !== false ? 'checked' : ''} style="accent-color:#F25912; width:16px; height:16px;" />
              Published on Website
            </label>
            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-size:0.85rem;">
              <input type="checkbox" id="achFeatured" ${item.featured ? 'checked' : ''} style="accent-color:#F25912; width:16px; height:16px;" />
              Featured Milestone
            </label>
          </div>

          <!-- Action Buttons -->
          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:12px; padding-top:14px; border-top:1px solid #22222E;">
            <button type="button" id="cancelAchModal" style="padding:10px 18px; background:#242430; border:1px solid #333345; color:#FFFFFF; border-radius:6px; font-weight:600; cursor:pointer;">Cancel</button>
            <button type="submit" style="padding:10px 22px; background:#F25912; border:1px solid #F25912; color:#FFFFFF; border-radius:6px; font-weight:700; cursor:pointer;">Save Achievement</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#closeAchModal').addEventListener('click', close);
    overlay.querySelector('#cancelAchModal').addEventListener('click', close);

    // MediaPicker bindings
    const imgInput = overlay.querySelector('#achImgUrl');
    const previewBox = overlay.querySelector('#achImgPreviewBox');
    overlay.querySelector('#btnPickAchImg').addEventListener('click', () => {
      if (window.MediaPicker) {
        window.MediaPicker.open({
          allowedType: 'image',
          onSelect: (asset) => {
            const url = asset.secureUrl || asset.url;
            imgInput.value = url;
            previewBox.innerHTML = `<img src="${escapeHtml(url)}" style="max-height:100px; border-radius:6px; border:1px solid #333345;" />`;
          },
        });
      }
    });

    overlay.querySelector('#btnRemoveAchImg').addEventListener('click', () => {
      imgInput.value = '';
      previewBox.innerHTML = '';
    });

    // Form submit
    overlay.querySelector('#achForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const rawTags = overlay.querySelector('#achTags').value;
      const parsedTags = rawTags.split(',').map(t => t.trim()).filter(Boolean);

      const savedItem = {
        id: item.id,
        year: overlay.querySelector('#achYear').value.trim(),
        title: overlay.querySelector('#achTitle').value.trim(),
        category: overlay.querySelector('#achCategory').value.trim(),
        order: parseInt(overlay.querySelector('#achOrder').value, 10) || 1,
        event: overlay.querySelector('#achEvent').value.trim(),
        rank: overlay.querySelector('#achRank').value.trim(),
        location: overlay.querySelector('#achLocation').value.trim(),
        description: overlay.querySelector('#achDesc').value.trim(),
        imageUrl: imgInput.value.trim(),
        imageAlt: overlay.querySelector('#achTitle').value.trim(),
        tags: parsedTags,
        externalUrl: overlay.querySelector('#achExtUrl').value.trim(),
        published: overlay.querySelector('#achPublished').checked,
        featured: overlay.querySelector('#achFeatured').checked,
      };

      if (!savedItem.title || !savedItem.year) return;

      const list = currentData.achievementsSection.achievements;
      if (isEdit) {
        const idx = list.findIndex(a => a.id === item.id);
        if (idx !== -1) list[idx] = savedItem;
      } else {
        list.push(savedItem);
      }

      markDirty();
      close();
      const mainContainer = document.getElementById('achievementsContainer') || document.querySelector('[data-module="achievements"]');
      renderInterface(mainContainer || document.body);
      showToast('Achievement saved.');
    });
  }

  // ============================================================
  //  MODAL: TIMELINE EVENT ADD / EDIT
  // ============================================================
  function openTimelineModal(id = null) {
    const isEdit = id !== null;
    const item = isEdit ? currentData.timelineSection.events.find(e => e.id === id) : {
      id: 'tl-' + Date.now(),
      year: new Date().getFullYear().toString(),
      title: '',
      description: '',
      tags: [],
      order: currentData.timelineSection.events.length + 1,
      published: true,
    };

    if (!item) return;

    const modalId = 'arTimelineEventModal';
    document.getElementById(modalId)?.remove();

    const overlay = document.createElement('div');
    overlay.id = modalId;
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(6px); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;';

    overlay.innerHTML = `
      <div style="background:#141419; border:1px solid #282836; border-radius:10px; width:100%; max-width:540px; overflow:hidden;">
        <div style="padding:18px 24px; border-bottom:1px solid #22222E; display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:1.05rem; font-weight:800; color:#FFFFFF; margin:0; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-clock-rotate-left" style="color:#F25912;"></i> ${isEdit ? 'Edit Timeline Event' : 'Add Timeline Event'}
          </h3>
          <button type="button" id="closeTlModal" style="background:none; border:none; color:#8E929E; cursor:pointer; font-size:1.1rem;"><i class="fas fa-times"></i></button>
        </div>

        <form id="tlForm" style="padding:22px 24px; display:flex; flex-direction:column; gap:16px;">
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Year *</label>
              <input type="text" id="tlYear" required value="${escapeHtml(item.year)}" placeholder="2025 or 2023-24" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Display Order</label>
              <input type="number" id="tlOrder" value="${item.order || 1}" min="1" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
            </div>
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Event Title *</label>
            <input type="text" id="tlTitle" required value="${escapeHtml(item.title)}" placeholder="e.g. THE BEGINNING or ON-TRACK DEBUT" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Description</label>
            <textarea id="tlDesc" rows="3" placeholder="Key history, challenges and milestones achieved..." style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.88rem; resize:vertical;">${escapeHtml(item.description || '')}</textarea>
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; color:#8E929E; margin-bottom:6px;">Tags (comma-separated)</label>
            <input type="text" id="tlTags" value="${escapeHtml(Array.isArray(item.tags) ? item.tags.join(', ') : '')}" placeholder="FOUNDATION, COMBUSTION TEAM, FIRST IN REGION" style="width:100%; background:#0D0D12; border:1px solid #2A2A38; border-radius:6px; padding:10px 14px; color:#FFFFFF; font-size:0.9rem;" />
          </div>

          <div>
            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; color:#FFFFFF; font-size:0.85rem;">
              <input type="checkbox" id="tlPublished" ${item.published !== false ? 'checked' : ''} style="accent-color:#F25912; width:16px; height:16px;" />
              Published in Timeline
            </label>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:6px;">
            <button type="button" id="cancelTlModal" style="padding:10px 18px; background:#242430; border:1px solid #333345; color:#FFFFFF; border-radius:6px; font-weight:600; cursor:pointer;">Cancel</button>
            <button type="submit" style="padding:10px 22px; background:#F25912; border:1px solid #F25912; color:#FFFFFF; border-radius:6px; font-weight:700; cursor:pointer;">Save Timeline Event</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#closeTlModal').addEventListener('click', close);
    overlay.querySelector('#cancelTlModal').addEventListener('click', close);

    overlay.querySelector('#tlForm').addEventListener('submit', (e) => {
      e.preventDefault();

      const rawTags = overlay.querySelector('#tlTags').value;
      const parsedTags = rawTags.split(',').map(t => t.trim()).filter(Boolean);

      const savedItem = {
        id: item.id,
        year: overlay.querySelector('#tlYear').value.trim(),
        title: overlay.querySelector('#tlTitle').value.trim(),
        order: parseInt(overlay.querySelector('#tlOrder').value, 10) || 1,
        description: overlay.querySelector('#tlDesc').value.trim(),
        tags: parsedTags,
        published: overlay.querySelector('#tlPublished').checked,
      };

      if (!savedItem.title || !savedItem.year) return;

      const list = currentData.timelineSection.events;
      if (isEdit) {
        const idx = list.findIndex(e => e.id === item.id);
        if (idx !== -1) list[idx] = savedItem;
      } else {
        list.push(savedItem);
      }

      markDirty();
      close();
      const mainContainer = document.getElementById('achievementsContainer') || document.querySelector('[data-module="achievements"]');
      renderInterface(mainContainer || document.body);
      showToast('Timeline event saved.');
    });
  }

  // Export module for Admin Router
  window.AdminAchievementsModule = { renderAchievementsModule };
})();
