/* ============================================================
   drawer.js — Reusable Slide-in Right Editor Drawer Component
   Inspired by dark admin reference interface screenshots.
============================================================ */

(function () {
  'use strict';

  let isDirty = false;

  function openDrawer(options = {}) {
    const { title = 'Editor', status = 'draft', content = '', accordions = [], footerButtons = [], previewHtml = '' } = options;

    const backdrop = document.getElementById('adminDrawerBackdrop');
    const drawer = document.getElementById('adminDrawer');
    if (!backdrop || !drawer) return;

    isDirty = false;

    let html = `
      <div class="drawer-header">
        <div class="drawer-title-wrap">
          <span class="status-badge status-badge--${status}"><span class="dot"></span> ${status}</span>
          <h3 class="drawer-title">${title}</h3>
        </div>
        <button class="drawer-close-btn" id="drawerCloseBtn" title="Close Drawer"><i class="fas fa-times"></i></button>
      </div>

      <div class="drawer-body" id="drawerBody">
    `;

    if (content) {
      html += `<div style="padding:16px;">${content}</div>`;
    } else if (accordions && accordions.length) {
      accordions.forEach((group) => {
        const isClosed = group.closed ? 'closed' : '';
        html += `
          <div class="accordion-group ${isClosed}">
            <div class="accordion-header">
              <span><i class="${group.icon || 'fas fa-sliders'}"></i> ${group.title}</span>
              <i class="fas fa-chevron-down"></i>
            </div>
            <div class="accordion-content">
              ${group.content}
            </div>
          </div>
        `;
      });
    }

    if (previewHtml) {
      html += `
        <div class="preview-card-wrap">
          <span class="preview-tag"><i class="fas fa-eye"></i> Live Draft Preview</span>
          ${previewHtml}
        </div>
      `;
    }

    html += `
      </div>
    `;

    if (footerButtons && footerButtons.length) {
      html += `
        <div class="drawer-footer">
          ${footerButtons.map((btn) => `<button type="button" class="btn ${btn.class}" id="${btn.id}">${btn.icon ? `<i class="${btn.icon}"></i> ` : ''}${btn.label}</button>`).join('')}
        </div>
      `;
    }

    drawer.innerHTML = html;
    backdrop.classList.add('open');

    // Accordion Toggle Handlers
    drawer.querySelectorAll('.accordion-header').forEach((h) => {
      h.addEventListener('click', () => {
        h.parentElement.classList.toggle('closed');
      });
    });

    // Close Handler
    const closeBtn = drawer.querySelector('#drawerCloseBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeDrawer());
    }

    // Attach Button Click Callbacks
    footerButtons.forEach((btn) => {
      const btnEl = drawer.querySelector(`#${btn.id}`);
      if (btnEl && btn.onClick) {
        btnEl.addEventListener('click', () => btn.onClick(drawer));
      }
    });

    // Track Form Field Changes for Dirty State
    drawer.querySelectorAll('input, select, textarea').forEach((el) => {
      el.addEventListener('change', () => { isDirty = true; });
    });
  }

  function closeDrawer(force = false) {
    if (isDirty && !force) {
      if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        return;
      }
    }

    const backdrop = document.getElementById('adminDrawerBackdrop');
    if (backdrop) backdrop.classList.remove('open');
    isDirty = false;
  }

  function markClean() {
    isDirty = false;
  }

  function markDirty() {
    isDirty = true;
  }

  window.AdminDrawer = {
    openDrawer,
    closeDrawer,
    open: openDrawer,
    close: closeDrawer,
    markClean,
    markDirty,
  };
})();
