/* ============================================================
   gallery.js — Unified Gallery Page Control Center Module
   Ashwa Riders CMS — Formula Student Electric Team
   Controls:
     01. HERO & Media (Background image/video, overlay, alignment)
     02. ALBUMS & Collections (Create, Edit, Cover, Order, Delete)
     03. MEDIA ITEMS (Images & Videos, Upload, Album Assignment, Metadata)
     04. DYNAMIC CATEGORIES (Manage filter tabs & counts)
     05. PAGE SETTINGS & SEO
   Draft / Preview / Publish lifecycle + zero hardcoded frontend.
============================================================ */

(function () {
  'use strict';

  let currentData = null;
  let currentAlbums = [];
  let currentMedia = [];

  let collapsedSections = {
    hero: false,
    albums: false,
    media: false,
    categories: true,
    settings: true,
  };

  let mediaFilter = {
    query: '',
    type: 'all',
    album: 'all',
    category: 'all',
    status: 'all',
  };

  let albumFilter = {
    query: '',
    status: 'all',
  };

  const API = () => window.AdminApi;

  const toast = (msg, type = 'success') => {
    if (window.AdminToast) {
      if (type === 'error') window.AdminToast.error(msg);
      else if (type === 'warn') window.AdminToast.warn(msg);
      else window.AdminToast.success(msg);
    } else {
      console.log(`[Toast ${type}]: ${msg}`);
    }
  };

  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // ============================================================
  //  MAIN ENTRY POINT
  // ============================================================
  async function renderGalleryModule(container) {
    if (!container) return;

    container.innerHTML = `
      <div style="display:flex; align-items:center; justify-content:center; min-height:360px; color:#9696A0;">
        <i class="fas fa-circle-notch fa-spin" style="font-size:2rem; margin-right:12px; color:#F25912;"></i>
        <span style="font-family:monospace; font-size:0.95rem;">Loading Ashwa Gallery Control Center...</span>
      </div>
    `;

    await loadGalleryData(container);
  }

  async function loadGalleryData(container) {
    try {
      const res = await API().get('/admin/gallery/page');
      if (res && res.success && res.data) {
        currentData = res.data.page;
        currentAlbums = res.data.albums || [];
        currentMedia = res.data.media || [];

        normalizeGalleryData();
        renderInterface(container);
      } else {
        throw new Error(res?.message || 'Failed to load Gallery page data.');
      }
    } catch (err) {
      console.error('Error loading Gallery CMS data:', err);
      container.innerHTML = `
        <div style="background:#141419; border:1px solid #FF4D4D; border-radius:12px; padding:40px; text-align:center; max-width:600px; margin:40px auto;">
          <i class="fas fa-triangle-exclamation" style="font-size:2.5rem; color:#FF4D4D; margin-bottom:16px;"></i>
          <h2 style="font-size:1.25rem; font-weight:800; color:#FFFFFF; margin-bottom:8px;">Unable to Load Gallery Control Center</h2>
          <p style="color:#9696A0; font-size:0.9rem; margin-bottom:24px;">${escapeHtml(err.message)}</p>
          <button type="button" class="btn btn-primary" id="retryGalleryLoadBtn" style="background:#F25912; border-color:#F25912;">
            <i class="fas fa-rotate-right"></i> Retry Connection
          </button>
        </div>
      `;
      document.getElementById('retryGalleryLoadBtn')?.addEventListener('click', () => loadGalleryData(container));
    }
  }

  function normalizeGalleryData() {
    if (!currentData) return;
    const src = currentData.draftVersion || currentData;

    currentData.settings = src.settings || currentData.settings || {};
    currentData.hero = src.hero || currentData.hero || {};
    currentData.categories = Array.isArray(src.categories) && src.categories.length > 0 ? src.categories : [
      { id: 'all', label: 'All', order: 0, isVisible: true },
      { id: 'image', label: 'Images', order: 1, isVisible: true },
      { id: 'video', label: 'Videos', order: 2, isVisible: true },
      { id: 'competition', label: 'Competition', order: 3, isVisible: true },
      { id: 'workshop', label: 'Workshop', order: 4, isVisible: true },
      { id: 'testing', label: 'Testing', order: 5, isVisible: true },
      { id: 'events', label: 'Events', order: 6, isVisible: true },
    ];
    currentData.cta = src.cta || currentData.cta || {};
  }

  // ============================================================
  //  UI RENDERING
  // ============================================================
  function renderInterface(container) {
    const isPub = currentData.status === 'published';
    const statusClass = isPub ? 'badge-success' : 'badge-warning';
    const statusText = isPub ? 'LIVE / PUBLISHED' : 'DRAFT CHANGES';

    const lastPub = currentData.lastPublishedAt ? new Date(currentData.lastPublishedAt).toLocaleString() : 'Never';
    const lastEdit = currentData.lastEditedAt ? new Date(currentData.lastEditedAt).toLocaleString() : 'Just now';

    let html = `
      <!-- Control Center Header -->
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:24px; flex-wrap:wrap; gap:16px; background:#141419; padding:22px 26px; border-radius:12px; border:1px solid #282832;">
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:4px;">
            <h1 style="font-size:1.5rem; font-weight:800; color:#F5F5F5; margin:0; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px;">
              <i class="fas fa-photo-film" style="color:#F25912;"></i> GALLERY PAGE CONTROL CENTER
            </h1>
            <span class="badge ${statusClass}" id="galleryStatusBadge" style="padding:4px 10px; font-size:0.72rem; letter-spacing:0.05em;">${statusText}</span>
          </div>
          <p style="font-size:0.85rem; color:#9696A0; margin:0;">
            Manage the Gallery Hero, Albums, Photos & Videos, dynamic category filters, and interactive Lightbox.
          </p>
          <div style="display:flex; gap:18px; margin-top:8px; font-size:0.75rem; color:#6B7280; font-family:monospace;">
            <span><i class="fas fa-check-circle" style="color:#00AFA5;"></i> Last Published: <strong style="color:#9FA7A6;">${lastPub}</strong></span>
            <span><i class="fas fa-clock" style="color:#F25912;"></i> Last Edited: <strong style="color:#9FA7A6;">${lastEdit}</strong></span>
          </div>
        </div>

        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          <a href="/gallery.html?preview=true" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-flex; align-items:center; gap:6px; background:rgba(255,255,255,0.05); color:#fff; border:1px solid #282832;">
            <i class="fas fa-eye"></i> Preview Website
          </a>
          <button type="button" class="btn btn-secondary btn-sm" id="gallerySaveDraftBtn" style="display:inline-flex; align-items:center; gap:6px;">
            <i class="fas fa-save"></i> Save Draft
          </button>
          <button type="button" class="btn btn-primary btn-sm" id="galleryPublishBtn" style="display:inline-flex; align-items:center; gap:6px; background:#F25912; border-color:#F25912;">
            <i class="fas fa-paper-plane"></i> Publish Live
          </button>
        </div>
      </div>

      <!-- Main Controls Flow -->
      <div style="display:flex; flex-direction:column; gap:20px;">
        ${renderHeroSectionHtml()}
        ${renderAlbumsSectionHtml()}
        ${renderMediaSectionHtml()}
        ${renderCategoriesSectionHtml()}
        ${renderSettingsSectionHtml()}
      </div>

      <!-- Modals and Drawers Container -->
      <div id="galleryModalsContainer"></div>
    `;

    container.innerHTML = html;
    bindGlobalEvents();
  }

  // ============================================================
  //  01. HERO SECTION HTML
  // ============================================================
  function renderHeroSectionHtml() {
    const isCollapsed = collapsedSections.hero;
    const hero = currentData.hero || {};
    const mediaType = hero.mediaType || 'image';

    return `
      <div class="card" style="background:#141419; border:1px solid #282832; border-radius:12px; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; cursor:pointer; background:#181820; border-bottom:${isCollapsed ? 'none' : '1px solid #282832'};" onclick="window.AdminGalleryModule.toggleSection('hero')">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:32px; height:32px; border-radius:6px; background:rgba(242,89,18,0.15); color:#F25912; display:flex; align-items:center; justify-content:center; font-size:0.9rem;">
              <i class="fas fa-panorama"></i>
            </div>
            <div>
              <h3 style="margin:0; font-size:1rem; font-weight:700; color:#FFFFFF;">01. GALLERY HERO</h3>
              <p style="margin:0; font-size:0.75rem; color:#8E929E;">Eyebrow, title highlight, description, background image/video and overlay.</p>
            </div>
          </div>
          <div style="color:#8E929E;">
            <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
          </div>
        </div>

        <div style="display:${isCollapsed ? 'none' : 'block'}; padding:24px;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-bottom:20px;">
            <div>
              <label class="form-label" style="display:block; font-size:0.78rem; font-weight:600; color:#D3DAD9; margin-bottom:6px; text-transform:uppercase;">Eyebrow / Badge</label>
              <input type="text" class="form-control" id="heroEyebrow" value="${escapeHtml(hero.eyebrow || 'GALLERY')}" oninput="window.AdminGalleryModule.updateHeroField('eyebrow', this.value)" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:10px 14px; color:#fff; font-size:0.88rem;" />
            </div>

            <div>
              <label class="form-label" style="display:block; font-size:0.78rem; font-weight:600; color:#D3DAD9; margin-bottom:6px; text-transform:uppercase;">Heading Line 1</label>
              <input type="text" class="form-control" id="heroHeading1" value="${escapeHtml(hero.headingLine1 || 'MOMENTS IN')}" oninput="window.AdminGalleryModule.updateHeroField('headingLine1', this.value)" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:10px 14px; color:#fff; font-size:0.88rem;" />
            </div>

            <div>
              <label class="form-label" style="display:block; font-size:0.78rem; font-weight:600; color:#D3DAD9; margin-bottom:6px; text-transform:uppercase;">Heading Highlight (Signal Orange)</label>
              <input type="text" class="form-control" id="heroHighlight" value="${escapeHtml(hero.headingHighlight || 'MOTION')}" oninput="window.AdminGalleryModule.updateHeroField('headingHighlight', this.value)" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:10px 14px; color:#F25912; font-weight:700; font-size:0.88rem;" />
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <label class="form-label" style="display:block; font-size:0.78rem; font-weight:600; color:#D3DAD9; margin-bottom:6px; text-transform:uppercase;">Description</label>
            <textarea class="form-control" id="heroDescription" rows="2" oninput="window.AdminGalleryModule.updateHeroField('description', this.value)" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:10px 14px; color:#fff; font-size:0.88rem;">${escapeHtml(hero.description || 'Behind the scenes, race highlights, track tests, and fabrication milestones from our Formula Student Electric campaign.')}</textarea>
          </div>

          <!-- Hero Media Selection -->
          <div style="background:#0D0D11; border:1px solid #282832; border-radius:8px; padding:18px; margin-bottom:20px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:10px;">
              <span style="font-size:0.82rem; font-weight:700; color:#FFFFFF; text-transform:uppercase;">Background Media Settings</span>
              
              <div style="display:flex; gap:16px; align-items:center;">
                <label style="display:flex; align-items:center; gap:6px; font-size:0.82rem; color:#D3DAD9; cursor:pointer;">
                  <input type="radio" name="heroMediaType" value="image" ${mediaType === 'image' ? 'checked' : ''} onchange="window.AdminGalleryModule.updateHeroField('mediaType', 'image'); window.AdminGalleryModule.renderInterface(document.getElementById('adminContent'));" /> Image
                </label>
                <label style="display:flex; align-items:center; gap:6px; font-size:0.82rem; color:#D3DAD9; cursor:pointer;">
                  <input type="radio" name="heroMediaType" value="video" ${mediaType === 'video' ? 'checked' : ''} onchange="window.AdminGalleryModule.updateHeroField('mediaType', 'video'); window.AdminGalleryModule.renderInterface(document.getElementById('adminContent'));" /> Video
                </label>
              </div>
            </div>

            ${mediaType === 'image' ? `
              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#8E929E; margin-bottom:6px;">Background Image URL</label>
                <div style="display:flex; gap:10px;">
                  <input type="text" class="form-control" id="heroDesktopImg" value="${escapeHtml(hero.desktopImageUrl || 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg')}" oninput="window.AdminGalleryModule.updateHeroField('desktopImageUrl', this.value)" style="flex:1; background:#141419; border:1px solid #282832; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                  <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.pickMedia('heroDesktopImg', 'heroImgPreview')" style="white-space:nowrap;">
                    <i class="fas fa-photo-film"></i> Choose Media
                  </button>
                </div>
                ${hero.desktopImageUrl ? `
                  <div style="margin-top:10px;">
                    <img id="heroImgPreview" src="${escapeHtml(hero.desktopImageUrl)}" alt="Hero Preview" style="max-height:120px; border-radius:6px; border:1px solid #282832; object-fit:cover;" />
                  </div>
                ` : ''}
              </div>
            ` : `
              <div>
                <div style="margin-bottom:12px;">
                  <label class="form-label" style="display:block; font-size:0.75rem; color:#8E929E; margin-bottom:6px;">Background Video Stream URL (MP4 / WebM)</label>
                  <div style="display:flex; gap:10px;">
                    <input type="text" class="form-control" id="heroVideoUrl" value="${escapeHtml(hero.videoUrl || '')}" oninput="window.AdminGalleryModule.updateHeroField('videoUrl', this.value)" style="flex:1; background:#141419; border:1px solid #282832; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                    <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.pickMedia('heroVideoUrl')" style="white-space:nowrap;">
                      <i class="fas fa-video"></i> Choose Video
                    </button>
                  </div>
                </div>
                <div>
                  <label class="form-label" style="display:block; font-size:0.75rem; color:#8E929E; margin-bottom:6px;">Video Poster Image URL (Fallback)</label>
                  <div style="display:flex; gap:10px;">
                    <input type="text" class="form-control" id="heroVideoPoster" value="${escapeHtml(hero.videoPoster || '')}" oninput="window.AdminGalleryModule.updateHeroField('videoPoster', this.value)" style="flex:1; background:#141419; border:1px solid #282832; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;" />
                    <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.pickMedia('heroVideoPoster')" style="white-space:nowrap;">
                      <i class="fas fa-image"></i> Choose Poster
                    </button>
                  </div>
                </div>
              </div>
            `}

            <!-- Overlay & Position Row -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin-top:16px; padding-top:16px; border-top:1px dashed #282832;">
              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#8E929E; margin-bottom:6px;">Dark Overlay</label>
                <div style="display:flex; align-items:center; gap:10px;">
                  <input type="range" min="0" max="100" value="${hero.overlayStrength !== undefined ? hero.overlayStrength : 60}" oninput="document.getElementById('overlayVal').textContent = this.value + '%'; window.AdminGalleryModule.updateHeroField('overlayStrength', parseInt(this.value, 10))" style="flex:1; accent-color:#F25912;" />
                  <span id="overlayVal" style="font-family:monospace; font-size:0.8rem; color:#D3DAD9; width:40px;">${hero.overlayStrength !== undefined ? hero.overlayStrength : 60}%</span>
                </div>
              </div>

              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#8E929E; margin-bottom:6px;">Background Alignment</label>
                <select class="form-control" onchange="window.AdminGalleryModule.updateHeroField('backgroundPosition', this.value)" style="width:100%; background:#141419; border:1px solid #282832; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;">
                  <option value="center 40%" ${hero.backgroundPosition === 'center 40%' ? 'selected' : ''}>Center 40% (Default)</option>
                  <option value="center center" ${hero.backgroundPosition === 'center center' ? 'selected' : ''}>Center Center</option>
                  <option value="center top" ${hero.backgroundPosition === 'center top' ? 'selected' : ''}>Center Top</option>
                  <option value="center bottom" ${hero.backgroundPosition === 'center bottom' ? 'selected' : ''}>Center Bottom</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  //  02. ALBUMS SECTION HTML
  // ============================================================
  function renderAlbumsSectionHtml() {
    const isCollapsed = collapsedSections.albums;

    const filtered = currentAlbums.filter(album => {
      if (albumFilter.query) {
        const q = albumFilter.query.toLowerCase();
        const matchTitle = (album.title || album.name || '').toLowerCase().includes(q);
        const matchDesc = (album.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      if (albumFilter.status !== 'all' && album.status !== albumFilter.status) return false;
      return true;
    });

    return `
      <div class="card" style="background:#141419; border:1px solid #282832; border-radius:12px; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; cursor:pointer; background:#181820; border-bottom:${isCollapsed ? 'none' : '1px solid #282832'};" onclick="window.AdminGalleryModule.toggleSection('albums')">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:32px; height:32px; border-radius:6px; background:rgba(0,175,165,0.15); color:#00AFA5; display:flex; align-items:center; justify-content:center; font-size:0.9rem;">
              <i class="fas fa-folder-open"></i>
            </div>
            <div>
              <h3 style="margin:0; font-size:1rem; font-weight:700; color:#FFFFFF;">02. ALBUMS & COLLECTIONS</h3>
              <p style="margin:0; font-size:0.75rem; color:#8E929E;">Organize media into categorized albums (e.g. Formula Bharat 2026, Season Launch, Testing).</p>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:14px;">
            <button type="button" class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.AdminGalleryModule.openAlbumDrawer();" style="background:#00AFA5; border-color:#00AFA5; display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-plus"></i> Create Album
            </button>
            <div style="color:#8E929E;">
              <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
            </div>
          </div>
        </div>

        <div style="display:${isCollapsed ? 'none' : 'block'}; padding:24px;">
          <!-- Album Filter Toolbar -->
          <div style="display:flex; gap:12px; margin-bottom:18px; flex-wrap:wrap; align-items:center;">
            <div style="position:relative; flex:1; min-width:200px;">
              <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#6B7280; font-size:0.8rem;"></i>
              <input type="text" placeholder="Search albums..." value="${escapeHtml(albumFilter.query)}" oninput="window.AdminGalleryModule.onAlbumSearch(this.value)" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:8px 12px 8px 34px; color:#fff; font-size:0.85rem;" />
            </div>

            <select onchange="window.AdminGalleryModule.onAlbumStatusFilter(this.value)" style="background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;">
              <option value="all" ${albumFilter.status === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="published" ${albumFilter.status === 'published' ? 'selected' : ''}>Published Only</option>
              <option value="draft" ${albumFilter.status === 'draft' ? 'selected' : ''}>Draft Only</option>
            </select>
          </div>

          <!-- Album Cards Grid -->
          <div id="adminAlbumsGrid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(260px, 1fr)); gap:16px;">
            ${filtered.length > 0 ? filtered.map(album => renderAlbumCardHtml(album)).join('') : `
              <div style="grid-column:1/-1; padding:30px; text-align:center; color:#8E929E; background:#0D0D11; border:1px dashed #282832; border-radius:8px;">
                <i class="fas fa-folder-open" style="font-size:1.8rem; margin-bottom:8px; opacity:0.4;"></i>
                <p style="margin:0; font-size:0.85rem;">No albums found. Click "Create Album" above to start a collection.</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function renderAlbumCardHtml(album) {
    const title = album.title || album.name || 'Untitled Album';
    const cover = album.coverImage || 'https://res.cloudinary.com/frjck4sc/image/upload/v1784484192/car-hero-DAWajS8q_dt2ddg.png';
    const count = album.mediaCount !== undefined ? album.mediaCount : 0;
    const isPub = album.status === 'published';

    return `
      <div style="background:#0D0D11; border:1px solid #282832; border-radius:8px; overflow:hidden; display:flex; flex-direction:column; transition:transform 0.2s, border-color 0.2s;">
        <div style="position:relative; aspect-ratio:16/9; background:#000;">
          <img src="${escapeHtml(cover)}" alt="${escapeHtml(title)}" style="width:100%; height:100%; object-fit:cover;" />
          <div style="position:absolute; top:8px; right:8px; display:flex; gap:6px;">
            <span class="badge ${isPub ? 'badge-success' : 'badge-warning'}" style="font-size:0.65rem; padding:3px 8px;">
              ${isPub ? 'Published' : 'Draft'}
            </span>
          </div>
          <div style="position:absolute; bottom:8px; left:8px; background:rgba(0,0,0,0.7); backdrop-filter:blur(4px); padding:3px 8px; border-radius:4px; font-family:monospace; font-size:0.7rem; color:#D3DAD9;">
            <i class="fas fa-images" style="color:#00AFA5; margin-right:4px;"></i> ${count} media items
          </div>
        </div>

        <div style="padding:14px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
          <div>
            <h4 style="margin:0 0 4px 0; font-size:0.92rem; color:#FFFFFF; font-weight:700;">${escapeHtml(title)}</h4>
            <p style="margin:0 0 10px 0; font-size:0.78rem; color:#8E929E; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
              ${escapeHtml(album.description || 'No description provided.')}
            </p>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #1C1C24; padding-top:10px; margin-top:6px;">
            <span style="font-size:0.72rem; color:#6B7280; font-family:monospace;">Slug: /${escapeHtml(album.slug || '')}</span>
            <div style="display:flex; gap:8px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.openAlbumDrawer('${album._id}')" style="padding:4px 8px; font-size:0.75rem;" title="Edit Album">
                <i class="fas fa-pen"></i>
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.deleteAlbum('${album._id}')" style="padding:4px 8px; font-size:0.75rem; color:#FF4D4D;" title="Delete Album">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  //  03. MEDIA ITEMS (IMAGES & VIDEOS) HTML
  // ============================================================
  function renderMediaSectionHtml() {
    const isCollapsed = collapsedSections.media;

    const filtered = currentMedia.filter(item => {
      if (mediaFilter.query) {
        const q = mediaFilter.query.toLowerCase();
        const matchTitle = (item.title || item.caption || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      if (mediaFilter.type !== 'all') {
        const t = (item.mediaType || 'image').toLowerCase();
        if (t !== mediaFilter.type) return false;
      }
      if (mediaFilter.album !== 'all') {
        const aId = item.album ? (item.album._id || item.album).toString() : '';
        if (aId !== mediaFilter.album) return false;
      }
      if (mediaFilter.category !== 'all') {
        const c = (item.category || '').toLowerCase();
        if (c !== mediaFilter.category.toLowerCase()) return false;
      }
      if (mediaFilter.status !== 'all' && item.status !== mediaFilter.status) return false;
      return true;
    });

    return `
      <div class="card" style="background:#141419; border:1px solid #282832; border-radius:12px; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; cursor:pointer; background:#181820; border-bottom:${isCollapsed ? 'none' : '1px solid #282832'};" onclick="window.AdminGalleryModule.toggleSection('media')">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:32px; height:32px; border-radius:6px; background:rgba(255,106,38,0.15); color:#FF6A26; display:flex; align-items:center; justify-content:center; font-size:0.9rem;">
              <i class="fas fa-images"></i>
            </div>
            <div>
              <h3 style="margin:0; font-size:1rem; font-weight:700; color:#FFFFFF;">03. MEDIA ROSTER (IMAGES & VIDEOS)</h3>
              <p style="margin:0; font-size:0.75rem; color:#8E929E;">Upload race photographs, testing videos, assign to albums, set categories and featured items.</p>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <button type="button" class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); window.AdminGalleryModule.openMediaUploader();" style="display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-upload"></i> Upload Media
            </button>
            <button type="button" class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.AdminGalleryModule.openMediaDrawer();" style="background:#FF6A26; border-color:#FF6A26; display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-plus"></i> Add Media Item
            </button>
            <div style="color:#8E929E;">
              <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
            </div>
          </div>
        </div>

        <div style="display:${isCollapsed ? 'none' : 'block'}; padding:24px;">
          <!-- Filter & Search Toolbar -->
          <div style="background:#0D0D11; border:1px solid #282832; border-radius:8px; padding:14px; margin-bottom:20px; display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
            <!-- Keyword search -->
            <div style="position:relative; flex:2; min-width:200px;">
              <i class="fas fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#6B7280; font-size:0.8rem;"></i>
              <input type="text" placeholder="Search by title, caption, or description..." value="${escapeHtml(mediaFilter.query)}" oninput="window.AdminGalleryModule.onMediaSearch(this.value)" style="width:100%; background:#141419; border:1px solid #282832; border-radius:6px; padding:8px 12px 8px 34px; color:#fff; font-size:0.85rem;" />
            </div>

            <!-- Media Type -->
            <select onchange="window.AdminGalleryModule.onMediaTypeFilter(this.value)" style="background:#141419; border:1px solid #282832; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;">
              <option value="all" ${mediaFilter.type === 'all' ? 'selected' : ''}>All Types</option>
              <option value="image" ${mediaFilter.type === 'image' ? 'selected' : ''}>Images</option>
              <option value="video" ${mediaFilter.type === 'video' ? 'selected' : ''}>Videos</option>
            </select>

            <!-- Album Filter -->
            <select onchange="window.AdminGalleryModule.onMediaAlbumFilter(this.value)" style="background:#141419; border:1px solid #282832; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;">
              <option value="all" ${mediaFilter.album === 'all' ? 'selected' : ''}>All Albums</option>
              ${currentAlbums.map(a => `<option value="${a._id}" ${mediaFilter.album === a._id ? 'selected' : ''}>${escapeHtml(a.title || a.name)}</option>`).join('')}
            </select>

            <!-- Category Filter -->
            <select onchange="window.AdminGalleryModule.onMediaCategoryFilter(this.value)" style="background:#141419; border:1px solid #282832; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;">
              <option value="all" ${mediaFilter.category === 'all' ? 'selected' : ''}>All Categories</option>
              ${(currentData.categories || []).map(c => `<option value="${c.id}" ${mediaFilter.category === c.id ? 'selected' : ''}>${escapeHtml(c.label)}</option>`).join('')}
            </select>

            <!-- Status Filter -->
            <select onchange="window.AdminGalleryModule.onMediaStatusFilter(this.value)" style="background:#141419; border:1px solid #282832; border-radius:6px; padding:8px 12px; color:#fff; font-size:0.85rem;">
              <option value="all" ${mediaFilter.status === 'all' ? 'selected' : ''}>All Statuses</option>
              <option value="published" ${mediaFilter.status === 'published' ? 'selected' : ''}>Published</option>
              <option value="draft" ${mediaFilter.status === 'draft' ? 'selected' : ''}>Draft</option>
            </select>
          </div>

          <!-- Media Count Info -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; font-size:0.8rem; color:#8E929E;">
            <span>Showing <strong style="color:#FFFFFF;">${filtered.length}</strong> of ${currentMedia.length} media items</span>
            <span>Total Videos: <strong style="color:#00AFA5;">${currentMedia.filter(m => (m.mediaType || 'image') === 'video').length}</strong> | Total Images: <strong style="color:#F25912;">${currentMedia.filter(m => (m.mediaType || 'image') === 'image').length}</strong></span>
          </div>

          <!-- Media Grid -->
          <div id="adminMediaGrid" style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:16px;">
            ${filtered.length > 0 ? filtered.map(item => renderMediaCardHtml(item)).join('') : `
              <div style="grid-column:1/-1; padding:40px; text-align:center; color:#8E929E; background:#0D0D11; border:1px dashed #282832; border-radius:8px;">
                <i class="fas fa-photo-film" style="font-size:2rem; margin-bottom:10px; opacity:0.4;"></i>
                <p style="margin:0; font-size:0.9rem;">No media items found matching the selected filters.</p>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  function renderMediaCardHtml(item) {
    const isVideo = (item.mediaType || 'image').toLowerCase() === 'video';
    const thumb = item.thumbnailUrl || item.imageUrl || item.mediaUrl || 'https://res.cloudinary.com/frjck4sc/image/upload/v1784484192/car-hero-DAWajS8q_dt2ddg.png';
    const title = item.title || item.caption || 'Untitled Media';
    const cat = item.category || 'General';
    const albumName = item.album ? (item.album.title || item.album.name || 'Assigned Album') : 'Standalone';
    const isPub = item.status === 'published';

    return `
      <div style="background:#0D0D11; border:1px solid #282832; border-radius:8px; overflow:hidden; display:flex; flex-direction:column; justify-content:space-between;">
        <div style="position:relative; aspect-ratio:4/3; background:#000;">
          <img src="${escapeHtml(thumb)}" alt="${escapeHtml(title)}" style="width:100%; height:100%; object-fit:cover;" />
          
          ${isVideo ? `
            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%); width:38px; height:38px; border-radius:50%; background:rgba(0,0,0,0.65); border:1px solid #00AFA5; display:flex; align-items:center; justify-content:center; color:#00AFA5;">
              <i class="fas fa-play" style="font-size:0.85rem; margin-left:2px;"></i>
            </div>
          ` : ''}

          <div style="position:absolute; top:8px; left:8px; display:flex; gap:6px; flex-wrap:wrap;">
            <span style="font-family:monospace; font-size:0.65rem; padding:2px 6px; border-radius:3px; background:${isVideo ? 'rgba(0,175,165,0.85)' : 'rgba(242,89,18,0.85)'}; color:#fff; font-weight:700;">
              ${isVideo ? 'VIDEO' : 'IMAGE'}
            </span>
            ${item.isFeatured ? `
              <span style="font-family:monospace; font-size:0.65rem; padding:2px 6px; border-radius:3px; background:#EAB308; color:#000; font-weight:700;">
                <i class="fas fa-star"></i> FEATURED
              </span>
            ` : ''}
          </div>

          <div style="position:absolute; top:8px; right:8px;">
            <span class="badge ${isPub ? 'badge-success' : 'badge-warning'}" style="font-size:0.65rem; padding:3px 6px;">
              ${isPub ? 'Live' : 'Draft'}
            </span>
          </div>

          <div style="position:absolute; bottom:6px; left:8px; right:8px; background:rgba(0,0,0,0.75); backdrop-filter:blur(4px); padding:4px 8px; border-radius:4px; font-size:0.7rem; color:#D3DAD9; display:flex; justify-content:space-between; align-items:center;">
            <span style="text-transform:capitalize; color:#FF6A26;"><i class="fas fa-tag"></i> ${escapeHtml(cat)}</span>
            <span style="color:#8E929E; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:110px;"><i class="fas fa-folder"></i> ${escapeHtml(albumName)}</span>
          </div>
        </div>

        <div style="padding:12px; flex:1; display:flex; flex-direction:column; justify-content:space-between;">
          <h4 style="margin:0 0 4px 0; font-size:0.88rem; color:#FFFFFF; font-weight:600; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
            ${escapeHtml(title)}
          </h4>
          <p style="margin:0 0 10px 0; font-size:0.75rem; color:#8E929E; line-height:1.4; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden;">
            ${escapeHtml(item.description || item.caption || 'No description.')}
          </p>

          <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #1C1C24; padding-top:8px;">
            <span style="font-size:0.7rem; color:#6B7280; font-family:monospace;">
              ${item.mediaDate ? new Date(item.mediaDate).toLocaleDateString() : 'No date'}
            </span>
            <div style="display:flex; gap:6px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.openMediaDrawer('${item._id}')" style="padding:4px 8px; font-size:0.75rem;" title="Edit Media">
                <i class="fas fa-pen"></i>
              </button>
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.deleteMediaItem('${item._id}')" style="padding:4px 8px; font-size:0.75rem; color:#FF4D4D;" title="Delete Media">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  //  04. DYNAMIC CATEGORIES SECTION HTML
  // ============================================================
  function renderCategoriesSectionHtml() {
    const isCollapsed = collapsedSections.categories;
    const cats = currentData.categories || [];

    return `
      <div class="card" style="background:#141419; border:1px solid #282832; border-radius:12px; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; cursor:pointer; background:#181820; border-bottom:${isCollapsed ? 'none' : '1px solid #282832'};" onclick="window.AdminGalleryModule.toggleSection('categories')">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:32px; height:32px; border-radius:6px; background:rgba(227,183,63,0.15); color:#E3B73F; display:flex; align-items:center; justify-content:center; font-size:0.9rem;">
              <i class="fas fa-tags"></i>
            </div>
            <div>
              <h3 style="margin:0; font-size:1rem; font-weight:700; color:#FFFFFF;">04. DYNAMIC CATEGORY FILTERS</h3>
              <p style="margin:0; font-size:0.75rem; color:#8E929E;">Configure public gallery filter tabs (e.g. All, Images, Videos, Competition, Testing, Workshop).</p>
            </div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <button type="button" class="btn btn-sm btn-primary" onclick="event.stopPropagation(); window.AdminGalleryModule.openCategoryModal();" style="background:#E3B73F; border-color:#E3B73F; color:#000; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
              <i class="fas fa-plus"></i> Add Category
            </button>
            <div style="color:#8E929E;">
              <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
            </div>
          </div>
        </div>

        <div style="display:${isCollapsed ? 'none' : 'block'}; padding:24px;">
          <div style="overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; text-align:left; font-size:0.85rem;">
              <thead>
                <tr style="border-bottom:1px solid #282832; color:#8E929E; text-transform:uppercase; font-size:0.72rem; letter-spacing:0.05em;">
                  <th style="padding:10px 14px;">Order</th>
                  <th style="padding:10px 14px;">Label (Frontend Tab)</th>
                  <th style="padding:10px 14px;">Category ID / Slug</th>
                  <th style="padding:10px 14px;">Type</th>
                  <th style="padding:10px 14px;">Visible</th>
                  <th style="padding:10px 14px; text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${cats.map((c, idx) => {
                  const isSystem = ['all', 'image', 'video'].includes((c.id || '').toLowerCase());
                  return `
                    <tr style="border-bottom:1px solid #1C1C24;">
                      <td style="padding:12px 14px; color:#D3DAD9; font-family:monospace;">${c.order !== undefined ? c.order : idx}</td>
                      <td style="padding:12px 14px; color:#FFFFFF; font-weight:600;">${escapeHtml(c.label)}</td>
                      <td style="padding:12px 14px; color:#8E929E; font-family:monospace;">${escapeHtml(c.id)}</td>
                      <td style="padding:12px 14px;">
                        <span class="badge ${isSystem ? 'badge-primary' : 'badge-secondary'}" style="font-size:0.65rem;">
                          ${isSystem ? 'System Core' : 'Custom'}
                        </span>
                      </td>
                      <td style="padding:12px 14px;">
                        <input type="checkbox" ${c.isVisible !== false ? 'checked' : ''} onchange="window.AdminGalleryModule.toggleCategoryVisibility('${c.id}', this.checked)" style="accent-color:#F25912;" />
                      </td>
                      <td style="padding:12px 14px; text-align:right;">
                        ${isSystem ? `
                          <span style="font-size:0.75rem; color:#6B7280; font-style:italic;">Protected</span>
                        ` : `
                          <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.removeCategory('${c.id}')" style="padding:4px 8px; font-size:0.75rem; color:#FF4D4D;">
                            <i class="fas fa-trash"></i> Delete
                          </button>
                        `}
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  //  05. PAGE SETTINGS & SEO HTML
  // ============================================================
  function renderSettingsSectionHtml() {
    const isCollapsed = collapsedSections.settings;
    const settings = currentData.settings || {};

    return `
      <div class="card" style="background:#141419; border:1px solid #282832; border-radius:12px; overflow:hidden;">
        <div style="display:flex; justify-content:space-between; align-items:center; padding:18px 24px; cursor:pointer; background:#181820; border-bottom:${isCollapsed ? 'none' : '1px solid #282832'};" onclick="window.AdminGalleryModule.toggleSection('settings')">
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="width:32px; height:32px; border-radius:6px; background:rgba(255,255,255,0.08); color:#FFFFFF; display:flex; align-items:center; justify-content:center; font-size:0.9rem;">
              <i class="fas fa-sliders"></i>
            </div>
            <div>
              <h3 style="margin:0; font-size:1rem; font-weight:700; color:#FFFFFF;">05. PAGE SETTINGS & SEO</h3>
              <p style="margin:0; font-size:0.75rem; color:#8E929E;">Meta title, description, OpenGraph share preview, and gallery layout options.</p>
            </div>
          </div>
          <div style="color:#8E929E;">
            <i class="fas fa-chevron-${isCollapsed ? 'down' : 'up'}"></i>
          </div>
        </div>

        <div style="display:${isCollapsed ? 'none' : 'block'}; padding:24px;">
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px; margin-bottom:20px;">
            <div>
              <label class="form-label" style="display:block; font-size:0.78rem; font-weight:600; color:#D3DAD9; margin-bottom:6px; text-transform:uppercase;">Page Title</label>
              <input type="text" class="form-control" id="settingsPageTitle" value="${escapeHtml(settings.pageTitle || 'Ashwa Riders — Gallery')}" oninput="window.AdminGalleryModule.updateSettingsField('pageTitle', this.value)" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:10px 14px; color:#fff; font-size:0.88rem;" />
            </div>

            <div>
              <label class="form-label" style="display:block; font-size:0.78rem; font-weight:600; color:#D3DAD9; margin-bottom:6px; text-transform:uppercase;">SEO Meta Title</label>
              <input type="text" class="form-control" id="settingsSeoTitle" value="${escapeHtml(settings.seoTitle || 'Gallery — Ashwa Riders Electric Racing')}" oninput="window.AdminGalleryModule.updateSettingsField('seoTitle', this.value)" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:10px 14px; color:#fff; font-size:0.88rem;" />
            </div>
          </div>

          <div style="margin-bottom:20px;">
            <label class="form-label" style="display:block; font-size:0.78rem; font-weight:600; color:#D3DAD9; margin-bottom:6px; text-transform:uppercase;">SEO Meta Description</label>
            <textarea class="form-control" id="settingsSeoDesc" rows="2" oninput="window.AdminGalleryModule.updateSettingsField('seoDescription', this.value)" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:10px 14px; color:#fff; font-size:0.88rem;">${escapeHtml(settings.seoDescription || 'Behind the scenes, race highlights, track tests, and fabrication milestones of Ashwa Riders.')}</textarea>
          </div>

          <div>
            <label class="form-label" style="display:block; font-size:0.78rem; font-weight:600; color:#D3DAD9; margin-bottom:6px; text-transform:uppercase;">OpenGraph Social Share Image URL</label>
            <div style="display:flex; gap:10px;">
              <input type="text" class="form-control" id="settingsOgImage" value="${escapeHtml(settings.ogImage || '')}" oninput="window.AdminGalleryModule.updateSettingsField('ogImage', this.value)" style="flex:1; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:10px 14px; color:#fff; font-size:0.88rem;" />
              <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.pickMedia('settingsOgImage')" style="white-space:nowrap;">
                <i class="fas fa-image"></i> Choose Image
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ============================================================
  //  MODALS & DRAWERS
  // ============================================================
  function openAlbumDrawer(albumId = null) {
    const isEdit = !!albumId;
    const album = isEdit ? currentAlbums.find(a => a._id === albumId) : null;
    const data = album || {
      title: '',
      slug: '',
      description: '',
      coverImage: '',
      eventDate: '',
      order: currentAlbums.length,
      status: 'published',
      isVisible: true,
    };

    const modalContainer = document.getElementById('galleryModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div style="position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:#141419; border:1px solid #282832; border-radius:12px; width:100%; max-width:540px; max-height:90vh; overflow-y:auto; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #282832; padding-bottom:14px;">
            <h3 style="margin:0; font-size:1.15rem; color:#fff; font-weight:700;">
              ${isEdit ? '<i class="fas fa-pen-to-square" style="color:#00AFA5; margin-right:8px;"></i> Edit Album' : '<i class="fas fa-folder-plus" style="color:#00AFA5; margin-right:8px;"></i> Create New Album'}
            </h3>
            <button type="button" onclick="document.getElementById('galleryModalsContainer').innerHTML=''" style="background:none; border:none; color:#8E929E; cursor:pointer; font-size:1.1rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="albumDrawerForm" onsubmit="event.preventDefault(); window.AdminGalleryModule.saveAlbum('${albumId || ''}');">
            <div style="margin-bottom:14px;">
              <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Album Title *</label>
              <input type="text" id="albumTitleInput" required value="${escapeHtml(data.title || data.name || '')}" oninput="if (!'${isEdit}') document.getElementById('albumSlugInput').value = this.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;" />
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">URL Slug *</label>
              <input type="text" id="albumSlugInput" required value="${escapeHtml(data.slug || '')}" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem; font-family:monospace;" />
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Description</label>
              <textarea id="albumDescInput" rows="2" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;">${escapeHtml(data.description || '')}</textarea>
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Cover Image URL</label>
              <div style="display:flex; gap:8px;">
                <input type="text" id="albumCoverInput" value="${escapeHtml(data.coverImage || '')}" style="flex:1; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;" />
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.pickMedia('albumCoverInput')">
                  <i class="fas fa-image"></i> Pick
                </button>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Display Order</label>
                <input type="number" id="albumOrderInput" value="${data.order !== undefined ? data.order : 0}" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;" />
              </div>

              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Status</label>
                <select id="albumStatusInput" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;">
                  <option value="published" ${data.status === 'published' ? 'selected' : ''}>Published</option>
                  <option value="draft" ${data.status === 'draft' ? 'selected' : ''}>Draft</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom:20px; display:flex; align-items:center; gap:8px;">
              <input type="checkbox" id="albumVisibleInput" ${data.isVisible !== false ? 'checked' : ''} style="accent-color:#00AFA5;" />
              <label for="albumVisibleInput" style="font-size:0.82rem; color:#D3DAD9; cursor:pointer;">Visible in Album Listings</label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #282832; padding-top:16px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('galleryModalsContainer').innerHTML=''">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="background:#00AFA5; border-color:#00AFA5;">
                <i class="fas fa-check"></i> Save Album
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function openMediaDrawer(mediaId = null) {
    const isEdit = !!mediaId;
    const item = isEdit ? currentMedia.find(m => m._id === mediaId) : null;
    const data = item || {
      title: '',
      caption: '',
      description: '',
      mediaType: 'image',
      mediaUrl: '',
      imageUrl: '',
      thumbnailUrl: '',
      category: 'competition',
      album: currentAlbums.length > 0 ? currentAlbums[0]._id : '',
      mediaDate: new Date().toISOString().split('T')[0],
      order: currentMedia.length,
      isFeatured: false,
      isVisible: true,
      status: 'published',
    };

    const modalContainer = document.getElementById('galleryModalsContainer');
    if (!modalContainer) return;

    const currentAlbumId = data.album ? (data.album._id || data.album).toString() : '';

    modalContainer.innerHTML = `
      <div style="position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:#141419; border:1px solid #282832; border-radius:12px; width:100%; max-width:600px; max-height:92vh; overflow-y:auto; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; border-bottom:1px solid #282832; padding-bottom:14px;">
            <h3 style="margin:0; font-size:1.15rem; color:#fff; font-weight:700;">
              ${isEdit ? '<i class="fas fa-pen-to-square" style="color:#FF6A26; margin-right:8px;"></i> Edit Media Item' : '<i class="fas fa-plus" style="color:#FF6A26; margin-right:8px;"></i> Add Media Item'}
            </h3>
            <button type="button" onclick="document.getElementById('galleryModalsContainer').innerHTML=''" style="background:none; border:none; color:#8E929E; cursor:pointer; font-size:1.1rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form id="mediaDrawerForm" onsubmit="event.preventDefault(); window.AdminGalleryModule.saveMediaItem('${mediaId || ''}');">
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Media Type *</label>
                <select id="mediaTypeInput" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;" onchange="document.getElementById('thumbFieldGroup').style.display = this.value === 'video' ? 'block' : 'none'">
                  <option value="image" ${data.mediaType === 'image' ? 'selected' : ''}>Image</option>
                  <option value="video" ${data.mediaType === 'video' ? 'selected' : ''}>Video</option>
                </select>
              </div>

              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Category *</label>
                <select id="mediaCategoryInput" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;">
                  ${(currentData.categories || []).filter(c => !['all', 'image', 'video'].includes(c.id)).map(c => `
                    <option value="${c.id}" ${data.category === c.id ? 'selected' : ''}>${escapeHtml(c.label)}</option>
                  `).join('')}
                  <option value="general" ${data.category === 'general' ? 'selected' : ''}>General</option>
                </select>
              </div>
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Title / Caption *</label>
              <input type="text" id="mediaTitleInput" required value="${escapeHtml(data.title || data.caption || '')}" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;" />
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Description</label>
              <textarea id="mediaDescInput" rows="2" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;">${escapeHtml(data.description || data.caption || '')}</textarea>
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Media File URL (Image or Video Stream) *</label>
              <div style="display:flex; gap:8px;">
                <input type="text" id="mediaUrlInput" required value="${escapeHtml(data.mediaUrl || data.imageUrl || '')}" style="flex:1; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;" />
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.pickMedia('mediaUrlInput')">
                  <i class="fas fa-folder-open"></i> Pick
                </button>
              </div>
            </div>

            <div id="thumbFieldGroup" style="margin-bottom:14px; display:${data.mediaType === 'video' ? 'block' : 'none'};">
              <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Thumbnail / Poster URL (For Videos)</label>
              <div style="display:flex; gap:8px;">
                <input type="text" id="mediaThumbInput" value="${escapeHtml(data.thumbnailUrl || '')}" style="flex:1; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;" />
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.AdminGalleryModule.pickMedia('mediaThumbInput')">
                  <i class="fas fa-image"></i> Pick
                </button>
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:14px;">
              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Assign to Album</label>
                <select id="mediaAlbumInput" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;">
                  <option value="">None / Standalone</option>
                  ${currentAlbums.map(a => `<option value="${a._id}" ${currentAlbumId === a._id.toString() ? 'selected' : ''}>${escapeHtml(a.title || a.name)}</option>`).join('')}
                </select>
              </div>

              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Event Date</label>
                <input type="date" id="mediaDateInput" value="${data.mediaDate ? new Date(data.mediaDate).toISOString().split('T')[0] : ''}" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;" />
              </div>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Display Order</label>
                <input type="number" id="mediaOrderInput" value="${data.order !== undefined ? data.order : 0}" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;" />
              </div>

              <div>
                <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Status</label>
                <select id="mediaStatusInput" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;">
                  <option value="published" ${data.status === 'published' ? 'selected' : ''}>Published</option>
                  <option value="draft" ${data.status === 'draft' ? 'selected' : ''}>Draft</option>
                </select>
              </div>
            </div>

            <div style="display:flex; gap:20px; margin-bottom:20px;">
              <label style="display:flex; align-items:center; gap:8px; font-size:0.82rem; color:#D3DAD9; cursor:pointer;">
                <input type="checkbox" id="mediaFeaturedInput" ${data.isFeatured ? 'checked' : ''} style="accent-color:#EAB308;" />
                <span style="display:flex; align-items:center; gap:4px;"><i class="fas fa-star" style="color:#EAB308;"></i> Featured Media</span>
              </label>

              <label style="display:flex; align-items:center; gap:8px; font-size:0.82rem; color:#D3DAD9; cursor:pointer;">
                <input type="checkbox" id="mediaVisibleInput" ${data.isVisible !== false ? 'checked' : ''} style="accent-color:#FF6A26;" />
                Visible in Gallery
              </label>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #282832; padding-top:16px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('galleryModalsContainer').innerHTML=''">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="background:#FF6A26; border-color:#FF6A26;">
                <i class="fas fa-check"></i> Save Media Item
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  function openCategoryModal() {
    const modalContainer = document.getElementById('galleryModalsContainer');
    if (!modalContainer) return;

    modalContainer.innerHTML = `
      <div style="position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.75); backdrop-filter:blur(6px); display:flex; align-items:center; justify-content:center; padding:20px;">
        <div style="background:#141419; border:1px solid #282832; border-radius:12px; width:100%; max-width:440px; padding:24px; box-shadow:0 20px 50px rgba(0,0,0,0.5);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; border-bottom:1px solid #282832; padding-bottom:12px;">
            <h3 style="margin:0; font-size:1.1rem; color:#fff; font-weight:700;">
              <i class="fas fa-tag" style="color:#E3B73F; margin-right:8px;"></i> Add Category Filter
            </h3>
            <button type="button" onclick="document.getElementById('galleryModalsContainer').innerHTML=''" style="background:none; border:none; color:#8E929E; cursor:pointer; font-size:1.1rem;">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form onsubmit="event.preventDefault(); window.AdminGalleryModule.saveCategory();">
            <div style="margin-bottom:14px;">
              <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Category Name (Frontend Button) *</label>
              <input type="text" id="newCatLabel" required placeholder="e.g. Formula Bharat, Track Tests" oninput="document.getElementById('newCatId').value = this.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem;" />
            </div>

            <div style="margin-bottom:14px;">
              <label class="form-label" style="display:block; font-size:0.75rem; color:#D3DAD9; margin-bottom:4px; text-transform:uppercase;">Category ID / Slug *</label>
              <input type="text" id="newCatId" required placeholder="e.g. formula-bharat" style="width:100%; background:#0D0D11; border:1px solid #282832; border-radius:6px; padding:9px 12px; color:#fff; font-size:0.85rem; font-family:monospace;" />
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #282832; padding-top:16px;">
              <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('galleryModalsContainer').innerHTML=''">Cancel</button>
              <button type="submit" class="btn btn-primary btn-sm" style="background:#E3B73F; border-color:#E3B73F; color:#000; font-weight:700;">
                <i class="fas fa-plus"></i> Add Tab
              </button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  // ============================================================
  //  GLOBAL EVENT HANDLERS & CMS ACTIONS
  // ============================================================
  function bindGlobalEvents() {
    const saveBtn = document.getElementById('gallerySaveDraftBtn');
    if (saveBtn) saveBtn.addEventListener('click', () => saveDraft(true));

    const pubBtn = document.getElementById('galleryPublishBtn');
    if (pubBtn) pubBtn.addEventListener('click', () => publishLive());
  }

  function toggleSection(sectionKey) {
    collapsedSections[sectionKey] = !collapsedSections[sectionKey];
    const container = document.getElementById('adminContent');
    if (container) renderInterface(container);
  }

  function updateHeroField(key, val) {
    if (!currentData.hero) currentData.hero = {};
    currentData.hero[key] = val;
    markAsDraft();
  }

  function updateSettingsField(key, val) {
    if (!currentData.settings) currentData.settings = {};
    currentData.settings[key] = val;
    markAsDraft();
  }

  function markAsDraft() {
    currentData.status = 'draft';
    const badge = document.getElementById('galleryStatusBadge');
    if (badge) {
      badge.className = 'badge badge-warning';
      badge.textContent = 'DRAFT CHANGES';
    }
  }

  async function saveDraft(showToast = true) {
    try {
      const payload = {
        settings: currentData.settings,
        hero: currentData.hero,
        categories: currentData.categories,
        cta: currentData.cta,
      };

      const res = await API().patch('/admin/gallery/page', payload);
      if (res && res.success) {
        if (showToast) toast('Gallery draft saved successfully.');
        currentData.lastEditedAt = new Date().toISOString();
      } else {
        throw new Error(res?.message || 'Failed to save draft.');
      }
    } catch (err) {
      console.error('Save draft error:', err);
      toast('Failed to save draft: ' + err.message, 'error');
    }
  }

  async function publishLive() {
    try {
      const btn = document.getElementById('galleryPublishBtn');
      if (btn) btn.disabled = true;

      // 1. Ensure draft is up to date first
      await saveDraft(false);

      // 2. Publish
      const res = await API().post('/admin/gallery/page/publish');
      if (res && res.success) {
        currentData.status = 'published';
        currentData.lastPublishedAt = new Date().toISOString();
        toast('Gallery Page is now LIVE on public website!', 'success');

        const badge = document.getElementById('galleryStatusBadge');
        if (badge) {
          badge.className = 'badge badge-success';
          badge.textContent = 'LIVE / PUBLISHED';
        }
      } else {
        throw new Error(res?.message || 'Publishing failed.');
      }
    } catch (err) {
      console.error('Publish error:', err);
      toast('Publish failed: ' + err.message, 'error');
    } finally {
      const btn = document.getElementById('galleryPublishBtn');
      if (btn) btn.disabled = false;
    }
  }

  // ============================================================
  //  ALBUM ACTIONS
  // ============================================================
  async function saveAlbum(albumId = '') {
    const isEdit = !!albumId;
    const title = document.getElementById('albumTitleInput').value.trim();
    const slug = document.getElementById('albumSlugInput').value.trim();
    const description = document.getElementById('albumDescInput').value.trim();
    const coverImage = document.getElementById('albumCoverInput').value.trim();
    const order = parseInt(document.getElementById('albumOrderInput').value, 10) || 0;
    const status = document.getElementById('albumStatusInput').value;
    const isVisible = document.getElementById('albumVisibleInput').checked;

    if (!title || !slug) {
      toast('Album title and slug are required.', 'warn');
      return;
    }

    const payload = {
      title,
      name: title,
      slug,
      description,
      coverImage,
      order,
      status,
      isVisible,
    };

    try {
      let res;
      if (isEdit) {
        res = await API().patch(`/admin/gallery/album-items/${albumId}`, payload);
      } else {
        res = await API().post('/admin/gallery/album-items', payload);
      }

      if (res && res.success) {
        toast(`Album ${isEdit ? 'updated' : 'created'} successfully.`);
        document.getElementById('galleryModalsContainer').innerHTML = '';
        await refreshAlbumsList();
      } else {
        throw new Error(res?.message || 'Failed to save album.');
      }
    } catch (err) {
      console.error('Save album error:', err);
      toast('Error saving album: ' + err.message, 'error');
    }
  }

  async function deleteAlbum(albumId) {
    if (!confirm('Are you sure you want to delete this album? Media items inside it will become standalone.')) return;
    try {
      const res = await API().delete(`/admin/gallery/album-items/${albumId}`);
      if (res && res.success) {
        toast('Album deleted successfully.');
        await refreshAlbumsList();
      } else {
        throw new Error(res?.message || 'Failed to delete album.');
      }
    } catch (err) {
      toast('Error deleting album: ' + err.message, 'error');
    }
  }

  async function refreshAlbumsList() {
    try {
      const res = await API().get('/admin/gallery/album-items');
      if (res && res.success) {
        currentAlbums = res.data || [];
        const grid = document.getElementById('adminAlbumsGrid');
        if (grid) {
          grid.innerHTML = currentAlbums.length > 0 
            ? currentAlbums.map(renderAlbumCardHtml).join('') 
            : `<div style="grid-column:1/-1; padding:30px; text-align:center; color:#8E929E;">No albums found.</div>`;
        }
      }
    } catch (err) {
      console.error('Refresh albums error:', err);
    }
  }

  function onAlbumSearch(val) {
    albumFilter.query = val.trim();
    const grid = document.getElementById('adminAlbumsGrid');
    if (grid) {
      const filtered = currentAlbums.filter(a => {
        if (albumFilter.query) {
          const q = albumFilter.query.toLowerCase();
          return (a.title || a.name || '').toLowerCase().includes(q) || (a.description || '').toLowerCase().includes(q);
        }
        return true;
      });
      grid.innerHTML = filtered.length > 0 ? filtered.map(renderAlbumCardHtml).join('') : '<div style="grid-column:1/-1; padding:30px; text-align:center; color:#8E929E;">No matching albums.</div>';
    }
  }

  function onAlbumStatusFilter(val) {
    albumFilter.status = val;
    const grid = document.getElementById('adminAlbumsGrid');
    if (grid) {
      const filtered = currentAlbums.filter(a => albumFilter.status === 'all' || a.status === albumFilter.status);
      grid.innerHTML = filtered.length > 0 ? filtered.map(renderAlbumCardHtml).join('') : '<div style="grid-column:1/-1; padding:30px; text-align:center; color:#8E929E;">No matching albums.</div>';
    }
  }

  // ============================================================
  //  MEDIA ACTIONS
  // ============================================================
  async function saveMediaItem(mediaId = '') {
    const isEdit = !!mediaId;
    const mediaType = document.getElementById('mediaTypeInput').value;
    const category = document.getElementById('mediaCategoryInput').value;
    const title = document.getElementById('mediaTitleInput').value.trim();
    const description = document.getElementById('mediaDescInput').value.trim();
    const mediaUrl = document.getElementById('mediaUrlInput').value.trim();
    const thumbnailUrl = document.getElementById('mediaThumbInput')?.value.trim() || '';
    const album = document.getElementById('mediaAlbumInput').value || null;
    const mediaDate = document.getElementById('mediaDateInput').value || null;
    const order = parseInt(document.getElementById('mediaOrderInput').value, 10) || 0;
    const status = document.getElementById('mediaStatusInput').value;
    const isFeatured = document.getElementById('mediaFeaturedInput').checked;
    const isVisible = document.getElementById('mediaVisibleInput').checked;

    if (!title || !mediaUrl) {
      toast('Title and media file URL are required.', 'warn');
      return;
    }

    const payload = {
      title,
      caption: title,
      description,
      mediaType,
      type: mediaType,
      mediaUrl,
      imageUrl: mediaUrl,
      thumbnailUrl: thumbnailUrl || mediaUrl,
      category,
      album,
      mediaDate,
      order,
      isFeatured,
      isVisible,
      status,
    };

    try {
      let res;
      if (isEdit) {
        res = await API().patch(`/admin/gallery/media-items/${mediaId}`, payload);
      } else {
        res = await API().post('/admin/gallery/media-items', payload);
      }

      if (res && res.success) {
        toast(`Media item ${isEdit ? 'updated' : 'added'} successfully.`);
        document.getElementById('galleryModalsContainer').innerHTML = '';
        await refreshMediaList();
      } else {
        throw new Error(res?.message || 'Failed to save media.');
      }
    } catch (err) {
      console.error('Save media error:', err);
      toast('Error saving media: ' + err.message, 'error');
    }
  }

  async function deleteMediaItem(mediaId) {
    if (!confirm('Are you sure you want to delete this media item?')) return;
    try {
      const res = await API().delete(`/admin/gallery/media-items/${mediaId}`);
      if (res && res.success) {
        toast('Media item deleted.');
        await refreshMediaList();
      } else {
        throw new Error(res?.message || 'Failed to delete media item.');
      }
    } catch (err) {
      toast('Error deleting media: ' + err.message, 'error');
    }
  }

  async function refreshMediaList() {
    try {
      const res = await API().get('/admin/gallery/media-items');
      if (res && res.success) {
        currentMedia = res.data || [];
        const grid = document.getElementById('adminMediaGrid');
        if (grid) {
          grid.innerHTML = currentMedia.length > 0 
            ? currentMedia.map(renderMediaCardHtml).join('') 
            : `<div style="grid-column:1/-1; padding:30px; text-align:center; color:#8E929E;">No media items.</div>`;
        }
      }
    } catch (err) {
      console.error('Refresh media error:', err);
    }
  }

  function onMediaSearch(val) {
    mediaFilter.query = val.trim();
    reRenderFilteredMedia();
  }

  function onMediaTypeFilter(val) {
    mediaFilter.type = val;
    reRenderFilteredMedia();
  }

  function onMediaAlbumFilter(val) {
    mediaFilter.album = val;
    reRenderFilteredMedia();
  }

  function onMediaCategoryFilter(val) {
    mediaFilter.category = val;
    reRenderFilteredMedia();
  }

  function onMediaStatusFilter(val) {
    mediaFilter.status = val;
    reRenderFilteredMedia();
  }

  function reRenderFilteredMedia() {
    const grid = document.getElementById('adminMediaGrid');
    if (!grid) return;

    const filtered = currentMedia.filter(item => {
      if (mediaFilter.query) {
        const q = mediaFilter.query.toLowerCase();
        const matchTitle = (item.title || item.caption || '').toLowerCase().includes(q);
        const matchDesc = (item.description || '').toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }
      if (mediaFilter.type !== 'all') {
        const t = (item.mediaType || 'image').toLowerCase();
        if (t !== mediaFilter.type) return false;
      }
      if (mediaFilter.album !== 'all') {
        const aId = item.album ? (item.album._id || item.album).toString() : '';
        if (aId !== mediaFilter.album) return false;
      }
      if (mediaFilter.category !== 'all') {
        const c = (item.category || '').toLowerCase();
        if (c !== mediaFilter.category.toLowerCase()) return false;
      }
      if (mediaFilter.status !== 'all' && item.status !== mediaFilter.status) return false;
      return true;
    });

    grid.innerHTML = filtered.length > 0 ? filtered.map(renderMediaCardHtml).join('') : '<div style="grid-column:1/-1; padding:30px; text-align:center; color:#8E929E;">No matching media items.</div>';
  }

  // ============================================================
  //  CATEGORIES ACTIONS
  // ============================================================
  function saveCategory() {
    const label = document.getElementById('newCatLabel').value.trim();
    const id = document.getElementById('newCatId').value.trim();

    if (!label || !id) {
      toast('Category label and ID are required.', 'warn');
      return;
    }

    if (!currentData.categories) currentData.categories = [];
    if (currentData.categories.some(c => c.id.toLowerCase() === id.toLowerCase())) {
      toast('A category with this ID already exists.', 'warn');
      return;
    }

    currentData.categories.push({
      id,
      label,
      order: currentData.categories.length,
      isVisible: true,
    });

    markAsDraft();
    toast(`Category "${label}" added.`);
    document.getElementById('galleryModalsContainer').innerHTML = '';
    const container = document.getElementById('adminContent');
    if (container) renderInterface(container);
  }

  function toggleCategoryVisibility(catId, isVisible) {
    const cat = (currentData.categories || []).find(c => c.id === catId);
    if (cat) {
      cat.isVisible = isVisible;
      markAsDraft();
    }
  }

  function removeCategory(catId) {
    if (['all', 'image', 'video'].includes(catId.toLowerCase())) {
      toast('Cannot delete core system categories.', 'warn');
      return;
    }
    if (!confirm('Are you sure you want to remove this category tab?')) return;

    currentData.categories = (currentData.categories || []).filter(c => c.id !== catId);
    markAsDraft();
    toast('Category removed.');
    const container = document.getElementById('adminContent');
    if (container) renderInterface(container);
  }

  // ============================================================
  //  MEDIA PICKER INTEGRATION
  // ============================================================
  function pickMedia(targetInputId, previewImgId) {
    const picker = window.AdminMediaPicker || window.MediaPicker;
    if (picker && typeof picker.open === 'function') {
      picker.open({
        allowedType: 'all',
        onSelect: (asset) => {
          const url = (asset && (asset.secure_url || asset.url || asset.filePath)) || '';
          if (url) {
            const input = document.getElementById(targetInputId);
            if (input) {
              input.value = url;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (previewImgId) {
              const preview = document.getElementById(previewImgId);
              if (preview) {
                preview.src = url;
                preview.style.display = 'block';
              }
            }
          }
        },
      });
    } else {
      const url = prompt('Enter media URL (image or video stream):');
      if (url && url.trim()) {
        const input = document.getElementById(targetInputId);
        if (input) {
          input.value = url.trim();
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
        if (previewImgId) {
          const preview = document.getElementById(previewImgId);
          if (preview) {
            preview.src = url.trim();
            preview.style.display = 'block';
          }
        }
      }
    }
  }

  function openMediaUploader() {
    const picker = window.AdminMediaPicker || window.MediaPicker;
    if (picker && typeof picker.open === 'function') {
      picker.open({
        allowedType: 'all',
        onSelect: async (asset) => {
          const url = (asset && (asset.secure_url || asset.url || asset.filePath)) || '';
          if (url) {
            // Auto open Add Media drawer with this URL prefilled
            openMediaDrawer();
            setTimeout(() => {
              const urlInput = document.getElementById('mediaUrlInput');
              if (urlInput) urlInput.value = url;
              const titleInput = document.getElementById('mediaTitleInput');
              if (titleInput && asset.original_filename) {
                titleInput.value = asset.original_filename.replace(/[-_]/g, ' ');
              }
            }, 100);
          }
        },
      });
    } else {
      openMediaDrawer();
    }
  }

  // ============================================================
  //  EXPORTS
  // ============================================================
  window.AdminGalleryModule = {
    renderGalleryModule,
    toggleSection,
    updateHeroField,
    updateSettingsField,
    saveDraft,
    publishLive,
    openAlbumDrawer,
    saveAlbum,
    deleteAlbum,
    onAlbumSearch,
    onAlbumStatusFilter,
    openMediaDrawer,
    saveMediaItem,
    deleteMediaItem,
    onMediaSearch,
    onMediaTypeFilter,
    onMediaAlbumFilter,
    onMediaCategoryFilter,
    onMediaStatusFilter,
    openCategoryModal,
    saveCategory,
    toggleCategoryVisibility,
    removeCategory,
    pickMedia,
    openMediaUploader,
    renderInterface,
  };
})();
