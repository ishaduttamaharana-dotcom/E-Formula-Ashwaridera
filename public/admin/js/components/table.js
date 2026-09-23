/* ============================================================
   table.js — Reusable Data Table Component
   Supports pagination, search, status badges, and action triggers.
============================================================ */

(function () {
  'use strict';

  function renderTable({
    container,
    columns,
    items = [],
    meta = {},
    onPageChange,
    onSearch,
    onStatusFilter,
    actions = {},
    statusFilterValue = '',
    searchValue = '',
  }) {
    if (!container) return;

    const page = meta.page || 1;
    const totalPages = meta.totalPages || 1;
    const total = meta.total || items.length;

    let html = `
      <div class="table-toolbar">
        <div class="toolbar-filters">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" id="tableSearchInput" class="form-input" placeholder="Search..." value="${searchValue}" />
          </div>
          <select id="tableStatusSelect" class="form-select" style="max-width: 160px;">
            <option value="">All Statuses</option>
            <option value="published" ${statusFilterValue === 'published' ? 'selected' : ''}>Published</option>
            <option value="draft" ${statusFilterValue === 'draft' ? 'selected' : ''}>Draft</option>
            <option value="archived" ${statusFilterValue === 'archived' ? 'selected' : ''}>Archived</option>
          </select>
        </div>
        ${actions.createBtnLabel ? `<button class="btn btn-primary btn-sm" id="tableCreateBtn"><i class="fas fa-plus"></i> ${actions.createBtnLabel}</button>` : ''}
      </div>

      <div class="table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              ${columns.map((c) => `<th>${c.header}</th>`).join('')}
              <th style="text-align:right;">Actions</th>
            </tr>
          </thead>
          <tbody>
    `;

    if (items.length === 0) {
      html += `
        <tr>
          <td colspan="${columns.length + 1}" style="text-align:center;padding:40px;color:var(--text-muted);">
            <i class="fas fa-inbox" style="font-size:2rem;margin-bottom:10px;display:block;"></i>
            No records found matching current criteria.
          </td>
        </tr>
      `;
    } else {
      items.forEach((item) => {
        const id = item._id || item.id;
        const status = item.status || 'draft';

        html += `<tr data-id="${id}">`;

        columns.forEach((col) => {
          let cellContent = '';
          if (col.render) {
            cellContent = col.render(item);
          } else if (col.key === 'status') {
            cellContent = `<span class="status-badge status-badge--${status}"><span class="dot"></span> ${status}</span>`;
          } else if (col.key === 'imageUrl' || col.key === 'coverImageUrl') {
            const url = item[col.key] || '';
            cellContent = url ? `<img src="${url}" class="table-thumb" alt="Thumb" />` : '<span style="color:var(--text-muted);">-</span>';
          } else {
            cellContent = item[col.key] !== undefined && item[col.key] !== null ? item[col.key] : '-';
          }
          html += `<td>${cellContent}</td>`;
        });

        // Action Buttons
        html += `<td style="text-align:right;"><div class="table-actions" style="justify-content:flex-end; gap:6px;">`;
        if (actions.onEdit) {
          html += `<button class="action-btn btn-edit-action" data-id="${id}" title="Edit Draft"><i class="fas fa-pen"></i></button>`;
        }
        if (actions.onDelete) {
          html += `<button class="action-btn btn-delete-action" data-id="${id}" title="Delete Record" style="color:#FF4D4D; border-color:rgba(255,77,77,0.3); background:rgba(255,77,77,0.1);"><i class="fas fa-trash-alt"></i></button>`;
        }
        if (actions.onDuplicate && status !== 'archived') {
          html += `<button class="action-btn btn-dup-action" data-id="${id}" title="Duplicate as Draft"><i class="fas fa-copy"></i></button>`;
        }
        if (actions.onArchive && status !== 'archived') {
          html += `<button class="action-btn btn-archive-action" data-id="${id}" title="Archive Record"><i class="fas fa-box-archive"></i></button>`;
        }
        if (actions.onRestore && status === 'archived') {
          html += `<button class="action-btn btn-restore-action" data-id="${id}" title="Restore to Draft"><i class="fas fa-rotate-left"></i></button>`;
        }
        html += `</div></td></tr>`;
      });
    }

    html += `
          </tbody>
        </table>

        <div class="pagination-bar">
          <span>Showing page ${page} of ${totalPages} (${total} total records)</span>
          <div class="pagination-controls">
            <button class="btn btn-secondary btn-sm" id="prevPageBtn" ${page <= 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i> Prev</button>
            <button class="btn btn-secondary btn-sm" id="nextPageBtn" ${page >= totalPages ? 'disabled' : ''}>Next <i class="fas fa-chevron-right"></i></button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;

    // Attach Event Listeners
    const searchInput = container.querySelector('#tableSearchInput');
    let debounceTimer;
    if (searchInput && onSearch) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => onSearch(e.target.value), 350);
      });
    }

    const statusSelect = container.querySelector('#tableStatusSelect');
    if (statusSelect && onStatusFilter) {
      statusSelect.addEventListener('change', (e) => onStatusFilter(e.target.value));
    }

    const createBtn = container.querySelector('#tableCreateBtn');
    if (createBtn && actions.onCreate) {
      createBtn.addEventListener('click', actions.onCreate);
    }

    const prevBtn = container.querySelector('#prevPageBtn');
    if (prevBtn && onPageChange && page > 1) {
      prevBtn.addEventListener('click', () => onPageChange(page - 1));
    }

    const nextBtn = container.querySelector('#nextPageBtn');
    if (nextBtn && onPageChange && page < totalPages) {
      nextBtn.addEventListener('click', () => onPageChange(page + 1));
    }

    // Row Action Clicks
    container.querySelectorAll('.btn-edit-action').forEach((b) => {
      b.addEventListener('click', () => actions.onEdit(b.getAttribute('data-id')));
    });
    container.querySelectorAll('.btn-delete-action').forEach((b) => {
      b.addEventListener('click', () => actions.onDelete(b.getAttribute('data-id')));
    });
    container.querySelectorAll('.btn-dup-action').forEach((b) => {
      b.addEventListener('click', () => actions.onDuplicate(b.getAttribute('data-id')));
    });
    container.querySelectorAll('.btn-archive-action').forEach((b) => {
      b.addEventListener('click', () => actions.onArchive(b.getAttribute('data-id')));
    });
    container.querySelectorAll('.btn-restore-action').forEach((b) => {
      b.addEventListener('click', () => actions.onRestore(b.getAttribute('data-id')));
    });
  }

  window.AdminTable = { renderTable };
})();
