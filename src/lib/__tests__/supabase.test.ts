import { propertyService } from "@/backend/properties/property.service";

// Mock Supabase client
jest.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        order: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(() => ({
            data: null,
            error: null,
          })),
        })),
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
      delete: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: null,
          error: null,
        })),
      })),
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => ({
          data: { path: "test-path" },
          error: null,
        })),
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: "https://example.com/test.jpg" },
        })),
      })),
    },
  },
}));

// Mock other dependencies
jest.mock("../upload-utils", () => ({
  compressImage: jest.fn().mockImplementation((file) => file),
  retryWithBackoff: jest.fn().mockImplementation((fn) => fn()),
  logUploadError: jest.fn(),
  formatFileSize: jest.fn().mockReturnValue("1MB"),
}));

jest.mock("../thumbnail-utils", () => ({
  generateThumbnail: jest
    .fn()
    .mockResolvedValue(new File(["thumbnail"], "thumb.webp")),
}));

jest.mock("../media-local", () => ({
  localVideoStorage: {
    storeVideoLocally: jest.fn().mockResolvedValue({
      success: true,
      localKey: "test-key",
      metadata: {
        id: "test-key",
        fileName: "test.mp4",
        fileSize: 1024,
        fileType: "video/mp4",
        uploadedAt: new Date().toISOString(),
      },
    }),
    removeLocalVideo: jest.fn().mockResolvedValue(true),
  },
}));

describe("PropertyService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getPropertiesList", () => {
    it("should return lightweight property list", async () => {
      const mockData = [
        {
          id: "1",
          address_line_1: "123 Main St",
          address_line_2: "Apt 1",
          address_line_3: null,
          type: "residential",
          rate: 100000,
          cover_thumbnail_url: "https://example.com/thumb.jpg",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z",
        },
      ];

      const { supabase } = require("@/integrations/supabase/client");
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      const result = await propertyService.getPropertiesList();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "1",
        addressLine1: "123 Main St",
        addressLine2: "Apt 1",
        addressLine3: "",
        type: "residential",
        rate: 100000,
        cover_thumbnail_url: "https://example.com/thumb.jpg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      });
    });
  });

  describe("addMediaToProperty", () => {
    it("should add image media to property", async () => {
      const mockFile = new File(["image content"], "test.jpg", {
        type: "image/jpeg",
      });
      const propertyId = "test-property";
      const userId = "test-user";

      const { supabase } = require("@/integrations/supabase/client");
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { media: [], cover_thumbnail_url: null },
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await propertyService.addMediaToProperty(
        propertyId,
        mockFile,
        userId,
        true
      );

      expect(result.success).toBe(true);
      expect(result.mediaId).toBeDefined();
    });

    it("should add video media to property with local storage", async () => {
      const mockFile = new File(["video content"], "test.mp4", {
        type: "video/mp4",
      });
      const propertyId = "test-property";
      const userId = "test-user";

      const { supabase } = require("@/integrations/supabase/client");
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { media: [], cover_thumbnail_url: null },
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await propertyService.addMediaToProperty(
        propertyId,
        mockFile,
        userId,
        false
      );

      expect(result.success).toBe(true);
      expect(result.mediaId).toBe("test-key");
    });

    it("should handle local storage failures", async () => {
      const mockFile = new File(["video content"], "test.mp4", {
        type: "video/mp4",
      });
      const propertyId = "test-property";
      const userId = "test-user";

      const { localVideoStorage } = require("../media-local");
      localVideoStorage.storeVideoLocally.mockResolvedValueOnce({
        success: false,
        error: "Storage full",
      });

      const result = await propertyService.addMediaToProperty(
        propertyId,
        mockFile,
        userId,
        false
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Storage full");
    });
  });

  describe("removeMediaFromProperty", () => {
    it("should remove media and promote next image to cover", async () => {
      const propertyId = "test-property";
      const mediaId = "media-1";

      const mockMedia = [
        {
          id: "media-1",
          type: "image",
          storageType: "cloud",
          thumbnailUrl: "thumb1.jpg",
        },
        {
          id: "media-2",
          type: "image",
          storageType: "cloud",
          thumbnailUrl: "thumb2.jpg",
        },
      ];

      const { supabase } = require("@/integrations/supabase/client");
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              media: mockMedia,
              cover_thumbnail_url: "thumb1.jpg",
            },
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await propertyService.removeMediaFromProperty(
        propertyId,
        mediaId
      );

      expect(result.success).toBe(true);
      expect(result.newCoverThumbnailUrl).toBe("thumb2.jpg");
    });

    it("should clear cover thumbnail when no images remain", async () => {
      const propertyId = "test-property";
      const mediaId = "media-1";

      const mockMedia = [
        {
          id: "media-1",
          type: "image",
          storageType: "cloud",
          thumbnailUrl: "thumb1.jpg",
        },
      ];

      const { supabase } = require("@/integrations/supabase/client");
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              media: mockMedia,
              cover_thumbnail_url: "thumb1.jpg",
            },
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await propertyService.removeMediaFromProperty(
        propertyId,
        mediaId
      );

      expect(result.success).toBe(true);
      expect(result.newCoverThumbnailUrl).toBeUndefined();
    });

    it("should handle local video cleanup", async () => {
      const propertyId = "test-property";
      const mediaId = "video-1";

      const mockMedia = [
        {
          id: "video-1",
          type: "video",
          storageType: "local",
          localKey: "local-key-1",
        },
      ];

      const { supabase } = require("@/integrations/supabase/client");
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              media: mockMedia,
              cover_thumbnail_url: null,
            },
            error: null,
          }),
        }),
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const { localVideoStorage } = require("../media-local");
      localVideoStorage.removeLocalVideo.mockResolvedValueOnce(true);

      const result = await propertyService.removeMediaFromProperty(
        propertyId,
        mediaId
      );

      expect(result.success).toBe(true);
      expect(localVideoStorage.removeLocalVideo).toHaveBeenCalledWith(
        "local-key-1"
      );
    });

    it("should handle media not found", async () => {
      const propertyId = "test-property";
      const mediaId = "non-existent";

      const { supabase } = require("@/integrations/supabase/client");
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: { media: [], cover_thumbnail_url: null },
            error: null,
          }),
        }),
      });

      const result = await propertyService.removeMediaFromProperty(
        propertyId,
        mediaId
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Media not found");
    });
  });

  describe("getPropertyWithMedia", () => {
    it("should return property with media array", async () => {
      const propertyId = "test-property";
      const mockData = {
        id: propertyId,
        user_id: "user-1",
        type: "residential",
        address_line_1: "123 Main St",
        rate: 100000,
        media: [
          {
            id: "media-1",
            type: "image",
            storageType: "cloud",
            url: "image.jpg",
          },
        ],
        cover_thumbnail_url: "thumb.jpg",
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z",
      };

      const { supabase } = require("@/integrations/supabase/client");
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: mockData,
            error: null,
          }),
        }),
      });

      const result = await propertyService.getPropertyWithMedia(propertyId);

      expect(result).toBeDefined();
      expect(result?.id).toBe(propertyId);
      expect(result?.media).toHaveLength(1);
      expect(result?.cover_thumbnail_url).toBe("thumb.jpg");
    });

    it("should return null for non-existent property", async () => {
      const propertyId = "non-existent";

      const { supabase } = require("@/integrations/supabase/client");
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await propertyService.getPropertyWithMedia(propertyId);

      expect(result).toBeNull();
    });
  });
});
