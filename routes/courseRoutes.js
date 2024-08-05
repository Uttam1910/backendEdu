    // routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController')
 // routes/courseRoutes.js
const { uploadThumbnail, createCourse, updateCourse, deleteCourse, addLecture  } = require('../controllers/courseController');
const { uploadThumbnail: multerUploadThumbnail, uploadVideo: multerUploadVideo } = require('../middleware/multer');

const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');





// Endpoint for creating a course with a thumbnail
router.post(
  '/create',
  authMiddleware,
  adminMiddleware,
  multerUploadThumbnail.single('thumbnail'),  // Middleware to handle thumbnail upload
  uploadThumbnail,  // Custom middleware to process the thumbnail and store in Cloudinary
  createCourse  // Controller to create the course
);

// POST route to add a lecture to a course by courseId
router.post(
  '/:courseId/lectures',
  authMiddleware,
  adminMiddleware,
  multerUploadVideo.single('video'),  // Middleware to handle video upload
  addLecture  // Controller to add the lecture to the course
);


  // Endpoint for updating a course
  router.put(
      '/:courseId',
      authMiddleware,          // Ensure the user is authenticated
      adminMiddleware,         // Ensure the user is an admin
      multerUploadThumbnail.single('thumbnail'), // Upload the thumbnail
      uploadThumbnail,         // Upload to Cloudinary
      updateCourse             // Update the course
    );


  // Route for deleting a course
  router.delete(
      '/:courseId',
      authMiddleware,
      adminMiddleware,
      deleteCourse
    );


    // Route to get all available courses
    router.get('/', courseController.viewAvailableCourses);

  




// // View all students enrolled in a course
router.get('/:courseId/students', authMiddleware, adminMiddleware, courseController.viewEnrolledStudents);





// // Enroll in a course
router.post('/:courseId/enroll', roleMiddleware('student'), courseController.enrollInCourse);

// // View enrolled courses
router.get('/enrolled', authMiddleware, roleMiddleware('student'), courseController.viewEnrolledCourses);

// Endpoint to get a course by ID
router.get('/:courseId', courseController.getCourseById);

module.exports = router;