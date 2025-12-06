import { describe, it, expect } from 'vitest';
import { mapDbRowToProperty } from '@/backend/properties/property.service';
import { Database } from '@/integrations/supabase/types';
import { Property, MediaItem } from '@/types/property';

describe('Property DB → Domain Mapping', () => {
  // Create a mock DB row that matches the Database type
  const createMockDbRow = (overrides?: Partial<Database['public']['Tables']['properties']['Row']>) => {
    const baseRow: Database['public']['Tables']['properties']['Row'] = {
      id: 'test-id-123',
      user_id: 'user-123',
      type: 'land',
      address_line_1: '123 Main St',
      address_line_2: 'Apt 4B',
      address_line_3: 'Downtown',
      rate: 1000000,
      rate_type: 'total',
      rental_per_month: 50000,
      size: 1000,
      size_unit: 'sqft',
      owner_name: 'John Doe',
      owner_contact: '+1234567890',
      notes: 'Test property',
      date_of_entry: '2024-01-01',
      coordinates: { lat: 40.7128, lng: -74.0060 },
      images: ['image1.jpg', 'image2.jpg'],
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    };

    return { ...baseRow, ...overrides };
  };

  it('maps complete DB row to domain Property with all fields', () => {
    const mockRow = createMockDbRow();
    const property = mapDbRowToProperty(mockRow);

    // Verify all fields are mapped correctly (snake_case → camelCase)
    expect(property.id).toBe(mockRow.id);
    expect(property.user_id).toBe(mockRow.user_id);
    expect(property.type).toBe(mockRow.type);
    expect(property.addressLine1).toBe(mockRow.address_line_1);
    expect(property.addressLine2).toBe(mockRow.address_line_2);
    expect(property.addressLine3).toBe(mockRow.address_line_3);
    expect(property.rate).toBe(mockRow.rate);
    expect(property.rateType).toBe(mockRow.rate_type);
    expect(property.rentalPerMonth).toBe(mockRow.rental_per_month);
    expect(property.size).toBe(mockRow.size);
    expect(property.sizeUnit).toBe(mockRow.size_unit);
    expect(property.ownerName).toBe(mockRow.owner_name);
    expect(property.ownerContact).toBe(mockRow.owner_contact);
    expect(property.notes).toBe(mockRow.notes);
    expect(property.dateOfEntry).toBe(mockRow.date_of_entry);
    expect(property.coordinates).toEqual(mockRow.coordinates);
    expect(property.images).toEqual(mockRow.images);
    expect(property.created_at).toBe(mockRow.created_at);
    expect(property.updated_at).toBe(mockRow.updated_at);
  });

  it('maps DB row with null optional fields correctly', () => {
    const mockRow = createMockDbRow({
      address_line_1: null,
      address_line_2: null,
      address_line_3: null,
      notes: null,
      images: null,
      coordinates: null,
    });

    const property = mapDbRowToProperty(mockRow);

    // Verify null values are converted to empty strings or empty arrays
    expect(property.addressLine1).toBe('');
    expect(property.addressLine2).toBe('');
    expect(property.addressLine3).toBe('');
    expect(property.notes).toBe('');
    expect(property.images).toEqual([]);
    expect(property.coordinates).toBeNull();
  });

  it('maps DB row with JSONB media field correctly', () => {
    const mockMedia: MediaItem[] = [
      {
        id: 'media-1',
        type: 'image',
        storageType: 'cloud',
        url: 'https://example.com/image.jpg',
        thumbnailUrl: 'https://example.com/image-thumb.webp',
        isCover: true,
        uploadedAt: '2024-01-01T00:00:00Z',
        fileName: 'image.jpg',
        fileSize: 1024000,
        fileType: 'image/jpeg',
      },
    ];

    const mockRow = createMockDbRow();
    // Simulate JSONB field (in real DB this would be in the row)
    const extendedRow = {
      ...mockRow,
      media: mockMedia,
      cover_thumbnail_url: 'https://example.com/image-thumb.webp',
    } as typeof mockRow & { media?: MediaItem[]; cover_thumbnail_url?: string };

    const property = mapDbRowToProperty(extendedRow);

    // Verify media mapping
    expect(property.media).toEqual(mockMedia);
    expect(property.cover_thumbnail_url).toBe('https://example.com/image-thumb.webp');
  });

  it('maps different rate types correctly', () => {
    const testCases = [
      { rate_type: 'total', expected: 'total' },
      { rate_type: 'per_sqft', expected: 'per_sqft' },
      { rate_type: 'per_acre', expected: 'per_acre' },
      { rate_type: 'per_hectare', expected: 'per_hectare' },
    ];

    testCases.forEach(({ rate_type, expected }) => {
      const mockRow = createMockDbRow({ rate_type: rate_type as any });
      const property = mapDbRowToProperty(mockRow);
      expect(property.rateType).toBe(expected);
    });
  });

  it('maps different size units correctly', () => {
    const testCases = [
      { size_unit: 'sqft', expected: 'sqft' },
      { size_unit: 'acres', expected: 'acres' },
      { size_unit: 'hectare', expected: 'hectare' },
    ];

    testCases.forEach(({ size_unit, expected }) => {
      const mockRow = createMockDbRow({ size_unit: size_unit as any });
      const property = mapDbRowToProperty(mockRow);
      expect(property.sizeUnit).toBe(expected);
    });
  });

  it('handles missing date_of_entry by using fallback date format', () => {
    const mockRow = createMockDbRow({ date_of_entry: null });
    const property = mapDbRowToProperty(mockRow);
    
    // Should use fallback format (YYYY-MM-DD)
    expect(property.dateOfEntry).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('maps zero values correctly', () => {
    const mockRow = createMockDbRow({
      rate: 0,
      rental_per_month: 0,
      size: 0,
    });

    const property = mapDbRowToProperty(mockRow);
    expect(property.rate).toBe(0);
    expect(property.rentalPerMonth).toBe(0);
    expect(property.size).toBe(0);
  });

  it('handles missing media field by defaulting to empty array', () => {
    const mockRow = createMockDbRow();
    const property = mapDbRowToProperty(mockRow);
    expect(property.media).toEqual([]);
  });

  it('handles missing cover_thumbnail_url by defaulting to null', () => {
    const mockRow = createMockDbRow();
    const property = mapDbRowToProperty(mockRow);
    expect(property.cover_thumbnail_url).toBeNull();
  });
});
