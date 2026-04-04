const express = require('express');
const router = express.Router();

const {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');

const { protect } = require('../middlewares/authMiddleware');
const { upload } = require('../utils/cloudinaryHelper');

// Protected
router.post('/', protect, upload, createProject);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);

// Public
router.get('/', getProjects);
router.get('/:id', getProject);

module.exports = router;