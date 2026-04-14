const express = require('express');
const router = express.Router();

const {
  registerUser,
  loginUser,
  getUserProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  userLogout,
  getAllUsers,
} = require('../controllers/authController');

const { protect } = require('../middlewares/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);

router.get('/profile', protect, getUserProfile);
router.get('/users', getAllUsers);
router.put('/change-password', protect, changePassword);

router.post('/forgot-password', forgotPassword);
router.put('/reset-password/:token', resetPassword);

router.post('/refresh-token', refreshToken);
router.post('/logout', protect, userLogout)

module.exports = router;