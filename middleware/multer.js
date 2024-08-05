const multer = require('multer');
const path = require('path');

// Configuration for avatar uploads (local storage)
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const avatarFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images only'));
  }
};

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 10000000 }, // 10MB limit
  fileFilter: avatarFileFilter,
});

// Multer config for course thumbnails (local storage)
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/thumbnails/');
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const thumbnailFileFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|Webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Images only'));
  }
};

const uploadThumbnail = multer({
  storage: thumbnailStorage,
  limits: { fileSize: 50000000 }, // 50MB limit
  fileFilter: thumbnailFileFilter,
});


// Multer config for lecture videos (local storage)
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/lectures/'); // Ensure this directory exists
  },
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const videoFileFilter = (req, file, cb) => {
  const filetypes = /mp4|mkv|mov|avi/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: Videos only'));
  }
};

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: videoFileFilter,
});

module.exports = { uploadAvatar, uploadThumbnail, uploadVideo };

