const User = require('../models/User');
const { generateAccessToken, generateRefreshToken } = require('../utils/tokenGenerator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { invalidateCache } = require('../utils/validation');

// REGISTER USER
const registerUser = async (req, res) => {
  try {
    const {
      username,
      firstname,
      lastname,
      email,
      phone,
      password,
      role,
      skills,
    } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide required fields',
      });
    }

    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists',
      });
    }

    const newUser = await User.create({
      username,
      firstname,
      lastname,
      email,
      phone,
      password,
      role,
      skills,
    });

    if (!newUser) {
      return res.status(400).json({
        success: false,
        message: 'Error creating user',
      });
    }

    const token = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser, res);

    newUser.refreshToken = refreshToken;
    await newUser.save();

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Error generating token',
      });
    }

    await invalidateCache(req.redisClient, `user:${newUser._id}`);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      accessToken: token,
    });
  } catch (error) {
    console.log('Error in registerUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    const token = generateAccessToken(user);

    const refreshToken = generateRefreshToken(user, res);

    user.refreshToken = refreshToken;
    await user.save();

    await invalidateCache(req.redisClient, `user:${user._id}`);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken: token,
    });
  } catch (error) {
    console.log('Error in loginUser:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

// =======================
// GET USER PROFILE
// =======================
const getUserProfile = async (req, res) => {
  try {
    const cachedKey = `user:${req.user._id}`;
    const cachedUser = req.redisClient ? await req.redisClient.get(cachedKey) : null;

    if (cachedUser) {
      console.log('User found in cache');
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedUser),
      });
    }

    const user = await User.findById(req.user._id).select('-password -refreshToken').populate({
      path: 'projects.project',
      populate: {
        path: 'user',
        select: '-password -refreshToken'
      }
    }).populate({
      path: 'projects.project',
      populate: {
        path: 'service',
        select: 'name'
      }
    }).populate({
      path: 'applications',
      populate: {
        path: 'project',
        populate: {
          path: 'user',
          select: '-password -refreshToken'
        }
      }
    }).populate({
      path: 'savedProjects',
      populate: {
        path: 'user',
        select: '-password -refreshToken'
      }
    }).populate({
      path: 'savedProjects',
      populate: {
        path: 'service',
        select: 'name'
      }
    }).exec();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (req.redisClient) {
      await req.redisClient.set(cachedKey, JSON.stringify(user), 'EX', 3600);
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log('Error in getUserProfile:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const cachedKey = `user:all`;
    const cachedUsers = req.redisClient ? await req.redisClient.get(cachedKey) : null;

    if (cachedUsers) {
      console.log('Users found in cache');
      return res.status(200).json({
        success: true,
        data: JSON.parse(cachedUsers),
      });
    }

    const users = await User.find({}).select('-password -refreshToken').populate({
      path: 'projects.project',
      populate: {
        path: 'user',
        select: '-password -refreshToken'
      }
    }).populate({
      path: 'projects.project',
      populate: {
        path: 'service',
        select: 'name'
      }
    }).populate({
      path: 'applications',
      populate: {
        path: 'project',
        populate: {
          path: 'user',
          select: '-password -refreshToken'
        }
      }
    }).populate({
      path: 'savedProjects',
      populate: {
        path: 'user',
        select: '-password -refreshToken'
      }
    }).populate({
      path: 'savedProjects',
      populate: {
        path: 'service',
        select: 'name'
      }
    }).exec();

    if (!users) {
      return res.status(404).json({
        success: false,
        message: 'Users not found',
      });
    }

    if (req.redisClient) {
      await req.redisClient.set(cachedKey, JSON.stringify(users), 'EX', 3600);
    }

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.log('Error in getUserProfile:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// =======================
// CHANGE PASSWORD
// =======================
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const user = await User.findById(req.user._id);

    await invalidateUserCache(req.redisClient, `user:${user._id}`);

    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.log('Error in changePassword:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// =======================
// FORGOT PASSWORD
// =======================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate token
    const resetToken = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Token',
      message: `Your password reset token is: ${resetToken}`,
    });

    return res.status(200).json({
      success: true,
      message: 'Password reset token generated',
      resetToken,
    });
  } catch (error) {
    console.log('Error in forgotPassword:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// =======================
// RESET PASSWORD
// =======================
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    console.log('Error in resetPassword:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};


// =======================
// REFRESH TOKEN
// =======================
const refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    const newAccessToken = generateAccessToken(user);

    return res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.log('Error in refreshToken:', error);

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token',
      error: error.message,
    });
  }
};

// ==========================
// EDIT USER PROFILE
// ==========================
const editUserProfile = async (req, res) => {
  try {
    const {
      username,
      firstname,
      lastname,
      phone,
      bio,
      skills,
      avatar,
    } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check username conflict
    if (username && username !== user.username) {
      const usernameExists = await User.findOne({ username });

      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken',
        });
      }

      user.username = username;
    }

    // Update fields
    user.firstname = firstname || user.firstname;
    user.lastname = lastname || user.lastname;
    user.phone = phone || user.phone;
    user.bio = bio || user.bio;
    user.skills = skills || user.skills;
    user.avatar = avatar || user.avatar;

    const updatedUser = await user.save();

    await invalidateCache(req.redisClient, `user:${user._id}`);

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        _id: updatedUser._id,
        username: updatedUser.username,
        firstname: updatedUser.firstname,
        lastname: updatedUser.lastname,
        email: updatedUser.email,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
        skills: updatedUser.skills,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.log('Error updating profile:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};

const userLogout = async(req, res)=> {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token required',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

      const user = await User.findById(decoded.userId);

    if (!user || user.refreshToken !== token) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
      });
    }

    user.refreshToken = ''
    await user.save()
    res.status(200).json({
      success: true,
      message: 'User Logged Out Successfully'
    })
  } catch (error) {
    console.log('Error in userLogout:', error);

    return res.status(500).json({
      success: false,
      message: 'Server error Occured during User Logout',
      error: error.message,
    });
  }
}


module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  getAllUsers,
  changePassword,
  forgotPassword,
  resetPassword,
  refreshToken,
  userLogout,
  editUserProfile,
};