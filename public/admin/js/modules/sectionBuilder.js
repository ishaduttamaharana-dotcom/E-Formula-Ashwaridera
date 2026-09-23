// ============================================================
//  public/admin/js/modules/sectionBuilder.js
//  Visual Page Section Builder Module
// ============================================================

window.SectionBuilder = {
  sectionTypes: [
    { type: 'hero', label: 'Hero Banner', icon: 'image' },
    { type: 'text', label: 'Rich Text Block', icon: 'font' },
    { type: 'image', label: 'Single Image', icon: 'file-image' },
    { type: 'video', label: 'Video Player', icon: 'video' },
    { type: 'gallery', label: 'Image Gallery', icon: 'images' },
    { type: 'two_col', label: 'Two Column Cards', icon: 'columns' },
    { type: 'three_col', label: 'Three Column Cards', icon: 'th-large' },
    { type: 'testimonials', label: 'Testimonials Slider', icon: 'quote-left' },
    { type: 'services', label: 'Services Grid', icon: 'wrench' },
    { type: 'projects', label: 'Projects Showcase', icon: 'rocket' },
    { type: 'cta', label: 'Call To Action', icon: 'bullhorn' },
    { type: 'faq', label: 'FAQ Accordion', icon: 'question-circle' },
    { type: 'logo_strip', label: 'Sponsor Marquee', icon: 'award' },
    { type: 'custom_html', label: 'Custom HTML', icon: 'code' },
    { type: 'spacer', label: 'Spacer / Divider', icon: 'arrows-alt-v' },
  ],

  render(sections = []) {
    return `
      <div class="section-builder-wrapper">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-lg font-bold"><i class="fas fa-cubes text-primary me-2"></i> Visual Page Sections</h3>
          <button type="button" class="btn btn-primary btn-sm" id="btn_add_section">
            <i class="fas fa-plus me-1"></i> Add Section
          </button>
        </div>

        <div id="section_list_container" class="section-list-container">
          ${sections.length === 0 ? `
            <div class="empty-sections-placeholder">
              <i class="fas fa-layer-group text-3xl mb-2 text-gray-400"></i>
              <p class="text-gray-500 text-sm">No sections added yet. Click "Add Section" to build your custom page layout.</p>
            </div>
          ` : sections.map((sec, idx) => this.renderSectionCard(sec, idx)).join('')}
        </div>

        <!-- Add Section Modal -->
        <div id="add_section_modal" class="modal-overlay hidden">
          <div class="modal-content max-w-2xl">
            <div class="modal-header">
              <h4>Choose Section Component</h4>
              <button type="button" class="close-modal-btn">&times;</button>
            </div>
            <div class="modal-body grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
              ${this.sectionTypes.map(st => `
                <button type="button" class="section-type-picker-btn" data-type="${st.type}">
                  <i class="fas fa-${st.icon} text-2xl text-primary mb-2"></i>
                  <span class="font-semibold text-sm">${st.label}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderSectionCard(sec, idx) {
    const st = this.sectionTypes.find(s => s.type === sec.type) || { label: sec.type, icon: 'square' };
    return `
      <div class="section-card ${sec.hidden ? 'section-hidden' : ''}" data-index="${idx}" data-id="${sec.id || idx}">
        <div class="section-card-header flex justify-between items-center cursor-move">
          <div class="flex items-center gap-2">
            <i class="fas fa-grip-vertical text-gray-400 drag-handle"></i>
            <i class="fas fa-${st.icon} text-primary"></i>
            <span class="font-bold text-sm">${st.label}</span>
            <span class="text-xs text-gray-400">(${sec.settings?.layout || 'contained'})</span>
          </div>
          <div class="section-card-actions flex gap-2">
            <button type="button" class="btn-icon btn-toggle-hide" title="${sec.hidden ? 'Show' : 'Hide'}">
              <i class="fas fa-${sec.hidden ? 'eye-slash' : 'eye'}"></i>
            </button>
            <button type="button" class="btn-icon btn-duplicate-sec" title="Duplicate">
              <i class="fas fa-copy"></i>
            </button>
            <button type="button" class="btn-icon btn-delete-sec text-danger" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
        <div class="section-card-body p-3">
          <div class="form-group mb-2">
            <label class="form-label text-xs">Section Title</label>
            <input type="text" class="form-input form-input-sm sec-title-input" value="${sec.title || ''}" placeholder="Section Title..." />
          </div>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div>
              <label class="form-label">Layout</label>
              <select class="form-select form-select-sm sec-layout-select">
                <option value="contained" ${sec.settings?.layout === 'contained' ? 'selected' : ''}>Contained</option>
                <option value="full_width" ${sec.settings?.layout === 'full_width' ? 'selected' : ''}>Full Width</option>
                <option value="2_col" ${sec.settings?.layout === '2_col' ? 'selected' : ''}>2 Columns</option>
                <option value="3_col" ${sec.settings?.layout === '3_col' ? 'selected' : ''}>3 Columns</option>
                <option value="grid" ${sec.settings?.layout === 'grid' ? 'selected' : ''}>Grid</option>
              </select>
            </div>
            <div>
              <label class="form-label">BG Color</label>
              <input type="color" class="form-color-picker sec-bg-color" value="${sec.settings?.backgroundColor || '#ffffff'}" />
            </div>
            <div>
              <label class="form-label">Padding Top</label>
              <input type="text" class="form-input form-input-sm sec-pt-input" value="${sec.settings?.paddingTop || '40px'}" />
            </div>
            <div>
              <label class="form-label">Padding Bottom</label>
              <input type="text" class="form-input form-input-sm sec-pb-input" value="${sec.settings?.paddingBottom || '40px'}" />
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(container, sectionsState, onChangeCallback) {
    if (!container) return;

    const modal = container.querySelector('#add_section_modal');
    const addBtn = container.querySelector('#btn_add_section');

    if (addBtn && modal) {
      addBtn.addEventListener('click', () => modal.classList.remove('hidden'));
      modal.querySelectorAll('.close-modal-btn').forEach(b => b.addEventListener('click', () => modal.classList.add('hidden')));

      modal.querySelectorAll('.section-type-picker-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const type = btn.dataset.type;
          sectionsState.push({
            id: 'sec_' + Date.now(),
            type,
            title: `New ${type.toUpperCase()} Section`,
            content: {},
            settings: { layout: 'contained', backgroundColor: '#ffffff', paddingTop: '40px', paddingBottom: '40px' },
            hidden: false,
          });
          modal.classList.add('hidden');
          this.reRenderList(container, sectionsState);
          if (onChangeCallback) onChangeCallback();
        });
      });
    }

    this.bindCardActions(container, sectionsState, onChangeCallback);
  },

  reRenderList(container, sectionsState) {
    const list = container.querySelector('#section_list_container');
    if (!list) return;
    if (sectionsState.length === 0) {
      list.innerHTML = `
        <div class="empty-sections-placeholder">
          <i class="fas fa-layer-group text-3xl mb-2 text-gray-400"></i>
          <p class="text-gray-500 text-sm">No sections added yet. Click "Add Section" to build your custom page layout.</p>
        </div>
      `;
      return;
    }
    list.innerHTML = sectionsState.map((sec, idx) => this.renderSectionCard(sec, idx)).join('');
  },

  bindCardActions(container, sectionsState, onChangeCallback) {
    container.querySelectorAll('.section-card').forEach((card, idx) => {
      const titleInput = card.querySelector('.sec-title-input');
      const layoutSelect = card.querySelector('.sec-layout-select');
      const bgInput = card.querySelector('.sec-bg-color');
      const ptInput = card.querySelector('.sec-pt-input');
      const pbInput = card.querySelector('.sec-pb-input');

      if (titleInput) titleInput.addEventListener('input', () => { sectionsState[idx].title = titleInput.value; onChangeCallback(); });
      if (layoutSelect) layoutSelect.addEventListener('change', () => { sectionsState[idx].settings.layout = layoutSelect.value; onChangeCallback(); });
      if (bgInput) bgInput.addEventListener('input', () => { sectionsState[idx].settings.backgroundColor = bgInput.value; onChangeCallback(); });
      if (ptInput) ptInput.addEventListener('input', () => { sectionsState[idx].settings.paddingTop = ptInput.value; onChangeCallback(); });
      if (pbInput) pbInput.addEventListener('input', () => { sectionsState[idx].settings.paddingBottom = pbInput.value; onChangeCallback(); });

      // Action buttons
      const deleteBtn = card.querySelector('.btn-delete-sec');
      const duplicateBtn = card.querySelector('.btn-duplicate-sec');
      const toggleHideBtn = card.querySelector('.btn-toggle-hide');

      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          sectionsState.splice(idx, 1);
          this.reRenderList(container, sectionsState);
          this.bindCardActions(container, sectionsState, onChangeCallback);
          onChangeCallback();
        });
      }

      if (duplicateBtn) {
        duplicateBtn.addEventListener('click', () => {
          const dup = JSON.parse(JSON.stringify(sectionsState[idx]));
          dup.id = 'sec_' + Date.now();
          dup.title = `${dup.title} (Copy)`;
          sectionsState.splice(idx + 1, 0, dup);
          this.reRenderList(container, sectionsState);
          this.bindCardActions(container, sectionsState, onChangeCallback);
          onChangeCallback();
        });
      }

      if (toggleHideBtn) {
        toggleHideBtn.addEventListener('click', () => {
          sectionsState[idx].hidden = !sectionsState[idx].hidden;
          this.reRenderList(container, sectionsState);
          this.bindCardActions(container, sectionsState, onChangeCallback);
          onChangeCallback();
        });
      }
    });
  }
};
