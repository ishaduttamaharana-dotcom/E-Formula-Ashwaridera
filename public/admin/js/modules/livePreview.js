// ============================================================
//  public/admin/js/modules/livePreview.js
//  Real-Time Responsive Visual Live Preview Module
// ============================================================

window.LivePreviewModule = {
  currentViewport: 'desktop', // desktop, tablet, mobile

  render(contentType, initialData = {}) {
    return `
      <div class="live-preview-wrapper flex flex-col h-full bg-gray-900 text-white rounded-lg overflow-hidden border border-gray-700">
        <!-- Viewport Header Toolbar -->
        <div class="live-preview-header flex justify-between items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
          <div class="flex items-center gap-2">
            <span class="live-indicator-dot"></span>
            <span class="font-bold text-xs uppercase tracking-wider text-gray-300">Live Stage Preview</span>
            <span class="badge badge-sm badge-secondary text-xs" id="preview_content_type_badge">${contentType}</span>
          </div>

          <!-- Responsive Viewport Device Toggles -->
          <div class="viewport-device-toggles flex gap-1 bg-gray-900 p-1 rounded-md">
            <button type="button" class="viewport-btn ${this.currentViewport === 'desktop' ? 'active' : ''}" data-viewport="desktop" title="Desktop View (100%)">
              <i class="fas fa-desktop"></i>
            </button>
            <button type="button" class="viewport-btn ${this.currentViewport === 'tablet' ? 'active' : ''}" data-viewport="tablet" title="Tablet View (768px)">
              <i class="fas fa-tablet-alt"></i>
            </button>
            <button type="button" class="viewport-btn ${this.currentViewport === 'mobile' ? 'active' : ''}" data-viewport="mobile" title="Mobile View (375px)">
              <i class="fas fa-mobile-alt"></i>
            </button>
          </div>
        </div>

        <!-- Viewport Canvas Stage Container -->
        <div class="live-preview-stage-container flex-1 overflow-auto p-4 flex justify-center items-start bg-gray-950">
          <div class="live-preview-frame viewport-${this.currentViewport}" id="live_preview_frame">
            <div id="live_preview_stage_content" class="live-preview-stage-content">
              ${this.renderStageMarkup(contentType, initialData)}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  renderStageMarkup(contentType, data) {
    const fields = data.fields || {};
    const title = data.title || fields.headline || fields.question || 'Untitled Item';
    const subtitle = fields.subtitle || fields.excerpt || fields.role || fields.shortDesc || fields.caption || '';
    const mediaUrl = fields.desktopMedia || fields.featuredImage || fields.mediaUrl || fields.coverImage || fields.image || fields.photo || fields.avatar || '';

    // Specialized renderers based on contentType
    if (contentType === 'hero_slide') {
      return `
        <div class="hero-stage-render relative overflow-hidden rounded-lg min-h-[400px] flex items-center justify-center text-center p-8 bg-gray-900 text-white" 
          style="${mediaUrl ? `background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url('${mediaUrl}'); background-size: cover; background-position: center;` : ''}">
          <div class="relative z-10 max-w-2xl">
            ${fields.eyebrow ? `<span class="badge badge-accent mb-3 inline-block">${fields.eyebrow}</span>` : ''}
            <h1 class="text-3xl md:text-5xl font-black mb-4 uppercase tracking-tight text-yellow-400">${fields.headline || title}</h1>
            ${subtitle ? `<p class="text-lg text-gray-200 mb-6 font-light">${subtitle}</p>` : ''}
            <div class="flex justify-center gap-3">
              ${fields.primaryCtaText ? `<button class="btn btn-primary">${fields.primaryCtaText}</button>` : ''}
              ${fields.secondaryCtaText ? `<button class="btn btn-outline text-white border-white">${fields.secondaryCtaText}</button>` : ''}
            </div>
          </div>
        </div>
      `;
    }

    if (contentType === 'article') {
      return `
        <article class="article-stage-render bg-white text-gray-900 p-6 rounded-lg shadow-xl max-w-3xl mx-auto">
          ${mediaUrl ? `<img src="${mediaUrl}" alt="${title}" class="w-full h-64 object-cover rounded-md mb-6" />` : ''}
          <div class="flex items-center gap-2 mb-3">
            <span class="badge badge-info">${fields.category || 'News'}</span>
            <span class="text-xs text-gray-500">By ${fields.author || 'Ashwa Riders'}</span>
          </div>
          <h1 class="text-3xl font-bold mb-4 text-gray-900">${title}</h1>
          ${fields.excerpt ? `<p class="text-lg text-gray-600 mb-6 font-medium italic border-l-4 border-red-600 pl-4">${fields.excerpt}</p>` : ''}
          <div class="prose max-w-none text-gray-800 leading-relaxed">${fields.content || '<p>Article body text will render here live as you type...</p>'}</div>
        </article>
      `;
    }

    if (contentType === 'team_member') {
      return `
        <div class="team-stage-render bg-white text-gray-900 rounded-xl overflow-hidden shadow-xl max-w-sm mx-auto text-center p-6 border">
          <img src="${mediaUrl || 'https://via.placeholder.com/200'}" alt="${title}" class="w-32 h-32 rounded-full mx-auto object-cover mb-4 border-4 border-red-600 shadow-md" />
          <h3 class="text-xl font-bold text-gray-900">${title}</h3>
          <p class="text-sm font-semibold text-red-600 uppercase tracking-wider mb-2">${fields.role || 'Team Member'}</p>
          <span class="badge badge-secondary mb-4">${fields.department || 'Mechanical'}</span>
          ${fields.bio ? `<p class="text-xs text-gray-600 line-clamp-3 mb-4">${fields.bio}</p>` : ''}
          <div class="flex justify-center gap-3 text-gray-500">
            ${fields.linkedin ? `<i class="fab fa-linkedin text-lg text-blue-600"></i>` : ''}
            ${fields.email ? `<i class="fas fa-envelope text-lg text-gray-700"></i>` : ''}
          </div>
        </div>
      `;
    }

    if (contentType === 'testimonial') {
      return `
        <div class="testimonial-stage-render bg-gray-900 text-white p-8 rounded-2xl shadow-2xl max-w-xl mx-auto relative border border-gray-800 text-center">
          <i class="fas fa-quote-left text-4xl text-red-600 opacity-40 mb-4 block"></i>
          <p class="text-lg italic mb-6 text-gray-200">"${fields.quote || 'Testimonial quote text will display here live...'}"</p>
          <div class="flex items-center justify-center gap-3">
            ${mediaUrl ? `<img src="${mediaUrl}" class="w-12 h-12 rounded-full object-cover border-2 border-red-600" />` : ''}
            <div class="text-left">
              <div class="font-bold text-white">${fields.author || title}</div>
              <div class="text-xs text-gray-400">${fields.role || ''} ${fields.company ? `@ ${fields.company}` : ''}</div>
            </div>
          </div>
        </div>
      `;
    }

    // Default Generic Stage Renderer
    return `
      <div class="generic-stage-render bg-white text-gray-900 p-6 rounded-lg shadow-xl">
        ${mediaUrl ? `<img src="${mediaUrl}" class="w-full h-48 object-cover rounded-md mb-4" />` : ''}
        <h2 class="text-2xl font-bold mb-2">${title}</h2>
        ${subtitle ? `<p class="text-sm text-gray-600 mb-4">${subtitle}</p>` : ''}
        <div class="bg-gray-50 p-4 rounded-md border text-xs font-mono text-gray-700 overflow-auto">
          <pre>${JSON.stringify(fields, null, 2)}</pre>
        </div>
      </div>
    `;
  },

  bindEvents(container, contentType, getCurrentDataCallback) {
    if (!container) return;

    container.querySelectorAll('.viewport-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentViewport = btn.dataset.viewport;
        container.querySelectorAll('.viewport-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const frame = container.querySelector('#live_preview_frame');
        if (frame) {
          frame.className = `live-preview-frame viewport-${this.currentViewport}`;
        }
      });
    });
  },

  updateLivePreview(container, contentType, data) {
    const stage = container.querySelector('#live_preview_stage_content');
    if (stage) {
      stage.innerHTML = this.renderStageMarkup(contentType, data);
    }
  }
};
