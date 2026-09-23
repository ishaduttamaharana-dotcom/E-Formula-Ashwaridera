// ============================================================
//  public/admin/js/modules/contentTypeBuilder.js
//  Custom Content Type Builder UI Module
// ============================================================

window.ContentTypeBuilderModule = {
  customFields: [],

  async render() {
    let contentTypes = [];
    try {
      const res = await window.API.get('/content-types');
      contentTypes = res.data || [];
    } catch (err) {
      console.error('Error loading content types:', err);
    }

    return `
      <div class="content-type-builder-container p-6 bg-gray-50 min-h-full">
        <!-- Header -->
        <div class="flex justify-between items-center mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <i class="fas fa-tools text-primary"></i> Custom Content Type Builder
            </h1>
            <p class="text-xs text-gray-500">Define custom content structures, fields, and options without writing code</p>
          </div>
          <button type="button" class="btn btn-primary" id="btn_open_create_type_modal">
            <i class="fas fa-plus me-1"></i> Create Custom Content Type
          </button>
        </div>

        <!-- Existing Content Types Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          ${contentTypes.map(ct => `
            <div class="cms-card p-4 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div class="flex justify-between items-start mb-2">
                  <div class="flex items-center gap-2">
                    <i class="fas fa-${ct.icon || 'folder'} text-xl text-primary"></i>
                    <h3 class="font-bold text-gray-900">${ct.name}</h3>
                  </div>
                  <span class="badge ${ct.isSystem ? 'badge-secondary' : 'badge-accent'} text-xs">
                    ${ct.isSystem ? 'System' : 'Custom'}
                  </span>
                </div>
                <p class="text-xs text-gray-500 mb-3">${ct.description || 'No description provided.'}</p>
                <div class="text-xs font-mono text-gray-600 bg-gray-100 p-1.5 rounded mb-3">
                  slug: ${ct.slug} &bull; ${ct.fields?.length || 0} fields
                </div>
              </div>
              <div class="flex justify-between items-center border-t pt-3 mt-2">
                <a href="#/content/${ct.slug}" class="text-xs text-primary font-bold hover:underline">
                  View Management List &rarr;
                </a>
                ${!ct.isSystem ? `
                  <button type="button" class="btn-icon text-danger btn-delete-custom-type" data-slug="${ct.slug}" title="Delete Content Type">
                    <i class="fas fa-trash"></i>
                  </button>
                ` : ''}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Create Content Type Modal -->
        <div id="create_content_type_modal" class="modal-overlay hidden">
          <div class="modal-content max-w-3xl">
            <div class="modal-header">
              <h4 class="text-lg font-bold"><i class="fas fa-cubes text-primary me-2"></i> Create Custom Content Type</h4>
              <button type="button" class="close-modal-btn">&times;</button>
            </div>
            <div class="modal-body p-6 overflow-auto max-h-[80vh]">
              <form id="create_content_type_form">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div class="form-group">
                    <label class="form-label">Display Name <span class="text-danger">*</span></label>
                    <input type="text" id="type_name" class="form-input" placeholder="e.g. Restaurants, Podcasts" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Singular Name <span class="text-danger">*</span></label>
                    <input type="text" id="type_singular" class="form-input" placeholder="e.g. Restaurant, Podcast" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Plural Name <span class="text-danger">*</span></label>
                    <input type="text" id="type_plural" class="form-input" placeholder="e.g. Restaurants, Podcasts" required />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Icon Name (FontAwesome)</label>
                    <input type="text" id="type_icon" class="form-input" placeholder="utensils, podcast, star" value="folder" />
                  </div>
                </div>

                <div class="form-group mb-6">
                  <label class="form-label">Description</label>
                  <textarea id="type_description" class="form-input form-textarea" rows="2" placeholder="Brief explanation of this content type..."></textarea>
                </div>

                <!-- Custom Fields Schema Builder -->
                <div class="border-t pt-4 mb-6">
                  <div class="flex justify-between items-center mb-3">
                    <h4 class="font-bold text-md"><i class="fas fa-list-ul text-primary me-2"></i> Content Fields</h4>
                    <button type="button" class="btn btn-secondary btn-sm" id="btn_add_schema_field">
                      <i class="fas fa-plus me-1"></i> Add Field
                    </button>
                  </div>

                  <div id="schema_fields_container" class="space-y-3">
                    <div class="text-xs text-gray-500 italic p-3 text-center bg-gray-100 rounded">
                      No custom fields added yet. Click "Add Field" to define field keys and types.
                    </div>
                  </div>
                </div>

                <div class="modal-footer border-t pt-4 flex justify-end gap-2">
                  <button type="button" class="btn btn-secondary close-modal-btn">Cancel</button>
                  <button type="submit" class="btn btn-primary">Save Content Type</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    if (!container) return;

    const modal = container.querySelector('#create_content_type_modal');
    const openBtn = container.querySelector('#btn_open_create_type_modal');
    const addFieldBtn = container.querySelector('#btn_add_schema_field');
    const form = container.querySelector('#create_content_type_form');

    if (openBtn && modal) {
      openBtn.addEventListener('click', () => {
        this.customFields = [
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'summary', label: 'Summary', type: 'textarea', required: false },
          { key: 'image', label: 'Featured Image', type: 'media', required: false },
        ];
        this.renderSchemaFields(container);
        modal.classList.remove('hidden');
      });

      modal.querySelectorAll('.close-modal-btn').forEach(b => b.addEventListener('click', () => modal.classList.add('hidden')));
    }

    if (addFieldBtn) {
      addFieldBtn.addEventListener('click', () => {
        this.customFields.push({
          key: `field_${Date.now().toString().slice(-4)}`,
          label: 'New Field',
          type: 'text',
          required: false,
        });
        this.renderSchemaFields(container);
      });
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = container.querySelector('#type_name').value;
        const singularName = container.querySelector('#type_singular').value;
        const pluralName = container.querySelector('#type_plural').value;
        const icon = container.querySelector('#type_icon').value;
        const description = container.querySelector('#type_description').value;

        try {
          await window.API.post('/content-types/admin', {
            name,
            singularName,
            pluralName,
            icon,
            description,
            fields: this.customFields,
          });
          alert('Custom content type created successfully!');
          modal.classList.add('hidden');
          window.location.reload();
        } catch (err) {
          alert('Error creating content type: ' + (err.message || 'Error'));
        }
      });
    }

    // Delete custom content type
    container.querySelectorAll('.btn-delete-custom-type').forEach(btn => {
      btn.addEventListener('click', async () => {
        const slug = btn.dataset.slug;
        if (!confirm(`Are you sure you want to delete custom content type '${slug}'?`)) return;
        try {
          await window.API.delete(`/content-types/admin/${slug}`);
          window.location.reload();
        } catch (err) {
          alert('Delete failed: ' + (err.message || 'Error'));
        }
      });
    });
  },

  renderSchemaFields(container) {
    const fieldsDiv = container.querySelector('#schema_fields_container');
    if (!fieldsDiv) return;

    if (this.customFields.length === 0) {
      fieldsDiv.innerHTML = `<div class="text-xs text-gray-500 italic p-3 text-center bg-gray-100 rounded">No custom fields added yet.</div>`;
      return;
    }

    fieldsDiv.innerHTML = this.customFields.map((f, idx) => `
      <div class="schema-field-row p-3 bg-white border rounded-lg grid grid-cols-12 gap-2 items-center">
        <div class="col-span-4">
          <input type="text" class="form-input form-input-sm f-label-input" value="${f.label}" placeholder="Field Label" data-index="${idx}" />
        </div>
        <div class="col-span-3">
          <input type="text" class="form-input form-input-sm f-key-input" value="${f.key}" placeholder="field_key" data-index="${idx}" />
        </div>
        <div class="col-span-4">
          <select class="form-select form-select-sm f-type-select" data-index="${idx}">
            <option value="text" ${f.type === 'text' ? 'selected' : ''}>Text</option>
            <option value="textarea" ${f.type === 'textarea' ? 'selected' : ''}>Textarea</option>
            <option value="rich_text" ${f.type === 'rich_text' ? 'selected' : ''}>Rich Text</option>
            <option value="media" ${f.type === 'media' ? 'selected' : ''}>Media / Image</option>
            <option value="select" ${f.type === 'select' ? 'selected' : ''}>Select Dropdown</option>
            <option value="boolean" ${f.type === 'boolean' ? 'selected' : ''}>Boolean Toggle</option>
            <option value="number" ${f.type === 'number' ? 'selected' : ''}>Number</option>
            <option value="date" ${f.type === 'date' ? 'selected' : ''}>Date</option>
          </select>
        </div>
        <div class="col-span-1 text-right">
          <button type="button" class="btn-icon text-danger btn-remove-schema-field" data-index="${idx}">&times;</button>
        </div>
      </div>
    `).join('');

    // Bind field input listeners
    fieldsDiv.querySelectorAll('.f-label-input').forEach(i => i.addEventListener('input', (e) => {
      const idx = e.target.dataset.index;
      this.customFields[idx].label = e.target.value;
      this.customFields[idx].key = e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const keyInput = fieldsDiv.querySelector(`.f-key-input[data-index="${idx}"]`);
      if (keyInput) keyInput.value = this.customFields[idx].key;
    }));

    fieldsDiv.querySelectorAll('.f-key-input').forEach(i => i.addEventListener('input', (e) => {
      this.customFields[e.target.dataset.index].key = e.target.value;
    }));

    fieldsDiv.querySelectorAll('.f-type-select').forEach(s => s.addEventListener('change', (e) => {
      this.customFields[e.target.dataset.index].type = e.target.value;
    }));

    fieldsDiv.querySelectorAll('.btn-remove-schema-field').forEach(b => b.addEventListener('click', (e) => {
      const idx = e.target.dataset.index;
      this.customFields.splice(idx, 1);
      this.renderSchemaFields(container);
    }));
  }
};
