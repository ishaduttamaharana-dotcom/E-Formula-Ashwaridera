// ============================================================
//  public/admin/js/modules/universalCms.js
//  Universal Content List & Management Screen Module
// ============================================================

window.UniversalCmsModule = {
  currentPage: 1,
  currentSort: 'sortOrder',
  currentOrder: 'asc',
  currentSearch: '',
  currentStatus: 'all',
  selectedIds: new Set(),

  async render(contentTypeSlug) {
    let contentType = null;
    let itemsResponse = null;

    try {
      const typeRes = await window.API.get(`/content-types/${contentTypeSlug}`);
      contentType = typeRes.data;
    } catch (err) {
      console.error('Error fetching content type:', err);
      return `<div class="p-6 text-danger">Content type '${contentTypeSlug}' not found.</div>`;
    }

    try {
      const queryParams = new URLSearchParams({
        page: this.currentPage,
        limit: 15,
        sort: this.currentSort,
        order: this.currentOrder,
        search: this.currentSearch,
        status: this.currentStatus,
      });

      itemsResponse = await window.API.get(`/content-items/admin/${contentTypeSlug}?${queryParams.toString()}`);
    } catch (err) {
      console.error('Error fetching content items:', err);
      itemsResponse = { data: [], total: 0, pages: 1 };
    }

    const items = itemsResponse.data || [];
    const total = itemsResponse.total || 0;
    const pages = itemsResponse.pages || 1;

    return `
      <div class="cms-module-container p-6 bg-gray-50 min-h-full">
        <!-- Module Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-lg shadow-md">
                <i class="fas fa-${contentType.icon || 'folder'}"></i>
              </div>
              <div>
                <h1 class="text-2xl font-bold text-gray-900">${contentType.name}</h1>
                <p class="text-xs text-gray-500">${contentType.description || `Manage ${contentType.pluralName}`}</p>
              </div>
            </div>
          </div>

          <div class="flex gap-2">
            <button type="button" class="btn btn-primary" id="btn_create_new">
              <i class="fas fa-plus me-1"></i> Create New ${contentType.singularName}
            </button>
          </div>
        </div>

        <!-- Toolbar Controls: Search, Filters, Bulk Actions -->
        <div class="cms-card mb-6">
          <div class="cms-card-body p-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <!-- Search & Filters Left -->
            <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div class="relative w-full md:w-64">
                <input type="text" id="cms_search_input" class="form-input ps-9" placeholder="Search ${contentType.pluralName}..." value="${this.currentSearch}" />
                <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
              </div>

              <select id="cms_status_filter" class="form-select w-auto">
                <option value="all" ${this.currentStatus === 'all' ? 'selected' : ''}>All Statuses</option>
                <option value="published" ${this.currentStatus === 'published' ? 'selected' : ''}>Published</option>
                <option value="draft" ${this.currentStatus === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="archived" ${this.currentStatus === 'archived' ? 'selected' : ''}>Archived</option>
              </select>

              <select id="cms_sort_select" class="form-select w-auto">
                <option value="sortOrder" ${this.currentSort === 'sortOrder' ? 'selected' : ''}>Sort Order</option>
                <option value="updatedAt" ${this.currentSort === 'updatedAt' ? 'selected' : ''}>Last Updated</option>
                <option value="title" ${this.currentSort === 'title' ? 'selected' : ''}>Title (A-Z)</option>
              </select>
            </div>

            <!-- Bulk Actions Right -->
            <div class="flex items-center gap-2 w-full md:w-auto justify-end">
              <span class="text-xs text-gray-500 font-semibold" id="selected_count_badge">
                ${this.selectedIds.size} selected
              </span>
              <select id="bulk_action_select" class="form-select form-select-sm w-auto" ${this.selectedIds.size === 0 ? 'disabled' : ''}>
                <option value="">Bulk Actions</option>
                <option value="publish">Publish Selected</option>
                <option value="unpublish">Unpublish Selected</option>
                <option value="delete">Delete Selected</option>
              </select>
              <button type="button" class="btn btn-secondary btn-sm" id="btn_apply_bulk" ${this.selectedIds.size === 0 ? 'disabled' : ''}>
                Apply
              </button>
            </div>
          </div>
        </div>

        <!-- Data Table -->
        <div class="cms-card overflow-hidden">
          <div class="table-responsive">
            <table class="table w-full align-middle">
              <thead class="bg-gray-100 border-b text-xs text-gray-600 uppercase font-semibold">
                <tr>
                  <th class="p-3 text-center w-10">
                    <input type="checkbox" id="select_all_checkbox" ${this.selectedIds.size > 0 && this.selectedIds.size === items.length ? 'checked' : ''} />
                  </th>
                  <th class="p-3">Title / Details</th>
                  <th class="p-3">Category</th>
                  <th class="p-3 text-center">Status</th>
                  <th class="p-3 text-center">Sort Order</th>
                  <th class="p-3 text-center">Updated At</th>
                  <th class="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y text-sm">
                ${items.length === 0 ? `
                  <tr>
                    <td colspan="7" class="p-8 text-center text-gray-500">
                      <i class="fas fa-folder-open text-4xl mb-3 text-gray-300 block"></i>
                      No ${contentType.pluralName} found matching filter criteria.
                    </td>
                  </tr>
                ` : items.map(item => this.renderTableRow(item, contentTypeSlug)).join('')}
              </tbody>
            </table>
          </div>

          <!-- Pagination Footer -->
          <div class="p-4 bg-gray-50 border-t flex flex-col md:flex-row justify-between items-center gap-3">
            <span class="text-xs text-gray-500">
              Showing ${items.length} of ${total} ${contentType.pluralName}
            </span>
            <div class="flex gap-1">
              <button type="button" class="btn btn-outline btn-sm ${this.currentPage === 1 ? 'disabled' : ''}" id="btn_prev_page">
                <i class="fas fa-chevron-left"></i> Previous
              </button>
              <span class="px-3 py-1 text-xs font-semibold flex items-center bg-white border rounded-md">
                Page ${this.currentPage} of ${pages}
              </span>
              <button type="button" class="btn btn-outline btn-sm ${this.currentPage >= pages ? 'disabled' : ''}" id="btn_next_page">
                Next <i class="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderTableRow(item, contentTypeSlug) {
    const isChecked = this.selectedIds.has(item._id);
    const mediaUrl = item.fields?.featuredImage || item.fields?.desktopMedia || item.fields?.coverImage || item.fields?.photo || item.fields?.avatar || item.fields?.image || '';
    const category = item.fields?.category || item.categories?.[0] || '—';
    const dateStr = item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—';

    return `
      <tr class="hover:bg-gray-50 transition-colors">
        <td class="p-3 text-center">
          <input type="checkbox" class="row-select-checkbox" data-id="${item._id}" ${isChecked ? 'checked' : ''} />
        </td>
        <td class="p-3">
          <div class="flex items-center gap-3">
            ${mediaUrl ? `<img src="${mediaUrl}" class="w-10 h-10 rounded-md object-cover border" alt="Thumbnail" />` : `
              <div class="w-10 h-10 rounded-md bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs">
                ${item.title.charAt(0).toUpperCase()}
              </div>
            `}
            <div>
              <a href="#/content/${contentTypeSlug}?edit=${item._id}" class="font-bold text-gray-900 hover:text-primary transition-colors">
                ${this.escapeHtml(item.title)}
              </a>
              ${item.fields?.subtitle ? `<div class="text-xs text-gray-500 line-clamp-1">${this.escapeHtml(item.fields.subtitle)}</div>` : ''}
            </div>
          </div>
        </td>
        <td class="p-3">
          <span class="badge badge-secondary text-xs">${category}</span>
        </td>
        <td class="p-3 text-center">
          <span class="badge ${item.status === 'published' ? 'badge-success' : 'badge-warning'} uppercase text-xs">
            ${item.status}
          </span>
        </td>
        <td class="p-3 text-center font-mono text-xs">${item.sortOrder || 0}</td>
        <td class="p-3 text-center text-xs text-gray-500">${dateStr}</td>
        <td class="p-3 text-right whitespace-nowrap">
          <a href="#/content/${contentTypeSlug}?edit=${item._id}" class="btn-icon text-primary me-1" title="Edit">
            <i class="fas fa-edit"></i>
          </a>
          <button type="button" class="btn-icon text-info me-1 btn-duplicate-row" data-id="${item._id}" title="Duplicate">
            <i class="fas fa-copy"></i>
          </button>
          <button type="button" class="btn-icon text-danger btn-delete-row" data-id="${item._id}" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  },

  escapeHtml(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  bindEvents(container, contentTypeSlug) {
    if (!container) return;

    // Create New Button
    const createBtn = container.querySelector('#btn_create_new');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        window.location.hash = `#/content/${contentTypeSlug}?create=new`;
      });
    }

    // Search Input
    const searchInput = container.querySelector('#cms_search_input');
    if (searchInput) {
      let timeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          this.currentSearch = e.target.value;
          this.currentPage = 1;
          window.location.reload();
        }, 400);
      });
    }

    // Status Filter
    const statusFilter = container.querySelector('#cms_status_filter');
    if (statusFilter) {
      statusFilter.addEventListener('change', (e) => {
        this.currentStatus = e.target.value;
        this.currentPage = 1;
        window.location.reload();
      });
    }

    // Sort Select
    const sortSelect = container.querySelector('#cms_sort_select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.currentSort = e.target.value;
        window.location.reload();
      });
    }

    // Pagination Buttons
    const prevBtn = container.querySelector('#btn_prev_page');
    const nextBtn = container.querySelector('#btn_next_page');
    if (prevBtn) prevBtn.addEventListener('click', () => { if (this.currentPage > 1) { this.currentPage--; window.location.reload(); } });
    if (nextBtn) nextBtn.addEventListener('click', () => { this.currentPage++; window.location.reload(); });

    // Select All Checkbox
    const selectAllCb = container.querySelector('#select_all_checkbox');
    if (selectAllCb) {
      selectAllCb.addEventListener('change', (e) => {
        const rowCbs = container.querySelectorAll('.row-select-checkbox');
        rowCbs.forEach(cb => {
          cb.checked = e.target.checked;
          if (e.target.checked) this.selectedIds.add(cb.dataset.id);
          else this.selectedIds.clear();
        });
        this.updateBulkUI(container);
      });
    }

    // Row Select Checkboxes
    container.querySelectorAll('.row-select-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        if (e.target.checked) this.selectedIds.add(cb.dataset.id);
        else this.selectedIds.delete(cb.dataset.id);
        this.updateBulkUI(container);
      });
    });

    // Row Duplicate Action
    container.querySelectorAll('.btn-duplicate-row').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        try {
          await window.API.post(`/content-items/admin/${contentTypeSlug}/${id}/duplicate`);
          window.location.reload();
        } catch (err) {
          alert('Duplicate failed: ' + (err.message || 'Error'));
        }
      });
    });

    // Row Delete Action
    container.querySelectorAll('.btn-delete-row').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (!confirm('Are you sure you want to delete this item?')) return;
        try {
          await window.API.delete(`/content-items/admin/${contentTypeSlug}/${id}`);
          window.location.reload();
        } catch (err) {
          alert('Delete failed: ' + (err.message || 'Error'));
        }
      });
    });

    // Apply Bulk Action
    const bulkBtn = container.querySelector('#btn_apply_bulk');
    if (bulkBtn) {
      bulkBtn.addEventListener('click', async () => {
        const actionSelect = container.querySelector('#bulk_action_select');
        const action = actionSelect ? actionSelect.value : '';
        if (!action || this.selectedIds.size === 0) return;

        if (action === 'delete' && !confirm(`Are you sure you want to delete ${this.selectedIds.size} items?`)) return;

        try {
          await window.API.post(`/content-items/admin/${contentTypeSlug}/bulk`, {
            ids: Array.from(this.selectedIds),
            action,
          });
          this.selectedIds.clear();
          window.location.reload();
        } catch (err) {
          alert('Bulk action failed: ' + (err.message || 'Error'));
        }
      });
    }
  },

  updateBulkUI(container) {
    const countBadge = container.querySelector('#selected_count_badge');
    const actionSelect = container.querySelector('#bulk_action_select');
    const applyBtn = container.querySelector('#btn_apply_bulk');

    if (countBadge) countBadge.textContent = `${this.selectedIds.size} selected`;
    if (actionSelect) actionSelect.disabled = this.selectedIds.size === 0;
    if (applyBtn) applyBtn.disabled = this.selectedIds.size === 0;
  }
};
