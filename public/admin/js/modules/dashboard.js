/* ============================================================
   dashboard.js — Ashwa Admin Control Center Main Dashboard
   Motorsport Engineering CMS Dashboard
============================================================ */

(function () {
  'use strict';

  async function renderDashboard(container) {
    if (!container) return;

    container.innerHTML = `
      <!-- Dashboard Header -->
      <div class="dash-header">
        <div class="dash-header-left">
          <h1 class="dash-title">Dashboard</h1>
          <p class="dash-subtitle">Welcome back. Here's what's happening across Ashwa Riders.</p>
        </div>
        <div class="dash-header-right">
          <button class="btn-refresh" id="refreshDashboardBtn" title="Refresh dashboard data">
            <i class="fas fa-rotate"></i>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- 4 KPI Cards Grid -->
      <div class="kpi-grid" id="dashboardKpiGrid">
        <div class="kpi-card loading-shimmer">
          <div class="kpi-top">
            <span class="kpi-label">PUBLISHED NEWS</span>
            <i class="fas fa-newspaper kpi-icon"></i>
          </div>
          <div class="kpi-value"><i class="fas fa-spinner fa-spin kpi-spinner"></i></div>
          <div class="kpi-meta">Loading data...</div>
        </div>

        <div class="kpi-card loading-shimmer">
          <div class="kpi-top">
            <span class="kpi-label">TEAM MEMBERS</span>
            <i class="fas fa-users kpi-icon"></i>
          </div>
          <div class="kpi-value"><i class="fas fa-spinner fa-spin kpi-spinner"></i></div>
          <div class="kpi-meta">Loading data...</div>
        </div>

        <div class="kpi-card loading-shimmer">
          <div class="kpi-top">
            <span class="kpi-label">ACHIEVEMENTS</span>
            <i class="fas fa-trophy kpi-icon"></i>
          </div>
          <div class="kpi-value"><i class="fas fa-spinner fa-spin kpi-spinner"></i></div>
          <div class="kpi-meta">Loading data...</div>
        </div>

        <div class="kpi-card loading-shimmer">
          <div class="kpi-top">
            <span class="kpi-label">INBOX</span>
            <i class="fas fa-inbox kpi-icon"></i>
          </div>
          <div class="kpi-value"><i class="fas fa-spinner fa-spin kpi-spinner"></i></div>
          <div class="kpi-meta">Loading data...</div>
        </div>
      </div>

      <!-- Quick Actions Bar -->
      <div class="quick-actions-wrap">
        <div class="section-badge-title">QUICK ACTIONS</div>
        <div class="quick-actions-bar">
          <a href="/admin/home/hero" data-link class="quick-action-btn">
            <i class="fas fa-pen-to-square"></i>
            <span>Edit Home</span>
          </a>
          <a href="/admin/home/news" data-link class="quick-action-btn">
            <i class="fas fa-plus"></i>
            <span>Add News</span>
          </a>
          <a href="/admin/team" data-link class="quick-action-btn">
            <i class="fas fa-user-pen"></i>
            <span>Update Team</span>
          </a>
          <a href="/admin/achievements" data-link class="quick-action-btn">
            <i class="fas fa-medal"></i>
            <span>Add Achievement</span>
          </a>
          <a href="/admin/media" data-link class="quick-action-btn">
            <i class="fas fa-photo-film"></i>
            <span>Media Library</span>
          </a>
          <a href="/admin/messages" data-link class="quick-action-btn">
            <i class="fas fa-envelope-open-text"></i>
            <span>Messages</span>
          </a>
        </div>
      </div>

      <!-- Two-Column Lower Section: Recent Activity & Needs Attention -->
      <div class="dash-lower-grid">
        <!-- Recent Activity Column -->
        <section class="dash-panel activity-panel">
          <div class="panel-top">
            <div class="panel-heading">
              <span class="status-indicator-dot"></span>
              <h2 class="panel-title">RECENT ACTIVITY</h2>
            </div>
            <span class="panel-tag">AUDIT TIMELINE</span>
          </div>

          <div class="timeline-container" id="dashboardActivityTimeline">
            <div class="timeline-empty">Loading audit activity...</div>
          </div>

          <div class="panel-footer">
            <a href="/admin/activity" data-link class="panel-arrow-link">
              <span>View all activity</span>
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </section>

        <!-- Needs Attention Column -->
        <section class="dash-panel attention-panel">
          <div class="panel-top">
            <div class="panel-heading">
              <span class="status-indicator-dot orange-dot"></span>
              <h2 class="panel-title">NEEDS ATTENTION</h2>
            </div>
            <span class="panel-tag">INBOX SUMMARY</span>
          </div>

          <div class="attention-list" id="dashboardNeedsAttentionList">
            <div class="timeline-empty">Checking pending inbox items...</div>
          </div>

          <div class="panel-footer">
            <a href="/admin/messages" data-link class="panel-arrow-link">
              <span>View Inbox</span>
              <i class="fas fa-arrow-right"></i>
            </a>
          </div>
        </section>
      </div>
    `;

    // Bind refresh button
    const refreshBtn = document.getElementById('refreshDashboardBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        const icon = refreshBtn.querySelector('i');
        if (icon) icon.classList.add('fa-spin');
        await loadDashboardData();
        setTimeout(() => {
          if (icon) icon.classList.remove('fa-spin');
        }, 300);
      });
    }

    await loadDashboardData();
  }

  async function loadDashboardData() {
    try {
      const res = await window.AdminApi.get('/admin/dashboard');
      if (res.success && res.data) {
        const content = res.data.content || {};
        const inbox = res.data.inbox || {};
        const activities = res.data.recentActivity || [];

        renderKpiCards(content, inbox);
        renderNeedsAttention(inbox);
        renderActivityTimeline(activities);

        // Update sidebar and top bar badges
        if (window.AdminSidebar) {
          window.AdminSidebar.renderSidebar(inbox);
        }
        if (window.AdminNavbar && typeof window.AdminNavbar.updateNotificationBadge === 'function') {
          window.AdminNavbar.updateNotificationBadge(inbox.totalUnreadItems || 0);
        }
      }
    } catch (err) {
      if (window.AdminToast) {
        window.AdminToast.error('Failed to load dashboard metrics: ' + err.message);
      }
    }
  }

  function formatCount(num) {
    const n = Number(num) || 0;
    return n < 10 ? `0${n}` : `${n}`;
  }

  function renderKpiCards(content = {}, inbox = {}) {
    const grid = document.getElementById('dashboardKpiGrid');
    if (!grid) return;

    const publishedNews = content.publishedNews || 0;
    const draftNews = content.draftNews || 0;
    const teamMembers = content.publishedTeamMembers || 0;
    const achievements = content.publishedAchievements || 0;
    const unreadInbox = inbox.totalUnreadItems || 0;

    const draftText = draftNews === 1 ? '+1 draft' : draftNews > 1 ? `+${draftNews} drafts` : 'No drafts pending';
    const inboxText = unreadInbox > 0 ? 'Requires attention' : 'All caught up';
    const inboxClass = unreadInbox > 0 ? 'kpi-highlight' : '';

    grid.innerHTML = `
      <div class="kpi-card" data-url="/admin/home/news">
        <div class="kpi-top">
          <span class="kpi-label">PUBLISHED NEWS</span>
          <i class="fas fa-newspaper kpi-icon"></i>
        </div>
        <div class="kpi-value">${formatCount(publishedNews)}</div>
        <div class="kpi-meta">${draftText}</div>
      </div>

      <div class="kpi-card" data-url="/admin/team">
        <div class="kpi-top">
          <span class="kpi-label">TEAM MEMBERS</span>
          <i class="fas fa-users kpi-icon"></i>
        </div>
        <div class="kpi-value">${formatCount(teamMembers)}</div>
        <div class="kpi-meta">Active members</div>
      </div>

      <div class="kpi-card" data-url="/admin/achievements">
        <div class="kpi-top">
          <span class="kpi-label">ACHIEVEMENTS</span>
          <i class="fas fa-trophy kpi-icon"></i>
        </div>
        <div class="kpi-value">${formatCount(achievements)}</div>
        <div class="kpi-meta">Published</div>
      </div>

      <div class="kpi-card ${inboxClass}" data-url="/admin/messages">
        <div class="kpi-top">
          <span class="kpi-label">INBOX</span>
          <i class="fas fa-inbox kpi-icon ${unreadInbox > 0 ? 'icon-orange' : ''}"></i>
        </div>
        <div class="kpi-value ${unreadInbox > 0 ? 'val-orange' : ''}">${formatCount(unreadInbox)}</div>
        <div class="kpi-meta ${unreadInbox > 0 ? 'meta-orange' : ''}">${inboxText}</div>
      </div>
    `;

    // Make cards clickable for quick navigation
    grid.querySelectorAll('.kpi-card[data-url]').forEach((card) => {
      card.addEventListener('click', () => {
        const url = card.getAttribute('data-url');
        if (window.AdminRouter && url) {
          window.AdminRouter.navigate(url);
        }
      });
    });
  }

  function renderNeedsAttention(inbox = {}) {
    const container = document.getElementById('dashboardNeedsAttentionList');
    if (!container) return;

    const contactCount = inbox.newContactMessages || 0;
    const joinCount = inbox.pendingJoinApplications || 0;
    const sponsorCount = inbox.pendingSponsorRequests || 0;

    container.innerHTML = `
      <a href="/admin/messages" data-link class="attention-row">
        <div class="attention-row-left">
          <div class="attention-icon-box">
            <i class="fas fa-envelope"></i>
          </div>
          <span class="attention-label">Contact Messages</span>
        </div>
        <span class="attention-badge ${contactCount > 0 ? 'badge-orange' : 'badge-neutral'}">${contactCount}</span>
      </a>

      <a href="/admin/join-applications" data-link class="attention-row">
        <div class="attention-row-left">
          <div class="attention-icon-box">
            <i class="fas fa-user-plus"></i>
          </div>
          <span class="attention-label">Join Applications</span>
        </div>
        <span class="attention-badge ${joinCount > 0 ? 'badge-orange' : 'badge-neutral'}">${joinCount}</span>
      </a>

      <a href="/admin/sponsor-requests" data-link class="attention-row">
        <div class="attention-row-left">
          <div class="attention-icon-box">
            <i class="fas fa-handshake"></i>
          </div>
          <span class="attention-label">Sponsor Requests</span>
        </div>
        <span class="attention-badge ${sponsorCount > 0 ? 'badge-orange' : 'badge-neutral'}">${sponsorCount}</span>
      </a>
    `;
  }

  function formatEventTime(dateStr) {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '';

      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();

      const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (isToday) {
        return timeStr;
      }
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} · ${timeStr}`;
    } catch (e) {
      return '';
    }
  }

  function renderActivityTimeline(activities = []) {
    const container = document.getElementById('dashboardActivityTimeline');
    if (!container) return;

    // Show maximum 5 recent activities
    const list = activities.slice(0, 5);

    if (list.length === 0) {
      container.innerHTML = `
        <div class="timeline-empty">
          <i class="fas fa-check-circle" style="color:var(--accent-teal);margin-right:6px;"></i>
          No recent audit logs recorded.
        </div>
      `;
      return;
    }

    let html = '<div class="timeline-list">';

    list.forEach((act) => {
      const timeStr = formatEventTime(act.createdAt);
      const userStr = act.user ? (act.user.fullName || act.user.email) : (act.userName || 'Faktelectric');
      const actionText = act.summary || act.action || 'System action recorded';

      html += `
        <div class="timeline-item">
          <div class="timeline-marker">
            <span class="timeline-dot"></span>
            <span class="timeline-line"></span>
          </div>
          <div class="timeline-content">
            <div class="timeline-action-title">${escapeHtml(actionText)}</div>
            <div class="timeline-meta">
              <span class="timeline-user">${escapeHtml(userStr)}</span>
              <span class="timeline-meta-sep">·</span>
              <span class="timeline-time">${timeStr}</span>
            </div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  }

  function escapeHtml(str) {
    if (typeof str !== 'string') return str || '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.AdminDashboardModule = {
    renderDashboard,
    loadDashboardData,
  };
})();
