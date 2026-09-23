// ============================================================
//  controllers/teamController.js
//  Handlers for Team Members CMS (team_members collection).
// ============================================================

const TeamMember                         = require('../models/TeamMember');
const { deleteFromCloudinary }            = require('../services/cloudinaryService');
const { sendSuccess, sendError }          = require('../utils/responseHelper');

// ============================================================
//  PUBLIC ENDPOINT
// ============================================================

/**
 * GET /api/v1/team
 * Retrieve all active team members sorted by displayOrder.
 */
const getTeamMembers = async (req, res, next) => {
  try {
    const members = await TeamMember.find({ isActive: true }).sort({ displayOrder: 1, createdAt: 1 });
    return sendSuccess(res, 200, 'Team members retrieved successfully.', members);
  } catch (error) {
    next(error);
  }
};

// ============================================================
//  ADMIN ENDPOINTS (Protected with protect & authorize('admin'))
// ============================================================

/**
 * POST /api/v1/team
 * Create a new team member.
 */
const createTeamMember = async (req, res, next) => {
  try {
    const { fullName, position, department, description, email, linkedin, github, imageUrl, publicId, displayOrder } = req.body;

    if (!fullName || !position) {
      return sendError(res, 400, 'Full name and position are required.');
    }

    const member = await TeamMember.create({
      fullName:     fullName.trim(),
      position:     position.trim(),
      department:   department ? department.trim().toLowerCase() : 'mechanical',
      description:  description ? description.trim() : '',
      email:        email ? email.trim() : '',
      linkedin:     linkedin ? linkedin.trim() : '#',
      github:       github ? github.trim() : '#',
      imageUrl:     imageUrl ? imageUrl.trim() : '',
      publicId:     publicId ? publicId.trim() : '',
      displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
    });

    return sendSuccess(res, 201, 'Team member created successfully.', member);
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/v1/team/:id
 * Update an existing team member.
 */
const updateTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, position, department, description, email, linkedin, github, imageUrl, publicId, displayOrder, isActive } = req.body;

    const updates = {};
    if (fullName !== undefined)     updates.fullName     = fullName.trim();
    if (position !== undefined)     updates.position     = position.trim();
    if (department !== undefined)   updates.department   = department.trim().toLowerCase();
    if (description !== undefined)  updates.description  = description.trim();
    if (email !== undefined)        updates.email        = email.trim();
    if (linkedin !== undefined)     updates.linkedin     = linkedin.trim();
    if (github !== undefined)       updates.github       = github.trim();
    if (imageUrl !== undefined)     updates.imageUrl     = imageUrl.trim();
    if (publicId !== undefined)     updates.publicId     = publicId.trim();
    if (displayOrder !== undefined) updates.displayOrder = Number(displayOrder);
    if (isActive !== undefined)     updates.isActive     = Boolean(isActive);

    const member = await TeamMember.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!member) {
      return sendError(res, 404, 'Team member not found.');
    }

    return sendSuccess(res, 200, 'Team member updated successfully.', member);
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/v1/team/:id
 * Delete a team member and clean up Cloudinary photo if publicId exists.
 */
const deleteTeamMember = async (req, res, next) => {
  try {
    const { id } = req.params;

    const member = await TeamMember.findById(id);
    if (!member) {
      return sendError(res, 404, 'Team member not found.');
    }

    if (member.publicId) {
      try {
        await deleteFromCloudinary(member.publicId);
      } catch (cloudErr) {
        console.warn('Failed to delete team member photo from Cloudinary:', cloudErr.message);
      }
    }

    await member.deleteOne();

    return sendSuccess(res, 200, 'Team member deleted successfully.');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
};
