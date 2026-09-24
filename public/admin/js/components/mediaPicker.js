/* ============================================================
   public/admin/js/components/mediaPicker.js
   Reusable Media Picker Modal Component for Admin CMS Editors.
   Supports browsing existing media, searching, filtering by type,
   drag-and-drop uploading, thumbnail previewing, and asset selection.
============================================================ */

const MediaPicker = (function () {
  'use strict';

  let currentConfig = null;
  let activePage = 1;
  let activeSearch = '';
  let activeType = 'all';
  let selectedAsset = null;

  const getModalHtml = () => `
    <div class="admin-modal-backdrop" id="adminMediaPickerModal" style="position:fixed; inset:0; z-index:999999; background:rgba(8,8,12,0.85); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; overflow-y:auto; padding:20px; font-family:var(--font-main, sans-serif);">
      <div class="admin-modal" style="max-width: 940px; width: 92vw; max-height:90vh; overflow-y:auto; background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:12px; box-shadow:0 30px 90px rgba(0,0,0,0.85); display:flex; flex-direction:column;">
        
        <!-- Header -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid var(--border-hairline, #2D2D3B); background:var(--bg-dark, #111116);">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:36px; height:36px; border-radius:8px; background:rgba(242,89,18,0.15); border:1px solid rgba(242,89,18,0.3); color:var(--accent-orange, #F25912); display:flex; align-items:center; justify-content:center; font-size:1.1rem;">
              <i class="fas fa-photo-video"></i>
            </div>
            <div>
              <h3 style="font-size:1.1rem; font-weight:800; color:#FFFFFF; margin:0; line-height:1.2;">Select Media Asset</h3>
              <p style="font-size:0.75rem; color:var(--text-secondary, #9FA7A6); margin:2px 0 0 0; font-family:var(--font-mono, monospace);">Browse uploaded files or upload new image/video content</p>
            </div>
          </div>
          <button type="button" id="pickerCloseBtn" style="width:32px; height:32px; border-radius:50%; background:rgba(255,255,255,0.05); border:1px solid var(--border-hairline, #2D2D3B); color:var(--text-secondary, #9FA7A6); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s ease;">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <!-- Navigation Tabs -->
        <div style="display:flex; gap:10px; padding:14px 24px; border-bottom:1px solid var(--border-hairline, #2D2D3B); background:var(--bg-dark, #111116);">
          <button type="button" id="tabBrowse" style="background:var(--accent-orange, #F25912); color:#FFFFFF; font-weight:700; font-size:0.8rem; padding:8px 18px; border-radius:6px; border:1px solid var(--accent-orange, #F25912); cursor:pointer; text-transform:uppercase; letter-spacing:0.04em; display:inline-flex; align-items:center; gap:8px; transition:all 0.2s ease;">
            <i class="fas fa-th-large"></i> Media Library
          </button>
          <button type="button" id="tabUpload" style="background:rgba(255,255,255,0.04); color:var(--text-secondary, #9FA7A6); font-weight:600; font-size:0.8rem; padding:8px 18px; border-radius:6px; border:1px solid var(--border-hairline, #2D2D3B); cursor:pointer; text-transform:uppercase; letter-spacing:0.04em; display:inline-flex; align-items:center; gap:8px; transition:all 0.2s ease;">
            <i class="fas fa-cloud-upload-alt"></i> Upload New Media
          </button>
        </div>

        <!-- Body -->
        <div style="padding:24px; max-height:60vh; overflow-y:auto; background:var(--surface-dark, #181820);">
          
          <!-- BROWSE TAB CONTENT -->
          <div id="pickerBrowseView">
            <div style="display:flex; gap:12px; margin-bottom:20px; align-items:center; flex-wrap:wrap;">
              <div style="position:relative; flex:1; min-width:240px;">
                <i class="fas fa-search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted, #6B7280); font-size:0.85rem;"></i>
                <input type="text" id="pickerSearchInput" class="form-input" placeholder="Search by name, alt text, tag..." style="padding-left:38px; background:var(--panel-dark, #20202B); border:1px solid var(--border-hairline, #2D2D3B); color:#FFFFFF; border-radius:6px; font-size:0.88rem;" />
              </div>
              <select id="pickerTypeFilter" class="form-select" style="width:160px; background:var(--panel-dark, #20202B); border:1px solid var(--border-hairline, #2D2D3B); color:#FFFFFF; border-radius:6px; font-size:0.88rem; padding:8px 12px;">
                <option value="all">⚡ All Types</option>
                <option value="image">🖼️ Images</option>
                <option value="video">🎥 Videos</option>
                <option value="raw">📄 Documents</option>
              </select>
            </div>

            <div id="pickerGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(135px, 1fr)); gap:14px; min-height:260px;">
              <div style="grid-column: 1/-1; text-align:center; padding:50px 20px;">
                <i class="fas fa-spinner fa-spin" style="font-size:2rem; color:var(--accent-orange, #F25912); margin-bottom:10px;"></i>
                <p style="color:var(--text-secondary, #9FA7A6); font-size:0.88rem;">Loading media library assets...</p>
              </div>
            </div>

            <div id="pickerPagination" style="display:flex; justify-content:space-between; align-items:center; margin-top:20px; padding-top:16px; border-top:1px solid var(--border-hairline, #2D2D3B); font-size:0.82rem; color:var(--text-secondary, #9FA7A6);">
              <span id="pickerPaginationInfo">Showing assets</span>
              <div style="display:flex; gap:8px;">
                <button type="button" id="pickerPrevPage" class="btn btn-secondary btn-sm" style="padding:6px 14px; border-radius:6px; background:var(--panel-dark, #20202B); border:1px solid var(--border-hairline, #2D2D3B); color:#FFF; font-weight:600; cursor:pointer;" disabled>
                  <i class="fas fa-chevron-left"></i> Previous
                </button>
                <button type="button" id="pickerNextPage" class="btn btn-secondary btn-sm" style="padding:6px 14px; border-radius:6px; background:var(--panel-dark, #20202B); border:1px solid var(--border-hairline, #2D2D3B); color:#FFF; font-weight:600; cursor:pointer;" disabled>
                  Next <i class="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- UPLOAD TAB CONTENT -->
          <div id="pickerUploadView" style="display:none;">
            <div id="pickerDropzone" style="border:2px dashed var(--border-hairline, #2D2D3B); border-radius:10px; padding:50px 20px; text-align:center; background:var(--bg-dark, #111116); cursor:pointer; transition:all 0.2s ease;">
              <div style="width:56px; height:56px; border-radius:50%; background:rgba(242,89,18,0.1); border:1px solid rgba(242,89,18,0.25); color:var(--accent-orange, #F25912); display:inline-flex; align-items:center; justify-content:center; margin-bottom:14px; font-size:1.6rem;">
                <i class="fas fa-cloud-upload-alt"></i>
              </div>
              <h4 style="color:#FFFFFF; font-weight:700; font-size:1.05rem; margin-bottom:6px;">Drag & drop media files here, or click to browse</h4>
              <p style="color:var(--text-muted, #6B7280); font-size:0.82rem; font-family:var(--font-mono, monospace);">
                PNG, JPG, WEBP, GIF, MP4, WEBM, PDF (Max: 1000MB Images, Videos & Docs)
              </p>
              <input type="file" id="pickerFileInput" style="display:none;" accept="image/*,video/*,application/pdf" />
            </div>

            <div id="pickerUploadProgress" style="display:none; margin-top:20px; background:var(--panel-dark, #20202B); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:16px;">
              <div style="display:flex; justify-content:space-between; margin-bottom:8px; font-size:0.85rem;">
                <span id="pickerProgressLabel" style="color:#FFFFFF; font-weight:600;">Uploading asset...</span>
                <span id="pickerPercentLabel" style="color:var(--accent-orange, #F25912); font-weight:700;">0%</span>
              </div>
              <div style="width:100%; height:8px; background:var(--bg-dark, #111116); border-radius:4px; overflow:hidden;">
                <div id="pickerProgressBar" style="width:0%; height:100%; background:var(--accent-orange, #F25912); transition:width 0.2s ease;"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-top:1px solid var(--border-hairline, #2D2D3B); background:var(--bg-dark, #111116);">
          <div id="pickerSelectedInfo" style="font-size:0.85rem; color:var(--text-secondary, #9FA7A6); font-weight:500;">
            No asset selected
          </div>
          <div style="display:flex; gap:10px; align-items:center;">
            <button type="button" id="pickerDeleteBtn" class="btn btn-danger btn-sm" style="display:none; background:#EF4444; color:#FFFFFF; border:none; padding:8px 16px; border-radius:6px; font-weight:700; font-size:0.8rem; cursor:pointer; text-transform:uppercase; letter-spacing:0.04em;" disabled>
              <i class="fas fa-trash-alt"></i> Delete Asset
            </button>
            <button type="button" id="pickerCancelBtn" class="btn btn-secondary btn-sm" style="background:var(--panel-dark, #20202B); border:1px solid var(--border-hairline, #2D2D3B); color:#FFFFFF; padding:8px 18px; border-radius:6px; font-weight:700; font-size:0.8rem; cursor:pointer; text-transform:uppercase; letter-spacing:0.04em;">Cancel</button>
            <button type="button" id="pickerConfirmBtn" class="btn btn-primary btn-sm" style="background:var(--accent-orange, #F25912); color:#FFFFFF; border:none; padding:8px 20px; border-radius:6px; font-weight:700; font-size:0.8rem; cursor:pointer; text-transform:uppercase; letter-spacing:0.04em;" disabled>
              <i class="fas fa-check"></i> Select Asset
            </button>
          </div>
        </div>

      </div>
    </div>
  `;

  const fetchAssets = async () => {
    const grid = document.getElementById('pickerGrid');
    if (!grid) return;

    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 40px;">
        <i class="fas fa-spinner fa-spin text-orange" style="font-size:24px;"></i>
        <p style="margin-top:8px; color:var(--admin-text-muted);">Loading media library...</p>
      </div>
    `;

    try {
      const typeParam = activeType !== 'all' ? activeType : (currentConfig?.allowedType || 'all');
      const params = {
        page: activePage,
        limit: 18,
      };
      if (typeParam && typeParam !== 'all') params.type = typeParam;
      if (activeSearch) params.search = activeSearch;

      const api = window.AdminApi || window.API;
      const res = await api.get('/admin/media', params);
      if (res.success && res.data) {
        renderGrid(res.data, res.pagination);
      } else {
        grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--admin-danger, #ef4444); padding:30px;">Failed to load assets.</div>`;
      }
    } catch (err) {
      grid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; color:var(--admin-danger, #ef4444); padding:30px;">Error: ${err.message}</div>`;
    }
  };

  const renderGrid = (assets, pagination) => {
    const grid = document.getElementById('pickerGrid');
    if (!grid) return;

    if (!assets || assets.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 40px; color:var(--admin-text-muted);">
          <i class="fas fa-folder-open" style="font-size:32px; margin-bottom:10px;"></i>
          <p>No media assets found matching filter.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = assets
      .map((asset) => {
        const isSelected = selectedAsset && selectedAsset._id === asset._id;
        const isVideo = asset.resourceType === 'video';
        const isDoc = asset.resourceType === 'raw';

        let previewHtml = `<img src="${asset.url}" alt="${asset.altText || ''}" style="width:100%; height:100%; object-fit:cover;" />`;
        if (isVideo) {
          previewHtml = `
            <div style="width:100%; height:100%; background:#000; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff;">
              <i class="fas fa-play-circle" style="font-size:28px; color:var(--admin-orange, #F25912);"></i>
              <span style="font-size:10px; margin-top:4px; opacity:0.8;">VIDEO</span>
            </div>
          `;
        } else if (isDoc) {
          previewHtml = `
            <div style="width:100%; height:100%; background:var(--admin-surface-card); display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--admin-text-main);">
              <i class="fas fa-file-pdf" style="font-size:28px; color:#EF4444;"></i>
              <span style="font-size:10px; margin-top:4px;">DOC</span>
            </div>
          `;
        }

        return `
          <div class="picker-asset-card ${isSelected ? 'selected' : ''}" data-id="${asset._id}" style="
            position:relative; aspect-ratio: 1; border-radius: 6px; overflow: hidden; border: 2px solid ${isSelected ? 'var(--admin-orange, #F25912)' : 'var(--admin-border, #2D2D3B)'};
            cursor: pointer; background: #000; transition: transform 0.15s, border-color 0.15s;
          ">
            ${previewHtml}
            <button type="button" class="picker-delete-btn" data-id="${asset._id}" title="Delete asset permanently" style="
              position:absolute; top:4px; left:4px; width:22px; height:22px; background:rgba(239,68,68,0.85); border:none; border-radius:4px;
              color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px; cursor:pointer; z-index:2;
            ">
              <i class="fas fa-trash-alt"></i>
            </button>
            <div style="position:absolute; bottom:0; left:0; right:0; background:rgba(0,0,0,0.75); padding:4px 6px; font-size:10px; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              ${asset.altText || asset.publicId || 'Asset'}
            </div>
            ${isSelected ? `<div style="position:absolute; top:4px; right:4px; width:20px; height:20px; background:var(--admin-orange, #F25912); border-radius:50%; color:#fff; display:flex; align-items:center; justify-content:center; font-size:10px;"><i class="fas fa-check"></i></div>` : ''}
          </div>
        `;
      })
      .join('');

    // Update selection and delete handlers
    grid.querySelectorAll('.picker-asset-card').forEach((card) => {
      card.addEventListener('click', () => {
        const assetId = card.getAttribute('data-id');
        selectedAsset = assets.find((a) => a._id === assetId);
        renderGrid(assets, pagination);

        const confirmBtn = document.getElementById('pickerConfirmBtn');
        const deleteBtn = document.getElementById('pickerDeleteBtn');
        const info = document.getElementById('pickerSelectedInfo');
        if (confirmBtn) confirmBtn.disabled = false;
        if (deleteBtn) {
          deleteBtn.style.display = 'inline-flex';
          deleteBtn.disabled = false;
        }
        if (info && selectedAsset) {
          info.innerHTML = `Selected: <strong style="color:var(--admin-text-main, #FFF);">${selectedAsset.altText || selectedAsset.publicId}</strong>`;
        }
      });

      const delBtn = card.querySelector('.picker-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const assetId = delBtn.getAttribute('data-id');
          const targetAsset = assets.find((a) => a._id === assetId);
          const nameStr = targetAsset ? (targetAsset.altText || targetAsset.publicId) : 'this asset';
          if (confirm(`Permanently delete "${nameStr}" from Media Library?`)) {
            try {
              const api = window.AdminApi || window.API;
              const res = await api.delete(`/admin/media/${assetId}`);
              if (res.success) {
                if (window.AdminToast) window.AdminToast.success('Media asset deleted.');
                if (selectedAsset && selectedAsset._id === assetId) {
                  selectedAsset = null;
                }
                fetchAssets();
              } else {
                if (window.AdminToast) window.AdminToast.error(res.message || 'Failed to delete asset.');
              }
            } catch (err) {
              if (window.AdminToast) window.AdminToast.error('Delete error: ' + err.message);
            }
          }
        });
      }
    });

    // Pagination buttons
    const prevBtn = document.getElementById('pickerPrevPage');
    const nextBtn = document.getElementById('pickerNextPage');
    const info = document.getElementById('pickerPaginationInfo');

    if (info && pagination) {
      info.textContent = `Page ${pagination.page} of ${pagination.pages} (${pagination.total} items)`;
      if (prevBtn) prevBtn.disabled = pagination.page <= 1;
      if (nextBtn) nextBtn.disabled = pagination.page >= pagination.pages;
    }
  };

  const uploadFile = async (file) => {
    if (!file) return;

    const progress = document.getElementById('pickerUploadProgress');
    const label = document.getElementById('pickerProgressLabel');
    const percent = document.getElementById('pickerPercentLabel');
    const bar = document.getElementById('pickerProgressBar');

    if (progress) progress.style.display = 'block';
    if (label) label.textContent = `Preparing ${file.name}...`;

    const updateProgress = (pct, msg) => {
      if (bar) bar.style.width = `${pct}%`;
      if (percent) percent.textContent = `${pct}%`;
      if (label && msg) label.textContent = msg;
    };

    try {
      updateProgress(5, 'Starting upload pipeline...');
      let uploadRes;

      if (window.AdminUploader && window.AdminUploader.uploadFile) {
        uploadRes = await window.AdminUploader.uploadFile(file, {
          allowedType: currentConfig?.allowedType || 'all',
          onProgress: updateProgress,
        });
      } else {
        // Fallback directly to API if AdminUploader isn't initialized yet
        const api = window.AdminApi || window.API;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('altText', file.name.replace(/\.[^/.]+$/, ''));
        updateProgress(50, 'Uploading to server...');
        const res = await api.post('/admin/media/upload', formData);
        if (res && res.success && res.data) {
          uploadRes = { success: true, asset: res.data };
        } else {
          throw new Error((res && res.message) || 'Upload failed.');
        }
      }

      updateProgress(100, 'Upload verified and saved!');
      if (uploadRes && uploadRes.success && uploadRes.asset) {
        if (window.AdminToast) window.AdminToast.success('File uploaded and verified successfully!');
        selectedAsset = uploadRes.asset;

        // Switch to browse view and refresh
        document.getElementById('tabBrowse').click();
        await fetchAssets();
      }
    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Upload error: ' + err.message);
      if (label) label.textContent = `Failed: ${err.message}`;
    } finally {
      setTimeout(() => {
        if (progress) progress.style.display = 'none';
      }, 1500);
    }
  };

  const open = (config = {}) => {
    currentConfig = {
      allowedType: config.allowedType || 'all', // 'image', 'video', 'raw', or 'all'
      onSelect: config.onSelect || null,
      ...config,
    };
    activePage = 1;
    activeSearch = '';
    activeType = currentConfig.allowedType !== 'all' ? currentConfig.allowedType : 'all';
    selectedAsset = null;

    const existing = document.getElementById('adminMediaPickerModal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', getModalHtml());
    const modal = document.getElementById('adminMediaPickerModal');

    // Wire Modal Controls
    const close = () => {
      modal.remove();
    };

    document.getElementById('pickerCloseBtn').addEventListener('click', close);
    document.getElementById('pickerCancelBtn').addEventListener('click', close);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    document.getElementById('pickerConfirmBtn').addEventListener('click', () => {
      if (selectedAsset && typeof currentConfig.onSelect === 'function') {
        currentConfig.onSelect(selectedAsset);
      }
      close();
    });

    document.getElementById('pickerDeleteBtn')?.addEventListener('click', async () => {
      if (!selectedAsset) return;
      const nameStr = selectedAsset.altText || selectedAsset.publicId || 'this asset';
      if (confirm(`Permanently delete "${nameStr}" from Media Library?`)) {
        try {
          const api = window.AdminApi || window.API;
          const res = await api.delete(`/admin/media/${selectedAsset._id}`);
          if (res.success) {
            if (window.AdminToast) window.AdminToast.success('Media asset deleted.');
            selectedAsset = null;
            const confirmBtn = document.getElementById('pickerConfirmBtn');
            const deleteBtn = document.getElementById('pickerDeleteBtn');
            const info = document.getElementById('pickerSelectedInfo');
            if (confirmBtn) confirmBtn.disabled = true;
            if (deleteBtn) { deleteBtn.style.display = 'none'; deleteBtn.disabled = true; }
            if (info) info.textContent = 'No asset selected';
            fetchAssets();
          } else {
            if (window.AdminToast) window.AdminToast.error(res.message || 'Failed to delete asset.');
          }
        } catch (err) {
          if (window.AdminToast) window.AdminToast.error('Delete error: ' + err.message);
        }
      }
    });

    // Wire Tabs
    const tabBrowse = document.getElementById('tabBrowse');
    const tabUpload = document.getElementById('tabUpload');
    const browseView = document.getElementById('pickerBrowseView');
    const uploadView = document.getElementById('pickerUploadView');

    tabBrowse.addEventListener('click', () => {
      tabBrowse.style.background = 'var(--accent-orange, #F25912)';
      tabBrowse.style.color = '#FFFFFF';
      tabBrowse.style.borderColor = 'var(--accent-orange, #F25912)';
      tabBrowse.style.fontWeight = '700';

      tabUpload.style.background = 'rgba(255,255,255,0.04)';
      tabUpload.style.color = 'var(--text-secondary, #9FA7A6)';
      tabUpload.style.borderColor = 'var(--border-hairline, #2D2D3B)';
      tabUpload.style.fontWeight = '600';

      browseView.style.display = 'block';
      uploadView.style.display = 'none';
    });

    tabUpload.addEventListener('click', () => {
      tabUpload.style.background = 'var(--accent-orange, #F25912)';
      tabUpload.style.color = '#FFFFFF';
      tabUpload.style.borderColor = 'var(--accent-orange, #F25912)';
      tabUpload.style.fontWeight = '700';

      tabBrowse.style.background = 'rgba(255,255,255,0.04)';
      tabBrowse.style.color = 'var(--text-secondary, #9FA7A6)';
      tabBrowse.style.borderColor = 'var(--border-hairline, #2D2D3B)';
      tabBrowse.style.fontWeight = '600';

      uploadView.style.display = 'block';
      browseView.style.display = 'none';
    });

    // Wire Search & Filter
    const searchInput = document.getElementById('pickerSearchInput');
    const typeFilter = document.getElementById('pickerTypeFilter');

    if (typeFilter) {
      typeFilter.value = activeType;
      typeFilter.addEventListener('change', (e) => {
        activeType = e.target.value;
        activePage = 1;
        fetchAssets();
      });
    }

    let searchTimer;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          activeSearch = e.target.value.trim();
          activePage = 1;
          fetchAssets();
        }, 300);
      });
    }

    // Wire Pagination
    document.getElementById('pickerPrevPage').addEventListener('click', () => {
      if (activePage > 1) {
        activePage--;
        fetchAssets();
      }
    });

    document.getElementById('pickerNextPage').addEventListener('click', () => {
      activePage++;
      fetchAssets();
    });

    // Wire Dropzone Upload
    const dropzone = document.getElementById('pickerDropzone');
    const fileInput = document.getElementById('pickerFileInput');

    dropzone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadFile(e.target.files[0]);
      }
    });

    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--admin-orange, #F25912)';
    });

    dropzone.addEventListener('dragleave', () => {
      dropzone.style.borderColor = 'var(--admin-border, #2D2D3B)';
    });

    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.style.borderColor = 'var(--admin-border, #2D2D3B)';
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        uploadFile(e.dataTransfer.files[0]);
      }
    });

    // Initial fetch
    fetchAssets();
  };

  const instance = { open };
  window.MediaPicker = instance;
  window.AdminMediaPicker = instance;

  return instance;
})();

