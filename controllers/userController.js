// controllers/userController.js
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/user");
const cloudinary = require("../config/cloudinary");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

// Nodemailer transporter configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Register a new user
exports.register = async (req, res) => {
  const { username, email, password, role } = req.body;

  console.log('Registering user:', { username, email, role }); // Debug log

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = new User({
      username,
      email,
      password,
      role: role || "student", // Default role to 'student' if not specified
    });

    console.log('User data before saving:', user); // Debug log

    await user.save();

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, { httpOnly: true, secure: process.env.NODE_ENV === "production" });
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error); // Debug log
    res.status(500).json({ message: "Server error" });
  }
};



// Log in a user
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account is inactive. Please contact support." });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error); // Debug log
    res.status(500).json({ message: "Server error" });
  }
};

// Log out a user
exports.logout = (req, res) => {
  res.cookie("token", "", { expires: new Date(0) });
  res.status(200).json({ message: "User logged out successfully" });
};

// View user profile
exports.viewProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("Error retrieving profile:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};


// Middleware to authenticate user
exports.authenticateUser = (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Token expired" });
    }
    res.status(401).json({ message: "Token is not valid" });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.avatar = {
      publicId: result.public_id,
      secureUrl: result.secure_url,
    };

    await user.save();

    // Delete the file from the local uploads folder
    fs.unlinkSync(req.file.path);

    res.status(200).json(user.avatar);
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res
      .status(500)
      .json({ message: "Error uploading avatar", error: error.message });
  }
};



// Forgot Password
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();

    await user.save();

    // Create reset URL for the frontend
    const resetUrl = `http://localhost:5173/resetpassword/${resetToken}`;

    const message = `
      <h1>Password Reset Request</h1>
      <p>You requested a password reset</p>
      <p>Please click on the following link to reset your password:</p>
      <a href="${resetUrl}" clicktracking=off>${resetUrl}</a>
      <p>If you did not request this, please ignore this email.</p>
    `;

    // Send email
    await transporter.sendMail({
      to: user.email,
      subject: "Password Reset Request",
      html: message,
    });

    res.status(200).json({ message: "Email sent" });
  } catch (error) {
    console.error("Error in forgotPassword:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password
exports.resetPassword = async (req, res) => {
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  try {
    const user = await User.findOne({
      forgotPasswordToken: resetPasswordToken,
      forgotPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid token or token expired" });
    }

    // Set new password
    user.password = req.body.password;
    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Error in resetPassword:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// exports.updateProfile = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const { username, email, password, avatar } = req.body;

//     // Check if the email is already in use
//     if (email) {
//       const emailExists = await User.findOne({ email });
//       if (emailExists && emailExists._id.toString() !== userId.toString()) {
//         return res.status(400).json({ message: "Email already in use" });
//       }
//     }

//     // Update the user's profile
//     const updatedFields = { username, email };

//     if (password) {
//       const salt = await bcrypt.genSalt(10);
//       updatedFields.password = await bcrypt.hash(password, salt);
//     }

//     if (avatar) {
//       const result = await cloudinary.uploader.upload(avatar, {
//         folder: "avatars",
//         width: 150,
//         crop: "scale",
//       });

//       updatedFields.avatar = {
//         public_id: result.public_id,
//         secure_url: result.secure_url,
//       };
//     }

//     const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, {
//       new: true,
//       runValidators: true,
//     }).select("-password");

//     res.status(200).json(updatedUser);
//   } catch (error) {
//     console.error("Error updating profile:", error.message);
//     res.status(500).json({ error: error.message });
//   }
// };


exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { username, email, password } = req.body;
    let avatarUrl;

    // Check if the email is already in use
    if (email) {
      const emailExists = await User.findOne({ email });
      if (emailExists && emailExists._id.toString() !== userId.toString()) {
        return res.status(400).json({ message: "Email already in use" });
      }
    }

    // Update the user's profile
    const updatedFields = { username, email };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      updatedFields.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });

      updatedFields.avatar = {
        public_id: result.public_id,
        secure_url: result.secure_url,
      };

      // Remove temporary file after upload
      fs.unlinkSync(req.file.path);
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating profile:", error.message);
    res.status(500).json({ error: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    // Find user by ID and include the password field
    const user = await User.findById(userId).select("+password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the current password is correct
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Update the password
    user.password = newPassword;

    // Save the updated user
    await user.save();

    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error in changePassword:", error);
    res.status(500).json({ message: "Server error" });
  }
};
