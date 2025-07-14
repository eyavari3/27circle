// Google Maps utilities - Location type is referenced in function parameters

/**
 * Google Maps utilities for 27 Circle
 * Uses Static Maps API for display and deep links for navigation
 */

// Stanford University center coordinates for fallback
export const STANFORD_CENTER = {
  lat: 37.4275,
  lng: -122.1697
};

/**
 * Generate Google Maps Static API URL for location display
 * @param location Location object with coordinates
 * @param options Optional configuration for map appearance
 * @returns Static map image URL
 */
export function getStaticMapUrl(
  location: { latitude: number; longitude: number; name?: string },
  options: {
    width?: number;
    height?: number;
    zoom?: number;
    maptype?: 'roadmap' | 'satellite' | 'hybrid' | 'terrain';
    markers?: boolean;
  } = {}
): string {
  const {
    width = 400,
    height = 300,
    zoom = 18,
    maptype = 'satellite',
    markers = true
  } = options;

  const baseUrl = 'https://maps.googleapis.com/maps/api/staticmap';
  const center = `${location.latitude},${location.longitude}`;
  
  const params = new URLSearchParams({
    center,
    zoom: zoom.toString(),
    size: `${width}x${height}`,
    maptype,
    scale: '2', // High DPI for better quality
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''
  });

  // Add marker if requested
  if (markers) {
    const markerParams = `color:red|size:mid|${center}`;
    params.append('markers', markerParams);
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Generate Google Maps deep link for navigation
 * Opens in Google Maps app if installed, web otherwise
 * @param location Location object with coordinates
 * @returns Deep link URL for navigation
 */
export function getNavigationUrl(location: { latitude: number; longitude: number; name?: string }): string {
  const coords = `${location.latitude},${location.longitude}`;
  
  // Use Google Maps URL scheme that works across platforms
  // This opens the app on mobile, web on desktop
  if (location.name) {
    // Search for exact coordinates with place name for context
    return `https://www.google.com/maps/search/?api=1&query=${coords}`;
  } else {
    // Direct coordinate navigation
    return `https://www.google.com/maps/dir/?api=1&destination=${coords}`;
  }
}

/**
 * Get mobile-optimized static map dimensions based on container
 * @param containerWidth Container width in pixels
 * @returns Optimized width and height for static map
 */
export function getOptimizedMapDimensions(containerWidth: number): { width: number; height: number } {
  // Maintain 4:3 aspect ratio, optimize for mobile screens
  const width = Math.min(containerWidth * 2, 800); // 2x for retina, max 800px
  const height = Math.floor(width * 0.75); // 4:3 aspect ratio
  
  return { width, height };
}

/**
 * Generate static map URL optimized for mobile display
 * @param location Location object
 * @param containerWidth Width of container in CSS pixels
 * @returns Mobile-optimized static map URL
 */
export function getMobileStaticMapUrl(
  location: { latitude: number; longitude: number; name?: string },
  containerWidth: number = 350
): string {
  const { width, height } = getOptimizedMapDimensions(containerWidth);
  
  return getStaticMapUrl(location, {
    width,
    height,
    zoom: 18,
    maptype: 'satellite',
    markers: true
  });
}

/**
 * Check if Google Maps API key is configured
 * @returns True if API key is available
 */
export function isGoogleMapsConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
}

/**
 * Generate fallback map URL if Google Maps is not configured
 * Uses OpenStreetMap as fallback
 * @param location Location object
 * @returns Fallback map URL or placeholder
 */
export function getFallbackMapUrl(): string {
  // Return placeholder or OpenStreetMap URL as fallback
  return `https://via.placeholder.com/400x300/cccccc/666666?text=Map+Not+Available`;
}

/**
 * Get map URL with fallback handling
 * @param location Location object
 * @param containerWidth Container width for optimization
 * @returns Map URL (Google Maps or fallback)
 */
export function getMapUrl(
  location: { latitude: number; longitude: number; name?: string },
  containerWidth: number = 350
): string {
  if (isGoogleMapsConfigured()) {
    return getMobileStaticMapUrl(location, containerWidth);
  } else {
    return getFallbackMapUrl();
  }
}