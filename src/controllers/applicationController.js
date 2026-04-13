const Application = require('../models/Application');
const Project = require('../models/Project');
const User = require('../models/User');
const { uploadToCloudinary } = require('../utils/cloudinaryHelper');
const { invalidateCache } = require('../utils/validation');


// =======================
// APPLY TO PROJECT
// =======================
const applyToProject = async (req, res) => {
  try {
    const file = req.file;
    const cvUpload = await uploadToCloudinary(file);
    const project = req.params.id;
    const { proposal, bid, delivery } = req.body;

    if (!proposal || !bid || !delivery) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    // Check if project exists
    const existingProject = await Project.findById(project);

    if (!existingProject) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    // Prevent duplicate application
    const alreadyApplied = await Application.findOne({
      project,
      applicant: req.user._id,
    });

    if (alreadyApplied) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this project',
      });
    }

    const application = await Application.create({
      project,
      applicant: req.user._id,
      proposal,
      bid,
      delivery,
      cv: cvUpload ? cvUpload.secure_url : null,
    });

    if (!application) {
      return res.status(400).json({
        success: false,
        message: 'Error submitting application',
      });
    }

    const user = await User.findById(req.user._id);

    // Add application to user's applied applications
    user.applications.push(application._id);
    await user.save();

    // Add application to project's applications
    existingProject.applications.push(application._id);
    await existingProject.save();

    await invalidateCache(req.redisClient, `project:${project._id}`);

    await invalidateCache(req.redisClient, 'projects:all');

    await invalidateCache(req.redisClient, `user:${user._id}`);

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: application,
    });
  } catch (error) {
    console.log('Error in applyToProject:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// =======================
// GET ALL APPLICATIONS FOR A PROJECT
// =======================
const getProjectApplications = async (req, res) => {
  try {
    const { projectId } = req.params;

    const applications = await Application.find({ project: projectId })
      .populate('applicant', 'username email skills');

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.log('Error in getProjectApplications:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// =======================
// GET USER APPLICATIONS
// =======================
const getUserApplications = async (req, res) => {
  try {
    const applications = await Application.find({
      applicant: req.user._id,
    }).populate('project', 'title price');

    return res.status(200).json({
      success: true,
      count: applications.length,
      data: applications,
    });
  } catch (error) {
    console.log('Error in getUserApplications:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// =======================
// ACCEPT APPLICATION
// =======================
const acceptApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('project');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Only project owner can accept
    if (
      application.project.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to accept this application',
      });
    }

    application.status = 'accepted';
    await application.save();

    const applicant = await User.findById(application.applicant)

    if (!applicant) {
      return res.status(404).json({
        success: false,
        message: 'Applicant not Found',
      });
    }

    // Add the Project to the users accepted projects.
    applicant.projects.push({
      project: application.project,
      status: 'active'
    })
    await applicant.save()

    await invalidateCache(req.redisClient, `user:${applicant._id}`);


    return res.status(200).json({
      success: true,
      message: 'Application accepted successfully',
    });
  } catch (error) {
    console.log('Error in acceptApplication:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// =======================
// REJECT APPLICATION
// =======================
const rejectApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('project');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Only project owner
    if (
      application.project.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this application',
      });
    }

    application.status = 'rejected';
    await application.save();

    return res.status(200).json({
      success: true,
      message: 'Application rejected',
      data: application,
    });
  } catch (error) {
    console.log('Error in rejectApplication:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// =======================
// DELETE APPLICATION (OPTIONAL)
// =======================
const deleteApplication = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Only applicant can delete
    if (
      application.applicant.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this application',
      });
    }

    await application.deleteOne();

    const applicant = await User.findById(application.applicant)

     await invalidateCache(req.redisClient, `user:${applicant._id}`);

    return res.status(200).json({
      success: true,
      message: 'Application deleted successfully',
    });
  } catch (error) {
    console.log('Error in deleteApplication:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


module.exports = {
  applyToProject,
  getProjectApplications,
  getUserApplications,
  acceptApplication,
  rejectApplication,
  deleteApplication,
};