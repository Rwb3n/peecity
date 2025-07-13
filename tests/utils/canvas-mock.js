/**
 * @fileoverview Optimized Canvas Mock for React-Leaflet Integration Testing
 * Provides efficient canvas rendering simulation for map components in JSDOM environment
 */

/**
 * Lightweight canvas rendering context mock with optimized performance
 * Reuses objects and minimizes memory allocation for better test performance
 */
class OptimizedCanvasRenderingContext2D {
  constructor() {
    // Pre-allocated objects for better performance
    this.canvas = null;
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.font = '10px sans-serif';
    this.textAlign = 'start';
    this.textBaseline = 'alphabetic';
    this.globalAlpha = 1;
    this.globalCompositeOperation = 'source-over';
    
    // Reusable objects to reduce memory allocation
    this._textMetrics = { width: 0 };
    this._imageData = null;
  }

  // Drawing methods (no-ops for performance)
  fillRect() {}
  strokeRect() {}
  clearRect() {}
  fillText() {}
  strokeText() {}
  
  /**
   * Optimized text measurement with reused object
   * @param {string} text - Text to measure
   * @returns {object} Text metrics object
   */
  measureText(text) {
    this._textMetrics.width = text.length * 6; // Simple estimation
    return this._textMetrics;
  }
  
  // Path methods (no-ops for performance)
  beginPath() {}
  closePath() {}
  moveTo() {}
  lineTo() {}
  arc() {}
  arcTo() {}
  quadraticCurveTo() {}
  bezierCurveTo() {}
  fill() {}
  stroke() {}
  
  // Transform methods (no-ops for performance)
  save() {}
  restore() {}
  scale() {}
  rotate() {}
  translate() {}
  transform() {}
  setTransform() {}
  
  // Image methods
  drawImage() {}
  
  /**
   * Optimized image data creation with caching
   * @param {number} width - Image width
   * @param {number} height - Image height
   * @returns {object} Image data object
   */
  createImageData(width, height) {
    // Cache small image data objects to reduce allocation
    if (width <= 100 && height <= 100) {
      if (!this._imageData || this._imageData.width !== width || this._imageData.height !== height) {
        this._imageData = {
          width,
          height,
          data: new Uint8ClampedArray(width * height * 4)
        };
      }
      return this._imageData;
    }
    
    return {
      width,
      height,
      data: new Uint8ClampedArray(width * height * 4)
    };
  }
  
  getImageData(sx, sy, sw, sh) {
    return this.createImageData(sw, sh);
  }
  
  putImageData() {}
  
  // Gradient methods with reused objects
  createLinearGradient() {
    return { addColorStop() {} };
  }
  
  createRadialGradient() {
    return { addColorStop() {} };
  }
  
  // Pattern methods
  createPattern() {
    return {};
  }
  
  // Clipping methods
  clip() {}
  isPointInPath() { return false; }
  isPointInStroke() { return false; }
}

/**
 * Optimized HTML Canvas Element mock with performance improvements
 * Reduces object creation and provides consistent behavior for map testing
 */
class OptimizedHTMLCanvasElement {
  constructor(width = 300, height = 150) {
    this.width = width;
    this.height = height;
    this.style = {};
    
    // Pre-bound methods for better performance
    this.getContext = this.getContext.bind(this);
    this.toDataURL = this.toDataURL.bind(this);
    this.toBlob = this.toBlob.bind(this);
    
    // Cached context for reuse
    this._context2d = null;
  }
  
  /**
   * Optimized context creation with caching
   * @param {string} contextId - Context type identifier
   * @param {object} options - Context options
   * @returns {object|null} Canvas context or null
   */
  getContext(contextId, options) {
    if (contextId === '2d') {
      // Reuse context for better performance
      if (!this._context2d) {
        this._context2d = new OptimizedCanvasRenderingContext2D();
        this._context2d.canvas = this;
      }
      return this._context2d;
    }
    return null;
  }
  
  /**
   * Fast data URL generation for testing
   * @param {string} type - Image type
   * @param {number} quality - Image quality
   * @returns {string} Data URL
   */
  toDataURL(type = 'image/png', quality) {
    // Return minimal valid PNG data URL for performance
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
  
  /**
   * Fast blob creation for testing
   * @param {function} callback - Callback function
   * @param {string} type - Image type
   * @param {number} quality - Image quality
   */
  toBlob(callback, type = 'image/png', quality) {
    // Minimal blob for performance
    const blob = new Blob([new Uint8Array([137, 80, 78, 71])], { type });
    setTimeout(() => callback(blob), 0);
  }
}

/**
 * Optimized Image mock for Leaflet icon loading
 * Provides fast, consistent image simulation for marker testing
 */
class OptimizedImage {
  constructor() {
    this.src = '';
    this.alt = '';
    this.crossOrigin = null;
    this.width = 0;
    this.height = 0;
    this.naturalWidth = 0;
    this.naturalHeight = 0;
    this.complete = false;
    this.loading = 'eager';
    
    // Event handlers
    this.onload = null;
    this.onerror = null;
    
    // Fast simulated loading
    Promise.resolve().then(() => {
      this.width = 25;
      this.height = 41;
      this.naturalWidth = 25;
      this.naturalHeight = 41;
      this.complete = true;
      if (this.onload) this.onload();
    });
  }
  
  addEventListener(event, handler) {
    if (event === 'load') this.onload = handler;
    if (event === 'error') this.onerror = handler;
  }
  
  removeEventListener() {}
}

/**
 * Canvas mock installation utility
 * Optimizes global mock setup for better test performance
 */
const installOptimizedCanvasMocks = () => {
  // Install optimized mocks globally
  global.HTMLCanvasElement = OptimizedHTMLCanvasElement;
  global.CanvasRenderingContext2D = OptimizedCanvasRenderingContext2D;
  global.Image = OptimizedImage;

  // Optimize document.createElement for canvas elements
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName, options) {
    if (tagName.toLowerCase() === 'canvas') {
      return new OptimizedHTMLCanvasElement();
    }
    return originalCreateElement.call(this, tagName, options);
  };
};

module.exports = {
  OptimizedCanvasRenderingContext2D,
  OptimizedHTMLCanvasElement,
  OptimizedImage,
  installOptimizedCanvasMocks
};