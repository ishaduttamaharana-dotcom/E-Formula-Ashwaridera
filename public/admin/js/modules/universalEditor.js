// ============================================================
//  public/admin/js/modules/universalEditor.js
//  Universal Content Editor Module
// ============================================================

window.UniversalEditorModule = {
  activeTab: 'fields', // fields, sections, seo, revisions
  sectionsState: [],

  async render(contentTypeSlug, itemId = null) {
    let contentType = null;
    let item = null;

    try {
      const typeRes = await window.API.get(`/content-types/${contentTypeSlug}`);
      contentType = typeRes.data;
    } catch (err) {
      console.error('Error fetching content type:', err);
      return `<div class="p-6 text-danger">Error loading content type definition.</div>`;
    }

    if (itemId) {
      try {
        const itemRes = await window.API.get(`/content-items/admin/${contentTypeSlug}/${itemId}`);
        item = itemRes.data;
        this.sectionsState = item.sections ? JSON.parse(JSON.stringify(item.sections)) : [];
      } catch (err) {
        console.error('Error fetching content item:', err);
      }
    } else {
      this.sectionsState = [];
    }

    const title = item ? item.title : '';
    const status = item ? item.status : 'draft';
    const fieldsData = item ? (item.fields || {}) : {};

    return `
      <div class="universal-editor-container flex flex-col h-full bg-gray-50 text-gray-900">
        <!-- Top Sticky Action Bar -->
        <div class="editor-action-bar flex justify-between items-center px-6 py-4 bg-white border-b sticky top-0 z-30 shadow-sm">
          <div class="flex items-center gap-3">
            <button type="button" class="btn btn-outline btn-sm" id="btn_back_to_list">
              <i class="fas fa-arrow-left me-1"></i> Back
            </button>
            <i class="fas fa-${contentType.icon || 'folder'} text-xl text-primary"></i>
            <div>
              <h2 class="text-xl font-bold leading-tight" id="editor_title_heading">
                ${itemId ? `Edit ${contentType.singularName}` : `Create ${contentType.singularName}`}
              </h2>
              <span class="text-xs text-gray-500">${contentType.name} &bull; ${contentTypeSlug}</span>
            </div>
            <span class="badge ${status === 'published' ? 'badge-success' : 'badge-warning'} ms-2 uppercase tracking-wide text-xs">
              ${status}
            </span>
          </div>

          <div class="editor-action-buttons flex gap-2">
            ${itemId ? `
              <button type="button" class="btn btn-secondary btn-sm" id="btn_duplicate_item" title="Duplicate Item">
                <i class="fas fa-copy me-1"></i> Duplicate
              </button>
            ` : ''}
            <button type="button" class="btn btn-secondary btn-sm" id="btn_save_draft">
              <i class="fas fa-save me-1"></i> Save Draft
            </button>
            <button type="button" class="btn btn-primary btn-sm" id="btn_publish_item">
              <i class="fas fa-paper-plane me-1"></i> Publish
            </button>
            ${itemId ? `
              <button type="button" class="btn btn-danger btn-sm" id="btn_delete_item" title="Delete Item">
                <i class="fas fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Split Screen View: Editor Form Left, Live Preview Right -->
        <div class="editor-split-body flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
          
          <!-- Left Panel: Content Fields & Tabs (7 cols) -->
          <div class="editor-form-panel lg:col-span-7 p-6 overflow-auto border-r bg-white">
            
            <!-- Item Title Field -->
            <div class="form-group mb-6">
              <label class="form-label font-bold text-lg">Title <span class="text-danger">*</span></label>
              <input type="text" id="editor_item_title" class="form-input text-lg font-semibold" 
                value="${FieldRenderer.escapeHtml(title)}" placeholder="Enter ${contentType.singularName} title..." required />
            </div>

            <!-- Tab Navigation Bar -->
            <div class="editor-tabs flex border-b mb-6 gap-4">
              <button type="button" class="editor-tab-btn ${this.activeTab === 'fields' ? 'active' : ''}" data-tab="fields">
                <i class="fas fa-align-left me-1"></i> Content Fields
              </button>
              ${contentType.features?.sections !== false ? `
                <button type="button" class="editor-tab-btn ${this.activeTab === 'sections' ? 'active' : ''}" data-tab="sections">
                  <i class="fas fa-cubes me-1"></i> Visual Sections (${this.sectionsState.length})
                </button>
              ` : ''}
              ${contentType.features?.seo !== false ? `
                <button type="button" class="editor-tab-btn ${this.activeTab === 'seo' ? 'active' : ''}" data-tab="seo">
                  <i class="fas fa-search me-1"></i> SEO & Social
                </button>
              ` : ''}
            </div>

            <!-- Tab Content 1: Dynamic Fields -->
            <div id="tab_content_fields" class="tab-pane ${this.activeTab === 'fields' ? '' : 'hidden'}">
              <form id="universal_fields_form">
                ${(contentType.fields || []).map(f => FieldRenderer.renderField(f, fieldsData[f.key])).join('')}
              </form>
            </div>

            <!-- Tab Content 2: Visual Section Builder -->
            <div id="tab_content_sections" class="tab-pane ${this.activeTab === 'sections' ? '' : 'hidden'}">
              <div id="section_builder_mount">
                ${SectionBuilder.render(this.sectionsState)}
              </div>
            </div>

            <!-- Tab Content 3: SEO Card -->
            <div id="tab_content_seo" class="tab-pane ${this.activeTab === 'seo' ? '' : 'hidden'}">
              <div id="seo_card_mount">
                ${SeoCard.render(item ? item.seo : {}, title)}
              </div>
            </div>

          </div>

          <!-- Right Panel: Real-Time Live Responsive Visual Preview (5 cols) -->
          <div class="editor-preview-panel lg:col-span-5 p-4 bg-gray-950 overflow-hidden flex flex-col">
            <div id="live_preview_mount" class="h-full">
              ${LivePreviewModule.render(contentTypeSlug, item || { title, fields: fieldsData })}
            </div>
          </div>

        </div>
      </div>
    `;
  },

  bindEvents(container, contentTypeSlug, itemId = null) {
    if (!container) return;

    const backBtn = container.querySelector('#btn_back_to_list');
    const saveDraftBtn = container.querySelector('#btn_save_draft');
    const publishBtn = container.querySelector('#btn_publish_item');
    const duplicateBtn = container.querySelector('#btn_duplicate_item');
    const deleteBtn = container.querySelector('#btn_delete_item');

    if (backBtn) backBtn.addEventListener('click', () => window.location.hash = `#/content/${contentTypeSlug}`);

    // Tab switching
    container.querySelectorAll('.editor-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        container.querySelectorAll('.editor-tab-btn').forEach(b => b.classList.remove('active'));
        container.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));

        btn.classList.add('active');
        const targetPane = container.querySelector(`#tab_content_${this.activeTab}`);
        if (targetPane) targetPane.classList.remove('hidden');
      });
    });

    // Real-time Live Preview Updates
    const titleInput = container.querySelector('#editor_item_title');
    const updatePreview = () => {
      const data = this.getFormData(container);
      LivePreviewModule.updateLivePreview(container, contentTypeSlug, data);
    };

    if (titleInput) titleInput.addEventListener('input', updatePreview);

    FieldRenderer.bindFieldEvents(container.querySelector('#universal_fields_form'), updatePreview);
    SectionBuilder.bindEvents(container.querySelector('#section_builder_mount'), this.sectionsState, updatePreview);
    SeoCard.bindEvents(container.querySelector('#seo_card_mount'), updatePreview);
    LivePreviewModule.bindEvents(container.querySelector('#live_preview_mount'), contentTypeSlug, () => this.getFormData(container));

    // Save Draft Action
    if (saveDraftBtn) {
      saveDraftBtn.addEventListener('click', () => this.saveItem(container, contentTypeSlug, itemId, false));
    }

    // Publish Action
    if (publishBtn) {
      publishBtn.addEventListener('click', () => this.saveItem(container, contentTypeSlug, itemId, true));
    }

    // Duplicate Action
    if (duplicateBtn) {
      duplicateBtn.addEventListener('click', async () => {
        if (!itemId) return;
        try {
          const res = await window.API.post(`/content-items/admin/${contentTypeSlug}/${itemId}/duplicate`);
          window.location.hash = `#/content/${contentTypeSlug}?edit=${res.data._id}`;
        } catch (err) {
          alert('Duplicate failed: ' + (err.message || 'Error duplicating item'));
        }
      });
    }

    // Delete Action
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (!itemId || !confirm('Are you sure you want to delete this content item?')) return;
        try {
          await window.API.delete(`/content-items/admin/${contentTypeSlug}/${itemId}`);
          window.location.hash = `#/content/${contentTypeSlug}`;
        } catch (err) {
          alert('Delete failed: ' + (err.message || 'Error deleting item'));
        }
      });
    }
  },

  getFormData(container) {
    const titleInput = container.querySelector('#editor_item_title');
    const title = titleInput ? titleInput.value : '';

    const fields = {};
    const form = container.querySelector('#universal_fields_form');
    if (form) {
      const formData = new FormData(form);
      for (const [k, v] of formData.entries()) {
        fields[k] = v;
      }
      form.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        fields[cb.name] = cb.checked;
      });
    }

    const seo = SeoCard.getValues(container.querySelector('#seo_card_mount'));

    return {
      title,
      fields,
      sections: this.sectionsState,
      seo,
    };
  },

  async saveItem(container, contentTypeSlug, itemId, publish = false) {
    const data = this.getFormData(container);
    if (!data.title) {
      alert('Please enter a title for this item.');
      return;
    }

    const payload = {
      ...data,
      status: publish ? 'published' : 'draft',
      publish,
    };

    try {
      let res;
      if (itemId) {
        res = await window.API.put(`/content-items/admin/${contentTypeSlug}/${itemId}`, payload);
      } else {
        res = await window.API.post(`/content-items/admin/${contentTypeSlug}`, payload);
      }

      alert(publish ? 'Published successfully!' : 'Draft saved successfully!');
      window.location.hash = `#/content/${contentTypeSlug}`;
    } catch (err) {
      alert('Save failed: ' + (err.message || 'Error saving item'));
    }
  }
};
