// ============================================================
//  controllers/globalSearchController.js
//  Performs global search across Admin Pages & CMS Database Models
// ============================================================

const ContentItem = require('../models/ContentItem');
const TeamMember = require('../models/TeamMember');
const Achievement = require('../models/Achievement');
const GalleryAlbum = require('../models/GalleryAlbum');
const JoinApplication = require('../models/JoinApplication');
const SponsorRequest = require('../models/SponsorRequest');
const HeroSlide = require('../models/HeroSlide');
const CarSpec = require('../models/CarSpec');

// Static Admin Navigation Modules
const ADMIN_PAGES = [
  { title: 'Dashboard Overview', subtitle: 'CMS Metrics & Recent Activity', contentTypeName: 'CMS Module', url: '/admin' },
  { title: 'Car & Technical Specifications', subtitle: 'Vehicle Parameters & Aerodynamics', contentTypeName: 'CMS Module', url: '/admin/car' },
  { title: 'Team & Departments Management', subtitle: 'Roster & Team Member Profiles', contentTypeName: 'CMS Module', url: '/admin/team' },
  { title: 'Achievements & Awards', subtitle: 'Trophies, Competition Ranks & Seasons', contentTypeName: 'CMS Module', url: '/admin/achievements' },
  { title: 'Media Gallery & Albums', subtitle: 'Photo Albums & Cloudinary Assets', contentTypeName: 'CMS Module', url: '/admin/gallery' },
  { title: 'Hero Slides & Video Header', subtitle: 'Homepage Header Media & Headlines', contentTypeName: 'CMS Module', url: '/admin/hero' },
  { title: 'Join Team Recruitment Applications', subtitle: 'Student Applications & Resumes', contentTypeName: 'CMS Module', url: '/admin/join' },
  { title: 'Corporate Sponsorship Requests', subtitle: 'Sponsor Enquiries & Proposals', contentTypeName: 'CMS Module', url: '/admin/sponsor-requests' },
  { title: 'Contact Page & Workshop Info', subtitle: 'Public Address & Phone Numbers', contentTypeName: 'CMS Module', url: '/admin/contact' },
  { title: 'Contact Messages & Enquiries', subtitle: 'Public Contact Inbox', contentTypeName: 'CMS Module', url: '/admin/messages' },
  { title: 'Shared Navigation & Footer', subtitle: 'Global Navbar CTA & Footer Copy', contentTypeName: 'CMS Module', url: '/admin/navigation' },
  { title: 'SEO & Meta Settings', subtitle: 'Google Snippet Preview & OpenGraph', contentTypeName: 'CMS Module', url: '/admin/seo' },
  { title: 'Activity & Audit Trail', subtitle: 'Admin Change Logs & Revision History', contentTypeName: 'CMS Module', url: '/admin/activity' },
  { title: 'Account & Security Settings', subtitle: 'Admin Password & Profile Info', contentTypeName: 'CMS Module', url: '/admin/account' },
];

exports.globalSearch = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const queryStr = q.trim();
    const regex = new RegExp(queryStr, 'i');
    const results = [];

    // 1. Search Admin Navigation Modules
    const matchingPages = ADMIN_PAGES.filter(p => 
      p.title.toLowerCase().includes(queryStr.toLowerCase()) || 
      p.subtitle.toLowerCase().includes(queryStr.toLowerCase()) ||
      p.url.toLowerCase().includes(queryStr.toLowerCase())
    );
    matchingPages.forEach(p => results.push({ ...p, status: 'Active' }));

    // 2. Query Database Collections in Parallel
    const [
      teamRes,
      achieveRes,
      galleryRes,
      joinRes,
      sponsorReqRes,
      heroRes,
      itemsRes,
      carRes
    ] = await Promise.allSettled([
      TeamMember ? TeamMember.find({ $or: [{ name: regex }, { role: regex }, { department: regex }, { season: regex }] }).limit(10) : Promise.resolve([]),
      Achievement ? Achievement.find({ $or: [{ title: regex }, { competition: regex }, { awardTitle: regex }] }).limit(10) : Promise.resolve([]),
      GalleryAlbum ? GalleryAlbum.find({ $or: [{ title: regex }, { description: regex }, { category: regex }] }).limit(10) : Promise.resolve([]),
      JoinApplication ? JoinApplication.find({ $or: [{ fullName: regex }, { email: regex }, { college: regex }, { branch: regex }, { department: regex }] }).limit(10) : Promise.resolve([]),
      SponsorRequest ? SponsorRequest.find({ $or: [{ companyName: regex }, { contactPerson: regex }, { email: regex }, { sponsorshipType: regex }] }).limit(10) : Promise.resolve([]),
      HeroSlide ? HeroSlide.find({ $or: [{ headline: regex }, { subtitle: regex }, { badgeText: regex }] }).limit(10) : Promise.resolve([]),
      ContentItem ? ContentItem.find({ $or: [{ title: regex }, { contentType: regex }, { 'fields.headline': regex }] }).limit(10) : Promise.resolve([]),
      CarSpec ? CarSpec.find({ $or: [{ title: regex }, { category: regex }, { name: regex }, { specValue: regex }] }).limit(10) : Promise.resolve([])
    ]);

    // Process Team Members
    if (teamRes.status === 'fulfilled' && teamRes.value && teamRes.value.length) {
      teamRes.value.forEach(tm => {
        results.push({
          id: tm._id,
          title: tm.name,
          subtitle: `${tm.role || 'Member'} (${tm.department || 'General'})`,
          contentTypeName: 'Team Member',
          status: tm.status || 'Active',
          updatedAt: tm.updatedAt,
          url: '/admin/team'
        });
      });
    }

    // Process Achievements
    if (achieveRes.status === 'fulfilled' && achieveRes.value && achieveRes.value.length) {
      achieveRes.value.forEach(a => {
        results.push({
          id: a._id,
          title: a.title || a.awardTitle,
          subtitle: `${a.competition || 'Competition'} · Rank: ${a.rank || 'Finalist'}`,
          contentTypeName: 'Achievement',
          status: 'Published',
          updatedAt: a.updatedAt,
          url: '/admin/achievements'
        });
      });
    }

    // Process Gallery Albums
    if (galleryRes.status === 'fulfilled' && galleryRes.value && galleryRes.value.length) {
      galleryRes.value.forEach(g => {
        results.push({
          id: g._id,
          title: g.title,
          subtitle: `${g.category || 'Media'} · ${g.season || 'Season'}`,
          contentTypeName: 'Gallery Album',
          status: g.status || 'Published',
          updatedAt: g.updatedAt,
          url: '/admin/gallery'
        });
      });
    }

    // Process Recruitment Applications
    if (joinRes.status === 'fulfilled' && joinRes.value && joinRes.value.length) {
      joinRes.value.forEach(j => {
        results.push({
          id: j._id,
          title: j.fullName,
          subtitle: `${j.college || 'SVPCET'} (${j.department || 'General'})`,
          contentTypeName: 'Applicant',
          status: j.status || 'Pending',
          updatedAt: j.createdAt,
          url: '/admin/join'
        });
      });
    }

    // Process Sponsor Requests
    if (sponsorReqRes.status === 'fulfilled' && sponsorReqRes.value && sponsorReqRes.value.length) {
      sponsorReqRes.value.forEach(sr => {
        results.push({
          id: sr._id,
          title: sr.companyName,
          subtitle: `Tier: ${sr.sponsorshipType || 'Sponsor'} · ${sr.contactPerson || 'Rep'}`,
          contentTypeName: 'Sponsor Request',
          status: sr.status || 'Pending',
          updatedAt: sr.createdAt,
          url: '/admin/sponsor-requests'
        });
      });
    }

    // Process Content Items
    if (itemsRes.status === 'fulfilled' && itemsRes.value && itemsRes.value.length) {
      itemsRes.value.forEach(ci => {
        results.push({
          id: ci._id,
          title: ci.title,
          subtitle: `Type: ${ci.contentType}`,
          contentTypeName: 'Content Item',
          status: ci.status || 'published',
          updatedAt: ci.updatedAt,
          url: `/admin/content/${ci.contentType}`
        });
      });
    }

    res.json({ success: true, count: results.length, data: results });
  } catch (err) {
    next(err);
  }
};
