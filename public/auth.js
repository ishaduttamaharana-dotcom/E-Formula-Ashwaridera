/* ============================================================
   auth.js — Ashwa Riders Authentication
   Injected into every page. Handles:
     • Auth modal (Login / Register tabs)
     • Navbar Login / User profile display
     • API calls to /api/v1/auth/*
     • Persistent login state via localStorage
   Design matches site's existing design system exactly.
============================================================ */

(function () {
  'use strict';

  // ─── Constants ─────────────────────────────────────────────
  const API_BASE   = '/api/v1/auth';
  const STORAGE_KEY = 'ar_user'; // Stores { fullName, email, role } only — no token

  // ─── State ─────────────────────────────────────────────────
  let currentUser = null;

  // ─── Helpers ───────────────────────────────────────────────
  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const storeUser = (user) => {
    if (!user) { localStorage.removeItem(STORAGE_KEY); return; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      fullName:     user.fullName,
      email:        user.email,
      role:         user.role,
      profilePhoto: user.profilePhoto,
    }));
  };

  const clearUser = () => localStorage.removeItem(STORAGE_KEY);

  // ─── API call wrapper ───────────────────────────────────────
  const apiCall = async (endpoint, options = {}) => {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include', // Send / receive httpOnly cookies
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    return res.json();
  };

  // ─── Toast notifications ────────────────────────────────────
  const showToast = (message, type = 'success') => {
    const existing = document.querySelector('.ar-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `ar-toast ar-toast--${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('ar-toast--visible'));
    setTimeout(() => {
      toast.classList.remove('ar-toast--visible');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  };

  // ─── Show validation errors inside a form ──────────────────
  const showFormErrors = (form, errors) => {
    // Clear old errors
    form.querySelectorAll('.ar-field-error').forEach(el => el.remove());
    form.querySelectorAll('.ar-input--error').forEach(el => el.classList.remove('ar-input--error'));

    if (!errors || !errors.length) return;

    errors.forEach(({ field, message }) => {
      const input = form.querySelector(`[name="${field}"]`);
      if (!input) return;
      input.classList.add('ar-input--error');
      const err = document.createElement('span');
      err.className = 'ar-field-error';
      err.textContent = message;
      input.parentNode.insertBefore(err, input.nextSibling);
    });
  };

  const clearFormErrors = (form) => {
    form.querySelectorAll('.ar-field-error').forEach(el => el.remove());
    form.querySelectorAll('.ar-input--error').forEach(el => el.classList.remove('ar-input--error'));
  };

  // ─── Set button loading state ───────────────────────────────
  const setLoading = (btn, loading, text = '') => {
    if (loading) {
      btn.dataset.originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> ${text || 'Please wait...'}`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText || text;
    }
  };

  // ============================================================
  //  INJECT STYLES
  // ============================================================
  const injectStyles = () => {
    const style = document.createElement('style');
    style.id = 'ar-auth-styles';
    style.textContent = `
      /* ── Auth Modal Overlay ── */
      .ar-modal-overlay {
        position: fixed; inset: 0; z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        background: rgba(10,10,10,0.85);
        backdrop-filter: blur(8px);
        opacity: 0; visibility: hidden;
        transition: opacity 0.35s cubic-bezier(0.16,1,0.3,1),
                    visibility 0.35s;
      }
      .ar-modal-overlay.ar-open {
        opacity: 1; visibility: visible;
      }

      /* ── Modal Card ── */
      .ar-modal {
        background: #111111;
        border: 1px solid rgba(255,255,255,0.1);
        width: 100%; max-width: 460px;
        padding: 40px 36px;
        position: relative;
        transform: translateY(28px) scale(0.97);
        transition: transform 0.4s cubic-bezier(0.16,1,0.3,1);
        box-shadow: 0 40px 100px rgba(0,0,0,0.7);
      }
      .ar-modal-overlay.ar-open .ar-modal {
        transform: translateY(0) scale(1);
      }

      /* ── Close button ── */
      .ar-modal-close {
        position: absolute; top: 16px; right: 16px;
        width: 34px; height: 34px;
        background: transparent; border: 1px solid rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.5); cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.85rem;
        transition: all 0.3s ease;
      }
      .ar-modal-close:hover { border-color: #F25912; color: #F25912; }

      /* ── Logo area ── */
      .ar-modal-logo {
        text-align: center; margin-bottom: 28px;
      }
      .ar-modal-logo .ar-brand {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 1.4rem; font-weight: 700;
        color: #fff; letter-spacing: -0.02em;
      }
      .ar-modal-logo .ar-brand span { color: #ff751f; }
      .ar-modal-logo .ar-eyebrow {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.64rem; color: rgba(255,255,255,0.35);
        letter-spacing: 0.1em; text-transform: uppercase;
        margin-top: 4px;
      }

      /* ── Tabs ── */
      .ar-tabs {
        display: flex; gap: 0;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        margin-bottom: 28px;
      }
      .ar-tab {
        flex: 1; padding: 10px;
        background: transparent; border: none;
        color: rgba(255,255,255,0.4);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 0.8rem; font-weight: 700;
        letter-spacing: 0.08em; text-transform: uppercase;
        cursor: pointer;
        border-bottom: 2px solid transparent;
        margin-bottom: -1px;
        transition: all 0.3s ease;
      }
      .ar-tab.ar-active { color: #F25912; border-bottom-color: #F25912; }
      .ar-tab:hover:not(.ar-active) { color: rgba(255,255,255,0.7); }

      /* ── Tab panels ── */
      .ar-panel { display: none; }
      .ar-panel.ar-active { display: block; }

      /* ── Form fields ── */
      .ar-field { margin-bottom: 16px; position: relative; }
      .ar-label {
        display: block; margin-bottom: 6px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.68rem; letter-spacing: 0.06em;
        color: rgba(255,255,255,0.45); text-transform: uppercase;
      }
      .ar-input {
        width: 100%; padding: 11px 14px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.1);
        color: #fff; font-family: 'Inter', sans-serif; font-size: 0.92rem;
        outline: none; border-radius: 0;
        transition: border-color 0.25s ease, background 0.25s ease;
      }
      .ar-input:focus {
        border-color: #715A5A;
        background: rgba(113,90,90,0.12);
      }
      .ar-input.ar-input--error { border-color: #ff4d4d; }
      .ar-input::placeholder { color: rgba(255,255,255,0.2); }

      /* Password toggle wrapper */
      .ar-input-wrap { position: relative; }
      .ar-input-wrap .ar-input { padding-right: 44px; }
      .ar-pw-toggle {
        position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
        background: none; border: none; color: rgba(255,255,255,0.35);
        cursor: pointer; font-size: 0.85rem; padding: 4px;
        transition: color 0.2s;
      }
      .ar-pw-toggle:hover { color: #F25912; }

      /* Field error text */
      .ar-field-error {
        display: block; margin-top: 5px;
        font-size: 0.75rem; color: #ff6b6b;
        font-family: 'Inter', sans-serif;
      }

      /* Form row (2 columns) */
      .ar-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
      @media (max-width: 480px) { .ar-row { grid-template-columns: 1fr; } }

      /* ── Submit button ── */
      .ar-submit {
        width: 100%; margin-top: 8px;
        padding: 13px 20px;
        background: #F25912; color: #fff;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 0.82rem; font-weight: 700;
        letter-spacing: 0.09em; text-transform: uppercase;
        border: none; cursor: pointer;
        clip-path: polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%);
        transition: background 0.3s ease, opacity 0.3s ease;
        display: flex; align-items: center; justify-content: center; gap: 8px;
      }
      .ar-submit:hover { background: #FF6A26; }
      .ar-submit:disabled { opacity: 0.6; cursor: not-allowed; }

      /* ── Switch link ── */
      .ar-switch {
        text-align: center; margin-top: 20px;
        font-size: 0.83rem; color: rgba(255,255,255,0.4);
        font-family: 'Inter', sans-serif;
      }
      .ar-switch a {
        color: #029386; text-decoration: none; font-weight: 600;
        cursor: pointer;
      }
      .ar-switch a:hover { color: #06c2ac; text-decoration: underline; }

      /* ── Password rules hint ── */
      .ar-pw-hint {
        font-size: 0.7rem; color: rgba(255,255,255,0.3);
        margin-top: 5px; font-family: 'Inter', sans-serif;
        line-height: 1.5;
      }

      /* ── Divider ── */
      .ar-divider {
        display: flex; align-items: center; gap: 12px;
        margin: 20px 0;
        font-size: 0.72rem; color: rgba(255,255,255,0.25);
        font-family: 'JetBrains Mono', monospace; text-transform: uppercase;
      }
      .ar-divider::before, .ar-divider::after {
        content: ''; flex: 1; height: 1px;
        background: rgba(255,255,255,0.1);
      }

      /* ── Navbar auth button ── */
      #ar-nav-btn {
        padding: 8px 18px !important;
        background: transparent !important;
        border: 1px solid rgba(255,255,255,0.3) !important;
        color: rgba(255,255,255,0.75) !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
        font-size: 0.75rem !important; font-weight: 700 !important;
        letter-spacing: 0.08em !important; text-transform: uppercase !important;
        cursor: pointer !important; text-decoration: none !important;
        display: flex !important; align-items: center !important; gap: 7px !important;
        transition: all 0.3s ease !important;
        border-radius: 0 !important;
        background-color: transparent !important;
      }
      #ar-nav-btn::after { display: none !important; }
      #ar-nav-btn:hover {
        border-color: #029386 !important;
        color: #029386 !important;
        background: transparent !important;
      }

      /* ── User menu (post-login) ── */
      .ar-user-wrap { position: relative; display: inline-block; }
      .ar-user-btn {
        display: flex; align-items: center; gap: 8px;
        padding: 6px 14px;
        background: rgba(2,147,134,0.12) !important;
        border: 1px solid rgba(2,147,134,0.35) !important;
        color: #029386 !important;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 0.75rem; font-weight: 700;
        letter-spacing: 0.06em; text-transform: uppercase;
        cursor: pointer; border-radius: 0;
        transition: all 0.3s ease;
      }
      .ar-user-btn:hover {
        background: rgba(6,194,172,0.22) !important;
        border-color: #06c2ac !important;
      }
      .ar-user-btn::after { display: none !important; }
      .ar-avatar {
        width: 24px; height: 24px; border-radius: 50%;
        background: #029386; color: #10141c;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.7rem; font-weight: 700;
        flex-shrink: 0;
        overflow: hidden;
      }
      .ar-avatar img { width: 100%; height: 100%; object-fit: cover; }

      .ar-dropdown {
        position: absolute; top: calc(100% + 8px); right: 0;
        background: #111; border: 1px solid rgba(255,255,255,0.1);
        min-width: 200px; z-index: 10000;
        box-shadow: 0 16px 40px rgba(0,0,0,0.6);
        opacity: 0; visibility: hidden; transform: translateY(8px);
        transition: all 0.25s cubic-bezier(0.16,1,0.3,1);
      }
      .ar-dropdown.ar-open {
        opacity: 1; visibility: visible; transform: translateY(0);
      }
      .ar-dropdown-header {
        padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      .ar-dropdown-name {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 0.88rem; font-weight: 700; color: #fff;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .ar-dropdown-role {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.62rem; color: #06c2ac;
        text-transform: uppercase; letter-spacing: 0.06em;
        margin-top: 3px;
      }
      .ar-dropdown-item {
        display: flex; align-items: center; gap: 10px;
        padding: 11px 16px;
        color: rgba(255,255,255,0.6);
        font-family: 'Inter', sans-serif; font-size: 0.83rem;
        cursor: pointer; border: none; background: none;
        width: 100%; text-align: left;
        transition: all 0.2s ease;
        text-decoration: none;
      }
      .ar-dropdown-item:hover { background: rgba(255,255,255,0.05); color: #fff; }
      .ar-dropdown-item.ar-danger:hover { background: rgba(255,77,77,0.1); color: #ff6b6b; }
      .ar-dropdown-item i { width: 16px; text-align: center; font-size: 0.8rem; }
      .ar-dropdown-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 4px 0; }

      /* ── Toast ── */
      .ar-toast {
        position: fixed; bottom: 28px; right: 28px; z-index: 99999;
        display: flex; align-items: center; gap: 10px;
        padding: 14px 20px;
        background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
        color: #fff; font-family: 'Inter', sans-serif; font-size: 0.88rem;
        box-shadow: 0 12px 40px rgba(0,0,0,0.5);
        transform: translateY(16px); opacity: 0;
        transition: all 0.4s cubic-bezier(0.16,1,0.3,1);
        max-width: 360px;
      }
      .ar-toast--visible { transform: translateY(0); opacity: 1; }
      .ar-toast--success i { color: #4ade80; }
      .ar-toast--error i { color: #ff6b6b; }
      .ar-toast--info i { color: #60a5fa; }

      /* ── Profile panel inside modal ── */
      .ar-profile-info { margin-bottom: 20px; }
      .ar-profile-row {
        display: flex; justify-content: space-between; align-items: center;
        padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.06);
      }
      .ar-profile-row:last-child { border-bottom: none; }
      .ar-profile-label {
        font-family: 'JetBrains Mono', monospace; font-size: 0.65rem;
        color: rgba(255,255,255,0.35); text-transform: uppercase; letter-spacing: 0.06em;
      }
      .ar-profile-value {
        font-family: 'Inter', sans-serif; font-size: 0.85rem; color: rgba(255,255,255,0.8);
        text-align: right; max-width: 200px;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }

      /* Light mode overrides */
      body.light .ar-modal { background: #f6f4ee; border-color: rgba(16,20,28,0.12); }
      body.light .ar-modal-close { color: rgba(16,20,28,0.4); border-color: rgba(16,20,28,0.15); }
      body.light .ar-modal-close:hover { border-color: #029386; color: #029386; }
      body.light .ar-modal-logo .ar-brand { color: #10141c; }
      body.light .ar-tab { color: rgba(16,20,28,0.35); }
      body.light .ar-tab.ar-active { color: #029386; }
      body.light .ar-label { color: rgba(16,20,28,0.45); }
      body.light .ar-input {
        background: rgba(16,20,28,0.04); border-color: rgba(16,20,28,0.15);
        color: #10141c;
      }
      body.light .ar-input:focus { border-color: #029386; background: rgba(6,194,172,0.04); }
      body.light .ar-switch { color: rgba(16,20,28,0.45); }
      body.light .ar-pw-hint { color: rgba(16,20,28,0.35); }
      body.light .ar-divider { color: rgba(16,20,28,0.3); }
      body.light .ar-divider::before,
      body.light .ar-divider::after { background: rgba(16,20,28,0.1); }
      body.light #ar-nav-btn {
        border-color: rgba(16,20,28,0.3) !important;
        color: rgba(16,20,28,0.7) !important;
      }
      body.light #ar-nav-btn:hover {
        border-color: #029386 !important; color: #029386 !important;
      }
      body.light .ar-dropdown { background: #f6f4ee; border-color: rgba(16,20,28,0.12); }
      body.light .ar-dropdown-name { color: #10141c; }
      body.light .ar-dropdown-item { color: rgba(16,20,28,0.6); }
      body.light .ar-dropdown-item:hover { background: rgba(16,20,28,0.05); color: #10141c; }
      body.light .ar-toast { background: #fff; border-color: rgba(16,20,28,0.12); color: #10141c; }
      body.light .ar-profile-row { border-color: rgba(16,20,28,0.08); }
      body.light .ar-profile-value { color: rgba(16,20,28,0.8); }
    `;
    document.head.appendChild(style);
  };

  // ============================================================
  //  INJECT MODAL HTML
  // ============================================================
  const injectModal = () => {
    const html = `
    <div class="ar-modal-overlay" id="arModalOverlay" role="dialog" aria-modal="true" aria-labelledby="arModalTitle">
      <div class="ar-modal" id="arModal">
        <button class="ar-modal-close" id="arModalClose" aria-label="Close">
          <i class="fas fa-times"></i>
        </button>

        <!-- Logo -->
        <div class="ar-modal-logo">
          <div class="ar-brand">Ashwa<span>Riders</span></div>
          <div class="ar-eyebrow">E-Formula · SVPCET</div>
        </div>

        <!-- Tabs -->
        <div class="ar-tabs" role="tablist">
          <button class="ar-tab ar-active" id="arTabLogin" role="tab" aria-controls="arPanelLogin" aria-selected="true">Sign In</button>
          <button class="ar-tab" id="arTabRegister" role="tab" aria-controls="arPanelRegister" aria-selected="false">Register</button>
          <button class="ar-tab" id="arTabProfile" role="tab" aria-controls="arPanelProfile" aria-selected="false" style="display:none">Profile</button>
        </div>

        <!-- ── LOGIN PANEL ── -->
        <div class="ar-panel ar-active" id="arPanelLogin" role="tabpanel">
          <form id="arLoginForm" novalidate autocomplete="on">
            <div class="ar-field">
              <label class="ar-label" for="loginEmail">Email Address</label>
              <input class="ar-input" type="email" id="loginEmail" name="email"
                placeholder="you@example.com" required autocomplete="email" />
            </div>
            <div class="ar-field">
              <label class="ar-label" for="loginPassword">Password</label>
              <div class="ar-input-wrap">
                <input class="ar-input" type="password" id="loginPassword" name="password"
                  placeholder="Your password" required autocomplete="current-password" />
                <button type="button" class="ar-pw-toggle" data-target="loginPassword" aria-label="Toggle password visibility">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <button type="submit" class="ar-submit" id="arLoginSubmit">
              <i class="fas fa-sign-in-alt"></i> Sign In
            </button>
          </form>
          <p class="ar-switch">
            Don't have an account?
            <a id="arSwitchToRegister">Create one</a>
          </p>
        </div>

        <!-- ── REGISTER PANEL ── -->
        <div class="ar-panel" id="arPanelRegister" role="tabpanel">
          <form id="arRegisterForm" novalidate autocomplete="off">
            <div class="ar-field">
              <label class="ar-label" for="regFullName">Full Name</label>
              <input class="ar-input" type="text" id="regFullName" name="fullName"
                placeholder="Your full name" required autocomplete="name" />
            </div>
            <div class="ar-row">
              <div class="ar-field">
                <label class="ar-label" for="regEmail">Email</label>
                <input class="ar-input" type="email" id="regEmail" name="email"
                  placeholder="you@example.com" required autocomplete="email" />
              </div>
              <div class="ar-field">
                <label class="ar-label" for="regPhone">Phone</label>
                <input class="ar-input" type="tel" id="regPhone" name="phone"
                  placeholder="+91 98765 43210" required autocomplete="tel" />
              </div>
            </div>
            <div class="ar-row">
              <div class="ar-field">
                <label class="ar-label" for="regCollege">College</label>
                <input class="ar-input" type="text" id="regCollege" name="college"
                  placeholder="College name" required />
              </div>
              <div class="ar-field">
                <label class="ar-label" for="regBranch">Branch</label>
                <input class="ar-input" type="text" id="regBranch" name="branch"
                  placeholder="e.g. Mechanical" required />
              </div>
            </div>
            <div class="ar-field">
              <label class="ar-label" for="regPassword">Password</label>
              <div class="ar-input-wrap">
                <input class="ar-input" type="password" id="regPassword" name="password"
                  placeholder="Create a strong password" required autocomplete="new-password" />
                <button type="button" class="ar-pw-toggle" data-target="regPassword" aria-label="Toggle password visibility">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <span class="ar-pw-hint">Min 8 chars · uppercase · lowercase · number · special character</span>
            </div>
            <div class="ar-field">
              <label class="ar-label" for="regConfirm">Confirm Password</label>
              <div class="ar-input-wrap">
                <input class="ar-input" type="password" id="regConfirm" name="confirmPassword"
                  placeholder="Repeat your password" required autocomplete="new-password" />
                <button type="button" class="ar-pw-toggle" data-target="regConfirm" aria-label="Toggle password visibility">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>
            <button type="submit" class="ar-submit" id="arRegisterSubmit">
              <i class="fas fa-user-plus"></i> Create Account
            </button>
          </form>
          <p class="ar-switch">
            Already have an account?
            <a id="arSwitchToLogin">Sign in</a>
          </p>
        </div>

        <!-- ── PROFILE PANEL ── -->
        <div class="ar-panel" id="arPanelProfile" role="tabpanel">
          <div class="ar-profile-info" id="arProfileInfo"></div>
          <button class="ar-submit" id="arProfileLogout" style="background:#c0392b;clip-path:none;">
            <i class="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>

      </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
  };

  // ============================================================
  //  INJECT NAVBAR BUTTON
  // ============================================================
  const injectNavButton = () => {
    const navLinks = document.getElementById('navLinks');
    if (!navLinks) return;

    const li = document.createElement('li');
    li.id = 'arNavItem';
    navLinks.appendChild(li);

    updateNavButton();
  };

  const updateNavButton = () => {
    const li = document.getElementById('arNavItem');
    if (!li) return;

    const user = getStoredUser();

    if (user) {
      // Logged in — show avatar + name + dropdown
      const initial = (user.fullName || 'U').charAt(0).toUpperCase();
      const photoHtml = user.profilePhoto && user.profilePhoto.url
        ? `<img src="${user.profilePhoto.url}" alt="avatar" />`
        : initial;

      li.innerHTML = `
        <div class="ar-user-wrap" id="arUserWrap">
          <button class="ar-user-btn" id="arUserBtn" aria-expanded="false" aria-haspopup="true">
            <div class="ar-avatar">${photoHtml}</div>
            <span>${user.fullName.split(' ')[0]}</span>
            <i class="fas fa-chevron-down" style="font-size:0.6rem;opacity:0.6;"></i>
          </button>
          <div class="ar-dropdown" id="arDropdown" role="menu">
            <div class="ar-dropdown-header">
              <div class="ar-dropdown-name">${user.fullName}</div>
              <div class="ar-dropdown-role">${user.role}</div>
            </div>
            <button class="ar-dropdown-item" id="arViewProfile" role="menuitem">
              <i class="fas fa-user"></i> View Profile
            </button>
            <div class="ar-dropdown-divider"></div>
            <button class="ar-dropdown-item ar-danger" id="arLogoutBtn" role="menuitem">
              <i class="fas fa-sign-out-alt"></i> Sign Out
            </button>
          </div>
        </div>`;

      // Dropdown toggle
      const userBtn  = li.querySelector('#arUserBtn');
      const dropdown = li.querySelector('#arDropdown');

      userBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('ar-open');
        dropdown.classList.toggle('ar-open', !isOpen);
        userBtn.setAttribute('aria-expanded', String(!isOpen));
      });

      document.addEventListener('click', () => {
        dropdown.classList.remove('ar-open');
        userBtn.setAttribute('aria-expanded', 'false');
      });

      li.querySelector('#arViewProfile').addEventListener('click', () => {
        dropdown.classList.remove('ar-open');
        openModal('profile');
      });

      li.querySelector('#arLogoutBtn').addEventListener('click', handleLogout);

    } else {
      // Logged out — show Login button
      li.innerHTML = `<a href="#" id="ar-nav-btn"><i class="fas fa-user"></i> Login</a>`;
      li.querySelector('#ar-nav-btn').addEventListener('click', (e) => {
        e.preventDefault();
        openModal('login');
      });
    }
  };

  // ============================================================
  //  MODAL CONTROLS
  // ============================================================
  const openModal = (tab = 'login') => {
    const overlay = document.getElementById('arModalOverlay');
    if (!overlay) return;
    overlay.classList.add('ar-open');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
  };

  const closeModal = () => {
    const overlay = document.getElementById('arModalOverlay');
    if (!overlay) return;
    overlay.classList.remove('ar-open');
    document.body.style.overflow = '';
  };

  const switchTab = (tab) => {
    const panels = { login: 'arPanelLogin', register: 'arPanelRegister', profile: 'arPanelProfile' };
    const tabs   = { login: 'arTabLogin',   register: 'arTabRegister',   profile: 'arTabProfile'   };

    Object.keys(panels).forEach((key) => {
      const panel = document.getElementById(panels[key]);
      const tabEl = document.getElementById(tabs[key]);
      if (panel) panel.classList.toggle('ar-active', key === tab);
      if (tabEl) { tabEl.classList.toggle('ar-active', key === tab); tabEl.setAttribute('aria-selected', String(key === tab)); }
    });

    // Populate profile if switching to it
    if (tab === 'profile') populateProfile();

    // Focus first input
    const activePanel = document.querySelector('.ar-panel.ar-active');
    if (activePanel) {
      const firstInput = activePanel.querySelector('input');
      if (firstInput) setTimeout(() => firstInput.focus(), 100);
    }
  };

  // ─── Populate profile panel ─────────────────────────────────
  const populateProfile = () => {
    const user = getStoredUser();
    const info = document.getElementById('arProfileInfo');
    if (!user || !info) return;

    info.innerHTML = `
      <div class="ar-profile-row">
        <span class="ar-profile-label">Name</span>
        <span class="ar-profile-value">${user.fullName || '—'}</span>
      </div>
      <div class="ar-profile-row">
        <span class="ar-profile-label">Email</span>
        <span class="ar-profile-value">${user.email || '—'}</span>
      </div>
      <div class="ar-profile-row">
        <span class="ar-profile-label">Role</span>
        <span class="ar-profile-value" style="color:#ff751f;font-weight:600;text-transform:uppercase;">${user.role || 'user'}</span>
      </div>
    `;
  };

  // ============================================================
  //  AUTH ACTIONS
  // ============================================================

  // ─── Register ───────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    const form = document.getElementById('arRegisterForm');
    const btn  = document.getElementById('arRegisterSubmit');
    clearFormErrors(form);

    const body = {
      fullName:        form.querySelector('[name="fullName"]').value.trim(),
      email:           form.querySelector('[name="email"]').value.trim(),
      phone:           form.querySelector('[name="phone"]').value.trim(),
      password:        form.querySelector('[name="password"]').value,
      confirmPassword: form.querySelector('[name="confirmPassword"]').value,
      college:         form.querySelector('[name="college"]').value.trim(),
      branch:          form.querySelector('[name="branch"]').value.trim(),
    };

    setLoading(btn, true, 'Creating account...');

    try {
      const data = await apiCall('/register', {
        method: 'POST',
        body:   JSON.stringify(body),
      });

      if (data.success) {
        storeUser(data.data.user);
        currentUser = data.data.user;
        closeModal();
        updateNavButton();
        showToast('Welcome to Ashwa Riders! Account created.', 'success');
        form.reset();
      } else if (data.errors) {
        showFormErrors(form, data.errors);
        showToast(data.message || 'Please fix the errors below.', 'error');
      } else {
        showToast(data.message || 'Registration failed. Please try again.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please check your connection.', 'error');
    } finally {
      setLoading(btn, false);
    }
  };

  // ─── Login ──────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    const form = document.getElementById('arLoginForm');
    const btn  = document.getElementById('arLoginSubmit');
    clearFormErrors(form);

    const body = {
      email:    form.querySelector('[name="email"]').value.trim(),
      password: form.querySelector('[name="password"]').value,
    };

    setLoading(btn, true, 'Signing in...');

    try {
      const data = await apiCall('/login', {
        method: 'POST',
        body:   JSON.stringify(body),
      });

      if (data.success) {
        storeUser(data.data.user);
        currentUser = data.data.user;
        closeModal();
        updateNavButton();
        showToast(`Welcome back, ${data.data.user.fullName.split(' ')[0]}!`, 'success');
        form.reset();
      } else if (data.errors) {
        showFormErrors(form, data.errors);
        showToast(data.message || 'Please fix the errors below.', 'error');
      } else {
        showToast(data.message || 'Invalid email or password.', 'error');
      }
    } catch (err) {
      showToast('Network error. Please check your connection.', 'error');
    } finally {
      setLoading(btn, false);
    }
  };

  // ─── Logout ─────────────────────────────────────────────────
  const handleLogout = async () => {
    try {
      await apiCall('/logout', { method: 'POST' });
    } catch (_) { /* Continue even if API call fails */ }

    clearUser();
    currentUser = null;
    closeModal();
    updateNavButton();
    showToast('You have been signed out.', 'info');
  };

  // ============================================================
  //  PASSWORD TOGGLE
  // ============================================================
  const initPasswordToggles = () => {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.ar-pw-toggle');
      if (!btn) return;
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (!input) return;
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      btn.querySelector('i').className = isPassword ? 'fas fa-eye-slash' : 'fas fa-eye';
    });
  };

  // ============================================================
  //  VERIFY SESSION ON LOAD
  // ============================================================
  const verifySession = async () => {
    const stored = getStoredUser();
    if (!stored) return; // Not logged in — nothing to verify

    try {
      const data = await apiCall('/me');
      if (data.success) {
        // Refresh stored user with latest from server
        storeUser(data.data.user);
        currentUser = data.data.user;
        updateNavButton();
      } else {
        // Token expired or invalid — clear local state
        clearUser();
        currentUser = null;
        updateNavButton();
      }
    } catch (_) {
      // Network error — keep local state, don't force logout
    }
  };

  // ============================================================
  //  WIRE EVERYTHING UP
  // ============================================================
  const init = () => {
    injectStyles();
    injectModal();
    injectNavButton();
    initPasswordToggles();

    // Modal close button
    document.getElementById('arModalClose').addEventListener('click', closeModal);

    // Click outside to close
    document.getElementById('arModalOverlay').addEventListener('click', (e) => {
      if (e.target === e.currentTarget) closeModal();
    });

    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeModal();
    });

    // Tab switches
    document.getElementById('arTabLogin').addEventListener('click', () => switchTab('login'));
    document.getElementById('arTabRegister').addEventListener('click', () => switchTab('register'));

    // Switch links inside panels
    document.getElementById('arSwitchToRegister').addEventListener('click', (e) => {
      e.preventDefault(); switchTab('register');
    });
    document.getElementById('arSwitchToLogin').addEventListener('click', (e) => {
      e.preventDefault(); switchTab('login');
    });

    // Form submissions
    document.getElementById('arLoginForm').addEventListener('submit', handleLogin);
    document.getElementById('arRegisterForm').addEventListener('submit', handleRegister);

    // Profile logout button
    document.getElementById('arProfileLogout').addEventListener('click', handleLogout);

    // Verify existing session silently
    verifySession();
  };

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
