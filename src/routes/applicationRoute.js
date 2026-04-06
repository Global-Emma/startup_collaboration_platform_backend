const express = require('express');
const router = express.Router();

const {
  applyToProject,
  getProjectApplications,
  getUserApplications,
  acceptApplication,
  rejectApplication,
  deleteApplication,
} = require('../controllers/applicationController');
const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../utils/cloudinaryHelper');



// Apply
router.post('/:id', protect, upload, applyToProject);

// Get
router.get('/me', protect, getUserApplications);
router.get('/project/:projectId', protect, getProjectApplications);

// Actions
router.put('/:id/accept', protect, acceptApplication);
router.put('/:id/reject', protect, rejectApplication);

// Delete
router.delete('/:id', protect, deleteApplication);

module.exports = router;