/* ============================================================
   contactMessages.js — Contact Messages Admin Inbox Module
   Singleton Inbox Editor for /api/v1/admin/messages
   Modern dark Formula Student CMS dashboard interface
============================================================ */

(function () {
  'use strict';

  let currentMessages = [];

  async function renderContactMessagesModule(container) {
    if (!container) return;

    container.innerHTML = `
      <!-- Page Header Bar -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 4px 0; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-inbox" style="color:var(--accent-orange, #F25912);"></i> Contact Messages & Enquiries
          </h2>
          <p style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin:0;">
            Review, search, inspect, and manage public contact form enquiries submitted by website visitors.
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <div id="unreadMsgCounterBadge" style="display:inline-flex; align-items:center; gap:6px; background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); padding:6px 14px; border-radius:20px; font-size:0.8rem; font-weight:700; color:#F59E0B;">
            <span style="width:7px; height:7px; border-radius:50%; background:#F59E0B;"></span>
            <span id="unreadMsgCountText">0 Unread Messages</span>
          </div>

          <button type="button" class="btn btn-secondary btn-sm" id="refreshMessagesBtn" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-sync-alt"></i> Refresh Inbox
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar Card -->
      <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:18px 22px; margin-bottom:24px;">
        <div style="display:flex; flex-wrap:wrap; gap:16px; align-items:center; justify-content:space-between;">
          <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:center; flex:1;">
            
            <!-- Search Box -->
            <div style="position:relative; flex:1; min-width:280px;">
              <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted, #8E929E); font-size:0.85rem;"></i>
              <input 
                type="text" 
                id="msgSearch" 
                placeholder="Search by sender name, email address, or subject..." 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px 10px 38px; color:#fff; font-size:0.88rem; outline:none;" 
              />
            </div>

            <!-- Status Filter -->
            <div style="min-width:200px;">
              <select 
                id="msgStatusFilter" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.88rem; outline:none; cursor:pointer;"
              >
                <option value="all">All Statuses</option>
                <option value="new">New / Unread</option>
                <option value="in_progress">In Progress</option>
                <option value="closed">Closed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div id="clearMsgFilterContainer" style="display:none; align-items:center;">
              <button type="button" id="clearMsgFiltersBtn" style="background:rgba(242, 89, 18, 0.15); border:1px solid rgba(242, 89, 18, 0.3); color:var(--accent-orange, #F25912); font-size:0.78rem; padding:6px 12px; border-radius:20px; font-weight:600; cursor:pointer;">
                <i class="fas fa-times-circle"></i> Clear Filters
              </button>
            </div>
          </div>

          <div style="font-size:0.8rem; color:var(--text-muted, #8E929E);" id="msgTotalCounter">
            Showing messages
          </div>
        </div>
      </div>

      <!-- Messages Data Table Container -->
      <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; overflow:hidden; width:100%;">
        <div style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.88rem;">
            <thead>
              <tr style="background:var(--bg-dark, #111116); border-bottom:1px solid var(--border-hairline, #2D2D3B);">
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); width:50px;">#</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E);">Sender</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E);">Subject</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E);">Date</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E);">Status</th>
                <th style="padding:14px 18px; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); text-align:right;">Actions</th>
              </tr>
            </thead>
            <tbody id="msgTableBody">
              <tr>
                <td colspan="6" style="padding:40px; text-align:center; color:var(--text-muted, #8E929E);">
                  <i class="fas fa-spinner fa-spin" style="color:var(--accent-orange, #F25912); font-size:1.4rem; margin-bottom:8px;"></i>
                  <div>Loading contact messages...</div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;

    bindEvents();
    await loadMessages();
  }

  function bindEvents() {
    const search = document.getElementById('msgSearch');
    if (search) {
      search.addEventListener('input', () => {
        updateFilterPills();
        filterAndRenderTable();
      });
    }

    const statusFilter = document.getElementById('msgStatusFilter');
    if (statusFilter) {
      statusFilter.addEventListener('change', () => {
        updateFilterPills();
        filterAndRenderTable();
      });
    }

    const clearBtn = document.getElementById('clearMsgFiltersBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (search) search.value = '';
        if (statusFilter) statusFilter.value = 'all';
        updateFilterPills();
        filterAndRenderTable();
      });
    }

    const refreshBtn = document.getElementById('refreshMessagesBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => loadMessages());
  }

  function updateFilterPills() {
    const query = document.getElementById('msgSearch')?.value || '';
    const status = document.getElementById('msgStatusFilter')?.value || 'all';
    const pill = document.getElementById('clearMsgFilterContainer');
    if (!pill) return;
    if (query || status !== 'all') {
      pill.style.display = 'inline-flex';
    } else {
      pill.style.display = 'none';
    }
  }

  async function loadMessages() {
    const tbody = document.getElementById('msgTableBody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding:40px; text-align:center; color:var(--text-muted, #8E929E);">
            <i class="fas fa-spinner fa-spin" style="color:var(--accent-orange, #F25912); font-size:1.4rem; margin-bottom:8px; display:block;"></i>
            <div>Loading contact messages...</div>
          </td>
        </tr>`;
    }
    const counter = document.getElementById('msgTotalCounter');
    if (counter) counter.textContent = 'Loading messages...';

    try {
      const res = await window.AdminApi.get('/admin/messages');
      currentMessages = res.data || res.items || [];
      updateUnreadBadge();
      filterAndRenderTable();
      if (window.AdminSidebar && window.AdminSidebar.refreshBadges) {
        window.AdminSidebar.refreshBadges();
      }
    } catch (err) {
      console.error('Failed to load contact messages:', err);
      if (window.AdminToast) window.AdminToast.error('Failed to load messages: ' + err.message);
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td colspan="6" style="padding:40px 20px; text-align:center; color:#EF4444;">
              <div style="width:48px; height:48px; border-radius:50%; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); display:inline-flex; align-items:center; justify-content:center; margin-bottom:10px; color:#EF4444; font-size:1.3rem;">
                <i class="fas fa-exclamation-triangle"></i>
              </div>
              <div style="font-size:0.95rem; font-weight:700; color:#fff; margin-bottom:4px;">Failed to load contact messages</div>
              <div style="font-size:0.82rem; color:var(--text-muted, #8E929E); margin-bottom:12px; max-width:480px; margin-left:auto; margin-right:auto;">${escapeHtml(err.message)}</div>
              <button type="button" id="msgRetryBtn" style="background:var(--accent-orange, #F25912); border:none; color:#fff; padding:8px 18px; border-radius:8px; font-weight:700; cursor:pointer; font-size:0.85rem; display:inline-flex; align-items:center; gap:6px;">
                <i class="fas fa-redo-alt"></i> Retry
              </button>
            </td>
          </tr>`;
        const retryBtn = document.getElementById('msgRetryBtn');
        if (retryBtn) retryBtn.addEventListener('click', () => loadMessages());
      }
      if (counter) counter.textContent = 'Failed to load';
    }
  }

  function updateUnreadBadge() {
    const unread = currentMessages.filter((m) => (m.status || 'new') === 'new').length;
    const countText = document.getElementById('unreadMsgCountText');
    if (countText) {
      countText.textContent = `${unread} Unread Message${unread === 1 ? '' : 's'}`;
    }
  }

  function filterAndRenderTable() {
    const tbody = document.getElementById('msgTableBody');
    if (!tbody) return;

    const query = (document.getElementById('msgSearch')?.value || '').toLowerCase().trim();
    const status = document.getElementById('msgStatusFilter')?.value || 'all';

    const filtered = currentMessages.filter((m) => {
      const name = (m.name || '').toLowerCase();
      const email = (m.email || '').toLowerCase();
      const subject = (m.subject || '').toLowerCase();

      const matchesSearch = !query || name.includes(query) || email.includes(query) || subject.includes(query);
      const matchesStatus = status === 'all' || (m.status || 'new') === status;

      return matchesSearch && matchesStatus;
    });

    const counter = document.getElementById('msgTotalCounter');
    if (counter) {
      counter.textContent = `Showing ${filtered.length} of ${currentMessages.length} total messages`;
    }

    if (!filtered.length) {
      const isFiltered = query || status !== 'all';
      tbody.innerHTML = `
        <tr>
          <td colspan="6" style="padding:40px; text-align:center; color:var(--text-muted, #8E929E);">
            <i class="fas ${isFiltered ? 'fa-filter' : 'fa-envelope-open'}" style="font-size:2rem; margin-bottom:10px; color:#3D3D4E; display:block;"></i>
            <div style="font-weight:700; color:#fff; margin-bottom:4px;">${isFiltered ? 'No contact messages found matching criteria.' : 'No contact messages yet.'}</div>
            <div style="font-size:0.82rem; color:var(--text-muted, #8E929E);">${isFiltered ? 'Try clearing or changing your filters.' : 'Public enquiries submitted from the contact page will appear here.'}</div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = filtered
      .map((m, idx) => {
        const dateStr = new Date(m.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const isUnread = (m.status || 'new') === 'new';
        const statusBadge = getStatusBadge(m.status);

        return `
          <tr style="border-bottom:1px solid var(--border-hairline, #2D2D3B); ${isUnread ? 'background:rgba(242, 89, 18, 0.04);' : ''} transition:background 0.2s ease;" onmouseover="this.style.background='rgba(255,255,255,0.03)'" onmouseout="this.style.background='${isUnread ? 'rgba(242, 89, 18, 0.04)' : 'transparent'}'">
            <td style="padding:14px 18px; font-family:var(--font-mono, monospace); font-size:0.8rem; color:var(--text-muted, #8E929E);">
              #${idx + 1}
            </td>
            <td style="padding:14px 18px;">
              <div style="font-weight:700; color:#fff; font-size:0.92rem;">${escapeHtml(m.name)}</div>
              <div style="font-size:0.78rem; color:var(--text-muted, #8E929E); margin-top:2px;">
                <a href="mailto:${escapeHtml(m.email)}" style="color:var(--text-muted, #8E929E); text-decoration:none;" onclick="event.stopPropagation();">
                  <i class="fas fa-envelope" style="font-size:0.75rem; margin-right:4px;"></i> ${escapeHtml(m.email)}
                </a>
              </div>
            </td>
            <td style="padding:14px 18px; color:#fff; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              ${escapeHtml(m.subject || 'No Subject')}
            </td>
            <td style="padding:14px 18px; font-family:var(--font-mono, monospace); font-size:0.8rem; color:var(--text-muted, #8E929E); white-space:nowrap;">
              ${dateStr}
            </td>
            <td style="padding:14px 18px; white-space:nowrap;">
              ${statusBadge}
            </td>
            <td style="padding:14px 18px; text-align:right;">
              <button 
                type="button" 
                class="btn btn-secondary btn-xs inspect-msg-btn" 
                data-id="${m._id}" 
                style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); color:var(--accent-orange, #F25912); font-size:0.78rem; padding:6px 12px; border-radius:6px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:6px;"
              >
                <i class="fas fa-eye"></i> View Enquiry
              </button>
            </td>
          </tr>
        `;
      })
      .join('');

    tbody.querySelectorAll('.inspect-msg-btn').forEach((btn) => {
      btn.addEventListener('click', () => openMessageDrawer(btn.dataset.id));
    });
  }

  function getStatusBadge(status) {
    const st = (status || 'new').toLowerCase();
    if (st === 'new' || st === 'unread') {
      return `<span style="background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); color:#F59E0B; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#F59E0B;"></span> New</span>`;
    }
    if (st === 'in_progress') {
      return `<span style="background:rgba(14,165,233,0.15); border:1px solid rgba(14,165,233,0.3); color:#0EA5E9; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#0EA5E9;"></span> In Progress</span>`;
    }
    if (st === 'closed') {
      return `<span style="background:rgba(46,164,79,0.15); border:1px solid rgba(46,164,79,0.3); color:#2EA44F; font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#2EA44F;"></span> Closed</span>`;
    }
    return `<span style="background:rgba(255,255,255,0.06); border:1px solid var(--border-hairline, #2D2D3B); color:var(--text-muted, #8E929E); font-size:0.75rem; font-weight:800; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#8E929E;"></span> Archived</span>`;
  }

  async function openMessageDrawer(id) {
    const msg = currentMessages.find((m) => m._id === id);
    if (!msg) return;

    const dateStr = new Date(msg.createdAt || Date.now()).toLocaleString('en-US');

    const drawerContentHtml = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        
        <!-- Sender Header Card -->
        <div style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:10px; padding:18px;">
          <div style="font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--accent-orange, #F25912); margin-bottom:10px;">
            Sender Information
          </div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:12px;">
            <div>
              <strong style="font-size:1.15rem; color:#fff; display:block;">${escapeHtml(msg.name)}</strong>
              <div style="font-size:0.88rem; color:var(--text-muted, #8E929E); margin-top:2px;">${escapeHtml(msg.email)}</div>
              <div style="font-size:0.78rem; font-family:var(--font-mono, monospace); color:var(--text-muted, #8E929E); margin-top:6px;">
                Submitted: ${dateStr}
              </div>
            </div>
            
            <a href="mailto:${escapeHtml(msg.email)}?subject=Re:%20${encodeURIComponent(msg.subject || '')}" target="_blank" class="btn btn-primary btn-sm" style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912); font-weight:700;">
              <i class="fas fa-paper-plane"></i> Reply via Email
            </a>
          </div>
        </div>

        <!-- Subject -->
        <div class="cms-field">
          <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
            Enquiry Subject
          </label>
          <input type="text" class="cms-input" value="${escapeHtml(msg.subject || 'No Subject')}" readonly style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
        </div>

        <!-- Message Body -->
        <div class="cms-field">
          <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
            Enquiry Message Content
          </label>
          <textarea class="cms-textarea" rows="7" readonly style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:14px; color:#fff; font-size:0.92rem; outline:none; resize:vertical; font-family:inherit; line-height:1.5;">${escapeHtml(msg.message || '')}</textarea>
        </div>

        <!-- Review Form -->
        <form id="msgDetailForm" style="display:flex; flex-direction:column; gap:16px; border-top:1px solid var(--border-hairline, #2D2D3B); padding-top:18px;">
          <div class="cms-field">
            <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
              Update Review Status
            </label>
            <select name="status" class="cms-select" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none; cursor:pointer;">
              <option value="new" ${(msg.status || 'new') === 'new' ? 'selected' : ''}>New / Unread</option>
              <option value="in_progress" ${msg.status === 'in_progress' ? 'selected' : ''}>In Progress</option>
              <option value="closed" ${msg.status === 'closed' ? 'selected' : ''}>Closed</option>
              <option value="archived" ${msg.status === 'archived' ? 'selected' : ''}>Archived</option>
            </select>
          </div>

          <div class="cms-field">
            <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
              Internal Admin Notes (Private)
            </label>
            <textarea name="adminNotes" class="cms-textarea" rows="3" placeholder="Add private notes for your admin team..." style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none; resize:vertical; font-family:inherit;">${escapeHtml(msg.adminNotes || '')}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:10px;">
            <button type="button" class="btn btn-secondary" id="closeDrawerBtn" style="padding:10px 18px;">Close</button>
            <button type="submit" class="btn btn-primary" style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912); padding:10px 18px; font-weight:700;">
              <i class="fas fa-save"></i> Save Status & Notes
            </button>
          </div>
        </form>
      </div>
    `;

    if (window.AdminDrawer) {
      window.AdminDrawer.open({
        title: 'Contact Message Detail',
        content: drawerContentHtml,
      });

      const closeBtn = document.getElementById('closeDrawerBtn');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          if (window.AdminDrawer.close) window.AdminDrawer.close();
          else window.AdminDrawer.closeDrawer();
        });
      }

      const form = document.getElementById('msgDetailForm');
      if (form) {
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          const formData = new FormData(form);
          const payload = {
            status: formData.get('status'),
            adminNotes: formData.get('adminNotes').trim(),
          };

          try {
            await window.AdminApi.patch(`/admin/messages/${id}`, payload);
            if (window.AdminToast) window.AdminToast.success('Message status updated.');
            if (window.AdminDrawer.close) window.AdminDrawer.close();
            else window.AdminDrawer.closeDrawer();
            await loadMessages();
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

  window.AdminContactMessagesModule = { renderContactMessagesModule };
})();

