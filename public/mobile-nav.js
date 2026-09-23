/* ============================================================
   mobile-nav.js — Mobile Navigation & Drawer System
   Ashwa Riders / E-Formula Ashwariders
   Provides accessible, mobile-first slide drawer menu navigation.
   ============================================================ */

(function () {
  'use strict';

  function initMobileNav() {
    const toggleBtn = document.querySelector('.mobile-nav-toggle, #mobile-nav-toggle');
    const navDrawer = document.querySelector('.mobile-nav-drawer, #mobile-nav-drawer');
    const closeBtn  = document.querySelector('.mobile-nav-close, #mobile-nav-close');
    const overlay   = document.querySelector('.mobile-nav-backdrop, #mobile-nav-backdrop');

    if (!toggleBtn || !navDrawer) return;

    const openMenu = () => {
      navDrawer.classList.add('is-open');
      if (overlay) overlay.classList.add('is-open');
      toggleBtn.setAttribute('aria-expanded', 'true');
      document.body.classList.add('mobile-nav-active');
      document.body.style.overflow = 'hidden';
    };

    const closeMenu = () => {
      navDrawer.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-open');
      toggleBtn.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('mobile-nav-active');
      document.body.style.overflow = '';
    };

    toggleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (navDrawer.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', closeMenu);
    }

    if (overlay) {
      overlay.addEventListener('click', closeMenu);
    }

    // Close on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navDrawer.classList.contains('is-open')) {
        closeMenu();
      }
    });

    // Close menu when clicking any nav link
    const drawerLinks = navDrawer.querySelectorAll('a');
    drawerLinks.forEach((link) => {
      link.addEventListener('click', closeMenu);
    });

    // Highlight active link
    const currentPath = window.location.pathname.toLowerCase();
    drawerLinks.forEach((link) => {
      const href = link.getAttribute('href');
      if (!href) return;
      const cleanHref = href.toLowerCase().replace('./', '');
      if (currentPath.endsWith(cleanHref) || (currentPath === '/' && cleanHref === 'index.html')) {
        link.classList.add('active');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();
