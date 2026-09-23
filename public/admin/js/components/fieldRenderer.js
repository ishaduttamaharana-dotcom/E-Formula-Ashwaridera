// ============================================================
//  public/admin/js/components/fieldRenderer.js
//  Universal Field Renderer for CMS Editors
// ============================================================

window.FieldRenderer = {
  renderField(field, value = '', onChange = () => {}) {
    const fieldId = `field_${field.key}`;
    const val = value !== undefined && value !== null ? value : (field.defaultValue || '');
    const requiredAttr = field.required ? 'required' : '';

    let inputHtml = '';

    switch (field.type) {
      case 'short_text':
      case 'text':
      case 'heading':
      case 'eyebrow':
      case 'caption':
        inputHtml = `
          <input type="text" id="${fieldId}" name="${field.key}" class="form-input" 
            placeholder="${field.placeholder || ''}" value="${this.escapeHtml(val)}" ${requiredAttr} />
        `;
        break;

      case 'long_text':
      case 'textarea':
      case 'quote':
        inputHtml = `
          <textarea id="${fieldId}" name="${field.key}" class="form-input form-textarea" rows="4" 
            placeholder="${field.placeholder || ''}" ${requiredAttr}>${this.escapeHtml(val)}</textarea>
        `;
        break;

      case 'rich_text':
        inputHtml = `
          <div class="rich-text-editor-container">
            <div class="wysiwyg-toolbar" data-for="${fieldId}">
              <button type="button" class="wysiwyg-btn" data-cmd="bold" title="Bold"><i class="fas fa-bold"></i></button>
              <button type="button" class="wysiwyg-btn" data-cmd="italic" title="Italic"><i class="fas fa-italic"></i></button>
              <button type="button" class="wysiwyg-btn" data-cmd="underline" title="Underline"><i class="fas fa-underline"></i></button>
              <span class="toolbar-divider"></span>
              <button type="button" class="wysiwyg-btn" data-cmd="formatBlock" data-val="h2" title="Heading 2">H2</button>
              <button type="button" class="wysiwyg-btn" data-cmd="formatBlock" data-val="h3" title="Heading 3">H3</button>
              <button type="button" class="wysiwyg-btn" data-cmd="formatBlock" data-val="p" title="Paragraph">P</button>
              <span class="toolbar-divider"></span>
              <button type="button" class="wysiwyg-btn" data-cmd="insertUnorderedList" title="Bullet List"><i class="fas fa-list-ul"></i></button>
              <button type="button" class="wysiwyg-btn" data-cmd="insertOrderedList" title="Numbered List"><i class="fas fa-list-ol"></i></button>
              <button type="button" class="wysiwyg-btn" data-cmd="createLink" title="Insert Link"><i class="fas fa-link"></i></button>
            </div>
            <div id="${fieldId}_editable" class="wysiwyg-editable" contenteditable="true">${val || '<p><br></p>'}</div>
            <textarea id="${fieldId}" name="${field.key}" class="hidden-textarea" style="display:none;">${this.escapeHtml(val)}</textarea>
          </div>
        `;
        break;

      case 'media':
      case 'image':
      case 'video':
      case 'audio':
      case 'bg_image':
      case 'bg_video':
      case 'mobile_media':
        inputHtml = `
          <div class="media-field-picker-group">
            <div class="media-input-wrapper">
              <input type="text" id="${fieldId}" name="${field.key}" class="form-input media-url-input" 
                placeholder="https://res.cloudinary.com/..." value="${this.escapeHtml(val)}" />
              <button type="button" class="btn btn-secondary select-media-btn" data-target="${fieldId}">
                <i class="fas fa-folder-open"></i> Select Media
              </button>
            </div>
            <div class="media-preview-container ${val ? '' : 'hidden'}" id="${fieldId}_preview">
              ${this.renderMediaPreview(val)}
            </div>
          </div>
        `;
        break;

      case 'multi_image':
        const images = Array.isArray(val) ? val : (val ? [val] : []);
        inputHtml = `
          <div class="multi-media-picker-group">
            <div class="multi-media-grid" id="${fieldId}_grid">
              ${images.map((img, idx) => `
                <div class="multi-media-item">
                  <img src="${img}" alt="Gallery item" />
                  <button type="button" class="multi-media-remove" data-target="${fieldId}" data-index="${idx}">&times;</button>
                </div>
              `).join('')}
            </div>
            <button type="button" class="btn btn-secondary btn-sm select-multi-media-btn mt-2" data-target="${fieldId}">
              <i class="fas fa-plus"></i> Add Gallery Image
            </button>
            <input type="hidden" id="${fieldId}" name="${field.key}" value="${this.escapeHtml(JSON.stringify(images))}" />
          </div>
        `;
        break;

      case 'select':
      case 'dropdown':
        const opts = field.options || [];
        inputHtml = `
          <select id="${fieldId}" name="${field.key}" class="form-select" ${requiredAttr}>
            ${opts.map(opt => `<option value="${opt}" ${opt === val ? 'selected' : ''}>${opt}</option>`).join('')}
          </select>
        `;
        break;

      case 'radio':
        const radioOpts = field.options || [];
        inputHtml = `
          <div class="radio-options-group">
            ${radioOpts.map((opt, idx) => `
              <label class="radio-label me-3">
                <input type="radio" name="${field.key}" value="${opt}" ${opt === val ? 'checked' : ''} /> ${opt}
              </label>
            `).join('')}
          </div>
        `;
        break;

      case 'checkbox':
      case 'boolean':
      case 'active':
      case 'featured':
        const isChecked = Boolean(val);
        inputHtml = `
          <label class="toggle-switch-label">
            <input type="checkbox" id="${fieldId}" name="${field.key}" class="toggle-switch-input" ${isChecked ? 'checked' : ''} />
            <span class="toggle-switch-slider"></span>
            <span class="toggle-switch-text">${field.label}</span>
          </label>
        `;
        break;

      case 'number':
      case 'percentage':
      case 'duration':
      case 'sort_order':
        inputHtml = `
          <input type="number" id="${fieldId}" name="${field.key}" class="form-input" 
            placeholder="${field.placeholder || '0'}" value="${val}" ${requiredAttr} />
        `;
        break;

      case 'color':
        inputHtml = `
          <div class="color-picker-group">
            <input type="color" id="${fieldId}_picker" class="form-color-picker" value="${val || '#000000'}" />
            <input type="text" id="${fieldId}" name="${field.key}" class="form-input color-text-input" value="${val || '#000000'}" />
          </div>
        `;
        break;

      case 'date':
        const dateVal = val ? new Date(val).toISOString().split('T')[0] : '';
        inputHtml = `
          <input type="date" id="${fieldId}" name="${field.key}" class="form-input" value="${dateVal}" ${requiredAttr} />
        `;
        break;

      default:
        inputHtml = `
          <input type="text" id="${fieldId}" name="${field.key}" class="form-input" value="${this.escapeHtml(val)}" />
        `;
    }

    if (field.type === 'checkbox' || field.type === 'boolean' || field.type === 'active' || field.type === 'featured') {
      return `<div class="form-group field-group-${field.type}">${inputHtml}</div>`;
    }

    return `
      <div class="form-group field-group-${field.type}">
        <label for="${fieldId}" class="form-label">
          ${field.label} ${field.required ? '<span class="text-danger">*</span>' : ''}
        </label>
        ${inputHtml}
        ${field.helpText ? `<small class="form-help-text">${field.helpText}</small>` : ''}
      </div>
    `;
  },

  renderMediaPreview(url) {
    if (!url) return '';
    if (url.match(/\.(mp4|webm|mov)$/i)) {
      return `<video src="${url}" controls class="media-preview-video"></video>`;
    }
    return `<img src="${url}" alt="Preview" class="media-preview-img" />`;
  },

  escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  bindFieldEvents(container, onChangeCallback) {
    if (!container) return;

    // Standard inputs
    container.querySelectorAll('input, select, textarea').forEach(el => {
      el.addEventListener('input', () => onChangeCallback());
      el.addEventListener('change', () => onChangeCallback());
    });

    // Color picker sync
    container.querySelectorAll('.form-color-picker').forEach(picker => {
      const textInput = picker.nextElementSibling;
      picker.addEventListener('input', (e) => {
        if (textInput) textInput.value = e.target.value;
        onChangeCallback();
      });
    });

    // WYSIWYG Editor setup
    container.querySelectorAll('.wysiwyg-editable').forEach(editor => {
      const hiddenTextarea = editor.nextElementSibling;
      editor.addEventListener('input', () => {
        if (hiddenTextarea) hiddenTextarea.value = editor.innerHTML;
        onChangeCallback();
      });
    });

    // WYSIWYG Toolbar buttons
    container.querySelectorAll('.wysiwyg-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const cmd = btn.dataset.cmd;
        const val = btn.dataset.val || null;
        if (cmd === 'createLink') {
          const url = prompt('Enter URL:');
          if (url) document.execCommand(cmd, false, url);
        } else if (cmd === 'formatBlock') {
          document.execCommand(cmd, false, `<${val}>`);
        } else {
          document.execCommand(cmd, false, null);
        }
        onChangeCallback();
      });
    });

    // Media library pickers
    container.querySelectorAll('.select-media-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        if (window.MediaModule && typeof window.MediaModule.openPicker === 'function') {
          window.MediaModule.openPicker((selectedUrl) => {
            const input = document.getElementById(targetId);
            if (input) {
              input.value = selectedUrl;
              const preview = document.getElementById(`${targetId}_preview`);
              if (preview) {
                preview.innerHTML = this.renderMediaPreview(selectedUrl);
                preview.classList.remove('hidden');
              }
              onChangeCallback();
            }
          });
        } else {
          const url = prompt('Enter Media URL:');
          if (url) {
            const input = document.getElementById(targetId);
            if (input) input.value = url;
            onChangeCallback();
          }
        }
      });
    });
  }
};
