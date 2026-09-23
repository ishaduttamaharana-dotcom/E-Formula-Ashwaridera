// ============================================================
//  controllers/adminDashboardController.js
//  Real Admin Dashboard Aggregates & System Overview API.
// ============================================================

const { sendSuccess, sendError } = require('../utils/responseHelper');

const NewsArticle = require('../models/NewsArticle');
const TeamMember = require('../models/TeamMember');
const Achievement = require('../models/Achievement');
const GalleryImage = require('../models/GalleryImage');
const Sponsor = require('../models/Sponsor');
const ContactMessage = require('../models/ContactMessage');
const JoinApplication = require('../models/JoinApplication');
const SponsorRequest = require('../models/SponsorRequest');
const ActivityLog = require('../models/ActivityLog');

/**
 * GET /api/v1/admin/dashboard
 * Returns real database counters, inbox pending item counts, and recent activity logs.
 */
const getAdminDashboardStats = async (req, res) => {
  try {
    const [
      totalNews,
      draftNews,
      totalTeam,
      totalAchievements,
      totalGalleryMedia,
      totalSponsors,
      newMessages,
      pendingJoinApps,
      pendingSponsorReqs,
      recentActivity,
    ] = await Promise.all([
      NewsArticle.countDocuments({ status: 'published' }),
      NewsArticle.countDocuments({ status: 'draft' }),
      TeamMember.countDocuments({ status: 'published' }),
      Achievement.countDocuments({ status: 'published' }),
      GalleryImage.countDocuments({ status: 'published' }),
      Sponsor.countDocuments({ status: 'published' }),
      ContactMessage.countDocuments({ status: { $regex: /^new$/i } }),
      JoinApplication.countDocuments({ status: { $regex: /^pending$/i } }),
      SponsorRequest.countDocuments({ status: { $regex: /^pending$/i } }),
      ActivityLog.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('user', 'fullName email'),
    ]);

    const overview = {
      content: {
        publishedNews: totalNews,
        draftNews,
        publishedTeamMembers: totalTeam,
        publishedAchievements: totalAchievements,
        publishedGalleryMedia: totalGalleryMedia,
        publishedSponsors: totalSponsors,
      },
      inbox: {
        newContactMessages: newMessages,
        pendingJoinApplications: pendingJoinApps,
        pendingSponsorRequests: pendingSponsorReqs,
        totalUnreadItems: newMessages + pendingJoinApps + pendingSponsorReqs,
      },
      recentActivity,
    };

    return sendSuccess(res, 200, 'Admin dashboard metrics retrieved.', overview);
  } catch (error) {
    return sendError(res, 500, 'Error calculating dashboard metrics: ' + error.message);
  }
};

module.exports = { getAdminDashboardStats };
