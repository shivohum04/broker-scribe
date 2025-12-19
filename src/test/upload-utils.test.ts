import { describe, it, expect } from 'vitest';
import { formatFileSize, validateFile } from '@/lib/upload-utils';

describe('Upload Utilities', () => {
  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(10240)).toBe('10 KB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(5 * 1024 * 1024)).toBe('5 MB');
    });

    it('formats gigabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });

  describe('validateFile', () => {
    it('validates image files correctly', () => {
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFile(imageFile);
      expect(result.isValid).toBe(true);
    });

    it('validates video files correctly', () => {
      const videoFile = new File([''], 'test.mp4', { type: 'video/mp4' });
      const result = validateFile(videoFile);
      expect(result.isValid).toBe(true);
    });

    it('rejects non-image/non-video files', () => {
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      const result = validateFile(pdfFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Only image and video files are allowed');
    });

    it('rejects images that are too large', () => {
      // Create a mock file that exceeds MAX_FILE_SIZE (50MB)
      const largeImageFile = new File([''], 'large.jpg', { type: 'image/jpeg' });
      // Mock the size property
      Object.defineProperty(largeImageFile, 'size', {
        value: 51 * 1024 * 1024, // 51MB
        writable: false,
      });

      const result = validateFile(largeImageFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds maximum allowed size');
    });

    it('allows images within size limit', () => {
      const imageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      Object.defineProperty(imageFile, 'size', {
        value: 10 * 1024 * 1024, // 10MB
        writable: false,
      });

      const result = validateFile(imageFile);
      expect(result.isValid).toBe(true);
    });

    it('allows videos of any size', () => {
      const largeVideoFile = new File([''], 'large.mp4', { type: 'video/mp4' });
      Object.defineProperty(largeVideoFile, 'size', {
        value: 100 * 1024 * 1024, // 100MB
        writable: false,
      });

      const result = validateFile(largeVideoFile);
      expect(result.isValid).toBe(true);
    });
  });
});





