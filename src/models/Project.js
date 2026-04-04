const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
    },

    price: {
      type: Number,
      default: 0,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true,
    },

    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'expert'],
      default: 'beginner',
    },

    duration: {
      type: String,
    },

    location: {
      type: String,
      default: 'remote',
    },

    skills: [
      {
        type: String,
      },
    ],

    image: {
      type: String,
      default: 'https://placeholderimage.co/600x400/ccc/22c55e?text=Project+Image',
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);