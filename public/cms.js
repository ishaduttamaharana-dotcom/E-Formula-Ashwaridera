/* ============================================================
   cms.js — Reusable Inline Content Management System (CMS) Framework
   Injected across website pages.

   Role-Based Behavior:
     • Visitor / Normal User: Read-only live site. All editing controls hidden.
     • Logged-in Admin (role === "admin"): Inline editing controls, Add, Delete,
       Cloudinary Upload, Save, and Cancel buttons become visible.

   Reusable Components & Functions:
     • renderEditButton()
     • renderDeleteButton()
     • renderAddButton()
     • renderUploadButton()
     • renderSaveButton()
     • renderCancelButton()
     • showConfirmationDialog()
     • showLoadingSpinner()
     • showSuccessNotification()
     • showErrorNotification()

   API Endpoints:
     • GET    /api/v1/cms/content
     • POST   /api/v1/cms/content
     • PUT    /api/v1/cms/content/:id
     • DELETE /api/v1/cms/content/:id
     • POST   /api/v1/cms/upload
============================================================ */

(function () {
  'use strict';

  // ─── API Endpoints ─────────────────────────────────────────
  const CMS_PUBLIC_API = '/api/v1/cms/content';
  const CMS_ADMIN_API  = '/api/v1/cms/content';
  const CMS_UPLOAD_API = '/api/v1/cms/upload';
  const STORAGE_KEY    = 'ar_user';

  // ─── User Role State ───────────────────────────────────────
  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const isAdmin = () => {
    const user = getStoredUser();
    return user && user.role === 'admin';
  };

  // ============================================================
  //  REUSABLE NOTIFICATION COMPONENTS
  // ============================================================
  const showSuccessNotification = (message) => {
    showToast(message, 'success');
  };

  const showErrorNotification = (message) => {
    showToast(message, 'error');
  };

  const showToast = (message, type = 'success') => {
    const existing = document.querySelector('.ar-cms-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `ar-cms-toast ar-cms-toast--${type}`;
    toast.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('ar-cms-toast--visible'));
    setTimeout(() => {
      toast.classList.remove('ar-cms-toast--visible');
      setTimeout(() => toast.remove(), 3500);
    }, 3500);
  };

  // ============================================================
  //  REUSABLE LOADING SPINNER
  // ============================================================
  const showLoadingSpinner = (btn, isLoading, text = '') => {
    if (!btn) return;
    if (isLoading) {
      btn.dataset.originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${text || 'Processing...'}`;
    } else {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalHtml || text;
    }
  };

  // ============================================================
  //  REUSABLE BUTTON COMPONENT RENDERERS
  // ============================================================
  const renderEditButton = (id, label = 'Edit') => `
    <button class="ar-cms-btn ar-cms-btn--edit" data-id="${id}">
      <i class="fas fa-edit"></i> <span>${label}</span>
    </button>
  `;

  const renderDeleteButton = (id, label = 'Delete') => `
    <button class="ar-cms-btn ar-cms-btn--delete" data-id="${id}">
      <i class="fas fa-trash-alt"></i> <span>${label}</span>
    </button>
  `;

  const renderAddButton = (label = 'Add Content') => `
    <button class="ar-cms-btn ar-cms-btn--add" id="arCmsAddBtn">
      <i class="fas fa-plus"></i> <span>${label}</span>
    </button>
  `;

  const renderUploadButton = (label = 'Upload Image') => `
    <label class="ar-cms-btn ar-cms-btn--upload">
      <i class="fas fa-upload"></i> <span>${label}</span>
      <input type="file" style="display:none" accept="image/*" class="ar-cms-file-input" />
    </label>
  `;

  const renderSaveButton = (label = 'Save') => `
    <button class="ar-cms-btn ar-cms-btn--save" type="button">
      <i class="fas fa-save"></i> <span>${label}</span>
    </button>
  `;

  const renderCancelButton = (label = 'Cancel') => `
    <button class="ar-cms-btn ar-cms-btn--cancel" type="button">
      <i class="fas fa-times"></i> <span>${label}</span>
    </button>
  `;

  // ============================================================
  //  REUSABLE CONFIRMATION DIALOG COMPONENT
  // ============================================================
  const showConfirmationDialog = ({ title, message, onConfirm }) => {
    const existing = document.getElementById('arCmsConfirmDialog');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'ar-cms-modal-overlay ar-open';
    overlay.id = 'arCmsConfirmDialog';
    overlay.innerHTML = `
      <div class="ar-cms-modal" style="max-width:420px;">
        <div class="ar-cms-confirm-box">
          <i class="fas fa-exclamation-triangle"></i>
          <h4>${title || 'Are you sure?'}</h4>
          <p>${message || 'Are you sure you want to delete this?'}</p>
          <div class="ar-cms-confirm-actions">
            ${renderCancelButton('Cancel')}
            ${renderDeleteButton('', 'Delete')}
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('.ar-cms-btn--cancel').addEventListener('click', close);
    overlay.querySelector('.ar-cms-btn--delete').addEventListener('click', async () => {
      close();
      if (onConfirm) await onConfirm();
    });
  };

  // ============================================================
  //  API CALL WRAPPER
  // ============================================================
  const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    return res.json();
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(CMS_UPLOAD_API, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return res.json();
  };

  // ============================================================
  //  INJECT CMS STYLES
  // ============================================================
  const injectCmsStyles = () => {
    if (document.getElementById('ar-cms-styles')) return;
    const style = document.createElement('style');
    style.id = 'ar-cms-styles';
    style.textContent = `
      /* Admin Badge Banner */
      .ar-cms-bar {
        position: fixed; top: 78px; right: 24px; z-index: 9990;
        background: #000000; border: 1px solid #F25912;
        padding: 8px 16px; display: flex; align-items: center; gap: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.6);
        font-family: 'JetBrains Mono', monospace; font-size: 0.72rem;
        color: #fff; text-transform: uppercase; letter-spacing: 0.06em;
      }
      .ar-cms-bar-badge {
        background: #F25912; color: #fff; font-weight: 700;
        padding: 2px 6px; font-size: 0.65rem; border-radius: 2px;
      }

      /* Controls Wrap */
      .ar-cms-controls {
        display: inline-flex; align-items: center; gap: 6px;
        margin: 8px 0; z-index: 100;
      }

      /* Reusable Button Styling */
      .ar-cms-btn {
        padding: 6px 12px; font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
        letter-spacing: 0.06em; border: 1px solid transparent; cursor: pointer;
        display: inline-flex; align-items: center; gap: 6px;
        transition: all 0.25s ease; border-radius: 2px; text-decoration: none;
      }
      .ar-cms-btn--edit { background: rgba(2,147,134,0.15); border-color: #029386; color: #029386; }
      .ar-cms-btn--edit:hover { background: #029386; color: #10141c; }

      .ar-cms-btn--delete { background: rgba(255,77,77,0.15); border-color: #ff4d4d; color: #ff4d4d; }
      .ar-cms-btn--delete:hover { background: #ff4d4d; color: #fff; }

      .ar-cms-btn--add { background: #029386; color: #10141c; font-weight: 700; }
      .ar-cms-btn--add:hover { background: #06c2ac; }

      .ar-cms-btn--upload { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.25); color: #fff; }
      .ar-cms-btn--upload:hover { border-color: #029386; color: #029386; }

      .ar-cms-btn--save { background: #2ea44f; color: #fff; border-color: #2ea44f; }
      .ar-cms-btn--save:hover { background: #2c974b; }

      .ar-cms-btn--cancel { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.2); color: rgba(255,255,255,0.8); }
      .ar-cms-btn--cancel:hover { background: rgba(255,255,255,0.2); color: #fff; }

      /* Inline Editable Box */
      .ar-cms-inline-input {
        width: 100%; padding: 8px 10px; background: rgba(2,147,134,0.08);
        border: 2px dashed #029386; color: #fff; font-family: inherit; font-size: inherit;
        outline: none; margin: 4px 0;
      }
      .ar-cms-inline-textarea {
        width: 100%; min-height: 80px; padding: 8px 10px; background: rgba(2,147,134,0.08);
        border: 2px dashed #029386; color: #fff; font-family: inherit; font-size: inherit;
        outline: none; margin: 4px 0; resize: vertical;
      }

      /* Modal Styling */
      .ar-cms-modal-overlay {
        position: fixed; inset: 0; z-index: 99999;
        display: flex; align-items: center; justify-content: center;
        background: rgba(10,10,10,0.88); backdrop-filter: blur(8px);
        opacity: 0; visibility: hidden; transition: all 0.3s ease;
      }
      .ar-cms-modal-overlay.ar-open { opacity: 1; visibility: visible; }

      .ar-cms-modal {
        background: #111; border: 1px solid rgba(255,255,255,0.15);
        width: 100%; max-width: 520px; padding: 32px; position: relative;
        box-shadow: 0 30px 80px rgba(0,0,0,0.8); color: #fff;
      }

      .ar-cms-modal-header {
        display: flex; align-items: center; justify-content: space-between;
        border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 16px; margin-bottom: 24px;
      }
      .ar-cms-modal-header h3 {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 1.2rem;
        text-transform: uppercase; color: #fff; margin: 0;
      }

      .ar-cms-modal-close {
        background: none; border: 1px solid rgba(255,255,255,0.2);
        color: rgba(255,255,255,0.6); width: 30px; height: 30px; cursor: pointer;
        display: flex; align-items: center; justify-content: center; transition: all 0.2s ease;
      }
      .ar-cms-modal-close:hover { border-color: #029386; color: #029386; }

      .ar-cms-form-group { margin-bottom: 18px; }
      .ar-cms-form-group label {
        display: block; font-family: 'JetBrains Mono', monospace; font-size: 0.68rem;
        color: rgba(255,255,255,0.5); text-transform: uppercase; margin-bottom: 6px;
      }
      .ar-cms-form-group input[type="text"],
      .ar-cms-form-group textarea {
        width: 100%; padding: 10px 12px; background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.15); color: #fff;
        font-family: 'Inter', sans-serif; font-size: 0.88rem; outline: none;
      }

      .ar-cms-confirm-box { text-align: center; padding: 10px 0; }
      .ar-cms-confirm-box i { font-size: 2.8rem; color: #ff4d4d; margin-bottom: 16px; }
      .ar-cms-confirm-box h4 { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; font-size: 1.2rem; text-transform: uppercase; margin-bottom: 8px; }
      .ar-cms-confirm-box p { color: rgba(255,255,255,0.6); font-size: 0.88rem; margin-bottom: 24px; }
      .ar-cms-confirm-actions { display: flex; justify-content: center; gap: 12px; }

      /* Toast Notification */
      .ar-cms-toast {
        position: fixed; bottom: 28px; right: 28px; z-index: 99999;
        display: flex; align-items: center; gap: 10px; padding: 14px 20px;
        background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
        color: #fff; font-family: 'Inter', sans-serif; font-size: 0.88rem;
        box-shadow: 0 12px 40px rgba(0,0,0,0.5); transform: translateY(16px); opacity: 0;
        transition: all 0.4s cubic-bezier(0.16,1,0.3,1); max-width: 360px;
      }
      .ar-cms-toast--visible { transform: translateY(0); opacity: 1; }
      .ar-cms-toast--success i { color: #4ade80; }
      .ar-cms-toast--error i { color: #ff6b6b; }
    `;
    document.head.appendChild(style);
  };

  // ============================================================
  //  ADD CONTENT MODAL
  // ============================================================
  const showAddContentModal = ({ section, onSave }) => {
    const existing = document.getElementById('arCmsAddModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'ar-cms-modal-overlay ar-open';
    overlay.id = 'arCmsAddModal';

    overlay.innerHTML = `
      <div class="ar-cms-modal">
        <div class="ar-cms-modal-header">
          <h3>Add New Content</h3>
          <button class="ar-cms-modal-close" id="arAddModalClose"><i class="fas fa-times"></i></button>
        </div>
        <form id="arAddForm">
          <div class="ar-cms-form-group">
            <label>Title</label>
            <input type="text" name="title" placeholder="Enter title" required />
          </div>
          <div class="ar-cms-form-group">
            <label>Description</label>
            <textarea name="description" rows="3" placeholder="Enter description"></textarea>
          </div>
          <div class="ar-cms-form-group">
            <label>Image Upload (Cloudinary)</label>
            ${renderUploadButton('Choose Image File')}
            <span class="ar-cms-file-name" style="display:block;margin-top:6px;font-size:0.75rem;color:#ff751f;"></span>
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>Button Text</label>
              <input type="text" name="buttonText" placeholder="e.g. Learn More" />
            </div>
            <div>
              <label>Button Link</label>
              <input type="text" name="buttonLink" placeholder="e.g. #learn" />
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:24px;">
            ${renderCancelButton('Cancel')}
            ${renderSaveButton('Save Record')}
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#arAddModalClose').addEventListener('click', close);
    overlay.querySelector('.ar-cms-btn--cancel').addEventListener('click', close);

    const fileInput = overlay.querySelector('.ar-cms-file-input');
    const fileNameSpan = overlay.querySelector('.ar-cms-file-name');
    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files[0]) {
        fileNameSpan.textContent = `Selected: ${fileInput.files[0].name}`;
      }
    });

    const form = overlay.querySelector('#arAddForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = overlay.querySelector('.ar-cms-btn--save');
      showLoadingSpinner(saveBtn, true, 'Saving...');

      try {
        let imageData = { imageUrl: '', publicId: '' };

        if (fileInput.files && fileInput.files[0]) {
          const uploadRes = await uploadImageToCloudinary(fileInput.files[0]);
          if (uploadRes.success) {
            imageData = { imageUrl: uploadRes.imageUrl, publicId: uploadRes.publicId };
          } else {
            showErrorNotification(uploadRes.message || 'Image upload failed');
            showLoadingSpinner(saveBtn, false);
            return;
          }
        }

        const formData = {
          section: section || 'general',
          title: form.querySelector('[name="title"]').value,
          description: form.querySelector('[name="description"]').value,
          imageUrl: imageData.imageUrl,
          publicId: imageData.publicId,
          buttonText: form.querySelector('[name="buttonText"]').value,
          buttonLink: form.querySelector('[name="buttonLink"]').value,
        };

        close();
        if (onSave) await onSave(formData);
      } catch (err) {
        showErrorNotification('Failed to save: ' + err.message);
        showLoadingSpinner(saveBtn, false);
      }
    });
  };

  // ============================================================
  //  INLINE EDITING ENGINE
  // ============================================================
  const setupInlineEdit = (cardElement, item, onSaveSuccess, onDeleteSuccess) => {
    if (!isAdmin()) return;

    // Append Admin controls container to card
    let controls = cardElement.querySelector('.ar-cms-controls');
    if (!controls) {
      controls = document.createElement('div');
      controls.className = 'ar-cms-controls';
      controls.innerHTML = `
        ${renderEditButton(item._id)}
        ${renderDeleteButton(item._id)}
      `;
      cardElement.appendChild(controls);
    }

    const editBtn = controls.querySelector('.ar-cms-btn--edit');
    const deleteBtn = controls.querySelector('.ar-cms-btn--delete');

    // ─── Inline Edit Handler ───
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        if (cardElement.classList.contains('ar-editing')) return;
        cardElement.classList.add('ar-editing');

        const titleEl = cardElement.querySelector('.ar-cms-field-title, h4, h3, .title');
        const descEl = cardElement.querySelector('.ar-cms-field-desc, p, .description');

        const origTitle = titleEl ? titleEl.textContent : item.title;
        const origDesc = descEl ? descEl.textContent : item.description;

        // Turn fields into inline inputs/textareas
        let titleInput, descInput;

        if (titleEl) {
          titleInput = document.createElement('input');
          titleInput.type = 'text';
          titleInput.className = 'ar-cms-inline-input';
          titleInput.value = origTitle;
          titleEl.style.display = 'none';
          titleEl.parentNode.insertBefore(titleInput, titleEl);
        }

        if (descEl) {
          descInput = document.createElement('textarea');
          descInput.className = 'ar-cms-inline-textarea';
          descInput.value = origDesc;
          descEl.style.display = 'none';
          descEl.parentNode.insertBefore(descInput, descEl);
        }

        // Hide Edit & Delete buttons, show Save & Cancel inline
        controls.style.display = 'none';

        const inlineActionWrap = document.createElement('div');
        inlineActionWrap.className = 'ar-cms-controls ar-cms-inline-actions';
        inlineActionWrap.innerHTML = `
          ${renderSaveButton('Save')}
          ${renderCancelButton('Cancel')}
        `;
        cardElement.appendChild(inlineActionWrap);

        const saveBtn = inlineActionWrap.querySelector('.ar-cms-btn--save');
        const cancelBtn = inlineActionWrap.querySelector('.ar-cms-btn--cancel');

        // Cancel Handler
        cancelBtn.addEventListener('click', () => {
          if (titleInput) { titleInput.remove(); titleEl.style.display = ''; }
          if (descInput) { descInput.remove(); descEl.style.display = ''; }
          inlineActionWrap.remove();
          controls.style.display = 'inline-flex';
          cardElement.classList.remove('ar-editing');
        });

        // Save Handler
        saveBtn.addEventListener('click', async () => {
          showLoadingSpinner(saveBtn, true, 'Saving...');

          const updatedTitle = titleInput ? titleInput.value.trim() : origTitle;
          const updatedDesc = descInput ? descInput.value.trim() : origDesc;

          try {
            const res = await apiFetch(`${CMS_ADMIN_API}/${item._id}`, {
              method: 'PUT',
              body: JSON.stringify({
                title: updatedTitle,
                description: updatedDesc,
              }),
            });

            if (res.success) {
              // Update DOM immediately without page reload
              if (titleEl) { titleEl.textContent = updatedTitle; titleEl.style.display = ''; if (titleInput) titleInput.remove(); }
              if (descEl) { descEl.textContent = updatedDesc; descEl.style.display = ''; if (descInput) descInput.remove(); }
              inlineActionWrap.remove();
              controls.style.display = 'inline-flex';
              cardElement.classList.remove('ar-editing');
              showSuccessNotification('Content updated successfully!');
              if (onSaveSuccess) await onSaveSuccess(res.data);
            } else {
              showErrorNotification(res.message || 'Forbidden / Save failed');
              showLoadingSpinner(saveBtn, false);
            }
          } catch (err) {
            showErrorNotification('Save failed: ' + err.message);
            showLoadingSpinner(saveBtn, false);
          }
        });
      });
    }

    // ─── Delete Handler ───
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        showConfirmationDialog({
          title: 'Delete Content',
          message: 'Are you sure you want to delete this content record?',
          onConfirm: async () => {
            try {
              const res = await apiFetch(`${CMS_ADMIN_API}/${item._id}`, {
                method: 'DELETE',
              });

              if (res.success) {
                cardElement.remove(); // Remove element instantly from DOM
                showSuccessNotification('Content deleted successfully!');
                if (onDeleteSuccess) await onDeleteSuccess(item._id);
              } else {
                showErrorNotification(res.message || 'Forbidden / Delete failed');
              }
            } catch (err) {
              showErrorNotification('Delete failed: ' + err.message);
            }
          },
        });
      });
    }
  };

  // ============================================================
  //  HYDRATION & CMS ENGINE INTEGRATION
  // ============================================================
  const hydrateCmsSection = async () => {
    try {
      const res = await apiFetch(`${CMS_PUBLIC_API}/garage-to-grid`);
      if (res.success && res.data && res.data.length > 0) {
        renderSectionData(res.data);
      } else if (isAdmin()) {
        renderSectionData([]);
      }
    } catch (err) {
      console.warn('CMS section fetch notice:', err.message);
    }
  };

  const renderSectionData = (items) => {
    let container = document.querySelector('#timelineBuildSection .timeline-rail-wrap') || document.querySelector('.timeline-rail-wrap');
    if (!container) return;

    const adminActive = isAdmin();

    // Render Admin Add Button if Admin
    let addBtnWrap = container.querySelector('.ar-cms-add-wrap');
    if (adminActive && !addBtnWrap) {
      addBtnWrap = document.createElement('div');
      addBtnWrap.className = 'ar-cms-add-wrap';
      addBtnWrap.style.textAlign = 'center';
      addBtnWrap.style.marginBottom = '24px';
      addBtnWrap.innerHTML = renderAddButton('Add Timeline Card');
      container.insertBefore(addBtnWrap, container.firstChild);

      addBtnWrap.querySelector('#arCmsAddBtn').addEventListener('click', () => {
        showAddContentModal({
          section: 'garage-to-grid',
          onSave: async (formData) => {
            const res = await apiFetch(CMS_ADMIN_API, {
              method: 'POST',
              body: JSON.stringify(formData),
            });

            if (res.success) {
              showSuccessNotification('Content card added successfully!');
              await hydrateCmsSection();
            } else {
              showErrorNotification(res.message || 'Forbidden / Add failed');
            }
          },
        });
      });
    } else if (!adminActive && addBtnWrap) {
      addBtnWrap.remove();
    }

    let stagesWrap = container.querySelector('#arCmsStagesContainer');
    if (!stagesWrap) {
      stagesWrap = document.createElement('div');
      stagesWrap.id = 'arCmsStagesContainer';
      container.appendChild(stagesWrap);
    }

    stagesWrap.innerHTML = '';

    items.forEach((item, idx) => {
      const stageDiv = document.createElement('div');
      stageDiv.className = 'timeline-stage in-view';
      stageDiv.dataset.cmsId = item._id;

      const imgHtml = (item.imageUrl || (item.image && item.image.url))
        ? `<img src="${item.imageUrl || item.image.url}" alt="${item.title}" style="max-width:100%;margin-top:10px;border:1px solid var(--line-dark);" />`
        : '';

      stageDiv.innerHTML = `
        <div class="timeline-stage-marker">
          <i class="fas fa-wrench"></i>
          <span class="marker-num">${String(idx + 1).padStart(2, '0')}</span>
        </div>
        <div class="timeline-stage-card">
          <div class="timeline-stage-card-inner">
            <h4 class="ar-cms-field-title">${item.title}</h4>
            <p class="ar-cms-field-desc">${item.description}</p>
            ${imgHtml}
          </div>
        </div>
      `;

      stagesWrap.appendChild(stageDiv);

      if (adminActive) {
        setupInlineEdit(stageDiv.querySelector('.timeline-stage-card-inner'), item, hydrateCmsSection, hydrateCmsSection);
      }
    });
  };

  // ============================================================
  //  ADMIN TOOLBAR (Retired in Phase 8 in favor of /admin SPA)
  // ============================================================
  const renderAdminToolbar = () => {
    const existing = document.getElementById('arCmsAdminBar');
    if (existing) existing.remove();
  };

  // ─── SHARED NAVIGATION & FOOTER HYDRATOR ───────────────────
  const getSocialIconClass = (platform, customIcon) => {
    if (customIcon && customIcon.trim()) return customIcon.trim();
    const p = (platform || '').toLowerCase();
    if (p.includes('instagram')) return 'fab fa-instagram';
    if (p.includes('linkedin')) return 'fab fa-linkedin-in';
    if (p.includes('youtube')) return 'fab fa-youtube';
    if (p.includes('twitter') || p === 'x') return 'fab fa-x-twitter';
    if (p.includes('github')) return 'fab fa-github';
    if (p.includes('facebook')) return 'fab fa-facebook-f';
    if (p.includes('discord')) return 'fab fa-discord';
    return 'fas fa-globe';
  };

  const hydrateNavigationAndFooter = async () => {
    try {
      console.log('[CMS NAV FOOTER] Fetching published navigation and footer settings...');
      let res;
      try {
        res = await fetch('/api/v1/content/navigation', { cache: 'no-store' });
      } catch (e) {
        res = await fetch('/api/v1/navigation', { cache: 'no-store' });
      }

      if (!res || !res.ok) {
        console.warn(`[CMS NAV FOOTER] Endpoint responded with status ${res ? res.status : 'ERR'}`);
        return;
      }

      const data = await res.json();
      if (!data || !data.success || !data.data) {
        console.warn('[CMS NAV FOOTER] No valid published navigation data received.');
        return;
      }

      const nav = data.data;

      // Extract unified schema fields with fallbacks
      const branding = nav.branding || {
        brandTitle: nav.brandTitle || nav.logo?.brandText || 'Ashwa Riders',
        logoUrl: nav.logoAsset || nav.logoUrl || nav.logo?.markImageUrl || '',
        subtitle: nav.logo?.subtitle || 'E-FORMULA · SVPCET',
        homeUrl: 'index.html',
      };

      const navItems = Array.isArray(nav.navigation) && nav.navigation.length > 0
        ? nav.navigation
        : (nav.navLinks || []).filter((l) => !l.isCta).map((l, i) => ({
            id: `nav-${i}`,
            label: l.label,
            url: l.url,
            visible: true,
            order: l.order || i + 1,
          }));

      const headerCta = nav.headerCta || {
        label: nav.navbarCta?.label || nav.ctaLabel || 'Join Team',
        url: nav.navbarCta?.targetUrl || nav.ctaUrl || 'index.html#recruitment',
        visible: nav.navbarCta?.visible !== false,
      };

      const footerBrand = nav.footerBrand || {
        brandTitle: branding.brandTitle,
        description: nav.footer?.tagline || nav.footer?.slogan || nav.footerSummary || '',
        logoUrl: '',
        logoLink: branding.homeUrl || 'index.html',
      };

      const socialLinks = Array.isArray(nav.socialLinks) && nav.socialLinks.length > 0
        ? nav.socialLinks
        : Object.entries(nav.footer?.socialLinks || {}).map(([platform, url], i) => ({
            id: `soc-${i}`,
            platform,
            label: platform,
            url,
            visible: url && url !== '#',
            order: i + 1,
          }));

      const linkGroups = Array.isArray(nav.linkGroups) ? nav.linkGroups : [];

      const copyright = nav.copyright || {
        text: nav.footer?.copyright || nav.footer?.copyrightText || nav.copyrightText || '© 2026 Ashwa Riders. All rights reserved.',
        autoYear: true,
      };

      const credit = nav.credit || {
        text: nav.footer?.builtByText || nav.footer?.designedBy || nav.designedBy || 'Built by the Ashwa Riders Team',
        url: '',
        visible: true,
      };

      const appearance = nav.appearance || {
        footerEnabled: true,
        socialLinksEnabled: true,
        footerCreditEnabled: true,
        headerCtaEnabled: true,
      };

      // ─── 1. BRANDING & LOGO ───
      if (branding.logoUrl) {
        const logoImgs = document.querySelectorAll('.nav-logo img, .navbar .nav-logo img, .logo-mark, .mobile-nav-brand img');
        logoImgs.forEach((img) => {
          if (img && img.src !== branding.logoUrl) img.src = branding.logoUrl;
        });
      }

      if (branding.brandTitle) {
        const titleSpan = document.querySelector('.nav-logo-wrapper > span:first-child');
        if (titleSpan) {
          titleSpan.textContent = branding.brandTitle;
        } else {
          const navLogo = document.querySelector('.nav-logo');
          if (navLogo) {
            const wrapper = navLogo.querySelector('.nav-logo-wrapper');
            if (wrapper) wrapper.innerHTML = `<span>${branding.brandTitle}</span><span class="nav-subtitle">${branding.subtitle || 'E-FORMULA · SVPCET'}</span>`;
          }
        }

        const mobileBrand = document.querySelector('.mobile-nav-brand span');
        if (mobileBrand) mobileBrand.textContent = branding.brandTitle;

        const footerLogo = document.querySelector('.footer-brand .logo');
        if (footerLogo) footerLogo.innerHTML = branding.brandTitle;
      }

      if (branding.subtitle) {
        const subSpan = document.querySelector('.nav-subtitle');
        if (subSpan) subSpan.textContent = branding.subtitle;
      }

      if (branding.homeUrl) {
        const navLogos = document.querySelectorAll('.nav-logo');
        navLogos.forEach((nl) => nl.setAttribute('href', branding.homeUrl));
      }

      // ─── 2. HEADER NAVIGATION (DESKTOP & MOBILE DRAWER) ───
      const currentFile = window.location.pathname.split('/').pop().toLowerCase() || 'index.html';

      // Desktop Navbar
      const navLinksUl = document.querySelector('.nav-links, #navLinks');
      if (navLinksUl && navItems && navItems.length > 0) {
        const visibleNavItems = navItems.filter((item) => item.visible !== false);

        let linksMarkup = visibleNavItems
          .map((item) => {
            const itemFile = (item.url || '').split('/').pop().toLowerCase();
            const isActive = itemFile === currentFile || (currentFile === '' && itemFile === 'index.html');
            return `<li><a href="${item.url}" class="${isActive ? 'active' : ''}">${item.label}</a></li>`;
          })
          .join('');

        if (appearance.headerCtaEnabled !== false && headerCta.visible !== false && headerCta.label) {
          linksMarkup += `<li><a href="${headerCta.url || '#'}" class="nav-cta">${headerCta.label}</a></li>`;
        }

        navLinksUl.innerHTML = linksMarkup;
      }

      // Mobile Navigation Drawer Links
      const mobileNav = document.querySelector('.mobile-nav-links');
      if (mobileNav && navItems && navItems.length > 0) {
        const visibleNavItems = navItems.filter((item) => item.visible !== false);

        mobileNav.innerHTML = visibleNavItems
          .map((item) => {
            const itemFile = (item.url || '').split('/').pop().toLowerCase();
            const isActive = itemFile === currentFile || (currentFile === '' && itemFile === 'index.html');
            return `<a class="mobile-nav-link ${isActive ? 'active' : ''}" href="${item.url}"><span>${item.label}</span> <i class="fas fa-chevron-right"></i></a>`;
          })
          .join('');

        // Ensure clicking links closes the drawer
        const drawer = document.querySelector('.mobile-nav-drawer, #mobile-nav-drawer');
        const backdrop = document.querySelector('.mobile-nav-backdrop, #mobile-nav-backdrop');
        mobileNav.querySelectorAll('a').forEach((a) => {
          a.addEventListener('click', () => {
            if (drawer) drawer.classList.remove('is-open');
            if (backdrop) backdrop.classList.remove('is-open');
            document.body.classList.remove('mobile-nav-active');
            document.body.style.overflow = '';
          });
        });
      }

      // Mobile Drawer Footer CTA
      const mobileCtaWrap = document.querySelector('.mobile-nav-footer');
      if (mobileCtaWrap) {
        if (appearance.headerCtaEnabled !== false && headerCta.visible !== false && headerCta.label) {
          mobileCtaWrap.style.display = '';
          let ctaAnchor = mobileCtaWrap.querySelector('a');
          if (!ctaAnchor) {
            ctaAnchor = document.createElement('a');
            ctaAnchor.className = 'mobile-nav-cta';
            mobileCtaWrap.appendChild(ctaAnchor);
          }
          ctaAnchor.href = headerCta.url || '#';
          ctaAnchor.innerHTML = `<i class="fas fa-arrow-right"></i> ${headerCta.label}`;
        } else {
          mobileCtaWrap.style.display = 'none';
        }
      }

      // ─── 3. FOOTER BRAND & DESCRIPTION ───
      if (footerBrand.description) {
        const footerSummaries = document.querySelectorAll('.footer-brand p, .footer-about p');
        footerSummaries.forEach((p) => {
          p.textContent = footerBrand.description;
        });
      }

      // ─── 4. FOOTER SOCIAL LINKS ───
      const socialContainers = document.querySelectorAll('.footer-brand .social-links, .footer .social-links');
      if (socialContainers.length > 0) {
        if (appearance.socialLinksEnabled === false) {
          socialContainers.forEach((sc) => { sc.style.display = 'none'; });
        } else {
          socialContainers.forEach((sc) => {
            sc.style.display = '';
            const visibleSocial = (socialLinks || []).filter((s) => s.visible !== false && s.url && s.url !== '#');
            if (visibleSocial.length > 0) {
              sc.innerHTML = visibleSocial
                .map((s) => `
                  <a href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.label || s.platform}">
                    <i class="${getSocialIconClass(s.platform, s.icon)}"></i>
                  </a>
                `)
                .join('');
            }
          });
        }
      }

      // ─── 5. FOOTER LINK COLUMNS (GROUPS) ───
      const footerGrid = document.querySelector('.footer-grid');
      if (footerGrid && linkGroups && linkGroups.length > 0) {
        const brandBlock = footerGrid.querySelector('.footer-brand');
        if (brandBlock) {
          // Remove existing sibling column divs
          while (brandBlock.nextElementSibling) {
            brandBlock.nextElementSibling.remove();
          }

          // Append CMS-defined columns
          const visibleGroups = linkGroups.filter((g) => g.visible !== false);
          visibleGroups.forEach((grp) => {
            const colDiv = document.createElement('div');
            const colLinks = (grp.links || []).filter((l) => l.visible !== false);
            colDiv.innerHTML = `
              <h4>${grp.title}</h4>
              <ul>
                ${colLinks.map((l) => `<li><a href="${l.url}">${l.label}</a></li>`).join('')}
              </ul>
            `;
            footerGrid.appendChild(colDiv);
          });
        }
      }

      // ─── 6. FOOTER COPYRIGHT & CREDIT ───
      let finalCopyText = copyright.text || '© 2026 Ashwa Riders. All rights reserved.';
      if (copyright.autoYear !== false) {
        const curYear = new Date().getFullYear();
        finalCopyText = finalCopyText.replace(/\b(20\d{2})\b/, curYear);
      }

      const copySpan = document.querySelector('.footer-bottom span:first-child, .copyright-text, .footer-mini p:first-child');
      if (copySpan) copySpan.textContent = finalCopyText;

      const builtBySpan = document.querySelector('.footer-bottom span:last-child');
      if (builtBySpan && builtBySpan !== copySpan) {
        if (appearance.footerCreditEnabled === false || credit.visible === false) {
          builtBySpan.style.display = 'none';
        } else {
          builtBySpan.style.display = '';
          if (credit.url && credit.url.trim() && credit.url !== '#') {
            builtBySpan.innerHTML = `<a href="${credit.url}" style="color:inherit; text-decoration:none;">${credit.text}</a>`;
          } else {
            builtBySpan.textContent = credit.text || 'Built by the Ashwa Riders Team';
          }
        }
      }

      console.log('[CMS NAV FOOTER] Successfully hydrated global navigation and footer across page:', {
        brandTitle: branding.brandTitle,
        navCount: navItems.length,
        cta: headerCta.label,
        groupsCount: linkGroups.length,
      });
    } catch (err) {
      console.error('[CMS NAV FOOTER] Error hydrating navigation/footer:', err);
    }
  };

  // ============================================================
  //  INITIALIZATION
  // ============================================================
  const initCmsFramework = () => {
    injectCmsStyles();
    renderAdminToolbar();
    hydrateCmsSection();
    hydrateNavigationAndFooter();
  };

  // Expose global CMS helpers
  window.ARCms = {
    renderEditButton,
    renderDeleteButton,
    renderAddButton,
    renderUploadButton,
    renderSaveButton,
    renderCancelButton,
    showConfirmationDialog,
    showLoadingSpinner,
    showSuccessNotification,
    showErrorNotification,
    showAddContentModal,
    setupInlineEdit,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCmsFramework);
  } else {
    initCmsFramework();
  }

  window.addEventListener('storage', () => {
    renderAdminToolbar();
    hydrateCmsSection();
  });

})();
