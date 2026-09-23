/* ============================================================
   sidebar.js — Grouped Sidebar Navigation Component
   Ashwa Riders Admin Control Center
============================================================ */

(function () {
  'use strict';

  let cachedBadges = {};

  const menuStructure = [
    {
      groupTitle: 'Overview',
      items: [
        { label: 'Dashboard', url: '/admin/dashboard', icon: 'fas fa-chart-line' },
      ],
    },
    {
      groupTitle: 'Website Content',
      items: [
        { label: 'Home', url: '/admin/home', icon: 'fas fa-house' },
        { label: 'About', url: '/admin/about', icon: 'fas fa-circle-info' },
        { label: 'Team', url: '/admin/team', icon: 'fas fa-users' },
        { label: 'Car & Specifications', url: '/admin/car', icon: 'fas fa-car' },
        { label: 'Sponsors', url: '/admin/sponsors', icon: 'fas fa-building' },
        { label: 'Gallery', url: '/admin/gallery', icon: 'fas fa-images' },
        { label: 'Contact Page', url: '/admin/contact-page', icon: 'fas fa-address-book' },
        { label: 'Achievements', url: '/admin/achievements', icon: 'fas fa-trophy' },
      ],
    },
    {
      groupTitle: 'Inbox',
      items: [
        { label: 'Contact Messages', url: '/admin/messages', icon: 'fas fa-envelope', badgeKey: 'newContactMessages' },
        { label: 'Join Applications', url: '/admin/join-applications', icon: 'fas fa-user-plus', badgeKey: 'pendingJoinApplications' },
        { label: 'Sponsor Requests', url: '/admin/sponsor-requests', icon: 'fas fa-handshake', badgeKey: 'pendingSponsorRequests' },
      ],
    },
    {
      groupTitle: 'System',
      items: [
        { label: 'Media Library', url: '/admin/media', icon: 'fas fa-folder-open' },
        { label: 'Audit Logs', url: '/admin/activity', icon: 'fas fa-clock-rotate-left' },
        { label: 'Navigation & Footer', url: '/admin/navigation', icon: 'fas fa-bars-staggered' },
        { label: 'Settings', url: '/admin/seo', icon: 'fas fa-sliders' },
      ],
    },
  ];

  function renderSidebar(badges = null) {
    const navEl = document.getElementById('sidebarNav');
    if (!navEl) return;

    if (badges) {
      cachedBadges = Object.assign({}, cachedBadges, badges);
    }

    let html = '';

    menuStructure.forEach((group) => {
      html += `<div class="nav-section-title">${group.groupTitle}</div>`;
      group.items.forEach((item) => {
        let badgeHtml = '';
        if (item.badgeKey && typeof cachedBadges[item.badgeKey] !== 'undefined') {
          const count = Number(cachedBadges[item.badgeKey]) || 0;
          if (count > 0) {
            badgeHtml = `<span class="nav-badge active-badge">${count}</span>`;
          } else {
            badgeHtml = `<span class="nav-badge zero-badge">0</span>`;
          }
        }

        html += `
          <a href="${item.url}" class="nav-item" data-url="${item.url}" data-link title="${item.label}">
            <div class="nav-item-left">
              <i class="${item.icon} nav-icon"></i>
              <span class="nav-label">${item.label}</span>
            </div>
            ${badgeHtml}
          </a>
        `;
      });
    });

    navEl.innerHTML = html;

    // Reapply active state
    if (window.AdminRouter) {
      setActiveLink(window.AdminRouter.getCurrentRoute());
    }
  }

  function setActiveLink(activeUrl) {
    const navEl = document.getElementById('sidebarNav');
    if (!navEl) return;

    const links = navEl.querySelectorAll('.nav-item');
    links.forEach((link) => {
      const url = link.getAttribute('data-url');
      if (url === activeUrl || (url !== '/admin/dashboard' && url !== '/admin' && activeUrl.startsWith(url))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  async function refreshBadges() {
    try {
      if (!window.AdminApi) return;
      const res = await window.AdminApi.get('/admin/inbox-counts');
      if (res && res.success && res.data) {
        renderSidebar(res.data);
      }
    } catch (err) {
      console.warn('Could not refresh sidebar badges:', err.message);
    }
  }

  window.AdminSidebar = {
    renderSidebar,
    setActiveLink,
    refreshBadges,
  };
})();
