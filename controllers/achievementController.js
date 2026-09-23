// ============================================================
//  controllers/achievementController.js
//  Handlers for Achievements CMS (achievements collection).
// ============================================================

const Achievement                        = require('../models/Achievement');
const { deleteFromCloudinary }            = require('../services/cloudinaryService');
const { sendSuccess, sendError }          = require('../utils/responseHelper');

// ============================================================
//  PUBLIC ENDPOINT
// ============================================================

/**
 * GET /api/v1/achievements
 * Retrieve all active achievements sorted by displayOrder.
 */
const getAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    return sendSuccess(res, 200, 'Achievements retrieved successfully.', achievements);
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  ADMIN ENDPOINTS (Protected with protect & authorize('admin'))
// ============================================================

/**
 * POST /api/v1/achievements
 * Create a new achievement.
 */
const createAchievement = async (req, res, next) => {
  try {
    const { title, competitionName, position, category, date, description, buttonText, buttonLink, imageUrl, publicId, displayOrder } = req.body;

    if (!title || !competitionName || !position) {
      return sendError(res, 400, 'Title, competition name, and position are required.');
    }

    const achievement = await Achievement.create({
      title:           title.trim(),
      competitionName: competitionName.trim(),
      position:        position.trim(),
      category:        category ? category.trim().toLowerCase() : 'competition',
      date:            date ? date.trim() : '2026',
      description:     description ? description.trim() : '',
      buttonText:      buttonText ? buttonText.trim() : '',
      buttonLink:      buttonLink ? buttonLink.trim() : '',
      imageUrl:        imageUrl ? imageUrl.trim() : '',
      publicId:        publicId ? publicId.trim() : '',
      displayOrder:    displayOrder !== undefined ? Number(displayOrder) : 0,
    });

    return sendSuccess(res, 201, 'Achievement created successfully.', achievement);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/achievements/:id
 * Update an existing achievement.
 */
const updateAchievement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, competitionName, position, category, date, description, buttonText, buttonLink, imageUrl, publicId, displayOrder, isActive } = req.body;

    const updates = {};
    if (title !== undefined)           updates.title           = title.trim();
    if (competitionName !== undefined) updates.competitionName = competitionName.trim();
    if (position !== undefined)        updates.position        = position.trim();
    if (category !== undefined)        updates.category        = category.trim().toLowerCase();
    if (date !== undefined)            updates.date            = date.trim();
    if (description !== undefined)     updates.description     = description.trim();
    if (buttonText !== undefined)      updates.buttonText      = buttonText.trim();
    if (buttonLink !== undefined)      updates.buttonLink      = buttonLink.trim();
    if (imageUrl !== undefined)        updates.imageUrl        = imageUrl.trim();
    if (publicId !== undefined)        updates.publicId        = publicId.trim();
    if (displayOrder !== undefined)    updates.displayOrder    = Number(displayOrder);
    if (isActive !== undefined)        updates.isActive        = Boolean(isActive);

    const achievement = await Achievement.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!achievement) return sendError(res, 404, 'Achievement not found.');

    return sendSuccess(res, 200, 'Achievement updated successfully.', achievement);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/achievements/:id
 * Delete an achievement and clean up Cloudinary photo if publicId exists.
 */
const deleteAchievement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const achievement = await Achievement.findById(id);
    if (!achievement) return sendError(res, 404, 'Achievement not found.');

    if (achievement.publicId) {
      try {
        await deleteFromCloudinary(achievement.publicId);
      } catch (cloudErr) {
        console.warn('Failed to delete achievement photo from Cloudinary:', cloudErr.message);
      }
    }

    await achievement.deleteOne();

    return sendSuccess(res, 200, 'Achievement deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
};
