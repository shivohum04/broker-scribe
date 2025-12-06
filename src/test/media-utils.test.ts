import { describe, it, expect } from 'vitest';
import {
  getThumbnailUrl,
  getMediaType,
  formatFileSize,
  estimateThumbnailSize,
} from '@/lib/thumbnail-utils';

describe('Media Utilities', () => {
  describe('getThumbnailUrl', () => {
    it('generates thumbnail URL from original image URL', () => {
      const originalUrl = 'https://example.com/images/property-123.jpg';
      const thumbnailUrl = getThumbnailUrl(originalUrl);
      expect(thumbnailUrl).toBe('https://example.com/images/property-123-thumb.webp');
    });

    it('handles URLs with query parameters', () => {
      const originalUrl = 'https://example.com/images/property.jpg?version=1';
      const thumbnailUrl = getThumbnailUrl(originalUrl);
      // Note: getThumbnailUrl doesn't preserve query parameters, it only replaces the filename
      expect(thumbnailUrl).toBe('https://example.com/images/property-thumb.webp');
    });

    it('handles URLs with multiple path segments', () => {
      const originalUrl = 'https://storage.example.com/bucket/user123/property/image.png';
      const thumbnailUrl = getThumbnailUrl(originalUrl);
      expect(thumbnailUrl).toBe('https://storage.example.com/bucket/user123/property/image-thumb.webp');
    });

    it('returns empty string for empty input', () => {
      expect(getThumbnailUrl('')).toBe('');
    });

    it('handles URLs without file extension', () => {
      const originalUrl = 'https://example.com/images/property';
      const thumbnailUrl = getThumbnailUrl(originalUrl);
      expect(thumbnailUrl).toBe('https://example.com/images/property-thumb.webp');
    });
  });

  describe('getMediaType', () => {
    it('identifies image URLs correctly', () => {
      expect(getMediaType('image.jpg')).toBe('image');
      expect(getMediaType('photo.PNG')).toBe('image');
      expect(getMediaType('picture.webp')).toBe('image');
      expect(getMediaType('https://example.com/image.jpeg')).toBe('image');
    });

    it('identifies video URLs correctly', () => {
      expect(getMediaType('video.mp4')).toBe('video');
      expect(getMediaType('movie.MOV')).toBe('video');
      expect(getMediaType('clip.webm')).toBe('video');
      expect(getMediaType('https://example.com/video.avi')).toBe('video');
    });

    it('identifies local video markers', () => {
      expect(getMediaType('local-video-123')).toBe('video');
    });

    it('identifies blob URLs as video', () => {
      expect(getMediaType('blob:http://localhost:8080/abc-123')).toBe('video');
    });

    it('returns unknown for unrecognized types', () => {
      expect(getMediaType('document.pdf')).toBe('unknown');
      expect(getMediaType('file.txt')).toBe('unknown');
      expect(getMediaType('')).toBe('unknown');
    });
  });

  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(500)).toBe('500 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('formats kilobytes correctly', () => {
      expect(formatFileSize(1024 * 100)).toBe('100 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
    });

    it('formats megabytes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 5)).toBe('5 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('formats large sizes correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024 * 2.5)).toBe('2.5 GB');
    });
  });

  describe('estimateThumbnailSize', () => {
    it('estimates image thumbnail size correctly', () => {
      const originalSize = 2 * 1024 * 1024; // 2MB
      const estimated = estimateThumbnailSize(originalSize, 'image');
      // Should be ~5% of original, max 50KB
      expect(estimated).toBeLessThanOrEqual(50 * 1024);
      expect(estimated).toBeGreaterThan(0);
    });

    it('estimates video thumbnail size correctly', () => {
      const originalSize = 10 * 1024 * 1024; // 10MB
      const estimated = estimateThumbnailSize(originalSize, 'video');
      // Should be ~2% of original, max 40KB
      expect(estimated).toBeLessThanOrEqual(40 * 1024);
      expect(estimated).toBeGreaterThan(0);
    });

    it('caps image thumbnail at 50KB', () => {
      const originalSize = 100 * 1024 * 1024; // 100MB
      const estimated = estimateThumbnailSize(originalSize, 'image');
      expect(estimated).toBeLessThanOrEqual(50 * 1024);
    });

    it('caps video thumbnail at 40KB', () => {
      const originalSize = 100 * 1024 * 1024; // 100MB
      const estimated = estimateThumbnailSize(originalSize, 'video');
      expect(estimated).toBeLessThanOrEqual(40 * 1024);
    });
  });
});
