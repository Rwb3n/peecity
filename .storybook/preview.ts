import type { Preview } from "@storybook/react";
import React from 'react';
import '../src/app/globals.css';

// Ensure animations are enabled globally in Storybook
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    /* Force enable animations in Storybook */
    *, *::before, *::after {
      animation-duration: inherit !important;
      animation-delay: inherit !important;
      animation-iteration-count: inherit !important;
      animation-direction: inherit !important;
      animation-fill-mode: inherit !important;
      animation-play-state: inherit !important;
      animation-name: inherit !important;
      animation-timing-function: inherit !important;
      transition-duration: inherit !important;
      transition-delay: inherit !important;
      transition-timing-function: inherit !important;
      transition-property: inherit !important;
    }
    
    /* Ensure hardware acceleration for smooth animations */
    .transition-all, [class*="transition-"] {
      transform: translateZ(0);
      will-change: transform, opacity;
    }
  `;
  document.head.appendChild(style);
}

// Map container decorator for full-screen map components
const MapDecorator = (Story, context) => {
  if (context.parameters.layout === 'fullscreen' && context.title?.includes('MapView')) {
    return React.createElement(
      'div',
      {
        style: {
          width: '100vw',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }
      },
      React.createElement(Story)
    );
  }
  return React.createElement(Story);
};

// Modal decorator for proper modal rendering
const ModalDecorator = (Story, context) => {
  if (context.title?.includes('SuggestionModal')) {
    return React.createElement(
      'div',
      {
        style: {
          width: '100vw',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden'
        }
      },
      React.createElement(Story)
    );
  }
  return React.createElement(Story);
};

// FAB decorator to ensure animations work in Storybook
const FABDecorator = (Story, context) => {
  if (context.title?.includes('FloatingActionButton')) {
    return React.createElement(
      'div',
      {
        style: {
          width: '100vw',
          height: '100vh',
          position: 'relative',
          overflow: 'hidden',
          transform: 'translateZ(0)' // Force hardware acceleration
        }
      },
      React.createElement(Story)
    );
  }
  return React.createElement(Story);
};

const preview: Preview = {
  decorators: [MapDecorator, ModalDecorator, FABDecorator],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    // Ensure Leaflet CSS loads properly
    viewport: {
      viewports: {
        responsive: {
          name: 'Responsive',
          styles: {
            width: '100%',
            height: '100%',
          },
        },
      },
    },
  },
};

export default preview; 