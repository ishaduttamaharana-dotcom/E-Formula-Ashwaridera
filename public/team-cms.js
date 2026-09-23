/* ============================================================
   team-cms.js — Team Page Public Dynamic Hydration Engine
   Ashwa Riders — Formula Student Electric Team
   Hydrates:
     01. HERO (Eyebrow, Heading, Highlight, Description, Background Media)
     02. MEET THE RIDERS (Dynamic Filters + Team Member Cards)
     03. BECOME A RIDER / CTA (Eyebrow, Heading, Description, Button, Styling)
     04. GLOBAL FOOTER (Slogan, Copyright, Social links)
     05. PAGE SETTINGS & SEO
   Supports Preview Mode (?preview=true) + zero hardcoding.
============================================================ */

(function () {
  'use strict';

  const TEAM_API = '/api/v1/team';
  const urlParams = new URLSearchParams(window.location.search);
  const isPreview = urlParams.get('preview') === 'true' || urlParams.get('draft') === 'true';

  const escapeHtml = (str) => {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  /**
   * Fetch published (or draft preview) data from the unified Team API.
   */
  async function fetchTeamData() {
    const base = isPreview ? `${TEAM_API}?preview=true` : TEAM_API;
    const sep = base.includes('?') ? '&' : '?';
    const endpoint = `${base}${sep}_t=${Date.now()}`;
    const res = await fetch(endpoint, {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || json;
  }

  /**
   * Hydrate Team Page DOM from CMS payload.
   */
  function hydrateTeamPage(data) {
    if (!data) return;

    const { settings, hero, membersSection, filters, members, cta, footer } = data;

    // ─── 00. Page Settings & SEO ──────────────────────────────
    if (settings) {
      if (settings.pageTitle) document.title = settings.pageTitle;
      if (settings.seoDescription) {
        let metaDesc = document.querySelector('meta[name="description"]');
        if (!metaDesc) {
          metaDesc = document.createElement('meta');
          metaDesc.name = 'description';
          document.head.appendChild(metaDesc);
        }
        metaDesc.setAttribute('content', settings.seoDescription);
      }
    }

    // ─── 01. Team Hero ────────────────────────────────────────
    const heroSec = document.querySelector('.team-hero');
    if (heroSec && hero) {
      if (hero.visible === false) {
        heroSec.style.display = 'none';
      } else {
        heroSec.style.display = 'flex';

        // Background media
        if (hero.desktopImageUrl) {
          heroSec.style.backgroundImage = `url("${hero.desktopImageUrl}")`;
        }
        if (hero.backgroundPosition) {
          heroSec.style.backgroundPosition = hero.backgroundPosition;
        }

        // Overlay strength
        if (hero.overlayStrength !== undefined) {
          const strength = hero.overlayStrength / 100;
          heroSec.style.setProperty('--hero-overlay', `rgba(0,0,0,${strength})`);
        }

        // Eyebrow badge
        const badge = heroSec.querySelector('.hero-badge');
        if (badge) {
          badge.innerHTML = `<span class="dot"></span> ${escapeHtml(hero.eyebrow || 'Formula Bharat — 2026 Season')}`;
        }

        // Heading Line 1, Highlight, Line 2
        const h1 = heroSec.querySelector('h1');
        if (h1) {
          const l1 = escapeHtml(hero.headingLine1 || 'The');
          const hl = escapeHtml(hero.headingHighlight || 'Driving Force');
          const l2 = escapeHtml(hero.headingLine2 || 'Behind Ashwa Riders');
          h1.innerHTML = `${l1} <span class="text-gradient">${hl}</span><br />${l2}`;
        }

        // Description
        const desc = heroSec.querySelector('p');
        if (desc && hero.description !== undefined) {
          desc.textContent = hero.description;
        }

        // Content text alignment
        if (hero.textAlignment) {
          const heroContent = heroSec.querySelector('.hero-content');
          if (heroContent) heroContent.style.textAlign = hero.textAlignment;
        }
      }
    }

    // ─── 02. Members Section Heading ──────────────────────────
    const membersSec = document.querySelector('.section-padding');
    if (membersSec && membersSection) {
      const eyebrowEl = membersSec.querySelector('.eyebrow');
      if (eyebrowEl && membersSection.eyebrow) {
        eyebrowEl.textContent = membersSection.eyebrow;
      }

      const titleEl = membersSec.querySelector('.section-title');
      if (titleEl && (membersSection.title || membersSection.highlightText)) {
        const titlePart = escapeHtml(membersSection.title || 'Meet the');
        const hlPart = escapeHtml(membersSection.highlightText || 'Riders');
        titleEl.innerHTML = `${titlePart} <span class="text-gradient">${hlPart}</span>`;
      }

      const subEl = membersSec.querySelector('.section-subtitle');
      if (subEl && (membersSection.subtitle || membersSection.description)) {
        subEl.textContent = membersSection.subtitle || membersSection.description;
      }
    }

    // ─── 02. Department Filters ───────────────────────────────
    const filterBar = document.getElementById('filterBar');
    if (filterBar) {
      filterBar.innerHTML = '';

      // All filter (system generated)
      const allBtn = document.createElement('button');
      allBtn.className = 'filter-btn active';
      allBtn.dataset.filter = 'all';
      allBtn.textContent = 'All';
      filterBar.appendChild(allBtn);

      // CMS Filters
      if (Array.isArray(filters)) {
        filters
          .filter(f => f.visible !== false)
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .forEach(f => {
            const btn = document.createElement('button');
            btn.className = 'filter-btn';
            btn.dataset.filter = (f.slug || f.name).toLowerCase().trim();
            btn.textContent = f.name;
            filterBar.appendChild(btn);
          });
      }
    }

    // ─── 02. Team Grid Cards ──────────────────────────────────
    const teamGrid = document.getElementById('teamGrid');
    if (teamGrid && Array.isArray(members)) {
      teamGrid.innerHTML = '';

      if (members.length === 0) {
        teamGrid.innerHTML = `
          <div style="grid-column: 1 / -1; padding: 48px 24px; text-align: center; color: var(--ink-faint, #9696A0); font-family: var(--font-mono, monospace);">
            <p>No team members published yet.</p>
          </div>
        `;
      } else {
        members.forEach((member) => {
          const card = document.createElement('div');
          card.className = 'team-card reveal-scale visible';

          // Department tagging for dynamic filtering
          const depts = [
            member.department,
            member.roleCategory,
            ...(member.categories || []),
          ]
            .filter(Boolean)
            .map(s => s.toLowerCase().trim());

          card.dataset.department = depts.join(' ');
          card.dataset.id = member.id || member._id;

          const imgUrl = member.imageUrl || 'https://res.cloudinary.com/frjck4sc/image/upload/v1784469376/Team_Captain_jokdch.png';
          const name = escapeHtml(member.fullName || member.displayName || 'Team Member');
          const role = escapeHtml(member.position || member.role || 'Member');
          const deptLabel = member.department ? (member.department.charAt(0).toUpperCase() + member.department.slice(1)) : '';
          const roleText = deptLabel ? `${role} • ${deptLabel}` : role;

          const academic = escapeHtml(member.academicInfo || [member.academicYear, member.academicBranch].filter(Boolean).join(' • '));
          const bio = escapeHtml(member.bio || member.description || '');

          // Social icons: Only render if valid URL present (avoid empty links)
          const socialParts = [];
          if (member.linkedin && member.linkedin !== '#' && member.linkedin.startsWith('https://')) {
            socialParts.push(`<a href="${escapeHtml(member.linkedin)}" target="_blank" rel="noopener" title="LinkedIn" aria-label="LinkedIn profile of ${name}"><i class="fab fa-linkedin-in"></i></a>`);
          }
          if (member.github && member.github !== '#' && member.github.startsWith('https://')) {
            socialParts.push(`<a href="${escapeHtml(member.github)}" target="_blank" rel="noopener" title="GitHub" aria-label="GitHub profile of ${name}"><i class="fab fa-github"></i></a>`);
          }
          if (member.instagram && member.instagram !== '#' && member.instagram.startsWith('https://')) {
            socialParts.push(`<a href="${escapeHtml(member.instagram)}" target="_blank" rel="noopener" title="Instagram" aria-label="Instagram profile of ${name}"><i class="fab fa-instagram"></i></a>`);
          }
          if (member.otherSocial && member.otherSocial !== '#' && member.otherSocial.startsWith('https://')) {
            socialParts.push(`<a href="${escapeHtml(member.otherSocial)}" target="_blank" rel="noopener" title="Website" aria-label="Website of ${name}"><i class="fas fa-globe"></i></a>`);
          }

          card.innerHTML = `
            <div class="card-image">
              <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(member.imageAlt || name)}" loading="lazy" style="object-fit:cover;" />
            </div>
            <div class="card-body">
              <h3>${name}</h3>
              <div class="role">${roleText}</div>
              ${academic ? `<div style="font-family:var(--font-mono, monospace); font-size:0.72rem; color:var(--ink-faint, #715A5A); margin-top:4px;">${academic}</div>` : ''}
              ${bio ? `<p class="bio">${bio}</p>` : ''}
              <div class="social-links">
                ${socialParts.join('')}
              </div>
            </div>
          `;

          teamGrid.appendChild(card);
        });
      }

      // Rebind filter buttons
      bindFilterEvents();
    }

    // ─── 03. Recruitment CTA ──────────────────────────────────
    const ctaSec = document.querySelector('.cta-rider');
    if (ctaSec && cta) {
      if (cta.visible === false) {
        ctaSec.style.display = 'none';
      } else {
        ctaSec.style.display = 'block';

        if (cta.backgroundColor) {
          ctaSec.style.backgroundColor = cta.backgroundColor;
        }
        if (cta.bgImageUrl) {
          ctaSec.style.backgroundImage = `url("${cta.bgImageUrl}")`;
          ctaSec.style.backgroundSize = 'cover';
        }

        const h2 = ctaSec.querySelector('h2');
        if (h2 && (cta.heading || cta.highlightedHeading)) {
          const mainH = escapeHtml(cta.heading || 'Become a');
          const hlH = escapeHtml(cta.highlightedHeading || 'Rider');
          h2.innerHTML = `${mainH} <span class="text-gradient">${hlH}</span>`;
        }

        const p = ctaSec.querySelector('p');
        if (p && cta.description !== undefined) {
          p.textContent = cta.description;
        }

        const btn = ctaSec.querySelector('.btn');
        if (btn) {
          if (cta.buttonUrl) btn.setAttribute('href', cta.buttonUrl);
          const iconHtml = cta.buttonIcon ? `<i class="${escapeHtml(cta.buttonIcon)}"></i> ` : '<i class="fas fa-user-plus"></i> ';
          btn.innerHTML = `${iconHtml}${escapeHtml(cta.buttonText || 'Apply Now')}`;
          if (cta.openInNewTab) {
            btn.setAttribute('target', '_blank');
            btn.setAttribute('rel', 'noopener');
          } else {
            btn.removeAttribute('target');
            btn.removeAttribute('rel');
          }
        }
      }
    }

    // ─── 04. Global Footer ────────────────────────────────────
    const footerEl = document.querySelector('.footer');
    if (footerEl && footer) {
      if (footer.slogan) {
        const sloganEl = footerEl.querySelector('.footer-brand p');
        if (sloganEl) sloganEl.textContent = footer.slogan;
      }
      if (footer.copyrightText) {
        const cpEl = footerEl.querySelector('.footer-bottom span:first-child');
        if (cpEl) cpEl.textContent = footer.copyrightText;
      }
      if (footer.builtByText) {
        const bbEl = footerEl.querySelector('.footer-bottom span:last-child');
        if (bbEl) bbEl.textContent = footer.builtByText;
      }
      if (footer.socialLinks) {
        const socialWrap = footerEl.querySelector('.footer-brand .social-links');
        if (socialWrap) {
          const links = footer.socialLinks;
          if (links.instagram) socialWrap.querySelector('.fa-instagram')?.parentElement?.setAttribute('href', links.instagram);
          if (links.linkedin) socialWrap.querySelector('.fa-linkedin-in')?.parentElement?.setAttribute('href', links.linkedin);
          if (links.youtube) socialWrap.querySelector('.fa-youtube')?.parentElement?.setAttribute('href', links.youtube);
          if (links.twitter) socialWrap.querySelector('.fa-x-twitter')?.parentElement?.setAttribute('href', links.twitter);
          if (links.github) socialWrap.querySelector('.fa-github')?.parentElement?.setAttribute('href', links.github);
        }
      }
    }

    // Preview Mode Top Banner
    if (isPreview) {
      let banner = document.getElementById('arPreviewBanner');
      if (!banner) {
        banner = document.createElement('div');
        banner.id = 'arPreviewBanner';
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.zIndex = '99999';
        banner.style.background = '#FF5A00';
        banner.style.color = '#10141C';
        banner.style.fontFamily = 'monospace';
        banner.style.fontWeight = 'bold';
        banner.style.fontSize = '0.8rem';
        banner.style.padding = '8px 16px';
        banner.style.display = 'flex';
        banner.style.justifyContent = 'space-between';
        banner.style.alignItems = 'center';
        banner.innerHTML = `
          <span><i class="fas fa-eye"></i> DRAFT PREVIEW MODE — You are viewing unpublished Team CMS draft changes.</span>
          <a href="/admin/team" style="color:#10141C; text-decoration:underline; font-weight:800;">Return to Control Center</a>
        `;
        document.body.prepend(banner);
        document.body.style.paddingTop = '34px';
      }
    }
  }

  /**
   * Bind interactive department filtering to buttons.
   */
  function bindFilterEvents() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    const teamCards = document.querySelectorAll('#teamGrid .team-card');

    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = (btn.dataset.filter || 'all').toLowerCase().trim();

        teamCards.forEach(card => {
          const deptStr = (card.dataset.department || '').toLowerCase();
          if (filter === 'all' || deptStr.includes(filter)) {
            card.style.display = 'block';
            card.classList.add('visible');
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // ============================================================
  //  INIT
  // ============================================================
  async function initTeamCms() {
    // 1. Immediately hydrate from preloaded SSR data if available
    if (window.__INITIAL_TEAM_DATA__) {
      try {
        hydrateTeamPage(window.__INITIAL_TEAM_DATA__);
      } catch (err) {
        console.warn('Initial SSR hydration note:', err.message);
      }
    }

    // 2. Fetch fresh live data from API to sync any new changes
    try {
      const data = await fetchTeamData();
      if (data) {
        hydrateTeamPage(data);
      }
    } catch (err) {
      console.warn('Team CMS dynamic hydration note:', err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initTeamCms);
  } else {
    initTeamCms();
  }
})();
