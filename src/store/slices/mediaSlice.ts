import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { MediaItem } from '@/types/property';
import { propertyService } from '@/backend/properties/property.service';
import { uploadMediaFile } from '@/lib/unified-media-utils';

interface MediaState {
  // Property media management
  propertyMedia: Record<string, MediaItem[]>; // propertyId -> media items
  loadingMedia: Record<string, boolean>; // propertyId -> loading state
  mediaError: Record<string, string | null>; // propertyId -> error message
  
  // Upload progress tracking
  uploadProgress: Record<string, number>; // fileId -> progress percentage
  uploadStatus: Record<string, 'pending' | 'processing' | 'uploading' | 'success' | 'error'>; // fileId -> status
  
  // Local video URLs for playback
  localVideoUrls: Record<string, string>; // mediaId -> video URL
  
  // Media viewer state
  viewer: {
    isOpen: boolean;
    media: MediaItem[];
    startIndex: number;
  };
}

const initialState: MediaState = {
  propertyMedia: {},
  loadingMedia: {},
  mediaError: {},
  uploadProgress: {},
  uploadStatus: {},
  localVideoUrls: {},
  viewer: {
    isOpen: false,
    media: [],
    startIndex: 0,
  },
};

// Async thunks
export const fetchPropertyMedia = createAsyncThunk(
  'media/fetchPropertyMedia',
  async (propertyId: string, { rejectWithValue }) => {
    try {
      const property = await propertyService.getPropertyWithMedia(propertyId);
      const media = (property as any)?.media || [];
      return { propertyId, media };
    } catch (error: any) {
      return rejectWithValue({ propertyId, error: error.message || 'Failed to fetch media' });
    }
  }
);

export const uploadMedia = createAsyncThunk(
  'media/uploadMedia',
  async ({ 
    propertyId, 
    files, 
    userId, 
    isFirstImage = false 
  }: { 
    propertyId: string; 
    files: File[]; 
    userId: string; 
    isFirstImage?: boolean;
  }, { rejectWithValue, dispatch }) => {
    try {
      const uploadedMedia: MediaItem[] = [];
      
      // Process files sequentially to maintain order
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileId = `${propertyId}_${file.name}_${Date.now()}`;
        
        // Set upload status
        dispatch(setUploadStatus({ fileId, status: 'processing' }));
        
        try {
          const result = await uploadMediaFile(file, propertyId, userId, isFirstImage && i === 0);
          
          if (result.success && result.mediaItem) {
            uploadedMedia.push(result.mediaItem);
            dispatch(setUploadStatus({ fileId, status: 'success' }));
          } else {
            dispatch(setUploadStatus({ fileId, status: 'error' }));
            throw new Error(result.error || 'Upload failed');
          }
        } catch (error: any) {
          dispatch(setUploadStatus({ fileId, status: 'error' }));
          throw error;
        }
      }
      
      return { propertyId, media: uploadedMedia };
    } catch (error: any) {
      return rejectWithValue({ propertyId, error: error.message || 'Upload failed' });
    }
  }
);

export const removeMedia = createAsyncThunk(
  'media/removeMedia',
  async ({ propertyId, mediaId }: { propertyId: string; mediaId: string }, { rejectWithValue }) => {
    try {
      const result = await propertyService.removeMediaFromProperty(propertyId, mediaId);
      if (result.success) {
        return { propertyId, mediaId };
      } else {
        throw new Error('Failed to remove media');
      }
    } catch (error: any) {
      return rejectWithValue({ propertyId, mediaId, error: error.message || 'Failed to remove media' });
    }
  }
);

const mediaSlice = createSlice({
  name: 'media',
  initialState,
  reducers: {
    setPropertyMedia: (state, action: PayloadAction<{ propertyId: string; media: MediaItem[] }>) => {
      const { propertyId, media } = action.payload;
      state.propertyMedia[propertyId] = media;
    },
    addMediaToProperty: (state, action: PayloadAction<{ propertyId: string; media: MediaItem[] }>) => {
      const { propertyId, media } = action.payload;
      if (!state.propertyMedia[propertyId]) {
        state.propertyMedia[propertyId] = [];
      }
      state.propertyMedia[propertyId].push(...media);
    },
    removeMediaFromProperty: (state, action: PayloadAction<{ propertyId: string; mediaId: string }>) => {
      const { propertyId, mediaId } = action.payload;
      if (state.propertyMedia[propertyId]) {
        state.propertyMedia[propertyId] = state.propertyMedia[propertyId].filter(m => m.id !== mediaId);
      }
    },
    setUploadProgress: (state, action: PayloadAction<{ fileId: string; progress: number }>) => {
      const { fileId, progress } = action.payload;
      state.uploadProgress[fileId] = progress;
    },
    setUploadStatus: (state, action: PayloadAction<{ fileId: string; status: 'pending' | 'processing' | 'uploading' | 'success' | 'error' }>) => {
      const { fileId, status } = action.payload;
      state.uploadStatus[fileId] = status;
    },
    setLocalVideoUrl: (state, action: PayloadAction<{ mediaId: string; url: string }>) => {
      const { mediaId, url } = action.payload;
      state.localVideoUrls[mediaId] = url;
    },
    openMediaViewer: (state, action: PayloadAction<{ media: MediaItem[]; startIndex: number }>) => {
      state.viewer = {
        isOpen: true,
        media: action.payload.media,
        startIndex: action.payload.startIndex,
      };
    },
    closeMediaViewer: (state) => {
      state.viewer = {
        isOpen: false,
        media: [],
        startIndex: 0,
      };
    },
    clearMediaError: (state, action: PayloadAction<string>) => {
      const propertyId = action.payload;
      state.mediaError[propertyId] = null;
    },
    clearUploadStatus: (state, action: PayloadAction<string>) => {
      const fileId = action.payload;
      delete state.uploadProgress[fileId];
      delete state.uploadStatus[fileId];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch property media
      .addCase(fetchPropertyMedia.pending, (state, action) => {
        const propertyId = action.meta.arg;
        state.loadingMedia[propertyId] = true;
        state.mediaError[propertyId] = null;
      })
      .addCase(fetchPropertyMedia.fulfilled, (state, action) => {
        const { propertyId, media } = action.payload;
        state.loadingMedia[propertyId] = false;
        state.propertyMedia[propertyId] = media;
      })
      .addCase(fetchPropertyMedia.rejected, (state, action) => {
        const { propertyId, error } = action.payload as any;
        state.loadingMedia[propertyId] = false;
        state.mediaError[propertyId] = error;
      })
      // Upload media
      .addCase(uploadMedia.pending, (state, action) => {
        const { propertyId } = action.meta.arg;
        state.loadingMedia[propertyId] = true;
        state.mediaError[propertyId] = null;
      })
      .addCase(uploadMedia.fulfilled, (state, action) => {
        const { propertyId, media } = action.payload;
        state.loadingMedia[propertyId] = false;
        if (!state.propertyMedia[propertyId]) {
          state.propertyMedia[propertyId] = [];
        }
        state.propertyMedia[propertyId].push(...media);
      })
      .addCase(uploadMedia.rejected, (state, action) => {
        const { propertyId, error } = action.payload as any;
        state.loadingMedia[propertyId] = false;
        state.mediaError[propertyId] = error;
      })
      // Remove media
      .addCase(removeMedia.fulfilled, (state, action) => {
        const { propertyId, mediaId } = action.payload;
        if (state.propertyMedia[propertyId]) {
          state.propertyMedia[propertyId] = state.propertyMedia[propertyId].filter(m => m.id !== mediaId);
        }
      });
  },
});

export const {
  setPropertyMedia,
  addMediaToProperty,
  removeMediaFromProperty,
  setUploadProgress,
  setUploadStatus,
  setLocalVideoUrl,
  openMediaViewer,
  closeMediaViewer,
  clearMediaError,
  clearUploadStatus,
} = mediaSlice.actions;

export default mediaSlice.reducer;









