// ============================================================
//  controllers/teamPageController.js
//  Unified Controller for Team Page Control Center.
//  Controls:
//    01. HERO
//    02. TEAM MEMBERS (Roster + dynamic department filters)
//    03. JOIN TEAM / CTA
//    04. FOOTER (Global footer snapshot)
//    05. PAGE SETTINGS & SEO
//  Draft / Preview / Publish lifecycle + About page sync.
// ============================================================

const TeamPageContent = require('../models/TeamPageContent');
const TeamMember = require('../models/TeamMember');
const AboutContent = require('../models/AboutContent');
const NavFooterSettings = require('../models/NavFooterSettings');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { logActivity } = require('../utils/publishingHelper');

const DEFAULT_FILTERS = [
  { id: 'leadership', name: 'Leadership', slug: 'leadership', description: 'Team captains and technical leads', order: 1, visible: true },
  { id: 'mechanical', name: 'Mechanical', slug: 'mechanical', description: 'Chassis, suspension, aerodynamics and manufacturing', order: 2, visible: true },
  { id: 'electrical', name: 'Electrical', slug: 'electrical', description: 'Tractive system, battery pack, electronics and telemetry', order: 3, visible: true },
  { id: 'management', name: 'Management', slug: 'management', description: 'Operations, logistics, marketing and media', order: 4, visible: true },
];

/**
 * Retrieve or initialize the singleton TeamPageContent document.
 */
const getOrSeedTeamDoc = async () => {
  let doc = await TeamPageContent.findOne();
  if (doc) return doc;

  console.log('⚡ Initializing Team Page Control Center document with complete defaults...');

  const initialDoc = {
    status: 'published',
    version: 1,
    lastPublishedAt: new Date(),
    lastEditedAt: new Date(),
    settings: {
      pageTitle: 'Ashwa Riders — Team',
      seoTitle: 'Team — Formula Bharat Electric Racing | Ashwa Riders',
      seoDescription: 'Meet the engineers, designers, and innovators behind Ashwa Riders Formula Student Electric team.',
      ogImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg',
      canonicalUrl: 'team.html',
      visible: true,
    },
    hero: {
      visible: true,
      eyebrow: 'FORMULA BHARAT — 2026 SEASON',
      headingLine1: 'THE',
      headingHighlight: 'DRIVING FORCE',
      headingLine2: 'BEHIND ASHWA RIDERS',
      description: 'A multidisciplinary team of engineers, designers, and innovators working together to build the future of motorsport.',
      desktopImageUrl: 'https://res.cloudinary.com/frjck4sc/image/upload/v1784487335/55070254200_f49bbe3c74_o_cijzbq.jpg',
      mobileImageUrl: '',
      videoUrl: '',
      posterUrl: '',
      altText: 'Ashwa Riders Team Photograph',
      textAlignment: 'left',
      contentPosition: 'center',
      heroHeight: '46vh',
      overlayStrength: 70,
      backgroundPosition: 'center 30%',
      entranceAnimation: 'slide-up',
      transition: 'fade',
      transitionDuration: 800,
    },
    membersSection: {
      eyebrow: 'FILTER',
      title: 'MEET THE',
      highlightText: 'RIDERS',
      subtitle: 'Click a department to view specific teams.',
      description: 'Click a department to view specific teams.',
    },
    filters: DEFAULT_FILTERS,
    cta: {
      visible: true,
      eyebrow: 'GET INVOLVED',
      heading: 'BECOME A',
      highlightedHeading: 'RIDER',
      description: "We're always looking for passionate engineers, designers, and innovators to join our family.",
      buttonText: 'APPLY NOW',
      buttonUrl: 'index.html#recruitment',
      buttonIcon: 'fas fa-user-plus',
      openInNewTab: false,
      backgroundColor: '#000000',
      bgImageUrl: '',
      videoUrl: '',
      gridEffect: true,
    },
  };

  initialDoc.draftVersion = JSON.parse(JSON.stringify(initialDoc));
  initialDoc.publishedVersion = JSON.parse(JSON.stringify(initialDoc));

  doc = await TeamPageContent.create(initialDoc);
  return doc;
};

/**
 * Format public/preview representation of a Team Member.
 */
const formatMemberItem = (memberDoc, isPreview = false) => {
  const m = memberDoc.toObject ? memberDoc.toObject() : memberDoc;
  const source = isPreview ? (m.draftVersion || m) : (m.publishedVersion || m);

  const fullName = source.fullName || m.fullName || `${source.firstName || ''} ${source.lastName || ''}`.trim() || 'Team Member';
  const role = source.position || m.position || source.role || 'Member';
  const department = (source.department || m.department || 'mechanical').toLowerCase();
  const branch = source.academicBranch || m.academicBranch || '';
  const year = source.academicYear || m.academicYear || '';
  const academicCombined = [year, branch].filter(Boolean).join(' ');

  return {
    id: m._id,
    firstName: source.firstName || m.firstName || '',
    lastName: source.lastName || m.lastName || '',
    fullName,
    displayName: fullName,
    position: role,
    role,
    roleCategory: source.roleCategory || m.roleCategory || '',
    department,
    categories: source.categories || m.categories || [department],
    academicYear: year,
    academicBranch: branch,
    academicInfo: academicCombined,
    description: source.description || m.description || source.bio || '',
    bio: source.description || m.description || source.bio || '',
    email: source.email || m.email || '',
    linkedin: source.linkedin || m.linkedin || '#',
    github: source.github || m.github || '#',
    instagram: source.instagram || m.instagram || '',
    otherSocial: source.otherSocial || m.otherSocial || '',
    imageUrl: source.imageUrl || m.imageUrl || '',
    imageAlt: source.imageAlt || m.imageAlt || fullName,
    order: source.order !== undefined ? source.order : (source.displayOrder !== undefined ? source.displayOrder : 0),
    isFeatured: Boolean(source.isFeatured !== undefined ? source.isFeatured : m.isFeatured),
    isVisible: source.isVisible !== false && m.isVisible !== false,
    status: m.status || 'published',
  };
};

// ============================================================
//  1. PUBLIC & PREVIEW TEAM PAGE ENDPOINT
// ============================================================

/**
 * GET /api/v1/team (and /api/team)
 * Unified endpoint returning { settings, hero, membersSection, filters, members, cta, footer }
 * Supports ?preview=true for previewing draft changes.
 */
const getPublicTeamContent = async (req, res, next) => {
  try {
    const isPreview = req.query.preview === 'true' || req.query.draft === 'true';
    const doc = await getOrSeedTeamDoc();

    // Source for page layout
    const source = isPreview
      ? (doc.draftVersion || doc.toObject())
      : (doc.publishedVersion || doc.toObject());

    // Fetch members
    const conditions = [{ isArchived: { $ne: true } }];
    if (!isPreview) {
      conditions.push({
        $or: [
          { status: 'published' },
          { publishedVersion: { $ne: null } },
        ],
      });
      conditions.push({ isVisible: { $ne: false } });
    }

    if (req.query.department && req.query.department !== 'all') {
      const dept = req.query.department.toLowerCase();
      conditions.push({
        $or: [
          { department: dept },
          { categories: dept },
        ],
      });
    }

    const memberDocs = await TeamMember.find({ $and: conditions }).sort({ order: 1, displayOrder: 1, createdAt: 1 });
    const formattedMembers = memberDocs.map((m) => formatMemberItem(m, isPreview));

    // Fetch global footer settings
    let footerData = {};
    try {
      const navDoc = await NavFooterSettings.findOne();
      if (navDoc && navDoc.footer) {
        footerData = navDoc.footer;
      }
    } catch (e) {
      console.warn('Could not load global footer for Team page:', e.message);
    }

    const payload = {
      isPreview,
      settings: source.settings || doc.settings,
      hero: source.hero || doc.hero,
      membersSection: source.membersSection || doc.membersSection,
      filters: (source.filters && source.filters.length > 0) ? source.filters : doc.filters,
      members: formattedMembers,
      cta: source.cta || doc.cta,
      footer: footerData,
    };

    return sendSuccess(res, 200, 'Team page content retrieved successfully.', payload);
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  2. ADMIN CONTROL CENTER ENDPOINTS
// ============================================================

/**
 * GET /api/v1/admin/team/page
 * Returns full TeamPageContent (draft & published) and all team members.
 */
const getAdminTeamContent = async (req, res, next) => {
  try {
    const doc = await getOrSeedTeamDoc();
    const members = await TeamMember.find({ isArchived: { $ne: true } }).sort({ order: 1, displayOrder: 1, createdAt: 1 });

    let footerSummary = {};
    try {
      const navDoc = await NavFooterSettings.findOne();
      if (navDoc && navDoc.footer) footerSummary = navDoc.footer;
    } catch {}

    return sendSuccess(res, 200, 'Team CMS control center data loaded.', {
      page: doc,
      members,
      footerSummary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/team/page
 * Updates draft content for Hero, Filters, CTA, MembersSection, and Page Settings.
 */
const updateTeamDraft = async (req, res, next) => {
  try {
    const doc = await getOrSeedTeamDoc();
    const { settings, hero, membersSection, filters, cta } = req.body;

    const currentDraft = doc.draftVersion || doc.toObject();

    if (settings) Object.assign(currentDraft.settings, settings);
    if (hero) Object.assign(currentDraft.hero, hero);
    if (membersSection) Object.assign(currentDraft.membersSection, membersSection);
    if (Array.isArray(filters)) currentDraft.filters = filters;
    if (cta) Object.assign(currentDraft.cta, cta);

    doc.draftVersion = currentDraft;
    doc.status = 'draft';
    doc.lastEditedAt = new Date();

    // Also update top-level fields for convenience
    if (settings) doc.settings = currentDraft.settings;
    if (hero) doc.hero = currentDraft.hero;
    if (membersSection) doc.membersSection = currentDraft.membersSection;
    if (filters) doc.filters = currentDraft.filters;
    if (cta) doc.cta = currentDraft.cta;

    doc.markModified('draftVersion');
    doc.markModified('hero');
    doc.markModified('settings');
    doc.markModified('membersSection');
    doc.markModified('filters');
    doc.markModified('cta');

    await doc.save();

    return sendSuccess(res, 200, 'Team page draft saved successfully.', {
      status: doc.status,
      lastEditedAt: doc.lastEditedAt,
      draft: doc.draftVersion,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/team/page/publish
 * Publishes draft content live and publishes any pending draft team members.
 */
const publishTeam = async (req, res, next) => {
  try {
    const doc = await getOrSeedTeamDoc();

    // Snapshot draft to published (clean without nested snapshots)
    const rawDraft = doc.draftVersion ? JSON.parse(JSON.stringify(doc.draftVersion)) : doc.toObject();
    delete rawDraft.publishedVersion;
    delete rawDraft.draftVersion;
    const snapshot = rawDraft;

    doc.publishedVersion = snapshot;
    doc.status = 'published';
    doc.version = (doc.version || 1) + 1;
    doc.lastPublishedAt = new Date();
    doc.lastEditedAt = new Date();

    doc.markModified('publishedVersion');
    doc.markModified('hero');
    doc.markModified('settings');
    doc.markModified('membersSection');
    doc.markModified('filters');
    doc.markModified('cta');

    await doc.save();

    // Publish all active draft members
    const draftMembers = await TeamMember.find({ status: 'draft', isArchived: { $ne: true } });
    for (const m of draftMembers) {
      const memSnapshot = m.draftVersion ? JSON.parse(JSON.stringify(m.draftVersion)) : m.toObject();
      delete memSnapshot.publishedVersion;
      delete memSnapshot.draftVersion;
      m.publishedVersion = memSnapshot;
      m.status = 'published';
      if (memSnapshot.fullName) m.fullName = memSnapshot.fullName;
      if (memSnapshot.position) m.position = memSnapshot.position;
      if (memSnapshot.department) m.department = memSnapshot.department;
      if (memSnapshot.description) m.description = memSnapshot.description;
      if (memSnapshot.imageUrl) m.imageUrl = memSnapshot.imageUrl;
      if (memSnapshot.linkedin) m.linkedin = memSnapshot.linkedin;
      if (memSnapshot.github) m.github = memSnapshot.github;
      if (memSnapshot.instagram) m.instagram = memSnapshot.instagram;
      m.markModified('publishedVersion');
      await m.save();
    }

    if (req.user) {
      await logActivity(req.user._id, 'publish', 'TeamPageContent', doc._id, {
        version: doc.version,
        timestamp: doc.lastPublishedAt,
      });
    }

    return sendSuccess(res, 200, 'Team page published live successfully!', {
      version: doc.version,
      lastPublishedAt: doc.lastPublishedAt,
      status: 'published',
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  3. MEMBER CRUD WITH CROSS-PAGE SYNC
// ============================================================

/**
 * GET /api/v1/admin/team/members
 * Retrieve all team members with optional search, department and status filters.
 */
const listTeamMembersAdmin = async (req, res, next) => {
  try {
    const query = { isArchived: { $ne: true } };

    if (req.query.status && req.query.status !== 'all') {
      query.status = req.query.status;
    }

    if (req.query.department && req.query.department !== 'all') {
      const dept = req.query.department.toLowerCase();
      query.$or = [
        { department: dept },
        { categories: dept },
      ];
    }

    if (req.query.search) {
      const term = new RegExp(req.query.search.trim(), 'i');
      query.$or = [
        { fullName: term },
        { firstName: term },
        { lastName: term },
        { position: term },
        { department: term },
        { academicBranch: term },
      ];
    }

    const members = await TeamMember.find(query).sort({ order: 1, displayOrder: 1, createdAt: 1 });
    return sendSuccess(res, 200, 'Team members retrieved.', members);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/team/members
 * Create a new team member.
 */
const createTeamMemberAdmin = async (req, res, next) => {
  try {
    const data = req.body;

    const firstName = (data.firstName || '').trim();
    const lastName = (data.lastName || '').trim();
    let fullName = (data.fullName || data.displayName || '').trim();

    if (!fullName && (firstName || lastName)) {
      fullName = `${firstName} ${lastName}`.trim();
    }

    if (!fullName) {
      return sendError(res, 400, 'Display Name or First/Last Name is required.');
    }

    const position = (data.position || data.role || '').trim();
    if (!position) {
      return sendError(res, 400, 'Position / Role is required.');
    }

    const department = (data.department || 'mechanical').trim().toLowerCase();

    // Determine highest order
    let maxOrder = 0;
    const lastMember = await TeamMember.findOne().sort({ order: -1 });
    if (lastMember && typeof lastMember.order === 'number') {
      maxOrder = lastMember.order + 1;
    }

    const memberData = {
      firstName,
      lastName,
      fullName,
      position,
      roleCategory: (data.roleCategory || '').trim(),
      department,
      categories: Array.isArray(data.categories) ? data.categories : [department],
      academicYear: (data.academicYear || '').trim(),
      academicBranch: (data.academicBranch || '').trim(),
      description: (data.description || data.bio || '').trim(),
      email: (data.email || '').trim(),
      linkedin: (data.linkedin || '#').trim(),
      github: (data.github || '#').trim(),
      instagram: (data.instagram || '').trim(),
      otherSocial: (data.otherSocial || '').trim(),
      imageUrl: (data.imageUrl || '').trim(),
      imageAlt: (data.imageAlt || fullName).trim(),
      publicId: (data.publicId || '').trim(),
      isFeatured: Boolean(data.isFeatured),
      isVisible: data.isVisible !== false,
      isArchived: false,
      order: data.order !== undefined ? Number(data.order) : maxOrder,
      displayOrder: data.order !== undefined ? Number(data.order) : maxOrder,
      status: data.publishNow ? 'published' : 'draft',
      createdBy: req.user ? req.user._id : null,
      updatedBy: req.user ? req.user._id : null,
    };

    memberData.draftVersion = JSON.parse(JSON.stringify(memberData));
    if (data.publishNow) {
      memberData.publishedVersion = JSON.parse(JSON.stringify(memberData));
    }

    const member = await TeamMember.create(memberData);

    return sendSuccess(res, 201, 'Team member created successfully.', member);
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/v1/admin/team/members/:id
 * Update an existing team member and sync cross-page references (e.g. About page).
 */
const updateTeamMemberAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const member = await TeamMember.findById(id);
    if (!member) {
      return sendError(res, 404, 'Team member not found.');
    }

    const oldFullName = member.fullName;

    if (data.firstName !== undefined) member.firstName = data.firstName.trim();
    if (data.lastName !== undefined) member.lastName = data.lastName.trim();
    if (data.fullName !== undefined) member.fullName = data.fullName.trim();
    else if (data.displayName !== undefined) member.fullName = data.displayName.trim();
    else if (data.firstName !== undefined || data.lastName !== undefined) {
      member.fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    }

    if (data.position !== undefined) member.position = data.position.trim();
    if (data.roleCategory !== undefined) member.roleCategory = data.roleCategory.trim();
    if (data.department !== undefined) member.department = data.department.trim().toLowerCase();
    if (data.categories !== undefined) member.categories = Array.isArray(data.categories) ? data.categories : [member.department];
    if (data.academicYear !== undefined) member.academicYear = data.academicYear.trim();
    if (data.academicBranch !== undefined) member.academicBranch = data.academicBranch.trim();
    if (data.description !== undefined) member.description = data.description.trim();
    if (data.bio !== undefined) member.description = data.bio.trim();
    if (data.email !== undefined) member.email = data.email.trim();
    if (data.linkedin !== undefined) member.linkedin = data.linkedin.trim();
    if (data.github !== undefined) member.github = data.github.trim();
    if (data.instagram !== undefined) member.instagram = data.instagram.trim();
    if (data.otherSocial !== undefined) member.otherSocial = data.otherSocial.trim();
    if (data.imageUrl !== undefined) member.imageUrl = data.imageUrl.trim();
    if (data.imageAlt !== undefined) member.imageAlt = data.imageAlt.trim();
    if (data.publicId !== undefined) member.publicId = data.publicId.trim();
    if (data.isFeatured !== undefined) member.isFeatured = Boolean(data.isFeatured);
    if (data.isVisible !== undefined) member.isVisible = Boolean(data.isVisible);
    if (data.isArchived !== undefined) member.isArchived = Boolean(data.isArchived);
    if (data.order !== undefined) {
      member.order = Number(data.order);
      member.displayOrder = Number(data.order);
    }
    if (data.status !== undefined) member.status = data.status;

    member.updatedBy = req.user ? req.user._id : null;

    // Ensure existing publishedVersion is preserved if member was already published
    if (!member.publishedVersion && (member.status === 'published' || !member.status)) {
      member.publishedVersion = member.toObject();
    }

    // Snapshot draft
    const rawObj = member.toObject();
    member.draftVersion = rawObj;
    member.markModified('draftVersion');

    // If publishing directly
    if (data.publishNow || data.status === 'published') {
      member.status = 'published';
      member.publishedVersion = rawObj;
      member.markModified('publishedVersion');
    } else {
      member.status = 'draft';
    }

    await member.save();

    // ─── CROSS-PAGE SYNC (ABOUT PAGE INTEGRATION) ─────────────
    // If the member's name or role was modified, update any references in AboutContent
    if (oldFullName && oldFullName !== member.fullName) {
      try {
        const aboutDoc = await AboutContent.findOne();
        if (aboutDoc && aboutDoc.teamStructure && Array.isArray(aboutDoc.teamStructure.nodes)) {
          let modified = false;
          aboutDoc.teamStructure.nodes.forEach((node) => {
            if ((node.memberId && node.memberId.toString() === member._id.toString()) || node.memberName === oldFullName) {
              node.memberName = member.fullName;
              if (member.position) node.title = member.position;
              modified = true;
            }
          });

          if (modified) {
            aboutDoc.draftVersion = aboutDoc.toObject();
            await aboutDoc.save();
            console.log(`🔗 Synchronized About page teamStructure node: "${oldFullName}" -> "${member.fullName}"`);
          }
        }
      } catch (aboutSyncErr) {
        console.warn('Notice: Failed to sync team member change to About page:', aboutSyncErr.message);
      }
    }

    return sendSuccess(res, 200, 'Team member updated successfully.', member);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/team/members/:id/duplicate
 * Duplicate an existing member.
 */
const duplicateTeamMemberAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const original = await TeamMember.findById(id);
    if (!original) return sendError(res, 404, 'Member not found.');

    const dupData = original.toObject();
    delete dupData._id;
    delete dupData.createdAt;
    delete dupData.updatedAt;

    dupData.fullName = `${dupData.fullName} (Copy)`;
    dupData.status = 'draft';
    dupData.order = (original.order || 0) + 1;
    dupData.displayOrder = dupData.order;
    dupData.draftVersion = JSON.parse(JSON.stringify(dupData));
    dupData.publishedVersion = null;

    const copy = await TeamMember.create(dupData);
    return sendSuccess(res, 201, 'Team member duplicated successfully.', copy);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/team/members/:id/archive
 * Soft-delete / archive member.
 */
const archiveTeamMemberAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await TeamMember.findByIdAndUpdate(
      id,
      { $set: { isArchived: true, status: 'archived', isVisible: false } },
      { returnDocument: 'after' }
    );
    if (!member) return sendError(res, 404, 'Member not found.');
    return sendSuccess(res, 200, 'Team member archived.', member);
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/v1/admin/team/members/reorder
 * Reorder list of members by array of IDs.
 */
const reorderTeamMembersAdmin = async (req, res, next) => {
  try {
    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      return sendError(res, 400, 'orderedIds array required.');
    }

    const updates = orderedIds.map((id, index) =>
      TeamMember.findByIdAndUpdate(id, { $set: { order: index, displayOrder: index } })
    );
    await Promise.all(updates);

    return sendSuccess(res, 200, 'Members reordered successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicTeamContent,
  getAdminTeamContent,
  updateTeamDraft,
  publishTeam,
  listTeamMembersAdmin,
  createTeamMemberAdmin,
  updateTeamMemberAdmin,
  duplicateTeamMemberAdmin,
  archiveTeamMemberAdmin,
  reorderTeamMembersAdmin,
  formatMemberItem,
};
