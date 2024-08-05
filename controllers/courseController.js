// controllers/courseController.js
const cloudinary = require('../config/cloudinary');
const fs = require('fs');
const path = require('path');
const Course = require('../models/course');
const User = require('../models/user'); // Ensure you have this import




const uploadThumbnail = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  try {
    // Upload the file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'course_thumbnails',
      use_filename: true,
      unique_filename: false,
      resource_type: 'image',
    });

    // Add Cloudinary response to req.body for further use
    req.body.thumbnail = {
      public_id: result.public_id,
      secure_url: result.secure_url,
    };


    // Check if createdBy is included in the form data
    if (req.body.createdBy) {
      req.body.createdBy = req.body.createdBy.trim(); // Optionally trim createdBy field
    }

    // Remove the file from the local storage
    fs.unlinkSync(req.file.path);

    next();
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ message: 'Failed to upload file' });
  }
};




const createCourse = async (req, res) => {
  const { title, description, category, thumbnail, createdBy } = req.body;

  try {
    const newCourse = new Course({
      title,
      description,
      category,
      thumbnail,
      createdBy,
    });

    await newCourse.save();

    res.status(201).json({ message: 'Course created successfully', course: newCourse });
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ message: 'Failed to create course' });
  }
};




// Update course functionality
const updateCourse = async (req, res) => {
  const { courseId } = req.params;
  const { title, description, category, thumbnail, createdBy } = req.body;

  try {
    // Find the course by ID
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Update course fields
    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    course.createdBy = createdBy || course.createdBy;
    if (thumbnail) {
      // Delete the old thumbnail from Cloudinary
      if (course.thumbnail.public_id) {
        await cloudinary.uploader.destroy(course.thumbnail.public_id);
      }
      course.thumbnail = thumbnail;
    }

    await course.save();

    res.status(200).json({ message: 'Course updated successfully', course });
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ message: 'Failed to update course' });
  }
};





const deleteCourse = async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (course.thumbnail.public_id) {
      await cloudinary.uploader.destroy(course.thumbnail.public_id);
    }

    await Course.findByIdAndDelete(courseId);

    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ message: 'Failed to delete course' });
  }
};





const addLecture = async (req, res) => {
  const { courseId } = req.params;
  const { title, description } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Video file not uploaded' });
    }

    // Log the uploaded file details
    console.log('Uploaded file:', req.file);

    // Upload video to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'lectures',
    });

    // Log Cloudinary response
    console.log('Cloudinary response:', result);

    // Extract secure_url and public_id from the Cloudinary response
    const { secure_url, public_id } = result;

    if (!secure_url || !public_id) {
      throw new Error('Missing secure_url or public_id from Cloudinary response');
    }

    // Find the course by courseId
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Add new lecture to lectures array
    const newLecture = {
      title,
      description,
      lecture: {
        public_id,
        secure_url,
      },
    };

    course.lectures.push(newLecture);
    course.numberOfLectures += 1;

    // Log new lecture details
    console.log('New Lecture:', newLecture);

    // Save the updated course
    await course.save();

    // Optionally, delete the temporary file uploaded by multer
    fs.unlinkSync(req.file.path);

    res.status(201).json({ message: 'Lecture added successfully', course });
  } catch (err) {
    console.error('Error adding lecture:', err);
    res.status(500).json({ error: 'Failed to add lecture', details: err.message });
  }
};





// View all students enrolled in a course
const viewEnrolledStudents = async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId).populate('enrolledStudents', 'username email');

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    res.status(200).json({ students: course.enrolledStudents });
  } catch (err) {
    console.error('Error fetching enrolled students:', err);
    res.status(500).json({ error: 'Failed to fetch enrolled students' });
  }
};




// View available courses
// Controller to fetch all available courses
const viewAvailableCourses = async (req, res) => {
  try {
    // Fetch all courses from the database
    const courses = await Course.find();

    // If no courses found, return a message
    if (courses.length === 0) {
      return res.status(404).json({ message: 'No courses available' });
    }

    // Return the list of courses
    res.status(200).json(courses);
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
};

// // View available courses
// // Controller to fetch all available courses
// const viewAvailableCourses = async (req, res) => {
//   try {
//     // Fetch all courses from the database
//     const courses = await Course.find();

//     // If no courses found, return a message
//     if (courses.length === 0) {
//       return res.status(404).json({ message: 'No courses available' });
//     }

//     // Return the list of courses
//     res.status(200).json(courses);
//   } catch (err) {
//     console.error('Error fetching courses:', err);
//     res.status(500).json({ error: 'Failed to fetch courses' });
//   }
// };




// Controller to enroll a user in a course

const enrollInCourse = async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ error: 'Only students can enroll in courses' });
    }

    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    if (course.enrolledStudents.includes(userId)) {
      return res.status(400).json({ error: 'User is already enrolled in this course' });
    }

    course.enrolledStudents.push(userId);
    await course.save();

    res.status(200).json({ message: 'Successfully enrolled in the course', course });
  } catch (err) {
    console.error('Error enrolling in course:', err);
    res.status(500).json({ error: 'Failed to enroll in course', details: err.message });
  }
};




// View Enrolled Courses
const viewEnrolledCourses = async (req, res) => {
  try {
    // Get the user ID from the authenticated request
    const userId = req.user._id; // Assuming req.user is set by your authentication middleware

    // Find the user by ID and populate the enrolled courses
    const user = await User.findById(userId).populate('enrolledCourses');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Respond with the list of enrolled courses
    res.status(200).json({ enrolledCourses: user.enrolledCourses });
  } catch (err) {
    console.error('Error fetching enrolled courses:', err);
    res.status(500).json({ error: 'Failed to retrieve enrolled courses', details: err.message });
  }
};






// Controller function to get a course by ID
const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    res.status(200).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




module.exports = {
  uploadThumbnail,
  createCourse,
  updateCourse,
  deleteCourse,
  addLecture,
  viewEnrolledStudents,
  viewAvailableCourses,
  enrollInCourse,
  viewEnrolledCourses,
  getCourseById
};