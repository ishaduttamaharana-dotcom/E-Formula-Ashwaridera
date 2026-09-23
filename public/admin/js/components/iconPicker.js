/* ============================================================
   iconPicker.js — FontAwesome Visual Icon Picker Modal Component
   Used across Build Stages, Navigation, and content editors.
============================================================ */

(function () {
  'use strict';

  const COMMON_ICONS = [
    // Engineering & Racing Icons
    'fas fa-wrench', 'fas fa-cogs', 'fas fa-cog', 'fas fa-car', 'fas fa-bolt',
    'fas fa-charging-station', 'fas fa-drafting-compass', 'fas fa-microchip',
    'fas fa-tachometer-alt', 'fas fa-flag-checkered', 'fas fa-battery-full',
    'fas fa-lightbulb', 'fas fa-shield-alt', 'fas fa-tools', 'fas fa-chart-line',
    'fas fa-trophy', 'fas fa-award', 'fas fa-medal', 'fas fa-calendar-alt',
    'fas fa-cubes', 'fas fa-layer-group', 'fas fa-laptop-code', 'fas fa-atom',
    'fas fa-satellite-dish', 'fas fa-sliders-h', 'fas fa-clipboard-check',
    'fas fa-project-diagram', 'fas fa-hammer', 'fas fa-compass', 'fas fa-route',
    'fas fa-stopwatch', 'fas fa-fire', 'fas fa-rocket', 'fas fa-circle-notch',
    'fas fa-star', 'fas fa-check-circle', 'fas fa-info-circle', 'fas fa-exclamation-triangle',
    'fas fa-link', 'fas fa-images', 'fas fa-video', 'fas fa-quote-left', 'fas fa-align-left'
  ];

  function open({ currentIcon = 'fas fa-wrench', onSelect } = {}) {
    const existing = document.getElementById('iconPickerModal');
    if (existing) existing.remove();

    let selectedIcon = currentIcon || 'fas fa-wrench';

    const modalHtml = `
      <div class="ar-cms-modal-overlay ar-open" id="iconPickerModal" style="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.75);z-index:99999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);">
        <div class="ar-cms-modal" style="background:#16161a;border:1px solid var(--border-hairline, #2a2a32);border-radius:8px;width:520px;max-width:92vw;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 20px 40px rgba(0,0,0,0.6);color:#e2e2e8;">
          
          <div style="padding:16px 20px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;border-radius:6px;background:rgba(255,107,0,0.15);color:var(--accent-orange, #ff6b00);display:flex;align-items:center;justify-content:center;font-size:16px;">
                <i class="${selectedIcon}" id="iconPickerSelectedPreview"></i>
              </div>
              <h3 style="margin:0;font-size:1.05rem;font-weight:600;color:#fff;">Select FontAwesome Icon</h3>
            </div>
            <button type="button" id="iconPickerCloseBtn" style="background:none;border:none;color:#8a8a9e;font-size:18px;cursor:pointer;padding:4px;"><i class="fas fa-times"></i></button>
          </div>

          <div style="padding:16px 20px;display:flex;flex-direction:column;gap:12px;overflow:hidden;flex:1;">
            <div style="display:flex;gap:10px;">
              <input type="text" id="iconPickerSearch" class="form-input" placeholder="Search icon (e.g. wrench, car, bolt)..." style="flex:1;" />
              <input type="text" id="iconPickerCustom" class="form-input" value="${selectedIcon}" placeholder="Custom class..." style="width:160px;font-family:var(--font-mono, monospace);font-size:0.8rem;" />
            </div>

            <div id="iconPickerGrid" style="display:grid;grid-template-columns:repeat(auto-fill, minmax(64px, 1fr));gap:8px;max-height:300px;overflow-y:auto;padding:4px;background:#0d0d10;border-radius:6px;border:1px solid rgba(255,255,255,0.05);">
              ${COMMON_ICONS.map(iconClass => renderIconCell(iconClass, selectedIcon)).join('')}
            </div>
          </div>

          <div style="padding:14px 20px;border-top:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:space-between;background:#121215;">
            <span style="font-family:var(--font-mono, monospace);font-size:0.78rem;color:#8a8a9e;" id="iconPickerCurrentLabel">${selectedIcon}</span>
            <div style="display:flex;gap:8px;">
              <button type="button" class="btn-secondary" id="iconPickerCancelBtn">Cancel</button>
              <button type="button" class="btn-primary" id="iconPickerApplyBtn"><i class="fas fa-check"></i> Select Icon</button>
            </div>
          </div>

        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('iconPickerModal');
    const searchInp = modal.querySelector('#iconPickerSearch');
    const customInp = modal.querySelector('#iconPickerCustom');
    const grid = modal.querySelector('#iconPickerGrid');
    const preview = modal.querySelector('#iconPickerSelectedPreview');
    const label = modal.querySelector('#iconPickerCurrentLabel');

    const updateSelection = (iconClass) => {
      selectedIcon = iconClass;
      if (customInp) customInp.value = iconClass;
      if (preview) preview.className = iconClass;
      if (label) label.textContent = iconClass;

      grid.querySelectorAll('.icon-picker-cell').forEach(cell => {
        if (cell.getAttribute('data-icon') === iconClass) {
          cell.style.borderColor = 'var(--accent-orange, #ff6b00)';
          cell.style.background = 'rgba(255,107,0,0.2)';
        } else {
          cell.style.borderColor = 'rgba(255,255,255,0.08)';
          cell.style.background = 'rgba(255,255,255,0.03)';
        }
      });
    };

    const close = () => modal.remove();

    modal.querySelector('#iconPickerCloseBtn').addEventListener('click', close);
    modal.querySelector('#iconPickerCancelBtn').addEventListener('click', close);

    searchInp.addEventListener('input', (e) => {
      const q = e.target.value.toLowerCase().trim();
      const filtered = COMMON_ICONS.filter(ic => ic.toLowerCase().includes(q));
      grid.innerHTML = filtered.map(ic => renderIconCell(ic, selectedIcon)).join('');
      attachGridListeners();
    });

    customInp.addEventListener('input', (e) => {
      updateSelection(e.target.value.trim());
    });

    function attachGridListeners() {
      grid.querySelectorAll('.icon-picker-cell').forEach(cell => {
        cell.addEventListener('click', () => {
          const iconClass = cell.getAttribute('data-icon');
          updateSelection(iconClass);
        });
        cell.addEventListener('dblclick', () => {
          const iconClass = cell.getAttribute('data-icon');
          updateSelection(iconClass);
          if (typeof onSelect === 'function') onSelect(selectedIcon);
          close();
        });
      });
    }

    attachGridListeners();

    modal.querySelector('#iconPickerApplyBtn').addEventListener('click', () => {
      if (typeof onSelect === 'function') {
        onSelect(selectedIcon);
      }
      close();
    });
  }

  function renderIconCell(iconClass, current) {
    const isSelected = iconClass === current;
    const border = isSelected ? 'var(--accent-orange, #ff6b00)' : 'rgba(255,255,255,0.08)';
    const bg = isSelected ? 'rgba(255,107,0,0.2)' : 'rgba(255,255,255,0.03)';
    return `
      <div class="icon-picker-cell" data-icon="${iconClass}" style="height:56px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;background:${bg};border:1px solid ${border};border-radius:4px;cursor:pointer;transition:all 0.15s ease;" title="${iconClass}">
        <i class="${iconClass}" style="font-size:18px;color:#fff;"></i>
        <span style="font-size:9px;color:#8a8a9e;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;padding:0 2px;">${iconClass.replace('fas fa-', '')}</span>
      </div>
    `;
  }

  window.IconPicker = { open };
})();
