const { UPLOAD_STORAGE = 'local', AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET } = process.env;
const path = require('path');
const fs = require('fs');

const localUploadDir = path.join(__dirname, '..', '..', 'public', 'uploads', 'images');

// ── Shared file filter (applies to both local and S3) ─────────────
const fileFilter = (req, file, cb) => {
  if (!/\.(jpeg|jpg|png|gif|webp|svg)$/i.test(path.extname(file.originalname).toLowerCase())) {
    return cb(new Error('Only image files are allowed'));
  }
  cb(null, true);
};

// ── Storage module (local default, s3 swappable via UPLOAD_STORAGE) ─
const storage = {
  getUploadDir() {
    if (UPLOAD_STORAGE === 's3') return null;
    if (!fs.existsSync(localUploadDir)) {
      fs.mkdirSync(localUploadDir, { recursive: true });
    }
    return localUploadDir;
  },

  isS3() {
    return UPLOAD_STORAGE === 's3';
  },

  getFileBaseUrl() {
    if (UPLOAD_STORAGE === 's3') {
      return `https://${AWS_S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com`;
    }
    return '/uploads/images';
  },

  getMulterStorage() {
    if (UPLOAD_STORAGE === 's3') {
      const multerS3 = require('multer-s3');
      const { S3Client } = require('@aws-sdk/client-s3');
      const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY
        }
      });
      return multerS3({
        s3: s3Client,
        bucket: AWS_S3_BUCKET,
        metadata: (req, file, cb) => cb(null, { fieldName: file.fieldname }),
        key: (req, file, cb) => {
          const ext = path.extname(file.originalname).toLowerCase();
          cb(null, `uploads/images/${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
        }
      });
    }

    const multer = require('multer');
    return multer.diskStorage({
      destination: (req, file, cb) => cb(null, localUploadDir),
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
      }
    });
  }
};

module.exports = { ...storage, fileFilter };