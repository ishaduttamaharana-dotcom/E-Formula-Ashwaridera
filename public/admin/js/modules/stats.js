/* ============================================================
   stats.js — Homepage Statistics Counters Module
   Connected to /api/v1/admin/stats REST APIs.
============================================================ */

(function () {
  'use strict';

  let currentParams = {
    page: 1,
    limit: 10,
    search: '',
    status: '',
  };

  async function renderStatsModule(container) {
    container.innerHTML = `
      <div class="page-title-bar">
        <div>
          <h2 class="page-title">Homepage Statistics Strip</h2>
          <p class="page-subtitle">Manage numerical team statistics, display labels, suffixes, and display ordering.</p>
        </div>
      </div>

      <div id="statsTableContainer">
        <p style="color:var(--text-muted);">Loading Statistics...</p>
      </div>
    `;

    await loadStatsList();
  }

  async function loadStatsList() {
    const tableContainer = document.getElementById('statsTableContainer');
    if (!tableContainer) return;

    try {
      const res = await window.AdminApi.get('/admin/stats', currentParams);
      const items = (res.data && res.data) || (res.data || []);
      const meta = res.meta || { page: 1, totalPages: 1, total: items.length };

      window.AdminTable.renderTable({
        container: tableContainer,
        columns: [
          { header: 'Stat Label', key: 'label' },
          {
            header: 'Numeric Value',
            render: (item) => `<strong style="font-family:var(--font-mono);font-size:1.1rem;color:var(--accent-orange);">${item.value} ${item.suffix || ''}</strong>`,
          },
          { header: 'Status', key: 'status' },
          {
            header: 'Order',
            render: (item) => `<span style="font-family:var(--font-mono);font-size:0.75rem;">#${item.order || 1}</span>`,
          },
        ],
        items,
        meta,
        searchValue: currentParams.search,
        statusFilterValue: currentParams.status,
        onSearch: (val) => {
          currentParams.search = val;
          currentParams.page = 1;
          loadStatsList();
        },
        onStatusFilter: (val) => {
          currentParams.status = val;
          currentParams.page = 1;
          loadStatsList();
        },
        onPageChange: (newPage) => {
          currentParams.page = newPage;
          loadStatsList();
        },
        actions: {
          createBtnLabel: 'Add Stat Counter Draft',
          onCreate: () => openStatEditor(null),
          onEdit: (id) => openStatEditor(id),
          onDelete: (id) => handleDelete(id),
          onDuplicate: (id) => handleDuplicate(id),
          onArchive: (id) => handleArchive(id),
          onRestore: (id) => handleRestore(id),
        },
      });
    } catch (err) {
      if (window.AdminToast) {
        window.AdminToast.error('Failed to load Statistics: ' + err.message);
      }
    }
  }

  async function openStatEditor(id = null) {
    let stat = {
      label: '',
      value: '0',
      suffix: '+',
      order: 1,
      version: 1,
      status: 'draft',
    };

    if (id) {
      try {
        const res = await window.AdminApi.get(`/admin/stats/${id}`);
        if (res.success && res.data) {
          stat = res.data;
        }
      } catch (err) {
        window.AdminToast.error('Failed to fetch stat details: ' + err.message);
        return;
      }
    }

    const drawerTitle = id ? `Edit Stat Counter (v${stat.version})` : 'New Stat Counter Draft';

    const formContent = `
      <form id="statEditorForm">
        <div class="form-group">
          <label>Stat Label *</label>
          <input type="text" name="label" class="form-input" value="${stat.label || ''}" required placeholder="e.g. TEAM MEMBERS" />
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div class="form-group">
            <label>Numerical Value *</label>
            <input type="text" name="value" class="form-input" value="${stat.value || '0'}" required placeholder="e.g. 25" />
          </div>
          <div class="form-group">
            <label>Display Suffix (Optional)</label>
            <input type="text" name="suffix" class="form-input" value="${stat.suffix || ''}" placeholder="e.g. + or hrs" />
          </div>
        </div>

        <div class="form-group">
          <label>Display Order</label>
          <input type="number" name="order" class="form-input" value="${stat.order || 1}" min="1" />
        </div>
      </form>
    `;

    const livePreviewHtml = `
      <div style="background:var(--panel-dark);padding:20px;border-radius:4px;border:1px solid var(--border-hairline);text-align:center;">
        <div style="font-family:var(--font-mono);font-size:2rem;font-weight:700;color:var(--accent-orange);" id="prevStatVal">${stat.value || '0'}${stat.suffix || ''}</div>
        <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);text-transform:uppercase;margin-top:4px;" id="prevStatLabel">${stat.label || 'STAT LABEL'}</div>
      </div>
    `;

    window.AdminDrawer.openDrawer({
      title: drawerTitle,
      status: stat.status || 'draft',
      accordions: [
        {
          title: 'Stat Counter Parameters',
          icon: 'fas fa-chart-line',
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
            await handleSaveDraft(id, formData, stat.version);
          },
        },
        {
          id: 'btnDrawerPublish',
          label: 'Publish to Website',
          icon: 'fas fa-paper-plane',
          class: 'btn-primary',
          onClick: async () => {
            const formData = getFormData();
            await handlePublish(id, formData, stat.version);
          },
        },
      ],
    });

    const drawerBody = document.getElementById('drawerBody');
    if (drawerBody) {
      drawerBody.querySelector('[name="label"]')?.addEventListener('input', (e) => {
        const p = document.getElementById('prevStatLabel');
        if (p) p.textContent = e.target.value || 'STAT LABEL';
      });
      drawerBody.querySelector('[name="value"]')?.addEventListener('input', (e) => {
        const p = document.getElementById('prevStatVal');
        const s = drawerBody.querySelector('[name="suffix"]').value || '';
        if (p) p.textContent = `${e.target.value || '0'}${s}`;
      });
    }
  }

  function getFormData() {
    const drawerBody = document.getElementById('drawerBody');
    return {
      label: drawerBody.querySelector('[name="label"]').value.trim(),
      value: drawerBody.querySelector('[name="value"]').value.trim(),
      suffix: drawerBody.querySelector('[name="suffix"]').value.trim(),
      order: Number(drawerBody.querySelector('[name="order"]').value),
    };
  }

  async function handleSaveDraft(id, formData, version) {
    if (!formData.label || !formData.value) {
      window.AdminToast.error('Label and Value are required.');
      return;
    }

    try {
      let res;
      if (id) {
        res = await window.AdminApi.patch(`/admin/stats/${id}`, { ...formData, version });
      } else {
        res = await window.AdminApi.post('/admin/stats', formData);
      }

      if (res.success) {
        window.AdminToast.success('Stat counter draft saved!');
        window.AdminDrawer.markClean();
        window.AdminDrawer.closeDrawer(true);
        await loadStatsList();
      }
    } catch (err) {
      window.AdminToast.error('Save failed: ' + err.message);
    }
  }

  async function handlePublish(id, formData, version) {
    if (!formData.label || !formData.value) {
      window.AdminToast.error('Label and Value are required before publishing.');
      return;
    }

    try {
      let targetId = id;
      if (!targetId) {
        const createRes = await window.AdminApi.post('/admin/stats', formData);
        targetId = createRes.data._id || createRes.data.id;
      } else {
        await window.AdminApi.patch(`/admin/stats/${targetId}`, { ...formData, version });
      }

      const pubRes = await window.AdminApi.post(`/admin/stats/${targetId}/publish`);

      if (pubRes.success) {
        window.AdminToast.success('Stat counter published to website!');
        window.AdminDrawer.markClean();
        window.AdminDrawer.closeDrawer(true);
        await loadStatsList();
      }
    } catch (err) {
      window.AdminToast.error('Publish failed: ' + err.message);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to permanently delete this stat counter? This action cannot be undone.')) return;
    try {
      const res = await window.AdminApi.delete(`/admin/stats/${id}`);
      if (res.success) {
        if (window.AdminToast) window.AdminToast.success('Stat counter deleted permanently.');
        await loadStatsList();
      } else {
        if (window.AdminToast) window.AdminToast.error(res.message || 'Delete failed.');
      }
    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Delete failed: ' + err.message);
    }
  }

  async function handleDuplicate(id) {
    try {
      const res = await window.AdminApi.post(`/admin/stats/${id}/duplicate`);
      if (res.success) {
        window.AdminToast.success('Stat counter duplicated as draft.');
        await loadStatsList();
      }
    } catch (err) {
      window.AdminToast.error('Duplicate failed: ' + err.message);
    }
  }

  async function handleArchive(id) {
    if (!confirm('Are you sure you want to archive this stat counter?')) return;
    try {
      const res = await window.AdminApi.post(`/admin/stats/${id}/archive`);
      if (res.success) {
        window.AdminToast.success('Stat counter archived.');
        await loadStatsList();
      }
    } catch (err) {
      window.AdminToast.error('Archive failed: ' + err.message);
    }
  }

  async function handleRestore(id) {
    try {
      const res = await window.AdminApi.post(`/admin/stats/${id}/restore`);
      if (res.success) {
        window.AdminToast.success('Stat counter restored to draft.');
        await loadStatsList();
      }
    } catch (err) {
      window.AdminToast.error('Restore failed: ' + err.message);
    }
  }

  window.AdminStatsModule = { renderStatsModule };
})();
