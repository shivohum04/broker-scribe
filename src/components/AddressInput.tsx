import { Input } from '@/components/ui/input';

interface AddressInputProps {
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  onChange: (addressLine1: string, addressLine2: string, addressLine3: string) => void;
}

export const AddressInput = ({ addressLine1, addressLine2, addressLine3, onChange }: AddressInputProps) => {
  return (
    <div className="space-y-3">
      <Input
        value={addressLine1}
        onChange={(e) => onChange(e.target.value, addressLine2, addressLine3)}
        placeholder="Address Line 1"
        className="border-input-border focus:border-input-focus transition-colors"
      />
      <Input
        value={addressLine2}
        onChange={(e) => onChange(addressLine1, e.target.value, addressLine3)}
        placeholder="Address Line 2"
        className="border-input-border focus:border-input-focus transition-colors"
      />
      <Input
        value={addressLine3}
        onChange={(e) => onChange(addressLine1, addressLine2, e.target.value)}
        placeholder="Address Line 3"
        className="border-input-border focus:border-input-focus transition-colors"
      />
    </div>
  );
};