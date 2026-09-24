// ============================================================
//  routes/v1/adminRoutes.js
//  Protected Admin API routes.
//  Endpoints: /api/v1/admin/*
//  Only users with role = "admin" can access these endpoints.
// ============================================================

const express = require('express');
const { protect, authorize } = require('../../middleware/authMiddleware');
const { sendSuccess } = require('../../utils/responseHelper');
const { uploadToMemory } = require('../../config/multer');
const { uploadImage } = require('../../controllers/cmsController');

// Controllers
const { getAdminDashboardStats } = require('../../controllers/adminDashboardController');
const {
  getAdminResourceList,
  getAdminResourceById,
  createResourceDraft,
  updateResourceDraft,
  publishResource,
  archiveResource,
  restoreResourceDraft,
  duplicateResourceDraft,
  reorderResources,
  deleteResource,
} = require('../../controllers/adminCmsController');

const {
  getAdminNavFooter,
  updateNavFooterDraft,
  publishNavFooter,
  getAdminSeo,
  updateSeoDraft,
  publishSeo,
} = require('../../controllers/adminSettingsController');

const {
  getAdminCarContent,
  updateCarDraft: updateCarPageDraft,
  publishCar: publishCarPage,
} = require('../../controllers/carPageController');

const {
  getAdminAboutContent,
  updateAboutDraft,
  publishAbout,
} = require('../../controllers/aboutPageController');

const {
  getAdminHomeContent,
  updateHomeDraft,
  publishHome,
  getHomePreview,
} = require('../../controllers/homePageController');

const {
  getAdminTeamContent,
  updateTeamDraft,
  publishTeam,
  listTeamMembersAdmin,
  createTeamMemberAdmin,
  updateTeamMemberAdmin,
  duplicateTeamMemberAdmin,
  archiveTeamMemberAdmin,
  reorderTeamMembersAdmin,
} = require('../../controllers/teamPageController');

const {
  getAdminGalleryContent,
  updateGalleryDraft,
  publishGallery,
  listGalleryMediaAdmin,
  createGalleryMediaAdmin,
  updateGalleryMediaAdmin,
  deleteGalleryMediaAdmin,
  reorderGalleryMediaAdmin,
  listGalleryAlbumsAdmin,
  createGalleryAlbumAdmin,
  updateGalleryAlbumAdmin,
  deleteGalleryAlbumAdmin,
  reorderGalleryAlbumsAdmin,
} = require('../../controllers/galleryPageController');

const {
  getAdminSponsorContent,
  updateSponsorDraft,
  publishSponsor,
} = require('../../controllers/sponsorPageController');

const {
  getAdminAchievementsContent,
  updateAchievementsDraft,
  publishAchievements,
} = require('../../controllers/achievementsPageController');

const {
  getAdminContactContent,
  updateContactDraft,
  publishContact,
} = require('../../controllers/contactPageController');

const {
  getContactMessages,
  updateMessageStatus,
  deleteContactMessage,
  getJoinApplications,
  updateJoinApplicationStatus,
  getSponsorRequests,
  updateSponsorRequestStatus,
  getInboxCounts,
} = require('../../controllers/adminInboxController');

const { getActivityLogs } = require('../../controllers/adminActivityController');
const { getRevisions, getRevisionById, restoreRevisionToDraft } = require('../../controllers/adminRevisionController');

// Models
const HeroSlide = require('../../models/HeroSlide');
const BuildStage = require('../../models/BuildStage');
const NewsArticle = require('../../models/NewsArticle');
const HomeStat = require('../../models/HomeStat');
const TeamMember = require('../../models/TeamMember');
const Achievement = require('../../models/Achievement');
const GalleryAlbum = require('../../models/GalleryAlbum');
const GalleryImage = require('../../models/GalleryImage');
const Sponsor = require('../../models/Sponsor');
const SponsorPackage = require('../../models/SponsorPackage');

const router = express.Router();

// Protect all admin endpoints
router.use(protect, authorize('admin'));

/**
 * @route   GET /api/v1/admin/status
 * @desc    Verify admin authorization and status
 */
router.get('/status', (req, res) => {
  return sendSuccess(res, 200, 'Admin authorization verified.', {
    admin: {
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
    },
  });
});

/**
 * @route   GET /api/v1/admin/dashboard
 * @desc    Real Admin Dashboard summary metrics and recent activity
 */
router.get('/dashboard', getAdminDashboardStats);

// ─── AUDIT & REVISIONS ─────────────────────────────────────
router.get('/activity', getActivityLogs);
router.get('/revisions', getRevisions);
router.get('/revisions/:id', getRevisionById);
router.post('/revisions/:id/restore', restoreRevisionToDraft);

/**
 * Helper to mount standard CRUD + Lifecycle routes for a repeatable model
 */
const mountCmsResourceRoutes = (path, Model, name) => {
  router.get(`/${path}`, getAdminResourceList(Model, name));
  router.post(`/${path}`, createResourceDraft(Model, name));
  router.post(`/${path}/reorder`, reorderResources(Model, name));
  router.get(`/${path}/:id`, getAdminResourceById(Model, name));
  router.patch(`/${path}/:id`, updateResourceDraft(Model, name));
  router.put(`/${path}/:id`, updateResourceDraft(Model, name));
  router.delete(`/${path}/:id`, deleteResource(Model, name));
  router.post(`/${path}/:id/publish`, publishResource(Model, name));
  router.post(`/${path}/:id/archive`, archiveResource(Model, name));
  router.post(`/${path}/:id/restore`, restoreResourceDraft(Model, name));
  router.post(`/${path}/:id/duplicate`, duplicateResourceDraft(Model, name));
};

// ─── UNIFIED TEAM PAGE CONTROL CENTER ───────────────────────
router.get('/team/page', getAdminTeamContent);
router.patch('/team/page', updateTeamDraft);
router.put('/team/page', updateTeamDraft);
router.post('/team/page/publish', publishTeam);

router.get('/team/members', listTeamMembersAdmin);
router.post('/team/members', createTeamMemberAdmin);
router.patch('/team/members/:id', updateTeamMemberAdmin);
router.put('/team/members/:id', updateTeamMemberAdmin);
router.post('/team/members/:id/duplicate', duplicateTeamMemberAdmin);
router.post('/team/members/:id/archive', archiveTeamMemberAdmin);
router.post('/team/members/reorder', reorderTeamMembersAdmin);

// ─── UNIFIED GALLERY PAGE CONTROL CENTER ────────────────────
router.get('/gallery/page', getAdminGalleryContent);
router.patch('/gallery/page', updateGalleryDraft);
router.put('/gallery/page', updateGalleryDraft);
router.post('/gallery/page/publish', publishGallery);

router.get('/gallery/media-items', listGalleryMediaAdmin);
router.post('/gallery/media-items', createGalleryMediaAdmin);
router.patch('/gallery/media-items/:id', updateGalleryMediaAdmin);
router.put('/gallery/media-items/:id', updateGalleryMediaAdmin);
router.delete('/gallery/media-items/:id', deleteGalleryMediaAdmin);
router.post('/gallery/media-items/reorder', reorderGalleryMediaAdmin);

router.get('/gallery/album-items', listGalleryAlbumsAdmin);
router.post('/gallery/album-items', createGalleryAlbumAdmin);
router.patch('/gallery/album-items/:id', updateGalleryAlbumAdmin);
router.put('/gallery/album-items/:id', updateGalleryAlbumAdmin);
router.delete('/gallery/album-items/:id', deleteGalleryAlbumAdmin);
router.post('/gallery/album-items/reorder', reorderGalleryAlbumsAdmin);

// ─── UNIFIED SPONSOR PAGE CONTROL CENTER ────────────────────
router.get('/sponsors/page', getAdminSponsorContent);
router.patch('/sponsors/page', updateSponsorDraft);
router.put('/sponsors/page', updateSponsorDraft);
router.post('/sponsors/page/publish', publishSponsor);

// ─── UNIFIED ACHIEVEMENTS PAGE CONTROL CENTER ───────────────
router.get('/achievements/page', getAdminAchievementsContent);
router.patch('/achievements/page', updateAchievementsDraft);
router.put('/achievements/page', updateAchievementsDraft);
router.post('/achievements/page/publish', publishAchievements);

// ─── REPEATABLE CMS RESOURCES ───────────────────────────────
mountCmsResourceRoutes('hero', HeroSlide, 'HeroSlide');
mountCmsResourceRoutes('build-stages', BuildStage, 'BuildStage');
mountCmsResourceRoutes('news', NewsArticle, 'NewsArticle');
mountCmsResourceRoutes('stats', HomeStat, 'HomeStat');
mountCmsResourceRoutes('team', TeamMember, 'TeamMember');
mountCmsResourceRoutes('achievements', Achievement, 'Achievement');
mountCmsResourceRoutes('gallery/albums', GalleryAlbum, 'GalleryAlbum');
mountCmsResourceRoutes('gallery/images', GalleryImage, 'GalleryImage');
mountCmsResourceRoutes('sponsors', Sponsor, 'Sponsor');
mountCmsResourceRoutes('sponsor-packages', SponsorPackage, 'SponsorPackage');

// ─── UNIFIED HOME PAGE CONTROL CENTER ───────────────────────
router.get('/home', getAdminHomeContent);
router.patch('/home', updateHomeDraft);
router.put('/home', updateHomeDraft);
router.post('/home/publish', publishHome);
router.get('/home/preview', getHomePreview);

// ─── SINGLETON PAGE SETTINGS ────────────────────────────────
router.get('/about', getAdminAboutContent);
router.patch('/about', updateAboutDraft);
router.post('/about/publish', publishAbout);

// ─── UNIFIED CAR PAGE CONTROL CENTER ────────────────────────
router.get('/car/page', getAdminCarContent);
router.patch('/car/page', updateCarPageDraft);
router.put('/car/page', updateCarPageDraft);
router.post('/car/page/publish', publishCarPage);

router.get('/car', getAdminCarContent);
router.patch('/car', updateCarPageDraft);
router.put('/car', updateCarPageDraft);
router.post('/car/publish', publishCarPage);

// ─── UNIFIED CONTACT PAGE CONTROL CENTER ────────────────────
router.get('/contact/page', getAdminContactContent);
router.patch('/contact/page', updateContactDraft);
router.put('/contact/page', updateContactDraft);
router.post('/contact/page/publish', publishContact);

// Backwards compatibility alias for /contact-page
router.get('/contact-page', getAdminContactContent);
router.patch('/contact-page', updateContactDraft);
router.put('/contact-page', updateContactDraft);
router.post('/contact-page/publish', publishContact);

router.get('/navigation', getAdminNavFooter);
router.patch('/navigation', updateNavFooterDraft);
router.post('/navigation/publish', publishNavFooter);

router.get('/seo', getAdminSeo);
router.patch('/seo', updateSeoDraft);
router.post('/seo/publish', publishSeo);

// ─── MEDIA LIBRARY ENDPOINTS ────────────────────────────────
const {
  getMediaAssets,
  uploadMediaAsset,
  getMediaAssetById,
  updateMediaAsset,
  deleteMediaAsset,
  getUploadSignature,
  createMediaAssetFromDirectUpload,
  verifyMediaEndpoint,
  auditMediaHealth,
} = require('../../controllers/adminMediaController');

router.get('/media', getMediaAssets);
router.get('/media/signature', getUploadSignature);
router.get('/media/audit', auditMediaHealth);
router.post('/media/verify', verifyMediaEndpoint);
router.post('/media/direct-record', createMediaAssetFromDirectUpload);
router.post('/media/upload', uploadToMemory('file'), uploadMediaAsset);
router.get('/media/:id', getMediaAssetById);
router.patch('/media/:id', updateMediaAsset);
router.delete('/media/:id', deleteMediaAsset);

// Legacy upload helper
router.post('/upload', uploadToMemory('image'), uploadImage);

// ─── ADMIN INBOXES ──────────────────────────────────────────
router.get('/messages', getContactMessages);
router.patch('/messages/:id', updateMessageStatus);
router.delete('/messages/:id', deleteContactMessage);

router.get('/join', getJoinApplications);
router.put('/join/:id/status', updateJoinApplicationStatus);
router.patch('/join/:id/status', updateJoinApplicationStatus);

router.get('/sponsor-requests', getSponsorRequests);
router.put('/sponsor-requests/:id/status', updateSponsorRequestStatus);
router.patch('/sponsor-requests/:id/status', updateSponsorRequestStatus);

router.get('/inbox-counts', getInboxCounts);

module.exports = router;
