// ============================================================
//  public/admin/js/components/seoCard.js
//  SEO Fields & Live Search / Social Preview Snippet Component
// ============================================================

window.SeoCard = {
  render(seoData = {}, itemTitle = '') {
    const seo = seoData || {};
    const title = seo.title || itemTitle || 'Page Title Placeholder';
    const description = seo.description || 'Provide a meta description for search engine listings...';
    const slug = seo.slug || itemTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const ogTitle = seo.ogTitle || title;
    const ogDesc = seo.ogDescription || description;
    const ogImage = seo.ogImage || 'https://ashwariders.com/assets/og-default.jpg';

    return `
      <div class="cms-card seo-card-container mb-4">
        <div class="cms-card-header flex justify-between items-center">
          <h3><i class="fas fa-search-dollar me-2 text-primary"></i> SEO & Social Metadata</h3>
          <span class="badge badge-info">Search Engine Optimization</span>
        </div>
        <div class="cms-card-body">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div class="form-group mb-3">
                <label class="form-label">SEO Meta Title</label>
                <input type="text" id="seo_title" name="seo.title" class="form-input seo-input-field" 
                  value="${this.escapeHtml(seo.title || '')}" placeholder="${this.escapeHtml(itemTitle)}" />
              </div>
              <div class="form-group mb-3">
                <label class="form-label">URL Slug</label>
                <input type="text" id="seo_slug" name="seo.slug" class="form-input seo-input-field" 
                  value="${this.escapeHtml(slug)}" placeholder="url-slug" />
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Meta Description</label>
                <textarea id="seo_description" name="seo.description" class="form-input form-textarea seo-input-field" rows="3"
                  placeholder="Enter meta description...">${this.escapeHtml(seo.description || '')}</textarea>
              </div>
              <div class="form-group mb-3">
                <label class="form-label">Canonical URL (Optional)</label>
                <input type="text" id="seo_canonical" name="seo.canonicalUrl" class="form-input" 
                  value="${this.escapeHtml(seo.canonicalUrl || '')}" placeholder="https://..." />
              </div>
            </div>

            <!-- SEO Live Preview Snippets -->
            <div>
              <label class="form-label font-bold text-sm mb-2 text-gray-700">Google Search Result Preview</label>
              <div class="google-snippet-preview mb-4">
                <div class="google-preview-title" id="seo_preview_title">${this.escapeHtml(title)} | Ashwa Riders</div>
                <div class="google-preview-url" id="seo_preview_url">https://ashwariders.com/${this.escapeHtml(slug)}</div>
                <div class="google-preview-desc" id="seo_preview_desc">${this.escapeHtml(description)}</div>
              </div>

              <label class="form-label font-bold text-sm mb-2 text-gray-700">Social Media Share Card Preview</label>
              <div class="social-card-preview">
                <div class="social-preview-image-wrap">
                  <img src="${ogImage}" alt="Social Card" id="seo_preview_og_img" />
                </div>
                <div class="social-preview-body">
                  <div class="social-preview-domain">ASHWARIDERS.COM</div>
                  <div class="social-preview-title" id="seo_preview_og_title">${this.escapeHtml(ogTitle)}</div>
                  <div class="social-preview-desc" id="seo_preview_og_desc">${this.escapeHtml(ogDesc)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents(container, onChangeCallback) {
    if (!container) return;

    const titleInput = container.querySelector('#seo_title');
    const descInput = container.querySelector('#seo_description');
    const slugInput = container.querySelector('#seo_slug');

    const previewTitle = container.querySelector('#seo_preview_title');
    const previewUrl = container.querySelector('#seo_preview_url');
    const previewDesc = container.querySelector('#seo_preview_desc');
    const ogTitle = container.querySelector('#seo_preview_og_title');
    const ogDesc = container.querySelector('#seo_preview_og_desc');

    const updatePreview = () => {
      const t = titleInput ? titleInput.value : '';
      const d = descInput ? descInput.value : '';
      const s = slugInput ? slugInput.value : '';

      if (previewTitle) previewTitle.textContent = `${t || 'Page Title'} | Ashwa Riders`;
      if (previewUrl) previewUrl.textContent = `https://ashwariders.com/${s || 'slug'}`;
      if (previewDesc) previewDesc.textContent = d || 'Meta description preview...';
      if (ogTitle) ogTitle.textContent = t || 'Page Title';
      if (ogDesc) ogDesc.textContent = d || 'Meta description preview...';

      if (onChangeCallback) onChangeCallback();
    };

    container.querySelectorAll('.seo-input-field').forEach(input => {
      input.addEventListener('input', updatePreview);
    });
  },

  escapeHtml(str) {
    if (typeof str !== 'string') return str || '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  },

  getValues(container) {
    if (!container) return {};
    return {
      title: container.querySelector('#seo_title')?.value || '',
      description: container.querySelector('#seo_description')?.value || '',
      canonicalUrl: container.querySelector('#seo_canonical')?.value || '',
      ogTitle: container.querySelector('#seo_title')?.value || '',
      ogDescription: container.querySelector('#seo_description')?.value || '',
    };
  }
};
