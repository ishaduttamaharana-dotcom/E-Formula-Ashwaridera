/* ============================================================
   buildStages.js — Professional Drag-and-Drop Build Stage & Content Block CMS
   Connected to /api/v1/admin/build-stages REST APIs.
============================================================ */

(function () {
  'use strict';

  let stagesList = [];
  let selectedStageId = null;
  let activeStageData = null;
  let isDirty = false;

  async function renderBuildStagesModule(container) {
    container.innerHTML = `
      <div class="page-title-bar" style="margin-bottom:16px;">
        <div>
          <h2 class="page-title"><i class="fas fa-cubes text-orange"></i> Build Stage Studio & Drag-and-Drop CMS</h2>
          <p class="page-subtitle">Reorder timeline stages, manage structured content blocks, customize styling, and preview changes in real time.</p>
        </div>
        <div style="display:flex;gap:10px;align-items:center;">
          <button type="button" class="btn btn-secondary btn-sm" id="btnRefreshStages">
            <i class="fas fa-sync-alt"></i> Refresh
          </button>
          <button type="button" class="btn btn-primary" id="btnCreateStage">
            <i class="fas fa-plus"></i> New Stage Draft
          </button>
        </div>
      </div>

      <div class="cms-dual-pane-layout" style="display:grid;grid-template-columns:340px 1fr;gap:20px;min-height: calc(100vh - 180px);align-items:start;">
        
        <!-- LEFT PANE: DRAG-AND-DROP STAGE LIST -->
        <div class="stage-list-card" style="background:var(--panel-bg, #16161a);border:1px solid var(--border-hairline, #2a2a32);border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <h3 style="font-size:0.95rem;font-weight:600;margin:0;color:#fff;">
              <i class="fas fa-list-ol text-orange"></i> Timeline Stages (<span id="stageCount">0</span>)
            </h3>
            <span style="font-size:0.75rem;color:var(--text-muted, #8a8a9e);">Drag handle to reorder</span>
          </div>

          <div id="stagesDragContainer" style="display:flex;flex-direction:column;gap:8px;max-height: calc(100vh - 270px);overflow-y:auto;padding-right:4px;">
            <p style="color:var(--text-muted, #8a8a9e);font-size:0.85rem;">Loading stages...</p>
          </div>
        </div>

        <!-- RIGHT PANE: STAGE EDITOR & LIVE PREVIEW -->
        <div class="stage-editor-card" id="stageEditorContainer" style="background:var(--panel-bg, #16161a);border:1px solid var(--border-hairline, #2a2a32);border-radius:8px;padding:20px;min-height:600px;">
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:400px;color:var(--text-muted, #8a8a9e);text-align:center;">
            <i class="fas fa-mouse-pointer" style="font-size:36px;margin-bottom:16px;color:var(--accent-orange, #ff6b00);opacity:0.6;"></i>
            <h4 style="color:#fff;margin-bottom:6px;">Select a Build Stage to Edit</h4>
            <p style="font-size:0.85rem;max-width:320px;">Choose a stage from the left timeline panel or click "New Stage Draft" to start building.</p>
          </div>
        </div>

      </div>
    `;

    document.getElementById('btnRefreshStages')?.addEventListener('click', () => loadStagesList());
    document.getElementById('btnCreateStage')?.addEventListener('click', () => openNewStageForm());

    await loadStagesList();
  }

  async function loadStagesList(selectId = null) {
    const container = document.getElementById('stagesDragContainer');
    if (!container) return;

    try {
      const res = await window.AdminApi.get('/admin/build-stages', { limit: 100 });
      stagesList = (res.data && res.data) || (res.data || []);

      // Sort by order ascending
      stagesList.sort((a, b) => (a.order || 0) - (b.order || 0));

      const countEl = document.getElementById('stageCount');
      if (countEl) countEl.textContent = stagesList.length;

      if (stagesList.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted, #8a8a9e);font-size:0.85rem;text-align:center;padding:20px 0;">No build stages found. Click "+ New Stage Draft" to create your first stage.</p>`;
        document.getElementById('stageEditorContainer').innerHTML = `
          <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:400px;color:var(--text-muted, #8a8a9e);text-align:center;">
            <i class="fas fa-plus-circle" style="font-size:36px;margin-bottom:16px;color:var(--accent-orange, #ff6b00);"></i>
            <h4 style="color:#fff;margin-bottom:6px;">No Build Stages Created</h4>
            <button type="button" class="btn btn-primary" onclick="document.getElementById('btnCreateStage').click()">
              <i class="fas fa-plus"></i> Create First Stage
            </button>
          </div>
        `;
        return;
      }

      renderStageListItems(container);

      // Select target stage or default to first
      const targetId = selectId || selectedStageId || stagesList[0]._id || stagesList[0].id;
      selectStageForEditing(targetId);

    } catch (err) {
      if (window.AdminToast) {
        window.AdminToast.error('Failed to load build stages: ' + err.message);
      }
    }
  }

  function renderStageListItems(container) {
    container.innerHTML = stagesList.map((stage, idx) => {
      const isSelected = (stage._id || stage.id) === selectedStageId;
      const statusBadgeClass = stage.status === 'published' ? 'badge-success' : stage.status === 'archived' ? 'badge-secondary' : 'badge-warning';
      
      return `
        <div class="stage-list-item ${isSelected ? 'active' : ''}" 
             data-id="${stage._id || stage.id}" 
             data-index="${idx}"
             draggable="true"
             style="background:${isSelected ? 'rgba(255,107,0,0.12)' : 'rgba(255,255,255,0.02)'};border:1px solid ${isSelected ? 'var(--accent-orange, #ff6b00)' : 'rgba(255,255,255,0.06)'};border-radius:6px;padding:10px 12px;display:flex;align-items:center;gap:10px;cursor:pointer;transition:all 0.15s ease;"
             title="Click to edit, drag handle to reorder">
          
          <div class="drag-handle" style="cursor:grab;color:var(--text-muted, #8a8a9e);padding:2px 4px;font-size:14px;" title="Drag to reorder">
            <i class="fas fa-grip-vertical"></i>
          </div>

          <div style="width:32px;height:32px;border-radius:4px;background:#111;border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;color:var(--accent-orange, #ff6b00);font-size:14px;flex-shrink:0;">
            <i class="${stage.icon || 'fas fa-wrench'}"></i>
          </div>

          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;gap:6px;">
              <span style="font-size:0.7rem;font-weight:700;color:var(--accent-orange, #ff6b00);background:rgba(255,107,0,0.15);padding:1px 5px;border-radius:2px;">STAGE ${stage.stageNumber || idx + 1}</span>
              <span class="badge ${statusBadgeClass}" style="font-size:0.65rem;padding:1px 6px;">${stage.status || 'draft'}</span>
            </div>
            <div style="font-size:0.85rem;font-weight:600;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px;">${stage.title || 'Untitled Stage'}</div>
          </div>

          <div style="display:flex;flex-direction:column;gap:2px;">
            <button type="button" class="btn-icon-move btn-move-up" data-id="${stage._id || stage.id}" title="Move Up" style="background:none;border:none;color:#8a8a9e;cursor:pointer;font-size:10px;padding:1px;" ${idx === 0 ? 'disabled style="opacity:0.3;cursor:default;"' : ''}>
              <i class="fas fa-chevron-up"></i>
            </button>
            <button type="button" class="btn-icon-move btn-move-down" data-id="${stage._id || stage.id}" title="Move Down" style="background:none;border:none;color:#8a8a9e;cursor:pointer;font-size:10px;padding:1px;" ${idx === stagesList.length - 1 ? 'disabled style="opacity:0.3;cursor:default;"' : ''}>
              <i class="fas fa-chevron-down"></i>
            </button>
          </div>

        </div>
      `;
    }).join('');

    attachStageListEvents(container);
  }

  function attachStageListEvents(container) {
    // Select stage item on click
    container.querySelectorAll('.stage-list-item').forEach(item => {
      item.addEventListener('click', (e) => {
        if (e.target.closest('.drag-handle') || e.target.closest('.btn-icon-move')) return;
        const id = item.getAttribute('data-id');
        if (id !== selectedStageId) {
          selectStageForEditing(id);
        }
      });
    });

    // Move Up / Down button handlers
    container.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const idx = stagesList.findIndex(s => (s._id || s.id) === id);
        if (idx > 0) {
          swapStages(idx, idx - 1);
        }
      });
    });

    container.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const idx = stagesList.findIndex(s => (s._id || s.id) === id);
        if (idx >= 0 && idx < stagesList.length - 1) {
          swapStages(idx, idx + 1);
        }
      });
    });

    // HTML5 Drag and Drop Reordering
    let draggedItem = null;

    container.querySelectorAll('.stage-list-item').forEach(item => {
      item.addEventListener('dragstart', (e) => {
        draggedItem = item;
        item.style.opacity = '0.5';
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', item.getAttribute('data-index'));
      });

      item.addEventListener('dragend', () => {
        if (draggedItem) draggedItem.style.opacity = '1';
        draggedItem = null;
        container.querySelectorAll('.stage-list-item').forEach(el => el.style.borderTop = '');
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        item.style.borderTop = '2px solid var(--accent-orange, #ff6b00)';
      });

      item.addEventListener('dragleave', () => {
        item.style.borderTop = '';
      });

      item.addEventListener('drop', async (e) => {
        e.preventDefault();
        item.style.borderTop = '';
        if (!draggedItem || draggedItem === item) return;

        const fromIdx = parseInt(draggedItem.getAttribute('data-index'), 10);
        const toIdx = parseInt(item.getAttribute('data-index'), 10);

        if (fromIdx !== toIdx) {
          const [moved] = stagesList.splice(fromIdx, 1);
          stagesList.splice(toIdx, 0, moved);
          await saveReorderedStages();
        }
      });
    });
  }

  async function swapStages(fromIdx, toIdx) {
    const [moved] = stagesList.splice(fromIdx, 1);
    stagesList.splice(toIdx, 0, moved);
    await saveReorderedStages();
  }

  async function saveReorderedStages() {
    // Re-assign order sequential
    const payload = stagesList.map((s, i) => ({
      id: s._id || s.id,
      order: i + 1
    }));

    try {
      const res = await window.AdminApi.post('/admin/build-stages/reorder', { items: payload });
      if (res.success) {
        if (window.AdminToast) window.AdminToast.success('Build stages reordered successfully!');
        const container = document.getElementById('stagesDragContainer');
        if (container) renderStageListItems(container);
      }
    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Reorder failed: ' + err.message);
      await loadStagesList();
    }
  }

  async function selectStageForEditing(id) {
    selectedStageId = id;
    
    // Highlight left list item
    const container = document.getElementById('stagesDragContainer');
    if (container) {
      container.querySelectorAll('.stage-list-item').forEach(item => {
        const itemObjId = item.getAttribute('data-id');
        if (itemObjId === id) {
          item.classList.add('active');
          item.style.background = 'rgba(255,107,0,0.12)';
          item.style.borderColor = 'var(--accent-orange, #ff6b00)';
        } else {
          item.classList.remove('active');
          item.style.background = 'rgba(255,255,255,0.02)';
          item.style.borderColor = 'rgba(255,255,255,0.06)';
        }
      });
    }

    // Fetch full stage details from backend
    try {
      const res = await window.AdminApi.get(`/admin/build-stages/${id}`);
      if (res.success && res.data) {
        activeStageData = res.data;
        if (!activeStageData.blocks) activeStageData.blocks = [];
        if (!activeStageData.appearance) activeStageData.appearance = { theme: 'dark', accentColor: '#ff6b00', layout: 'standard' };
        if (!activeStageData.advanced) activeStageData.advanced = { slug: '', cssClass: '' };
        renderStageEditor();
      }
    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Failed to fetch stage details: ' + err.message);
    }
  }

  function openNewStageForm() {
    selectedStageId = 'new';
    activeStageData = {
      title: '',
      stageNumber: stagesList.length + 1,
      subtitle: '',
      description: '',
      icon: 'fas fa-wrench',
      imageUrl: '',
      altText: '',
      buttonText: 'Learn More',
      buttonLink: '#',
      order: stagesList.length + 1,
      version: 1,
      status: 'draft',
      blocks: [],
      appearance: { theme: 'dark', accentColor: '#ff6b00', layout: 'standard' },
      advanced: { slug: '', cssClass: '' }
    };

    // Unselect left list items
    const container = document.getElementById('stagesDragContainer');
    if (container) {
      container.querySelectorAll('.stage-list-item').forEach(item => {
        item.classList.remove('active');
        item.style.background = 'rgba(255,255,255,0.02)';
        item.style.borderColor = 'rgba(255,255,255,0.06)';
      });
    }

    renderStageEditor();
  }

  function renderStageEditor() {
    const editorWrap = document.getElementById('stageEditorContainer');
    if (!editorWrap || !activeStageData) return;

    const isNew = selectedStageId === 'new';
    const stage = activeStageData;

    editorWrap.innerHTML = `
      <!-- EDITOR HEADER & ACTIONS -->
      <div style="display:flex;align-items:center;justify-space-between;padding-bottom:16px;margin-bottom:20px;border-bottom:1px solid rgba(255,255,255,0.08);flex-wrap:wrap;gap:12px;">
        <div>
          <div style="display:flex;align-items:center;gap:8px;">
            <h3 style="font-size:1.15rem;font-weight:700;margin:0;color:#fff;">
              ${isNew ? 'Create New Build Stage Draft' : `Editing Stage: ${stage.title || 'Untitled Stage'}`}
            </h3>
            <span class="badge ${stage.status === 'published' ? 'badge-success' : 'badge-warning'}">${stage.status || 'draft'}</span>
            ${!isNew ? `<span style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-muted);">v${stage.version || 1}</span>` : ''}
          </div>
          <p style="font-size:0.8rem;color:var(--text-muted);margin:2px 0 0 0;">
            Customize stage details, media, and nested drag-and-drop content blocks below.
          </p>
        </div>

        <div style="display:flex;gap:10px;align-items:center;margin-left:auto;">
          ${!isNew ? `
            <button type="button" class="btn btn-secondary btn-sm" id="btnDuplicateStage" title="Duplicate Stage">
              <i class="fas fa-copy"></i> Duplicate
            </button>
            <button type="button" class="btn btn-danger btn-sm" id="btnArchiveStage" title="Archive Stage">
              <i class="fas fa-archive"></i> Archive
            </button>
          ` : ''}
          <button type="button" class="btn btn-secondary" id="btnSaveStageDraft">
            <i class="fas fa-floppy-disk"></i> Save Draft
          </button>
          <button type="button" class="btn btn-primary" id="btnPublishStage">
            <i class="fas fa-paper-plane"></i> Publish Stage
          </button>
        </div>
      </div>

      <!-- MAIN SPLIT: EDITOR FORM vs LIVE PREVIEW -->
      <div style="display:grid;grid-template-columns:1fr 340px;gap:24px;align-items:start;">
        
        <!-- LEFT: STRUCTURED FORM & BLOCKS -->
        <div style="display:flex;flex-direction:column;gap:20px;">
          
          <!-- SECTION 1: BASIC DETAILS -->
          <div style="background:#111115;border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:16px;">
            <h4 style="font-size:0.9rem;font-weight:600;color:var(--accent-orange, #ff6b00);margin:0 0 14px 0;display:flex;align-items:center;gap:8px;">
              <i class="fas fa-info-circle"></i> 1. Basic Stage Information
            </h4>

            <div style="display:grid;grid-template-columns:1fr 120px;gap:12px;margin-bottom:12px;">
              <div class="form-group" style="margin:0;">
                <label>Stage Title *</label>
                <input type="text" id="inputStageTitle" class="form-input" value="${stage.title || ''}" required placeholder="e.g. Concept & CAD Modeling" />
              </div>
              <div class="form-group" style="margin:0;">
                <label>Stage #</label>
                <input type="number" id="inputStageNumber" class="form-input" value="${stage.stageNumber || 1}" min="1" />
              </div>
            </div>

            <div class="form-group" style="margin-bottom:12px;">
              <label>Subtitle / Phase Name</label>
              <input type="text" id="inputStageSubtitle" class="form-input" value="${stage.subtitle || ''}" placeholder="e.g. Phase 01 — Engineering & Aerodynamics" />
            </div>

            <div style="display:grid;grid-template-columns:1fr 140px;gap:12px;">
              <div class="form-group" style="margin:0;">
                <label>Stage FontAwesome Icon</label>
                <div style="display:flex;gap:8px;align-items:center;">
                  <div id="iconPreviewBox" style="width:38px;height:38px;border-radius:4px;background:#18181c;border:1px solid rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;color:var(--accent-orange, #ff6b00);font-size:16px;flex-shrink:0;">
                    <i class="${stage.icon || 'fas fa-wrench'}" id="iconPreviewIcon"></i>
                  </div>
                  <input type="text" id="inputStageIcon" class="form-input" value="${stage.icon || 'fas fa-wrench'}" style="flex:1;" />
                  <button type="button" class="btn btn-secondary btn-sm" id="btnTriggerIconPicker" style="white-space:nowrap;">
                    <i class="fas fa-icons text-orange"></i> Choose Icon
                  </button>
                </div>
              </div>
              <div class="form-group" style="margin:0;">
                <label>Display Priority / Order</label>
                <input type="number" id="inputStageOrder" class="form-input" value="${stage.order || 1}" min="1" />
              </div>
            </div>

          </div>

          <!-- SECTION 2: MAIN MEDIA & DESCRIPTION -->
          <div style="background:#111115;border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:16px;">
            <h4 style="font-size:0.9rem;font-weight:600;color:var(--accent-orange, #ff6b00);margin:0 0 14px 0;display:flex;align-items:center;gap:8px;">
              <i class="fas fa-photo-video"></i> 2. Main Stage Media & Summary
            </h4>

            <div class="form-group" style="margin-bottom:12px;">
              <label>Stage Overview Description *</label>
              <textarea id="inputStageDesc" class="form-textarea" rows="3" placeholder="Overview summary of engineering accomplishments during this stage...">${stage.description || ''}</textarea>
            </div>

            <div class="form-group" style="margin-bottom:12px;">
              <label>Main Stage Image / Media URL</label>
              <div style="display:flex;gap:12px;align-items:center;">
                <div id="mainImagePreview" style="width:72px;height:48px;border-radius:4px;border:1px solid rgba(255,255,255,0.1);background:#000;overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  ${stage.imageUrl ? `<img src="${stage.imageUrl}" style="width:100%;height:100%;object-fit:cover;" />` : `<i class="fas fa-image text-muted"></i>`}
                </div>
                <div style="flex:1;">
                  <input type="text" id="inputStageImageUrl" class="form-input" value="${stage.imageUrl || ''}" placeholder="https://res.cloudinary.com/..." style="margin-bottom:4px;" />
                  <div style="display:flex;gap:8px;">
                    <button type="button" class="btn btn-secondary btn-sm" id="btnPickMainImage">
                      <i class="fas fa-folder-open text-orange"></i> Select from Media Library
                    </button>
                    <button type="button" class="btn btn-danger btn-sm" id="btnRemoveMainImage" style="padding:6px 12px;font-size:12px;background:rgba(239,68,68,0.15);color:#EF4444;border:1px solid rgba(239,68,68,0.3);border-radius:4px;cursor:pointer;">
                      <i class="fas fa-trash-alt"></i> Remove
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group" style="margin:0;">
              <label>Image Alt Text (SEO & Accessibility)</label>
              <input type="text" id="inputStageAltText" class="form-input" value="${stage.altText || ''}" placeholder="Descriptive alternative text for stage photo..." />
            </div>

          </div>

          <!-- SECTION 3: DRAG-AND-DROP CONTENT BLOCKS -->
          <div style="background:#111115;border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:16px;">
            <div style="display:flex;align-items:center;justify-space-between;margin-bottom:14px;">
              <h4 style="font-size:0.9rem;font-weight:600;color:var(--accent-orange, #ff6b00);margin:0;display:flex;align-items:center;gap:8px;">
                <i class="fas fa-layer-group"></i> 3. Nested Content Blocks (<span id="blockCountLabel">0</span>)
              </h4>

              <!-- ADD BLOCK DROPDOWN -->
              <div class="dropdown" style="position:relative;display:inline-block;">
                <button type="button" class="btn btn-secondary btn-sm" id="btnAddBlockToggle">
                  <i class="fas fa-plus text-orange"></i> Add Content Block <i class="fas fa-chevron-down" style="font-size:10px;margin-left:4px;"></i>
                </button>
                <div id="addBlockMenu" style="display:none;position:absolute;right:0;top:100%;margin-top:4px;background:#1a1a20;border:1px solid rgba(255,255,255,0.12);border-radius:6px;width:220px;z-index:99;box-shadow:0 10px 25px rgba(0,0,0,0.5);padding:6px 0;">
                  <button type="button" class="btn-add-block-type" data-type="heading" style="width:100%;text-align:left;padding:8px 14px;background:none;border:none;color:#fff;font-size:0.82rem;cursor:pointer;display:flex;align-items:center;gap:10px;"><i class="fas fa-heading text-orange"></i> Heading Block</button>
                  <button type="button" class="btn-add-block-type" data-type="text" style="width:100%;text-align:left;padding:8px 14px;background:none;border:none;color:#fff;font-size:0.82rem;cursor:pointer;display:flex;align-items:center;gap:10px;"><i class="fas fa-paragraph text-orange"></i> Paragraph Text Block</button>
                  <button type="button" class="btn-add-block-type" data-type="image" style="width:100%;text-align:left;padding:8px 14px;background:none;border:none;color:#fff;font-size:0.82rem;cursor:pointer;display:flex;align-items:center;gap:10px;"><i class="fas fa-image text-orange"></i> Image Block</button>
                  <button type="button" class="btn-add-block-type" data-type="button" style="width:100%;text-align:left;padding:8px 14px;background:none;border:none;color:#fff;font-size:0.82rem;cursor:pointer;display:flex;align-items:center;gap:10px;"><i class="fas fa-link text-orange"></i> Call-To-Action Button</button>
                  <button type="button" class="btn-add-block-type" data-type="quote" style="width:100%;text-align:left;padding:8px 14px;background:none;border:none;color:#fff;font-size:0.82rem;cursor:pointer;display:flex;align-items:center;gap:10px;"><i class="fas fa-quote-left text-orange"></i> Quote / Highlight</button>
                  <button type="button" class="btn-add-block-type" data-type="specification" style="width:100%;text-align:left;padding:8px 14px;background:none;border:none;color:#fff;font-size:0.82rem;cursor:pointer;display:flex;align-items:center;gap:10px;"><i class="fas fa-sliders-h text-orange"></i> Spec Metric Card</button>
                  <button type="button" class="btn-add-block-type" data-type="divider" style="width:100%;text-align:left;padding:8px 14px;background:none;border:none;color:#fff;font-size:0.82rem;cursor:pointer;display:flex;align-items:center;gap:10px;"><i class="fas fa-minus text-orange"></i> Horizontal Divider</button>
                </div>
              </div>

            </div>

            <!-- BLOCKS LIST CONTAINER -->
            <div id="blocksListContainer" style="display:flex;flex-direction:column;gap:12px;min-height:80px;background:#0d0d10;border:1px dashed rgba(255,255,255,0.1);border-radius:6px;padding:12px;">
              <!-- Rendered via JS -->
            </div>

          </div>

          <!-- SECTION 4: CALL TO ACTION & LINK -->
          <div style="background:#111115;border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:16px;">
            <h4 style="font-size:0.9rem;font-weight:600;color:var(--accent-orange, #ff6b00);margin:0 0 14px 0;display:flex;align-items:center;gap:8px;">
              <i class="fas fa-link"></i> 4. Footer Call-To-Action
            </h4>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group" style="margin:0;">
                <label>Button Label Text</label>
                <input type="text" id="inputStageBtnText" class="form-input" value="${stage.buttonText || ''}" placeholder="e.g. View CAD Telemetry" />
              </div>
              <div class="form-group" style="margin:0;">
                <label>Button Target URL</label>
                <input type="text" id="inputStageBtnLink" class="form-input" value="${stage.buttonLink || ''}" placeholder="e.g. #cad-specs or https://..." />
              </div>
            </div>
          </div>

          <!-- SECTION 5: ADVANCED & APPEARANCE (COLLAPSIBLE) -->
          <div style="background:#111115;border:1px solid rgba(255,255,255,0.06);border-radius:6px;overflow:hidden;">
            <button type="button" id="toggleAdvancedSec" style="width:100%;padding:14px 16px;background:none;border:none;color:#fff;font-size:0.9rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
              <span style="color:var(--accent-orange, #ff6b00);"><i class="fas fa-palette"></i> 5. Advanced Appearance & SEO Settings</span>
              <i class="fas fa-chevron-down" id="advSecChevron" style="font-size:12px;transition:transform 0.2s;"></i>
            </button>

            <div id="advancedSecBody" style="display:none;padding:0 16px 16px 16px;border-top:1px solid rgba(255,255,255,0.06);">
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
                <div class="form-group" style="margin:0;">
                  <label>Accent Color</label>
                  <div style="display:flex;gap:8px;">
                    <input type="color" id="inputStageAccentColor" value="${(stage.appearance && stage.appearance.accentColor) || '#ff6b00'}" style="width:40px;height:38px;border:none;background:none;cursor:pointer;border-radius:4px;" />
                    <input type="text" id="inputStageAccentHex" class="form-input" value="${(stage.appearance && stage.appearance.accentColor) || '#ff6b00'}" style="flex:1;font-family:var(--font-mono);" />
                  </div>
                </div>

                <div class="form-group" style="margin:0;">
                  <label>Theme Mode</label>
                  <select id="selectStageTheme" class="form-select">
                    <option value="dark" ${(stage.appearance && stage.appearance.theme === 'dark') ? 'selected' : ''}>Dark Racing (Default)</option>
                    <option value="racing-orange" ${(stage.appearance && stage.appearance.theme === 'racing-orange') ? 'selected' : ''}>High-Contrast Orange</option>
                    <option value="light" ${(stage.appearance && stage.appearance.theme === 'light') ? 'selected' : ''}>Clean Light</option>
                  </select>
                </div>
              </div>

              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
                <div class="form-group" style="margin:0;">
                  <label>URL Slug / Anchor ID</label>
                  <input type="text" id="inputStageSlug" class="form-input" value="${(stage.advanced && stage.advanced.slug) || ''}" placeholder="e.g. stage-01-cad" />
                </div>

                <div class="form-group" style="margin:0;">
                  <label>Custom CSS Class</label>
                  <input type="text" id="inputStageCssClass" class="form-input" value="${(stage.advanced && stage.advanced.cssClass) || ''}" placeholder="e.g. highlight-border" />
                </div>
              </div>

            </div>
          </div>

        </div>

        <!-- RIGHT: REAL-TIME LIVE STAGE PREVIEW -->
        <div style="position:sticky;top:20px;background:#0d0d10;border:1px solid var(--border-hairline, #2a2a32);border-radius:8px;padding:16px;display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:8px;border-bottom:1px solid rgba(255,255,255,0.08);">
            <span style="font-size:0.75rem;font-weight:700;letter-spacing:1px;color:var(--text-muted);text-transform:uppercase;">
              <i class="fas fa-eye text-orange"></i> Live Preview
            </span>
            <span style="font-size:0.7rem;color:var(--text-muted);background:rgba(255,255,255,0.06);padding:2px 6px;border-radius:3px;">Real-time</span>
          </div>

          <!-- DYNAMIC PREVIEW BOX -->
          <div id="liveStagePreviewBox" style="background:#16161a;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:16px;display:flex;flex-direction:column;gap:12px;">
            <!-- Rendered dynamically -->
          </div>
        </div>

      </div>
    `;

    attachEditorFormListeners();
    renderContentBlocks();
    updateLivePreview();
  }

  function attachEditorFormListeners() {
    const editorWrap = document.getElementById('stageEditorContainer');
    if (!editorWrap) return;

    // Save Draft Button
    editorWrap.querySelector('#btnSaveStageDraft')?.addEventListener('click', async () => {
      await saveStageData('draft');
    });

    // Publish Button
    editorWrap.querySelector('#btnPublishStage')?.addEventListener('click', async () => {
      await saveStageData('publish');
    });

    // Duplicate Button
    editorWrap.querySelector('#btnDuplicateStage')?.addEventListener('click', async () => {
      if (selectedStageId && selectedStageId !== 'new') {
        try {
          const res = await window.AdminApi.post(`/admin/build-stages/${selectedStageId}/duplicate`);
          if (res.success) {
            window.AdminToast.success('Build stage duplicated.');
            await loadStagesList(res.data._id || res.data.id);
          }
        } catch (err) {
          window.AdminToast.error('Duplicate failed: ' + err.message);
        }
      }
    });

    // Archive Button
    editorWrap.querySelector('#btnArchiveStage')?.addEventListener('click', async () => {
      if (selectedStageId && selectedStageId !== 'new') {
        if (!confirm('Are you sure you want to archive this build stage?')) return;
        try {
          const res = await window.AdminApi.post(`/admin/build-stages/${selectedStageId}/archive`);
          if (res.success) {
            window.AdminToast.success('Stage archived.');
            await loadStagesList();
          }
        } catch (err) {
          window.AdminToast.error('Archive failed: ' + err.message);
        }
      }
    });

    // FontAwesome Icon Picker Trigger
    editorWrap.querySelector('#btnTriggerIconPicker')?.addEventListener('click', () => {
      const curIcon = editorWrap.querySelector('#inputStageIcon').value;
      if (window.IconPicker) {
        window.IconPicker.open({
          currentIcon: curIcon,
          onSelect: (selectedClass) => {
            const inp = editorWrap.querySelector('#inputStageIcon');
            const prev = editorWrap.querySelector('#iconPreviewIcon');
            if (inp) inp.value = selectedClass;
            if (prev) prev.className = selectedClass;
            activeStageData.icon = selectedClass;
            updateLivePreview();
          }
        });
      }
    });

    editorWrap.querySelector('#inputStageIcon')?.addEventListener('input', (e) => {
      const prev = editorWrap.querySelector('#iconPreviewIcon');
      if (prev) prev.className = e.target.value || 'fas fa-wrench';
      activeStageData.icon = e.target.value;
      updateLivePreview();
    });

    // Main Image MediaPicker
    editorWrap.querySelector('#btnPickMainImage')?.addEventListener('click', () => {
      if (window.MediaPicker) {
        window.MediaPicker.open({
          allowedType: 'image',
          onSelect: (asset) => {
            const inp = editorWrap.querySelector('#inputStageImageUrl');
            const prev = editorWrap.querySelector('#mainImagePreview');
            if (inp) inp.value = asset.url;
            if (prev) prev.innerHTML = `<img src="${asset.url}" style="width:100%;height:100%;object-fit:cover;" />`;
            activeStageData.imageUrl = asset.url;
            updateLivePreview();
          }
        });
      }
    });

    // Inputs live binding to update live preview
    const inputsToWatch = [
      '#inputStageTitle', '#inputStageNumber', '#inputStageSubtitle',
      '#inputStageDesc', '#inputStageImageUrl', '#inputStageAltText',
      '#inputStageBtnText', '#inputStageBtnLink', '#inputStageAccentHex'
    ];

    inputsToWatch.forEach(selector => {
      editorWrap.querySelector(selector)?.addEventListener('input', () => {
        readFormIntoState();
        updateLivePreview();
      });
    });

    // Color picker syncing
    const colorPicker = editorWrap.querySelector('#inputStageAccentColor');
    const colorHex = editorWrap.querySelector('#inputStageAccentHex');

    colorPicker?.addEventListener('input', (e) => {
      if (colorHex) colorHex.value = e.target.value;
      readFormIntoState();
      updateLivePreview();
    });

    colorHex?.addEventListener('input', (e) => {
      if (colorPicker) colorPicker.value = e.target.value;
      readFormIntoState();
      updateLivePreview();
    });

    // Toggle Add Block Dropdown Menu
    const addToggleBtn = editorWrap.querySelector('#btnAddBlockToggle');
    const addMenu = editorWrap.querySelector('#addBlockMenu');
    
    addToggleBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      addMenu.style.display = addMenu.style.display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
      if (addMenu) addMenu.style.display = 'none';
    });

    // Add Block Types Click Handlers
    editorWrap.querySelectorAll('.btn-add-block-type').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const type = btn.getAttribute('data-type');
        addNewContentBlock(type);
        if (addMenu) addMenu.style.display = 'none';
      });
    });

    // Collapsible Advanced Settings
    const advToggle = editorWrap.querySelector('#toggleAdvancedSec');
    const advBody = editorWrap.querySelector('#advancedSecBody');
    const advChevron = editorWrap.querySelector('#advSecChevron');

    advToggle?.addEventListener('click', () => {
      const isOpen = advBody.style.display !== 'none';
      advBody.style.display = isOpen ? 'none' : 'block';
      if (advChevron) advChevron.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });
  }

  function readFormIntoState() {
    const editorWrap = document.getElementById('stageEditorContainer');
    if (!editorWrap || !activeStageData) return;

    activeStageData.title = editorWrap.querySelector('#inputStageTitle')?.value.trim() || '';
    activeStageData.stageNumber = Number(editorWrap.querySelector('#inputStageNumber')?.value || 1);
    activeStageData.subtitle = editorWrap.querySelector('#inputStageSubtitle')?.value.trim() || '';
    activeStageData.icon = editorWrap.querySelector('#inputStageIcon')?.value.trim() || 'fas fa-wrench';
    activeStageData.order = Number(editorWrap.querySelector('#inputStageOrder')?.value || 1);
    activeStageData.description = editorWrap.querySelector('#inputStageDesc')?.value.trim() || '';
    activeStageData.imageUrl = editorWrap.querySelector('#inputStageImageUrl')?.value.trim() || '';
    activeStageData.altText = editorWrap.querySelector('#inputStageAltText')?.value.trim() || '';
    activeStageData.buttonText = editorWrap.querySelector('#inputStageBtnText')?.value.trim() || '';
    activeStageData.buttonLink = editorWrap.querySelector('#inputStageBtnLink')?.value.trim() || '';
    
    if (!activeStageData.appearance) activeStageData.appearance = {};
    activeStageData.appearance.accentColor = editorWrap.querySelector('#inputStageAccentHex')?.value.trim() || '#ff6b00';
    activeStageData.appearance.theme = editorWrap.querySelector('#selectStageTheme')?.value || 'dark';

    if (!activeStageData.advanced) activeStageData.advanced = {};
    activeStageData.advanced.slug = editorWrap.querySelector('#inputStageSlug')?.value.trim() || '';
    activeStageData.advanced.cssClass = editorWrap.querySelector('#inputStageCssClass')?.value.trim() || '';
  }

  function addNewContentBlock(type) {
    if (!activeStageData.blocks) activeStageData.blocks = [];

    const defaultContent = {
      heading: { text: 'New Heading', level: 'h3' },
      text: { text: 'Paragraph content detailing technical specifications...' },
      image: { url: '', altText: '', caption: '' },
      button: { text: 'Learn More', link: '#', style: 'primary' },
      video: { url: '', caption: '' },
      quote: { text: 'Engineering excellence defines our drive.', author: 'Formula Student Team' },
      specification: { name: 'Peak Power', value: '80', unit: 'kW' },
      divider: { style: 'solid' },
    }[type] || {};

    activeStageData.blocks.push({
      type,
      content: defaultContent,
      sortOrder: activeStageData.blocks.length + 1,
      visible: true
    });

    renderContentBlocks();
    updateLivePreview();
  }

  function renderContentBlocks() {
    const container = document.getElementById('blocksListContainer');
    const countLabel = document.getElementById('blockCountLabel');
    if (!container) return;

    const blocks = activeStageData.blocks || [];
    if (countLabel) countLabel.textContent = blocks.length;

    if (blocks.length === 0) {
      container.innerHTML = `<p style="color:var(--text-muted);font-size:0.82rem;text-align:center;margin:12px 0;">No content blocks added. Click "+ Add Content Block" above to insert headings, images, buttons, or specs.</p>`;
      return;
    }

    container.innerHTML = blocks.map((block, idx) => {
      const typeIcons = {
        heading: 'fas fa-heading',
        text: 'fas fa-paragraph',
        image: 'fas fa-image',
        button: 'fas fa-link',
        quote: 'fas fa-quote-left',
        specification: 'fas fa-sliders-h',
        divider: 'fas fa-minus',
        video: 'fas fa-video'
      };

      return `
        <div class="content-block-item" data-index="${idx}" draggable="true" style="background:#16161a;border:1px solid rgba(255,255,255,0.08);border-radius:6px;padding:12px;display:flex;flex-direction:column;gap:10px;">
          
          <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,0.05);padding-bottom:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span class="block-drag-handle" style="cursor:grab;color:var(--text-muted);font-size:12px;" title="Drag to reorder"><i class="fas fa-grip-vertical"></i></span>
              <span style="font-size:0.75rem;font-weight:700;color:var(--accent-orange, #ff6b00);text-transform:uppercase;display:flex;align-items:center;gap:6px;">
                <i class="${typeIcons[block.type] || 'fas fa-cube'}"></i> ${block.type} Block
              </span>
            </div>

            <div style="display:flex;align-items:center;gap:6px;">
              <button type="button" class="btn-block-move-up" data-index="${idx}" title="Move Up" style="background:none;border:none;color:#8a8a9e;cursor:pointer;font-size:11px;" ${idx === 0 ? 'disabled style="opacity:0.3;"' : ''}><i class="fas fa-arrow-up"></i></button>
              <button type="button" class="btn-block-move-down" data-index="${idx}" title="Move Down" style="background:none;border:none;color:#8a8a9e;cursor:pointer;font-size:11px;" ${idx === blocks.length - 1 ? 'disabled style="opacity:0.3;"' : ''}><i class="fas fa-arrow-down"></i></button>
              <button type="button" class="btn-block-toggle-vis" data-index="${idx}" title="Toggle Visibility" style="background:none;border:none;color:${block.visible !== false ? '#ff6b00' : '#666'};cursor:pointer;font-size:12px;margin:0 4px;">
                <i class="${block.visible !== false ? 'fas fa-eye' : 'fas fa-eye-slash'}"></i>
              </button>
              <button type="button" class="btn-block-delete" data-index="${idx}" title="Delete Block" style="background:none;border:none;color:var(--signal-red, #ff4444);cursor:pointer;font-size:12px;">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- BLOCK SPECIFIC FORM INPUTS -->
          <div class="block-fields-wrap">
            ${renderBlockFields(block, idx)}
          </div>

        </div>
      `;
    }).join('');

    attachBlockEvents(container);
  }

  function renderBlockFields(block, idx) {
    const c = block.content || {};

    switch (block.type) {
      case 'heading':
        return `
          <div style="display:grid;grid-template-columns:1fr 100px;gap:8px;">
            <input type="text" class="form-input block-field" data-block-idx="${idx}" data-field="text" value="${c.text || ''}" placeholder="Heading text..." />
            <select class="form-select block-field" data-block-idx="${idx}" data-field="level">
              <option value="h2" ${c.level === 'h2' ? 'selected' : ''}>H2 Subtitle</option>
              <option value="h3" ${c.level === 'h3' ? 'selected' : ''}>H3 Section</option>
              <option value="h4" ${c.level === 'h4' ? 'selected' : ''}>H4 Metric</option>
            </select>
          </div>
        `;
      case 'text':
        return `
          <textarea class="form-textarea block-field" data-block-idx="${idx}" data-field="text" rows="2" placeholder="Paragraph text content...">${c.text || ''}</textarea>
        `;
      case 'image':
        return `
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div style="display:flex;gap:8px;">
              <input type="text" class="form-input block-field" data-block-idx="${idx}" data-field="url" value="${c.url || ''}" placeholder="Image URL..." style="flex:1;" />
              <button type="button" class="btn btn-secondary btn-sm btn-pick-block-image" data-block-idx="${idx}"><i class="fas fa-folder-open text-orange"></i> Select</button>
            </div>
            <input type="text" class="form-input block-field" data-block-idx="${idx}" data-field="caption" value="${c.caption || ''}" placeholder="Caption (optional)..." />
          </div>
        `;
      case 'button':
        return `
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <input type="text" class="form-input block-field" data-block-idx="${idx}" data-field="text" value="${c.text || ''}" placeholder="Button Label..." />
            <input type="text" class="form-input block-field" data-block-idx="${idx}" data-field="link" value="${c.link || ''}" placeholder="Button Link URL..." />
          </div>
        `;
      case 'quote':
        return `
          <div style="display:flex;flex-direction:column;gap:6px;">
            <textarea class="form-textarea block-field" data-block-idx="${idx}" data-field="text" rows="2" placeholder="Quote statement...">${c.text || ''}</textarea>
            <input type="text" class="form-input block-field" data-block-idx="${idx}" data-field="author" value="${c.author || ''}" placeholder="Author / Attribution..." />
          </div>
        `;
      case 'specification':
        return `
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
            <input type="text" class="form-input block-field" data-block-idx="${idx}" data-field="name" value="${c.name || ''}" placeholder="Spec Name (e.g. Battery)..." />
            <input type="text" class="form-input block-field" data-block-idx="${idx}" data-field="value" value="${c.value || ''}" placeholder="Value (e.g. 600)..." />
            <input type="text" class="form-input block-field" data-block-idx="${idx}" data-field="unit" value="${c.unit || ''}" placeholder="Unit (e.g. V / kW)..." />
          </div>
        `;
      case 'divider':
        return `<p style="font-size:0.75rem;color:var(--text-muted);margin:0;">Horizontal separator line across timeline content.</p>`;
      default:
        return `<input type="text" class="form-input block-field" data-block-idx="${idx}" data-field="text" value="${c.text || ''}" placeholder="Content..." />`;
    }
  }

  function attachBlockEvents(container) {
    // Delete block
    container.querySelectorAll('.btn-block-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        activeStageData.blocks.splice(idx, 1);
        renderContentBlocks();
        updateLivePreview();
      });
    });

    // Toggle block visibility
    container.querySelectorAll('.btn-block-toggle-vis').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        activeStageData.blocks[idx].visible = !activeStageData.blocks[idx].visible;
        renderContentBlocks();
        updateLivePreview();
      });
    });

    // Move block up
    container.querySelectorAll('.btn-block-move-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (idx > 0) {
          const [b] = activeStageData.blocks.splice(idx, 1);
          activeStageData.blocks.splice(idx - 1, 0, b);
          renderContentBlocks();
          updateLivePreview();
        }
      });
    });

    // Move block down
    container.querySelectorAll('.btn-block-move-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        if (idx < activeStageData.blocks.length - 1) {
          const [b] = activeStageData.blocks.splice(idx, 1);
          activeStageData.blocks.splice(idx + 1, 0, b);
          renderContentBlocks();
          updateLivePreview();
        }
      });
    });

    // Pick block image MediaPicker
    container.querySelectorAll('.btn-pick-block-image').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-block-idx'), 10);
        if (window.MediaPicker) {
          window.MediaPicker.open({
            allowedType: 'image',
            onSelect: (asset) => {
              activeStageData.blocks[idx].content.url = asset.url;
              renderContentBlocks();
              updateLivePreview();
            }
          });
        }
      });
    });

    // Live update block fields on typing
    container.querySelectorAll('.block-field').forEach(field => {
      field.addEventListener('input', (e) => {
        const idx = parseInt(field.getAttribute('data-block-idx'), 10);
        const fKey = field.getAttribute('data-field');
        if (!activeStageData.blocks[idx].content) activeStageData.blocks[idx].content = {};
        activeStageData.blocks[idx].content[fKey] = e.target.value;
        updateLivePreview();
      });
    });
  }

  function updateLivePreview() {
    const previewWrap = document.getElementById('liveStagePreviewBox');
    if (!previewWrap || !activeStageData) return;

    readFormIntoState();

    const stage = activeStageData;
    const accentColor = (stage.appearance && stage.appearance.accentColor) || '#ff6b00';

    const blocksHtml = (stage.blocks || [])
      .filter(b => b.visible !== false)
      .map(b => {
        const c = b.content || {};
        switch (b.type) {
          case 'heading':
            return `<h4 style="font-size:0.95rem;font-weight:700;color:#fff;margin:8px 0 4px 0;">${c.text || ''}</h4>`;
          case 'text':
            return `<p style="font-size:0.82rem;color:var(--text-secondary, #b4b4c0);line-height:1.4;margin:4px 0;">${c.text || ''}</p>`;
          case 'image':
            return c.url ? `<img src="${c.url}" alt="${c.caption || ''}" style="width:100%;border-radius:4px;margin:6px 0;" />` : '';
          case 'button':
            return c.text ? `<a href="${c.link || '#'}" target="_blank" class="btn btn-secondary btn-sm" style="display:inline-block;margin:4px 0;font-size:0.75rem;"><i class="fas fa-external-link-alt"></i> ${c.text}</a>` : '';
          case 'quote':
            return `<blockquote style="border-left:3px solid ${accentColor};padding-left:10px;margin:8px 0;font-style:italic;color:#ddd;font-size:0.82rem;">"${c.text || ''}" — <strong style="font-style:normal;color:${accentColor};">${c.author || ''}</strong></blockquote>`;
          case 'specification':
            return `
              <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:4px;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;margin:4px 0;">
                <span style="font-size:0.8rem;color:var(--text-muted);">${c.name || 'Spec'}</span>
                <span style="font-family:var(--font-mono);font-size:0.85rem;font-weight:700;color:${accentColor};">${c.value || '0'} ${c.unit || ''}</span>
              </div>
            `;
          case 'divider':
            return `<hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:10px 0;" />`;
          default:
            return '';
        }
      }).join('');

    previewWrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;">
        <div style="width:36px;height:36px;border-radius:6px;background:rgba(255,107,0,0.15);border:1px solid ${accentColor};display:flex;align-items:center;justify-content:center;color:${accentColor};font-size:16px;flex-shrink:0;">
          <i class="${stage.icon || 'fas fa-wrench'}"></i>
        </div>
        <div>
          <span style="font-size:0.68rem;font-weight:700;color:${accentColor};letter-spacing:1px;">STAGE 0${stage.stageNumber || 1}</span>
          <h4 style="font-size:0.98rem;font-weight:700;color:#fff;margin:0;">${stage.title || 'Stage Title'}</h4>
        </div>
      </div>

      ${stage.subtitle ? `<div style="font-size:0.75rem;font-family:var(--font-mono);color:var(--text-muted);">${stage.subtitle}</div>` : ''}

      ${stage.imageUrl ? `<img src="${stage.imageUrl}" alt="${stage.altText || stage.title || ''}" style="width:100%;max-height:160px;object-fit:cover;border-radius:4px;margin-top:4px;" />` : ''}

      <p style="font-size:0.82rem;color:var(--text-secondary, #b4b4c0);line-height:1.4;margin:4px 0;">${stage.description || 'Stage overview description...'}</p>

      ${blocksHtml}

      ${stage.buttonText ? `
        <a href="${stage.buttonLink || '#'}" class="btn btn-primary btn-sm" style="margin-top:8px;text-align:center;display:block;">
          <i class="fas fa-chevron-right"></i> ${stage.buttonText}
        </a>
      ` : ''}
    `;
  }

  async function saveStageData(action = 'draft') {
    readFormIntoState();

    if (!activeStageData.title || !activeStageData.description) {
      if (window.AdminToast) window.AdminToast.error('Stage Title and Overview Description are required.');
      return;
    }

    try {
      const isNew = selectedStageId === 'new';
      let res;

      if (isNew) {
        res = await window.AdminApi.post('/admin/build-stages', activeStageData);
      } else {
        res = await window.AdminApi.patch(`/admin/build-stages/${selectedStageId}`, activeStageData);
      }

      if (!res.success) {
        if (window.AdminToast) window.AdminToast.error('Save failed: ' + (res.message || 'Unknown error'));
        return;
      }

      const targetId = isNew ? (res.data._id || res.data.id) : selectedStageId;

      if (action === 'publish') {
        const pubRes = await window.AdminApi.post(`/admin/build-stages/${targetId}/publish`);
        if (pubRes.success) {
          if (window.AdminToast) window.AdminToast.success('Build stage published to public website!');
        }
      } else {
        if (window.AdminToast) window.AdminToast.success('Build stage draft saved!');
      }

      await loadStagesList(targetId);

    } catch (err) {
      if (window.AdminToast) window.AdminToast.error('Error saving stage: ' + err.message);
    }
  }

  window.AdminBuildStagesModule = { renderBuildStagesModule };
})();
