/* ============================================================
   router.js — SPA Client-Side Router for Ashwa Riders Admin
   Supports deep links, history API, active state, breadcrumbs.
============================================================ */

(function () {
  'use strict';

  const routes = {};
  let currentRoute = null;

  function registerRoute(path, handler, meta = {}) {
    routes[path] = { handler, meta };
  }

  function navigate(path, pushState = true) {
    let cleanPath = path || '/admin';
    if (cleanPath === '/admin/') cleanPath = '/admin';

    const routeKey = routes[cleanPath] ? cleanPath : resolveWildcardRoute(cleanPath);

    if (pushState && window.location.pathname !== cleanPath) {
      window.history.pushState({ path: cleanPath }, '', cleanPath);
    }

    currentRoute = cleanPath;

    // Highlight sidebar
    if (window.AdminSidebar) {
      window.AdminSidebar.setActiveLink(cleanPath);
    }

    if (routes[routeKey]) {
      const { handler, meta } = routes[routeKey];

      // Update Breadcrumbs
      if (window.AdminNavbar) {
        window.AdminNavbar.setBreadcrumbs(meta.breadcrumbs || [{ label: 'Admin', url: '/admin' }]);
        window.AdminNavbar.setPageTitle(meta.title || 'Dashboard');
      }

      handler(cleanPath);
    } else {
      // Not Found view
      if (routes['/admin/404']) {
        routes['/admin/404'].handler(cleanPath);
      } else if (window.AdminPending) {
        window.AdminPending.renderNotFound(cleanPath);
      }
    }
  }

  function resolveWildcardRoute(path) {
    if (routes[path]) return path;
    // Check if path starts with registered route prefix
    for (const key of Object.keys(routes)) {
      if (key !== '/admin' && path.startsWith(key)) {
        return key;
      }
    }
    return null;
  }

  function initRouter() {
    window.addEventListener('popstate', (e) => {
      const path = (e.state && e.state.path) || window.location.pathname;
      navigate(path, false);
    });

    // Intercept internal link clicks with data-link
    document.body.addEventListener('click', (e) => {
      const target = e.target.closest('[data-link]');
      if (target) {
        e.preventDefault();
        const href = target.getAttribute('href') || target.getAttribute('data-link');
        if (href) navigate(href);
      }
    });
  }

  function getCurrentRoute() {
    return currentRoute || window.location.pathname;
  }

  window.AdminRouter = {
    registerRoute,
    navigate,
    initRouter,
    getCurrentRoute,
  };
})();
