const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    firstname: {
      type: String,
      required: true,
    },
    lastname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phone: {
      type: Number,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    role: {
      type: String,
      enum: ['freelancer', 'employer', 'admin'],
      default: 'freelancer',
    },
    bio: {
      type: String
    },
    skills: [
      {
        type: String,
      }
    ],
    avatar: {
      type: String,
      default: 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y'
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    refreshToken: String,
  },
  { timestamps: true }
);

// Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next;

  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
}

module.exports = mongoose.model('User', userSchema);