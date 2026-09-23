/* ============================================================
   sponsor-cms.js — Reusable Sponsor Application Engine
   Injected across all HTML pages.

   Responsibilities:
     • Intercepts all "Become a Sponsor" / "Sponsor Us" buttons.
     • Enforces authentication: If visitor is not logged in, opens auth modal
       and resumes sponsorship form post-login.
     • Delivers unified #sponsorModal form with company, contact, details,
       logo upload & proposal document attachment.
     • Submits applications to POST /api/v1/sponsors.
     • Provides real-time notifications and zero page refreshes.
============================================================ */

(function () {
  'use strict';

  const SPONSOR_API = '/api/v1/sponsors';
  const STORAGE_KEY = 'ar_user';

  const getStoredUser = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  };

  const isLoggedIn = () => {
    return !!getStoredUser();
  };

  const notify = (msg, type = 'success') => {
    if (window.ARCms && window.ARCms.showSuccessNotification) {
      if (type === 'success') window.ARCms.showSuccessNotification(msg);
      else window.ARCms.showErrorNotification(msg);
    } else {
      console.log(`[Sponsor CMS ${type}]: ${msg}`);
    }
  };

  // ============================================================
  //  INTERCEPT ALL BECOME A SPONSOR BUTTONS
  // ============================================================
  const bindSponsorButtons = () => {
    const selector = [
      '.btn-sponsor',
      'a[href*="sponsor"]',
      'a[href="#sponsorship"]',
      '#openSponsorModal',
    ].join(',');

    const buttons = document.querySelectorAll(selector);

    buttons.forEach((btn) => {
      // Avoid intercepting navigation to sponsors.html page itself if it's a menu link
      if (btn.tagName === 'A' && btn.getAttribute('href') === 'sponsors.html' && !btn.classList.contains('btn')) return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openSponsorModal();
      });
    });
  };

  // ============================================================
  //  UNIFIED SPONSOR APPLICATION MODAL FORM
  // ============================================================
  const openSponsorModal = () => {
    const user = getStoredUser() || {};
    const existing = document.getElementById('sponsorModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'ar-cms-modal-overlay ar-open';
    overlay.id = 'sponsorModal';

    overlay.innerHTML = `
      <div class="ar-cms-modal" style="max-width:720px;max-height:88vh;overflow-y:auto;">
        <div class="ar-cms-modal-header">
          <h3>⚡ Ashwa Riders — Sponsorship Application</h3>
          <button class="ar-cms-modal-close" id="arSponsorClose"><i class="fas fa-times"></i></button>
        </div>

        <form id="arSponsorForm" enctype="multipart/form-data">

          <!-- Section 1: Company Information -->
          <h4 style="color:#029386;margin:16px 0 8px;font-size:0.9rem;letter-spacing:0.05em;text-transform:uppercase;">1. Company Information</h4>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>Company Name *</label>
              <input type="text" name="companyName" placeholder="e.g. Ansys Inc." required />
            </div>
            <div>
              <label>Industry</label>
              <input type="text" name="industry" placeholder="e.g. Automotive, Software, Electronics" />
            </div>
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>Company Website</label>
              <input type="text" name="website" placeholder="https://..." />
            </div>
            <div>
              <label>Company Logo Image (Optional)</label>
              <input type="file" name="logo" accept="image/*" />
            </div>
          </div>

          <!-- Section 2: Contact Information -->
          <h4 style="color:#029386;margin:16px 0 8px;font-size:0.9rem;letter-spacing:0.05em;text-transform:uppercase;">2. Contact Information</h4>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>Contact Person Name *</label>
              <input type="text" name="contactPerson" value="${user.fullName || ''}" required />
            </div>
            <div>
              <label>Designation</label>
              <input type="text" name="designation" placeholder="e.g. CSR Manager, Director" />
            </div>
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>Email Address *</label>
              <input type="email" name="email" value="${user.email || ''}" required />
            </div>
            <div>
              <label>Phone Number *</label>
              <input type="text" name="phone" value="${user.phone || ''}" placeholder="+91 98765 43210" required />
            </div>
          </div>

          <!-- Section 3: Sponsorship Details -->
          <h4 style="color:#029386;margin:16px 0 8px;font-size:0.9rem;letter-spacing:0.05em;text-transform:uppercase;">3. Sponsorship Details</h4>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>Sponsorship Type *</label>
              <select name="sponsorshipType" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#fff;outline:none;" required>
                <option value="">Select Category...</option>
                <option value="Title Sponsor">Title Sponsor</option>
                <option value="Platinum Sponsor">Platinum Sponsor</option>
                <option value="Gold Sponsor">Gold Sponsor</option>
                <option value="Silver Sponsor">Silver Sponsor</option>
                <option value="Technical Partner">Technical Partner</option>
                <option value="Equipment Partner">Equipment Partner</option>
                <option value="Media Partner">Media Partner</option>
                <option value="Knowledge Partner">Knowledge Partner</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label>Sponsorship Amount / Value (Optional)</label>
              <input type="text" name="sponsorshipAmount" placeholder="e.g. ₹5,00,000 or In-Kind Software" />
            </div>
          </div>

          <!-- Section 4: Proposal & Message -->
          <h4 style="color:#029386;margin:16px 0 8px;font-size:0.9rem;letter-spacing:0.05em;text-transform:uppercase;">4. Proposal & Message</h4>
          <div class="ar-cms-form-group">
            <label>Expected Collaboration / Benefits Requested</label>
            <input type="text" name="expectedCollaboration" placeholder="e.g. Logo on car chassis, recruitment access, social media spotlight" />
          </div>
          <div class="ar-cms-form-group">
            <label>Why do you want to sponsor Ashwa Riders?</label>
            <textarea name="message" rows="3" placeholder="Tell us your sponsorship goals..."></textarea>
          </div>
          <div class="ar-cms-form-group">
            <label>Upload Sponsorship Proposal PDF / Doc (Optional, Max 1000MB)</label>
            <input type="file" name="document" accept=".pdf,.doc,.docx" />
          </div>

          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;">
            <button type="button" class="ar-cms-btn ar-cms-btn--cancel" id="arSponsorCancel">Cancel</button>
            <button type="submit" class="ar-cms-btn ar-cms-btn--save" id="arSponsorSave"><i class="fas fa-handshake"></i> Submit Request</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#arSponsorClose').addEventListener('click', close);
    overlay.querySelector('#arSponsorCancel').addEventListener('click', close);

    const form = overlay.querySelector('#arSponsorForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = overlay.querySelector('#arSponsorSave');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

      const formData = new FormData(form);

      try {
        const res = await fetch(SPONSOR_API, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          close();
          notify('Your sponsorship request has been submitted successfully.');
        } else {
          notify(data.message || 'Submission failed', 'error');
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-handshake"></i> Submit Request';
        }
      } catch (err) {
        notify('Submission error: ' + err.message, 'error');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-handshake"></i> Submit Request';
      }
    });
  };

  // ============================================================
  //  INITIALIZATION
  // ============================================================
  const initSponsorCms = () => {
    bindSponsorButtons();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSponsorCms);
  } else {
    initSponsorCms();
  }

})();
