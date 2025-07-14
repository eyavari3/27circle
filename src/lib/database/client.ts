/**
 * TYPE-SAFE DATABASE CLIENT
 * 
 * This module provides type-safe database operations for the 27 Circle app.
 * All database queries should go through this client for consistency and type safety.
 */

import { createServiceClient } from '@/lib/supabase/server';
import { createClient } from '@/lib/supabase/server';
import { 
  User, 
  UserWithInterests, 
  WaitlistEntry, 
  WaitlistWithUser, 
  Circle, 
  CircleWithDetails, 
  Location, 
  ConversationSpark, 
  CircleMember,
  MatchingUser,
  WaitlistQueryResult,
  CircleQueryResult,
  ApiResponse,
  SupabaseQueryResult,
  createApiError,
  createApiSuccess,
  validateTimeSlot,
  validateUser
} from './types';

// =============================================================================
// DATABASE CLIENT CLASS
// =============================================================================

export class DatabaseClient {
  private supabase: any;
  private useServiceRole: boolean;

  constructor(useServiceRole = false) {
    this.useServiceRole = useServiceRole;
  }

  async getClient() {
    if (!this.supabase) {
      this.supabase = this.useServiceRole 
        ? await createServiceClient()
        : await createClient();
    }
    return this.supabase;
  }

  // ===========================================================================
  // USER OPERATIONS
  // ===========================================================================

  async getUserById(userId: string): Promise<ApiResponse<User>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return createApiError(error, 'getUserById');
      }

      return createApiSuccess(data);
    } catch (error) {
      return createApiError(error, 'getUserById');
    }
  }

  async getUserWithInterests(userId: string): Promise<ApiResponse<UserWithInterests>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_interests (
            interest_type,
            created_at
          )
        `)
        .eq('id', userId)
        .single();

      if (error) {
        return createApiError(error, 'getUserWithInterests');
      }

      return createApiSuccess(data);
    } catch (error) {
      return createApiError(error, 'getUserWithInterests');
    }
  }

  async createUser(user: Omit<User, 'id'> & { id?: string }): Promise<ApiResponse<User>> {
    try {
      const validation = validateUser(user);
      if (!validation.isValid) {
        return createApiError(new Error(validation.error), 'createUser');
      }

      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('users')
        .insert(user)
        .select()
        .single();

      if (error) {
        return createApiError(error, 'createUser');
      }

      return createApiSuccess(data);
    } catch (error) {
      return createApiError(error, 'createUser');
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        return createApiError(error, 'updateUser');
      }

      return createApiSuccess(data);
    } catch (error) {
      return createApiError(error, 'updateUser');
    }
  }

  // ===========================================================================
  // WAITLIST OPERATIONS
  // ===========================================================================

  async getWaitlistForTimeSlot(timeSlot: string): Promise<ApiResponse<WaitlistQueryResult[]>> {
    try {
      const validation = validateTimeSlot(timeSlot);
      if (!validation.isValid) {
        return createApiError(new Error(validation.error), 'getWaitlistForTimeSlot');
      }

      const supabase = await this.getClient();
      // Use manual query to avoid foreign key relationship issues
      const { data, error } = await supabase.rpc('get_waitlist_with_users', {
        time_slot_param: timeSlot
      });

      // If RPC doesn't exist, fall back to manual join query
      if (error && error.code === 'PGRST202') {
        console.log('RPC not found, using manual query...');
        
        // Get waitlist entries first
        const { data: waitlistData, error: waitlistError } = await supabase
          .from('waitlist_entries')
          .select('user_id')
          .eq('time_slot', timeSlot);
        
        if (waitlistError) {
          return createApiError(waitlistError, 'getWaitlistForTimeSlot');
        }
        
        if (!waitlistData || waitlistData.length === 0) {
          return createApiSuccess([]);
        }
        
        const userIds = waitlistData.map(entry => entry.user_id);
        
        // Get user data with interests
        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select(`
            id,
            full_name,
            gender,
            date_of_birth,
            user_interests(interest_type)
          `)
          .in('id', userIds);
        
        if (usersError) {
          return createApiError(usersError, 'getWaitlistForTimeSlot');
        }
        
        // Transform to expected format
        const transformedData = usersData?.map(user => ({
          user_id: user.id,
          users: user
        })) || [];
        
        return createApiSuccess(transformedData);
      }

      if (error) {
        return createApiError(error, 'getWaitlistForTimeSlot');
      }

      return createApiSuccess(data || []);
    } catch (error) {
      return createApiError(error, 'getWaitlistForTimeSlot');
    }
  }

  async getUserWaitlistEntries(userId: string, startDate: string): Promise<ApiResponse<WaitlistEntry[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('waitlist_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('time_slot', startDate);

      if (error) {
        return createApiError(error, 'getUserWaitlistEntries');
      }

      return createApiSuccess(data || []);
    } catch (error) {
      return createApiError(error, 'getUserWaitlistEntries');
    }
  }

  async addToWaitlist(userId: string, timeSlot: string): Promise<ApiResponse<WaitlistEntry>> {
    try {
      const validation = validateTimeSlot(timeSlot);
      if (!validation.isValid) {
        return createApiError(new Error(validation.error), 'addToWaitlist');
      }

      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('waitlist_entries')
        .insert({
          user_id: userId,
          time_slot: timeSlot
        })
        .select()
        .single();

      if (error) {
        return createApiError(error, 'addToWaitlist');
      }

      return createApiSuccess(data);
    } catch (error) {
      return createApiError(error, 'addToWaitlist');
    }
  }

  async removeFromWaitlist(userId: string, timeSlot: string): Promise<ApiResponse<void>> {
    try {
      const validation = validateTimeSlot(timeSlot);
      if (!validation.isValid) {
        return createApiError(new Error(validation.error), 'removeFromWaitlist');
      }

      const supabase = await this.getClient();
      const { error } = await supabase
        .from('waitlist_entries')
        .delete()
        .eq('user_id', userId)
        .eq('time_slot', timeSlot);

      if (error) {
        return createApiError(error, 'removeFromWaitlist');
      }

      return createApiSuccess();
    } catch (error) {
      return createApiError(error, 'removeFromWaitlist');
    }
  }

  // ===========================================================================
  // CIRCLE OPERATIONS
  // ===========================================================================

  async createCircle(circle: Omit<Circle, 'id' | 'created_at'>): Promise<ApiResponse<Circle>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('circles')
        .insert({
          ...circle,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return createApiError(error, 'createCircle');
      }

      return createApiSuccess(data);
    } catch (error) {
      return createApiError(error, 'createCircle');
    }
  }

  async getCircleById(circleId: string): Promise<ApiResponse<CircleWithDetails>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('circles')
        .select(`
          *,
          locations(*),
          conversation_sparks(*),
          circle_members(
            user_id,
            users(
              *,
              user_interests(interest_type)
            )
          )
        `)
        .eq('id', circleId)
        .single();

      if (error) {
        return createApiError(error, 'getCircleById');
      }

      // Transform the data to match our interface
      const transformedData: CircleWithDetails = {
        ...data,
        location: data.locations,
        conversation_spark: data.conversation_sparks,
        members: data.circle_members.map((member: any) => ({
          ...member.users,
          user_interests: member.users.user_interests
        }))
      };

      return createApiSuccess(transformedData);
    } catch (error) {
      return createApiError(error, 'getCircleById');
    }
  }

  async getUserCircles(userId: string, startDate: string): Promise<ApiResponse<CircleQueryResult[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('circle_members')
        .select(`
          circle_id,
          circles!inner(
            time_slot,
            locations(name),
            conversation_sparks(spark_text)
          )
        `)
        .eq('user_id', userId)
        .gte('circles.time_slot', startDate);

      if (error) {
        return createApiError(error, 'getUserCircles');
      }

      return createApiSuccess(data || []);
    } catch (error) {
      return createApiError(error, 'getUserCircles');
    }
  }

  async addCircleMembers(circleId: string, userIds: string[]): Promise<ApiResponse<CircleMember[]>> {
    try {
      const supabase = await this.getClient();
      const members = userIds.map(userId => ({
        circle_id: circleId,
        user_id: userId
      }));

      const { data, error } = await supabase
        .from('circle_members')
        .insert(members)
        .select();

      if (error) {
        return createApiError(error, 'addCircleMembers');
      }

      return createApiSuccess(data || []);
    } catch (error) {
      return createApiError(error, 'addCircleMembers');
    }
  }

  // ===========================================================================
  // LOCATION OPERATIONS
  // ===========================================================================

  async getAllLocations(): Promise<ApiResponse<Location[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) {
        return createApiError(error, 'getAllLocations');
      }

      return createApiSuccess(data || []);
    } catch (error) {
      return createApiError(error, 'getAllLocations');
    }
  }

  async getAvailableLocations(timeSlot: string): Promise<ApiResponse<Location[]>> {
    try {
      const supabase = await this.getClient();
      
      // Get already assigned locations for this time slot
      const { data: assignedLocations } = await supabase
        .from('circles')
        .select('location_id')
        .eq('time_slot', timeSlot)
        .not('location_id', 'is', null);

      const usedLocationIds = new Set(
        assignedLocations?.map(c => c.location_id) || []
      );

      // Get all locations
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('name');

      if (error) {
        return createApiError(error, 'getAvailableLocations');
      }

      // Filter out used locations
      const availableLocations = (data || []).filter(
        location => !usedLocationIds.has(location.id)
      );

      return createApiSuccess(availableLocations);
    } catch (error) {
      return createApiError(error, 'getAvailableLocations');
    }
  }

  // ===========================================================================
  // CONVERSATION SPARK OPERATIONS
  // ===========================================================================

  async getAllConversationSparks(): Promise<ApiResponse<ConversationSpark[]>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('conversation_sparks')
        .select('*')
        .order('spark_text');

      if (error) {
        return createApiError(error, 'getAllConversationSparks');
      }

      return createApiSuccess(data || []);
    } catch (error) {
      return createApiError(error, 'getAllConversationSparks');
    }
  }

  // ===========================================================================
  // UTILITY METHODS
  // ===========================================================================

  async executeTransaction<T>(
    operations: ((supabase: any) => Promise<T>)[]
  ): Promise<ApiResponse<T[]>> {
    try {
      const supabase = await this.getClient();
      const results: T[] = [];

      // Execute all operations in sequence
      for (const operation of operations) {
        const result = await operation(supabase);
        results.push(result);
      }

      return createApiSuccess(results);
    } catch (error) {
      return createApiError(error, 'executeTransaction');
    }
  }

  async healthCheck(): Promise<ApiResponse<{ status: string; timestamp: string }>> {
    try {
      const supabase = await this.getClient();
      const { data, error } = await supabase
        .from('users')
        .select('count', { count: 'exact' })
        .limit(1);

      if (error) {
        return createApiError(error, 'healthCheck');
      }

      return createApiSuccess({
        status: 'healthy',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      return createApiError(error, 'healthCheck');
    }
  }
}

// =============================================================================
// SINGLETON INSTANCES
// =============================================================================

export const db = new DatabaseClient(false); // Regular client
export const dbAdmin = new DatabaseClient(true); // Service role client

// =============================================================================
// CONVENIENCE FUNCTIONS
// =============================================================================

export async function withTransaction<T>(
  operations: ((supabase: any) => Promise<T>)[]
): Promise<ApiResponse<T[]>> {
  return dbAdmin.executeTransaction(operations);
}

export async function transformWaitlistForMatching(
  waitlistData: WaitlistQueryResult[]
): Promise<MatchingUser[]> {
  return waitlistData.map(entry => ({
    user_id: entry.user_id,
    full_name: entry.users.full_name,
    gender: entry.users.gender,
    date_of_birth: entry.users.date_of_birth,
    interests: entry.users.user_interests.map(ui => ui.interest_type)
  }));
}