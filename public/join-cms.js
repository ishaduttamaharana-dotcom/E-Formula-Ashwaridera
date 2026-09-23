/* ============================================================
   join-cms.js — Reusable Join Team Application Engine
   Injected across all HTML pages.

   Responsibilities:
     • Intercepts all "Join Team" / "Apply Now" buttons across the website.
     • Enforces authentication: If visitor is not logged in, opens auth modal
       and resumes application form post-login.
     • Delivers unified #joinTeamModal application form with all required & optional fields.
     • Submits applications to POST /api/v1/join with optional resume upload.
     • Provides real-time notifications and zero page refreshes.
============================================================ */

(function () {
  'use strict';

  const JOIN_API = '/api/v1/join';
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
      console.log(`[Join CMS ${type}]: ${msg}`);
    }
  };

  // ============================================================
  //  INTERCEPT ALL JOIN TEAM BUTTONS ACROSS THE WEBSITE
  // ============================================================
  const bindJoinButtons = () => {
    const selector = [
      '.nav-cta',
      'a[href*="recruitment"]',
      'a[href*="join"]',
      '.btn-primary[href*="recruitment"]',
      '.btn[href*="recruitment"]',
      '#openJoinModal',
    ].join(',');

    const buttons = document.querySelectorAll(selector);

    buttons.forEach((btn) => {
      // Avoid breaking standard internal page links like my-applications.html
      if (btn.getAttribute('href') === 'my-applications.html') return;

      btn.addEventListener('click', (e) => {
        e.preventDefault();
        openJoinModal();
      });
    });
  };

  // ============================================================
  //  UNIFIED JOIN TEAM APPLICATION MODAL FORM
  // ============================================================
  const openJoinModal = () => {
    const user = getStoredUser() || {};
    const existing = document.getElementById('joinTeamModal');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'ar-cms-modal-overlay ar-open';
    overlay.id = 'joinTeamModal';

    overlay.innerHTML = `
      <div class="ar-cms-modal" style="max-width:720px;max-height:88vh;overflow-y:auto;">
        <div class="ar-cms-modal-header">
          <h3>🏎️ Ashwa Riders — Join Team Application</h3>
          <button class="ar-cms-modal-close" id="arJoinClose"><i class="fas fa-times"></i></button>
        </div>

        <form id="arJoinForm" enctype="multipart/form-data">

          <!-- Section 1: Personal Information -->
          <h4 style="color:#029386;margin:16px 0 8px;font-size:0.9rem;letter-spacing:0.05em;text-transform:uppercase;">1. Personal Information</h4>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>Full Name *</label>
              <input type="text" name="fullName" value="${user.fullName || ''}" required />
            </div>
            <div>
              <label>Email Address *</label>
              <input type="email" name="email" value="${user.email || ''}" required />
            </div>
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <div>
              <label>Phone Number *</label>
              <input type="text" name="phone" value="${user.phone || ''}" placeholder="+91 98765 43210" required />
            </div>
            <div>
              <label>Date of Birth</label>
              <input type="date" name="dateOfBirth" />
            </div>
            <div>
              <label>Gender</label>
              <select name="gender" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#fff;outline:none;">
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <!-- Section 2: Academic Information -->
          <h4 style="color:#029386;margin:16px 0 8px;font-size:0.9rem;letter-spacing:0.05em;text-transform:uppercase;">2. Academic Information</h4>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>College Name *</label>
              <input type="text" name="college" value="${user.college || 'St. Vincent Pallotti College of Engineering'}" required />
            </div>
            <div>
              <label>University</label>
              <input type="text" name="university" placeholder="e.g. RTMNU" />
            </div>
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <div>
              <label>Branch / Specialization *</label>
              <input type="text" name="branch" value="${user.branch || ''}" placeholder="e.g. Mechanical, ECE, CSE" required />
            </div>
            <div>
              <label>Current Year *</label>
              <select name="currentYear" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#fff;outline:none;" required>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year" selected>2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>
            <div>
              <label>Graduation Year</label>
              <input type="text" name="graduationYear" placeholder="e.g. 2027" />
            </div>
          </div>

          <!-- Section 3: Department Selection -->
          <h4 style="color:#029386;margin:16px 0 8px;font-size:0.9rem;letter-spacing:0.05em;text-transform:uppercase;">3. Department Applying For *</h4>
          <div class="ar-cms-form-group">
            <select name="department" style="width:100%;padding:10px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.15);color:#fff;outline:none;" required>
              <option value="">Select Department...</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Electronics">Electronics</option>
              <option value="Electrical">Electrical</option>
              <option value="Aerodynamics">Aerodynamics</option>
              <option value="Chassis">Chassis</option>
              <option value="Powertrain">Powertrain</option>
              <option value="Suspension">Suspension</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Embedded Systems">Embedded Systems</option>
              <option value="Software">Software</option>
              <option value="AI/ML">AI / ML</option>
              <option value="Web Development">Web Development</option>
              <option value="Media & Marketing">Media & Marketing</option>
              <option value="Finance">Finance</option>
              <option value="Sponsorship">Sponsorship</option>
            </select>
          </div>

          <!-- Section 4: Skills & Links -->
          <h4 style="color:#029386;margin:16px 0 8px;font-size:0.9rem;letter-spacing:0.05em;text-transform:uppercase;">4. Skills & Online Profiles</h4>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div>
              <label>Technical Skills</label>
              <input type="text" name="technicalSkills" placeholder="e.g. CAD, FEA, PCB Design, Soldering" />
            </div>
            <div>
              <label>Software Tools & Languages</label>
              <input type="text" name="softwareTools" placeholder="e.g. SolidWorks, MATLAB, C++, Python" />
            </div>
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            <div>
              <label>LinkedIn Profile</label>
              <input type="text" name="linkedin" placeholder="https://linkedin.com/in/..." />
            </div>
            <div>
              <label>GitHub Profile</label>
              <input type="text" name="github" placeholder="https://github.com/..." />
            </div>
            <div>
              <label>Portfolio Link</label>
              <input type="text" name="portfolio" placeholder="https://..." />
            </div>
          </div>

          <!-- Section 5: Optional Resume Upload -->
          <h4 style="color:#029386;margin:16px 0 8px;font-size:0.9rem;letter-spacing:0.05em;text-transform:uppercase;">5. Resume Upload (Optional)</h4>
          <div class="ar-cms-form-group">
            <label>Accepted: PDF, DOC, DOCX (Max 1000 MB)</label>
            <input type="file" name="resume" accept=".pdf,.doc,.docx" />
          </div>

          <!-- Section 6: Additional Questions -->
          <h4 style="color:#029386;margin:16px 0 8px;font-size:0.9rem;letter-spacing:0.05em;text-transform:uppercase;">6. Questions</h4>
          <div class="ar-cms-form-group">
            <label>Why do you want to join Ashwa Riders? *</label>
            <textarea name="motivation" rows="3" placeholder="Tell us your motivation..." required></textarea>
          </div>
          <div class="ar-cms-form-group">
            <label>Previous Project & Formula Student Experience</label>
            <textarea name="projectExperience" rows="2" placeholder="Detail any relevant technical projects..."></textarea>
          </div>

          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;">
            <button type="button" class="ar-cms-btn ar-cms-btn--cancel" id="arJoinCancel">Cancel</button>
            <button type="submit" class="ar-cms-btn ar-cms-btn--save" id="arJoinSave"><i class="fas fa-paper-plane"></i> Submit Application</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(overlay);

    const close = () => overlay.remove();
    overlay.querySelector('#arJoinClose').addEventListener('click', close);
    overlay.querySelector('#arJoinCancel').addEventListener('click', close);

    const form = overlay.querySelector('#arJoinForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const saveBtn = overlay.querySelector('#arJoinSave');
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

      const formData = new FormData(form);

      try {
        const res = await fetch(JOIN_API, {
          method: 'POST',
          credentials: 'include',
          body: formData,
        });
        const data = await res.json();

        if (data.success) {
          close();
          notify('Your recruitment application has been submitted successfully! The Ashwa Riders team will review your application.');
        } else {
          notify(data.message || 'Submission failed. Please verify your details.', 'error');
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
        }
      } catch (err) {
        notify('Submission error: ' + err.message, 'error');
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Submit Application';
      }
    });
  };

  // ============================================================
  //  INITIALIZATION
  // ============================================================
  const initJoinCms = () => {
    bindJoinButtons();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initJoinCms);
  } else {
    initJoinCms();
  }

})();
