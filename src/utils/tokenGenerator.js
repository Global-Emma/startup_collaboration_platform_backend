const jwt = require('jsonwebtoken');

// Generate Access Token
const generateAccessToken = (user) => {
  return jwt.sign({ 
    userId: user._id,
    email: user.email,
    role: user.role,
  }, process.env.JWT_SECRET, {
    expiresIn: '15m',
  });
};

// Generate Refresh Token
const generateRefreshToken = (user, res) => {
  const refreshToken = jwt.sign({ 
    userId: user._id,
  }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return refreshToken;

}

module.exports = { 
  generateAccessToken,
  generateRefreshToken
};