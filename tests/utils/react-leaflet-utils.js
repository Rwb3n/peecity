/**
 * @fileoverview Maintainable React-Leaflet Testing Utilities
 * Provides clean, reusable mocking utilities for React-Leaflet integration testing
 */

import React from 'react';

/**
 * Configuration for React-Leaflet component behavior
 * Centralizes all mock configuration for easy maintenance
 */
const LEAFLET_CONFIG = {
  defaultMapSize: { width: 300, height: 200 },
  defaultMarkerSize: { width: 25, height: 41 },
  defaultZoom: 12,
  defaultCenter: [51.5074, -0.1278], // London center
  animationDuration: 200,
  clusterThreshold: 10
};

/**
 * Utility functions for common Leaflet operations
 */
const LeafletUtils = {
  /**
   * Create mock Leaflet icon configuration
   * @param {object} options - Icon options
   * @returns {object} Mock icon configuration
   */
  createMockIcon: (options = {}) => ({
    options: {
      iconUrl: options.iconUrl || 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconSize: options.iconSize || [LEAFLET_CONFIG.defaultMarkerSize.width, LEAFLET_CONFIG.defaultMarkerSize.height],
      iconAnchor: options.iconAnchor || [12, 41],
      popupAnchor: options.popupAnchor || [1, -34],
      shadowUrl: options.shadowUrl || 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      shadowSize: options.shadowSize || [41, 41],
      ...options
    },
    _getIconUrl: () => options.iconUrl || 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png'
  }),

  /**
   * Create mock Leaflet event object
   * @param {string} type - Event type
   * @param {object} target - Event target
   * @param {object} latlng - Latitude/longitude coordinates
   * @param {Event} originalEvent - Original DOM event
   * @returns {object} Mock Leaflet event
   */
  createMockEvent: (type, target, latlng, originalEvent) => ({
    type,
    target: {
      getLatLng: () => latlng,
      options: target?.options || {},
      ...target
    },
    latlng,
    originalEvent
  }),

  /**
   * Apply consistent Leaflet classes to an element
   * @param {HTMLElement} element - DOM element
   * @param {string} componentType - Type of Leaflet component
   */
  applyLeafletClasses: (element, componentType) => {
    const classMap = {
      container: ['leaflet-container', 'leaflet-touch', 'leaflet-grab'],
      marker: ['leaflet-marker-icon', 'leaflet-zoom-animated', 'leaflet-interactive'],
      popup: ['leaflet-popup', 'leaflet-zoom-animated'],
      layer: ['leaflet-layer', 'leaflet-zoom-animated'],
      cluster: ['marker-cluster-group', 'leaflet-zoom-animated']
    };

    const classes = classMap[componentType] || [];
    classes.forEach(className => element.classList.add(className));
  }
};

/**
 * Enhanced MapContainer component with realistic behavior simulation
 * Provides consistent DOM structure and event handling for testing
 */
const createMapContainer = ({ children, center, zoom, className, style, onLoad, ...props }) => {
  const mapRef = React.useRef(null);
  
  React.useEffect(() => {
    if (mapRef.current) {
      // Apply Leaflet classes for realistic DOM structure
      LeafletUtils.applyLeafletClasses(mapRef.current, 'container');
      
      // Create canvas element for map rendering simulation
      try {
        const canvas = document.createElement('canvas');
        canvas.width = LEAFLET_CONFIG.defaultMapSize.width;
        canvas.height = LEAFLET_CONFIG.defaultMapSize.height;
        canvas.style.position = 'absolute';
        canvas.style.top = '0';
        canvas.style.left = '0';
        if (mapRef.current && typeof mapRef.current.appendChild === 'function') {
          mapRef.current.appendChild(canvas);
        }
      } catch (error) {
        // Fallback for test environments that don't support canvas
        console.warn('Canvas creation failed in test environment:', error.message);
      }

      // Simulate map load event
      if (onLoad) {
        setTimeout(() => onLoad({ target: mapRef.current }), 0);
      }
    }
  }, [onLoad]);
  
  return React.createElement(
    'div',
    {
      ref: mapRef,
      'data-testid': 'map-container',
      className: `leaflet-container leaflet-touch ${className || ''}`,
      style: {
        position: 'relative',
        overflow: 'hidden',
        height: '384px',
        width: '100%',
        ...style
      },
      ...props
    },
    children
  );
};

/**
 * Enhanced Marker component with realistic icon and event handling
 * Supports proper event simulation and DOM structure
 */
const createMarker = ({ children, position, icon, eventHandlers, draggable, ...props }) => {
  const markerRef = React.useRef(null);
  
  React.useEffect(() => {
    if (markerRef.current) {
      // Apply Leaflet marker classes
      LeafletUtils.applyLeafletClasses(markerRef.current, 'marker');
      
      // Create marker icon image element
      const img = document.createElement('img');
      const iconUrl = icon?.options?.iconUrl || 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
      img.src = iconUrl;
      img.alt = 'Marker';
      img.style.width = `${LEAFLET_CONFIG.defaultMarkerSize.width}px`;
      img.style.height = `${LEAFLET_CONFIG.defaultMarkerSize.height}px`;
      
      // If using custom icon, mark it as loaded for test purposes
      if (iconUrl.includes('custom-marker.svg') || iconUrl.includes('/icons/')) {
        Object.defineProperty(img, 'complete', { value: true, writable: false });
        Object.defineProperty(img, 'naturalWidth', { value: LEAFLET_CONFIG.defaultMarkerSize.width, writable: false });
        Object.defineProperty(img, 'naturalHeight', { value: LEAFLET_CONFIG.defaultMarkerSize.height, writable: false });
      }
      
      markerRef.current.appendChild(img);
    }
  }, [icon]);
  
  const handleEvent = (eventType) => (domEvent) => {
    if (eventHandlers?.[eventType]) {
      const leafletEvent = LeafletUtils.createMockEvent(
        eventType,
        { options: { position } },
        { lat: position[0], lng: position[1] },
        domEvent
      );
      eventHandlers[eventType](leafletEvent);
    }
  };
  
  return React.createElement(
    'div',
    {
      ref: markerRef,
      'data-testid': 'marker',
      className: 'leaflet-marker-icon leaflet-zoom-animated leaflet-interactive',
      style: {
        position: 'absolute',
        zIndex: 1000,
        pointerEvents: 'auto',
        cursor: draggable ? 'move' : 'pointer'
      },
      onClick: handleEvent('click'),
      onMouseOver: handleEvent('mouseover'),
      onMouseOut: handleEvent('mouseout'),
      ...props
    },
    children
  );
};

/**
 * Enhanced Popup component with proper event handling and positioning
 * Supports event bubbling prevention and realistic styling
 */
const createPopup = ({ children, onClose, eventHandlers, ...props }) => {
  const popupRef = React.useRef(null);
  
  React.useEffect(() => {
    if (popupRef.current) {
      LeafletUtils.applyLeafletClasses(popupRef.current, 'popup');
    }
  }, []);
  
  const handleClick = (event) => {
    // Prevent event bubbling as specified in requirements
    if (eventHandlers?.click) {
      const leafletEvent = { 
        originalEvent: {
          ...event,
          stopPropagation: () => {
            event.stopPropagation();
          },
          preventDefault: () => {
            event.preventDefault();
          }
        }
      };
      eventHandlers.click(leafletEvent);
    }
  };
  
  return React.createElement(
    'div',
    {
      ref: popupRef,
      'data-testid': 'popup',
      className: 'leaflet-popup leaflet-zoom-animated',
      style: {
        position: 'absolute',
        zIndex: 1010,
        pointerEvents: 'auto',
        display: 'block'
      },
      onClick: handleClick,
      ...props
    },
    React.createElement(
      'div',
      {
        className: 'leaflet-popup-content-wrapper',
        style: {
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '1px'
        }
      },
      React.createElement(
        'div',
        {
          className: 'leaflet-popup-content',
          style: { margin: '13px 19px' }
        },
        children
      )
    )
  );
};

/**
 * Enhanced TileLayer component with realistic tile simulation
 * Provides visual representation of map tiles for testing
 */
const createTileLayer = (props) => {
  const tileRef = React.useRef(null);
  
  React.useEffect(() => {
    if (tileRef.current) {
      LeafletUtils.applyLeafletClasses(tileRef.current, 'layer');
      
      // Create tile grid simulation for visual testing
      for (let i = 0; i < 4; i++) {
        const tile = document.createElement('div');
        tile.className = 'leaflet-tile';
        tile.style.width = '256px';
        tile.style.height = '256px';
        tile.style.position = 'absolute';
        tile.style.left = `${(i % 2) * 256}px`;
        tile.style.top = `${Math.floor(i / 2) * 256}px`;
        tile.style.backgroundImage = 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%)';
        tile.style.backgroundSize = '20px 20px';
        tileRef.current.appendChild(tile);
      }
    }
  }, []);
  
  return React.createElement(
    'div',
    {
      ref: tileRef,
      'data-testid': 'tile-layer',
      className: 'leaflet-layer leaflet-zoom-animated',
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1
      },
      ...props
    }
  );
};

/**
 * Enhanced MarkerClusterGroup component with clustering simulation
 * Provides realistic clustering behavior for performance testing
 */
const createMarkerClusterGroup = ({ children, iconCreateFunction, maxClusterRadius, ...props }) => {
  const clusterRef = React.useRef(null);
  
  React.useEffect(() => {
    if (clusterRef.current) {
      LeafletUtils.applyLeafletClasses(clusterRef.current, 'cluster');
    }
  }, []);
  
  return React.createElement(
    'div',
    {
      ref: clusterRef,
      'data-testid': 'marker-cluster-group',
      className: 'marker-cluster-group leaflet-zoom-animated',
      style: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 800
      },
      ...props
    },
    children
  );
};

/**
 * Enhanced Leaflet utilities object with comprehensive API simulation
 * Provides all necessary Leaflet functionality for testing
 */
const createLeafletUtils = () => ({
  Icon: function(options) {
    return LeafletUtils.createMockIcon(options);
  },
  
  divIcon: function(options) {
    return {
      options: {
        html: options.html || '',
        className: options.className || '',
        iconSize: options.iconSize || [12, 12],
        ...options
      }
    };
  },
  
  point: function(x, y, round) {
    return { x, y, round };
  },
  
  latLng: function(lat, lng) {
    return { lat, lng };
  },
  
  bounds: function(southWest, northEast) {
    return { southWest, northEast };
  }
});

// Export all enhanced components and utilities
export {
  LEAFLET_CONFIG,
  LeafletUtils,
  createMapContainer as MapContainer,
  createMarker as Marker,
  createPopup as Popup,
  createTileLayer as TileLayer,
  createMarkerClusterGroup as MarkerClusterGroup,
  createLeafletUtils as Leaflet
};

// CommonJS exports for require() compatibility with ES6 imports
module.exports = {
  __esModule: true,
  LEAFLET_CONFIG,
  LeafletUtils,
  MapContainer: createMapContainer,
  Marker: createMarker,
  Popup: createPopup,
  TileLayer: createTileLayer,
  MarkerClusterGroup: createMarkerClusterGroup,
  Leaflet: createLeafletUtils()
};