/* ============================================================
   auth.js — Admin Authentication & Session Management
   Enforces server-side authorization checks and login/logout flows.
============================================================ */

(function () {
  'use strict';

  let currentUser = null;

  /**
   * Verify session with server endpoint GET /api/v1/admin/status
   */
  async function checkSession() {
    try {
      const res = await window.AdminApi.get('/admin/status');
      if (res.success && res.data && res.data.admin) {
        currentUser = res.data.admin;
        return currentUser;
      }
      currentUser = null;
      return null;
    } catch (err) {
      currentUser = null;
      return null;
    }
  }

  /**
   * Login with email and password
   */
  async function login(email, password) {
    try {
      const res = await window.AdminApi.post('/auth/login', { email, password });
      if (res.success && res.data && res.data.user) {
        if (res.data.user.role !== 'admin') {
          throw new Error('Access denied. Only administrator accounts can access the CMS.');
        }
        currentUser = res.data.user;
        return currentUser;
      }
      throw new Error(res.message || 'Login failed.');
    } catch (err) {
      throw err;
    }
  }

  /**
   * Logout session
   */
  async function logout() {
    try {
      await window.AdminApi.post('/auth/logout');
    } catch (e) {
      // Ignore logout errors
    } finally {
      currentUser = null;
      showLoginScreen();
    }
  }

  function showLoginScreen() {
    const loginWrap = document.getElementById('adminLoginWrap');
    const shell = document.getElementById('adminShell');

    if (loginWrap) loginWrap.style.display = 'flex';
    if (shell) shell.style.display = 'none';
  }

  function showAdminShell() {
    const loginWrap = document.getElementById('adminLoginWrap');
    const shell = document.getElementById('adminShell');

    if (loginWrap) loginWrap.style.display = 'none';
    if (shell) shell.style.display = 'flex';

    if (window.AdminNavbar && currentUser) {
      window.AdminNavbar.updateUserDisplay(currentUser);
    }
  }

  function handleSessionExpired() {
    if (window.AdminToast) {
      window.AdminToast.error('Session expired. Please log in again.');
    }
    showLoginScreen();
  }

  function getCurrentUser() {
    return currentUser;
  }

  window.AdminAuth = {
    checkSession,
    login,
    logout,
    showLoginScreen,
    showAdminShell,
    handleSessionExpired,
    getCurrentUser,
  };
})();
