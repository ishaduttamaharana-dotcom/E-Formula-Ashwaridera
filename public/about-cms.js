/* ============================================================
   about-cms.js — Public About Page Dynamic Hydration Engine
   Injected into public/about.html.
   Hydrates all 14 About Page sections dynamically from MongoDB Atlas.
   Seamlessly supports Live Published data & Draft Preview mode (?preview=true).
============================================================ */

(function () {
  'use strict';

  const ABOUT_API = '/api/v1/about';
  const ADMIN_ABOUT_API = '/admin/about';

  const apiFetch = async (url) => {
    const res = await fetch(url, { credentials: 'include' });
    return res.json();
  };

  const renderPreviewBanner = () => {
    if (document.getElementById('arPreviewBanner')) return;
    const banner = document.createElement('div');
    banner.id = 'arPreviewBanner';
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      z-index: 9999999;
      background: linear-gradient(90deg, #FF5A00, #FF7A1F);
      color: #FFFFFF;
      font-family: 'JetBrains Mono', monospace, sans-serif;
      font-size: 0.78rem;
      font-weight: 700;
      padding: 8px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 20px rgba(0,0,0,0.6);
      letter-spacing: 0.02em;
    `;
    banner.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px;">
        <span style="display:inline-block; width:8px; height:8px; border-radius:50%; background:#fff; animation:pulse 1.2s infinite;"></span>
        <span><i class="fas fa-eye"></i> DRAFT PREVIEW MODE — You are viewing unpublished draft changes for Ashwa Riders About Page.</span>
      </div>
      <div style="display:flex; align-items:center; gap:12px;">
        <a href="/admin/about" style="color:#fff; background:rgba(0,0,0,0.35); border:1px solid rgba(255,255,255,0.3); padding:4px 12px; border-radius:4px; text-decoration:none; font-size:0.75rem; transition:background 0.2s;">
          <i class="fas fa-arrow-left"></i> Return to Editor
        </a>
      </div>
    `;
    document.body.prepend(banner);

    const nav = document.querySelector('.navbar');
    if (nav) nav.style.top = '34px';
  };

  const hydrateAboutPage = async () => {
    const isPreview = window.location.search.includes('preview=true');
    if (isPreview) renderPreviewBanner();

    try {
      const url = isPreview ? `${ABOUT_API}?preview=true` : ABOUT_API;
      let res = await apiFetch(url);
      let data = (res && res.success && res.data) ? res.data : null;

      // Resilience check: if public payload is missing full 14-section data, fallback to /admin/about
      if (!data || !data.whoWeAre || (!data.whoWeAre.leadParagraph && !data.whoWeAre.primaryParagraph)) {
        try {
          const adminRes = await apiFetch(ADMIN_ABOUT_API);
          if (adminRes && adminRes.success && adminRes.data) {
            const adminDoc = adminRes.data;
            data = isPreview ? (adminDoc.draftVersion || adminDoc) : (adminDoc.publishedVersion || adminDoc);
          }
        } catch (e) {
          console.warn('Fallback check:', e.message);
        }
      }

      if (data) {
        renderAbout(data);
      }
    } catch (err) {
      console.warn('About hydration notice:', err.message);
    }
  };

  const renderAbout = (data) => {
    console.log('[ABOUT CMS] Hydrating About page with published CMS data:', data);

    // ── 01. HERO ──────────────────────────────────────────────────────
    if (data.hero) {
      const heroSec = document.getElementById('section-hero') || document.querySelector('.about-hero');
      if (heroSec) {
        const isVisible = data.hero.visible !== false && data.hero.isVisible !== false;
        if (!isVisible) {
          heroSec.style.display = 'none';
        } else {
          heroSec.style.display = '';
          const eyebrow = heroSec.querySelector('.eyebrow');
          const title = heroSec.querySelector('h1');
          const tagline = heroSec.querySelector('.tagline');
          const desc = heroSec.querySelector('p');

          if (eyebrow && data.hero.eyebrow) eyebrow.innerHTML = `<i class="fas fa-flag-checkered"></i> ${data.hero.eyebrow}`;
          const titleVal = data.hero.title || data.hero.heading;
          if (title && titleVal) title.innerHTML = titleVal;
          if (tagline && data.hero.subtitle) tagline.textContent = data.hero.subtitle;
          if (desc && data.hero.description) desc.textContent = data.hero.description;

          const bgImg = data.hero.desktopImageUrl || data.hero.media?.desktopImage || data.hero.backgroundImageUrl;
          if (bgImg) {
            heroSec.style.backgroundImage = `url('${bgImg}')`;
            heroSec.style.backgroundSize = 'cover';
          }
        }
      }
    }

    // ── 02. WHO WE ARE ────────────────────────────────────────────────
    if (data.whoWeAre) {
      const sec = document.getElementById('section-who-we-are') || document.querySelector('.split-block')?.closest('section');
      if (sec) {
        const isVisible = data.whoWeAre.visible !== false && data.whoWeAre.isVisible !== false;
        if (!isVisible) {
          sec.style.display = 'none';
        } else {
          sec.style.display = '';
          const img = sec.querySelector('.split-image img');
          const imgSrc = data.whoWeAre.imageUrl || data.whoWeAre.media?.image;
          if (img && imgSrc) {
            img.src = imgSrc;
            if (data.whoWeAre.altText) img.alt = data.whoWeAre.altText;
          }

          const copy = sec.querySelector('.split-copy');
          if (copy) {
            const eb = copy.querySelector('.eyebrow');
            if (eb && data.whoWeAre.eyebrow) eb.textContent = data.whoWeAre.eyebrow;

            const t = copy.querySelector('.section-title');
            const titleVal = data.whoWeAre.title || data.whoWeAre.heading;
            if (t && titleVal) t.innerHTML = titleVal;

            const lead = copy.querySelector('p.lead');
            const leadVal = data.whoWeAre.leadParagraph || data.whoWeAre.primaryParagraph;
            if (lead && leadVal) lead.textContent = leadVal;

            const closing = copy.querySelector('p strong');
            if (closing && data.whoWeAre.closingStatement) {
              closing.textContent = data.whoWeAre.closingStatement;
            }
          }
        }
      }
    }

    // ── 03. OUR STORY ─────────────────────────────────────────────────
    if (data.story) {
      const storySec = document.getElementById('section-story') || Array.from(document.querySelectorAll('section')).find((s) => s.querySelector('.eyebrow')?.textContent.includes('Story'));
      if (storySec) {
        const isVisible = data.story.visible !== false && data.story.isVisible !== false;
        if (!isVisible) {
          storySec.style.display = 'none';
        } else {
          storySec.style.display = '';
          const eb = storySec.querySelector('.eyebrow');
          if (eb && data.story.eyebrow) eb.textContent = data.story.eyebrow;

          const title = storySec.querySelector('.section-title');
          const titleVal = data.story.title || data.story.headingLine1 || data.story.heading;
          if (title && titleVal) title.innerHTML = titleVal;

          const subs = storySec.querySelectorAll('.section-subtitle');
          if (subs[0] && data.story.description) subs[0].textContent = data.story.description;
          const blocks = data.story.blocks || data.story.storyBlocks;
          if (subs[1] && blocks && blocks[0] && blocks[0].content) {
            subs[1].textContent = blocks[0].content;
          }
        }
      }
    }

    // ── 04. VISION & MISSION ──────────────────────────────────────────
    if (data.visionMission) {
      const vmSec = document.getElementById('section-vision-mission') || document.querySelector('.vm-new')?.closest('section');
      if (vmSec) {
        const isVisible = data.visionMission.visible !== false && data.visionMission.isVisible !== false;
        if (!isVisible) {
          vmSec.style.display = 'none';
        } else {
          vmSec.style.display = '';
          const eb = vmSec.querySelector('.eyebrow');
          if (eb && data.visionMission.eyebrow) eb.textContent = data.visionMission.eyebrow;

          const title = vmSec.querySelector('.section-title');
          const titleVal = data.visionMission.title || data.visionMission.heading;
          if (title && titleVal) title.innerHTML = titleVal;

          const sub = vmSec.querySelector('.section-subtitle');
          if (sub && data.visionMission.description) sub.textContent = data.visionMission.description;

          // Vision item
          const visionItem = vmSec.querySelector('.vm-new-item:nth-child(1)');
          if (visionItem && data.visionMission.vision) {
            const vIcon = visionItem.querySelector('.vm-icon i');
            if (vIcon && data.visionMission.vision.icon) vIcon.className = data.visionMission.vision.icon;

            const vTitle = visionItem.querySelector('.vm-text h3');
            if (vTitle && data.visionMission.vision.title) vTitle.innerHTML = data.visionMission.vision.title;

            const vP = visionItem.querySelector('.vm-text p');
            if (vP && data.visionMission.vision.description) vP.textContent = data.visionMission.vision.description;
          }

          // Mission item
          const missionItem = vmSec.querySelector('.vm-new-item:nth-child(2)');
          if (missionItem && data.visionMission.mission) {
            const mIcon = missionItem.querySelector('.vm-icon i');
            if (mIcon && data.visionMission.mission.icon) mIcon.className = data.visionMission.mission.icon;

            const mTitle = missionItem.querySelector('.vm-text h3');
            if (mTitle && data.visionMission.mission.title) mTitle.innerHTML = data.visionMission.mission.title;

            const mP = missionItem.querySelector('.vm-text p');
            if (mP && data.visionMission.mission.description) mP.textContent = data.visionMission.mission.description;

            const mUl = missionItem.querySelector('.vm-text ul');
            const bullets = data.visionMission.mission.bullets;
            if (mUl && Array.isArray(bullets) && bullets.length > 0) {
              mUl.innerHTML = bullets.map((b) => `<li>${typeof b === 'string' ? b : (b.text || '')}</li>`).join('');
            }
          }
        }
      }
    }

    // ── 05. CORE VALUES ───────────────────────────────────────────────
    if (data.coreValues) {
      const valSec = document.getElementById('section-core-values') || document.querySelector('.value-grid-6')?.closest('section');
      const valGrid = valSec ? valSec.querySelector('.value-grid-6') : document.querySelector('.value-grid-6');
      if (valSec) {
        const isVisible = data.coreValues.visible !== false && data.coreValues.isVisible !== false;
        if (!isVisible) {
          valSec.style.display = 'none';
        } else {
          valSec.style.display = '';
          const eb = valSec.querySelector('.eyebrow');
          if (eb && data.coreValues.eyebrow) eb.textContent = data.coreValues.eyebrow;

          const title = valSec.querySelector('.section-title');
          const titleVal = data.coreValues.title || data.coreValues.heading;
          if (title && titleVal) title.innerHTML = titleVal;

          const sub = valSec.querySelector('.section-subtitle');
          if (sub && data.coreValues.description) sub.textContent = data.coreValues.description;

          const items = Array.isArray(data.coreValues.items) ? data.coreValues.items : (Array.isArray(data.coreValues.values) ? data.coreValues.values : (Array.isArray(data.coreValues) ? data.coreValues : []));
          if (valGrid && items.length > 0) {
            const visibleItems = items.filter((v) => v.visible !== false && v.isVisible !== false);
            valGrid.innerHTML = visibleItems
              .map(
                (v) => `
              <div class="value-card-x">
                <i class="${v.icon || 'fas fa-lightbulb'}"></i>
                <h4>${v.title}</h4>
                <p>${v.description || v.shortDescription || ''}</p>
              </div>
            `
              )
              .join('');
          }
        }
      }
    }

    // ── 06. TEAM STRUCTURE ────────────────────────────────────────────
    if (data.teamStructure) {
      const tsSec = document.getElementById('section-team-structure') || document.querySelector('.org-chart')?.closest('section');
      const orgChart = tsSec ? tsSec.querySelector('.org-chart') : document.querySelector('.org-chart');
      if (tsSec) {
        const isVisible = data.teamStructure.visible !== false && data.teamStructure.isVisible !== false;
        if (!isVisible) {
          tsSec.style.display = 'none';
        } else {
          tsSec.style.display = '';
          const eb = tsSec.querySelector('.eyebrow');
          if (eb && data.teamStructure.eyebrow) eb.textContent = data.teamStructure.eyebrow;

          const title = tsSec.querySelector('.section-title');
          const titleVal = data.teamStructure.title || data.teamStructure.heading;
          if (title && titleVal) title.innerHTML = titleVal;

          const sub = tsSec.querySelector('.section-subtitle');
          if (sub && data.teamStructure.description) sub.textContent = data.teamStructure.description;

          const nodes = Array.isArray(data.teamStructure.nodes) ? data.teamStructure.nodes : (Array.isArray(data.teamStructure) ? data.teamStructure : []);
          if (orgChart && nodes.length > 0) {
            const visibleNodes = nodes.filter((n) => n.visible !== false && n.isVisible !== false);
            let html = '';
            visibleNodes.forEach((node, i) => {
              const nodeClass = (node.level <= 3 || node.level === 'Coordinator' || node.level === 'Leadership') ? 'org-node top' : 'org-node';
              html += `<a href="${node.linkUrl || 'team.html'}" class="${nodeClass}">${node.title}</a>`;
              if (i < visibleNodes.length - 1) {
                html += `<div class="org-connector"></div>`;
              }
            });
            orgChart.innerHTML = html;
          }
        }
      }
    }

    // ── 07. DEPARTMENTS ───────────────────────────────────────────────
    if (data.departments) {
      const deptSec = document.getElementById('section-departments') || document.querySelector('.dept-grid-detailed')?.closest('section');
      const deptGrid = deptSec ? deptSec.querySelector('.dept-grid-detailed') : document.querySelector('.dept-grid-detailed');
      if (deptSec) {
        const isVisible = data.departments.visible !== false && data.departments.isVisible !== false;
        if (!isVisible) {
          deptSec.style.display = 'none';
        } else {
          deptSec.style.display = '';
          const eb = deptSec.querySelector('.eyebrow');
          if (eb && data.departments.eyebrow) eb.textContent = data.departments.eyebrow;

          const title = deptSec.querySelector('.section-title');
          const titleVal = data.departments.title || data.departments.heading;
          if (title && titleVal) title.innerHTML = titleVal;

          const sub = deptSec.querySelector('.section-subtitle');
          if (sub && data.departments.description) sub.textContent = data.departments.description;

          const items = Array.isArray(data.departments.items) ? data.departments.items : (Array.isArray(data.departments.list) ? data.departments.list : []);
          if (deptGrid && items.length > 0) {
            const visibleDepts = items.filter((d) => d.visible !== false && d.isVisible !== false);
            deptGrid.innerHTML = visibleDepts
              .map((d) => {
                const respsHtml = (d.responsibilities || []).map((r) => `<li>${typeof r === 'string' ? r : (r.text || '')}</li>`).join('');
                return `
                <div class="dept-card-x">
                  <i class="${d.icon || 'fas fa-cogs'} dept-icon"></i>
                  <h5>${d.name}</h5>
                  <span class="resp-label">${d.teamLead || 'Team Lead'}</span>
                  <ul>${respsHtml}</ul>
                </div>
              `;
              })
              .join('');
          }
        }
      }
    }

    // ── 08. OUR PROCESS ───────────────────────────────────────────────
    if (data.process) {
      const procSec = document.getElementById('section-process') || document.querySelector('.process-list')?.closest('section');
      const procList = procSec ? procSec.querySelector('.process-list') : document.querySelector('.process-list');
      if (procSec) {
        const isVisible = data.process.visible !== false && data.process.isVisible !== false;
        if (!isVisible) {
          procSec.style.display = 'none';
        } else {
          procSec.style.display = '';
          const eb = procSec.querySelector('.eyebrow');
          if (eb && data.process.eyebrow) eb.textContent = data.process.eyebrow;

          const title = procSec.querySelector('.section-title');
          const titleVal = data.process.title || data.process.heading;
          if (title && titleVal) title.innerHTML = titleVal;

          const sub = procSec.querySelector('.section-subtitle');
          if (sub && data.process.description) sub.textContent = data.process.description;

          const stages = Array.isArray(data.process.stages) ? data.process.stages : (Array.isArray(data.process.items) ? data.process.items : []);
          if (procList && stages.length > 0) {
            const visibleStages = stages.filter((st) => st.visible !== false && st.isVisible !== false);
            procList.innerHTML = visibleStages
              .map(
                (st, idx) => `
              <details class="process-step">
                <summary>
                  <span class="step-num">${st.stepNumber || st.number || ('0' + (idx + 1))}</span>
                  <span class="step-name">${st.name || st.title}</span>
                  <span class="step-toggle"><i class="fas fa-plus"></i></span>
                </summary>
                <div class="step-detail">${st.description || st.details || st.overview || ''}</div>
              </details>
            `
              )
              .join('');

            procList.querySelectorAll('.process-step').forEach((detail) => {
              detail.addEventListener('toggle', () => {
                if (detail.open) {
                  procList.querySelectorAll('.process-step').forEach((d) => {
                    if (d !== detail) d.open = false;
                  });
                }
              });
            });
          }
        }
      }
    }

    // ── 09. FORMULA BHARAT ────────────────────────────────────────────
    if (data.formulaBharat) {
      const fbSec = document.getElementById('section-formula-bharat') || document.querySelector('.fb-panel')?.closest('section');
      if (fbSec) {
        const isVisible = data.formulaBharat.visible !== false && data.formulaBharat.isVisible !== false;
        if (!isVisible) {
          fbSec.style.display = 'none';
        } else {
          fbSec.style.display = '';
          const eb = fbSec.querySelector('.eyebrow');
          if (eb && data.formulaBharat.eyebrow) eb.textContent = data.formulaBharat.eyebrow;

          const title = fbSec.querySelector('.section-title');
          const titleVal = data.formulaBharat.title || data.formulaBharat.heading;
          if (title && titleVal) title.innerHTML = titleVal;

          const sub = fbSec.querySelector('.section-subtitle');
          if (sub && data.formulaBharat.description) sub.textContent = data.formulaBharat.description;

          const img = fbSec.querySelector('.split-image img');
          const fbImg = data.formulaBharat.imageUrl || data.formulaBharat.image;
          if (img && fbImg) {
            img.src = fbImg;
            if (data.formulaBharat.altText) img.alt = data.formulaBharat.altText;
          }

          const tagsWrap = fbSec.querySelector('.fb-tags');
          const facts = Array.isArray(data.formulaBharat.facts) ? data.formulaBharat.facts : (Array.isArray(data.formulaBharat.categories) ? data.formulaBharat.categories : []);
          if (tagsWrap && facts.length > 0) {
            const visibleFacts = facts.filter((f) => f.visible !== false && f.isVisible !== false);
            tagsWrap.innerHTML = visibleFacts.map((f) => `<span class="fb-tag">${f.label}</span>`).join('');
          }
        }
      }
    }

    // ── 10. WORKSHOP ──────────────────────────────────────────────────
    if (data.workshop) {
      const wsSec = document.getElementById('section-workshop') || document.querySelector('.workshop-grid')?.closest('section');
      const wsGrid = wsSec ? wsSec.querySelector('.workshop-grid') : document.querySelector('.workshop-grid');
      if (wsSec) {
        const isVisible = data.workshop.visible !== false && data.workshop.isVisible !== false;
        if (!isVisible) {
          wsSec.style.display = 'none';
        } else {
          wsSec.style.display = '';
          const eb = wsSec.querySelector('.eyebrow');
          if (eb && data.workshop.eyebrow) eb.textContent = data.workshop.eyebrow;

          const title = wsSec.querySelector('.section-title');
          const titleVal = data.workshop.title || data.workshop.heading;
          if (title && titleVal) title.innerHTML = titleVal;

          const items = Array.isArray(data.workshop.items) ? data.workshop.items : [];
          if (wsGrid && items.length > 0) {
            const visibleItems = items.filter((ws) => ws.visible !== false && ws.isVisible !== false);
            wsGrid.innerHTML = visibleItems
              .map(
                (ws) => `
              <div class="workshop-item">
                <img src="${ws.imageUrl || ws.image}" alt="${ws.title}" loading="lazy" />
                <i class="${ws.icon || 'fas fa-tools'}"></i>
                <span>${ws.title}</span>
              </div>
            `
              )
              .join('');
          }
        }
      }
    }

    // ── 11. FACULTY & PEOPLE MESSAGES ─────────────────────────────────
    if (data.peopleMessages) {
      const facSec = document.getElementById('section-faculty');
      const capSec = document.getElementById('section-captain');
      const isVisible = data.peopleMessages.visible !== false && data.peopleMessages.isVisible !== false;

      if (!isVisible) {
        if (facSec) facSec.style.display = 'none';
        if (capSec) capSec.style.display = 'none';
      } else {
        if (facSec) facSec.style.display = '';
        if (capSec) capSec.style.display = '';

        const msgs = Array.isArray(data.peopleMessages.messages) ? data.peopleMessages.messages : (Array.isArray(data.peopleMessages.people) ? data.peopleMessages.people : []);
        
        // Message 1: Faculty
        if (facSec && msgs[0]) {
          const m1 = msgs[0];
          const img = facSec.querySelector('.message-photo img');
          if (img && (m1.photoUrl || m1.photo)) img.src = m1.photoUrl || m1.photo;
          const quote = facSec.querySelector('.message-quote');
          if (quote && m1.quote) quote.textContent = m1.quote;
          const nameRole = facSec.querySelector('.name-role');
          if (nameRole && (m1.name || m1.personName)) {
            nameRole.innerHTML = `<b>${m1.name || m1.personName}</b>${m1.role || ''}`;
          }
          const link = facSec.querySelector('a[aria-label="LinkedIn"]');
          if (link && (m1.linkedinUrl || m1.linkedin)) link.href = m1.linkedinUrl || m1.linkedin;
        }

        // Message 2: Captain
        if (capSec && msgs[1]) {
          const m2 = msgs[1];
          const img = capSec.querySelector('.message-photo img');
          if (img && (m2.photoUrl || m2.photo)) img.src = m2.photoUrl || m2.photo;
          const quote = capSec.querySelector('.message-quote');
          if (quote && m2.quote) quote.textContent = m2.quote;
          const nameRole = capSec.querySelector('.name-role');
          if (nameRole && (m2.name || m2.personName)) {
            nameRole.innerHTML = `<b>${m2.name || m2.personName}</b>${m2.role || ''}`;
          }
          const link = capSec.querySelector('a[aria-label="LinkedIn"]');
          if (link && (m2.linkedinUrl || m2.linkedin)) link.href = m2.linkedinUrl || m2.linkedin;
        }
      }
    }

    // ── 12. WHY JOIN ASHWA RIDERS (SKILLS) ────────────────────────────
    if (data.whyJoin) {
      const wjSec = document.getElementById('section-why-join') || document.querySelector('.chip-grid')?.closest('section');
      const chipGrid = wjSec ? wjSec.querySelector('.chip-grid') : document.querySelector('.chip-grid');
      if (wjSec) {
        const isVisible = data.whyJoin.visible !== false && data.whyJoin.isVisible !== false;
        if (!isVisible) {
          wjSec.style.display = 'none';
        } else {
          wjSec.style.display = '';
          const eb = wjSec.querySelector('.eyebrow');
          if (eb && data.whyJoin.eyebrow) eb.textContent = data.whyJoin.eyebrow;

          const title = wjSec.querySelector('.section-title');
          const titleVal = data.whyJoin.title || data.whyJoin.heading;
          if (title && titleVal) title.innerHTML = titleVal;

          const sub = wjSec.querySelector('.section-subtitle');
          if (sub && data.whyJoin.description) sub.textContent = data.whyJoin.description;

          const skills = Array.isArray(data.whyJoin.skills) ? data.whyJoin.skills : (Array.isArray(data.whyJoin.items) ? data.whyJoin.items : []);
          if (chipGrid && skills.length > 0) {
            const visibleSkills = skills.filter((sk) => sk.visible !== false && sk.isVisible !== false);
            chipGrid.innerHTML = visibleSkills.map((sk) => `<span class="chip">${sk.name}</span>`).join('');
          }
        }
      }
    }

    // ── 13. GET INVOLVED CTA ──────────────────────────────────────────
    if (data.cta) {
      const ctaSec = document.getElementById('section-cta') || document.querySelector('.cta-band');
      if (ctaSec) {
        const isVisible = data.cta.visible !== false && data.cta.isVisible !== false;
        if (!isVisible) {
          ctaSec.style.display = 'none';
        } else {
          ctaSec.style.display = '';
          const eb = ctaSec.querySelector('.eyebrow');
          if (eb && data.cta.eyebrow) eb.textContent = data.cta.eyebrow;

          const h2 = ctaSec.querySelector('h2');
          const titleVal = data.cta.title || data.cta.heading;
          if (h2 && titleVal) h2.innerHTML = titleVal;

          const p = ctaSec.querySelector('p');
          if (p && data.cta.description) p.textContent = data.cta.description;

          const btnP = ctaSec.querySelector('.btn-primary');
          const pText = data.cta.primaryBtnText || data.cta.primaryCta?.text;
          const pUrl = data.cta.primaryBtnUrl || data.cta.primaryCta?.url;
          if (btnP) {
            if (pText) btnP.innerHTML = `<i class="fas fa-user-plus"></i> ${pText}`;
            if (pUrl) btnP.href = pUrl;
          }

          const btnS = ctaSec.querySelector('.btn-secondary');
          const sText = data.cta.secondaryBtnText || data.cta.secondaryCta?.text;
          const sUrl = data.cta.secondaryBtnUrl || data.cta.secondaryCta?.url;
          if (btnS) {
            if (sText) btnS.innerHTML = `<i class="fas fa-handshake"></i> ${sText}`;
            if (sUrl) btnS.href = sUrl;
          }
        }
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateAboutPage);
  } else {
    hydrateAboutPage();
  }
})();
