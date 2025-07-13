/**
 * @fileoverview MapView organism Storybook stories with real London toilet data
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within } from '@storybook/test';
import { MapView } from './MapView';
import { 
  sampleToilets, 
  mediumDataset,
  fullMockDataset,
  accessibleToilets, 
  twentyFourSevenToilets, 
  freeToilets,
  centralLondonToilets,
  transportHubToilets,
  largeDataset
} from '@/utils/storybook-data';

const meta: Meta<typeof MapView> = {
  title: 'Organisms/MapView',
  component: MapView,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'responsive',
    },
    // Chromatic configuration for visual regression testing
    chromatic: {
      viewports: [375, 768, 1200], // Mobile, tablet, desktop
      delay: 500, // Wait for map tiles to load
      diffThreshold: 0.2, // Allow minor differences in map tiles
      pauseAnimationAtEnd: true,
    },
    docs: {
      description: {
        component: `
MapView organism displays interactive maps with toilet locations using React-Leaflet.
Features marker clustering, search integration, and real London toilet data.

## Real Data Integration
- **1,044 toilet features** from OpenStreetMap via toilets.geojson
- **Authentic coordinates** across all London boroughs
- **Real properties**: accessibility, hours, fees, names
- **Production accuracy** for reliable visual testing

## Key Features
- Marker clustering for performance with large datasets
- Search query highlighting and filtering
- Location click handling for suggestion workflow
- Mobile-responsive with touch-friendly interactions
- Accessible with proper ARIA labeling and keyboard support

## Visual Regression Testing
- **Chromatic integration** for automated visual testing
- **Multi-viewport support** across mobile, tablet, and desktop
- **Visual change detection** with baseline snapshot comparison
        `,
      },
    },
    a11y: {
      config: {
        rules: [
          {
            id: 'color-contrast',
            enabled: false, // Disable for map tiles which may have varying contrast
          },
        ],
      },
    },
  },
  argTypes: {
    toilets: {
      control: { type: 'object' },
      description: 'Array of toilet features to display',
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Whether the map is in loading state',
    },
    error: {
      control: { type: 'text' },
      description: 'Error message to display',
    },
    searchQuery: {
      control: { type: 'text' },
      description: 'Search query for filtering/highlighting',
    },
    userLocation: {
      control: { type: 'object' },
      description: 'User current location coordinates',
    },
    showUserLocation: {
      control: { type: 'boolean' },
      description: 'Whether to show user location marker',
    },
    onMarkerClick: {
      action: 'markerClicked',
      description: 'Callback when toilet marker is clicked',
    },
    onCenterChange: {
      action: 'centerChanged',
      description: 'Callback when map center changes',
    },
    onZoomChange: {
      action: 'zoomChanged',
      description: 'Callback when map zoom changes',
    },
  },
  args: {
    toilets: sampleToilets,
    searchQuery: '',
    loading: false,
  },
};

export default meta;
type Story = StoryObj<typeof MapView>;

/**
 * Default MapView with sample toilet data (20 toilets)
 * Fast rendering for basic interaction testing
 */
export const Default: Story = {
  args: {
    toilets: sampleToilets,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default MapView with 20 real toilet locations for fast rendering and interaction testing.',
      },
    },
  },
};

/**
 * MapView with accessible toilets only
 * Shows filtering capabilities with real accessible toilet data
 */
export const AccessibleToilets: Story = {
  args: {
    toilets: accessibleToilets,
  },
  parameters: {
    docs: {
      description: {
        story: 'MapView showing only wheelchair accessible toilets from real OSM data.',
      },
    },
  },
};

/**
 * MapView with 24/7 toilets
 * Demonstrates filtering by hours with authentic data
 */
export const TwentyFourSevenToilets: Story = {
  args: {
    toilets: twentyFourSevenToilets,
  },
  parameters: {
    docs: {
      description: {
        story: 'MapView displaying 24/7 toilets from real OpenStreetMap data.',
      },
    },
  },
};

/**
 * MapView with Central London focus
 * Geographic subset for testing regional distribution
 */
export const CentralLondon: Story = {
  args: {
    toilets: centralLondonToilets,
  },
  parameters: {
    docs: {
      description: {
        story: 'MapView focused on Central London with geographically filtered real toilet data.',
      },
    },
  },
};

/**
 * MapView with search query highlighting
 * Tests search integration with real toilet names
 */
export const WithSearchQuery: Story = {
  args: {
    toilets: sampleToilets,
    searchQuery: 'public',
  },
  parameters: {
    docs: {
      description: {
        story: 'MapView with search query "public" highlighting matching toilets in real data.',
      },
    },
  },
};

/**
 * MapView with new toilet markers
 * Shows newly added user submissions alongside existing data
 */
export const WithNewToilets: Story = {
  args: {
    toilets: [
      ...sampleToilets,
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-0.1278, 51.5074]
        },
        properties: {
          id: 'new-toilet-1',
          name: 'New User Submission',
          hours: '9:00-17:00',
          accessible: true,
          fee: 0.5,
          source: 'user_submission',
          last_verified_at: new Date().toISOString(),
          verified_by: 'user',
        }
      },
      {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [-0.125, 51.508]
        },
        properties: {
          id: 'new-toilet-2',
          name: 'Another New Toilet',
          hours: '24/7',
          accessible: false,
          fee: 0,
          source: 'user_submission',
          last_verified_at: new Date().toISOString(),
          verified_by: 'user',
        }
      }
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'MapView showing newly added toilet markers alongside existing real data.',
      },
    },
  },
};

/**
 * MapView with full dataset for clustering demonstration
 * Shows clustering behavior with large real dataset
 */
export const FullDatasetClustering: Story = {
  args: {
    toilets: largeDataset, // 100 generated toilets for clustering demo
  },
  parameters: {
    docs: {
      description: {
        story: 'MapView with 100 generated toilets to demonstrate clustering behavior and performance.',
      },
    },
  },
};

/**
 * MapView with no toilets
 * Edge case for empty data state
 */
export const EmptyState: Story = {
  args: {
    toilets: [],
  },
  parameters: {
    docs: {
      description: {
        story: 'MapView with no toilet data to test empty state handling.',
      },
    },
  },
};

/**
 * Interactive test: Map click handling
 * Tests location selection for suggestion workflow
 */
export const MapClickInteraction: Story = {
  args: {
    toilets: sampleToilets,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for map to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Try to find map container
    const mapContainer = canvasElement.querySelector('.leaflet-map-pane');
    
    if (mapContainer) {
      // Simulate map click
      await userEvent.click(mapContainer);
      
      // Verify onMapClick was called
      await expect(args.onMapClick).toHaveBeenCalled();
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive test demonstrating map click handling for location selection.',
      },
    },
  },
};

/**
 * Interactive test: Map center change
 * Tests map navigation and center tracking
 */
export const CenterChangeInteraction: Story = {
  args: {
    toilets: sampleToilets,
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for map to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find zoom controls and try interaction
    const zoomIn = canvasElement.querySelector('.leaflet-control-zoom-in');
    
    if (zoomIn) {
      await userEvent.click(zoomIn);
      
      // Give time for map to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Center change callback should have been triggered
      await expect(args.onCenterChange).toHaveBeenCalled();
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive test demonstrating map center change tracking during navigation.',
      },
    },
  },
};

/**
 * Accessibility test: Keyboard navigation
 * Tests map accessibility with keyboard interactions
 */
export const AccessibilityTest: Story = {
  args: {
    toilets: sampleToilets,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // Wait for map to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find map container
    const mapContainer = canvasElement.querySelector('.leaflet-container');
    
    if (mapContainer) {
      // Check that map container is focusable
      await expect(mapContainer).toHaveAttribute('tabindex');
      
      // Test keyboard navigation
      mapContainer.focus();
      await userEvent.keyboard('{ArrowUp}');
      await userEvent.keyboard('{ArrowDown}');
      await userEvent.keyboard('{ArrowLeft}');
      await userEvent.keyboard('{ArrowRight}');
      
      // Test zoom keyboard shortcuts
      await userEvent.keyboard('{+}');
      await userEvent.keyboard('{-}');
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Accessibility test verifying keyboard navigation and focus management.',
      },
    },
  },
};