// Advanced Image Optimization and Loading System
// 2GoWhere - Performance Enhanced Image Loading

class AdvancedImageOptimizer {
  constructor() {
    this.connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    this.devicePixelRatio = window.devicePixelRatio || 1;
    this.viewportWidth = window.innerWidth;
    this.imageCache = new Map();
    this.loadingQueue = [];
    this.maxConcurrentLoads = 6;
    this.currentLoads = 0;
    
    this.init();
  }
  
  init() {
    this.detectConnectionSpeed();
    this.setupIntersectionObserver();
    this.handleViewportChanges();
  }
  
  detectConnectionSpeed() {
    if (this.connection) {
      const effectiveType = this.connection.effectiveType;
      
      switch (effectiveType) {
        case 'slow-2g':
        case '2g':
          this.qualityLevel = 'low';
          this.maxConcurrentLoads = 2;
          break;
        case '3g':
          this.qualityLevel = 'medium';
          this.maxConcurrentLoads = 4;
          break;
        case '4g':
        default:
          this.qualityLevel = 'high';
          this.maxConcurrentLoads = 6;
          break;
      }
    } else {
      this.qualityLevel = 'medium';
    }
    
    console.log(`📶 Connection detected: ${this.qualityLevel} quality`);
  }
  
  setupIntersectionObserver() {
    const options = {
      root: null,
      rootMargin: this.qualityLevel === 'low' ? '10px' : '50px',
      threshold: 0.1
    };
    
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.queueImageLoad(entry.target);
          this.observer.unobserve(entry.target);
        }
      });
    }, options);
  }
  
  observeImage(img) {
    if (this.observer && img.dataset.src) {
      this.observer.observe(img);
    }
  }
  
  queueImageLoad(img) {
    this.loadingQueue.push(img);
    this.processQueue();
  }
  
  processQueue() {
    if (this.currentLoads >= this.maxConcurrentLoads || this.loadingQueue.length === 0) {
      return;
    }
    
    const img = this.loadingQueue.shift();
    this.currentLoads++;
    
    this.loadImage(img).finally(() => {
      this.currentLoads--;
      this.processQueue();
    });
  }
  
  async loadImage(img) {
    const startTime = performance.now();
    
    try {
      const optimizedSrc = this.getOptimizedImageUrl(img);
      const cachedImage = this.imageCache.get(optimizedSrc);
      
      if (cachedImage) {
        this.applyImage(img, cachedImage);
        return;
      }
      
      // Show loading indicator
      this.showLoadingIndicator(img);
      
      // Create and load image
      const imageElement = new Image();
      
      // Set up progressive loading for supported formats
      if (this.supportsWebP()) {
        imageElement.src = optimizedSrc.replace(/\.(jpg|jpeg|png)/i, '.webp');
      } else {
        imageElement.src = optimizedSrc;
      }
      
      await new Promise((resolve, reject) => {
        imageElement.onload = resolve;
        imageElement.onerror = () => {
          // Fallback to original format if WebP fails
          if (imageElement.src.includes('.webp')) {
            imageElement.src = optimizedSrc;
            imageElement.onload = resolve;
            imageElement.onerror = reject;
          } else {
            reject(new Error('Image failed to load'));
          }
        };
      });
      
      // Cache the loaded image
      this.imageCache.set(optimizedSrc, imageElement.src);
      
      // Apply the image
      this.applyImage(img, imageElement.src);
      
      // Log performance
      const loadTime = performance.now() - startTime;
      console.log(`🖼️ Image loaded in ${loadTime.toFixed(2)}ms:`, optimizedSrc);
      
    } catch (error) {
      console.error('❌ Image load failed:', error);
      this.handleImageError(img);
    } finally {
      this.hideLoadingIndicator(img);
    }
  }
  
  getOptimizedImageUrl(img) {
    const baseSrc = img.dataset.src;
    
    if (!baseSrc.includes('unsplash.com')) {
      return baseSrc;
    }
    
    const params = new URLSearchParams();
    
    // Determine optimal dimensions
    const rect = img.getBoundingClientRect();
    const optimalWidth = Math.ceil(rect.width * this.devicePixelRatio);
    const optimalHeight = Math.ceil(rect.height * this.devicePixelRatio);
    
    // Quality based on connection and device
    let quality;
    switch (this.qualityLevel) {
      case 'low':
        quality = 60;
        break;
      case 'medium':
        quality = 75;
        break;
      case 'high':
      default:
        quality = 85;
        break;
    }
    
    // Reduce quality for high DPI screens on slow connections
    if (this.devicePixelRatio > 1 && this.qualityLevel === 'low') {
      quality = 50;
    }
    
    params.set('w', Math.min(optimalWidth, 1200));
    params.set('h', Math.min(optimalHeight, 800));
    params.set('fit', 'crop');
    params.set('auto', 'format');
    params.set('q', quality);
    
    return baseSrc.split('?')[0] + '?' + params.toString();
  }
  
  applyImage(img, src) {
    // Set responsive attributes if available
    if (img.dataset.srcset) {
      img.srcset = img.dataset.srcset;
    }
    if (img.dataset.sizes) {
      img.sizes = img.dataset.sizes;
    }
    
    img.src = src;
    img.classList.add('loaded');
    
    // Clean up data attributes
    delete img.dataset.src;
    delete img.dataset.srcset;
    delete img.dataset.sizes;
    
    // Trigger fade-in animation
    requestAnimationFrame(() => {
      img.style.opacity = '1';
    });
  }
  
  showLoadingIndicator(img) {
    const indicator = img.parentNode.querySelector('.image-loading-indicator');
    if (indicator) {
      indicator.style.display = 'block';
    }
  }
  
  hideLoadingIndicator(img) {
    const indicator = img.parentNode.querySelector('.image-loading-indicator');
    if (indicator) {
      indicator.style.display = 'none';
    }
  }
  
  handleImageError(img) {
    img.classList.add('error');
    
    // Set fallback image
    const fallbackSvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23333'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23666' font-size='14'%3EImage unavailable%3C/text%3E%3C/svg%3E`;
    img.src = fallbackSvg;
  }
  
  supportsWebP() {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  }
  
  handleViewportChanges() {
    let resizeTimeout;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.viewportWidth = window.innerWidth;
        // Re-observe images that might need different sizes
        this.refreshImages();
      }, 250);
    });
  }
  
  refreshImages() {
    const images = document.querySelectorAll('.lazy-image:not(.loaded)');
    images.forEach(img => {
      if (img.dataset.src) {
        this.observeImage(img);
      }
    });
  }
  
  // Public method to initialize images
  initializeImages() {
    const images = document.querySelectorAll('.lazy-image');
    images.forEach(img => {
      if (img.dataset.src) {
        this.observeImage(img);
      }
    });
  }
  
  // Clean up resources
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.imageCache.clear();
    this.loadingQueue = [];
  }
}

// Initialize the image optimizer when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.imageOptimizer = new AdvancedImageOptimizer();
    window.imageOptimizer.initializeImages();
  });
} else {
  window.imageOptimizer = new AdvancedImageOptimizer();
  window.imageOptimizer.initializeImages();
}

console.log('🚀 Advanced Image Optimizer loaded successfully!');