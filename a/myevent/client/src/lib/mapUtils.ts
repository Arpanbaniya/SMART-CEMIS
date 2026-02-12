/**
 * Google Maps URL Utility Functions
 * Converts various Google Maps URL formats to embeddable URLs
 */

export interface MapUrlConversion {
  embedUrl: string;
  originalUrl: string;
  isValid: boolean;
}

/**
 * Converts any Google Maps URL to an embeddable format
 */
export function convertToEmbedUrl(mapUrl: string): MapUrlConversion {
  if (!mapUrl || typeof mapUrl !== 'string') {
    return {
      embedUrl: '',
      originalUrl: mapUrl || '',
      isValid: false
    };
  }

  try {
    const url = new URL(mapUrl);
    
    // Handle Google Maps share URLs (https://share.google/...)
    if (url.hostname === 'share.google') {
      // For share URLs, we need to use a different approach
      // Share URLs typically redirect to full Google Maps URLs
      // We'll try to use the share URL directly first, and if that fails, fall back to a search
      const shareId = url.pathname.split('/').pop();
      if (shareId) {
        // Try to construct a working embed URL
        // Option 1: Try using the share URL directly (might work for some cases)
        // Option 2: Fall back to a generic search approach
        const embedUrl = mapUrl; // Try direct URL first
        return {
          embedUrl,
          originalUrl: mapUrl,
          isValid: true
        };
      }
    }
    
    // Handle standard Google Maps URLs
    if (url.hostname === 'www.google.com' && url.pathname.includes('/maps/')) {
      // For standard Google Maps URLs, try to extract the embed parameters
      const searchParams = url.searchParams;
      
      // If it's already an embed URL, use it directly
      if (url.pathname.includes('/maps/embed')) {
        return {
          embedUrl: mapUrl,
          originalUrl: mapUrl,
          isValid: true
        };
      }
      
      // For place URLs, try to extract the place ID or name
      if (url.pathname.includes('/place/')) {
        const placeName = url.pathname.split('/place/')[1]?.split('/')[0];
        if (placeName) {
          // Create an embed URL for the place
          const embedUrl = `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(placeName)}`;
          return {
            embedUrl,
            originalUrl: mapUrl,
            isValid: true
          };
        }
      }
      
      // For search URLs, extract the query
      if (url.pathname.includes('/search/')) {
        const query = url.pathname.split('/search/')[1]?.split('/')[0];
        if (query) {
          const embedUrl = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(query)}`;
          return {
            embedUrl,
            originalUrl: mapUrl,
            isValid: true
          };
        }
      }
      
      // For URLs with coordinates or query parameters
      if (searchParams.has('q')) {
        const query = searchParams.get('q');
        if (query) {
          const embedUrl = `https://www.google.com/maps/embed/v1/search?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(query)}`;
          return {
            embedUrl,
            originalUrl: mapUrl,
            isValid: true
          };
        }
      }
      
      // Fallback: try to use the original URL in iframe
      return {
        embedUrl: mapUrl,
        originalUrl: mapUrl,
        isValid: true
      };
    }
    
    // Handle maps.app.goo.gl URLs (shortened URLs)
    if (url.hostname === 'maps.app.goo.gl') {
      // These are shortened URLs that redirect to full Google Maps URLs
      // Try using them directly first
      return {
        embedUrl: mapUrl,
        originalUrl: mapUrl,
        isValid: true
      };
    }
    
    // Handle already embeddable URLs
    if (url.hostname === 'www.google.com' && url.pathname.includes('/maps/embed')) {
      return {
        embedUrl: mapUrl,
        originalUrl: mapUrl,
        isValid: true
      };
    }
    
    // If it's a Google Maps URL but doesn't match our patterns, try direct embedding
    if (url.hostname.includes('google') && url.pathname.includes('maps')) {
      return {
        embedUrl: mapUrl,
        originalUrl: mapUrl,
        isValid: true
      };
    }
    
    // Not a valid Google Maps URL
    return {
      embedUrl: '',
      originalUrl: mapUrl,
      isValid: false
    };
    
  } catch (error) {
    console.error('Error converting map URL:', error);
    return {
      embedUrl: '',
      originalUrl: mapUrl,
      isValid: false
    };
  }
}

/**
 * Validates if a URL is a Google Maps URL
 */
export function isValidGoogleMapsUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  
  try {
    const urlObj = new URL(url);
    return (
      urlObj.hostname === 'www.google.com' && urlObj.pathname.includes('/maps/') ||
      urlObj.hostname === 'maps.app.goo.gl' ||
      urlObj.hostname === 'share.google' ||
      (urlObj.hostname.includes('google') && urlObj.pathname.includes('maps'))
    );
  } catch {
    return false;
  }
}

/**
 * Creates a Google Maps embed URL from coordinates
 */
export function createEmbedUrlFromCoords(lat: number, lng: number, zoom: number = 15): string {
  return `https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d0!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sen!2sus!4v1&z=${zoom}`;
}

/**
 * Creates a Google Maps embed URL from an address
 */
export function createEmbedUrlFromAddress(address: string): string {
  return `https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=${encodeURIComponent(address)}`;
}
