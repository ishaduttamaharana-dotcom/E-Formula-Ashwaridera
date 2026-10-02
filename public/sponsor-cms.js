/* ============================================================
   sponsor-cms.js — Reusable Sponsor Application Engine
   Injected across all HTML pages.
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

  const isLoggedIn = () => !!getStoredUser();

  const notify = (msg, type = 'success') => {
    if (window.ARCms && window.ARCms.showSuccessNotification) {
      if (type === 'success') window.ARCms.showSuccessNotification(msg);
      else window.ARCms.showErrorNotification(msg);
    } else {
      console.log(`[Sponsor CMS ${type}]: ${msg}`);
    }
  };

  /* Presentation-only styles for the sponsorship application modal. */
  const injectSponsorFormStyles = () => {
    if (document.getElementById('ar-sponsor-form-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'ar-sponsor-form-ui-styles';
    style.textContent = `
      #sponsorModal.ar-cms-modal-overlay{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(0,0,0,.78);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);overflow-y:auto}
      #sponsorModal .ar-cms-modal{width:min(920px,100%);max-width:920px!important;max-height:min(90vh,900px)!important;margin:auto;padding:0;overflow:hidden!important;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:#0b0b0d;color:#f5f5f5;box-shadow:0 30px 100px rgba(0,0,0,.55)}
      #sponsorModal .ar-cms-modal-header{position:sticky;top:0;z-index:3;display:flex;align-items:center;justify-content:space-between;gap:18px;padding:20px 24px;border-bottom:1px solid rgba(255,255,255,.09);background:rgba(11,11,13,.96);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px)}
      #sponsorModal .ar-cms-modal-header h3{margin:0;color:#fff;font-size:1rem;line-height:1.35;font-weight:800;letter-spacing:.03em;text-transform:uppercase}
      #sponsorModal .ar-cms-modal-close{flex:0 0 auto;width:36px;height:36px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.12);border-radius:8px;background:#151519;color:#fff;cursor:pointer}
      #sponsorModal #arSponsorForm{padding:24px;overflow-y:auto;max-height:calc(min(90vh,900px) - 78px)}
      #sponsorModal #arSponsorForm h4{display:flex;align-items:center;gap:10px;margin:22px 0 12px!important;padding:10px 12px;border-left:3px solid #ff6a26;border-bottom:1px solid rgba(255,255,255,.08);background:linear-gradient(90deg,rgba(255,106,38,.08),transparent);color:#ff7a35!important;font-size:.72rem!important;line-height:1.4;letter-spacing:.08em!important;text-transform:uppercase}
      #sponsorModal #arSponsorForm h4:first-of-type{margin-top:0!important}
      #sponsorModal .ar-cms-form-group{margin:0 0 14px}
      #sponsorModal .ar-cms-form-group[style*="grid-template-columns"]{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:14px!important}
      #sponsorModal .ar-cms-form-group>div{min-width:0}
      #sponsorModal .ar-cms-form-group label{display:block;margin:0 0 6px;color:#9ca3af;font-family:inherit;font-size:.68rem;font-weight:700;letter-spacing:.06em;line-height:1.35;text-transform:uppercase}
      #sponsorModal .ar-cms-form-group input,#sponsorModal .ar-cms-form-group select,#sponsorModal .ar-cms-form-group textarea{display:block;width:100%;min-width:0;min-height:44px;padding:11px 12px;border:1px solid rgba(255,255,255,.13)!important;border-radius:7px!important;outline:none;background:#151519!important;color:#f5f5f5!important;font:400 .84rem/1.45 Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:none;transition:border-color .2s ease,background .2s ease}
      #sponsorModal .ar-cms-form-group input::placeholder,#sponsorModal .ar-cms-form-group textarea::placeholder{color:#666a73}
      #sponsorModal .ar-cms-form-group input:focus,#sponsorModal .ar-cms-form-group select:focus,#sponsorModal .ar-cms-form-group textarea:focus{border-color:rgba(255,106,38,.85)!important;background:#18181d!important;box-shadow:0 0 0 3px rgba(255,106,38,.09)}
      #sponsorModal .ar-cms-form-group textarea{min-height:100px;resize:vertical}
      #sponsorModal .ar-cms-form-group select{appearance:auto;-webkit-appearance:auto;color-scheme:dark;cursor:pointer}
      #sponsorModal .ar-cms-form-group select option{background:#151519;color:#fff}
      #sponsorModal .ar-cms-form-group input[type="file"]{padding:9px 10px;color:#c7c9cf!important;cursor:pointer}
      #sponsorModal #arSponsorForm>div:last-child{display:flex!important;align-items:center;justify-content:flex-end!important;gap:10px!important;margin-top:24px!important;padding-top:18px;border-top:1px solid rgba(255,255,255,.09)}
      #sponsorModal .ar-cms-btn{min-height:42px;padding:10px 18px;border-radius:7px;font:700 .75rem/1 Inter,sans-serif;letter-spacing:.04em;cursor:pointer}
      #sponsorModal .ar-cms-btn--cancel{border:1px solid rgba(255,255,255,.14);background:#151519;color:#d1d5db}
      #sponsorModal .ar-cms-btn--save{border:1px solid #ff6a26;background:#ff6a26;color:#111}
      #sponsorModal .ar-cms-btn--save:hover{background:#ff7d3d}
      #sponsorModal .ar-cms-btn:disabled{opacity:.6;cursor:wait}
      @media(max-width:700px){
        #sponsorModal.ar-cms-modal-overlay{align-items:flex-start;padding:10px}
        #sponsorModal .ar-cms-modal{width:100%;max-height:calc(100dvh - 20px)!important;border-radius:10px}
        #sponsorModal .ar-cms-modal-header{padding:15px 16px}
        #sponsorModal .ar-cms-modal-header h3{max-width:calc(100% - 46px);font-size:.82rem}
        #sponsorModal #arSponsorForm{padding:16px;max-height:calc(100dvh - 77px)}
        #sponsorModal .ar-cms-form-group[style*="grid-template-columns"]{grid-template-columns:1fr!important}
        #sponsorModal #arSponsorForm h4{font-size:.66rem!important;margin-top:18px!important}
        #sponsorModal #arSponsorForm>div:last-child{position:sticky;bottom:-16px;margin-left:-16px!important;margin-right:-16px!important;padding:14px 16px;background:rgba(11,11,13,.96);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
        #sponsorModal .ar-cms-btn{flex:1}
      }
    `;
    document.head.appendChild(style);
  };

  /* Mobile presentation for the sponsor logo rail only. No data/API changes. */
  const injectSponsorRailStyles = () => {
    if (!document.getElementById('ar-sponsor-rail-ui-styles')) return;
    if (document.getElementById('ar-sponsor-rail-ui-styles')) return;
  };

  const addSponsorRailStyles = () => {
    if (!document.getElementById('sponsorRailSection') || document.getElementById('ar-sponsor-rail-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'ar-sponsor-rail-ui-styles';
    style.textContent = `
      @media (max-width:768px){
        #sponsorRailSection{padding:28px 0!important;background:linear-gradient(180deg,#dfe4e3 0%,#cfd6d5 100%)!important;border-top:1px solid rgba(34,33,38,.14)!important;border-bottom:1px solid rgba(34,33,38,.14)!important}
        #sponsorRailSection::before{content:'BACKED BY THE BEST';display:block;width:100%;padding:0 16px 18px;text-align:center;font:800 .72rem/1.2 'JetBrains Mono',monospace;letter-spacing:.14em;color:#222126}
        #sponsorRailSection .sponsor-scroll-wrapper{gap:12px;animation-duration:38s!important}
        #sponsorRailSection .sponsor-track{gap:12px}
        #sponsorRailSection .sponsor-item{height:72px;min-width:150px;padding:10px 16px!important;border:1px solid rgba(34,33,38,.12)!important;border-radius:10px;background:rgba(255,255,255,.82);box-shadow:0 5px 16px rgba(34,33,38,.08);font-size:.76rem!important;line-height:1.25;letter-spacing:.035em;white-space:normal!important;text-align:center;opacity:1!important}
        #sponsorRailSection .sponsor-item a{width:100%;height:100%;justify-content:center;gap:8px}
        #sponsorRailSection .sponsor-item img{max-width:118px!important;max-height:38px!important;filter:none!important}
        #sponsorRailSection .sponsor-item i{margin-right:6px;color:#f25912;font-size:.85rem}
      }
    `;
    document.head.appendChild(style);
  };

  const bindSponsorButtons = () => {
    const selector = ['.btn-sponsor','a[href*="sponsor"]','a[href="#sponsorship"]','#openSponsorModal'].join(',');
    document.querySelectorAll(selector).forEach((btn) => {
      if (btn.tagName === 'A' && btn.getAttribute('href') === 'sponsors.html' && !btn.classList.contains('btn')) return;
      btn.addEventListener('click', (e) => { e.preventDefault(); openSponsorModal(); });
    });
  };

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
          <h4>1. Company Information</h4>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label>Company Name *</label><input type="text" name="companyName" placeholder="e.g. Ansys Inc." required /></div>
            <div><label>Industry</label><input type="text" name="industry" placeholder="e.g. Automotive, Software, Electronics" /></div>
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label>Company Website</label><input type="text" name="website" placeholder="https://..." /></div>
            <div><label>Company Logo Image (Optional)</label><input type="file" name="logo" accept="image/*" /></div>
          </div>
          <h4>2. Contact Information</h4>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label>Contact Person Name *</label><input type="text" name="contactPerson" value="${user.fullName || ''}" required /></div>
            <div><label>Designation</label><input type="text" name="designation" placeholder="e.g. CSR Manager, Director" /></div>
          </div>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label>Email Address *</label><input type="email" name="email" value="${user.email || ''}" required /></div>
            <div><label>Phone Number *</label><input type="text" name="phone" value="${user.phone || ''}" placeholder="+91 98765 43210" required /></div>
          </div>
          <h4>3. Sponsorship Details</h4>
          <div class="ar-cms-form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div><label>Sponsorship Type *</label><select name="sponsorshipType" required><option value="">Select Category...</option><option value="Title Sponsor">Title Sponsor</option><option value="Platinum Sponsor">Platinum Sponsor</option><option value="Gold Sponsor">Gold Sponsor</option><option value="Silver Sponsor">Silver Sponsor</option><option value="Equipment Partner">Equipment Partner</option><option value="Knowledge Partner">Knowledge Partner</option><option value="Other">Other</option></select></div>
            <div><label>Sponsorship Amount / Value (Optional)</label><input type="text" name="sponsorshipAmount" placeholder="e.g. ₹5,00,000 or In-Kind Software" /></div>
          </div>
          <h4>4. Proposal & Message</h4>
          <div class="ar-cms-form-group"><label>Expected Collaboration / Benefits Requested</label><input type="text" name="expectedCollaboration" placeholder="e.g. Logo on car chassis, recruitment access, social media spotlight" /></div>
          <div class="ar-cms-form-group"><label>Why do you want to sponsor Ashwa Riders?</label><textarea name="message" rows="3" placeholder="Tell us your sponsorship goals..."></textarea></div>
          <div class="ar-cms-form-group"><label>Upload Sponsorship Proposal PDF / Doc (Optional, Max 1000MB)</label><input type="file" name="document" accept=".pdf,.doc,.docx" /></div>
          <div style="display:flex;justify-content:flex-end;gap:12px;margin-top:24px;"><button type="button" class="ar-cms-btn ar-cms-btn--cancel" id="arSponsorCancel">Cancel</button><button type="submit" class="ar-cms-btn ar-cms-btn--save" id="arSponsorSave"><i class="fas fa-handshake"></i> Submit Request</button></div>
        </form>
      </div>`;

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
        const res = await fetch(SPONSOR_API, { method:'POST', credentials:'include', body:formData });
        const data = await res.json();
        if (data.success) { close(); notify('Your sponsorship request has been submitted successfully.'); }
        else { notify(data.message || 'Submission failed','error'); saveBtn.disabled=false; saveBtn.innerHTML='<i class="fas fa-handshake"></i> Submit Request'; }
      } catch (err) {
        notify('Submission error: '+err.message,'error');
        saveBtn.disabled=false;
        saveBtn.innerHTML='<i class="fas fa-handshake"></i> Submit Request';
      }
    });
  };

  const initSponsorCms = () => {
    injectSponsorFormStyles();
    addSponsorRailStyles();
    bindSponsorButtons();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSponsorCms);
  else initSponsorCms();
})();
