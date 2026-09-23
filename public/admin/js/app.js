/* ============================================================
   app.js — Main Admin Application Initializer
   Integrates Auth, Router, Navbar, Sidebar, Dashboard, and Modules.
============================================================ */

(function () {
  'use strict';

  function initApp() {
    // 1. Initialize Navbar & Router
    if (window.AdminNavbar) window.AdminNavbar.initNavbar();
    if (window.AdminRouter) window.AdminRouter.initRouter();

    // Bind Global Search Input
    const searchInput = document.getElementById('global_search_input');
    const searchDropdown = document.getElementById('global_search_dropdown');
    if (window.GlobalSearchComponent && searchInput && searchDropdown) {
      window.GlobalSearchComponent.bind(searchInput, searchDropdown);
    }

    // 2. Register Routes
    registerAllRoutes();

    // Listen to Hash changes for SPA routing
    window.addEventListener('hashchange', () => handleHashRouting());
    handleHashRouting();

    // 3. Bind Login Form
    bindLoginForm();

    // 4. Session Check
    performSessionCheck();
  }

  async function handleHashRouting() {
    const hash = window.location.hash;
    const container = document.getElementById('adminContent');
    if (!container || !hash) return;

    // Route: Custom Content Type Builder (#/content-types)
    if (hash === '#/content-types' || hash.startsWith('#/content-types')) {
      if (window.ContentTypeBuilderModule) {
        container.innerHTML = await window.ContentTypeBuilderModule.render();
        window.ContentTypeBuilderModule.bindEvents(container);
      }
      return;
    }

    // Route: Universal Content Item List or Editor (#/content/:type)
    const contentMatch = hash.match(/^#\/content\/([a-z0-9_]+)/i);
    if (contentMatch) {
      const typeSlug = contentMatch[1];
      const urlParams = new URLSearchParams(hash.includes('?') ? hash.split('?')[1] : '');
      const editId = urlParams.get('edit');
      const isCreate = urlParams.get('create') === 'new';

      if (editId || isCreate) {
        if (window.UniversalEditorModule) {
          container.innerHTML = await window.UniversalEditorModule.render(typeSlug, editId);
          window.UniversalEditorModule.bindEvents(container, typeSlug, editId);
        }
      } else {
        if (window.UniversalCmsModule) {
          container.innerHTML = await window.UniversalCmsModule.render(typeSlug);
          window.UniversalCmsModule.bindEvents(container, typeSlug);
        }
      }
      return;
    }

    // General SPA hash route fallback (e.g. #/car -> /admin/car)
    const directSlug = hash.replace(/^#\/?/, '').split('?')[0];
    if (directSlug && window.AdminRouter) {
      const candidatePath = directSlug.startsWith('admin/') ? '/' + directSlug : '/admin/' + directSlug;
      window.AdminRouter.navigate(candidatePath, false);
    }
  }

  function registerAllRoutes() {
    const r = window.AdminRouter;
    if (!r) return;

    // Dashboard
    const dashboardHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminDashboardModule) {
        await window.AdminDashboardModule.renderDashboard(container);
      }
    };

    r.registerRoute('/admin', dashboardHandler, { title: 'Dashboard', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Dashboard', url: '/admin' }] });
    r.registerRoute('/admin/dashboard', dashboardHandler, { title: 'Dashboard', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Dashboard', url: '/admin/dashboard' }] });

    // Unified Home Page Control Center Module
    const homeControlHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminHomeModule) {
        await window.AdminHomeModule.renderHomeModule(container);
      }
    };
    r.registerRoute('/admin/home', homeControlHandler, {
      title: 'Home Page Control Center',
      breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Website', url: '/admin/home' }, { label: 'Home Page', url: '/admin/home' }],
    });

    // Legacy Home route redirects
    const legacyHomeRedirect = () => {
      if (window.AdminRouter) {
        window.AdminRouter.navigate('/admin/home');
      }
    };
    r.registerRoute('/admin/home/news', legacyHomeRedirect);
    r.registerRoute('/admin/home/hero', legacyHomeRedirect);
    r.registerRoute('/admin/home/build-stages', legacyHomeRedirect);
    r.registerRoute('/admin/home/stats', legacyHomeRedirect);

    // Media Library Module
    const mediaHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminMediaModule) {
        await window.AdminMediaModule.renderMediaModule(container);
      }
    };
    r.registerRoute('/admin/media', mediaHandler, { title: 'Media Asset Library', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Shared', url: '/admin/media' }, { label: 'Media Library', url: '/admin/media' }] });

    // About Page Module
    const aboutHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminAboutModule) {
        await window.AdminAboutModule.renderAboutModule(container);
      }
    };
    r.registerRoute('/admin/about', aboutHandler, { title: 'About Page', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Website', url: '/admin/about' }, { label: 'About Page', url: '/admin/about' }] });

    // Car & Specifications Module
    const carHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminCarModule) {
        await window.AdminCarModule.renderCarModule(container);
      }
    };
    r.registerRoute('/admin/car', carHandler, { title: 'Car & Specifications', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Website', url: '/admin/car' }, { label: 'Car & Specs', url: '/admin/car' }] });

    // Sponsors Module
    const sponsorsHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminSponsorsModule) {
        await window.AdminSponsorsModule.renderSponsorsModule(container);
      }
    };
    r.registerRoute('/admin/sponsors', sponsorsHandler, { title: 'Sponsors', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Partners', url: '/admin/sponsors' }, { label: 'Sponsors', url: '/admin/sponsors' }] });
    r.registerRoute('/admin/home/sponsors', sponsorsHandler, { title: 'Homepage Sponsors', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Home', url: '/admin/sponsors' }, { label: 'Sponsors Rail', url: '/admin/sponsors' }] });

    // Team Module
    const teamHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminTeamModule) {
        await window.AdminTeamModule.renderTeamModule(container);
      }
    };
    r.registerRoute('/admin/team', teamHandler, { title: 'Team Page Control Center', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Website', url: '/admin/team' }, { label: 'Team', url: '/admin/team' }] });

    // Achievements Module
    const achievementsHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminAchievementsModule) {
        await window.AdminAchievementsModule.renderAchievementsModule(container);
      }
    };
    r.registerRoute('/admin/achievements', achievementsHandler, { title: 'Achievements & Awards', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Website', url: '/admin/achievements' }, { label: 'Achievements', url: '/admin/achievements' }] });

    // Gallery Module
    const galleryHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminGalleryModule) {
        await window.AdminGalleryModule.renderGalleryModule(container);
      }
    };
    r.registerRoute('/admin/gallery', galleryHandler, { title: 'Media Gallery', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Website', url: '/admin/gallery' }, { label: 'Gallery', url: '/admin/gallery' }] });

    // Contact Page Module
    const contactHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminContactModule) {
        await window.AdminContactModule.renderContactModule(container);
      }
    };
    r.registerRoute('/admin/contact-page', contactHandler, { title: 'Contact Page Settings', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Website', url: '/admin/contact-page' }, { label: 'Contact Settings', url: '/admin/contact-page' }] });

    // Navigation & Footer Module
    const navHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminNavigationModule) {
        await window.AdminNavigationModule.renderNavigationModule(container);
      }
    };
    r.registerRoute('/admin/navigation', navHandler, { title: 'Navigation & Footer', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Settings', url: '/admin/navigation' }, { label: 'Navigation & Footer', url: '/admin/navigation' }] });

    // SEO Settings Module
    const seoHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminSeoModule) {
        await window.AdminSeoModule.renderSeoModule(container);
      }
    };
    r.registerRoute('/admin/seo', seoHandler, { title: 'SEO & Site Settings', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Settings', url: '/admin/seo' }, { label: 'SEO Settings', url: '/admin/seo' }] });

    // Contact Messages Inbox Module
    const messagesHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminContactMessagesModule) {
        await window.AdminContactMessagesModule.renderContactMessagesModule(container);
      }
    };
    r.registerRoute('/admin/messages', messagesHandler, { title: 'Contact Messages', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Inboxes', url: '/admin/messages' }, { label: 'Messages', url: '/admin/messages' }] });

    // Join Applications Inbox Module
    const joinInboxHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminJoinApplicationsModule) {
        await window.AdminJoinApplicationsModule.renderJoinApplicationsModule(container);
      }
    };
    r.registerRoute('/admin/join-applications', joinInboxHandler, { title: 'Join Applications', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Inboxes', url: '/admin/join-applications' }, { label: 'Applications', url: '/admin/join-applications' }] });

    // Sponsor Requests Inbox Module
    const sponsorInboxHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminSponsorRequestsModule) {
        await window.AdminSponsorRequestsModule.renderSponsorRequestsModule(container);
      }
    };
    r.registerRoute('/admin/sponsor-requests', sponsorInboxHandler, { title: 'Sponsorship Requests', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Inboxes', url: '/admin/sponsor-requests' }, { label: 'Sponsor Requests', url: '/admin/sponsor-requests' }] });

    // Activity & Revisions Module
    const activityHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminActivityModule) {
        await window.AdminActivityModule.renderActivityModule(container);
      }
    };
    r.registerRoute('/admin/activity', activityHandler, { title: 'Activity & Revisions', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Audit', url: '/admin/activity' }, { label: 'Activity & Revisions', url: '/admin/activity' }] });

    // Account & Profile Module
    const accountHandler = async (path) => {
      const container = document.getElementById('adminContent');
      if (window.AdminAccountModule) {
        await window.AdminAccountModule.renderAccountModule(container);
      }
    };
    r.registerRoute('/admin/account', accountHandler, { title: 'Account Settings', breadcrumbs: [{ label: 'Admin', url: '/admin' }, { label: 'Profile', url: '/admin/account' }, { label: 'Account Settings', url: '/admin/account' }] });
  }

  function bindLoginForm() {
    const form = document.getElementById('loginForm');
    const toggleBtn = document.getElementById('togglePasswordBtn');
    const pwdInput = document.getElementById('loginPassword');
    const errorAlert = document.getElementById('loginErrorAlert');
    const errorMsg = document.getElementById('loginErrorMsg');
    const submitBtn = document.getElementById('loginSubmitBtn');

    if (toggleBtn && pwdInput) {
      toggleBtn.addEventListener('click', () => {
        const isPassword = pwdInput.type === 'password';
        pwdInput.type = isPassword ? 'text' : 'password';
        toggleBtn.innerHTML = `<i class="fas fa-${isPassword ? 'eye-slash' : 'eye'}"></i>`;
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = pwdInput.value;

        if (errorAlert) errorAlert.style.display = 'none';

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing In...';
        }

        try {
          await window.AdminAuth.login(email, password);
          if (window.AdminAuth.getCurrentUser()) {
            window.AdminAuth.showAdminShell();
            window.AdminSidebar.renderSidebar();
            if (window.AdminSidebar.refreshBadges) window.AdminSidebar.refreshBadges();
            
            // Navigate to requested URL or dashboard
            const currentPath = window.location.pathname;
            const targetPath = currentPath && currentPath !== '/admin/login' ? currentPath : '/admin/dashboard';
            window.AdminRouter.navigate(targetPath, false);

            if (window.AdminToast) {
              window.AdminToast.success('Welcome to Ashwa Riders Admin!');
            }
          }
        } catch (err) {
          if (errorAlert && errorMsg) {
            errorMsg.textContent = err.message || 'Invalid credentials or non-admin account.';
            errorAlert.style.display = 'flex';
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Sign In to CMS';
          }
        }
      });
    }
  }

  async function performSessionCheck() {
    if (!window.AdminAuth) return;

    const user = await window.AdminAuth.checkSession();
    if (user) {
      window.AdminAuth.showAdminShell();
      window.AdminSidebar.renderSidebar();
      if (window.AdminSidebar.refreshBadges) window.AdminSidebar.refreshBadges();

      const currentPath = window.location.pathname;
      const targetPath = currentPath && currentPath !== '/admin/login' ? currentPath : '/admin/dashboard';
      window.AdminRouter.navigate(targetPath, false);
    } else {
      window.AdminAuth.showLoginScreen();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
})();
