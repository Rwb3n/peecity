/**
 * @fileoverview MarkerPopup molecule component - Displays toilet information in a popup
 * @see {@link file://./docs/explanations/frontend-ui-spec.md} for component specifications
 */

import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import { 
  X, 
  MapPin, 
  CheckCircle2 as Check, 
  ChevronUp, 
  ChevronDown, 
  Navigation, 
  AlertTriangle, 
  Share2 as Share,
  Accessibility
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToiletFeatures {
  babyChange?: boolean;
  radar?: boolean;
  automatic?: boolean;
  contactless?: boolean;
}

export interface Toilet {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  hours: string;
  accessible: boolean;
  fee: number;
  features?: ToiletFeatures;
  distance?: number;
  source?: string;
  last_verified_at?: string;
  reported?: boolean;
  reportedIssue?: string;
}

export interface MarkerPopupProps {
  toilet: Toilet;
  onDirections?: (toilet: Toilet) => void;
  onReport?: (toiletId: string) => void;
  onShare?: (toilet: Toilet) => void;
  onClose?: () => void;
  loading?: boolean;
  compact?: boolean;
  className?: string;
}

export const MarkerPopup: React.FC<MarkerPopupProps> = ({
  toilet,
  onDirections,
  onReport,
  onShare,
  onClose,
  loading = false,
  compact = false,
  className,
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const formatFee = (fee: number) => {
    return fee === 0 ? 'Free' : `£${fee.toFixed(2)}`;
  };

  const activeFeatures = Object.entries(toilet.features || {})
    .filter(([_, value]) => value)
    .map(([key]) => {
      const featureNames: Record<string, string> = {
        babyChange: 'Baby changing',
        radar: 'RADAR key',
        automatic: 'Automatic',
        contactless: 'Contactless payment',
      };
      return featureNames[key] || key;
    });

  return (
    <div
      data-testid="marker-popup"
      className={cn(
        'bg-white rounded-lg shadow-lg p-4 space-y-4 max-w-[calc(100vw-2rem)] sm:max-w-sm',
        className
      )}
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold leading-tight">
            {toilet.name}
          </h3>
          {toilet.address && !compact && (
            <p className="text-sm text-gray-600 mt-1">{toilet.address}</p>
          )}
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close popup"
            className="h-8 w-8 p-0 -mt-1 -mr-1"
          >
            <Icon icon={X} size="sm" />
          </Button>
        )}
      </div>

      {/* Reported warning */}
      {toilet.reported && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ Issue reported: {toilet.reportedIssue || 'Unknown issue'}
          </p>
        </div>
      )}

      {/* Core info */}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium">Open:</span>
          <span>{toilet.hours}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium">Fee:</span>
          <span className={toilet.fee === 0 ? 'text-green-600 font-medium' : ''}>
            {formatFee(toilet.fee)}
          </span>
        </div>

        {toilet.distance !== undefined && (
          <div className="flex items-center gap-2">
            <Icon icon={MapPin} size="sm" className="text-gray-500" />
            <span>{toilet.distance} km away</span>
          </div>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {toilet.accessible && (
          <Badge 
            variant="success" 
            data-testid="accessibility-badge"
          >
            <Icon icon={Accessibility} size="sm" className="mr-1" />
            Accessible
          </Badge>
        )}
      </div>

      {/* Features */}
      {activeFeatures.length > 0 && (
        <ul role="list" aria-label="Features" className="space-y-1">
          {activeFeatures.map((feature) => (
            <li key={feature} className="flex items-center gap-2 text-sm">
              <Icon icon={Check} size="sm" className="text-green-600" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      )}

      {/* Last verified - shown only when not compact */}
      {!compact && toilet.last_verified_at && (
        <div className="text-sm">
          <span className="font-medium">Last verified: </span>
          {formatDate(toilet.last_verified_at)}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        {onDirections && (
          <Button
            size="sm"
            onClick={() => onDirections(toilet)}
            disabled={loading}
            aria-label={`Get directions to ${toilet.name}`}
            aria-busy={loading}
            className="flex-1 min-h-[44px] w-full sm:w-auto"
          >
            <Icon icon={Navigation} size="sm" className="mr-1" />
            <span className="hidden xs:inline">Get directions</span>
            <span className="xs:hidden">Directions</span>
          </Button>
        )}
        
        {onReport && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReport(toilet.id)}
            disabled={loading}
            aria-label="Report an issue with this toilet"
            aria-busy={loading}
            className="flex-1 min-h-[44px] w-full sm:w-auto"
          >
            <Icon icon={AlertTriangle} size="sm" className="mr-1" />
            <span className="hidden xs:inline">Report issue</span>
            <span className="xs:hidden">Report</span>
          </Button>
        )}
      </div>

      {/* Expandable details */}
      {!compact && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? 'Show less details' : 'Show more details'}
            className="w-full justify-center"
          >
            {expanded ? 'show less' : 'show more'}
            <Icon 
              icon={expanded ? ChevronUp : ChevronDown} 
              size="sm" 
              className="ml-1" 
            />
          </Button>

          {expanded && (
            <div className="space-y-2 text-sm pt-2 border-t">
              {toilet.source && (
                <div>
                  <span className="font-medium">Source:</span> {toilet.source}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Share button separate */}
      {onShare && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onShare(toilet)}
          disabled={loading}
          aria-label="Share this toilet location"
          className="min-h-[44px]"
        >
          <Icon icon={Share} size="sm" />
          Share
        </Button>
      )}
    </div>
  );
};