/* ============================================================
   media.js — Dedicated Media Library Management Module
   Connected to /api/v1/admin/media APIs.
============================================================ */

(function () {
  'use strict';

  let currentParams = {
    page: 1,
    limit: 24,
    search: '',
    type: 'all',
  };

  async function renderMediaModule(container) {
    container.innerHTML = `
      <div class="page-title-bar" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:12px;">
        <div>
          <h2 class="page-title">Media Asset Library</h2>
          <p class="page-subtitle">Upload, browse, inspect, and manage images, videos, and brochure documents.</p>
        </div>
        <div style="display:flex; gap:10px;">
          <button type="button" class="admin-btn admin-btn--secondary" id="mediaAuditBtn">
            <i class="fas fa-stethoscope"></i> Audit Media Health
          </button>
          <button type="button" class="admin-btn admin-btn--primary" id="mediaUploadMainBtn">
            <i class="fas fa-cloud-upload-alt"></i> Upload New Media
          </button>
        </div>
      </div>

      <div id="mediaAuditPanel" style="display:none; margin-bottom:20px;" class="admin-card">
        <!-- Rendered dynamically -->
      </div>

      <div class="admin-card" style="margin-bottom:20px; padding:16px;">
        <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center;">
          <div class="admin-search-wrap" style="flex:1; min-width:240px;">
            <i class="fas fa-search admin-search-icon"></i>
            <input type="text" id="mediaSearchInput" class="admin-input" value="${currentParams.search}" placeholder="Search by filename, alt text, tag..." />
          </div>
          <div style="width:160px;">
            <select id="mediaTypeSelect" class="admin-select">
              <option value="all" ${currentParams.type === 'all' ? 'selected' : ''}>All Resource Types</option>
              <option value="image" ${currentParams.type === 'image' ? 'selected' : ''}>Images</option>
              <option value="video" ${currentParams.type === 'video' ? 'selected' : ''}>Videos</option>
              <option value="raw" ${currentParams.type === 'raw' ? 'selected' : ''}>Documents (PDF)</option>
            </select>
          </div>
        </div>
      </div>

      <div id="mediaGridContainer" style="min-height:300px;">
        <p style="color:var(--admin-text-muted); text-align:center; padding:40px;">Loading media assets...</p>
      </div>
    `;

    document.getElementById('mediaUploadMainBtn').addEventListener('click', () => {
      window.MediaPicker.open({
        allowedType: 'all',
        onSelect: () => loadMediaList(),
      });
    });

    const auditBtn = document.getElementById('mediaAuditBtn');
    const auditPanel = document.getElementById('mediaAuditPanel');
    if (auditBtn && auditPanel) {
      auditBtn.addEventListener('click', async () => {
        if (auditPanel.style.display === 'block') {
          auditPanel.style.display = 'none';
          auditBtn.innerHTML = '<i class="fas fa-stethoscope"></i> Audit Media Health';
          return;
        }

        auditBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Auditing Pipeline...';
        auditPanel.style.display = 'block';
        auditPanel.innerHTML = '<p style="padding:20px; text-align:center; color:var(--text-muted);"><i class="fas fa-spinner fa-spin text-orange"></i> Scanning all CMS content and verifying storage URLs...</p>';

        try {
          const res = await window.AdminApi.get('/admin/media/audit');
          if (res.success && res.data) {
            const d = res.data;
            auditPanel.innerHTML = `
              <div style="padding:16px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:1px solid var(--border-hairline); padding-bottom:10px;">
                  <h4 style="margin:0; font-size:1rem; font-weight:700;"><i class="fas fa-shield-alt text-orange"></i> Media Pipeline Health Report</h4>
                  <button type="button" id="closeAuditBtn" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer;"><i class="fas fa-times"></i></button>
                </div>
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:16px;">
                  <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-hairline); border-radius:6px; padding:12px; text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Storage Cloud</div>
                    <div style="font-size:1.1rem; font-weight:700; color:#10B981; margin-top:4px;">${d.cloudName} (${d.storageConfigured ? 'Connected' : 'Offline'})</div>
                  </div>
                  <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-hairline); border-radius:6px; padding:12px; text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Registered Assets</div>
                    <div style="font-size:1.1rem; font-weight:700; color:#FFF; margin-top:4px;">${d.totalMediaAssets}</div>
                  </div>
                  <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-hairline); border-radius:6px; padding:12px; text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Active References</div>
                    <div style="font-size:1.1rem; font-weight:700; color:#FFF; margin-top:4px;">${d.totalCmsReferences}</div>
                  </div>
                  <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-hairline); border-radius:6px; padding:12px; text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Verified Healthy</div>
                    <div style="font-size:1.1rem; font-weight:700; color:#10B981; margin-top:4px;">${d.healthyReferencesCount}</div>
                  </div>
                  <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-hairline); border-radius:6px; padding:12px; text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Broken / Inaccessible</div>
                    <div style="font-size:1.1rem; font-weight:700; color:${d.brokenReferencesCount > 0 ? '#EF4444' : '#10B981'}; margin-top:4px;">${d.brokenReferencesCount}</div>
                  </div>
                  <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-hairline); border-radius:6px; padding:12px; text-align:center;">
                    <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase;">Orphan Records</div>
                    <div style="font-size:1.1rem; font-weight:700; color:var(--accent-orange); margin-top:4px;">${d.orphanDbRecordsCount}</div>
                  </div>
                </div>
                ${d.brokenReferencesCount > 0 ? `
                  <div style="margin-top:10px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:6px; padding:12px;">
                    <h5 style="color:#EF4444; margin:0 0 8px 0; font-size:0.85rem;"><i class="fas fa-exclamation-triangle"></i> Broken Media Items Found:</h5>
                    <ul style="margin:0; padding-left:20px; font-size:0.8rem; color:#FFF;">
                      ${d.brokenItems.map(item => `<li><strong>${item.collection}</strong> (${item.title || item.fieldPath}): <span style="font-family:monospace; color:#EF4444;">${item.url}</span> [HTTP ${item.httpStatus || 'Failed'}]</li>`).join('')}
                    </ul>
                  </div>
                ` : '<div style="color:#10B981; font-size:0.85rem;"><i class="fas fa-check-circle"></i> All active CMS media references are live and verified accessible.</div>'}
              </div>
            `;
            document.getElementById('closeAuditBtn')?.addEventListener('click', () => {
              auditPanel.style.display = 'none';
              auditBtn.innerHTML = '<i class="fas fa-stethoscope"></i> Audit Media Health';
            });
          }
        } catch (err) {
          auditPanel.innerHTML = `<div style="padding:16px; color:#EF4444;">Audit failed: ${err.message}</div>`;
        } finally {
          auditBtn.innerHTML = '<i class="fas fa-stethoscope"></i> Refresh Audit';
        }
      });
    }

    const searchInput = document.getElementById('mediaSearchInput');
    const typeSelect = document.getElementById('mediaTypeSelect');

    let searchTimer;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        currentParams.search = e.target.value.trim();
        currentParams.page = 1;
        loadMediaList();
      }, 300);
    });

    typeSelect.addEventListener('change', (e) => {
      currentParams.type = e.target.value;
      currentParams.page = 1;
      loadMediaList();
    });

    await loadMediaList();
  }

  async function loadMediaList() {
    const container = document.getElementById('mediaGridContainer');
    if (!container) return;

    try {
      const query = new URLSearchParams(currentParams).toString();
      const res = await window.AdminApi.get(`/admin/media?${query}`);

      if (res.success && res.data) {
        renderGrid(container, res.data, res.pagination);
      } else {
        container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--admin-danger);">Failed to load media.</div>`;
      }
    } catch (err) {
      container.innerHTML = `<div style="text-align:center; padding:40px; color:var(--admin-danger);">Error loading media: ${err.message}</div>`;
    }
  }

  function renderGrid(container, assets, pagination) {
    if (!assets || assets.length === 0) {
      container.innerHTML = `
        <div class="admin-card" style="text-align:center; padding:60px 20px; color:var(--admin-text-muted);">
          <i class="fas fa-photo-video" style="font-size:48px; margin-bottom:16px; opacity:0.4;"></i>
          <h3>No Media Assets Found</h3>
          <p>Try clearing filters or click "Upload New Media" to add assets.</p>
        </div>
      `;
      return;
    }

    const gridHtml = `
      <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:16px; margin-bottom:24px;">
        ${assets
          .map((asset) => {
            const isVideo = asset.resourceType === 'video';
            const isDoc = asset.resourceType === 'raw';

            let mediaThumb = `<img src="${asset.url}" alt="${asset.altText || ''}" style="width:100%; height:100%; object-fit:cover;" />`;
            if (isVideo) {
              mediaThumb = `
                <div style="width:100%; height:100%; background:#000; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#fff;">
                  <i class="fas fa-play-circle" style="font-size:36px; color:var(--admin-orange);"></i>
                  <span style="font-size:11px; margin-top:6px; font-weight:600;">VIDEO</span>
                </div>
              `;
            } else if (isDoc) {
              mediaThumb = `
                <div style="width:100%; height:100%; background:var(--admin-surface-card); display:flex; flex-direction:column; align-items:center; justify-content:center; color:var(--admin-text-main);">
                  <i class="fas fa-file-pdf" style="font-size:36px; color:#EF4444;"></i>
                  <span style="font-size:11px; margin-top:6px;">PDF DOC</span>
                </div>
              `;
            }

            return `
              <div class="admin-card media-asset-item" data-id="${asset._id}" style="padding:0; overflow:hidden; cursor:pointer; transition:transform 0.15s, border-color 0.15s; border:1px solid var(--admin-border);">
                <div style="aspect-ratio: 16/10; position:relative; background:#000;">
                  ${mediaThumb}
                  <div style="position:absolute; top:6px; right:6px; background:rgba(0,0,0,0.7); color:#fff; font-size:10px; padding:2px 6px; border-radius:3px; text-transform:uppercase;">
                    ${asset.resourceType}
                  </div>
                  ${asset.referenceCount > 0 ? `<div style="position:absolute; top:6px; left:6px; background:var(--admin-teal); color:#fff; font-size:10px; padding:2px 6px; border-radius:3px;"><i class="fas fa-link"></i> ${asset.referenceCount}</div>` : ''}
                </div>
                <div style="padding:10px 12px;">
                  <div style="font-weight:600; font-size:13px; color:var(--admin-text-main); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${asset.altText || asset.publicId}">
                    ${asset.altText || asset.publicId}
                  </div>
                  <div style="font-size:11px; color:var(--admin-text-muted); margin-top:4px; display:flex; justify-content:space-between;">
                    <span>${asset.format.toUpperCase()}</span>
                    <span>${Math.round((asset.bytes || 0) / 1024)} KB</span>
                  </div>
                </div>
              </div>
            `;
          })
          .join('')}
      </div>

      <!-- Pagination -->
      <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; color:var(--admin-text-muted);">
        <div>Showing page ${pagination.page} of ${pagination.pages} (${pagination.total} total assets)</div>
        <div style="display:flex; gap:8px;">
          <button type="button" class="admin-btn admin-btn--secondary admin-btn--sm" id="mediaPrevPage" ${pagination.page <= 1 ? 'disabled' : ''}>Previous</button>
          <button type="button" class="admin-btn admin-btn--secondary admin-btn--sm" id="mediaNextPage" ${pagination.page >= pagination.pages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    `;

    container.innerHTML = gridHtml;

    container.querySelectorAll('.media-asset-item').forEach((item) => {
      item.addEventListener('click', () => {
        const assetId = item.getAttribute('data-id');
        openAssetDetailDrawer(assetId);
      });
    });

    document.getElementById('mediaPrevPage')?.addEventListener('click', () => {
      if (currentParams.page > 1) {
        currentParams.page--;
        loadMediaList();
      }
    });

    document.getElementById('mediaNextPage')?.addEventListener('click', () => {
      currentParams.page++;
      loadMediaList();
    });
  }

  async function openAssetDetailDrawer(assetId) {
    try {
      const res = await window.AdminApi.get(`/admin/media/${assetId}`);
      if (!res.success || !res.data) {
        window.AdminToast.error('Asset details could not be retrieved.');
        return;
      }

      const { asset, usages, isReferenced } = res.data;

      let mediaPreviewHtml = `<img src="${asset.url}" alt="${asset.altText || ''}" style="width:100%; max-height:280px; object-fit:contain; border-radius:4px; background:#000;" />`;
      if (asset.resourceType === 'video') {
        mediaPreviewHtml = `<video src="${asset.url}" controls style="width:100%; max-height:280px; border-radius:4px; background:#000;"></video>`;
      } else if (asset.resourceType === 'raw') {
        mediaPreviewHtml = `
          <div style="padding:30px; text-align:center; background:var(--admin-surface-card); border-radius:4px;">
            <i class="fas fa-file-pdf text-orange" style="font-size:48px; margin-bottom:12px;"></i>
            <h4>${asset.altText || 'Document Asset'}</h4>
            <a href="${asset.url}" target="_blank" class="admin-btn admin-btn--secondary admin-btn--sm" style="margin-top:12px; display:inline-block;">
              <i class="fas fa-download"></i> Download / View File
            </a>
          </div>
        `;
      }

      const formContent = `
        <div style="margin-bottom:20px; text-align:center;">
          ${mediaPreviewHtml}
        </div>

        <form id="mediaDetailForm">
          <div class="form-group">
            <label>Alt Text / Title</label>
            <input type="text" name="altText" class="form-input" value="${asset.altText || ''}" placeholder="Descriptive title or accessibility text" />
          </div>

          <div class="form-group">
            <label>Caption / Notes</label>
            <textarea name="caption" class="form-textarea" placeholder="Optional caption or asset usage context">${asset.caption || ''}</textarea>
          </div>

          <div class="form-group">
            <label>Tags (comma separated)</label>
            <input type="text" name="tags" class="form-input" value="${(asset.tags || []).join(', ')}" placeholder="e.g. hero, homepage, car, 2026" />
          </div>
        </form>

        <div style="margin-top:24px; padding-top:16px; border-top:1px solid var(--border-hairline);">
          <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px;">File Specifications</h4>
          <table style="width:100%; font-size:12px; border-collapse:collapse; color:var(--text-secondary);">
            <tr><td style="padding:4px 0; font-weight:600;">Public ID:</td><td style="font-family:var(--font-mono);">${asset.publicId}</td></tr>
            <tr><td style="padding:4px 0; font-weight:600;">Type & Format:</td><td>${asset.resourceType.toUpperCase()} / ${asset.format.toUpperCase()}</td></tr>
            <tr><td style="padding:4px 0; font-weight:600;">File Size:</td><td>${Math.round((asset.bytes || 0) / 1024)} KB</td></tr>
            <tr><td style="padding:4px 0; font-weight:600;">Direct URL:</td><td><a href="${asset.url}" target="_blank" style="color:var(--accent-orange); word-break:break-all;">${asset.url}</a></td></tr>
          </table>
        </div>

        <div style="margin-top:20px; padding-top:16px; border-top:1px solid var(--border-hairline);">
          <h4 style="font-size:0.85rem; text-transform:uppercase; color:var(--text-muted); margin-bottom:12px;">Active References (${usages.length})</h4>
          ${
            usages.length > 0
              ? usages
                  .map((u) => `<div style="font-size:12px; padding:6px 10px; background:rgba(255,255,255,0.04); border-radius:4px; margin-bottom:6px;"><i class="fas fa-link text-orange"></i> Used in <strong>${u.model}</strong> (${u.count} reference)</div>`)
                  .join('')
              : `<p style="font-size:12px; color:var(--text-muted);">This media asset is currently unreferenced.</p>`
          }
        </div>
      `;

      window.AdminDrawer.openDrawer({
        title: `Media Asset Details (${asset.format.toUpperCase()})`,
        status: isReferenced ? 'referenced' : 'unreferenced',
        accordions: [
          {
            title: 'Metadata & Configuration',
            icon: 'fas fa-info-circle',
            content: formContent,
          },
        ],
        footerButtons: [
          {
            id: 'btnMediaDelete',
            label: 'Delete Asset',
            icon: 'fas fa-trash-alt',
            class: 'btn-secondary',
            onClick: async () => {
              if (isReferenced) {
                alert('Safety Check: Referenced assets cannot be permanently deleted while used in active website content.');
                return;
              }
              if (!confirm('Are you sure you want to permanently delete this media asset?')) return;

              try {
                const delRes = await window.AdminApi.delete(`/admin/media/${asset._id}`);
                if (delRes.success) {
                  window.AdminToast.success('Media asset deleted.');
                  window.AdminDrawer.closeDrawer(true);
                  await loadMediaList();
                }
              } catch (delErr) {
                window.AdminToast.error('Delete failed: ' + delErr.message);
              }
            },
          },
          {
            id: 'btnMediaSave',
            label: 'Save Metadata',
            icon: 'fas fa-save',
            class: 'btn-primary',
            onClick: async () => {
              const drawerBody = document.getElementById('drawerBody');
              const altText = drawerBody.querySelector('[name="altText"]').value.trim();
              const caption = drawerBody.querySelector('[name="caption"]').value.trim();
              const tags = drawerBody.querySelector('[name="tags"]').value.trim();

              try {
                const patchRes = await window.AdminApi.patch(`/admin/media/${asset._id}`, {
                  altText,
                  caption,
                  tags,
                });
                if (patchRes.success) {
                  window.AdminToast.success('Asset metadata updated.');
                  window.AdminDrawer.markClean();
                  window.AdminDrawer.closeDrawer(true);
                  await loadMediaList();
                }
              } catch (patchErr) {
                window.AdminToast.error('Update failed: ' + patchErr.message);
              }
            },
          },
        ],
      });
    } catch (err) {
      window.AdminToast.error('Failed to open asset details: ' + err.message);
    }
  }

  window.AdminMediaModule = { renderMediaModule };
})();
