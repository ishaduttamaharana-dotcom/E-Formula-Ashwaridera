// ============================================================
//  public/admin/js/modules/globalSearch.js
//  Global Search Autocomplete Component for CMS Header
//  Modern dark Formula Student CMS dashboard interface
// ============================================================

window.GlobalSearchComponent = {
  bind(inputElement, dropdownElement) {
    if (!inputElement || !dropdownElement) return;

    let timeout;
    inputElement.addEventListener('input', (e) => {
      clearTimeout(timeout);
      const query = e.target.value.trim();

      if (query.length < 2) {
        dropdownElement.classList.add('hidden');
        dropdownElement.innerHTML = '';
        return;
      }

      timeout = setTimeout(async () => {
        try {
          const apiObj = window.AdminApi || window.API;
          let res;
          if (apiObj && apiObj.get) {
            res = await apiObj.get(`/content-items/admin/global-search?q=${encodeURIComponent(query)}`);
          } else {
            const raw = await fetch(`/api/v1/content-items/admin/global-search?q=${encodeURIComponent(query)}`);
            res = await raw.json();
          }

          const results = (res && res.data) ? res.data : [];
          this.renderDropdown(dropdownElement, results, query);
        } catch (err) {
          console.error('Global search error:', err);
        }
      }, 300);
    });

    // Keyboard shortcut (Cmd+K / Ctrl+K) to focus search
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputElement.focus();
        inputElement.select();
      }
    });

    document.addEventListener('click', (e) => {
      if (!inputElement.contains(e.target) && !dropdownElement.contains(e.target)) {
        dropdownElement.classList.add('hidden');
      }
    });
  },

  renderDropdown(dropdown, results, query) {
    if (!results || results.length === 0) {
      dropdown.innerHTML = `
        <div style="padding:16px; text-align:center; font-size:0.82rem; color:var(--text-muted, #8E929E);">
          No matching content found for "<strong style="color:#fff;">${this.escapeHtml(query)}</strong>"
        </div>
      `;
      dropdown.classList.remove('hidden');
      return;
    }

    dropdown.innerHTML = `
      <div style="background:var(--card-dark, #15151C); padding:10px 14px; border-bottom:1px solid var(--border-hairline, #262631); font-size:0.75rem; font-weight:700; color:var(--text-muted, #666672); text-transform:uppercase; letter-spacing:0.06em; display:flex; justify-content:space-between; align-items:center;">
        <span><i class="fas fa-search" style="color:var(--accent-orange, #FF5A00); margin-right:6px;"></i> Search Results</span>
        <span style="background:rgba(255,90,0,0.14); color:var(--accent-orange, #FF5A00); padding:2px 8px; border-radius:10px; font-weight:700;">${results.length} found</span>
      </div>
      <div style="max-height:340px; overflow-y:auto;">
        ${results.map(r => `
          <a href="${r.url}" class="global-search-result-item" data-url="${r.url}" style="padding:12px 14px; display:flex; align-items:center; justify-content:space-between; text-decoration:none; border-bottom:1px solid var(--border-hairline, #262631); transition:background 0.18s ease;" onmouseover="this.style.background='rgba(255,90,0,0.06)'" onmouseout="this.style.background='transparent'">
            <div>
              <div style="font-weight:700; font-size:0.86rem; color:var(--text-primary, #F5F5F5);">${this.escapeHtml(r.title)}</div>
              <div style="font-size:0.74rem; color:var(--text-muted, #666672); margin-top:2px;">${r.subtitle ? this.escapeHtml(r.subtitle) : (r.updatedAt ? 'Updated: ' + new Date(r.updatedAt).toLocaleDateString() : 'Admin Navigation')}</div>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              <span style="background:var(--bg-dark, #0B0B0F); border:1px solid var(--border-hairline, #262631); padding:3px 8px; border-radius:4px; font-size:0.7rem; font-weight:700; color:var(--text-secondary, #9A9AA5);">${this.escapeHtml(r.contentTypeName || 'Page')}</span>
              ${r.status ? `<span style="background:${r.status === 'published' || r.status === 'Accepted' || r.status === 'Active' ? 'rgba(46,164,79,0.12)' : 'rgba(255,90,0,0.12)'}; border:1px solid ${r.status === 'published' || r.status === 'Accepted' || r.status === 'Active' ? 'rgba(46,164,79,0.25)' : 'rgba(255,90,0,0.25)'}; color:${r.status === 'published' || r.status === 'Accepted' || r.status === 'Active' ? '#2EA44F' : '#FF5A00'}; padding:3px 8px; border-radius:10px; font-size:0.7rem; font-weight:700;">${r.status}</span>` : ''}
            </div>
          </a>
        `).join('')}
      </div>
    `;
    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('.global-search-result-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const url = item.dataset.url;
        dropdown.classList.add('hidden');
        if (window.AdminRouter && url) {
          window.AdminRouter.navigate(url);
        } else if (url) {
          window.location.href = url;
        }
      });
    });
  },

  escapeHtml(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};
