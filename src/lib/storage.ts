import { Property } from '@/types/property';

const STORAGE_KEY = 'property-manager-data';

export const storage = {
  getProperties(): Property[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading properties:', error);
      return [];
    }
  },

  saveProperties(properties: Property[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
    } catch (error) {
      console.error('Error saving properties:', error);
    }
  },

  addProperty(property: Property): void {
    const properties = this.getProperties();
    properties.push(property);
    this.saveProperties(properties);
  },

  updateProperty(id: string, updatedProperty: Partial<Property>): void {
    const properties = this.getProperties();
    const index = properties.findIndex(p => p.id === id);
    if (index !== -1) {
      properties[index] = { ...properties[index], ...updatedProperty };
      this.saveProperties(properties);
    }
  },

  deleteProperty(id: string): void {
    const properties = this.getProperties();
    const filtered = properties.filter(p => p.id !== id);
    this.saveProperties(filtered);
  },

  searchProperties(query: string): Property[] {
    const properties = this.getProperties();
    const searchTerm = query.toLowerCase().trim();
    
    if (!searchTerm) return properties;

    return properties.filter(property =>
      property.location.toLowerCase().includes(searchTerm) ||
      property.ownerName.toLowerCase().includes(searchTerm) ||
      property.notes.toLowerCase().includes(searchTerm) ||
      property.type.toLowerCase().includes(searchTerm)
    );
  }
};