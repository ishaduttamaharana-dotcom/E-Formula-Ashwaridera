/* ============================================================
   sponsorRequests.js — Corporate Sponsor Requests Admin Inbox Module
   Singleton Sponsorship Inbox Editor for /api/v1/admin/sponsor-requests
   Modern dark Formula Student CMS dashboard interface
   ============================================================ */

(function () {
  'use strict';

  let currentSponsorRequests = [];

  async function renderSponsorRequestsModule(container) {
    if (!container) return;

    container.innerHTML = `
      <!-- Page Header Bar -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:42px; height:42px; border-radius:10px; background:rgba(242,89,18,0.15); border:1px solid rgba(242,89,18,0.3); display:flex; align-items:center; justify-content:center; color:var(--accent-orange, #F25912); font-size:1.2rem;">
              <i class="fas fa-handshake"></i>
            </div>
            <div>
              <h2 style="font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 2px 0; letter-spacing:-0.02em;">
                Corporate Sponsorship Requests
              </h2>
              <p style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin:0;">
                Review corporate partnership enquiries, proposed sponsorship tiers, company logos, and technical proposal documents.
              </p>
            </div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
          <div id="sponsorStatsContainer" style="display:flex; align-items:center; gap:8px;">
            <div style="background:rgba(245,158,11,0.12); border:1px solid rgba(245,158,11,0.25); padding:6px 14px; border-radius:20px; font-size:0.78rem; font-weight:700; color:#F59E0B; display:inline-flex; align-items:center; gap:6px;">
              <span style="width:7px; height:7px; border-radius:50%; background:#F59E0B; box-shadow:0 0 6px #F59E0B;"></span>
              <span id="pendingSponsorCountText">0 Pending Review</span>
            </div>
          </div>

          <button type="button" class="btn btn-secondary btn-sm" id="refreshSponsorBtn" style="display:inline-flex; align-items:center; gap:6px; background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); color:#fff; padding:8px 14px; border-radius:8px; font-weight:600; cursor:pointer;">
            <i class="fas fa-sync-alt"></i> Refresh Inbox
          </button>
        </div>
      </div>

      <!-- Filters Toolbar Card -->
      <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:16px 20px; margin-bottom:24px; box-shadow:0 4px 20px rgba(0,0,0,0.2);">
        <div style="display:flex; flex-wrap:wrap; gap:14px; align-items:center; justify-content:space-between;">
          <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center; flex:1;">
            
            <!-- Search Box -->
            <div style="position:relative; flex:1; min-width:260px;">
              <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted, #8E929E); font-size:0.85rem; pointer-events:none;"></i>
              <input 
                type="text" 
                id="sponsorSearch" 
                placeholder="Search by company name, contact person, or email..." 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px 10px 38px; color:#fff; font-size:0.88rem; outline:none; transition:border-color 0.2s ease, box-shadow 0.2s ease;" 
                onfocus="this.style.borderColor='var(--accent-orange, #F25912)'; this.style.boxShadow='0 0 0 2px rgba(242,89,18,0.2)';"
                onblur="this.style.borderColor='var(--border-hairline, #2D2D3B)'; this.style.boxShadow='none';"
              />
            </div>

            <!-- Tier Filter -->
            <div style="min-width:170px;">
              <select 
                id="sponsorTierFilter" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.88rem; outline:none; cursor:pointer; -webkit-appearance:none; appearance:none; background-image:url('data:image/svg+xml;utf8,<svg fill=\"%238E929E\" height=\"16\" viewBox=\"0 0 24 24\" width=\"16\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>'); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px;"
                onfocus="this.style.borderColor='var(--accent-orange, #F25912)';"
                onblur="this.style.borderColor='var(--border-hairline, #2D2D3B)';"
              >
                <option value="all" style="background:#181820; color:#fff;">All Sponsorship Tiers</option>
                <option value="title" style="background:#181820; color:#fff;">Title Sponsor</option>
                <option value="gold" style="background:#181820; color:#fff;">Gold Sponsor</option>
                <option value="silver" style="background:#181820; color:#fff;">Silver Sponsor</option>
                <option value="bronze" style="background:#181820; color:#fff;">Bronze Sponsor</option>
                <option value="technical" style="background:#181820; color:#fff;">Technical Partner</option>
              </select>
            </div>

            <!-- Status Filter -->
            <div style="min-width:170px;">
              <select 
                id="sponsorStatusFilter" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.88rem; outline:none; cursor:pointer; -webkit-appearance:none; appearance:none; background-image:url('data:image/svg+xml;utf8,<svg fill=\"%238E929E\" height=\"16\" viewBox=\"0 0 24 24\" width=\"16\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>'); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px;"
                onfocus="this.style.borderColor='var(--accent-orange, #F25912)';"
                onblur="this.style.borderColor='var(--border-hairline, #2D2D3B)';"
              >
                <option value="all" style="background:#181820; color:#fff;">All Statuses</option>
                <option value="Pending" style="background:#181820; color:#fff;">Pending</option>
                <option value="Under Review" style="background:#181820; color:#fff;">Under Review</option>
                <option value="Accepted" style="background:#181820; color:#fff;">Accepted</option>
                <option value="Rejected" style="background:#181820; color:#fff;">Rejected</option>
              </select>
            </div>

            <!-- Clear Filters -->
            <div id="clearSponsorFilterContainer" style="display:none; align-items:center;">
              <button type="button" id="clearSponsorFiltersBtn" style="background:rgba(242, 89, 18, 0.15); border:1px solid rgba(242, 89, 18, 0.3); color:var(--accent-orange, #F25912); font-size:0.78rem; padding:7px 14px; border-radius:20px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px;">
                <i class="fas fa-times-circle"></i> Clear Filters
              </button>
            </div>
          </div>

          <div style="font-size:0.8rem; color:var(--text-muted, #8E929E); font-weight:500;" id="sponsorTotalCounter">
            Loading...
          </div>
        </div>
      </div>

      <!-- Sponsorship Data Table Container -->
      <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; overflow:hidden; width:100%; box-shadow:0 4px 20px rgba(0,0,0,0.2);">
        <div style="width:100%; overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.88rem; min-width:900px;">
            <thead>
              <tr style="background:var(--bg-dark, #111116); border-bottom:1px solid var(--border-hairline, #2D2D3B);">
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted, #8E929E); width:50px;">#</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted, #8E929E);">Company Name</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted, #8E929E);">Contact Representative</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted, #8E929E);">Sponsorship Tier</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted, #8E929E);">Date</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted, #8E929E);">Status</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:var(--text-muted, #8E929E); text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="sponsorTableBody">
              <tr>
                <td colspan="7" style="padding:50px 20px; text-align:center; color:var(--text-muted, #8E929E);">
                  <i class="fas fa-spinner fa-spin" style="color:var(--accent-orange, #F25912); font-size:1.6rem; margin-bottom:12px; display:block;"></i>
                  <div style="font-weight:600;">Loading sponsorship requests...</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    bindEvents();
    await loadSponsorRequests();
  }

  function bindEvents() {
    const search = document.getElementById('sponsorSearch');
    if (search) {
      search.addEventListener('input', () => {
        updateFilterPills();
        filterAndRenderTable();
      });
    }

    const tierFilter = document.getElementById('sponsorTierFilter');
    if (tierFilter) {
      tierFilter.addEventListener('change', () => {
        updateFilterPills();
        filterAndRenderTable();
      });
    }

    const statusFilter = document.getElementById('sponsorStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        updateFilterPills();
        filterAndRenderTable();
      });
    }

    const clearBtn = document.getElementById('clearSponsorFiltersBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (search) search.value = '';
        if (tierFilter) tierFilter.value = 'all';
        if (statusFilter) statusFilter.value = 'all';
        updateFilterPills();
        filterAndRenderTable();
      });
    }

    const refreshBtn = document.getElementById('refreshSponsorBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadSponsorRequests());
  }

  function updateFilterPills() {
    const query = document.getElementById('sponsorSearch')?.value || '';
    const tier = document.getElementById('sponsorTierFilter')?.value || 'all';
    const status = document.getElementById('sponsorStatusFilter')?.value || 'all';
    const pill = document.getElementById('clearSponsorFilterContainer');
    if (!pill) return;
    if (query || tier !== 'all' || status !== 'all') {
      pill.style.display = 'inline-flex';
    } else {
      pill.style.display = 'none';
    }
  }

  async function loadSponsorRequests() {
    const tbody = document.getElementById('sponsorTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="padding:50px 20px; text-align:center; color:var(--text-muted, #8E929E);">
            <i class="fas fa-spinner fa-spin" style="color:var(--accent-orange, #F25912); font-size:1.6rem; margin-bottom:12px; display:block;"></i>
            <div style="font-weight:600;">Loading sponsorship requests...</div>
          </td>
        </tr>`;
    }
    const counter = document.getElementById('sponsorTotalCounter');
    if (counter) counter.textContent = 'Loading requests...';

    try {
      const res = await window.AdminApi.get('/admin/sponsor-requests');
      currentSponsorRequests = res.data || res.items || [];
      updatePendingBadge();
      filterAndRenderTable();
      if (window.AdminSidebar && window.AdminSidebar.refreshBadges) {
        window.AdminSidebar.refreshBadges();
      }
    } catch (err) {
      console.error('Failed to load sponsor requests:', err);
      if (window.AdminToast) window.AdminToast.error('Failed to load requests: ' + err.message);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="7" style="padding:50px 20px; text-align:center; color:#EF4444;">
              <div style="width:50px; height:50px; border-radius:50%; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); display:inline-flex; align-items:center; justify-content:center; margin-bottom:12px; color:#EF4444; font-size:1.4rem;">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div style="font-size:0.95rem; font-weight:700; color:#fff; margin-bottom:4px;">Failed to load sponsorship requests</div>
              <div style="font-size:0.82rem; color:var(--text-muted, #8E929E); margin-bottom:14px; max-width:480px; margin-left:auto; margin-right:auto;">${escapeHtml(err.message)}</div>
              <button type="button" id="sponsorRetryBtn" style="background:var(--accent-orange, #F25912); border:none; color:#fff; padding:8px 20px; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem; display:inline-flex; align-items:center; gap:6px;">
                <i class="fas fa-redo-alt"></i> Retry
              </button>
            </td>
          </tr>`;
        const retryBtn = document.getElementById('sponsorRetryBtn');
        if (retryBtn) retryBtn.addEventListener('click', () => loadSponsorRequests());
      }
      if (counter) counter.textContent = 'Failed to load';
    }
  }

  function updatePendingBadge() {
    const pending = currentSponsorRequests.filter((r) => (r.status || 'Pending') === 'Pending').length;
    const countText = document.getElementById('pendingSponsorCountText');
    if (countText) {
      countText.textContent = `${pending} Pending Review`;
    }
  }

  function filterAndRenderTable() {
    const tbody = document.getElementById('sponsorTableBody');
    if (!tbody) return;

    const query = (document.getElementById('sponsorSearch')?.value || '').toLowerCase().trim();
    const tier = document.getElementById('sponsorTierFilter')?.value || 'all';
    const status = document.getElementById('sponsorStatusFilter')?.value || 'all';

    const filtered = currentSponsorRequests.filter((req) => {
      const company = (req.companyName || '').toLowerCase();
      const person = (req.contactPerson || '').toLowerCase();
      const email = (req.email || '').toLowerCase();
      const t = (req.sponsorshipType || '').toLowerCase();

      const matchesSearch = !query || company.includes(query) || person.includes(query) || email.includes(query) || t.includes(query);
      const matchesTier = tier === 'all' || t.includes(tier);
      const matchesStatus = status === 'all' || (req.status || 'Pending') === status;

      return matchesSearch && matchesTier && matchesStatus;
    });

    const counter = document.getElementById('sponsorTotalCounter');
    if (counter) {
      counter.textContent = `Showing ${filtered.length} of ${currentSponsorRequests.length} total enquiries`;
    }

    if (!filtered.length) {
      const isFiltered = query || tier !== 'all' || status !== 'all';
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="padding:60px 20px; text-align:center; color:var(--text-muted, #8E929E);">
            <div style="width:54px; height:54px; border-radius:50%; background:rgba(255,255,255,0.04); border:1px solid var(--border-hairline, #2D2D3B); display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px; color:#6B7280; font-size:1.4rem;">
              <i class="fas ${isFiltered ? 'fa-filter' : 'fa-briefcase'}"></i>
            </div>
            <div style="font-size:0.95rem; font-weight:700; color:#fff; margin-bottom:4px;">${isFiltered ? 'No matching sponsorship enquiries found' : 'No sponsorship requests yet'}</div>
            <div style="font-size:0.82rem; color:var(--text-muted, #8E929E);">${isFiltered ? 'Try adjusting search query or clearing filters.' : 'Corporate partnership proposals submitted from the public website will appear here.'}</div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((req, idx) => {
        const dateStr = new Date(req.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const isPending = (req.status || 'Pending') === 'Pending';
        const statusBadge = getStatusBadge(req.status);
        const tierBadge = getTierBadge(req.sponsorshipType);
        const logoBox = req.companyLogoUrl
          ? `<img src="${escapeHtml(req.companyLogoUrl)}" style="width:36px; height:36px; object-fit:contain; border-radius:6px; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); padding:4px;" />`
          : `<div style="width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg, rgba(242,89,18,0.3), rgba(255,106,38,0.1)); border:1px solid rgba(242,89,18,0.4); display:flex; align-items:center; justify-content:center; color:var(--accent-orange, #F25912); font-weight:800; font-size:0.82rem; flex-shrink:0;">${getInitials(req.companyName)}</div>`;

        return `
          <tr style="border-bottom:1px solid var(--border-hairline, #2D2D3B); ${isPending ? 'background:rgba(242, 89, 18, 0.04);' : ''} transition:background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='${isPending ? 'rgba(242, 89, 18, 0.04)' : 'transparent'}'">
            <td style="padding:14px 18px; font-family:var(--font-mono, monospace); font-size:0.8rem; color:var(--text-muted, #8E929E);">
              #${idx + 1}
            </td>
            <td style="padding:14px 18px;">
              <div style="display:flex; align-items:center; gap:12px;">
                ${logoBox}
                <div>
                  <div style="font-weight:700; color:#fff; font-size:0.92rem;">${escapeHtml(req.companyName)}</div>
                  ${req.website ? `
                    <div style="font-size:0.78rem; color:var(--text-muted, #8E929E); margin-top:2px;">
                      <a href="${escapeHtml(req.website.startsWith('http') ? req.website : 'https://' + req.website)}" target="_blank" style="color:var(--text-muted, #8E929E); text-decoration:none;" onclick="event.stopPropagation();">
                        <i class="fas fa-external-link-alt" style="font-size:0.7rem;"></i> ${escapeHtml(req.website.replace(/^https?:\/\//, ''))}
                      </a>
                    </div>` : ''}
                </div>
              </div>
            </td>
            <td style="padding:14px 18px;">
              <div style="font-weight:600; color:#fff; font-size:0.86rem;">${escapeHtml(req.contactPerson || 'Representative')}</div>
              <div style="font-size:0.78rem; color:var(--text-muted, #8E929E); margin-top:2px; display:flex; gap:10px; align-items:center;">
                <a href="mailto:${escapeHtml(req.email)}" style="color:var(--text-muted, #8E929E); text-decoration:none;" onclick="event.stopPropagation();">
                  <i class="fas fa-envelope" style="font-size:0.72rem;"></i> ${escapeHtml(req.email)}
                </a>
                ${req.phone ? `<span style="color:var(--text-muted, #8E929E);"><i class="fas fa-phone" style="font-size:0.72rem;"></i> ${escapeHtml(req.phone)}</span>` : ''}
              </div>
            </td>
            <td style="padding:14px 18px;">
              ${tierBadge}
            </td>
            <td style="padding:14px 18px; font-family:var(--font-mono, monospace); font-size:0.8rem; color:var(--text-muted, #8E929E); white-space:nowrap;">
              ${dateStr}
            </td>
            <td style="padding:14px 18px; white-space:nowrap;">
              ${statusBadge}
            </td>
            <td style="padding:14px 18px; text-align:right;">
              <div style="display:inline-flex; gap:6px; align-items:center;">
                <button 
                  type="button" 
                  class="btn btn-secondary btn-xs inspect-sponsor-btn" 
                  data-id="${req._id}" 
                  style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); color:var(--accent-orange, #F25912); font-size:0.78rem; padding:6px 14px; border-radius:6px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px; transition:all 0.2s ease;"
                  onmouseover="this.style.background='var(--accent-orange, #F25912)'; this.style.color='#fff';"
                  onmouseout="this.style.background='var(--bg-dark, #111116)'; this.style.color='var(--accent-orange, #F25912)';"
                >
                  <i class="fas fa-eye"></i> Review
                </button>
                <button 
                  type="button" 
                  class="btn btn-secondary btn-xs delete-sponsor-req-btn" 
                  data-id="${req._id}" 
                  style="background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); color:#EF4444; font-size:0.78rem; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:4px;"
                  title="Delete Request"
                >
                  <i class="fas fa-trash-alt"></i> Delete
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.inspect-sponsor-btn').forEach((btn) => {
      btn.addEventListener('click', () => openSponsorRequestDrawer(btn.dataset.id));
    });

    tbody.querySelectorAll('.delete-sponsor-req-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.dataset.id;
        if (confirm('Permanently delete this sponsorship request?')) {
          try {
            await window.AdminApi.delete(`/admin/sponsor-requests/${id}`);
            if (window.AdminToast) window.AdminToast.success('Request deleted.');
            await loadRequests();
          } catch (err) {
            if (window.AdminToast) window.AdminToast.error('Delete error: ' + err.message);
          }
        }
      });
    });
  }

  function getInitials(name) {
    if (!name) return 'SP';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
  }

  function getTierBadge(tier) {
    const t = (tier || 'General').toLowerCase();
    let bg = 'rgba(255,255,255,0.08)', border = 'rgba(255,255,255,0.15)', color = '#fff';
    if (t.includes('title')) { bg = 'rgba(242,89,18,0.15)'; border = 'rgba(242,89,18,0.3)'; color = '#F25912'; }
    else if (t.includes('gold')) { bg = 'rgba(245,158,11,0.15)'; border = 'rgba(245,158,11,0.3)'; color = '#FBBF24'; }
    else if (t.includes('silver')) { bg = 'rgba(14,165,233,0.15)'; border = 'rgba(14,165,233,0.3)'; color = '#38BDF8'; }
    else if (t.includes('bronze')) { bg = 'rgba(168,85,247,0.15)'; border = 'rgba(168,85,247,0.3)'; color = '#C084FC'; }
    else if (t.includes('tech') || t.includes('partner')) { bg = 'rgba(34,197,94,0.15)'; border = 'rgba(34,197,94,0.3)'; color = '#4ADE80'; }
    return `<span style="background:${bg}; border:1px solid ${border}; padding:4px 10px; border-radius:6px; font-size:0.78rem; font-weight:700; color:${color}; display:inline-block;">${escapeHtml(tier || 'General Partner')}</span>`;
  }

  function getStatusBadge(status) {
    const st = (status || 'Pending').toLowerCase();
    if (st === 'accepted') {
      return `<span style="background:rgba(46,164,79,0.15); border:1px solid rgba(46,164,79,0.3); color:#2EA44F; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#2EA44F;"></span> Accepted</span>`;
    }
    if (st === 'under review') {
      return `<span style="background:rgba(14,165,233,0.15); border:1px solid rgba(14,165,233,0.3); color:#0EA5E9; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#0EA5E9;"></span> Under Review</span>`;
    }
    if (st === 'rejected') {
      return `<span style="background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#EF4444; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#EF4444;"></span> Rejected</span>`;
    }
    return `<span style="background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); color:#F59E0B; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#F59E0B;"></span> Pending</span>`;
  }

  async function openSponsorRequestDrawer(id) {
    const reqDoc = currentSponsorRequests.find((r) => r._id === id);
    if (!reqDoc) return;

    const dateStr = new Date(reqDoc.createdAt || Date.now()).toLocaleString('en-US');
    const initials = getInitials(reqDoc.companyName);

    const logoHtml = reqDoc.companyLogoUrl
      ? `<img src="${escapeHtml(reqDoc.companyLogoUrl)}" style="height:52px; max-width:130px; object-fit:contain; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); padding:6px; border-radius:8px;" />`
      : `<div style="width:52px; height:52px; border-radius:50%; background:linear-gradient(135deg, rgba(242,89,18,0.3), rgba(255,106,38,0.15)); border:1px solid rgba(242,89,18,0.5); display:flex; align-items:center; justify-content:center; color:var(--accent-orange, #F25912); font-weight:800; font-size:1.1rem; flex-shrink:0;">${initials}</div>`;

    const docHtml = reqDoc.documentUrl
      ? `<a href="${escapeHtml(reqDoc.documentUrl)}" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912); color:#fff; font-weight:700; padding:8px 14px; border-radius:8px; text-decoration:none;"><i class="fas fa-file-pdf"></i> Download Technical Proposal</a>`
      : `<span style="color:var(--text-muted, #8E929E); font-size:0.85rem;"><i class="fas fa-info-circle"></i> No proposal attached</span>`;

    const drawerContentHtml = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        
        <!-- Company Profile Header Card -->
        <div style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:20px; box-shadow:0 4px 16px rgba(0,0,0,0.3);">
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px;">
            <div style="display:flex; align-items:flex-start; gap:14px;">
              ${logoHtml}
              <div>
                <strong style="font-size:1.25rem; color:#fff; display:block; letter-spacing:-0.01em;">${escapeHtml(reqDoc.companyName)}</strong>
                ${reqDoc.website ? `
                  <div style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin-top:2px;">
                    <a href="${escapeHtml(reqDoc.website.startsWith('http') ? reqDoc.website : 'https://' + reqDoc.website)}" target="_blank" style="color:var(--accent-orange, #F25912); text-decoration:none;">
                      <i class="fas fa-globe"></i> ${escapeHtml(reqDoc.website)}
                    </a>
                  </div>` : ''}
                <div style="margin-top:10px; display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
                  ${getTierBadge(reqDoc.sponsorshipType)}
                  ${getStatusBadge(reqDoc.status)}
                </div>
              </div>
            </div>

            <div>${docHtml}</div>
          </div>
          <div style="font-size:0.75rem; font-family:var(--font-mono, monospace); color:var(--text-muted, #8E929E); margin-top:14px; border-top:1px solid var(--border-hairline, #2D2D3B); padding-top:10px;">
            Submitted on: ${dateStr}
          </div>
        </div>

        <!-- Contact Representative Info -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
          <div class="cms-field">
            <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Contact Representative & Role</label>
            <input type="text" class="cms-input" value="${escapeHtml(reqDoc.contactPerson || 'N/A')} (${escapeHtml(reqDoc.designation || 'Representative')})" readonly style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.88rem; outline:none;" />
          </div>
          <div class="cms-field">
            <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Email & Direct Phone</label>
            <input type="text" class="cms-input" value="${escapeHtml(reqDoc.email || 'N/A')} ${reqDoc.phone ? '· ' + escapeHtml(reqDoc.phone) : ''}" readonly style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.88rem; outline:none;" />
          </div>
        </div>

        <!-- Message / Collaboration Notes -->
        <div class="cms-field">
          <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Enquiry Message & Partnership Proposal Notes</label>
          <textarea class="cms-textarea" rows="4" readonly style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:12px; color:#fff; font-size:0.88rem; outline:none; resize:vertical; font-family:inherit; line-height:1.5;">${escapeHtml(reqDoc.message || 'No specific notes attached.')}</textarea>
        </div>

        <!-- Decision Form -->
        <form id="sponsorReqDetailForm" style="display:flex; flex-direction:column; gap:16px; border-top:1px solid var(--border-hairline, #2D2D3B); padding-top:18px;">
          <div class="cms-field">
            <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Sponsorship Partnership Decision</label>
            <select name="status" class="cms-select" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.9rem; outline:none; cursor:pointer; -webkit-appearance:none; appearance:none; background-image:url('data:image/svg+xml;utf8,<svg fill=\"%238E929E\" height=\"16\" viewBox=\"0 0 24 24\" width=\"16\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>'); background-repeat:no-repeat; background-position:right 12px center; padding-right:32px;">
              <option value="Pending" ${(reqDoc.status || 'Pending') === 'Pending' ? 'selected' : ''} style="background:#181820; color:#fff;">Pending</option>
              <option value="Under Review" ${reqDoc.status === 'Under Review' ? 'selected' : ''} style="background:#181820; color:#fff;">Under Review</option>
              <option value="Accepted" ${reqDoc.status === 'Accepted' ? 'selected' : ''} style="background:#181820; color:#fff;">Accepted</option>
              <option value="Rejected" ${reqDoc.status === 'Rejected' ? 'selected' : ''} style="background:#181820; color:#fff;">Rejected</option>
            </select>
          </div>

          <div class="cms-field">
            <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Internal Admin Notes (Private)</label>
            <textarea name="adminNotes" class="cms-textarea" rows="3" placeholder="Add internal notes for sponsor relations team..." style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.9rem; outline:none; resize:vertical; font-family:inherit;">${escapeHtml(reqDoc.adminNotes || '')}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:10px;">
            <button type="button" class="btn btn-secondary" id="closeDrawerBtn" style="padding:10px 18px; border-radius:8px; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); color:#fff; font-weight:600; cursor:pointer;">Close</button>
            <button type="submit" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912); padding:10px 18px; font-weight:700; border-radius:8px; cursor:pointer; color:#fff;">
              <i class="fas fa-save"></i> Save Decision & Notes
            </button>
          </div>
        </form>
      </div>
    `;

    if (window.AdminDrawer) {
      window.AdminDrawer.open({
        title: 'Sponsorship Partnership Request Detail',
        content: drawerContentHtml,
      });

      const closeBtn = document.getElementById('closeDrawerBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (window.AdminDrawer.close) window.AdminDrawer.close();
          else window.AdminDrawer.closeDrawer();
        });
      }

      const form = document.getElementById('sponsorReqDetailForm');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          const payload = {
            status: formData.get('status'),
            adminNotes: formData.get('adminNotes').trim(),
          };

          try {
            await window.AdminApi.patch(`/admin/sponsor-requests/${id}/status`, payload);
            if (window.AdminToast) window.AdminToast.success('Sponsor request decision updated.');
            if (window.AdminDrawer.close) window.AdminDrawer.close();
            else window.AdminDrawer.closeDrawer();
            await loadSponsorRequests();
            if (window.AdminSidebar && window.AdminSidebar.refreshBadges) window.AdminSidebar.refreshBadges();
          } catch (err) {
            if (window.AdminToast) window.AdminToast.error('Update failed: ' + err.message);
          }
        });
      }
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

  window.AdminSponsorRequestsModule = { renderSponsorRequestsModule };
})();
