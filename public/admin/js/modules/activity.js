/* ============================================================
   activity.js — Admin Activity Audit Trail & Revision History
   Modern dark Formula Student CMS dashboard interface
============================================================ */

(function () {
  'use strict';

  let currentPage = 1;
  let currentResource = '';
  let currentAction = '';

  async function renderActivityModule(container) {
    if (!container) return;

    container.innerHTML = `
      <!-- Page Header Bar -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 4px 0; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-history" style="color:var(--accent-orange, #F25912);"></i> Activity & Revisions Audit Trail
          </h2>
          <p style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin:0;">
            Track administrator actions, published versions, inspect historical change snapshots, and restore prior drafts.
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary btn-sm" id="refreshActivityBtn" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-sync-alt"></i> Refresh Logs
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="viewRevisionsDrawerBtn" style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912);">
            <i class="fas fa-layer-group"></i> Revision History Explorer
          </button>
        </div>
      </div>

      <!-- Filters Toolbar Card -->
      <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:18px 22px; margin-bottom:24px;">
        <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:flex-end; justify-content:space-between;">
          <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:center; flex:1;">
            <div style="min-width:220px;">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Filter by Resource
              </label>
              <select 
                id="activityResourceFilter" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.88rem; outline:none; cursor:pointer;"
              >
                <option value="">All Resources</option>
                <option value="HeroSlide">Hero Slides</option>
                <option value="NewsArticle">News Articles</option>
                <option value="BuildStage">Build Story</option>
                <option value="HomeStat">Statistics</option>
                <option value="TeamMember">Team Members</option>
                <option value="Achievement">Achievements</option>
                <option value="GalleryAlbum">Gallery Albums</option>
                <option value="Sponsor">Sponsors</option>
                <option value="AboutContent">About Page</option>
                <option value="CarSpec">Car Specifications</option>
                <option value="NavFooterSettings">Navigation & Footer</option>
                <option value="SiteSeoSettings">SEO Settings</option>
              </select>
            </div>

            <div style="min-width:200px;">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Filter by Action
              </label>
              <select 
                id="activityActionFilter" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.88rem; outline:none; cursor:pointer;"
              >
                <option value="">All Actions</option>
                <option value="CREATE_DRAFT">Create Draft</option>
                <option value="UPDATE_DRAFT">Update Draft</option>
                <option value="PUBLISH">Publish</option>
                <option value="ARCHIVE">Archive</option>
                <option value="RESTORE_DRAFT">Restore Draft</option>
                <option value="DUPLICATE">Duplicate</option>
                <option value="REORDER">Reorder</option>
                <option value="STATUS_UPDATE">Status Update</option>
              </select>
            </div>

            <div id="activeFilterPillContainer" style="display:none; align-items:center; gap:8px;">
              <button type="button" id="clearActivityFiltersBtn" style="background:rgba(242, 89, 18, 0.15); border:1px solid rgba(242, 89, 18, 0.3); color:var(--accent-orange, #F25912); font-size:0.78rem; padding:6px 12px; border-radius:20px; font-weight:600; cursor:pointer;">
                <i class="fas fa-times-circle"></i> Clear Filters
              </button>
            </div>
          </div>

          <div style="font-size:0.8rem; color:var(--text-muted, #8E929E);" id="activityTotalCounter">
            Showing audit trail logs
          </div>
        </div>
      </div>

      <!-- Activity Log Data Table Container -->
      <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; overflow:hidden;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.88rem;">
            <thead>
              <tr style="background:var(--bg-dark, #111116); border-bottom:1px solid var(--border-hairline, #2D2D3B);">
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E);">Timestamp</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E);">Administrator</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E);">Action</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E);">Resource</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E);">Summary</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); text-align:right;">Details</th>
              </tr>
            </thead>
            <tbody id="activityTableBody">
              <tr>
                <td colspan="6" style="padding:40px; text-align:center; color:var(--text-muted, #8E929E);">
                  <i class="fas fa-spinner fa-spin" style="color:var(--accent-orange, #F25912); font-size:1.4rem; margin-bottom:8px;"></i>
                  <div>Loading activity logs...</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="activityPagination" style="display:none; padding:14px 22px; border-top:1px solid var(--border-hairline, #2D2D3B); background:var(--bg-dark, #111116); justify-content:space-between; align-items:center;"></div>
      </div>

      <!-- Revisions History Drawer Overlay & Panel -->
      <div class="editor-drawer-overlay" id="revisionsDrawerOverlay" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); z-index:99990; opacity:0; pointer-events:none; transition:opacity 0.3s ease;"></div>
      <div class="editor-drawer" id="revisionsDrawer" style="position:fixed; top:0; right:-700px; width:100%; max-width:650px; height:100%; background:var(--surface-dark, #181820); border-left:1px solid var(--border-hairline, #2D2D3B); z-index:99995; transition:right 0.3s cubic-bezier(0.16, 1, 0.3, 1); display:flex; flex-direction:column;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:20px 24px; border-bottom:1px solid var(--border-hairline, #2D2D3B); background:var(--bg-dark, #111116);">
          <h3 style="font-size:1.1rem; font-weight:800; color:#fff; margin:0; display:flex; align-items:center; gap:10px;" id="revisionsDrawerTitle">
            <i class="fas fa-history" style="color:var(--accent-orange, #F25912);"></i> Revision History Explorer
          </h3>
          <button type="button" class="drawer-close-btn" id="closeRevisionsDrawerBtn" style="background:transparent; border:none; color:var(--text-muted, #8E929E); font-size:1.2rem; cursor:pointer; padding:4px 8px; border-radius:4px;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div style="flex:1; overflow-y:auto; padding:24px;" id="revisionsDrawerBody">
          <p style="color:var(--text-muted, #8E929E);">Select a resource type to inspect historical snapshots.</p>
        </div>
      </div>
    `;

    bindEvents(container);
    await loadActivityLogs();
  }

  function bindEvents(container) {
    const refreshBtn = container.querySelector('#refreshActivityBtn');
    const resourceFilter = container.querySelector('#activityResourceFilter');
    const actionFilter = container.querySelector('#activityActionFilter');
    const clearFiltersBtn = container.querySelector('#clearActivityFiltersBtn');
    const viewRevisionsBtn = container.querySelector('#viewRevisionsDrawerBtn');
    const closeDrawerBtn = container.querySelector('#closeRevisionsDrawerBtn');
    const drawerOverlay = container.querySelector('#revisionsDrawerOverlay');

    if (refreshBtn) refreshBtn.addEventListener('click', () => loadActivityLogs());

    if (resourceFilter) {
      resourceFilter.addEventListener('change', (e) => {
        currentResource = e.target.value;
        currentPage = 1;
        updateFilterPills();
        loadActivityLogs();
      });
    }

    if (actionFilter) {
      actionFilter.addEventListener('change', (e) => {
        currentAction = e.target.value;
        currentPage = 1;
        updateFilterPills();
        loadActivityLogs();
      });
    }

    if (clearFiltersBtn) {
      clearFiltersBtn.addEventListener('click', () => {
        currentResource = '';
        currentAction = '';
        if (resourceFilter) resourceFilter.value = '';
        if (actionFilter) actionFilter.value = '';
        currentPage = 1;
        updateFilterPills();
        loadActivityLogs();
      });
    }

    if (viewRevisionsBtn) viewRevisionsBtn.addEventListener('click', () => openRevisionsDrawer());
    if (closeDrawerBtn) closeDrawerBtn.addEventListener('click', () => closeRevisionsDrawer());
    if (drawerOverlay) drawerOverlay.addEventListener('click', () => closeRevisionsDrawer());
  }

  function updateFilterPills() {
    const pillContainer = document.getElementById('activeFilterPillContainer');
    if (!pillContainer) return;
    if (currentResource || currentAction) {
      pillContainer.style.display = 'inline-flex';
    } else {
      pillContainer.style.display = 'none';
    }
  }

  async function loadActivityLogs() {
    const tbody = document.getElementById('activityTableBody');
    if (!tbody) return;

    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="padding:40px; text-align:center; color:var(--text-muted, #8E929E);">
          <i class="fas fa-spinner fa-spin" style="color:var(--accent-orange, #F25912); font-size:1.4rem; margin-bottom:8px;"></i>
          <div>Loading activity logs...</div>
        </td>
      </tr>
    `;

    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 15,
      });
      if (currentResource) params.append('resource', currentResource);
      if (currentAction) params.append('action', currentAction);

      const res = await window.AdminApi.get(`/admin/activity?${params.toString()}`);
      const logs = res.data || [];
      const pagination = res.meta ? (res.meta.pagination || res.meta) : null;

      const counter = document.getElementById('activityTotalCounter');
      if (counter && pagination) {
        counter.textContent = `Total logs recorded: ${pagination.total || logs.length}`;
      }

      if (logs.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="padding:40px; text-align:center; color:var(--text-muted, #8E929E);">
              <i class="fas fa-search" style="font-size:1.8rem; margin-bottom:10px; color:#3D3D4E; display:block;"></i>
              No audit log entries found matching criteria.
            </td>
          </tr>
        `;
        renderPagination(null);
        return;
      }

      tbody.innerHTML = logs.map((log) => {
        const timeStr = new Date(log.createdAt).toLocaleString();
        const actionBadge = getActionBadge(log.action);
        const userName = log.userName || (log.user ? log.user.fullName : 'Faktelectric');

        return `
          <tr style="border-bottom:1px solid var(--border-hairline, #2D2D3B); transition:background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
            <td style="padding:14px 18px; font-family:var(--font-mono, monospace); font-size:0.8rem; color:var(--text-muted, #8E929E); white-space:nowrap;">
              ${timeStr}
            </td>
            <td style="padding:14px 18px; color:#fff; font-weight:600;">
              <span style="display:inline-flex; align-items:center; gap:6px;">
                <i class="fas fa-user-shield" style="color:var(--accent-orange, #F25912); font-size:0.8rem;"></i>
                ${escapeHtml(userName)}
              </span>
            </td>
            <td style="padding:14px 18px;">${actionBadge}</td>
            <td style="padding:14px 18px;">
              <span style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); padding:4px 8px; border-radius:6px; font-size:0.78rem; font-weight:600; color:#fff;">
                ${escapeHtml(log.resource)}
              </span>
            </td>
            <td style="padding:14px 18px; color:var(--text-muted, #8E929E); max-width:320px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${escapeHtml(log.summary)}
            </td>
            <td style="padding:14px 18px; text-align:right;">
              ${log.details && (log.details.revisionId || log.details.version) ? `
                <button type="button" class="btn btn-secondary btn-xs inspect-revision-btn" data-id="${log.details.revisionId || log._id}" style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); color:var(--accent-orange, #F25912); font-size:0.75rem; padding:5px 10px; border-radius:6px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                  <i class="fas fa-search"></i> Inspect v${log.details.version || log.details.revisionId || ''}
                </button>
              ` : '<span style="color:var(--text-muted, #8E929E); font-size:0.8rem;">—</span>'}
            </td>
          </tr>
        `;
      }).join('');

      // Bind inspect buttons
      tbody.querySelectorAll('.inspect-revision-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const revId = btn.getAttribute('data-id');
          openRevisionDetail(revId);
        });
      });

      renderPagination(pagination);
    } catch (err) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding:30px; text-align:center; color:#EF4444;">
            <i class="fas fa-exclamation-triangle" style="margin-right:6px;"></i> Failed to load activity logs: ${escapeHtml(err.message)}
          </td>
        </tr>
      `;
    }
  }

  function getActionBadge(action) {
    const maps = {
      CREATE_DRAFT: `<span style="background:rgba(14,165,233,0.15); border:1px solid rgba(14,165,233,0.3); color:#0EA5E9; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">Create Draft</span>`,
      UPDATE_DRAFT: `<span style="background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); color:#F59E0B; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">Update Draft</span>`,
      PUBLISH: `<span style="background:rgba(46,164,79,0.15); border:1px solid rgba(46,164,79,0.3); color:#2EA44F; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700; display:inline-flex; align-items:center; gap:4px;"><i class="fas fa-globe"></i> Published</span>`,
      ARCHIVE: `<span style="background:rgba(255,255,255,0.08); border:1px solid var(--border-hairline, #2D2D3B); color:var(--text-muted, #8E929E); padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">Archived</span>`,
      RESTORE_DRAFT: `<span style="background:rgba(14,165,233,0.15); border:1px solid rgba(14,165,233,0.3); color:#0EA5E9; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">Restored Draft</span>`,
      DUPLICATE: `<span style="background:rgba(255,255,255,0.08); border:1px solid var(--border-hairline, #2D2D3B); color:#fff; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">Duplicated</span>`,
      REORDER: `<span style="background:rgba(255,255,255,0.08); border:1px solid var(--border-hairline, #2D2D3B); color:#fff; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">Reordered</span>`,
      STATUS_UPDATE: `<span style="background:rgba(14,165,233,0.15); border:1px solid rgba(14,165,233,0.3); color:#0EA5E9; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">Status Update</span>`,
    };
    return maps[action] || `<span style="background:rgba(255,255,255,0.08); border:1px solid var(--border-hairline, #2D2D3B); color:#fff; padding:3px 8px; border-radius:12px; font-size:0.75rem; font-weight:700;">${escapeHtml(action)}</span>`;
  }

  function renderPagination(p) {
    const wrap = document.getElementById('activityPagination');
    if (!wrap || !p || (p.pages && p.pages <= 1) || (p.totalPages && p.totalPages <= 1)) {
      if (wrap) wrap.style.display = 'none';
      return;
    }

    const page = p.page || 1;
    const pages = p.pages || p.totalPages || 1;
    const total = p.total || 0;

    wrap.style.display = 'flex';
    wrap.style.justifyContent = 'space-between';
    wrap.style.alignItems = 'center';

    wrap.innerHTML = `
      <div style="font-size:0.8rem; color:var(--text-muted, #8E929E);">
        Showing page <strong style="color:#fff;">${page}</strong> of <strong style="color:#fff;">${pages}</strong> (${total} total logs)
      </div>
      <div style="display:flex; gap:8px;">
        <button type="button" class="btn btn-secondary btn-sm" id="prevActivityPage" ${page <= 1 ? 'disabled' : ''} style="padding:6px 12px; font-size:0.8rem;">
          <i class="fas fa-chevron-left"></i> Previous
        </button>
        <button type="button" class="btn btn-secondary btn-sm" id="nextActivityPage" ${page >= pages ? 'disabled' : ''} style="padding:6px 12px; font-size:0.8rem;">
          Next <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;

    const prevBtn = wrap.querySelector('#prevActivityPage');
    const nextBtn = wrap.querySelector('#nextActivityPage');

    if (prevBtn) prevBtn.addEventListener('click', () => { currentPage--; loadActivityLogs(); });
    if (nextBtn) nextBtn.addEventListener('click', () => { currentPage++; loadActivityLogs(); });
  }

  async function openRevisionsDrawer() {
    const drawer = document.getElementById('revisionsDrawer');
    const overlay = document.getElementById('revisionsDrawerOverlay');
    const body = document.getElementById('revisionsDrawerBody');

    if (drawer) drawer.style.right = '0';
    if (overlay) {
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
    }

    body.innerHTML = `
      <div class="cms-field" style="margin-bottom:20px;">
        <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
          Filter Revisions by Resource
        </label>
        <select id="drawerResourceSelect" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none; cursor:pointer;">
          <option value="">-- Select Resource --</option>
          <option value="HeroSlide">Hero Slide</option>
          <option value="NewsArticle">News Article</option>
          <option value="TeamMember">Team Member</option>
          <option value="Sponsor">Sponsor</option>
          <option value="AboutContent">About Content</option>
          <option value="CarSpec">Car Specifications</option>
          <option value="NavFooterSettings">Navigation & Footer</option>
          <option value="SiteSeoSettings">SEO Settings</option>
        </select>
      </div>
      <div id="drawerRevisionsList" style="margin-top:20px;">
        <p style="color:var(--text-muted, #8E929E);">Choose a resource to load revision snapshots.</p>
      </div>
    `;

    const select = body.querySelector('#drawerResourceSelect');
    if (select) {
      select.addEventListener('change', async (e) => {
        const resourceType = e.target.value;
        if (!resourceType) return;
        await fetchDrawerRevisions(resourceType);
      });
    }
  }

  async function fetchDrawerRevisions(resourceType) {
    const listWrap = document.getElementById('drawerRevisionsList');
    if (!listWrap) return;

    listWrap.innerHTML = '<p style="color:var(--text-muted, #8E929E);"><i class="fas fa-spinner fa-spin" style="color:var(--accent-orange, #F25912);"></i> Loading revisions...</p>';

    try {
      const res = await window.AdminApi.get(`/admin/revisions?resourceType=${resourceType}&limit=20`);
      const revisions = res.data || [];

      if (revisions.length === 0) {
        listWrap.innerHTML = `<p style="color:var(--text-muted, #8E929E);">No historical revisions recorded for ${resourceType}.</p>`;
        return;
      }

      listWrap.innerHTML = revisions.map((rev) => `
        <div style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:16px; margin-bottom:12px; border-left:3px solid var(--accent-orange, #F25912);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">
            <strong style="color:#fff; font-size:0.92rem;">v${rev.version} — ${escapeHtml(rev.action)}</strong>
            <small style="font-family:var(--font-mono, monospace); font-size:0.75rem; color:var(--text-muted, #8E929E);">${new Date(rev.createdAt).toLocaleString()}</small>
          </div>
          <p style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin:0 0 10px 0;">${escapeHtml(rev.summary)}</p>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <small style="color:var(--text-muted, #8E929E);">Author: <strong style="color:#fff;">${rev.authorName || 'Admin'}</strong></small>
            <button type="button" class="btn btn-secondary btn-xs restore-rev-btn" data-id="${rev._id}" style="background:rgba(242, 89, 18, 0.15); border:1px solid rgba(242, 89, 18, 0.3); color:var(--accent-orange, #F25912); font-size:0.78rem; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer;">
              <i class="fas fa-undo"></i> Restore to Draft
            </button>
          </div>
        </div>
      `).join('');

      listWrap.querySelectorAll('.restore-rev-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const revId = btn.getAttribute('data-id');
          await restoreRevision(revId);
        });
      });
    } catch (err) {
      listWrap.innerHTML = `<p style="color:#EF4444;">Failed to load revisions: ${escapeHtml(err.message)}</p>`;
    }
  }

  async function openRevisionDetail(revId) {
    openRevisionsDrawer();
    const body = document.getElementById('revisionsDrawerBody');
    body.innerHTML = '<p style="color:var(--text-muted, #8E929E);"><i class="fas fa-spinner fa-spin" style="color:var(--accent-orange, #F25912);"></i> Fetching revision details...</p>';

    try {
      const res = await window.AdminApi.get(`/admin/revisions/${revId}`);
      const rev = res.data || {};

      body.innerHTML = `
        <div style="margin-bottom:18px;">
          <h4 style="font-size:1.1rem; color:#fff; margin:0 0 4px 0;">Revision v${rev.version || '1'} (${rev.resourceType || 'Record'})</h4>
          <p style="font-size:0.8rem; color:var(--text-muted, #8E929E); margin:0;">Saved on ${new Date(rev.createdAt || Date.now()).toLocaleString()} by ${escapeHtml(rev.authorName || 'Admin')}</p>
        </div>
        
        <div class="cms-field" style="margin-bottom:16px;">
          <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Summary</label>
          <input type="text" class="cms-input" value="${escapeHtml(rev.summary || '')}" readonly style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem; outline:none;" />
        </div>

        <div class="cms-field" style="margin-bottom:20px;">
          <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Historical Snapshot Data (JSON)</label>
          <textarea class="cms-textarea" readonly style="width:100%; height:240px; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:12px; color:#A78BFA; font-family:var(--font-mono, monospace); font-size:0.8rem; outline:none; resize:vertical;">${JSON.stringify(rev.data || rev, null, 2)}</textarea>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:12px; border-top:1px solid var(--border-hairline, #2D2D3B); padding-top:16px;">
          <button type="button" class="btn btn-secondary" onclick="window.AdminActivityModule.closeRevisionsDrawer()" style="padding:8px 16px;">Close</button>
          <button type="button" class="btn btn-primary" id="confirmRestoreBtn" data-id="${rev._id || revId}" style="padding:8px 16px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912);">
            <i class="fas fa-undo"></i> Restore to Draft
          </button>
        </div>
      `;

      const restoreBtn = body.querySelector('#confirmRestoreBtn');
      if (restoreBtn) {
        restoreBtn.addEventListener('click', () => restoreRevision(rev._id || revId));
      }
    } catch (err) {
      body.innerHTML = `<p style="color:#EF4444;">Failed to fetch revision detail: ${escapeHtml(err.message)}</p>`;
    }
  }

  async function restoreRevision(revId) {
    if (!confirm('Are you sure you want to restore this historical revision into a new working draft? Existing published content will remain unaffected until explicitly published.')) {
      return;
    }

    try {
      const res = await window.AdminApi.post(`/admin/revisions/${revId}/restore`);
      if (window.AdminToast) {
        window.AdminToast.success(`Revision restored as new draft (v${res.data?.version || '1'}).`);
      }
      closeRevisionsDrawer();
      await loadActivityLogs();
    } catch (err) {
      if (window.AdminToast) {
        window.AdminToast.error('Restoration failed: ' + err.message);
      }
    }
  }

  function closeRevisionsDrawer() {
    const drawer = document.getElementById('revisionsDrawer');
    const overlay = document.getElementById('revisionsDrawerOverlay');
    if (drawer) drawer.style.right = '-700px';
    if (overlay) {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
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

  window.AdminActivityModule = {
    renderActivityModule,
    openRevisionsDrawer,
    closeRevisionsDrawer,
  };
})();

