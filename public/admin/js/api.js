/* ============================================================
   api.js — Reusable API Client for Ashwa Riders Admin Panel
   Understands Phase 2 response envelope, credentials, and errors.
============================================================ */

(function () {
  'use strict';

  const API_BASE = '/api/v1';

  /**
   * Universal fetch wrapper.
   */
  async function request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

    const headers = { ...(options.headers || {}) };
    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const config = {
      credentials: 'include',
      headers,
      ...options,
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(data.message || `Request failed with status ${response.status}`);
        error.status = response.status;
        error.data = data;
        error.errors = data.errors || null;
        throw error;
      }

      return data;
    } catch (err) {
      if (err.status === 401 && !url.endsWith('/auth/logout') && !url.endsWith('/admin/status')) {
        // Trigger session expiry handler
        if (window.AdminAuth && window.AdminAuth.handleSessionExpired) {
          window.AdminAuth.handleSessionExpired();
        }
      }
      throw err;
    }
  }

  const api = {
    get: (url, params = {}) => {
      const query = new URLSearchParams(params).toString();
      const endpoint = query ? `${url}?${query}` : url;
      return request(endpoint, { method: 'GET' });
    },
    post: (url, body) => request(url, { method: 'POST', body }),
    put: (url, body) => request(url, { method: 'PUT', body }),
    patch: (url, body) => request(url, { method: 'PATCH', body }),
    delete: (url) => request(url, { method: 'DELETE' }),
  };

  window.AdminApi = api;
})();
