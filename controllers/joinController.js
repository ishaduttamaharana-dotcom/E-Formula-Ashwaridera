// ============================================================
//  controllers/joinController.js
//  Handlers for Join Team Application System (join_team_applications).
// ============================================================

const JoinApplication                  = require('../models/JoinApplication');
const { uploadRawToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { sendSuccess, sendError }          = require('../utils/responseHelper');

/**
 * POST /api/v1/join
 * Submit a Join Team Application (Logged-in user only).
 * Handles optional resume file upload (PDF/DOC/DOCX up to 10MB).
 */
const submitApplication = async (req, res, next) => {
  try {
    const {
      fullName, email, phone, dateOfBirth, gender,
      college, university, branch, currentYear, graduationYear,
      department, technicalSkills, programmingLanguages, softwareTools, certifications,
      linkedin, github, portfolio, motivation, projectExperience, formulaStudentExperience, additionalInformation,
    } = req.body;

    if (!fullName || !fullName.trim()) {
      return sendError(res, 400, 'Full name is required.');
    }
    if (!email || !email.trim()) {
      return sendError(res, 400, 'Email address is required.');
    }
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email.trim())) {
      return sendError(res, 400, 'Please enter a valid email address.');
    }
    if (!phone || !phone.trim()) {
      return sendError(res, 400, 'Phone number is required.');
    }
    if (!college || !college.trim()) {
      return sendError(res, 400, 'College name is required.');
    }
    if (!branch || !branch.trim()) {
      return sendError(res, 400, 'Branch is required.');
    }
    if (!currentYear || !currentYear.trim()) {
      return sendError(res, 400, 'Current academic year is required.');
    }
    if (!department || !department.trim()) {
      return sendError(res, 400, 'Department applying for is required.');
    }

    let resumeUrl = '';
    let resumePublicId = '';

    // Handle optional file upload
    if (req.file) {
      const allowedMimetypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedMimetypes.includes(req.file.mimetype) && !req.file.originalname.match(/\.(pdf|doc|docx)$/i)) {
        return sendError(res, 400, 'Invalid file type. Only PDF, DOC, and DOCX resumes are accepted.');
      }

      const uploadResult = await uploadRawToCloudinary(req.file.buffer, 'ashwa_resumes');
      resumeUrl = uploadResult.url;
      resumePublicId = uploadResult.publicId;
    }

    const application = await JoinApplication.create({
      userId: req.user ? req.user._id : null,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      dateOfBirth: dateOfBirth ? dateOfBirth.trim() : '',
      gender: gender ? gender.trim() : '',
      college: college.trim(),
      university: university ? university.trim() : '',
      branch: branch.trim(),
      currentYear: currentYear.trim(),
      graduationYear: graduationYear ? graduationYear.trim() : '',
      department: department.trim(),
      technicalSkills: technicalSkills ? technicalSkills.trim() : '',
      programmingLanguages: programmingLanguages ? programmingLanguages.trim() : '',
      softwareTools: softwareTools ? softwareTools.trim() : '',
      certifications: certifications ? certifications.trim() : '',
      linkedin: linkedin ? linkedin.trim() : '',
      github: github ? github.trim() : '',
      portfolio: portfolio ? portfolio.trim() : '',
      resumeUrl,
      resumePublicId,
      motivation: motivation ? motivation.trim() : '',
      projectExperience: projectExperience ? projectExperience.trim() : '',
      formulaStudentExperience: formulaStudentExperience ? formulaStudentExperience.trim() : '',
      additionalInformation: additionalInformation ? additionalInformation.trim() : '',
      status: 'Pending',
    });

    return sendSuccess(res, 201, 'Application submitted successfully!', application);
  } catch (error) {
    console.error('submitApplication Error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/join/my-applications
 * Retrieve applications submitted by the logged-in user.
 */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await JoinApplication.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Your applications retrieved successfully.', applications);
  } catch (error) {
    console.error('getMyApplications Error:', error);
    next(error);
  }
};

/**
 * GET /api/v1/admin/join
 * Retrieve all applications (Admin only) with search & filter.
 */
const getAllApplications = async (req, res, next) => {
  try {
    const { search, department, status } = req.query;
    const filter = {};

    if (department) filter.department = new RegExp(department, 'i');
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { fullName: new RegExp(search, 'i') },
        { college: new RegExp(search, 'i') },
        { department: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const applications = await JoinApplication.find(filter).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'All applications retrieved successfully.', applications);
  } catch (error) {
    console.error('getAllApplications Error:', error);
    next(error);
  }
};

/**
 * PUT /api/v1/admin/join/:id/status
 * Update application status (Admin only).
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Under Review', 'Accepted', 'Rejected'].includes(status)) {
      return sendError(res, 400, 'Invalid status value. Must be Pending, Under Review, Accepted, or Rejected.');
    }

    const application = await JoinApplication.findByIdAndUpdate(
      id,
      { $set: { status } },
      { returnDocument: 'after', runValidators: true }
    );

    if (!application) return sendError(res, 404, 'Application not found.');

    return sendSuccess(res, 200, `Application status updated to ${status}.`, application);
  } catch (error) {
    console.error('updateApplicationStatus Error:', error);
    next(error);
  }
};

/**
 * DELETE /api/v1/admin/join/:id
 * Delete application document and clean up Cloudinary resume asset (Admin only).
 */
const deleteApplication = async (req, res, next) => {
  try {
    const { id } = req.params;

    const application = await JoinApplication.findById(id);
    if (!application) return sendError(res, 404, 'Application not found.');

    if (application.resumePublicId) {
      try {
        await deleteFromCloudinary(application.resumePublicId, 'raw');
      } catch (cErr) {
        console.warn('Failed to delete resume from Cloudinary:', cErr.message);
      }
    }

    await application.deleteOne();

    return sendSuccess(res, 200, 'Application deleted successfully.');
  } catch (error) {
    console.error('deleteApplication Error:', error);
    next(error);
  }
};

module.exports = {
  submitApplication,
  getMyApplications,
  getAllApplications,
  updateApplicationStatus,
  deleteApplication,
};
