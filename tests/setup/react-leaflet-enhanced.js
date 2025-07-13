/**
 * Enhanced React-Leaflet mocking with selective real integration
 * Refactored for maintainability and team adoption
 * @deprecated - Use tests/utils/react-leaflet-utils.js for new implementations
 */

import React from 'react';
import { 
  MapContainer, 
  Marker, 
  Popup, 
  TileLayer, 
  MarkerClusterGroup, 
  Leaflet 
} from '../utils/react-leaflet-utils';

// Re-export enhanced components from centralized utilities
// This maintains backward compatibility while using refactored utilities
export {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  MarkerClusterGroup,
  Leaflet
};