const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const resourceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    let folder = 'aspirant-network/resources';
    let resourceType = 'auto';
    
    if (file.mimetype.startsWith('image/')) {
      folder = 'aspirant-network/resources/images';
      resourceType = 'image';
    } else if (file.mimetype === 'application/pdf') {
      folder = 'aspirant-network/resources/pdfs';
      resourceType = 'raw';
    }

    return {
      folder,
      resource_type: resourceType,
      allowed_formats: ['pdf', 'jpg', 'jpeg', 'png', 'webp'],
      public_id: `${Date.now()}-${file.originalname.split('.')[0]}`,
    };
  },
});

const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aspirant-network/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill', gravity: 'face' }],
    public_id: (req, file) => `profile-${req.user._id}-${Date.now()}`,
  },
});

// File filter for resources
const resourceFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
  }
};

// File filter for images only
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images are allowed.'), false);
  }
};

// Storage for Question/Answer Attachments
const attachmentStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aspirant-network/attachments',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    public_id: (req, file) => `attachment-${Date.now()}-${file.originalname.split('.')[0]}`,
  },
});

// Multer upload instances
const uploadResource = multer({
  storage: resourceStorage,
  fileFilter: resourceFileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit for resources
  },
});

const uploadProfile = multer({
  storage: profileStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for profile pics
  },
});

const uploadAttachment = multer({
  storage: attachmentStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for attachments
  },
});

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadResource,
  uploadProfile,
  uploadAttachment,
  deleteFromCloudinary
};
