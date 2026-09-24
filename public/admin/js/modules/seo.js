/* ============================================================
   seo.js — Global Site SEO & Meta Settings Admin Module
   Singleton Settings Editor for /api/v1/admin/seo
   Modern dark Formula Student CMS dashboard interface
============================================================ */

(function () {
  'use strict';

  let originalSeoData = null;
  let saveState = 'saved'; // 'saved' | 'dirty' | 'saving' | 'error'

  async function renderSeoModule(container) {
    if (!container) return;

    container.innerHTML = `
      <!-- Page Header Bar -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 4px 0; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-search" style="color:var(--accent-orange, #F25912);"></i> SEO & Meta Settings
          </h2>
          <p style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin:0;">
            Configure page meta titles, meta descriptions, OpenGraph social share cards, canonical URLs, and search engine indexing directives.
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <div id="seoSaveStatusBadge" style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); border:1px solid var(--border-hairline, #2D2D3B); padding:6px 12px; border-radius:20px; font-size:0.8rem; font-weight:600;">
            <span id="seoSaveStatusDot" style="width:7px; height:7px; border-radius:50%; background:#2EA44F;"></span>
            <span id="seoSaveStatusText" style="color:var(--text-muted, #8E929E);">All changes saved</span>
          </div>

          <button type="button" class="btn btn-secondary btn-sm" id="seoHeaderSaveDraftBtn" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-save"></i> Save Draft
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="publishSeoBtn" style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912);">
            <i class="fas fa-paper-plane"></i> Publish SEO Settings
          </button>
        </div>
      </div>

      <!-- Main Form Container -->
      <form id="seoForm" style="display:flex; flex-direction:column; gap:20px; margin-bottom:80px;">

        <!-- CARD 1: GLOBAL DEFAULT SEO META -->
        <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
          <div style="display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
            <i class="fas fa-globe" style="color:var(--accent-orange, #F25912); font-size:1.1rem;"></i>
            <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Global Default SEO Meta</h3>
          </div>

          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:18px;">
              <div class="cms-field">
                <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                  Default Site Title *
                </label>
                <input 
                  type="text" 
                  class="cms-input" 
                  id="defaultTitle" 
                  name="defaultTitle" 
                  required 
                  placeholder="Ashwa Riders — Formula Student Electric Team"
                  style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
                />
              </div>

              <div class="cms-field">
                <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                  Site Canonical URL Base
                </label>
                <input 
                  type="url" 
                  class="cms-input" 
                  id="canonicalUrl" 
                  name="canonicalUrl" 
                  placeholder="https://ashwariders.com"
                  style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
                />
              </div>
            </div>

            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Default Meta Description *
              </label>
              <textarea 
                class="cms-textarea" 
                id="defaultDescription" 
                name="defaultDescription" 
                rows="3" 
                required
                placeholder="Official website of Ashwa Riders, Formula Student Electric race team representing SVPCET Nagpur."
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none; resize:vertical; min-height:80px; font-family:inherit;" 
              ></textarea>
            </div>

            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Social Share Image (OG:Image)
              </label>
              <div style="display:flex; gap:10px; align-items:center;">
                <input 
                  type="text" 
                  class="cms-input" 
                  id="defaultOgImage" 
                  name="defaultOgImage" 
                  placeholder="https://res.cloudinary.com/..." 
                  style="flex:1; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
                />
                <button type="button" class="btn btn-secondary" id="selectOgImgBtn" style="padding:10px 14px; display:inline-flex; align-items:center; gap:6px; white-space:nowrap;">
                  <i class="fas fa-photo-video"></i> Media Library
                </button>
                <label class="btn btn-secondary" style="padding:10px 14px; display:inline-flex; align-items:center; gap:6px; white-space:nowrap; cursor:pointer; margin:0;">
                  <i class="fas fa-upload"></i> Upload
                  <input type="file" id="localOgFileInput" accept="image/*" style="display:none;" />
                </label>
              </div>
            </div>

            <!-- Live Google / Social Share Search Snippet Preview -->
            <div style="margin-top:10px; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:16px;">
              <div style="font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--accent-orange, #F25912); margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                <i class="fab fa-google"></i> Live Search Engine Result Preview
              </div>
              <div style="font-family: Arial, sans-serif;">
                <div style="font-size:0.8rem; color:#BDC1C6; margin-bottom:2px;" id="previewCanonical">https://ashwariders.com</div>
                <div style="font-size:1.1rem; color:#8AB4F8; font-weight:400; text-decoration:underline; cursor:pointer; margin-bottom:4px; line-height:1.3;" id="previewTitle">
                  Ashwa Riders — Formula Student Electric Team
                </div>
                <div style="font-size:0.85rem; color:#BDC1C6; line-height:1.4;" id="previewDescription">
                  Official website of Ashwa Riders, Formula Student Electric race team representing SVPCET Nagpur.
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- CARD 2: PER-PAGE META TITLE & DESCRIPTION OVERRIDES -->
        <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; padding:22px;">
          <div style="display:flex; align-items:center; gap:10px; border-bottom:1px solid var(--border-hairline, #2D2D3B); padding-bottom:14px; margin-bottom:18px;">
            <i class="fas fa-file-code" style="color:var(--accent-orange, #F25912); font-size:1.1rem;"></i>
            <h3 style="font-size:1.05rem; font-weight:700; color:#fff; margin:0;">Per-Page Meta Title & Description Overrides</h3>
          </div>

          <div style="display:grid; grid-template-columns: 1fr 1fr; gap:18px;">
            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Home Page Title
              </label>
              <input 
                type="text" 
                class="cms-input" 
                id="homeTitle" 
                name="homeTitle" 
                placeholder="Ashwa Riders — E-Formula Student Racing" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
              />
            </div>

            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                About Page Title
              </label>
              <input 
                type="text" 
                class="cms-input" 
                id="aboutTitle" 
                name="aboutTitle" 
                placeholder="About Ashwa Riders — Our Legacy & Vision" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
              />
            </div>

            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Car Page Title
              </label>
              <input 
                type="text" 
                class="cms-input" 
                id="carTitle" 
                name="carTitle" 
                placeholder="Ashwa-3 Electric Race Car Specifications" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
              />
            </div>

            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Team Page Title
              </label>
              <input 
                type="text" 
                class="cms-input" 
                id="teamTitle" 
                name="teamTitle" 
                placeholder="Meet the Ashwa Riders Engineering Team" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
              />
            </div>

            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Achievements Page Title
              </label>
              <input 
                type="text" 
                class="cms-input" 
                id="achievementsTitle" 
                name="achievementsTitle" 
                placeholder="Achievements & Formula Bharat Milestones" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
              />
            </div>

            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Sponsors Page Title
              </label>
              <input 
                type="text" 
                class="cms-input" 
                id="sponsorsTitle" 
                name="sponsorsTitle" 
                placeholder="Corporate Sponsors & Support Ashwa Riders" 
                style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" 
              />
            </div>
          </div>
        </div>

        <!-- STICKY BOTTOM ACTION BAR -->
        <div style="position:fixed; bottom:0; right:0; left:260px; background:rgba(24, 24, 32, 0.95); backdrop-filter:blur(10px); border-top:1px solid var(--border-hairline, #2D2D3B); padding:14px 30px; display:flex; justify-content:space-between; align-items:center; z-index:100; transition:left 0.3s ease;">
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.85rem; color:var(--text-muted, #8E929E);" id="seoBottomStatus">
              <i class="fas fa-info-circle" style="color:var(--accent-orange, #F25912);"></i> Configure SEO meta titles and click Save Draft or Publish.
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:12px;">
            <button type="button" class="btn btn-secondary" id="resetSeoFormBtn" style="display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-undo"></i> Reset
            </button>
            <button type="submit" class="btn btn-secondary" id="saveDraftSeoFormBtn" style="display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-save"></i> Save Draft
            </button>
            <button type="button" class="btn btn-primary" id="publishSeoBottomBtn" style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912);">
              <i class="fas fa-paper-plane"></i> Publish SEO Settings
            </button>
          </div>
        </div>

      </form>
    `;

    bindEvents();
    await loadSeoData();
  }

  function bindEvents() {
    const publishBtn = document.getElementById('publishSeoBtn');
    if (publishBtn) publishBtn.addEventListener('click', publishSeoSettings);

    const publishBottomBtn = document.getElementById('publishSeoBottomBtn');
    if (publishBottomBtn) publishBottomBtn.addEventListener('click', publishSeoSettings);

    const headerSaveBtn = document.getElementById('seoHeaderSaveDraftBtn');
    if (headerSaveBtn) headerSaveBtn.addEventListener('click', () => saveSeoDraft());

    const resetBtn = document.getElementById('resetSeoFormBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (originalSeoData) {
          populateForm(originalSeoData);
          setSaveState('saved');
          if (window.AdminToast) window.AdminToast.info('Form reset to last saved state.');
        }
      });
    }

    const ogBtn = document.getElementById('selectOgImgBtn');
    if (ogBtn) {
      ogBtn.addEventListener('click', () => {
        if (window.MediaPicker) {
          window.MediaPicker.open({
            allowedType: 'image',
            onSelect: (asset) => {
              const input = document.getElementById('defaultOgImage');
              if (input) {
                input.value = asset.secureUrl || asset.url;
                markDirty();
              }
            },
          });
        }
      });
    }

    const localFile = document.getElementById('localOgFileInput');
    if (localFile) {
      localFile.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          if (window.AdminToast) window.AdminToast.info('Uploading social share image...');
          let imageUrl = '';

          if (window.AdminUploader && window.AdminUploader.uploadFile) {
            const res = await window.AdminUploader.uploadFile(file, {
              folder: 'ashwa_seo',
              allowedType: 'image',
            });
            imageUrl = res.url || res.secureUrl;
          } else {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'ashwa_seo');
            const res = await window.AdminApi.post('/admin/media/upload', formData);
            imageUrl = res.data?.secureUrl || res.data?.url || res.url;
          }

          if (imageUrl) {
            const ogInput = document.getElementById('defaultOgImage');
            if (ogInput) ogInput.value = imageUrl;
            markDirty();
            if (window.AdminToast) window.AdminToast.success('Image uploaded and verified successfully.');
          } else {
            throw new Error('No valid URL returned.');
          }
        } catch (err) {
          if (window.AdminToast) window.AdminToast.error('Image upload failed: ' + err.message);
        }
      });
    }

    // Live search preview sync listeners
    const titleInput = document.getElementById('defaultTitle');
    if (titleInput) {
      titleInput.addEventListener('input', (e) => {
        const previewTitle = document.getElementById('previewTitle');
        if (previewTitle) previewTitle.textContent = e.target.value || 'Ashwa Riders — Formula Student Electric Team';
        markDirty();
      });
    }

    const descInput = document.getElementById('defaultDescription');
    if (descInput) {
      descInput.addEventListener('input', (e) => {
        const previewDesc = document.getElementById('previewDescription');
        if (previewDesc) previewDesc.textContent = e.target.value || 'Official website of Ashwa Riders, Formula Student Electric race team representing SVPCET Nagpur.';
        markDirty();
      });
    }

    const canonicalInput = document.getElementById('canonicalUrl');
    if (canonicalInput) {
      canonicalInput.addEventListener('input', (e) => {
        const previewUrl = document.getElementById('previewCanonical');
        if (previewUrl) previewUrl.textContent = e.target.value || 'https://ashwariders.com';
        markDirty();
      });
    }

    const form = document.getElementById('seoForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveSeoDraft();
      });

      form.querySelectorAll('input, textarea').forEach((input) => {
        input.addEventListener('input', markDirty);
      });
    }
  }

  function markDirty() {
    if (saveState !== 'dirty') {
      setSaveState('dirty');
    }
  }

  function setSaveState(state) {
    saveState = state;
    const dot = document.getElementById('seoSaveStatusDot');
    const text = document.getElementById('seoSaveStatusText');
    const bottomText = document.getElementById('seoBottomStatus');

    if (state === 'saved') {
      if (dot) dot.style.background = '#2EA44F';
      if (text) {
        text.textContent = 'All changes saved';
        text.style.color = 'var(--text-muted, #8E929E)';
      }
      if (bottomText) {
        bottomText.innerHTML = `<i class="fas fa-check-circle" style="color:#2EA44F;"></i> All SEO settings are saved and active.`;
      }
    } else if (state === 'dirty') {
      if (dot) dot.style.background = '#F59E0B';
      if (text) {
        text.textContent = 'Unsaved changes';
        text.style.color = '#F59E0B';
      }
      if (bottomText) {
        bottomText.innerHTML = `<i class="fas fa-exclamation-circle" style="color:#F59E0B;"></i> You have unsaved changes in SEO settings.`;
      }
    } else if (state === 'saving') {
      if (dot) dot.style.background = '#0EA5E9';
      if (text) {
        text.textContent = 'Saving draft...';
        text.style.color = '#0EA5E9';
      }
      if (bottomText) {
        bottomText.innerHTML = `<i class="fas fa-spinner fa-spin" style="color:#0EA5E9;"></i> Saving SEO draft to database...`;
      }
    }
  }

  function populateForm(data) {
    if (!data) return;
    document.getElementById('defaultTitle').value = data.defaultTitle || 'Ashwa Riders — Formula Student Electric Team';
    document.getElementById('defaultDescription').value = data.defaultDescription || 'Official website of Ashwa Riders, Formula Student Electric race team representing SVPCET Nagpur.';
    document.getElementById('canonicalUrl').value = data.canonicalUrl || 'http://localhost:5000';
    document.getElementById('defaultOgImage').value = data.defaultOgImage || '/logo.png';
    document.getElementById('homeTitle').value = data.homeTitle || 'Ashwa Riders — Home';
    document.getElementById('aboutTitle').value = data.aboutTitle || 'Ashwa Riders — About Us';
    document.getElementById('carTitle').value = data.carTitle || 'Ashwa Riders — Race Car Specs';
    document.getElementById('teamTitle').value = data.teamTitle || 'Ashwa Riders — Team';
    document.getElementById('achievementsTitle').value = data.achievementsTitle || 'Ashwa Riders — Achievements';
    document.getElementById('sponsorsTitle').value = data.sponsorsTitle || 'Ashwa Riders — Corporate Sponsors';

    // Sync Live Snippet Preview
    const pTitle = document.getElementById('previewTitle');
    if (pTitle) pTitle.textContent = data.defaultTitle || 'Ashwa Riders — Formula Student Electric Team';

    const pDesc = document.getElementById('previewDescription');
    if (pDesc) pDesc.textContent = data.defaultDescription || 'Official website of Ashwa Riders, Formula Student Electric race team representing SVPCET Nagpur.';

    const pUrl = document.getElementById('previewCanonical');
    if (pUrl) pUrl.textContent = data.canonicalUrl || 'http://localhost:5000';
  }

  async function loadSeoData() {
    try {
      const res = await window.AdminApi.get('/admin/seo');
      seoSettings = res.data || {};
      const draft = seoSettings.draftVersion || seoSettings;
      originalSeoData = { ...draft };

      populateForm(draft);
      setSaveState('saved');
    } catch (err) {
      console.error('Failed to load SEO settings:', err);
      if (window.AdminToast) window.AdminToast.error('Failed to load SEO settings: ' + err.message);
    }
  }

  async function saveSeoDraft() {
    setSaveState('saving');

    const payload = {
      defaultTitle: document.getElementById('defaultTitle').value.trim(),
      defaultDescription: document.getElementById('defaultDescription').value.trim(),
      canonicalUrl: document.getElementById('canonicalUrl').value.trim(),
      defaultOgImage: document.getElementById('defaultOgImage').value.trim(),
      homeTitle: document.getElementById('homeTitle').value.trim(),
      aboutTitle: document.getElementById('aboutTitle').value.trim(),
      carTitle: document.getElementById('carTitle').value.trim(),
      teamTitle: document.getElementById('teamTitle').value.trim(),
      achievementsTitle: document.getElementById('achievementsTitle').value.trim(),
      sponsorsTitle: document.getElementById('sponsorsTitle').value.trim(),
    };

    try {
      await window.AdminApi.patch('/admin/seo', payload);
      originalSeoData = { ...payload };
      setSaveState('saved');
      if (window.AdminToast) window.AdminToast.success('SEO & Meta draft saved.');
    } catch (err) {
      setSaveState('dirty');
      if (window.AdminToast) window.AdminToast.error('Save failed: ' + err.message);
    }
  }

  async function publishSeoSettings() {
    try {
      if (saveState === 'dirty') {
        await saveSeoDraft();
      }
      await window.AdminApi.post('/admin/seo/publish');
      if (window.AdminToast) window.AdminToast.success('SEO & Meta settings published live.');
      await loadSeoData();
    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Publish failed: ' + err.message);
    }
  }

  window.AdminSeoModule = { renderSeoModule };
})();

