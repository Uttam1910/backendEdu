const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/\S+@\S+\.\S+/, 'Email is invalid']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
    select: false
  },
  avatar: {
    publicId: {
      type: String,
      default: 'default_avatar_id'
    },
    secureUrl: {
      type: String,
      default: 'default_avatar_url'
    }
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  enrolledCourses: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course'
  }],
  forgotPasswordToken: {
    type: String,
    select: false
  },
  forgotPasswordExpires: {
    type: Date,
    select: false
  },
  // Subscription details
  subscription: {
    id: { type: String },
    planId: { type: String },
    status: { type: String },
    startDate: { type: Date },
    endDate: { type: Date },
  },
}, {
  timestamps: true // Automatically add createdAt and updatedAt fields
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Generate and hash password token
userSchema.methods.getResetPasswordToken = function() {
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash token and set to forgotPasswordToken field
  this.forgotPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  // Set token expire time
  this.forgotPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

module.exports = mongoose.model('User', userSchema);
