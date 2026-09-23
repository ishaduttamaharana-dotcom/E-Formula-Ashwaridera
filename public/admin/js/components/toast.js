/* ============================================================
   toast.js — Toast Notification Component
============================================================ */

(function () {
  'use strict';

  function show(message, type = 'success', duration = 3500) {
    const container = document.getElementById('adminToastContainer');
    if (!container) return;

    let iconClass = 'check-circle';
    if (type === 'error') iconClass = 'exclamation-circle';
    else if (type === 'warning') iconClass = 'exclamation-triangle';
    else if (type === 'info') iconClass = 'info-circle';

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="fas fa-${iconClass}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  window.AdminToast = {
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    info: (msg) => show(msg, 'info'),
    warning: (msg) => show(msg, 'warning'),
  };
})();
