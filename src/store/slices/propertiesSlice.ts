import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Property, PropertyType } from '@/types/property';
import { propertyService } from '@/backend/properties/property.service';

interface PropertyFilters {
  search: string;
  type: 'all' | PropertyType;
}

interface PropertiesState {
  properties: Property[];
  filteredProperties: Property[];
  filters: PropertyFilters;
  loading: boolean;
  error: string | null;
  editingProperty: Property | null;
  viewingProperty: Property | null;
}

const initialState: PropertiesState = {
  properties: [],
  filteredProperties: [],
  filters: {
    search: '',
    type: 'all',
  },
  loading: false,
  error: null,
  editingProperty: null,
  viewingProperty: null,
};

// Async thunks
export const fetchProperties = createAsyncThunk(
  'properties/fetchProperties',
  async (_, { rejectWithValue }) => {
    try {
      const properties = await propertyService.getProperties();
      return properties;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch properties');
    }
  }
);

export const addProperty = createAsyncThunk(
  'properties/addProperty',
  async (propertyData: Omit<Property, 'id' | 'created_at' | 'updated_at'>, { rejectWithValue }) => {
    try {
      const newProperty = await propertyService.addProperty(propertyData);
      return newProperty;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to add property');
    }
  }
);

export const updateProperty = createAsyncThunk(
  'properties/updateProperty',
  async ({ id, updates }: { id: string; updates: Partial<Property> }, { rejectWithValue }) => {
    try {
      await propertyService.updateProperty(id, updates);
      return { id, updates };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update property');
    }
  }
);

export const deleteProperty = createAsyncThunk(
  'properties/deleteProperty',
  async (id: string, { rejectWithValue }) => {
    try {
      await propertyService.deleteProperty(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete property');
    }
  }
);

const propertiesSlice = createSlice({
  name: 'properties',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<PropertyFilters>) => {
      state.filters = action.payload;
      // Apply filters
      const { search, type } = action.payload;
      state.filteredProperties = state.properties.filter(property => {
        const matchesSearch = !search || 
          property.addressLine1.toLowerCase().includes(search.toLowerCase()) ||
          property.addressLine2.toLowerCase().includes(search.toLowerCase()) ||
          property.addressLine3.toLowerCase().includes(search.toLowerCase()) ||
          property.ownerName.toLowerCase().includes(search.toLowerCase()) ||
          property.notes.toLowerCase().includes(search.toLowerCase());
        
        const matchesType = type === 'all' || property.type === type;
        
        return matchesSearch && matchesType;
      });
    },
    setEditingProperty: (state, action: PayloadAction<Property | null>) => {
      state.editingProperty = action.payload;
    },
    setViewingProperty: (state, action: PayloadAction<Property | null>) => {
      state.viewingProperty = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch properties
      .addCase(fetchProperties.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProperties.fulfilled, (state, action) => {
        state.loading = false;
        state.properties = action.payload;
        // Apply current filters
        const { search, type } = state.filters;
        state.filteredProperties = action.payload.filter(property => {
          const matchesSearch = !search || 
            property.addressLine1.toLowerCase().includes(search.toLowerCase()) ||
            property.addressLine2.toLowerCase().includes(search.toLowerCase()) ||
            property.addressLine3.toLowerCase().includes(search.toLowerCase()) ||
            property.ownerName.toLowerCase().includes(search.toLowerCase()) ||
            property.notes.toLowerCase().includes(search.toLowerCase());
          
          const matchesType = type === 'all' || property.type === type;
          
          return matchesSearch && matchesType;
        });
      })
      .addCase(fetchProperties.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add property
      .addCase(addProperty.fulfilled, (state, action) => {
        state.properties.unshift(action.payload);
        // Reapply filters
        const { search, type } = state.filters;
        state.filteredProperties = state.properties.filter(property => {
          const matchesSearch = !search || 
            property.addressLine1.toLowerCase().includes(search.toLowerCase()) ||
            property.addressLine2.toLowerCase().includes(search.toLowerCase()) ||
            property.addressLine3.toLowerCase().includes(search.toLowerCase()) ||
            property.ownerName.toLowerCase().includes(search.toLowerCase()) ||
            property.notes.toLowerCase().includes(search.toLowerCase());
          
          const matchesType = type === 'all' || property.type === type;
          
          return matchesSearch && matchesType;
        });
      })
      // Update property
      .addCase(updateProperty.fulfilled, (state, action) => {
        const { id, updates } = action.payload;
        const index = state.properties.findIndex(p => p.id === id);
        if (index !== -1) {
          state.properties[index] = { ...state.properties[index], ...updates };
        }
        // Update filtered properties
        const filteredIndex = state.filteredProperties.findIndex(p => p.id === id);
        if (filteredIndex !== -1) {
          state.filteredProperties[filteredIndex] = { ...state.filteredProperties[filteredIndex], ...updates };
        }
        // Update editing property if it's the same
        if (state.editingProperty?.id === id) {
          state.editingProperty = { ...state.editingProperty, ...updates };
        }
        // Update viewing property if it's the same
        if (state.viewingProperty?.id === id) {
          state.viewingProperty = { ...state.viewingProperty, ...updates };
        }
      })
      // Delete property
      .addCase(deleteProperty.fulfilled, (state, action) => {
        const id = action.payload;
        state.properties = state.properties.filter(p => p.id !== id);
        state.filteredProperties = state.filteredProperties.filter(p => p.id !== id);
        if (state.editingProperty?.id === id) {
          state.editingProperty = null;
        }
        if (state.viewingProperty?.id === id) {
          state.viewingProperty = null;
        }
      });
  },
});

export const { setFilters, setEditingProperty, setViewingProperty, clearError } = propertiesSlice.actions;
export default propertiesSlice.reducer;









