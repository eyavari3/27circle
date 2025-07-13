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
export async function getCircleLocation(circleId: string): Promise<{
  location: Location | null;
  spark: string | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    
    // Query circle with location and spark data
    const { data: circle, error: circleError } = await supabase
      .from('circles')
      .select(`
        location_id,
        conversation_spark_id,
        locations!inner (
          id,
          name,
          latitude,
          longitude
        ),
        conversation_sparks!inner (
          spark_text
        )
      `)
      .eq('id', circleId)
      .single();

    if (circleError) {
      console.error('Error fetching circle location:', circleError);
      return { location: null, spark: null, error: 'Failed to fetch circle location' };
    }

    if (!circle) {
      return { location: null, spark: null, error: 'Circle not found' };
    }

    // Type-safe extraction of location data
    const location: Location = {
      id: circle.locations.id,
      name: circle.locations.name,
      description: null, // Not used in current schema
      address: null, // Not used in current schema  
      latitude: circle.locations.latitude,
      longitude: circle.locations.longitude
    };

    const spark = circle.conversation_sparks.spark_text;

    return { location, spark, error: null };

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
    const supabase = await createClient();
    
    // Get today's date in PST
    const today = new Date();
    const todayPST = new Date(today.toLocaleString("en-US", {timeZone: "America/Los_Angeles"}));
    const dateString = todayPST.toISOString().split('T')[0];
    
    // Query the most common location for today's events
    const { data: locations, error: locationsError } = await supabase
      .from('circles')
      .select(`
        location_id,
        locations!inner (
          id,
          name,
          latitude,
          longitude
        )
      `)
      .gte('time_slot', `${dateString}T00:00:00`)
      .lt('time_slot', `${dateString}T23:59:59`)
      .not('location_id', 'is', null);

    if (locationsError) {
      console.error('Error fetching today\'s locations:', locationsError);
      return { location: null, error: 'Failed to fetch location data' };
    }

    if (!locations || locations.length === 0) {
      // Fallback to Old Union as default Stanford location
      return {
        location: {
          id: 'fallback-old-union',
          name: 'Old Union',
          description: 'Stanford University Campus',
          address: null,
          latitude: 37.424946,
          longitude: -122.170571
        },
        error: null
      };
    }

    // Find most frequent location (simple approach - take first for now)
    const primaryLocation = locations[0].locations;
    
    const location: Location = {
      id: primaryLocation.id,
      name: primaryLocation.name,
      description: null,
      address: null,
      latitude: primaryLocation.latitude,
      longitude: primaryLocation.longitude
    };

    return { location, error: null };

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