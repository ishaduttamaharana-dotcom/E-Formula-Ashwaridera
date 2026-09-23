/* ============================================================
   pending.js — Pending Phase Module Placeholder
   Renders honest, informative placeholder screens for future phase modules.
============================================================ */

(function () {
  'use strict';

  const pendingModulesInfo = {
    '/admin/home/hero': {
      title: 'Hero Slides Composer',
      phase: 'Phase 4 — Media Library & Live Hero Composer',
      description: 'Multi-slide hero carousel editor, live preview composer, desktop/mobile asset management, video fallback background controls.',
      icon: 'fas fa-image',
    },
    '/admin/home/build-stages': {
      title: 'Build Story Timeline',
      phase: 'Phase 5 — Home, About & Car Content Controls',
      description: 'Garage-to-Grid interactive build stages editor with step numbers, 3D scroll callout binding, and icon presets.',
      icon: 'fas fa-road',
    },
    '/admin/home/stats': {
      title: 'Statistics Counters',
      phase: 'Phase 5 — Home, About & Car Content Controls',
      description: 'Numerical counter values, suffixes, labels, display ordering, and animated counter strip management.',
      icon: 'fas fa-calculator',
    },
    '/admin/about': {
      title: 'About Page Editor',
      phase: 'Phase 5 — Home, About & Car Content Controls',
      description: 'Team history, vision & mission cards, core values list, Formula Bharat narrative, and faculty coordinator profile.',
      icon: 'fas fa-info-circle',
    },
    '/admin/car': {
      title: 'Car & Specifications Editor',
      phase: 'Phase 5 — Home, About & Car Content Controls',
      description: 'Car model identity, tech spec groups (Powertrain, Chassis, Aerodynamics), spec rows, feature panels, detail gallery.',
      icon: 'fas fa-car',
    },
    '/admin/team': {
      title: 'Team Roster & Departments',
      phase: 'Phase 6 — Team, Results, Galleries & Sponsors',
      description: 'Team member cards, department taxonomy filters, biographies, photo uploads, leadership/faculty/alumni groupings.',
      icon: 'fas fa-users',
    },
    '/admin/achievements': {
      title: 'Achievements & Awards',
      phase: 'Phase 6 — Team, Results, Galleries & Sponsors',
      description: 'Competition trophies, ranks, featured achievement highlights, timeline entries, category filters.',
      icon: 'fas fa-trophy',
    },
    '/admin/gallery': {
      title: 'Media Gallery Manager',
      phase: 'Phase 6 — Team, Results, Galleries & Sponsors',
      description: 'Album categories, batch photo/video uploads, captions, event tags, lightbox metadata.',
      icon: 'fas fa-photo-film',
    },
    '/admin/sponsors': {
      title: 'Sponsors & Tier Packages',
      phase: 'Phase 6 — Team, Results, Galleries & Sponsors',
      description: 'Corporate sponsor logo strip, website links, tier packages (Bronze/Silver/Gold/Platinum), benefits list, brochure PDF manager.',
      icon: 'fas fa-building',
    },
    '/admin/contact-page': {
      title: 'Contact Page Info Settings',
      phase: 'Phase 6 — Team, Results, Galleries & Sponsors',
      description: 'Official emails, phone numbers, WhatsApp, pit lane address, office hours, Google Maps embed sanitizer, broadcast social links.',
      icon: 'fas fa-address-book',
    },
    '/admin/messages': {
      title: 'Contact Messages Inbox',
      phase: 'Phase 7 — Working Forms & Admin Inboxes',
      description: 'Protected inbox for public contact form transmissions, status updates (New/Read/Closed), internal notes.',
      icon: 'fas fa-envelope',
    },
    '/admin/join-applications': {
      title: 'Recruitment Join Applications',
      phase: 'Phase 7 — Working Forms & Admin Inboxes',
      description: 'Student recruitment roster, department filters, status transitions (Shortlisted/Accepted/Rejected), resume PDF viewer.',
      icon: 'fas fa-user-plus',
    },
    '/admin/sponsor-requests': {
      title: 'Sponsorship Requests Inbox',
      phase: 'Phase 7 — Working Forms & Admin Inboxes',
      description: 'Corporate sponsorship proposal inbox, tier request filter, proposal PDF attachment download, internal notes.',
      icon: 'fas fa-handshake',
    },
    '/admin/media': {
      title: 'Cloudinary Media Library',
      phase: 'Phase 4 — Media Library & Live Hero Composer',
      description: 'Central asset repository, usage reference tracking, file tags, search, drag-and-drop file uploader.',
      icon: 'fas fa-folder-open',
    },
    '/admin/navigation': {
      title: 'Navigation & Footer Settings',
      phase: 'Phase 6 — Team, Results, Galleries & Sponsors',
      description: 'Header logo mark, navigation menu items & order, footer columns, social icon links, copyright line.',
      icon: 'fas fa-bars-staggered',
    },
    '/admin/seo': {
      title: 'SEO & Site Identity Settings',
      phase: 'Phase 6 — Team, Results, Galleries & Sponsors',
      description: 'Site title, per-page meta descriptions, canonical URLs, OpenGraph share images, favicon.',
      icon: 'fas fa-globe',
    },
    '/admin/activity': {
      title: 'Activity & Revisions Log',
      phase: 'Phase 8 — Complete Integration, Revisions & Security',
      description: 'Administrator audit trail, action timestamps, revision diff viewer, restore-to-historical-version controls.',
      icon: 'fas fa-history',
    },
    '/admin/account': {
      title: 'Administrator Account Settings',
      phase: 'Phase 8 — Complete Integration, Revisions & Security',
      description: 'Change admin password, update full name/email, view active session details.',
      icon: 'fas fa-user-gear',
    },
  };

  function renderPendingModule(container, path) {
    const info = pendingModulesInfo[path] || {
      title: 'Module Pending',
      phase: 'Scheduled Phase',
      description: 'This CMS module is scheduled for implementation in a later phase.',
      icon: 'fas fa-clock',
    };

    container.innerHTML = `
      <div class="page-title-bar">
        <div>
          <h2 class="page-title">${info.title}</h2>
          <p class="page-subtitle">${info.phase}</p>
        </div>
      </div>

      <div class="panel-box text-center" style="padding:60px 24px;text-align:center;">
        <div style="width:72px;height:72px;border-radius:50%;background:var(--panel-dark);color:var(--accent-orange);display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin:0 auto 20px;">
          <i class="${info.icon}"></i>
        </div>
        <h3 style="font-size:1.3rem;margin-bottom:10px;">${info.title}</h3>
        <p style="color:var(--text-secondary);max-width:540px;margin:0 auto 24px;font-size:0.9rem;line-height:1.6;">
          ${info.description}
        </p>
        <span class="status-badge status-badge--draft" style="font-size:0.75rem;padding:6px 14px;">
          <i class="fas fa-lock"></i> Scheduled for ${info.phase}
        </span>
      </div>
    `;
  }

  function renderNotFound(container, path) {
    container.innerHTML = `
      <div class="panel-box text-center" style="padding:60px 24px;text-align:center;">
        <div style="width:72px;height:72px;border-radius:50%;background:var(--panel-dark);color:var(--badge-red);display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin:0 auto 20px;">
          <i class="fas fa-triangle-exclamation"></i>
        </div>
        <h3 style="font-size:1.3rem;margin-bottom:10px;">404 — Admin Destination Not Found</h3>
        <p style="color:var(--text-secondary);max-width:480px;margin:0 auto 24px;font-size:0.9rem;">
          The route <code>${path}</code> does not correspond to a valid admin module.
        </p>
        <a href="/admin/dashboard" data-link class="btn btn-primary btn-sm"><i class="fas fa-arrow-left"></i> Return to Dashboard</a>
      </div>
    `;
  }

  window.AdminPending = {
    renderPendingModule,
    renderNotFound,
  };
})();
