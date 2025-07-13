'use server';

import { createClient } from '@/lib/supabase/server';
import { Location } from '@/lib/types';

/**
 * Server actions for location data fetching
 */

export interface LocationWithSpark {
  location: Location;
  spark: string;
}

/**
 * Get location data for a specific circle
 * @param circleId Circle ID to fetch location for
 * @returns Location and spark data for the circle
 */
export async function getCircleLocation(_circleId: string): Promise<{
  location: Location | null;
  spark: string | null;
  error: string | null;
}> {
  try {
    // For now, since the current database schema doesn't have the enhanced circles table,
    // we'll return mock data that matches the development setup
    // This will be updated once the new schema is deployed
    
    return {
      location: {
        id: 'mock-old-union',
        name: 'Old Union',
        description: 'Stanford University Campus',
        address: null,
        latitude: 37.424946,
        longitude: -122.170571
      },
      spark: "What's one of the major problems that you see on campus?",
      error: null
    };

  } catch (error) {
    console.error('Unexpected error in getCircleLocation:', error);
    return { 
      location: null, 
      spark: null, 
      error: 'An unexpected error occurred' 
    };
  }
}

/**
 * Get today's main location (for the main circles page)
 * Returns the location used for the majority of today's circles
 * @returns Primary location for today's events
 */
export async function getTodaysMainLocation(): Promise<{
  location: Location | null;
  error: string | null;
}> {
  try {
    // For now, since the current database schema doesn't have the enhanced circles table,
    // we'll return the default Old Union location
    // This will be updated once the new schema is deployed
    
    return {
      location: {
        id: 'default-old-union',
        name: 'Old Union',
        description: 'Stanford University Campus',
        address: null,
        latitude: 37.424946,
        longitude: -122.170571
      },
      error: null
    };

  } catch (error) {
    console.error('Unexpected error in getTodaysMainLocation:', error);
    return { 
      location: null, 
      error: 'An unexpected error occurred' 
    };
  }
}

/**
 * Get all available locations (for admin/testing purposes)
 * @returns List of all locations in the system
 */
export async function getAllLocations(): Promise<{
  locations: Location[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .order('name');

    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
      return { locations: [], error: 'Failed to fetch locations' };
    }

    const formattedLocations: Location[] = (locations || []).map(loc => ({
      id: loc.id,
      name: loc.name,
      description: null,
      address: null,
      latitude: loc.latitude,
      longitude: loc.longitude
    }));

    return { locations: formattedLocations, error: null };

  } catch (error) {
    console.error('Unexpected error in getAllLocations:', error);
    return { 
      locations: [], 
      error: 'An unexpected error occurred' 
    };
  }
}