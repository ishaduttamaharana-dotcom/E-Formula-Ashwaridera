/* ============================================================
   achievements-cms.js — Achievements Page Dynamic Hydration & Inline CMS Engine
   Injected into public/achievements.html.

   Responsibilities:
     • Dynamically hydrates Achievements from MongoDB Atlas (achievements collection).
     • Category Filter Bar compatibility (All, Competitions, Awards, Milestones, Recognition).
     • Role-Aware Behavior:
         - Visitors & Normal Users: Read-only live site.
         - Admin (role === "admin"): Renders ➕ Add Achievement, ✏ Edit, 🗑 Delete controls,
           and Cloudinary photo upload triggers.
     • Real-Time DOM updates without full page reloads.
============================================================ */

(function () {
  'use strict';

  const ACHIEVEMENTS_API = '/api/v1/achievements';
  const UPLOAD_API       = '/api/v1/cms/upload';
  const STORAGE_KEY      = 'ar_user';

  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const isAdmin = () => {
    const user = getStoredUser();
    return user && user.role === 'admin';
  };

  const apiFetch = async (url, options = {}) => {
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
      ...options,
    });
    return res.json();
  };

  const uploadPhotoToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(UPLOAD_API, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    return res.json();
  };

  const notify = (msg, type = 'success') => {
    if (window.ARCms && window.ARCms.showSuccessNotification) {
      if (type === 'success') window.ARCms.showSuccessNotification(msg);
      else window.ARCms.showErrorNotification(msg);
    } else {
      console.log(`[Achievements CMS ${type}]: ${msg}`);
    }
  };

  // Initial default seed achievements if collection is empty
  const defaultAchievements = [
    {
      title: 'Formula Bharat — AIR 8 Overall',
      competitionName: 'Formula Bharat 2024',
      position: 'AIR 8',
      category: 'competition',
      date: '2024',
      description: 'Formula Ashwariders, our combustion team, secured an overall All India Rank of 8 at Formula Bharat 2024, its best national result to date.',
      imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483846/SAVE_20260111_173616.jpg_1_srifam.jpg',
      displayOrder: 1,
    },
    {
      title: 'Formula Bharat — AIR 19 (Electric)',
      competitionName: 'Formula Bharat 2024 EV',
      position: 'AIR 19',
      category: 'competition',
      date: '2024',
      description: 'E-Formula Ashwariders finished AIR 19 overall out of 45 electric teams nationwide, clearing technical inspection with an in-house manufactured accumulator container.',
      imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483829/1768116510403.jpg_1_ibfo5t.jpg',
      displayOrder: 2,
    },
    {
      title: 'Formula Bharat — First On-Site Podium Push',
      competitionName: 'Formula Bharat 2023',
      position: 'AIR 10',
      category: 'competition',
      date: '2023',
      description: 'In its first on-site competition, E-Formula Ashwa Riders finished 10th out of 37 electric teams at Kari Motor Speedway, Coimbatore.',
      imageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784483764/2026011201302668.jpg_1_vlfcsb.jpg',
      displayOrder: 3,
    },
  ];

  // ============================================================
  //  HYDRATE & RENDER ACHIEVEMENTS
  // ============================================================
  const hydrateAchievements = async () => {
    try {
      const res = await apiFetch(ACHIEVEMENTS_API);
      if (res.success && res.data && res.data.length > 0) {
        renderAchievementsGrid(res.data);
      } else if (isAdmin()) {
        // Seed defaults if MongoDB collection is empty
        for (const a of defaultAchievements) {
          await apiFetch(ACHIEVEMENTS_API, { method: 'POST', body: JSON.stringify(a) });
        }
        const freshRes = await apiFetch(ACHIEVEMENTS_API);
        renderAchievementsGrid(freshRes.data || []);
      } else {
        renderAchievementsGrid([]);
      }
    } catch (err) {
      console.warn('Achievements hydration notice:', err.message);
    }
  };

  const renderAchievementsGrid = (items) => {
    const grid = document.getElementById('achievementGrid');
    if (!grid) return;

    const adminActive = isAdmin();
    const openAddBtn = document.getElementById('openAddModal');

    // Show/Hide or Wire Admin Add Button
    if (openAddBtn) {
      openAddBtn.style.display = adminActive ? 'inline-flex' : 'none';
      if (adminActive) {
        openAddBtn.onclick = () => {
          openAchievementModal('Add Achievement', {}, async (formData) => {
            const res = await apiFetch(ACHIEVEMENTS_API, {
              method: 'POST',
              body: JSON.stringify(formData),
            });

            if (res.success) {
              notify('Achievement added successfully!');
              await hydrateAchievements();
            } else {
              notify(res.message || 'Add failed', 'error');
            }
          });
        };
      }
    }

    grid.innerHTML = '';

    items.forEach((item) => {
      const card = document.createElement('div');
      card.className = 'achievement-card reveal-scale visible';
      card.dataset.category = (item.category || 'competition').toLowerCase();
      card.dataset.id = item._id;

      const mediaHtml = item.imageUrl
        ? `<div class="card-media"><img src="${item.imageUrl}" alt="${item.title}" /></div>`
        : `<div class="card-icon"><i class="fas fa-trophy"></i></div>`;

      const badgeCategory = (item.category || 'competition').toLowerCase();
      const badgeIcon = badgeCategory === 'award' ? 'fa-award' : (badgeCategory === 'record' ? 'fa-bolt' : 'fa-flag-checkered');

      const adminControlsHtml = adminActive ? `
        <div class="ar-cms-controls" style="margin-top:16px;">
          <button class="ar-cms-btn ar-cms-btn--edit" data-id="${item._id}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="ar-cms-btn ar-cms-btn--delete" data-id="${item._id}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      ` : '';

      const btnHtml = item.buttonText && item.buttonLink ? `
        <div style="margin-top:12px;">
          <a href="${item.buttonLink}" class="btn btn-secondary" style="font-size:0.75rem;padding:6px 14px;" target="_blank" rel="noopener">${item.buttonText}</a>
        </div>
      ` : '';

      card.innerHTML = `
        <span class="card-badge ${badgeCategory}"><i class="fas ${badgeIcon}"></i> ${item.category || 'Competition'}</span>
        ${mediaHtml}
        <div class="card-year">${item.date || ''}</div>
        <h3>${item.title}</h3>
        <p>${item.description}</p>
        <div class="card-footer">
          <span class="location"><i class="fas fa-map-marker-alt"></i> ${item.competitionName}</span>
          <span class="result">${item.position}</span>
        </div>
        ${btnHtml}
        ${adminControlsHtml}
      `;

      grid.appendChild(card);

      // Bind Admin Actions
      if (adminActive) {
        card.querySelector('.ar-cms-btn--edit').addEventListener('click', () => {
          openAchievementModal('Edit Achievement', item, async (formData) => {
            const res = await apiFetch(`${ACHIEVEMENTS_API}/${item._id}`, {
              method: 'PUT',
              body: JSON.stringify(formData),
            });

            if (res.success) {
              notify('Achievement updated successfully!');
              await hydrateAchievements();
            } else {
              notify(res.message || 'Update failed', 'error');
            }
          });
        });

        card.querySelector('.ar-cms-btn--delete').addEventListener('click', () => {
          if (window.ARCms && window.ARCms.showConfirmationDialog) {
            window.ARCms.showConfirmationDialog({
              title: 'Delete Achievement',
              message: `Are you sure you want to delete "${item.title}"?`,
              onConfirm: async () => {
                const res = await apiFetch(`${ACHIEVEMENTS_API}/${item._id}`, {
                  method: 'DELETE',
                });

                if (res.success) {
                  card.remove(); // Instant DOM removal
                  notify('Achievement deleted successfully!');
                } else {
                  notify(res.message || 'Delete failed', 'error');
                }
              },
            });
          }
        });
      }
    });

    bindCategoryFilters();
  };

  const bindCategoryFilters = () => {
    const filterButtons = document.querySelectorAll('#filterBar .filter-btn');

    filterButtons.forEach(btn => {
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);

      newBtn.addEventListener('click', () => {
        document.querySelectorAll('#filterBar .filter-btn').forEach(b => b.classList.remove('active'));
        newBtn.classList.add('active');

        const filter = newBtn.dataset.filter;

        document.querySelectorAll('#achievementGrid .achievement-card').forEach(card => {
          const category = (card.dataset.category || '').toLowerCase();
          if (filter === 'all' || category === filter) {
            card.style.display = 'block';
            card.classList.add('visible');
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  };

  // ============================================================
  //  ACHIEVEMENT MODAL FORM
  // ============================================================
  const openAchievementModal = (title, data = {}, onSave) => {
    const existing = document.getElementById('arAchievementModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'ar-cms-modal-overlay ar-open';
    overlay.id = 'arAchievementModal';

    overlay.innerHTML = `
      <div class="ar-cms-modal" style="max-width:560px;">
        <div class="ar-cms-modal-header">
          <h3>${title}</h3>
          <button class="ar-cms-modal-close" id="arAchModalClose"><i class="fas fa-times"></i></button>
        </div>
        <form id="arAchForm">
          <div class="ar-cms-form-group">
            <label>Achievement Title</label>
            <input type="text" name="title" value="${data.title || ''}" placeholder="e.g. Formula Bharat — AIR 8 Overall" required />
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>Competition Name</label>
              <input type="text" name="competitionName" value="${data.competitionName || ''}" placeholder="e.g. Formula Bharat 2024" required />
            </div>
            <div>
              <label>Position / Rank</label>
              <input type="text" name="position" value="${data.position || ''}" placeholder="e.g. AIR 8" required />
            </div>
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <div>
              <label>Category</label>
              <select name="category" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#fff;outline:none;">
                <option value="competition" ${(data.category || '') === 'competition' ? 'selected' : ''}>Competition</option>
                <option value="award" ${(data.category || '') === 'award' ? 'selected' : ''}>Award</option>
                <option value="record" ${(data.category || '') === 'record' ? 'selected' : ''}>Milestone</option>
                <option value="certificate" ${(data.category || '') === 'certificate' ? 'selected' : ''}>Recognition</option>
              </select>
            </div>
            <div>
              <label>Date / Year</label>
              <input type="text" name="date" value="${data.date || '2026'}" required />
            </div>
            <div>
              <label>Display Order</label>
              <input type="number" name="displayOrder" value="${data.displayOrder !== undefined ? data.displayOrder : 0}" />
            </div>
          </div>
          <div class="ar-cms-form-group">
            <label>Achievement Image Upload (Cloudinary)</label>
            <input type="file" name="imageFile" accept="image/*" />
            ${data.imageUrl ? `<div style="margin-top:4px;font-size:0.75rem;color:#029386;">Current Image: ${data.imageUrl}</div>` : ''}
          </div>
          <div class="ar-cms-form-group">
            <label>Description</label>
            <textarea name="description" rows="3" placeholder="Enter achievement details" required>${data.description || ''}</textarea>
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>Button Text (Optional)</label>
              <input type="text" name="buttonText" value="${data.buttonText || ''}" placeholder="e.g. View Certificate" />
            </div>
            <div>
              <label>Button Link (Optional)</label>
              <input type="text" name="buttonLink" value="${data.buttonLink || ''}" placeholder="e.g. https://..." />
            </div>
          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:24px;">
            <button type="button" class="ar-cms-btn ar-cms-btn--cancel" id="arAchModalCancel">Cancel</button>
            <button type="submit" class="ar-cms-btn ar-cms-btn--save" id="arAchModalSave"><i class="fas fa-save"></i> Save Achievement</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#arAchModalClose').addEventListener('click', close);
    overlay.querySelector('#arAchModalCancel').addEventListener('click', close);

    const form = overlay.querySelector('#arAchForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = overlay.querySelector('#arAchModalSave');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

      try {
        let imageUrl = data.imageUrl || '';
        let publicId = data.publicId || '';

        const imageInput = form.querySelector('[name="imageFile"]');
        if (imageInput.files && imageInput.files[0]) {
          const uploadRes = await uploadPhotoToCloudinary(imageInput.files[0]);
          if (uploadRes.success) {
            imageUrl = uploadRes.imageUrl;
            publicId = uploadRes.publicId;
          } else {
            notify(uploadRes.message || 'Image upload failed', 'error');
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Save Achievement';
            return;
          }
        }

        const formData = {
          title:           form.querySelector('[name="title"]').value,
          competitionName: form.querySelector('[name="competitionName"]').value,
          position:        form.querySelector('[name="position"]').value,
          category:        form.querySelector('[name="category"]').value,
          date:            form.querySelector('[name="date"]').value,
          description:     form.querySelector('[name="description"]').value,
          buttonText:      form.querySelector('[name="buttonText"]').value,
          buttonLink:      form.querySelector('[name="buttonLink"]').value,
          displayOrder:    Number(form.querySelector('[name="displayOrder"]').value),
          imageUrl,
          publicId,
        };

        close();
        if (onSave) await onSave(formData);
      } catch (err) {
        notify('Save error: ' + err.message, 'error');
        saveBtn.disabled = false;
      }
    });
  };

  // ============================================================
  //  INITIALIZATION FOR ACHIEVEMENTS PAGE CMS
  // ============================================================
  const initAchievementsCms = async () => {
    if (window._ashwaAchievementsLoaded) return;
    await hydrateAchievements();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAchievementsCms);
  } else {
    initAchievementsCms();
  }

})();
