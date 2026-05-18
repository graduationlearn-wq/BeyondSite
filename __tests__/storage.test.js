'use strict';

describe('Storage', () => {
  let storage;

  beforeEach(() => {
    jest.resetModules();
    delete process.env.UPLOAD_STORAGE;
    delete process.env.AWS_REGION;
    delete process.env.AWS_S3_BUCKET;
  });

  test('storage module loads without errors', () => {
    const mod = require('../src/lib/storage');
    expect(mod).toBeDefined();
  });

  test('local storage mode is default', () => {
    const mod = require('../src/lib/storage');
    expect(mod.isS3()).toBe(false);
  });

  test('getFileBaseUrl returns local path in default mode', () => {
    const mod = require('../src/lib/storage');
    expect(mod.getFileBaseUrl()).toBe('/uploads/images');
  });

  test('getUploadDir returns a directory path', () => {
    const mod = require('../src/lib/storage');
    const dir = mod.getUploadDir();
    expect(dir).toContain('public');
    expect(dir).toContain('uploads');
  });

  test('getMulterStorage returns storage object', () => {
    const mod = require('../src/lib/storage');
    const storage = mod.getMulterStorage();
    expect(storage).toBeDefined();
    expect(storage._handleFile).toBeDefined();
  });

  test('fileFilter function exists', () => {
    const mod = require('../src/lib/storage');
    expect(typeof mod.fileFilter).toBe('function');
  });

  describe('S3 mode', () => {
    beforeEach(() => {
      process.env.UPLOAD_STORAGE = 's3';
      process.env.AWS_REGION = 'us-east-1';
      process.env.AWS_S3_BUCKET = 'test-bucket';
      jest.resetModules();
      storage = require('../src/lib/storage');
    });

    test('isS3 returns true when configured', () => {
      expect(storage.isS3()).toBe(true);
    });

    test('getFileBaseUrl returns S3 URL', () => {
      expect(storage.getFileBaseUrl()).toBe('https://test-bucket.s3.us-east-1.amazonaws.com');
    });

    test('getUploadDir returns null for S3', () => {
      expect(storage.getUploadDir()).toBeNull();
    });
  });
});