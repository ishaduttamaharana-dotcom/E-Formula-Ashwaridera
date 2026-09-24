/* ============================================================
   navigation.js — Complete Global Header & Footer CMS Module
   Admin Control Center for /api/v1/admin/navigation
   Formula Student Electric Team (Ashwa Riders)
============================================================ */

(function () {
  'use strict';

  let currentData = null;
  let originalData = null;
  let saveState = 'saved'; // 'saved' | 'dirty' | 'saving' | 'publishing' | 'published' | 'error'

  const PLATFORMS = [
    { key: 'instagram', label: 'Instagram', icon: 'fab fa-instagram' },
    { key: 'linkedin', label: 'LinkedIn', icon: 'fab fa-linkedin-in' },
    { key: 'youtube', label: 'YouTube', icon: 'fab fa-youtube' },
    { key: 'twitter', label: 'X (Twitter)', icon: 'fab fa-x-twitter' },
    { key: 'github', label: 'GitHub', icon: 'fab fa-github' },
    { key: 'facebook', label: 'Facebook', icon: 'fab fa-facebook-f' },
    { key: 'discord', label: 'Discord', icon: 'fab fa-discord' },
    { key: 'other', label: 'Other / Custom', icon: 'fas fa-globe' },
  ];

  function getPlatformIcon(key) {
    const found = PLATFORMS.find((p) => p.key === key?.toLowerCase());
    return found ? found.icon : 'fas fa-globe';
  }

  // Helper to clone deeply
  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  async function renderNavigationModule(container) {
    if (!container) return;

    container.innerHTML = `
      <!-- Page Top Header -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 4px 0; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-compass" style="color:var(--accent-orange, #F25912);"></i> Global Header & Footer CMS
          </h2>
          <p style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin:0;">
            Single control center for the global Header navbar, navigation links, CTA, and complete multi-column Footer across all public pages.
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <div id="navSaveStatusBadge" style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); border:1px solid var(--border-hairline, #2D2D3B); padding:6px 12px; border-radius:20px; font-size:0.8rem; font-weight:600;">
            <span id="navSaveStatusDot" style="width:7px; height:7px; border-radius:50%; background:#2EA44F;"></span>
            <span id="navSaveStatusText" style="color:var(--text-muted, #8E929E);">All changes saved</span>
          </div>

          <button type="button" class="btn btn-secondary btn-sm" id="navHeaderSaveDraftBtn" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-save"></i> Save Draft
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="publishNavBtn" style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912);">
            <i class="fas fa-paper-plane"></i> Publish Navigation & Footer
          </button>
        </div>
      </div>

      <!-- Main Form Wrap -->
      <form id="globalNavFooterForm" style="display:flex; flex-direction:column; gap:22px; margin-bottom:100px;">

        <!-- 01 BRANDING & LOGO -->
        <div class="cms-card" style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:rgba(242,89,18,0.15); color:var(--accent-orange, #F25912); font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px;">01</span>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Header Branding & Logo</h3>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted, #8E929E);">Appears in top left of all pages</span>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:18px;">
            <div class="cms-field">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Brand Title *
              </label>
              <input type="text" class="cms-input" id="inpBrandTitle" required placeholder="Ashwa Riders"
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
            </div>

            <div class="cms-field">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Secondary Subtitle / Text
              </label>
              <input type="text" class="cms-input" id="inpSubtitle" placeholder="E-FORMULA · SVPCET"
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:18px; margin-top:16px;">
            <div class="cms-field">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Logo Asset URL
              </label>
              <div style="display:flex; gap:10px; align-items:center;">
                <input type="text" class="cms-input" id="inpLogoUrl" placeholder="https://res.cloudinary.com/..."
                  style="flex:1; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
                <button type="button" class="btn btn-secondary" id="btnSelectLogoMedia" style="padding:10px 14px; display:inline-flex; align-items:center; gap:6px; white-space:nowrap;">
                  <i class="fas fa-photo-video"></i> Media
                </button>
                <label class="btn btn-secondary" style="padding:10px 14px; display:inline-flex; align-items:center; gap:6px; white-space:nowrap; cursor:pointer; margin:0;">
                  <i class="fas fa-upload"></i> Upload
                  <input type="file" id="inpLogoUpload" accept="image/*" style="display:none;" />
                </label>
              </div>
            </div>

            <div class="cms-field">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Logo Home Target URL
              </label>
              <input type="text" class="cms-input" id="inpHomeUrl" placeholder="index.html or /"
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
            </div>
          </div>
        </div>

        <!-- 02 HEADER NAVIGATION LINKS -->
        <div class="cms-card" style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:rgba(242,89,18,0.15); color:var(--accent-orange, #F25912); font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px;">02</span>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Header Navigation Links</h3>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btnAddNavItem" style="display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-plus"></i> Add Navigation Item
            </button>
          </div>

          <p style="font-size:0.8rem; color:var(--text-muted, #8E929E); margin-top:-6px; margin-bottom:16px;">
            Reorder items with arrows. Click the eye icon to show or hide an item from public view.
          </p>

          <div id="navItemsListContainer" style="display:flex; flex-direction:column; gap:10px;">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- 03 HEADER CTA BUTTON -->
        <div class="cms-card" style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:rgba(242,89,18,0.15); color:var(--accent-orange, #F25912); font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px;">03</span>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Main Navbar CTA Button</h3>
            </div>
            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:0.82rem; color:#fff;">
              <input type="checkbox" id="chkCtaVisible" checked style="accent-color:var(--accent-orange, #F25912);" />
              Show CTA in Navbar
            </label>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr 180px; gap:18px; align-items:end;">
            <div class="cms-field">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                CTA Button Label
              </label>
              <input type="text" class="cms-input" id="inpCtaLabel" placeholder="Join Team"
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
            </div>

            <div class="cms-field">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                CTA Target URL
              </label>
              <input type="text" class="cms-input" id="inpCtaUrl" placeholder="index.html#recruitment"
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
            </div>

            <div style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:12px; text-align:center;">
              <span style="font-size:0.68rem; color:var(--text-muted, #8E929E); display:block; margin-bottom:6px; text-transform:uppercase; font-weight:700;">Live Button</span>
              <span id="previewCtaBadge" style="display:inline-block; background:var(--accent-orange, #F25912); color:#fff; font-size:0.8rem; font-weight:700; padding:6px 14px; border-radius:4px;">
                Join Team
              </span>
            </div>
          </div>
        </div>

        <!-- 04 FOOTER BRAND & DESCRIPTION -->
        <div class="cms-card" style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:rgba(242,89,18,0.15); color:var(--accent-orange, #F25912); font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px;">04</span>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Footer Brand & Tagline</h3>
            </div>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 2fr; gap:18px;">
            <div class="cms-field">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Footer Brand Title
              </label>
              <input type="text" class="cms-input" id="inpFooterBrandTitle" placeholder="Ashwa Riders"
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
            </div>

            <div class="cms-field">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Footer Description / Tagline
              </label>
              <textarea class="cms-textarea" id="inpFooterDesc" rows="3" placeholder="Building Central India's Formula Student electric race car. Driven by excellence, fueled by passion."
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none; resize:vertical; font-family:inherit; min-height:75px;"></textarea>
            </div>
          </div>
        </div>

        <!-- 05 FOOTER SOCIAL LINKS -->
        <div class="cms-card" style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:rgba(242,89,18,0.15); color:var(--accent-orange, #F25912); font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px;">05</span>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Footer Social Links</h3>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btnAddSocialLink" style="display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-plus"></i> Add Social Link
            </button>
          </div>

          <div id="socialLinksListContainer" style="display:flex; flex-direction:column; gap:10px;">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- 06 FOOTER LINK COLUMNS (GROUPS) -->
        <div class="cms-card" style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:rgba(242,89,18,0.15); color:var(--accent-orange, #F25912); font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px;">06</span>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Footer Link Groups (Columns)</h3>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btnAddLinkGroup" style="display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-folder-plus"></i> Add Footer Group
            </button>
          </div>

          <p style="font-size:0.8rem; color:var(--text-muted, #8E929E); margin-top:-6px; margin-bottom:16px;">
            Configure columns such as TEAM, RESOURCES, and CONTACT. Add or reorder links inside each column.
          </p>

          <div id="linkGroupsListContainer" style="display:flex; flex-direction:column; gap:16px;">
            <!-- Dynamically populated -->
          </div>
        </div>

        <!-- 07 COPYRIGHT & 08 FOOTER CREDIT -->
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
          
          <!-- 07 COPYRIGHT -->
          <div class="cms-card" style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
            <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="background:rgba(242,89,18,0.15); color:var(--accent-orange, #F25912); font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px;">07</span>
                <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Copyright Section</h3>
              </div>
            </div>

            <div class="cms-field" style="margin-bottom:12px;">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Copyright Text
              </label>
              <input type="text" class="cms-input" id="inpCopyrightText" placeholder="© 2026 Ashwa Riders. All rights reserved."
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
            </div>

            <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:0.82rem; color:#fff;">
              <input type="checkbox" id="chkAutoYear" checked style="accent-color:var(--accent-orange, #F25912);" />
              Automatic current year update
            </label>
          </div>

          <!-- 08 FOOTER CREDIT -->
          <div class="cms-card" style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
            <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <span style="background:rgba(242,89,18,0.15); color:var(--accent-orange, #F25912); font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px;">08</span>
                <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Footer Credit</h3>
              </div>
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:0.82rem; color:#fff;">
                <input type="checkbox" id="chkCreditVisible" checked style="accent-color:var(--accent-orange, #F25912);" />
                Show Credit
              </label>
            </div>

            <div class="cms-field" style="margin-bottom:12px;">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Credit Text
              </label>
              <input type="text" class="cms-input" id="inpCreditText" placeholder="Built by the Ashwa Riders Team"
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
            </div>

            <div class="cms-field">
              <label style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Credit URL (Optional)
              </label>
              <input type="text" class="cms-input" id="inpCreditUrl" placeholder="https://..."
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
            </div>
          </div>

        </div>

        <!-- 09 LIVE DRAFT PREVIEW -->
        <div class="cms-card" style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
            <div style="display:flex; align-items:center; gap:10px;">
              <span style="background:rgba(242,89,18,0.15); color:var(--accent-orange, #F25912); font-weight:800; font-size:0.75rem; padding:3px 8px; border-radius:4px;">09</span>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Live Draft Preview</h3>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted, #8E929E);">Simulates public Header & Footer using current unsaved/draft inputs</span>
          </div>

          <!-- Preview: Simulated Header -->
          <div style="margin-bottom:20px;">
            <div style="font-size:0.72rem; text-transform:uppercase; font-weight:700; color:var(--text-muted, #8E929E); margin-bottom:8px; letter-spacing:0.05em;">
              Simulated Global Header
            </div>
            <div id="simulatedNavbar" style="background:#0a0a0f; border:1px solid #2D2D3B; border-radius:8px; padding:14px 20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px;">
              <!-- Dynamically populated -->
            </div>
          </div>

          <!-- Preview: Simulated Footer -->
          <div>
            <div style="font-size:0.72rem; text-transform:uppercase; font-weight:700; color:var(--text-muted, #8E929E); margin-bottom:8px; letter-spacing:0.05em;">
              Simulated Global Footer
            </div>
            <div id="simulatedFooter" style="background:#0a0a0f; border:1px solid #2D2D3B; border-radius:8px; padding:24px; color:#fff;">
              <!-- Dynamically populated -->
            </div>
          </div>
        </div>

        <!-- STICKY BOTTOM ACTION BAR -->
        <div style="position:fixed; bottom:0; right:0; left:260px; background:rgba(24, 24, 32, 0.95); backdrop-filter:blur(10px); border-top:1px solid var(--border-hairline, #2D2D3B); padding:14px 30px; display:flex; justify-content:space-between; align-items:center; z-index:100; transition:left 0.3s ease;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.85rem; color:var(--text-muted, #8E929E);" id="navBottomStatus">
              <i class="fas fa-info-circle" style="color:var(--accent-orange, #F25912);"></i> Make changes above and click Save Draft or Publish.
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:12px;">
            <button type="button" class="btn btn-secondary" id="btnResetNavForm" style="display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-undo"></i> Reset
            </button>
            <button type="button" class="btn btn-secondary" id="btnBottomSaveDraft" style="display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-save"></i> Save Draft
            </button>
            <button type="button" class="btn btn-primary" id="btnBottomPublish" style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912);">
              <i class="fas fa-paper-plane"></i> Publish Navigation & Footer
            </button>
          </div>
        </div>

      </form>
    `;

    bindStaticEvents();
    await loadData();
  }

  function bindStaticEvents() {
    // Buttons
    document.getElementById('publishNavBtn')?.addEventListener('click', publishSettings);
    document.getElementById('btnBottomPublish')?.addEventListener('click', publishSettings);

    document.getElementById('navHeaderSaveDraftBtn')?.addEventListener('click', saveDraft);
    document.getElementById('btnBottomSaveDraft')?.addEventListener('click', saveDraft);

    document.getElementById('btnResetNavForm')?.addEventListener('click', () => {
      if (originalData) {
        currentData = deepClone(originalData);
        populateAllFields();
        setSaveState('saved');
        if (window.AdminToast) window.AdminToast.info('Form reset to last saved state.');
      }
    });

    // Add buttons
    document.getElementById('btnAddNavItem')?.addEventListener('click', () => {
      if (!currentData.navigation) currentData.navigation = [];
      const newOrder = currentData.navigation.length + 1;
      currentData.navigation.push({
        id: `nav-${Date.now()}`,
        label: 'New Link',
        url: '#',
        visible: true,
        order: newOrder,
      });
      renderNavigationList();
      updateLivePreview();
      markDirty();
    });

    document.getElementById('btnAddSocialLink')?.addEventListener('click', () => {
      if (!currentData.socialLinks) currentData.socialLinks = [];
      const newOrder = currentData.socialLinks.length + 1;
      currentData.socialLinks.push({
        id: `soc-${Date.now()}`,
        platform: 'instagram',
        label: 'Instagram',
        url: 'https://instagram.com/',
        icon: 'fab fa-instagram',
        visible: true,
        order: newOrder,
      });
      renderSocialLinksList();
      updateLivePreview();
      markDirty();
    });

    document.getElementById('btnAddLinkGroup')?.addEventListener('click', () => {
      if (!currentData.linkGroups) currentData.linkGroups = [];
      const newOrder = currentData.linkGroups.length + 1;
      currentData.linkGroups.push({
        id: `grp-${Date.now()}`,
        title: 'NEW GROUP',
        visible: true,
        order: newOrder,
        links: [
          { id: `lnk-${Date.now()}-1`, label: 'Link 1', url: '#', visible: true, order: 1 }
        ],
      });
      renderLinkGroupsList();
      updateLivePreview();
      markDirty();
    });

    // Logo media picker & direct upload
    document.getElementById('btnSelectLogoMedia')?.addEventListener('click', () => {
      if (window.MediaPicker) {
        window.MediaPicker.open({
          allowedType: 'image',
          onSelect: (asset) => {
            const url = asset.secureUrl || asset.url;
            document.getElementById('inpLogoUrl').value = url;
            currentData.branding.logoUrl = url;
            updateLivePreview();
            markDirty();
          },
        });
      }
    });

    document.getElementById('inpLogoUpload')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      try {
        if (window.AdminToast) window.AdminToast.info('Uploading logo image...');
        let logoUrl = '';

        if (window.AdminUploader && window.AdminUploader.uploadFile) {
          const res = await window.AdminUploader.uploadFile(file, {
            folder: 'ashwa_navigation',
            allowedType: 'image',
          });
          logoUrl = res.url || res.secureUrl;
        } else {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'ashwa_navigation');
          const res = await window.AdminApi.post('/admin/media/upload', formData);
          logoUrl = res.data?.secureUrl || res.data?.url || res.url;
        }

        if (logoUrl) {
          document.getElementById('inpLogoUrl').value = logoUrl;
          currentData.branding.logoUrl = logoUrl;
          updateLivePreview();
          markDirty();
          if (window.AdminToast) window.AdminToast.success('Logo uploaded and verified successfully.');
        } else {
          throw new Error('No valid URL returned.');
        }
      } catch (err) {
        if (window.AdminToast) window.AdminToast.error('Logo upload failed: ' + err.message);
      }
    });

    // Input listeners to update state & live preview
    const syncInput = (id, fn) => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', (e) => {
          fn(e.target.value);
          updateLivePreview();
          markDirty();
        });
        el.addEventListener('change', (e) => {
          if (e.target.type === 'checkbox') {
            fn(e.target.checked);
            updateLivePreview();
            markDirty();
          }
        });
      }
    };

    syncInput('inpBrandTitle', (v) => { currentData.branding.brandTitle = v; });
    syncInput('inpSubtitle', (v) => { currentData.branding.subtitle = v; });
    syncInput('inpLogoUrl', (v) => { currentData.branding.logoUrl = v; });
    syncInput('inpHomeUrl', (v) => { currentData.branding.homeUrl = v; });

    syncInput('inpCtaLabel', (v) => {
      currentData.headerCta.label = v;
      const b = document.getElementById('previewCtaBadge');
      if (b) b.textContent = v || 'Join Team';
    });
    syncInput('inpCtaUrl', (v) => { currentData.headerCta.url = v; });
    syncInput('chkCtaVisible', (v) => { currentData.headerCta.visible = v; });

    syncInput('inpFooterBrandTitle', (v) => { currentData.footerBrand.brandTitle = v; });
    syncInput('inpFooterDesc', (v) => { currentData.footerBrand.description = v; });

    syncInput('inpCopyrightText', (v) => { currentData.copyright.text = v; });
    syncInput('chkAutoYear', (v) => { currentData.copyright.autoYear = v; });

    syncInput('inpCreditText', (v) => { currentData.credit.text = v; });
    syncInput('inpCreditUrl', (v) => { currentData.credit.url = v; });
    syncInput('chkCreditVisible', (v) => { currentData.credit.visible = v; });
  }

  function markDirty() {
    if (saveState !== 'dirty') {
      setSaveState('dirty');
    }
  }

  function setSaveState(state) {
    saveState = state;
    const dot = document.getElementById('navSaveStatusDot');
    const text = document.getElementById('navSaveStatusText');
    const bottomText = document.getElementById('navBottomStatus');

    if (state === 'saved') {
      if (dot) dot.style.background = '#2EA44F';
      if (text) { text.textContent = 'All changes saved'; text.style.color = 'var(--text-muted, #8E929E)'; }
      if (bottomText) bottomText.innerHTML = `<i class="fas fa-check-circle" style="color:#2EA44F;"></i> All changes are saved and synced.`;
    } else if (state === 'dirty') {
      if (dot) dot.style.background = '#F59E0B';
      if (text) { text.textContent = 'Unsaved changes'; text.style.color = '#F59E0B'; }
      if (bottomText) bottomText.innerHTML = `<i class="fas fa-exclamation-circle" style="color:#F59E0B;"></i> You have unsaved changes in this form.`;
    } else if (state === 'saving') {
      if (dot) dot.style.background = '#0EA5E9';
      if (text) { text.textContent = 'Saving draft...'; text.style.color = '#0EA5E9'; }
      if (bottomText) bottomText.innerHTML = `<i class="fas fa-spinner fa-spin" style="color:#0EA5E9;"></i> Saving changes to database...`;
    } else if (state === 'publishing') {
      if (dot) dot.style.background = '#A855F7';
      if (text) { text.textContent = 'Publishing...'; text.style.color = '#A855F7'; }
      if (bottomText) bottomText.innerHTML = `<i class="fas fa-spinner fa-spin" style="color:#A855F7;"></i> Publishing Navigation & Footer across all pages...`;
    } else if (state === 'published') {
      if (dot) dot.style.background = '#10B981';
      if (text) { text.textContent = 'Published Live'; text.style.color = '#10B981'; }
      if (bottomText) bottomText.innerHTML = `<i class="fas fa-broadcast-tower" style="color:#10B981;"></i> Published! Changes are live across all public pages.`;
    }
  }

  async function loadData() {
    try {
      console.log('[CMS NAV FOOTER] Loading settings from /admin/navigation...');
      const res = await window.AdminApi.get('/admin/navigation');
      const data = res.data || {};
      const draft = data.draftVersion || data;

      currentData = {
        branding: {
          brandTitle: draft.branding?.brandTitle || draft.brandTitle || 'Ashwa Riders',
          logoUrl: draft.branding?.logoUrl || draft.logoUrl || '',
          subtitle: draft.branding?.subtitle || draft.logo?.subtitle || 'E-FORMULA · SVPCET',
          homeUrl: draft.branding?.homeUrl || 'index.html',
        },
        navigation: Array.isArray(draft.navigation) && draft.navigation.length > 0
          ? deepClone(draft.navigation)
          : (draft.navLinks || []).filter((l) => !l.isCta).map((l, idx) => ({
              id: `nav-${idx}`,
              label: l.label,
              url: l.url,
              visible: true,
              order: l.order || idx + 1,
            })),
        headerCta: {
          label: draft.headerCta?.label || draft.ctaLabel || 'Join Team',
          url: draft.headerCta?.url || draft.ctaUrl || 'index.html#recruitment',
          visible: draft.headerCta?.visible !== false,
        },
        footerBrand: {
          brandTitle: draft.footerBrand?.brandTitle || draft.brandTitle || 'Ashwa Riders',
          description: draft.footerBrand?.description || draft.footerSummary || draft.footer?.slogan || '',
          logoUrl: draft.footerBrand?.logoUrl || '',
          logoLink: draft.footerBrand?.logoLink || 'index.html',
        },
        socialLinks: Array.isArray(draft.socialLinks) && draft.socialLinks.length > 0
          ? deepClone(draft.socialLinks)
          : [
              { id: 'soc-1', platform: 'instagram', label: 'Instagram', url: 'https://www.instagram.com/eformula_ashwariders/', icon: 'fab fa-instagram', visible: true, order: 1 },
              { id: 'soc-2', platform: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/company/e-formula-ashwa-riders', icon: 'fab fa-linkedin-in', visible: true, order: 2 },
              { id: 'soc-3', platform: 'youtube', label: 'YouTube', url: '#', icon: 'fab fa-youtube', visible: true, order: 3 },
              { id: 'soc-4', platform: 'twitter', label: 'X (Twitter)', url: '#', icon: 'fab fa-x-twitter', visible: true, order: 4 },
              { id: 'soc-5', platform: 'github', label: 'GitHub', url: '#', icon: 'fab fa-github', visible: true, order: 5 },
            ],
        linkGroups: Array.isArray(draft.linkGroups) && draft.linkGroups.length > 0
          ? deepClone(draft.linkGroups)
          : [
              {
                id: 'grp-1',
                title: 'TEAM',
                visible: true,
                order: 1,
                links: [
                  { id: 'g1-1', label: 'Members', url: 'team.html', visible: true, order: 1 },
                  { id: 'g1-2', label: 'Join Us', url: 'index.html#recruitment', visible: true, order: 2 },
                  { id: 'g1-3', label: 'Our Car', url: 'car.html', visible: true, order: 3 },
                  { id: 'g1-4', label: 'Achievements', url: 'achievements.html', visible: true, order: 4 },
                ],
              },
              {
                id: 'grp-2',
                title: 'RESOURCES',
                visible: true,
                order: 2,
                links: [
                  { id: 'g2-1', label: 'Blog', url: 'blog.html', visible: true, order: 1 },
                  { id: 'g2-2', label: 'Press Kit', url: '#', visible: true, order: 2 },
                  { id: 'g2-3', label: 'Brochure', url: '/assets/docs/ashwa-riders-sponsorship-brochure.pdf', visible: true, order: 3 },
                  { id: 'g2-4', label: 'Donate', url: '#', visible: true, order: 4 },
                ],
              },
              {
                id: 'grp-3',
                title: 'CONTACT',
                visible: true,
                order: 3,
                links: [
                  { id: 'g3-1', label: 'Get in Touch', url: 'contact.html', visible: true, order: 1 },
                  { id: 'g3-2', label: 'Sponsor Us', url: 'sponsors.html', visible: true, order: 2 },
                  { id: 'g3-3', label: 'Merchandise', url: '#', visible: true, order: 3 },
                  { id: 'g3-4', label: 'Newsletter', url: '#', visible: true, order: 4 },
                ],
              },
            ],
        copyright: {
          text: draft.copyright?.text || draft.copyrightText || '© 2026 Ashwa Riders. All rights reserved.',
          autoYear: draft.copyright?.autoYear !== false,
        },
        credit: {
          text: draft.credit?.text || draft.designedBy || 'Built by the Ashwa Riders Team',
          url: draft.credit?.url || '',
          visible: draft.credit?.visible !== false,
        },
        appearance: {
          footerEnabled: draft.appearance?.footerEnabled !== false,
          socialLinksEnabled: draft.appearance?.socialLinksEnabled !== false,
          footerCreditEnabled: draft.appearance?.footerCreditEnabled !== false,
          headerCtaEnabled: draft.appearance?.headerCtaEnabled !== false,
        },
      };

      originalData = deepClone(currentData);
      populateAllFields();
      setSaveState('saved');
    } catch (err) {
      console.error('[CMS NAV FOOTER] Failed to load data:', err);
      if (window.AdminToast) window.AdminToast.error('Failed to load navigation settings: ' + err.message);
    }
  }

  function populateAllFields() {
    if (!currentData) return;

    // 01 Branding
    document.getElementById('inpBrandTitle').value = currentData.branding.brandTitle || '';
    document.getElementById('inpSubtitle').value = currentData.branding.subtitle || '';
    document.getElementById('inpLogoUrl').value = currentData.branding.logoUrl || '';
    document.getElementById('inpHomeUrl').value = currentData.branding.homeUrl || '';

    // 03 Header CTA
    document.getElementById('inpCtaLabel').value = currentData.headerCta.label || '';
    document.getElementById('inpCtaUrl').value = currentData.headerCta.url || '';
    document.getElementById('chkCtaVisible').checked = currentData.headerCta.visible !== false;
    const badge = document.getElementById('previewCtaBadge');
    if (badge) badge.textContent = currentData.headerCta.label || 'Join Team';

    // 04 Footer Brand
    document.getElementById('inpFooterBrandTitle').value = currentData.footerBrand.brandTitle || '';
    document.getElementById('inpFooterDesc').value = currentData.footerBrand.description || '';

    // 07 Copyright
    document.getElementById('inpCopyrightText').value = currentData.copyright.text || '';
    document.getElementById('chkAutoYear').checked = currentData.copyright.autoYear !== false;

    // 08 Credit
    document.getElementById('inpCreditText').value = currentData.credit.text || '';
    document.getElementById('inpCreditUrl').value = currentData.credit.url || '';
    document.getElementById('chkCreditVisible').checked = currentData.credit.visible !== false;

    // Render lists
    renderNavigationList();
    renderSocialLinksList();
    renderLinkGroupsList();
    updateLivePreview();
  }

  // ─── 02 RENDER NAVIGATION LIST ───
  function renderNavigationList() {
    const container = document.getElementById('navItemsListContainer');
    if (!container) return;

    const items = currentData.navigation || [];
    if (items.length === 0) {
      container.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted, #8E929E); background:var(--bg-dark, #111116); border-radius:8px;">No navigation items configured. Click "+ Add Navigation Item" above.</div>`;
      return;
    }

    container.innerHTML = items
      .map((item, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;
        return `
          <div style="display:flex; align-items:center; gap:10px; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:8px 14px;">
            <span style="font-size:0.75rem; font-weight:700; color:var(--text-muted, #8E929E); width:24px;">${idx + 1}.</span>
            
            <div style="flex:1; display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <input type="text" class="cms-input" data-idx="${idx}" data-field="label" value="${item.label || ''}" placeholder="Label"
                style="background:#181820; border:1px solid #2D2D3B; border-radius:6px; padding:8px 10px; color:#fff; font-size:0.85rem; outline:none;" />
              <input type="text" class="cms-input" data-idx="${idx}" data-field="url" value="${item.url || ''}" placeholder="Target URL"
                style="background:#181820; border:1px solid #2D2D3B; border-radius:6px; padding:8px 10px; color:#fff; font-size:0.85rem; outline:none;" />
            </div>

            <div style="display:flex; align-items:center; gap:6px;">
              <button type="button" class="btn btn-secondary btn-sm nav-vis-btn" data-idx="${idx}" title="Toggle Visibility"
                style="padding:6px 10px; color:${item.visible !== false ? '#10B981' : '#8E929E'}; border-color:${item.visible !== false ? 'rgba(16,185,129,0.3)' : '#2D2D3B'};">
                <i class="fas ${item.visible !== false ? 'fa-eye' : 'fa-eye-slash'}"></i>
              </button>

              <button type="button" class="btn btn-secondary btn-sm nav-up-btn" data-idx="${idx}" ${isFirst ? 'disabled' : ''} title="Move Up" style="padding:6px 10px;">
                <i class="fas fa-arrow-up"></i>
              </button>
              <button type="button" class="btn btn-secondary btn-sm nav-down-btn" data-idx="${idx}" ${isLast ? 'disabled' : ''} title="Move Down" style="padding:6px 10px;">
                <i class="fas fa-arrow-down"></i>
              </button>
              <button type="button" class="btn btn-secondary btn-sm nav-del-btn" data-idx="${idx}" title="Remove Item" style="padding:6px 10px; color:#ff4d4d; border-color:rgba(255,77,77,0.3);">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    // Bind event handlers
    container.querySelectorAll('input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.idx);
        const field = e.target.dataset.field;
        currentData.navigation[idx][field] = e.target.value;
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.nav-vis-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const idx = Number(btn.dataset.idx);
        currentData.navigation[idx].visible = !currentData.navigation[idx].visible;
        renderNavigationList();
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.nav-up-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        if (idx > 0) {
          const temp = currentData.navigation[idx];
          currentData.navigation[idx] = currentData.navigation[idx - 1];
          currentData.navigation[idx - 1] = temp;
          currentData.navigation.forEach((item, i) => { item.order = i + 1; });
          renderNavigationList();
          updateLivePreview();
          markDirty();
        }
      });
    });

    container.querySelectorAll('.nav-down-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        if (idx < currentData.navigation.length - 1) {
          const temp = currentData.navigation[idx];
          currentData.navigation[idx] = currentData.navigation[idx + 1];
          currentData.navigation[idx + 1] = temp;
          currentData.navigation.forEach((item, i) => { item.order = i + 1; });
          renderNavigationList();
          updateLivePreview();
          markDirty();
        }
      });
    });

    container.querySelectorAll('.nav-del-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        currentData.navigation.splice(idx, 1);
        currentData.navigation.forEach((item, i) => { item.order = i + 1; });
        renderNavigationList();
        updateLivePreview();
        markDirty();
      });
    });
  }

  // ─── 05 RENDER SOCIAL LINKS LIST ───
  function renderSocialLinksList() {
    const container = document.getElementById('socialLinksListContainer');
    if (!container) return;

    const items = currentData.socialLinks || [];
    if (items.length === 0) {
      container.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted, #8E929E); background:var(--bg-dark, #111116); border-radius:8px;">No social links configured. Click "+ Add Social Link" above.</div>`;
      return;
    }

    container.innerHTML = items
      .map((item, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === items.length - 1;
        const iconClass = getPlatformIcon(item.platform);

        const platformOptions = PLATFORMS.map(
          (p) => `<option value="${p.key}" ${item.platform?.toLowerCase() === p.key ? 'selected' : ''}>${p.label}</option>`
        ).join('');

        return `
          <div style="display:flex; align-items:center; gap:10px; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:8px 14px;">
            <div style="width:32px; height:32px; background:#181820; border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--accent-orange, #F25912);">
              <i class="${iconClass}"></i>
            </div>

            <div style="flex:1; display:grid; grid-template-columns: 160px 1fr; gap:10px;">
              <select class="cms-select soc-plat-select" data-idx="${idx}"
                style="background:#181820; border:1px solid #2D2D3B; border-radius:6px; padding:8px 10px; color:#fff; font-size:0.85rem; outline:none;">
                ${platformOptions}
              </select>
              <input type="text" class="cms-input soc-url-input" data-idx="${idx}" value="${item.url || ''}" placeholder="https://..."
                style="background:#181820; border:1px solid #2D2D3B; border-radius:6px; padding:8px 10px; color:#fff; font-size:0.85rem; outline:none;" />
            </div>

            <div style="display:flex; align-items:center; gap:6px;">
              <button type="button" class="btn btn-secondary btn-sm soc-vis-btn" data-idx="${idx}" title="Toggle Visibility"
                style="padding:6px 10px; color:${item.visible !== false ? '#10B981' : '#8E929E'}; border-color:${item.visible !== false ? 'rgba(16,185,129,0.3)' : '#2D2D3B'};">
                <i class="fas ${item.visible !== false ? 'fa-eye' : 'fa-eye-slash'}"></i>
              </button>

              <button type="button" class="btn btn-secondary btn-sm soc-up-btn" data-idx="${idx}" ${isFirst ? 'disabled' : ''} title="Move Up" style="padding:6px 10px;">
                <i class="fas fa-arrow-up"></i>
              </button>
              <button type="button" class="btn btn-secondary btn-sm soc-down-btn" data-idx="${idx}" ${isLast ? 'disabled' : ''} title="Move Down" style="padding:6px 10px;">
                <i class="fas fa-arrow-down"></i>
              </button>
              <button type="button" class="btn btn-secondary btn-sm soc-del-btn" data-idx="${idx}" title="Remove Item" style="padding:6px 10px; color:#ff4d4d; border-color:rgba(255,77,77,0.3);">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        `;
      })
      .join('');

    // Bind event handlers
    container.querySelectorAll('.soc-plat-select').forEach((sel) => {
      sel.addEventListener('change', (e) => {
        const idx = Number(e.target.dataset.idx);
        const val = e.target.value;
        currentData.socialLinks[idx].platform = val;
        currentData.socialLinks[idx].icon = getPlatformIcon(val);
        const match = PLATFORMS.find((p) => p.key === val);
        if (match) currentData.socialLinks[idx].label = match.label;
        renderSocialLinksList();
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.soc-url-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const idx = Number(e.target.dataset.idx);
        currentData.socialLinks[idx].url = e.target.value;
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.soc-vis-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        currentData.socialLinks[idx].visible = !currentData.socialLinks[idx].visible;
        renderSocialLinksList();
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.soc-up-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        if (idx > 0) {
          const temp = currentData.socialLinks[idx];
          currentData.socialLinks[idx] = currentData.socialLinks[idx - 1];
          currentData.socialLinks[idx - 1] = temp;
          currentData.socialLinks.forEach((item, i) => { item.order = i + 1; });
          renderSocialLinksList();
          updateLivePreview();
          markDirty();
        }
      });
    });

    container.querySelectorAll('.soc-down-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        if (idx < currentData.socialLinks.length - 1) {
          const temp = currentData.socialLinks[idx];
          currentData.socialLinks[idx] = currentData.socialLinks[idx + 1];
          currentData.socialLinks[idx + 1] = temp;
          currentData.socialLinks.forEach((item, i) => { item.order = i + 1; });
          renderSocialLinksList();
          updateLivePreview();
          markDirty();
        }
      });
    });

    container.querySelectorAll('.soc-del-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = Number(btn.dataset.idx);
        currentData.socialLinks.splice(idx, 1);
        currentData.socialLinks.forEach((item, i) => { item.order = i + 1; });
        renderSocialLinksList();
        updateLivePreview();
        markDirty();
      });
    });
  }

  // ─── 06 RENDER FOOTER LINK GROUPS LIST ───
  function renderLinkGroupsList() {
    const container = document.getElementById('linkGroupsListContainer');
    if (!container) return;

    const groups = currentData.linkGroups || [];
    if (groups.length === 0) {
      container.innerHTML = `<div style="padding:16px; text-align:center; color:var(--text-muted, #8E929E); background:var(--bg-dark, #111116); border-radius:8px;">No footer columns configured. Click "+ Add Footer Group" above.</div>`;
      return;
    }

    container.innerHTML = groups
      .map((grp, gIdx) => {
        const isFirst = gIdx === 0;
        const isLast = gIdx === groups.length - 1;
        const links = grp.links || [];

        const linksHtml = links
          .map((lnk, lIdx) => {
            const lFirst = lIdx === 0;
            const lLast = lIdx === links.length - 1;
            return `
              <div style="display:flex; align-items:center; gap:8px; background:#111116; border:1px solid #23232f; border-radius:6px; padding:6px 10px;">
                <span style="font-size:0.7rem; color:var(--text-muted, #8E929E); width:18px;">${lIdx + 1}.</span>
                <input type="text" class="cms-input grp-lnk-label" data-gidx="${gIdx}" data-lidx="${lIdx}" value="${lnk.label || ''}" placeholder="Link Label"
                  style="flex:1; background:#181820; border:1px solid #2D2D3B; border-radius:4px; padding:6px 8px; color:#fff; font-size:0.82rem; outline:none;" />
                <input type="text" class="cms-input grp-lnk-url" data-gidx="${gIdx}" data-lidx="${lIdx}" value="${lnk.url || ''}" placeholder="URL"
                  style="flex:1; background:#181820; border:1px solid #2D2D3B; border-radius:4px; padding:6px 8px; color:#fff; font-size:0.82rem; outline:none;" />

                <button type="button" class="btn btn-secondary btn-sm grp-lnk-vis-btn" data-gidx="${gIdx}" data-lidx="${lIdx}" title="Toggle Link Visibility"
                  style="padding:4px 8px; color:${lnk.visible !== false ? '#10B981' : '#8E929E'};">
                  <i class="fas ${lnk.visible !== false ? 'fa-eye' : 'fa-eye-slash'}" style="font-size:0.75rem;"></i>
                </button>
                <button type="button" class="btn btn-secondary btn-sm grp-lnk-up-btn" data-gidx="${gIdx}" data-lidx="${lIdx}" ${lFirst ? 'disabled' : ''} style="padding:4px 8px;">
                  <i class="fas fa-arrow-up" style="font-size:0.75rem;"></i>
                </button>
                <button type="button" class="btn btn-secondary btn-sm grp-lnk-down-btn" data-gidx="${gIdx}" data-lidx="${lIdx}" ${lLast ? 'disabled' : ''} style="padding:4px 8px;">
                  <i class="fas fa-arrow-down" style="font-size:0.75rem;"></i>
                </button>
                <button type="button" class="btn btn-secondary btn-sm grp-lnk-del-btn" data-gidx="${gIdx}" data-lidx="${lIdx}" style="padding:4px 8px; color:#ff4d4d;">
                  <i class="fas fa-trash" style="font-size:0.75rem;"></i>
                </button>
              </div>
            `;
          })
          .join('');

        return `
          <div style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:10px; padding:16px;">
            <!-- Group Header Bar -->
            <div style="display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:12px; flex-wrap:wrap;">
              <div style="display:flex; align-items:center; gap:10px; flex:1;">
                <span style="font-size:0.75rem; font-weight:800; color:var(--accent-orange, #F25912); background:#181820; padding:4px 8px; border-radius:4px;">
                  COL ${gIdx + 1}
                </span>
                <input type="text" class="cms-input grp-title-input" data-gidx="${gIdx}" value="${grp.title || ''}" placeholder="Group Title (e.g. TEAM)"
                  style="width:200px; background:#181820; border:1px solid #2D2D3B; border-radius:6px; padding:7px 10px; color:#fff; font-size:0.88rem; font-weight:700; outline:none; text-transform:uppercase;" />
              </div>

              <div style="display:flex; align-items:center; gap:8px;">
                <button type="button" class="btn btn-secondary btn-sm grp-add-lnk-btn" data-gidx="${gIdx}" style="display:inline-flex; align-items:center; gap:4px; font-size:0.75rem;">
                  <i class="fas fa-plus"></i> Add Link
                </button>

                <button type="button" class="btn btn-secondary btn-sm grp-vis-btn" data-gidx="${gIdx}" title="Toggle Column Visibility"
                  style="padding:6px 10px; color:${grp.visible !== false ? '#10B981' : '#8E929E'}; border-color:${grp.visible !== false ? 'rgba(16,185,129,0.3)' : '#2D2D3B'};">
                  <i class="fas ${grp.visible !== false ? 'fa-eye' : 'fa-eye-slash'}"></i>
                </button>

                <button type="button" class="btn btn-secondary btn-sm grp-up-btn" data-gidx="${gIdx}" ${isFirst ? 'disabled' : ''} title="Move Column Left/Up" style="padding:6px 10px;">
                  <i class="fas fa-arrow-up"></i>
                </button>
                <button type="button" class="btn btn-secondary btn-sm grp-down-btn" data-gidx="${gIdx}" ${isLast ? 'disabled' : ''} title="Move Column Right/Down" style="padding:6px 10px;">
                  <i class="fas fa-arrow-down"></i>
                </button>
                <button type="button" class="btn btn-secondary btn-sm grp-del-btn" data-gidx="${gIdx}" title="Delete Entire Column" style="padding:6px 10px; color:#ff4d4d; border-color:rgba(255,77,77,0.3);">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <!-- Group Links Box -->
            <div style="display:flex; flex-direction:column; gap:8px; padding-left:12px; border-left:2px solid #23232f;">
              ${linksHtml || '<div style="font-size:0.75rem; color:#8E929E; padding:6px 0;">No links in this group. Click "+ Add Link" above.</div>'}
            </div>
          </div>
        `;
      })
      .join('');

    // Bind event handlers
    container.querySelectorAll('.grp-title-input').forEach((input) => {
      input.addEventListener('input', (e) => {
        const gIdx = Number(e.target.dataset.gidx);
        currentData.linkGroups[gIdx].title = e.target.value;
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.grp-add-lnk-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gIdx = Number(btn.dataset.gidx);
        if (!currentData.linkGroups[gIdx].links) currentData.linkGroups[gIdx].links = [];
        const newOrder = currentData.linkGroups[gIdx].links.length + 1;
        currentData.linkGroups[gIdx].links.push({
          id: `lnk-${Date.now()}-${newOrder}`,
          label: 'New Link',
          url: '#',
          visible: true,
          order: newOrder,
        });
        renderLinkGroupsList();
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.grp-vis-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gIdx = Number(btn.dataset.gidx);
        currentData.linkGroups[gIdx].visible = !currentData.linkGroups[gIdx].visible;
        renderLinkGroupsList();
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.grp-up-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gIdx = Number(btn.dataset.gidx);
        if (gIdx > 0) {
          const temp = currentData.linkGroups[gIdx];
          currentData.linkGroups[gIdx] = currentData.linkGroups[gIdx - 1];
          currentData.linkGroups[gIdx - 1] = temp;
          currentData.linkGroups.forEach((item, i) => { item.order = i + 1; });
          renderLinkGroupsList();
          updateLivePreview();
          markDirty();
        }
      });
    });

    container.querySelectorAll('.grp-down-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gIdx = Number(btn.dataset.gidx);
        if (gIdx < currentData.linkGroups.length - 1) {
          const temp = currentData.linkGroups[gIdx];
          currentData.linkGroups[gIdx] = currentData.linkGroups[gIdx + 1];
          currentData.linkGroups[gIdx + 1] = temp;
          currentData.linkGroups.forEach((item, i) => { item.order = i + 1; });
          renderLinkGroupsList();
          updateLivePreview();
          markDirty();
        }
      });
    });

    container.querySelectorAll('.grp-del-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gIdx = Number(btn.dataset.gidx);
        currentData.linkGroups.splice(gIdx, 1);
        currentData.linkGroups.forEach((item, i) => { item.order = i + 1; });
        renderLinkGroupsList();
        updateLivePreview();
        markDirty();
      });
    });

    // Sub-link actions
    container.querySelectorAll('.grp-lnk-label').forEach((input) => {
      input.addEventListener('input', (e) => {
        const gIdx = Number(e.target.dataset.gidx);
        const lIdx = Number(e.target.dataset.lidx);
        currentData.linkGroups[gIdx].links[lIdx].label = e.target.value;
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.grp-lnk-url').forEach((input) => {
      input.addEventListener('input', (e) => {
        const gIdx = Number(e.target.dataset.gidx);
        const lIdx = Number(e.target.dataset.lidx);
        currentData.linkGroups[gIdx].links[lIdx].url = e.target.value;
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.grp-lnk-vis-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gIdx = Number(btn.dataset.gidx);
        const lIdx = Number(btn.dataset.lidx);
        const lnk = currentData.linkGroups[gIdx].links[lIdx];
        lnk.visible = !lnk.visible;
        renderLinkGroupsList();
        updateLivePreview();
        markDirty();
      });
    });

    container.querySelectorAll('.grp-lnk-up-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gIdx = Number(btn.dataset.gidx);
        const lIdx = Number(btn.dataset.lidx);
        const links = currentData.linkGroups[gIdx].links;
        if (lIdx > 0) {
          const temp = links[lIdx];
          links[lIdx] = links[lIdx - 1];
          links[lIdx - 1] = temp;
          links.forEach((l, i) => { l.order = i + 1; });
          renderLinkGroupsList();
          updateLivePreview();
          markDirty();
        }
      });
    });

    container.querySelectorAll('.grp-lnk-down-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gIdx = Number(btn.dataset.gidx);
        const lIdx = Number(btn.dataset.lidx);
        const links = currentData.linkGroups[gIdx].links;
        if (lIdx < links.length - 1) {
          const temp = links[lIdx];
          links[lIdx] = links[lIdx + 1];
          links[lIdx + 1] = temp;
          links.forEach((l, i) => { l.order = i + 1; });
          renderLinkGroupsList();
          updateLivePreview();
          markDirty();
        }
      });
    });

    container.querySelectorAll('.grp-lnk-del-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const gIdx = Number(btn.dataset.gidx);
        const lIdx = Number(btn.dataset.lidx);
        currentData.linkGroups[gIdx].links.splice(lIdx, 1);
        currentData.linkGroups[gIdx].links.forEach((l, i) => { l.order = i + 1; });
        renderLinkGroupsList();
        updateLivePreview();
        markDirty();
      });
    });
  }

  // ─── 09 LIVE PREVIEW GENERATOR ───
  function updateLivePreview() {
    if (!currentData) return;

    // 1. Simulated Navbar
    const navContainer = document.getElementById('simulatedNavbar');
    if (navContainer) {
      const brand = currentData.branding.brandTitle || 'Ashwa Riders';
      const sub = currentData.branding.subtitle || 'E-FORMULA · SVPCET';
      const logo = currentData.branding.logoUrl || '';
      const ctaLabel = currentData.headerCta.label || 'Join Team';
      const showCta = currentData.headerCta.visible !== false;

      const visibleNav = (currentData.navigation || []).filter((l) => l.visible !== false);
      const linksHtml = visibleNav
        .map((l) => `<span style="font-size:0.75rem; color:#8E929E; padding:4px 8px; font-weight:500;">${l.label}</span>`)
        .join('');

      const logoImgHtml = logo
        ? `<img src="${logo}" style="height:28px; width:auto; object-fit:contain;" alt="Logo" onerror="this.style.display='none'" />`
        : `<i class="fas fa-shield-alt" style="color:var(--accent-orange); font-size:1.2rem;"></i>`;

      navContainer.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px;">
          ${logoImgHtml}
          <div>
            <div style="font-size:0.95rem; font-weight:900; color:#fff; text-transform:uppercase; letter-spacing:0.02em;">${brand}</div>
            <div style="font-size:0.6rem; color:#8E929E; letter-spacing:0.1em; text-transform:uppercase;">${sub}</div>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          ${linksHtml}
          ${showCta ? `<span style="background:var(--accent-orange, #F25912); color:#fff; font-size:0.75rem; font-weight:700; padding:6px 14px; border-radius:3px; margin-left:8px;">${ctaLabel}</span>` : ''}
        </div>
      `;
    }

    // 2. Simulated Footer
    const footerContainer = document.getElementById('simulatedFooter');
    if (footerContainer) {
      const brand = currentData.footerBrand.brandTitle || currentData.branding.brandTitle || 'Ashwa Riders';
      const desc = currentData.footerBrand.description || '';
      const copyright = currentData.copyright.text || '© 2026 Ashwa Riders. All rights reserved.';
      const credit = currentData.credit.text || 'Built by the Ashwa Riders Team';
      const showCredit = currentData.credit.visible !== false;

      const visibleSocial = (currentData.socialLinks || []).filter((s) => s.visible !== false);
      const socialIconsHtml = visibleSocial
        .map((s) => `<i class="${getPlatformIcon(s.platform)}" style="color:#8E929E; font-size:0.95rem;" title="${s.label || s.platform}"></i>`)
        .join('&nbsp;&nbsp;&nbsp;');

      const visibleGroups = (currentData.linkGroups || []).filter((g) => g.visible !== false);
      const groupsHtml = visibleGroups
        .map((g) => {
          const groupLinks = (g.links || [])
            .filter((l) => l.visible !== false)
            .map((l) => `<div style="font-size:0.75rem; color:#8E929E; margin-bottom:4px;">${l.label}</div>`)
            .join('');
          return `
            <div>
              <div style="font-size:0.8rem; font-weight:700; color:#fff; text-transform:uppercase; margin-bottom:10px; letter-spacing:0.04em;">${g.title}</div>
              ${groupLinks}
            </div>
          `;
        })
        .join('');

      footerContainer.innerHTML = `
        <div style="display:grid; grid-template-columns: 2fr ${'1fr '.repeat(Math.max(1, visibleGroups.length))}; gap:20px; border-bottom:1px solid #23232f; padding-bottom:20px; margin-bottom:16px;">
          <div>
            <div style="font-size:1.1rem; font-weight:900; color:#fff; text-transform:uppercase; margin-bottom:8px;">${brand}</div>
            <p style="font-size:0.78rem; color:#8E929E; line-height:1.5; margin:0 0 12px 0; max-width:340px;">${desc}</p>
            <div style="display:flex; align-items:center; gap:8px;">
              ${socialIconsHtml}
            </div>
          </div>
          ${groupsHtml}
        </div>

        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.72rem; color:#8E929E; flex-wrap:wrap; gap:8px;">
          <span>${copyright}</span>
          ${showCredit ? `<span>${credit}</span>` : ''}
        </div>
      `;
    }
  }

  // ─── SAVE DRAFT & PUBLISH ACTIONS ───
  function collectFormData() {
    if (!currentData) return;

    // Read directly from DOM elements
    const inpBrand = document.getElementById('inpBrandTitle');
    if (inpBrand) currentData.branding.brandTitle = inpBrand.value.trim();

    const inpSub = document.getElementById('inpSubtitle');
    if (inpSub) currentData.branding.subtitle = inpSub.value.trim();

    const inpLogo = document.getElementById('inpLogoUrl');
    if (inpLogo) currentData.branding.logoUrl = inpLogo.value.trim();

    const inpHome = document.getElementById('inpHomeUrl');
    if (inpHome) currentData.branding.homeUrl = inpHome.value.trim();

    const inpCtaL = document.getElementById('inpCtaLabel');
    if (inpCtaL) currentData.headerCta.label = inpCtaL.value.trim();

    const inpCtaU = document.getElementById('inpCtaUrl');
    if (inpCtaU) currentData.headerCta.url = inpCtaU.value.trim();

    const chkCtaV = document.getElementById('chkCtaVisible');
    if (chkCtaV) currentData.headerCta.visible = chkCtaV.checked;

    const inpFtBrand = document.getElementById('inpFooterBrandTitle');
    if (inpFtBrand) currentData.footerBrand.brandTitle = inpFtBrand.value.trim();

    const inpFtDesc = document.getElementById('inpFooterDesc');
    if (inpFtDesc) currentData.footerBrand.description = inpFtDesc.value.trim();

    const inpCopy = document.getElementById('inpCopyrightText');
    if (inpCopy) currentData.copyright.text = inpCopy.value.trim();

    const chkYear = document.getElementById('chkAutoYear');
    if (chkYear) currentData.copyright.autoYear = chkYear.checked;

    const inpCredT = document.getElementById('inpCreditText');
    if (inpCredT) currentData.credit.text = inpCredT.value.trim();

    const inpCredU = document.getElementById('inpCreditUrl');
    if (inpCredU) currentData.credit.url = inpCredU.value.trim();

    const chkCredV = document.getElementById('chkCreditVisible');
    if (chkCredV) currentData.credit.visible = chkCredV.checked;

    // Read Navigation Items inputs directly from DOM
    const navRows = document.querySelectorAll('#navItemsListContainer > div');
    navRows.forEach((row, idx) => {
      if (currentData.navigation && currentData.navigation[idx]) {
        const labelInp = row.querySelector('[data-field="label"]');
        const urlInp = row.querySelector('[data-field="url"]');
        if (labelInp) currentData.navigation[idx].label = labelInp.value.trim();
        if (urlInp) currentData.navigation[idx].url = urlInp.value.trim();
      }
    });

    // Read Social Links inputs directly from DOM
    const socRows = document.querySelectorAll('#socialLinksListContainer > div');
    socRows.forEach((row, idx) => {
      if (currentData.socialLinks && currentData.socialLinks[idx]) {
        const platSel = row.querySelector('.soc-plat-select');
        const urlInp = row.querySelector('.soc-url-input');
        if (platSel) currentData.socialLinks[idx].platform = platSel.value;
        if (urlInp) currentData.socialLinks[idx].url = urlInp.value.trim();
      }
    });

    // Read Link Groups inputs directly from DOM
    const grpCards = document.querySelectorAll('#linkGroupsListContainer > div');
    grpCards.forEach((card, gIdx) => {
      if (currentData.linkGroups && currentData.linkGroups[gIdx]) {
        const titleInp = card.querySelector('.grp-title-input');
        if (titleInp) currentData.linkGroups[gIdx].title = titleInp.value.trim();

        const lnkRows = card.querySelectorAll('.grp-lnk-label');
        lnkRows.forEach((labelInp, lIdx) => {
          if (currentData.linkGroups[gIdx].links && currentData.linkGroups[gIdx].links[lIdx]) {
            currentData.linkGroups[gIdx].links[lIdx].label = labelInp.value.trim();
            const urlInp = card.querySelectorAll('.grp-lnk-url')[lIdx];
            if (urlInp) currentData.linkGroups[gIdx].links[lIdx].url = urlInp.value.trim();
          }
        });
      }
    });
  }

  async function saveDraft() {
    setSaveState('saving');
    collectFormData();

    const payload = {
      branding: currentData.branding,
      navigation: currentData.navigation,
      headerCta: currentData.headerCta,
      footerBrand: currentData.footerBrand,
      socialLinks: currentData.socialLinks,
      linkGroups: currentData.linkGroups,
      copyright: currentData.copyright,
      credit: currentData.credit,
      appearance: currentData.appearance,

      // Flat convenience fields
      brandTitle: currentData.branding.brandTitle,
      logoUrl: currentData.branding.logoUrl,
      ctaLabel: currentData.headerCta.label,
      ctaUrl: currentData.headerCta.url,
      footerSummary: currentData.footerBrand.description,
      copyrightText: currentData.copyright.text,
      designedBy: currentData.credit.text,
    };

    try {
      console.log('[CMS NAV FOOTER] PATCH /admin/navigation saving draft...', payload);
      await window.AdminApi.patch('/admin/navigation', payload);
      originalData = deepClone(currentData);
      setSaveState('saved');
      if (window.AdminToast) window.AdminToast.success('Navigation & Footer draft saved.');
    } catch (err) {
      console.error('[CMS NAV FOOTER] Save draft failed:', err);
      setSaveState('dirty');
      if (window.AdminToast) window.AdminToast.error('Save failed: ' + err.message);
    }
  }

  async function publishSettings() {
    const publishBtns = [document.getElementById('publishNavBtn'), document.getElementById('btnBottomPublish')];
    publishBtns.forEach((b) => { if (b) b.disabled = true; });
    setSaveState('publishing');

    try {
      collectFormData();
      await saveDraft();

      console.log('[CMS NAV FOOTER] POST /admin/navigation/publish');
      await window.AdminApi.post('/admin/navigation/publish');
      setSaveState('published');
      if (window.AdminToast) window.AdminToast.success('Navigation & Footer published across all public pages.');
      await loadData();
    } catch (err) {
      console.error('[CMS NAV FOOTER] Publish failed:', err);
      setSaveState('dirty');
      if (window.AdminToast) window.AdminToast.error('Publish failed: ' + err.message);
    } finally {
      publishBtns.forEach((b) => { if (b) b.disabled = false; });
    }
  }

  window.AdminNavigationModule = { renderNavigationModule };
})();
