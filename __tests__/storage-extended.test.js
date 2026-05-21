'use strict';

describe('Storage Extended', () => {
  let storage;

  beforeEach(() => {
    jest.resetModules();
    process.env.UPLOAD_STORAGE = 'local';
    process.env.AWS_REGION = '';
    process.env.AWS_S3_BUCKET = '';
    storage = require('../src/lib/storage');
  });

  afterEach(() => {
    process.env.UPLOAD_STORAGE = 'local';
    process.env.AWS_REGION = '';
    process.env.AWS_S3_BUCKET = '';
  });

  describe('isS3', () => {
    test('returns false when UPLOAD_STORAGE is local', () => {
      expect(storage.isS3()).toBe(false);
    });

    test('returns false when UPLOAD_STORAGE is not set', () => {
      delete process.env.UPLOAD_STORAGE;
      jest.resetModules();
      const freshStorage = require('../src/lib/storage');
      expect(freshStorage.isS3()).toBe(false);
    });

    test('returns true when UPLOAD_STORAGE is s3', () => {
      process.env.UPLOAD_STORAGE = 's3';
      jest.resetModules();
      const freshStorage = require('../src/lib/storage');
      expect(freshStorage.isS3()).toBe(true);
    });
  });

  describe('getFileBaseUrl', () => {
    test('returns local path in default mode', () => {
      const url = storage.getFileBaseUrl();
      expect(url).toContain('/uploads');
    });

    test('returns S3 URL when configured', () => {
      process.env.UPLOAD_STORAGE = 's3';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      jest.resetModules();
      const freshStorage = require('../src/lib/storage');
      const url = freshStorage.getFileBaseUrl();
      expect(url).toContain('https://test-bucket.s3.us-east-1');
    });
  });

  describe('getUploadDir', () => {
    test('returns a directory path in local mode', () => {
      const dir = storage.getUploadDir();
      expect(typeof dir).toBe('string');
      expect(dir.length).toBeGreaterThan(0);
    });

    test('returns null for S3 mode', () => {
      process.env.UPLOAD_STORAGE = 's3';
      jest.resetModules();
      const freshStorage = require('../src/lib/storage');
      expect(freshStorage.getUploadDir()).toBeNull();
    });
  });

  describe('fileFilter', () => {
    test('accepts PNG files', () => {
      const cb = jest.fn();
      storage.fileFilter(null, { originalname: 'test.png' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('accepts JPG files', () => {
      const cb = jest.fn();
      storage.fileFilter(null, { originalname: 'test.jpg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('accepts JPEG files', () => {
      const cb = jest.fn();
      storage.fileFilter(null, { originalname: 'test.jpeg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('accepts SVG files', () => {
      const cb = jest.fn();
      storage.fileFilter(null, { originalname: 'test.svg' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('accepts WEBP files', () => {
      const cb = jest.fn();
      storage.fileFilter(null, { originalname: 'test.webp' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('accepts GIF files', () => {
      const cb = jest.fn();
      storage.fileFilter(null, { originalname: 'test.gif' }, cb);
      expect(cb).toHaveBeenCalledWith(null, true);
    });

    test('rejects EXE files', () => {
      const cb = jest.fn();
      storage.fileFilter(null, { originalname: 'malware.exe' }, cb);
      expect(cb).toHaveBeenCalled();
      expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    test('rejects JS files', () => {
      const cb = jest.fn();
      storage.fileFilter(null, { originalname: 'script.js' }, cb);
      expect(cb).toHaveBeenCalled();
      expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    test('rejects PDF files', () => {
      const cb = jest.fn();
      storage.fileFilter(null, { originalname: 'doc.pdf' }, cb);
      expect(cb).toHaveBeenCalled();
      expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
    });

    test('rejects HTML files', () => {
      const cb = jest.fn();
      storage.fileFilter(null, { originalname: 'page.html' }, cb);
      expect(cb).toHaveBeenCalled();
      expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe('getMulterStorage', () => {
    test('returns storage object', () => {
      const multerStorage = storage.getMulterStorage();
      expect(multerStorage).toBeDefined();
    });

    test('returns disk storage in local mode', () => {
      const multerStorage = storage.getMulterStorage();
      expect(multerStorage.constructor.name).toBe('DiskStorage');
    });
  });
});
