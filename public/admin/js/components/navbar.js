/* ============================================================
   navbar.js — Header Navbar Component (Breadcrumbs, Search, User Info, Drawer)
   Ashwa Riders Admin Control Center
============================================================ */

(function () {
  'use strict';

  function setBreadcrumbs(crumbs = []) {
    const el = document.getElementById('adminBreadcrumbs');
    if (!el) return;

    let html = '';
    crumbs.forEach((c, idx) => {
      const isLast = idx === crumbs.length - 1;
      if (isLast) {
        html += `<span class="current">${c.label}</span>`;
      } else {
        html += `<a href="${c.url}" data-link>${c.label}</a><span class="bc-sep">/</span>`;
      }
    });

    el.innerHTML = html;
  }

  function setPageTitle(title) {
    document.title = `${title} — Ashwa Admin Control Center`;
  }

  function updateUserDisplay(user) {
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');

    if (nameEl) {
      nameEl.textContent = user.fullName || user.email || 'Faktelectric';
    }
    if (avatarEl) {
      const initial = (user.fullName || user.email || 'F').charAt(0).toUpperCase();
      avatarEl.textContent = initial;
    }
  }

  function updateNotificationBadge(totalUnread = 0) {
    const badgeEl = document.getElementById('headerNotificationBadge');
    if (!badgeEl) return;

    const count = Number(totalUnread) || 0;
    if (count > 0) {
      badgeEl.textContent = count > 99 ? '99+' : count;
      badgeEl.style.display = 'inline-flex';
    } else {
      badgeEl.style.display = 'none';
    }
  }

  function initNavbar() {
    const toggleBtn = document.getElementById('sidebarToggleBtn') || document.getElementById('mobileNavToggle');
    const sidebar = document.getElementById('adminSidebar');
    const backdrop = document.getElementById('sidebarBackdrop');
    const shell = document.getElementById('adminShell');

    function toggleSidebar() {
      if (!sidebar) return;
      if (window.innerWidth <= 1024) {
        // Mobile & Tablet Drawer
        sidebar.classList.toggle('drawer-open');
        if (backdrop) {
          backdrop.classList.toggle('active', sidebar.classList.contains('drawer-open'));
        }
      } else {
        // Desktop Collapsed state
        if (shell) shell.classList.toggle('sidebar-collapsed');
        sidebar.classList.toggle('collapsed');
      }
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleSidebar();
      });
    }

    if (backdrop) {
      backdrop.addEventListener('click', () => {
        if (sidebar) sidebar.classList.remove('drawer-open');
        backdrop.classList.remove('active');
      });
    }

    // Auto-close mobile drawer when any link inside sidebar is clicked
    if (sidebar) {
      sidebar.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && window.innerWidth <= 1024) {
          sidebar.classList.remove('drawer-open');
          if (backdrop) backdrop.classList.remove('active');
        }
      });
    }

    // Notifications Button click -> Navigate to messages
    const notifBtn = document.getElementById('headerNotificationsBtn');
    if (notifBtn) {
      notifBtn.addEventListener('click', () => {
        if (window.AdminRouter) {
          window.AdminRouter.navigate('/admin/messages');
        }
      });
    }

    // Logout Button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (window.AdminAuth) {
          await window.AdminAuth.logout();
        }
      });
    }
  }

  window.AdminNavbar = {
    setBreadcrumbs,
    setPageTitle,
    updateUserDisplay,
    updateNotificationBadge,
    initNavbar,
  };
})();
