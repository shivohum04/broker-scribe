import { 
  Home, 
  Building, 
  Castle, 
  Store, 
  Warehouse, 
  TreePine,
  MapPin
} from 'lucide-react';
import { PropertyType } from '@/types/property';

interface PropertyIconProps {
  type: PropertyType;
  className?: string;
}

export const PropertyIcon = ({ type, className = "h-6 w-6" }: PropertyIconProps) => {
  const getIcon = () => {
    switch (type) {
      case 'land':
      case 'plot':
        return <MapPin className={`${className} text-green-600`} />;
      case 'flat':
      case 'apartment':
        return <Building className={`${className} text-blue-600`} />;
      case 'bungalow':
      case 'villa':
        return <Home className={`${className} text-purple-600`} />;
      case 'office':
        return <Building className={`${className} text-gray-600`} />;
      case 'shop':
        return <Store className={`${className} text-orange-600`} />;
      case 'warehouse':
        return <Warehouse className={`${className} text-brown-600`} />;
      case 'farmhouse':
        return <TreePine className={`${className} text-green-700`} />;
      default:
        return <Home className={`${className} text-gray-600`} />;
    }
  };

  return getIcon();
};