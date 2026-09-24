/* ============================================================
   hero.js — Redesigned Hero Slides & Cinematic Header CMS Module
   Modern dark Formula Student CMS dashboard interface
============================================================ */

(function () {
  'use strict';

  let currentParams = {
    page: 1,
    limit: 10,
    search: '',
    status: '',
  };

  let activeEditorState = null; // Tracks dirty form state & current slide object

  async function renderHeroModule(container) {
    if (!container) return;

    container.innerHTML = `
      <!-- Page Header Bar -->
      <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; flex-wrap:wrap; gap:16px;">
        <div>
          <h2 style="font-size:1.5rem; font-weight:800; color:#fff; margin:0 0 4px 0; letter-spacing:-0.02em; display:flex; align-items:center; gap:10px;">
            <i class="fas fa-film" style="color:var(--accent-orange, #F25912);"></i> Hero Slides & Cinematic Header
          </h2>
          <p style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin:0;">
            Manage homepage hero slides, video/image backgrounds, kinetic headlines, overlays, and CTA buttons.
          </p>
        </div>

        <button type="button" class="btn btn-primary" id="createNewHeroBtn" style="display:inline-flex; align-items:center; gap:6px; background:var(--accent-orange, #F25912); border-color:var(--accent-orange, #F25912); padding:10px 18px; font-weight:700;">
          <i class="fas fa-plus"></i> + New Hero Slide Draft
        </button>
      </div>

      <!-- Main Data Table Container -->
      <div id="heroTableContainer">
        <p style="color:var(--text-muted, #8E929E);"><i class="fas fa-spinner fa-spin" style="color:var(--accent-orange, #F25912);"></i> Loading Hero slides...</p>
      </div>
    `;

    const createBtn = container.querySelector('#createNewHeroBtn');
    if (createBtn) createBtn.addEventListener('click', () => openHeroEditor(null));

    await loadHeroList();
  }

  async function loadHeroList() {
    const tableContainer = document.getElementById('heroTableContainer');
    if (!tableContainer) return;

    try {
      const res = await window.AdminApi.get('/admin/hero', currentParams);
      const items = res.data || [];
      const meta = res.meta || { page: 1, totalPages: 1, total: items.length };

      window.AdminTable.renderTable({
        container: tableContainer,
        columns: [
          {
            header: 'Media Preview',
            render: (item) => {
              const isVideo = item.mediaType === 'video' || (item.videoUrl && !item.imageUrl);
              if (isVideo) {
                return `
                  <div style="width:72px; height:44px; background:#000; border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--accent-orange, #F25912); border:1px solid var(--border-hairline, #2D2D3B); position:relative; overflow:hidden;">
                    <i class="fas fa-play" style="font-size:1.1rem; z-index:2;"></i>
                    <span style="position:absolute; bottom:2px; right:4px; font-size:0.6rem; font-weight:800; color:#fff; background:rgba(0,0,0,0.7); padding:1px 3px; border-radius:3px;">MP4</span>
                  </div>
                `;
              }
              if (item.imageUrl) {
                return `
                  <div style="width:72px; height:44px; border-radius:6px; border:1px solid var(--border-hairline, #2D2D3B); overflow:hidden; background:#111; position:relative;">
                    <img src="${escapeHtml(item.imageUrl)}" style="width:100%; height:100%; object-fit:cover;" alt="Slide Preview" onerror="this.outerHTML='<div style=\\'width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#666;font-size:12px;\\'><i class=\\'fas fa-image\\'></i></div>'" />
                  </div>
                `;
              }
              return `
                <div style="width:72px; height:44px; background:var(--bg-dark, #111116); border-radius:6px; display:flex; align-items:center; justify-content:center; color:var(--text-muted, #8E929E); border:1px solid var(--border-hairline, #2D2D3B);">
                  <i class="fas fa-photo-video"></i>
                </div>
              `;
            },
          },
          {
            header: 'Kinetic Headline',
            render: (item) => `
              <div style="font-weight:700; color:#fff; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:0.92rem;">
                ${escapeHtml(item.heading || 'ASHWA RIDERS')}
              </div>
              <div style="font-size:0.78rem; color:var(--text-muted, #8E929E); max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-top:2px;">
                ${escapeHtml(item.subtitle || 'Engineering Speed. Building Innovation.')}
              </div>
            `,
          },
          {
            header: 'Badge Tag',
            render: (item) => `
              <span style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); padding:4px 8px; border-radius:6px; font-size:0.75rem; font-weight:600; color:var(--text-muted, #8E929E);">
                ${escapeHtml(item.badgeText || 'Ashwa Riders')}
              </span>
            `,
          },
          {
            header: 'Media Type',
            render: (item) => {
              const type = (item.mediaType || 'video').toLowerCase();
              if (type === 'video') {
                return `<span style="background:rgba(14,165,233,0.15); border:1px solid rgba(14,165,233,0.3); color:#0EA5E9; font-size:0.75rem; font-weight:800; padding:3px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;"><i class="fas fa-video"></i> VIDEO</span>`;
              }
              return `<span style="background:rgba(242,89,18,0.15); border:1px solid rgba(242,89,18,0.3); color:var(--accent-orange, #F25912); font-size:0.75rem; font-weight:800; padding:3px 8px; border-radius:12px; display:inline-flex; align-items:center; gap:4px;"><i class="fas fa-image"></i> IMAGE</span>`;
            },
          },
          {
            header: 'Status',
            render: (item) => {
              const st = (item.status || 'draft').toLowerCase();
              if (st === 'published') {
                return `<span style="background:rgba(46,164,79,0.15); border:1px solid rgba(46,164,79,0.3); color:#2EA44F; font-size:0.78rem; font-weight:700; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#2EA44F;"></span> Published</span>`;
              }
              if (st === 'archived') {
                return `<span style="background:rgba(255,255,255,0.06); border:1px solid var(--border-hairline, #2D2D3B); color:var(--text-muted, #8E929E); font-size:0.78rem; font-weight:700; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#8E929E;"></span> Archived</span>`;
              }
              return `<span style="background:rgba(245,158,11,0.15); border:1px solid rgba(245,158,11,0.3); color:#F59E0B; font-size:0.78rem; font-weight:700; padding:4px 10px; border-radius:12px; display:inline-flex; align-items:center; gap:5px;"><span style="width:6px; height:6px; border-radius:50%; background:#F59E0B;"></span> Draft</span>`;
            },
          },
          {
            header: 'Priority',
            render: (item) => `<span style="font-family:var(--font-mono, monospace); font-size:0.85rem; font-weight:800; color:var(--accent-orange, #F25912);">#${item.order || 1}</span>`,
          },
          {
            header: 'Updated',
            render: (item) => `<small style="font-family:var(--font-mono, monospace); color:var(--text-muted, #8E929E); font-size:0.78rem;">${item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : '—'}</small>`,
          },
        ],
        items,
        meta,
        searchValue: currentParams.search,
        statusFilterValue: currentParams.status,
        onSearch: (val) => {
          currentParams.search = val;
          currentParams.page = 1;
          loadHeroList();
        },
        onStatusFilter: (val) => {
          currentParams.status = val;
          currentParams.page = 1;
          loadHeroList();
        },
        onPageChange: (newPage) => {
          currentParams.page = newPage;
          loadHeroList();
        },
        actions: {
          createBtnLabel: '+ New Hero Slide Draft',
          onCreate: () => openHeroEditor(null),
          onEdit: (id) => openHeroEditor(id),
          onDelete: (id) => handleDeleteHero(id),
          onDuplicate: (id) => handleDuplicate(id),
          onArchive: (id) => handleArchive(id),
          onRestore: (id) => handleRestore(id),
        },
      });
    } catch (err) {
      if (window.AdminToast) {
        window.AdminToast.error('Failed to load Hero slides: ' + err.message);
      }
    }
  }

  async function openHeroEditor(id = null) {
    let slide = {
      heading: 'ASHWA RIDERS',
      subtitle: 'Engineering Speed. Building Innovation. Racing the Future.',
      badgeText: 'Ashwa Riders — 2026 Season',
      mediaType: 'video',
      videoUrl: 'https://res.cloudinary.com/frjck4sc/video/upload/v1784445874/vidssave.com_This_is_FORMULA_1_1080P_ex9dby.mp4',
      imageUrl: '',
      mobileImageUrl: '',
      primaryBtnText: 'Explore Our Car',
      primaryBtnLink: 'car.html',
      secondaryBtnText: 'Become a Sponsor',
      secondaryBtnLink: 'sponsors.html',
      overlayOpacity: 40,
      textAlignment: 'center',
      order: 1,
      version: 1,
      status: 'draft',
    };

    if (id) {
      try {
        const res = await window.AdminApi.get(`/admin/hero/${id}`);
        if (res.success && res.data) {
          slide = res.data;
        }
      } catch (err) {
        if (window.AdminToast) window.AdminToast.error('Failed to fetch slide details: ' + err.message);
        return;
      }
    }

    activeEditorState = {
      isDirty: false,
      originalData: JSON.parse(JSON.stringify(slide)),
      currentData: JSON.parse(JSON.stringify(slide)),
      id,
    };

    const drawerTitle = id ? `Edit Hero Slide` : 'New Hero Slide';

    const editorHtml = `
      <div style="display:flex; flex-direction:column; gap:20px;">
        
        <!-- Live Kinetic Header Preview Card -->
        <div style="background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:10px; padding:20px; position:relative; overflow:hidden;">
          <div style="font-size:0.72rem; font-weight:800; text-transform:uppercase; letter-spacing:0.06em; color:var(--accent-orange, #F25912); margin-bottom:12px; display:flex; align-items:center; gap:6px;">
            <i class="fas fa-desktop"></i> Live Homepage Header Snippet Preview
          </div>
          <div style="text-align:center; padding:16px 10px; background:rgba(0,0,0,0.6); border-radius:8px; border:1px solid rgba(255,255,255,0.05);">
            <span id="prevBadgeText" style="display:inline-block; font-size:0.75rem; font-weight:700; background:rgba(242,89,18,0.2); border:1px solid var(--accent-orange, #F25912); color:#fff; padding:3px 12px; border-radius:20px; margin-bottom:10px; text-transform:uppercase;">
              ${escapeHtml(slide.badgeText || 'ASHWA RIDERS — 2026 SEASON')}
            </span>
            <h2 id="prevHeading" style="font-size:1.4rem; font-weight:900; color:#fff; margin:0 0 6px 0; text-transform:uppercase; letter-spacing:-0.01em;">
              ${escapeHtml(slide.heading || 'ASHWA RIDERS')}
            </h2>
            <p id="prevSubtitle" style="font-size:0.85rem; color:var(--text-muted, #8E929E); margin:0 0 16px 0; max-width:400px; margin-left:auto; margin-right:auto;">
              ${escapeHtml(slide.subtitle || 'Engineering Speed. Building Innovation.')}
            </p>
            <div style="display:flex; justify-content:center; gap:10px;">
              <span id="prevPrimaryBtn" style="background:var(--accent-orange, #F25912); color:#fff; font-size:0.8rem; font-weight:700; padding:8px 16px; border-radius:6px;">
                ${escapeHtml(slide.primaryBtnText || 'Explore Our Car')}
              </span>
              <span id="prevSecondaryBtn" style="background:transparent; border:1px solid #fff; color:#fff; font-size:0.8rem; font-weight:700; padding:8px 16px; border-radius:6px;">
                ${escapeHtml(slide.secondaryBtnText || 'Become a Sponsor')}
              </span>
            </div>
          </div>
        </div>

        <!-- SECTION 1: MEDIA BACKGROUND -->
        <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:10px; padding:18px;">
          <h4 style="font-size:0.85rem; font-weight:800; color:var(--accent-orange, #F25912); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 14px 0; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-photo-video"></i> 1. Media Asset Background
          </h4>

          <div style="display:flex; gap:18px; margin-bottom:14px;">
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#fff; font-size:0.88rem; font-weight:600;">
              <input type="radio" name="mediaType" value="video" ${slide.mediaType === 'video' ? 'checked' : ''} style="accent-color:var(--accent-orange, #F25912);" />
              <span>Cinematic Video (MP4)</span>
            </label>
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#fff; font-size:0.88rem; font-weight:600;">
              <input type="radio" name="mediaType" value="image" ${slide.mediaType === 'image' ? 'checked' : ''} style="accent-color:var(--accent-orange, #F25912);" />
              <span>High-Res Image (JPG/PNG)</span>
            </label>
          </div>

          <!-- Drag & Drop Zone -->
          <div id="mediaDropzone" style="border: 2px dashed var(--border-hairline, #2D2D3B); border-radius:8px; padding:24px 16px; text-align:center; cursor:pointer; background:var(--bg-dark, #111116); transition:all 0.2s ease;">
            <div id="dropzoneContent">
              <i class="fas fa-cloud-upload-alt" style="font-size:2rem; color:var(--accent-orange, #F25912); margin-bottom:8px;"></i>
              <div style="font-weight:700; font-size:0.92rem; color:#fff; margin-bottom:4px;">Drag & drop image or video file</div>
              <div style="color:var(--text-muted, #8E929E); font-size:0.8rem; margin-bottom:12px;">or click to browse local files</div>
              <div style="display:inline-flex; gap:10px;">
                <span class="btn btn-secondary btn-sm" id="btnMediaPickerSelect" style="padding:6px 12px; font-size:0.8rem;">
                  <i class="fas fa-photo-video"></i> Media Library
                </span>
                <button type="button" class="btn btn-secondary btn-sm" id="btnDeleteMedia" style="padding:6px 12px; font-size:0.8rem; background:rgba(239,68,68,0.15); border:1px solid rgba(239,68,68,0.3); color:#EF4444; font-weight:700; cursor:pointer;" title="Delete / Remove Current Media Asset">
                  <i class="fas fa-trash-alt"></i> Remove Media
                </button>
              </div>
            </div>
            <div id="dropzonePreview" style="display:${(slide.imageUrl || slide.videoUrl) ? 'block' : 'none'}; margin-top:8px;">
              ${slide.mediaType === 'video' && slide.videoUrl ? `
                <video src="${escapeHtml(slide.videoUrl)}" style="max-height:120px; border-radius:6px; border:1px solid var(--border-hairline, #2D2D3B);" controls></video>
              ` : slide.imageUrl ? `
                <img id="mediaPreviewImg" src="${escapeHtml(slide.imageUrl)}" style="max-height:120px; border-radius:6px; border:1px solid var(--border-hairline, #2D2D3B); object-fit:cover;" />
              ` : ''}
              <div style="font-size:0.78rem; color:#2EA44F; margin-top:6px; font-weight:600;"><i class="fas fa-check-circle"></i> Asset loaded</div>
            </div>
            <input type="file" id="mediaFileInput" accept="image/*,video/*" style="display:none;" />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:14px;">
            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Image URL
              </label>
              <input type="text" id="inputImageUrl" class="cms-input" value="${escapeHtml(slide.imageUrl || '')}" placeholder="https://res.cloudinary.com/..." style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.88rem; outline:none;" />
            </div>
            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Video URL
              </label>
              <input type="text" id="inputVideoUrl" class="cms-input" value="${escapeHtml(slide.videoUrl || '')}" placeholder="https://res.cloudinary.com/...mp4" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.88rem; outline:none;" />
            </div>
          </div>
        </div>

        <!-- SECTION 2: HEADLINE & CONTENT -->
        <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:10px; padding:18px;">
          <h4 style="font-size:0.85rem; font-weight:800; color:var(--accent-orange, #F25912); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 14px 0; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-heading"></i> 2. Kinetic Headline & Subtitle
          </h4>

          <div style="display:flex; flex-direction:column; gap:14px;">
            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Kinetic Headline *
              </label>
              <input type="text" id="inputHeading" class="cms-input" value="${escapeHtml(slide.heading || 'ASHWA RIDERS')}" required placeholder="ASHWA RIDERS" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
              <div class="field-error" id="errHeading" style="color:#EF4444; font-size:0.75rem; display:none; margin-top:4px;"></div>
            </div>

            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Subtitle / Tagline
              </label>
              <input type="text" id="inputSubtitle" class="cms-input" value="${escapeHtml(slide.subtitle || '')}" placeholder="Engineering Speed. Building Innovation. Racing the Future." style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
              <div class="field-error" id="errSubtitle" style="color:#EF4444; font-size:0.75rem; display:none; margin-top:4px;"></div>
            </div>

            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">
                Badge / Tag Text
              </label>
              <input type="text" id="inputBadgeText" class="cms-input" value="${escapeHtml(slide.badgeText || '')}" placeholder="ASHWA RIDERS — 2026 SEASON" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:11px 14px; color:#fff; font-size:0.92rem; outline:none;" />
            </div>
          </div>
        </div>

        <!-- SECTION 3: BUTTON CONFIGURATION -->
        <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:10px; padding:18px;">
          <h4 style="font-size:0.85rem; font-weight:800; color:var(--accent-orange, #F25912); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 14px 0; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-link"></i> 3. Call-To-Action Buttons
          </h4>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:12px;">
            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Primary Button Text</label>
              <input type="text" id="inputPrimaryBtnText" class="cms-input" value="${escapeHtml(slide.primaryBtnText || 'Explore Our Car')}" placeholder="Explore Our Car" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem; outline:none;" />
            </div>
            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Primary Target Link</label>
              <input type="text" id="inputPrimaryBtnLink" class="cms-input" value="${escapeHtml(slide.primaryBtnLink || 'car.html')}" placeholder="car.html" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem; outline:none;" />
            </div>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Secondary Button Text</label>
              <input type="text" id="inputSecondaryBtnText" class="cms-input" value="${escapeHtml(slide.secondaryBtnText || 'Become a Sponsor')}" placeholder="Become a Sponsor" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem; outline:none;" />
            </div>
            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Secondary Target Link</label>
              <input type="text" id="inputSecondaryBtnLink" class="cms-input" value="${escapeHtml(slide.secondaryBtnLink || 'sponsors.html')}" placeholder="sponsors.html" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem; outline:none;" />
            </div>
          </div>
        </div>

        <!-- SECTION 4: SETTINGS & PRIORITY -->
        <div style="background:var(--surface-dark, #181820); border:1px solid var(--border-hairline, #2D2D3B); border-radius:10px; padding:18px;">
          <h4 style="font-size:0.85rem; font-weight:800; color:var(--accent-orange, #F25912); text-transform:uppercase; letter-spacing:0.06em; margin:0 0 14px 0; display:flex; align-items:center; gap:8px;">
            <i class="fas fa-sliders-h"></i> 4. Settings & Ordering
          </h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Lifecycle Status</label>
              <select id="selectStatus" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem; outline:none; cursor:pointer;">
                <option value="draft" ${slide.status === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="published" ${slide.status === 'published' ? 'selected' : ''}>Published</option>
                <option value="archived" ${slide.status === 'archived' ? 'selected' : ''}>Archived</option>
              </select>
            </div>
            <div class="cms-field">
              <label class="cms-label" style="display:block; font-size:0.75rem; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:var(--text-muted, #8E929E); margin-bottom:6px;">Display Priority Order</label>
              <input type="number" id="inputOrder" class="cms-input" value="${slide.order || 1}" min="1" style="width:100%; background:var(--bg-dark, #111116); border:1px solid var(--border-hairline, #2D2D3B); border-radius:8px; padding:10px 14px; color:#fff; font-size:0.9rem; outline:none;" />
            </div>
          </div>
        </div>

      </div>
    `;

    window.AdminDrawer.openDrawer({
      title: drawerTitle,
      status: slide.status || 'draft',
      content: editorHtml,
      footerButtons: [
        {
          id: 'btnHeroCancel',
          label: 'Cancel',
          class: 'btn-secondary',
          onClick: () => handleCloseDrawer(),
        },
        {
          id: 'btnHeroSaveDraft',
          label: 'Save Draft',
          class: 'btn-secondary',
          onClick: () => saveHeroSlide('draft'),
        },
        {
          id: 'btnHeroPublish',
          label: 'Publish to Website',
          class: 'btn-primary',
          onClick: () => saveHeroSlide('published'),
        },
      ],
    });

    bindEditorHandlers();
  }

  function bindEditorHandlers() {
    const drawer = document.getElementById('adminDrawer');
    if (!drawer) return;

    // Delete Media button
    const deleteMediaBtn = drawer.querySelector('#btnDeleteMedia');
    if (deleteMediaBtn) {
      deleteMediaBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        activeEditorState.currentData.imageUrl = '';
        activeEditorState.currentData.videoUrl = '';
        const inputVid = drawer.querySelector('#inputVideoUrl');
        const inputImg = drawer.querySelector('#inputImageUrl');
        if (inputVid) inputVid.value = '';
        if (inputImg) inputImg.value = '';
        const previewContainer = drawer.querySelector('#dropzonePreview');
        if (previewContainer) {
          previewContainer.style.display = 'none';
          previewContainer.innerHTML = '';
        }
        markDirty();
        if (window.AdminToast) window.AdminToast.info('Media asset removed from slide.');
      });
    }

    // Media Picker button
    const pickerBtn = drawer.querySelector('#btnMediaPickerSelect');
    if (pickerBtn) {
      pickerBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.MediaPicker) {
          window.MediaPicker.open({
            allowedType: 'all',
            onSelect: (asset) => {
              const fileUrl = asset.secureUrl || asset.url;
              const isVideo = asset.resourceType === 'video' || fileUrl.endsWith('.mp4');
              const mediaType = isVideo ? 'video' : 'image';

              const radio = drawer.querySelector(`input[name="mediaType"][value="${mediaType}"]`);
              if (radio) radio.checked = true;
              activeEditorState.currentData.mediaType = mediaType;

              if (mediaType === 'video') {
                activeEditorState.currentData.videoUrl = fileUrl;
                const inputVid = drawer.querySelector('#inputVideoUrl');
                if (inputVid) inputVid.value = fileUrl;
              } else {
                activeEditorState.currentData.imageUrl = fileUrl;
                const inputImg = drawer.querySelector('#inputImageUrl');
                if (inputImg) inputImg.value = fileUrl;
              }
              markDirty();

              const previewContainer = drawer.querySelector('#dropzonePreview');
              if (previewContainer) {
                previewContainer.style.display = 'block';
                previewContainer.innerHTML = mediaType === 'video'
                  ? `<video src="${fileUrl}" style="max-height:120px; border-radius:6px; border:1px solid var(--border-hairline, #2D2D3B);" controls></video>`
                  : `<img src="${fileUrl}" style="max-height:120px; border-radius:6px; border:1px solid var(--border-hairline, #2D2D3B); object-fit:cover;" />`;
              }
            },
          });
        }
      });
    }

    // Media Dropzone
    const dropzone = drawer.querySelector('#mediaDropzone');
    const fileInput = drawer.querySelector('#mediaFileInput');
    const previewContainer = drawer.querySelector('#dropzonePreview');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        if (e.target.id === 'btnMediaPickerSelect' || e.target.closest('#btnMediaPickerSelect')) return;
        fileInput.click();
      });

      ['dragenter', 'dragover'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.style.borderColor = 'var(--accent-orange, #F25912)';
          dropzone.style.background = 'rgba(242, 89, 18, 0.08)';
        });
      });

      ['dragleave', 'drop'].forEach((eventName) => {
        dropzone.addEventListener(eventName, (e) => {
          e.preventDefault();
          e.stopPropagation();
          dropzone.style.borderColor = 'var(--border-hairline, #2D2D3B)';
          dropzone.style.background = 'var(--bg-dark, #111116)';
        });
      });

      dropzone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          handleMediaFileUpload(files[0]);
        }
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          handleMediaFileUpload(e.target.files[0]);
        }
      });
    }

    async function handleMediaFileUpload(file) {
      if (!file) return;
      const isVideo = file.type.startsWith('video/');
      const mediaType = isVideo ? 'video' : 'image';

      const radio = drawer.querySelector(`input[name="mediaType"][value="${mediaType}"]`);
      if (radio) radio.checked = true;
      activeEditorState.currentData.mediaType = mediaType;

      try {
        if (window.AdminToast) window.AdminToast.info(`Uploading ${mediaType} file...`);
        let uploadRes;

        if (window.AdminUploader && window.AdminUploader.uploadFile) {
          uploadRes = await window.AdminUploader.uploadFile(file, {
            allowedType: isVideo ? 'video' : 'image',
            folder: isVideo ? 'ashwa_cms/videos' : 'ashwa_cms/images',
            onProgress: (pct, msg) => {
              if (window.AdminToast && pct % 25 === 0) window.AdminToast.info(msg);
            },
          });
        } else {
          const formData = new FormData();
          formData.append('file', file);
          const token = localStorage.getItem('token');
          const res = await fetch('/api/v1/admin/media/upload', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
          const json = await res.json();
          if (json.success && json.data) {
            uploadRes = { url: json.data.secureUrl || json.data.url };
          } else {
            throw new Error(json.message || 'Upload failed');
          }
        }

        const fileUrl = uploadRes.url || uploadRes.secureUrl;
        if (fileUrl) {
          if (mediaType === 'video') {
            activeEditorState.currentData.videoUrl = fileUrl;
            const inputVid = drawer.querySelector('#inputVideoUrl');
            if (inputVid) inputVid.value = fileUrl;
          } else {
            activeEditorState.currentData.imageUrl = fileUrl;
            const inputImg = drawer.querySelector('#inputImageUrl');
            if (inputImg) inputImg.value = fileUrl;
          }
          markDirty();

          if (previewContainer) {
            previewContainer.style.display = 'block';
            previewContainer.innerHTML = mediaType === 'video'
              ? `<video src="${fileUrl}" style="max-height:120px; border-radius:6px; border:1px solid var(--border-hairline, #2D2D3B);" controls></video>`
              : `<img src="${fileUrl}" style="max-height:120px; border-radius:6px; border:1px solid var(--border-hairline, #2D2D3B); object-fit:cover;" />`;
          }
          if (window.AdminToast) window.AdminToast.success(`${mediaType === 'video' ? 'Video' : 'Image'} uploaded and verified successfully!`);
        }
      } catch (err) {
        if (window.AdminToast) window.AdminToast.error('Upload failed: ' + err.message);
      }
    }

    // Radio Media Switcher
    const mediaRadios = drawer.querySelectorAll('input[name="mediaType"]');
    mediaRadios.forEach((r) => {
      r.addEventListener('change', (e) => {
        const val = e.target.value;
        activeEditorState.currentData.mediaType = val;
        markDirty();
      });
    });

    // Reactive Form Inputs & Live Preview Sync
    const inputsToBind = [
      { id: '#inputHeading', field: 'heading', previewId: '#prevHeading', defaultVal: 'ASHWA RIDERS' },
      { id: '#inputSubtitle', field: 'subtitle', previewId: '#prevSubtitle', defaultVal: 'Engineering Speed. Building Innovation.' },
      { id: '#inputBadgeText', field: 'badgeText', previewId: '#prevBadgeText', defaultVal: 'ASHWA RIDERS — 2026 SEASON' },
      { id: '#inputPrimaryBtnText', field: 'primaryBtnText', previewId: '#prevPrimaryBtn', defaultVal: 'Explore Our Car' },
      { id: '#inputSecondaryBtnText', field: 'secondaryBtnText', previewId: '#prevSecondaryBtn', defaultVal: 'Become a Sponsor' },
      { id: '#inputPrimaryBtnLink', field: 'primaryBtnLink' },
      { id: '#inputSecondaryBtnLink', field: 'secondaryBtnLink' },
      { id: '#inputVideoUrl', field: 'videoUrl' },
      { id: '#inputImageUrl', field: 'imageUrl' },
    ];

    inputsToBind.forEach(({ id, field, previewId, defaultVal }) => {
      const inputEl = drawer.querySelector(id);
      if (inputEl) {
        inputEl.addEventListener('input', (e) => {
          const val = e.target.value;
          activeEditorState.currentData[field] = val;
          if (previewId) {
            const prevEl = drawer.querySelector(previewId);
            if (prevEl) prevEl.textContent = val || defaultVal;
          }
          markDirty();
        });
      }
    });

    // Status Select
    const statusSelect = drawer.querySelector('#selectStatus');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        activeEditorState.currentData.status = e.target.value;
        markDirty();
      });
    }

    // Priority Order
    const orderInput = drawer.querySelector('#inputOrder');
    if (orderInput) {
      orderInput.addEventListener('input', (e) => {
        activeEditorState.currentData.order = Number(e.target.value) || 1;
        markDirty();
      });
    }
  }

  function markDirty() {
    if (!activeEditorState) return;
    activeEditorState.isDirty = true;
    if (window.AdminDrawer && window.AdminDrawer.markDirty) {
      window.AdminDrawer.markDirty();
    }
  }

  function validateForm() {
    let isValid = true;
    const drawer = document.getElementById('adminDrawer');
    if (!drawer || !activeEditorState) return false;

    const heading = activeEditorState.currentData.heading;
    const errHeading = drawer.querySelector('#errHeading');

    if (!heading || !heading.trim()) {
      if (errHeading) { errHeading.textContent = 'Main kinetic headline is required.'; errHeading.style.display = 'block'; }
      isValid = false;
    } else {
      if (errHeading) errHeading.style.display = 'none';
    }

    return isValid;
  }

  async function saveHeroSlide(targetStatus) {
    if (!validateForm()) {
      if (window.AdminToast) window.AdminToast.error('Please fill required headline before saving.');
      return;
    }

    const data = activeEditorState.currentData;
    data.status = targetStatus || data.status || 'draft';

    const saveBtn = document.getElementById('btnHeroSaveDraft');
    const publishBtn = document.getElementById('btnHeroPublish');

    if (targetStatus === 'published' && publishBtn) {
      publishBtn.disabled = true;
      publishBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publishing...';
    } else if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
    }

    try {
      let res;
      if (activeEditorState.id) {
        res = await window.AdminApi.patch(`/admin/hero/${activeEditorState.id}`, data);
        if (targetStatus === 'published') {
          res = await window.AdminApi.post(`/admin/hero/${activeEditorState.id}/publish`);
        }
      } else {
        res = await window.AdminApi.post('/admin/hero', data);
        if (targetStatus === 'published' && res.data && res.data._id) {
          res = await window.AdminApi.post(`/admin/hero/${res.data._id}/publish`);
        }
      }

      if (window.AdminToast) {
        if (targetStatus === 'published') {
          window.AdminToast.success('✓ Hero slide published successfully!');
        } else {
          window.AdminToast.success('Hero slide draft saved successfully.');
        }
      }

      activeEditorState.isDirty = false;
      window.AdminDrawer.closeDrawer();
      await loadHeroList();
    } catch (err) {
      if (window.AdminToast) {
        window.AdminToast.error('Save failed: ' + err.message);
      }
    } finally {
      if (saveBtn) { saveBtn.disabled = false; saveBtn.innerHTML = 'Save Draft'; }
      if (publishBtn) { publishBtn.disabled = false; publishBtn.innerHTML = 'Publish to Website'; }
    }
  }

  function handleCloseDrawer() {
    if (activeEditorState && activeEditorState.isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        return;
      }
    }
    activeEditorState = null;
    window.AdminDrawer.closeDrawer();
  }

  async function handleDuplicate(id) {
    try {
      await window.AdminApi.post(`/admin/hero/${id}/duplicate`);
      if (window.AdminToast) window.AdminToast.success('Hero slide duplicated as new draft.');
      await loadHeroList();
    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Duplicate failed: ' + err.message);
    }
  }

  async function handleArchive(id) {
    if (!confirm('Are you sure you want to archive this Hero slide?')) return;
    try {
      await window.AdminApi.post(`/admin/hero/${id}/archive`);
      if (window.AdminToast) window.AdminToast.success('Hero slide archived.');
      await loadHeroList();
    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Archive failed: ' + err.message);
    }
  }

  async function handleRestore(id) {
    try {
      await window.AdminApi.post(`/admin/hero/${id}/restore`);
      if (window.AdminToast) window.AdminToast.success('Hero slide restored to draft.');
      await loadHeroList();
    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Restore failed: ' + err.message);
    }
  }

  async function handleDeleteHero(id) {
    if (!confirm('Are you sure you want to permanently delete this Hero slide? This media item will be removed.')) return;
    try {
      await window.AdminApi.delete(`/admin/hero/${id}`);
      if (window.AdminToast) window.AdminToast.success('Hero slide deleted successfully.');
      await loadHeroList();
    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Delete failed: ' + err.message);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  window.AdminHeroModule = {
    renderHeroModule,
  };
})();

