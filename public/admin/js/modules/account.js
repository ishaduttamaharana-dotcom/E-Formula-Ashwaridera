/* ============================================================
   account.js — Admin Account Profile & Security Settings
   Modern dark Formula Student CMS dashboard interface
============================================================ */

(function () {
  'use strict';

  async function renderAccountModule(container) {
    if (!container) return;

    const user = window.AdminAuth ? window.AdminAuth.getCurrentUser() : null;
    const initial = (user?.fullName || user?.name || user?.email || 'A').charAt(0).toUpperCase();

    container.innerHTML = `
      <!-- Page Header Bar -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 4px 0; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-user-shield" style="color:var(--accent-orange, #F25912);"></i> Account & Profile Settings
          </h2>
          <p style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin:0;">
            Manage administrator credentials, profile information, and account security.
          </p>
        </div>

        <!-- User Profile Pill Header Badge -->
        <div style="display:inline-flex; align-items:center; gap:12px; background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); padding:8px 16px; border-radius:30px;">
          <div style="width:36px; height:36px; border-radius:50%; background:var(--accent-orange, #F25912); color:#fff; font-weight:800; display:flex; align-items:center; justify-content:center; font-size:1.1rem; text-shadow:0 1px 2px rgba(0,0,0,0.3);">
            ${initial}
          </div>
          <div>
            <div style="font-size:0.85rem; font-weight:700; color:#fff;">${escapeHtml(user?.fullName || user?.name || 'Administrator')}</div>
            <div style="font-size:0.75rem; color:var(--accent-orange, #F25912); font-weight:600; text-transform:uppercase; letter-spacing:0.04em;">
              ${escapeHtml(user?.role || 'Administrator')}
            </div>
          </div>
        </div>
      </div>

      <!-- Main 2-Column Section Cards -->
      <div style="display:grid; grid-template-columns: 1fr 1fr; gap:24px; margin-bottom:24px;">

        <!-- CARD 1: PROFILE DETAILS -->
        <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px; display:flex; flex-direction:column; justify-space-between;">
          <div>
            <div style="display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:20px;">
              <i class="fas fa-id-badge" style="color:var(--accent-orange, #F25912); font-size:1.1rem;"></i>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Profile Details</h3>
            </div>

            <form id="accountProfileForm" style="display:flex; flex-direction:column; gap:16px;">
              <div class="cms-field">
                <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                  Full Name *
                </label>
                <input 
                  type="text" 
                  id="accountFullName" 
                  class="cms-input" 
                  value="${escapeHtml(user ? user.fullName || user.name : '')}" 
                  required 
                  placeholder="Faktelectric"
                  style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
                />
              </div>

              <div class="cms-field">
                <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                  Email Address *
                </label>
                <input 
                  type="email" 
                  id="accountEmail" 
                  class="cms-input" 
                  value="${escapeHtml(user ? user.email : '')}" 
                  required 
                  placeholder="admin@ashwariders.com"
                  style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
                />
              </div>

              <div class="cms-field">
                <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                  System Role
                </label>
                <div style="position:relative;">
                  <input 
                    type="text" 
                    class="cms-input" 
                    value="${escapeHtml(user ? user.role : 'admin')}" 
                    readonly 
                    style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:var(--text-muted, #8E929E); font-size:0.92rem; outline:none; cursor:not-allowed;" 
                  />
                  <i class="fas fa-lock" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); color:var(--text-muted, #8E929E); font-size:0.85rem;"></i>
                </div>
              </div>

              <div style="margin-top:10px;">
                <button type="submit" class="btn btn-primary" id="saveProfileBtn" style="width:100%; display:inline-flex; align-items:center; justify-content:center; gap:8px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912); padding:11px 18px; font-weight:700;">
                  <i class="fas fa-save"></i> Save Profile Details
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- CARD 2: CHANGE PASSWORD -->
        <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px; display:flex; flex-direction:column; justify-space-between;">
          <div>
            <div style="display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:20px;">
              <i class="fas fa-lock" style="color:var(--accent-orange, #F25912); font-size:1.1rem;"></i>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Change Password</h3>
            </div>

            <form id="accountPasswordForm" style="display:flex; flex-direction:column; gap:16px;">
              <div class="cms-field">
                <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                  Current Password *
                </label>
                <div style="position:relative;">
                  <input 
                    type="password" 
                    id="currentPassword" 
                    class="cms-input" 
                    placeholder="Enter current password" 
                    required 
                    style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 40px 11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
                  />
                  <button type="button" class="toggle-pwd-btn" data-target="currentPassword" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted, #8E929E); cursor:pointer;">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>

              <div class="cms-field">
                <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                  New Password *
                </label>
                <div style="position:relative;">
                  <input 
                    type="password" 
                    id="newPassword" 
                    class="cms-input" 
                    placeholder="Minimum 8 characters" 
                    minlength="8" 
                    required 
                    style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 40px 11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
                  />
                  <button type="button" class="toggle-pwd-btn" data-target="newPassword" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted, #8E929E); cursor:pointer;">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>

              <div class="cms-field">
                <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                  Confirm New Password *
                </label>
                <div style="position:relative;">
                  <input 
                    type="password" 
                    id="confirmNewPassword" 
                    class="cms-input" 
                    placeholder="Confirm new password" 
                    minlength="8" 
                    required 
                    style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 40px 11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
                  />
                  <button type="button" class="toggle-pwd-btn" data-target="confirmNewPassword" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted, #8E929E); cursor:pointer;">
                    <i class="fas fa-eye"></i>
                  </button>
                </div>
              </div>

              <div style="margin-top:10px;">
                <button type="submit" class="btn btn-secondary" id="changePasswordBtn" style="width:100%; display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:11px 18px; font-weight:700;">
                  <i class="fas fa-key"></i> Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      <!-- CARD 3: ACTIVE ADMINISTRATOR SESSION -->
      <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div style="display:flex; align-items:center; gap:16px;">
          <div style="width:44px; height:44px; border-radius:10px; background:rgba(46,164,79,0.15); border:1px solid rgba(46,164,79,0.3); color:#2EA44F; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
            <i class="fas fa-shield-alt"></i>
          </div>
          <div>
            <div style="font-size:1.05rem; font-weight:700; color:#fff; display:flex; align-items:center; gap:8px;">
              Active Administrator Session
              <span style="display:inline-flex; align-items:center; gap:4px; background:rgba(46,164,79,0.15); color:#2EA44F; font-size:0.75rem; padding:2px 8px; border-radius:12px; font-weight:600;">
                <span style="width:6px; height:6px; border-radius:50%; background:#2EA44F;"></span> Live
              </span>
            </div>
            <div style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin-top:2px;">
              Signed in as <strong style="color:#fff;">${escapeHtml(user ? user.email : 'admin@ashwariders.com')}</strong>
            </div>
          </div>
        </div>

        <button type="button" class="btn btn-danger" id="accountLogoutBtn" style="background:rgba(239, 68, 68, 0.12); border:1px solid rgba(239, 68, 68, 0.3); color:#EF4444; padding:10px 20px; font-weight:700; display:inline-flex; align-items:center; gap:8px; border-radius:8px; cursor:pointer; transition:all 0.2s ease;">
          <i class="fas fa-sign-out-alt"></i> Sign Out of CMS
        </button>
      </div>
    `;

    bindEvents(container);
  }

  function bindEvents(container) {
    const profileForm = container.querySelector('#accountProfileForm');
    const passwordForm = container.querySelector('#accountPasswordForm');
    const logoutBtn = container.querySelector('#accountLogoutBtn');

    // Password toggle buttons
    container.querySelectorAll('.toggle-pwd-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const input = container.querySelector('#' + targetId);
        const icon = btn.querySelector('i');
        if (input) {
          if (input.type === 'password') {
            input.type = 'text';
            icon.className = 'fas fa-eye-slash';
          } else {
            input.type = 'password';
            icon.className = 'fas fa-eye';
          }
        }
      });
    });

    if (profileForm) {
      profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fullName = container.querySelector('#accountFullName').value.trim();
        const email = container.querySelector('#accountEmail').value.trim();
        const saveBtn = container.querySelector('#saveProfileBtn');

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        try {
          const res = await window.AdminApi.put('/auth/updatedetails', { fullName, email });
          if (window.AdminToast) {
            window.AdminToast.success('Profile details updated successfully.');
          }
          if (res.user && window.AdminAuth) {
            window.AdminAuth.setCurrentUser(res.user);
          }
        } catch (err) {
          if (window.AdminToast) {
            window.AdminToast.error('Profile update failed: ' + err.message);
          }
        } finally {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Profile Details';
        }
      });
    }

    if (passwordForm) {
      passwordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const currentPassword = container.querySelector('#currentPassword').value;
        const newPassword = container.querySelector('#newPassword').value;
        const confirmNewPassword = container.querySelector('#confirmNewPassword').value;
        const changeBtn = container.querySelector('#changePasswordBtn');

        if (newPassword !== confirmNewPassword) {
          if (window.AdminToast) window.AdminToast.error('New passwords do not match.');
          return;
        }

        changeBtn.disabled = true;
        changeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

        try {
          await window.AdminApi.put('/auth/updatepassword', { currentPassword, newPassword });
          if (window.AdminToast) {
            window.AdminToast.success('Password updated successfully. Please re-authenticate if required.');
          }
          passwordForm.reset();
        } catch (err) {
          if (window.AdminToast) {
            window.AdminToast.error('Password update failed: ' + err.message);
          }
        } finally {
          changeBtn.disabled = false;
          changeBtn.innerHTML = '<i class="fas fa-key"></i> Update Password';
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        if (window.AdminAuth) {
          await window.AdminAuth.logout();
        }
      });
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.AdminAccountModule = {
    renderAccountModule,
  };
})();

