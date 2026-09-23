/* ============================================================
   news.js — Complete News Management Module
   Connected to Phase 2 REST APIs (/api/v1/admin/news/*).
============================================================ */

(function () {
  'use strict';

  let currentParams = {
    page: 1,
    limit: 10,
    search: '',
    status: '',
  };

  async function renderNewsModule(container) {
    container.innerHTML = `
      <div class="page-title-bar">
        <div>
          <h2 class="page-title">News & Updates Management</h2>
          <p class="page-subtitle">Manage homepage news cards, press releases, and team announcements.</p>
        </div>
      </div>

      <div id="newsTableContainer">
        <p style="color:var(--text-muted);">Loading News articles...</p>
      </div>
    `;

    await loadNewsList();
  }

  async function loadNewsList() {
    const tableContainer = document.getElementById('newsTableContainer');
    if (!tableContainer) return;

    try {
      const res = await window.AdminApi.get('/admin/news', currentParams);
      const items = (res.data && res.data) || (res.data || []);
      const meta = res.meta || { page: 1, totalPages: 1, total: items.length };

      window.AdminTable.renderTable({
        container: tableContainer,
        columns: [
          { header: 'Image', key: 'imageUrl' },
          { header: 'Article Title', key: 'title' },
          { header: 'Category', key: 'category' },
          { header: 'Date', key: 'date' },
          { header: 'Status', key: 'status' },
          {
            header: 'Version',
            render: (item) => `<span style="font-family:var(--font-mono);font-size:0.75rem;">v${item.version || 1}</span>`,
          },
        ],
        items,
        meta,
        searchValue: currentParams.search,
        statusFilterValue: currentParams.status,
        onSearch: (val) => {
          currentParams.search = val;
          currentParams.page = 1;
          loadNewsList();
        },
        onStatusFilter: (val) => {
          currentParams.status = val;
          currentParams.page = 1;
          loadNewsList();
        },
        onPageChange: (newPage) => {
          currentParams.page = newPage;
          loadNewsList();
        },
        actions: {
          createBtnLabel: 'Add News Article',
          onCreate: () => openNewsEditor(null),
          onEdit: (id) => openNewsEditor(id),
          onDelete: (id) => handleDelete(id),
          onDuplicate: (id) => handleDuplicate(id),
          onArchive: (id) => handleArchive(id),
          onRestore: (id) => handleRestore(id),
        },
      });
    } catch (err) {
      if (window.AdminToast) {
        window.AdminToast.error('Failed to load News articles: ' + err.message);
      }
    }
  }

  async function openNewsEditor(id = null) {
    let article = {
      title: '',
      category: 'News',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      description: '',
      content: '',
      icon: 'fas fa-newspaper',
      imageUrl: '',
      linkUrl: '',
      version: 1,
      status: 'draft',
    };

    if (id) {
      try {
        const res = await window.AdminApi.get(`/admin/news/${id}`);
        if (res.success && res.data) {
          article = res.data;
        }
      } catch (err) {
        window.AdminToast.error('Failed to fetch article details: ' + err.message);
        return;
      }
    }

    const drawerTitle = id ? `Edit News Article (v${article.version})` : 'New News Article Draft';

    const formContent = `
      <form id="newsEditorForm">
        <div class="form-group">
          <label>Article Title *</label>
          <input type="text" name="title" class="form-input" value="${article.title || ''}" required placeholder="e.g. Formula Bharat 2026 Registration Confirmed" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label>Category Tag</label>
            <input type="text" name="category" class="form-input" value="${article.category || 'News'}" placeholder="e.g. Competition, Workshop, Press" />
          </div>
          <div class="form-group">
            <label>Display Date</label>
            <input type="text" name="date" class="form-input" value="${article.date || ''}" placeholder="e.g. Sept 2026" />
          </div>
        </div>

        <div class="form-group">
          <label>Short Summary / Excerpt *</label>
          <textarea name="description" class="form-textarea" required placeholder="Brief summary displayed on homepage card...">${article.description || ''}</textarea>
        </div>

        <div class="form-group">
          <label>Full Content (Optional)</label>
          <textarea name="content" class="form-textarea" style="min-height:120px;" placeholder="Full article body content...">${article.content || ''}</textarea>
        </div>

        <div class="form-group">
          <label>Article Cover Image</label>
          <div style="display:flex; gap:12px; align-items:center;">
            <div id="newsImagePreview" style="width:64px; height:64px; border-radius:4px; border:1px solid var(--border-hairline); background:#111; overflow:hidden; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              ${article.imageUrl ? `<img src="${article.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />` : `<i class="fas fa-image" style="color:var(--text-muted);"></i>`}
            </div>
            <div style="flex:1;">
              <input type="text" name="imageUrl" id="newsImageUrl" class="form-input" value="${article.imageUrl || ''}" placeholder="https://res.cloudinary.com/..." style="margin-bottom:6px;" />
              <div style="display:flex; gap:8px;">
                <button type="button" class="btn-secondary btn-sm" id="newsPickMediaBtn" style="padding:6px 12px; font-size:12px;">
                  <i class="fas fa-photo-video text-orange"></i> Select from Media Library
                </button>
                <button type="button" class="btn-danger btn-sm" id="newsRemoveMediaBtn" style="padding:6px 12px; font-size:12px; background:rgba(239,68,68,0.15); color:#EF4444; border:1px solid rgba(239,68,68,0.3); border-radius:4px; cursor:pointer;">
                  <i class="fas fa-trash-alt"></i> Remove
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-group">
          <label>Card Icon</label>
          <input type="text" name="icon" class="form-input" value="${article.icon || 'fas fa-newspaper'}" placeholder="fas fa-newspaper" />
        </div>

        <div class="form-group">
          <label>External / Destination Link</label>
          <input type="text" name="linkUrl" class="form-input" value="${article.linkUrl || ''}" placeholder="https://..." />
        </div>
      </form>
    `;

    const livePreviewHtml = `
      <div class="news-card" style="background:var(--panel-dark);padding:16px;border-radius:4px;border:1px solid var(--border-hairline);">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
          <span style="font-family:var(--font-mono);font-size:0.7rem;color:var(--accent-orange);" id="previewCat">${article.category || 'News'}</span>
          <span style="font-size:0.75rem;color:var(--text-muted);" id="previewDate">${article.date || ''}</span>
        </div>
        <h4 style="font-size:0.95rem;margin-bottom:6px;" id="previewTitle">${article.title || 'Article Title'}</h4>
        <p style="font-size:0.82rem;color:var(--text-secondary);" id="previewDesc">${article.description || 'Article short excerpt description...'}</p>
      </div>
    `;

    window.AdminDrawer.openDrawer({
      title: drawerTitle,
      status: article.status || 'draft',
      accordions: [
        {
          title: 'Article Details & Content',
          icon: 'fas fa-pen-to-square',
          content: formContent,
        },
      ],
      previewHtml: livePreviewHtml,
      footerButtons: [
        {
          id: 'btnDrawerCancel',
          label: 'Cancel',
          class: 'btn-secondary',
          onClick: () => window.AdminDrawer.closeDrawer(),
        },
        {
          id: 'btnDrawerSave',
          label: 'Save Draft',
          icon: 'fas fa-floppy-disk',
          class: 'btn-secondary',
          onClick: async () => {
            const formData = getFormData();
            await handleSaveDraft(id, formData, article.version);
          },
        },
        {
          id: 'btnDrawerPublish',
          label: 'Publish to Public Site',
          icon: 'fas fa-paper-plane',
          class: 'btn-primary',
          onClick: async () => {
            const formData = getFormData();
            await handlePublish(id, formData, article.version);
          },
        },
      ],
    });

    // Real-time Live Preview Binding
    const drawerBody = document.getElementById('drawerBody');
    if (drawerBody) {
      drawerBody.querySelector('[name="title"]')?.addEventListener('input', (e) => {
        const p = document.getElementById('previewTitle');
        if (p) p.textContent = e.target.value || 'Article Title';
      });
      drawerBody.querySelector('[name="description"]')?.addEventListener('input', (e) => {
        const p = document.getElementById('previewDesc');
        if (p) p.textContent = e.target.value || 'Article short excerpt description...';
      });
      drawerBody.querySelector('[name="category"]')?.addEventListener('input', (e) => {
        const p = document.getElementById('previewCat');
        if (p) p.textContent = e.target.value || 'News';
      });
      drawerBody.querySelector('[name="date"]')?.addEventListener('input', (e) => {
        const p = document.getElementById('previewDate');
        if (p) p.textContent = e.target.value || '';
      });

      // Wire Media Picker
      drawerBody.querySelector('#newsPickMediaBtn')?.addEventListener('click', () => {
        window.MediaPicker.open({
          allowedType: 'image',
          onSelect: (asset) => {
            const urlInput = drawerBody.querySelector('#newsImageUrl');
            const prevBox = drawerBody.querySelector('#newsImagePreview');
            if (urlInput) urlInput.value = asset.url;
            if (prevBox) prevBox.innerHTML = `<img src="${asset.url}" style="width:100%;height:100%;object-fit:cover;" />`;
            window.AdminDrawer.markDirty();
          },
        });
      });

      // Wire Remove Media Button
      drawerBody.querySelector('#newsRemoveMediaBtn')?.addEventListener('click', () => {
        const urlInput = drawerBody.querySelector('#newsImageUrl');
        const prevBox = drawerBody.querySelector('#newsImagePreview');
        if (urlInput) urlInput.value = '';
        if (prevBox) prevBox.innerHTML = `<i class="fas fa-image" style="color:var(--text-muted);"></i>`;
        window.AdminDrawer.markDirty();
      });
    }
  }

  function getFormData() {
    const drawerBody = document.getElementById('drawerBody');
    return {
      title: drawerBody.querySelector('[name="title"]').value.trim(),
      category: drawerBody.querySelector('[name="category"]').value.trim(),
      date: drawerBody.querySelector('[name="date"]').value.trim(),
      description: drawerBody.querySelector('[name="description"]').value.trim(),
      content: drawerBody.querySelector('[name="content"]').value.trim(),
      icon: drawerBody.querySelector('[name="icon"]').value.trim(),
      imageUrl: drawerBody.querySelector('[name="imageUrl"]').value.trim(),
      linkUrl: drawerBody.querySelector('[name="linkUrl"]').value.trim(),
    };
  }

  async function handleSaveDraft(id, formData, version) {
    if (!formData.title || !formData.description) {
      window.AdminToast.error('Title and Summary are required fields.');
      return;
    }

    try {
      let res;
      if (id) {
        res = await window.AdminApi.patch(`/admin/news/${id}`, { ...formData, version });
      } else {
        res = await window.AdminApi.post('/admin/news', formData);
      }

      if (res.success) {
        window.AdminToast.success('News draft saved successfully!');
        window.AdminDrawer.markClean();
        window.AdminDrawer.closeDrawer(true);
        await loadNewsList();
      }
    } catch (err) {
      if (err.status === 409) {
        window.AdminToast.error('Conflict: This record was modified by another administrator. Please reload.');
      } else {
        window.AdminToast.error('Save failed: ' + err.message);
      }
    }
  }

  async function handlePublish(id, formData, version) {
    if (!formData.title || !formData.description) {
      window.AdminToast.error('Title and Summary are required fields before publishing.');
      return;
    }

    try {
      let targetId = id;
      // First save draft if new or edited
      if (!targetId) {
        const createRes = await window.AdminApi.post('/admin/news', formData);
        targetId = createRes.data._id || createRes.data.id;
      } else {
        await window.AdminApi.patch(`/admin/news/${targetId}`, { ...formData, version });
      }

      // Publish draft
      const pubRes = await window.AdminApi.post(`/admin/news/${targetId}/publish`);

      if (pubRes.success) {
        window.AdminToast.success('News article published to live website!');
        window.AdminDrawer.markClean();
        window.AdminDrawer.closeDrawer(true);
        await loadNewsList();
      }
    } catch (err) {
      window.AdminToast.error('Publish failed: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to permanently delete this news article? This action cannot be undone.')) return;
    try {
      const res = await window.AdminApi.delete(`/admin/news/${id}`);
      if (res.success) {
        if (window.AdminToast) window.AdminToast.success('News article deleted permanently.');
        await loadNewsList();
      } else {
        if (window.AdminToast) window.AdminToast.error(res.message || 'Delete failed.');
      }
    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Delete failed: ' + err.message);
    }
  }

  async function handleDuplicate(id) {
    try {
      const res = await window.AdminApi.post(`/admin/news/${id}/duplicate`);
      if (res.success) {
        window.AdminToast.success('Article duplicated as draft.');
        await loadNewsList();
      }
    } catch (err) {
      window.AdminToast.error('Duplicate failed: ' + err.message);
    }
  }

  async function handleArchive(id) {
    if (!confirm('Are you sure you want to archive this article? It will be removed from public view.')) return;
    try {
      const res = await window.AdminApi.post(`/admin/news/${id}/archive`);
      if (res.success) {
        window.AdminToast.success('Article archived.');
        await loadNewsList();
      }
    } catch (err) {
      window.AdminToast.error('Archive failed: ' + err.message);
    }
  }

  async function handleRestore(id) {
    try {
      const res = await window.AdminApi.post(`/admin/news/${id}/restore`);
      if (res.success) {
        window.AdminToast.success('Article restored to draft status.');
        await loadNewsList();
      }
    } catch (err) {
      window.AdminToast.error('Restore failed: ' + err.message);
    }
  }

  window.AdminNewsModule = { renderNewsModule };
})();
