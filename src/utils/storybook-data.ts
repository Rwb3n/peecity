/**
 * @fileoverview Storybook data utilities for consistent real data integration
 * @see {@link file://./docs/frontend-ui-spec.md} for component specifications
 */

import type { ToiletFeature } from '@/types/geojson';

// Import real toilet data - Note: In production this would import the actual file
// For now we'll use a representative sample from the real data
export const mockToiletFeatures: ToiletFeature[] = [
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.3323747, 51.4087329]
    },
    properties: {
      id: "osm_node_20849686",
      name: "Public Toilets",
      hours: "24/7",
      accessible: false,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.3360281, 51.4059121]
    },
    properties: {
      id: "osm_node_20910215",
      name: "Public Toilets",
      hours: "24/7",
      accessible: false,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1322444, 51.4946389]
    },
    properties: {
      id: "osm_node_21234567",
      name: "Station Facilities",
      hours: "06:00-23:00",
      accessible: true,
      fee: 0.2,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1278, 51.5074]
    },
    properties: {
      id: "osm_node_central_london",
      name: "Central London Facility",
      hours: "24/7",
      accessible: true,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.0197, 51.5051]
    },
    properties: {
      id: "osm_node_canary_wharf",
      name: "Canary Wharf Toilets",
      hours: "07:00-22:00",
      accessible: true,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.4543, 51.4700]
    },
    properties: {
      id: "osm_node_heathrow",
      name: "Airport Terminal Facilities",
      hours: "24/7",
      accessible: true,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.0876, 51.5152]
    },
    properties: {
      id: "osm_node_liverpool_st",
      name: "Liverpool Street Station",
      hours: "05:00-01:00",
      accessible: true,
      fee: 0.3,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1419, 51.5007]
    },
    properties: {
      id: "osm_node_westminster",
      name: "Westminster Underground",
      hours: "06:00-00:30",
      accessible: true,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1967, 51.5033]
    },
    properties: {
      id: "osm_node_paddington",
      name: "Paddington Station",
      hours: "05:30-01:00",
      accessible: true,
      fee: 0.2,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.0759, 51.5154]
    },
    properties: {
      id: "osm_node_kings_cross",
      name: "King's Cross Station",
      hours: "05:00-01:30",
      accessible: true,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1551, 51.5016]
    },
    properties: {
      id: "osm_node_victoria",
      name: "Victoria Station",
      hours: "04:45-01:30",
      accessible: true,
      fee: 0.3,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1015, 51.5180]
    },
    properties: {
      id: "osm_node_old_street",
      name: "Old Street Station",
      hours: "06:00-00:00",
      accessible: false,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1340, 51.5118]
    },
    properties: {
      id: "osm_node_oxford_circus",
      name: "Oxford Circus Underground",
      hours: "06:30-00:30",
      accessible: true,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1406, 51.4994]
    },
    properties: {
      id: "osm_node_green_park",
      name: "Green Park Station",
      hours: "06:00-00:00",
      accessible: true,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1053, 51.5205]
    },
    properties: {
      id: "osm_node_angel",
      name: "Angel Station",
      hours: "06:00-00:30",
      accessible: true,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1426, 51.5154]
    },
    properties: {
      id: "osm_node_euston",
      name: "Euston Station",
      hours: "05:00-01:00",
      accessible: true,
      fee: 0.2,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1160, 51.5033]
    },
    properties: {
      id: "osm_node_bank",
      name: "Bank Station",
      hours: "06:00-00:00",
      accessible: true,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1037, 51.5007]
    },
    properties: {
      id: "osm_node_london_bridge",
      name: "London Bridge Station",
      hours: "05:00-01:30",
      accessible: true,
      fee: 0.3,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1953, 51.5154]
    },
    properties: {
      id: "osm_node_marylebone",
      name: "Marylebone Station",
      hours: "05:30-00:30",
      accessible: true,
      fee: 0.2,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  },
  {
    type: "Feature",
    geometry: {
      type: "Point",
      coordinates: [-0.1619, 51.5220]
    },
    properties: {
      id: "osm_node_camden_town",
      name: "Camden Town Station",
      hours: "06:00-00:30",
      accessible: false,
      fee: 0,
      source: "osm",
      last_verified_at: "2025-07-12T22:24:59.360Z",
      verified_by: "ingest-agent"
    }
  }
];

// Create strategic data subsets for different story scenarios
export const sampleToilets = mockToiletFeatures.slice(0, 8); // 8 toilets for fast rendering
export const mediumDataset = mockToiletFeatures.slice(0, 15); // 15 toilets for clustering demo
export const fullMockDataset = mockToiletFeatures; // All 20 mock toilets

export const accessibleToilets = mockToiletFeatures.filter(f => f.properties.accessible === true);
export const twentyFourSevenToilets = mockToiletFeatures.filter(f => f.properties.hours === '24/7');
export const freeToilets = mockToiletFeatures.filter(f => f.properties.fee === 0);
export const paidToilets = mockToiletFeatures.filter(f => f.properties.fee > 0);

// Geographic subsets
export const centralLondonToilets = mockToiletFeatures.filter(f => {
  const [lng, lat] = f.geometry.coordinates;
  return lat >= 51.48 && lat <= 51.53 && lng >= -0.2 && lng <= -0.05;
});

export const transportHubToilets = mockToiletFeatures.filter(f =>
  f.properties.name.includes('Station') || f.properties.name.includes('Terminal')
);

// Generate larger dataset for clustering stress test
export const generateLargeDataset = (baseCount: number = 100): ToiletFeature[] => {
  const large: ToiletFeature[] = [];
  const baseToilets = mockToiletFeatures;
  
  for (let i = 0; i < baseCount; i++) {
    const baseToilet = baseToilets[i % baseToilets.length];
    const variation = {
      ...baseToilet,
      properties: {
        ...baseToilet.properties,
        id: `generated_${i}_${baseToilet.properties.id}`,
        name: `${baseToilet.properties.name} (${i + 1})`,
      },
      geometry: {
        ...baseToilet.geometry,
        coordinates: [
          baseToilet.geometry.coordinates[0] + (Math.random() - 0.5) * 0.02, // Small random offset
          baseToilet.geometry.coordinates[1] + (Math.random() - 0.5) * 0.02,
        ] as [number, number],
      },
    };
    large.push(variation);
  }
  
  return large;
};

export const largeDataset = generateLargeDataset(100);