import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Download } from 'lucide-react';
import { Property } from '@/types/property';
import { PropertyIcon } from './PropertyIcon';
import { useToast } from '@/hooks/use-toast';

interface SharePropertyProps {
  property: Property;
}

export const ShareProperty = ({ property }: SharePropertyProps) => {
  const [generating, setGenerating] = useState(false);
  const { toast } = useToast();

  const formatRate = (rate: number, rateType: Property['rateType']) => {
    if (rate === 0) return 'Price on request';
    
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(rate);

    switch (rateType) {
      case 'per_sqft': return `${formatted}/sq ft`;
      case 'per_acre': return `${formatted}/acre`;
      default: return formatted;
    }
  };

  const generateShareableImage = async () => {
    setGenerating(true);
    
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas not supported');

      // Set canvas size
      canvas.width = 800;
      canvas.height = 600;

      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Header background
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, 120);

      // Property type and title
      ctx.fillStyle = '#1e293b';
      ctx.font = 'bold 36px Arial';
      ctx.fillText(property.type.charAt(0).toUpperCase() + property.type.slice(1), 40, 60);
      
      // Location
      ctx.fillStyle = '#64748b';
      ctx.font = '24px Arial';
      ctx.fillText(property.location || 'Location not specified', 40, 95);

      // Main content area
      let yPos = 180;

      // Rate
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 32px Arial';
      ctx.fillText('Rate: ' + formatRate(property.rate, property.rateType), 40, yPos);
      yPos += 50;

      // Size
      if (property.size > 0) {
        ctx.fillStyle = '#1e293b';
        ctx.font = '24px Arial';
        ctx.fillText(`Size: ${property.size.toLocaleString()} ${property.sizeUnit}`, 40, yPos);
        yPos += 40;
      }

      // Owner info
      if (property.ownerName) {
        ctx.fillStyle = '#64748b';
        ctx.font = '20px Arial';
        ctx.fillText(`Owner: ${property.ownerName}`, 40, yPos);
        yPos += 35;
      }

      if (property.ownerContact) {
        ctx.fillText(`Contact: ${property.ownerContact}`, 40, yPos);
        yPos += 35;
      }

      // Notes
      if (property.notes) {
        ctx.fillStyle = '#64748b';
        ctx.font = '18px Arial';
        const words = property.notes.split(' ');
        let line = '';
        const maxWidth = 720;
        
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          const testWidth = metrics.width;
          
          if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, 40, yPos);
            line = words[n] + ' ';
            yPos += 25;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 40, yPos);
      }

      // Footer
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, canvas.height - 80, canvas.width, 80);
      
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Arial';
      ctx.fillText('Generated with Property Ledger', 40, canvas.height - 30);

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `property-${property.type}-${Date.now()}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast({
            title: "Image saved",
            description: "Property card image has been downloaded to your device."
          });
        }
      }, 'image/png');

    } catch (error) {
      toast({
        title: "Generation failed",
        description: "Failed to generate shareable image.",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  const shareToWhatsApp = () => {
    const text = `🏠 ${property.type.charAt(0).toUpperCase() + property.type.slice(1)} Property
📍 ${property.location}
💰 ${formatRate(property.rate, property.rateType)}
${property.size > 0 ? `📐 ${property.size.toLocaleString()} ${property.sizeUnit}` : ''}
${property.ownerName ? `👤 ${property.ownerName}` : ''}
${property.ownerContact ? `📞 ${property.ownerContact}` : ''}

Shared via Property Ledger`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={shareToWhatsApp}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        WhatsApp
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={generateShareableImage}
        disabled={generating}
        className="gap-2"
      >
        <Download className="h-4 w-4" />
        {generating ? 'Generating...' : 'Save Image'}
      </Button>
    </div>
  );
};