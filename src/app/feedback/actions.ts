'use server';

import { createClient } from '@/lib/supabase/server';

interface FeedbackData {
  eventId: string;
  attendanceCount: number;
  didNotAttend: boolean;
  rating?: number;
  memorableMoment?: string;
}

export async function submitFeedback(data: FeedbackData) {
  try {
    let userId = 'dev-user-id'; // Default for development
    
    // In production, check authentication
    if (process.env.NODE_ENV !== 'development') {
      const supabase = await createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'Not authenticated' };
      }
      userId = user.id;
    }

    // Validate the data
    if (!data.didNotAttend && (!data.rating || data.rating < 1 || data.rating > 5)) {
      return { error: 'Rating must be between 1 and 5' };
    }

    if (data.attendanceCount < 0 || data.attendanceCount > 20) {
      return { error: 'Invalid attendance count' };
    }

    // For development, save to Supabase (localStorage handled by client)
    if (process.env.NODE_ENV === 'development') {
      const supabase = await createClient();
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: userId,
          circle_id: data.eventId,
          attendance_count: data.attendanceCount,
          quality_rating: data.rating,
          memorable_moment: data.memorableMoment,
        });

      if (error) {
        return { error: 'Failed to save feedback to database' };
      }

      
      return { success: true };
    }

    // In production, this would save to the user_feedback table
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: userId,
        circle_id: data.eventId,
        attendance_count: data.attendanceCount,
        quality_rating: data.rating,
        memorable_moment: data.memorableMoment,
      });

    if (error) {
      return { error: 'Failed to save feedback' };
    }

    return { success: true };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
}

export async function skipFeedback(eventId: string) {
  try {
    let userId = 'dev-user-id'; // Default for development
    
    // In production, check authentication
    if (process.env.NODE_ENV !== 'development') {
      const supabase = await createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: 'Not authenticated' };
      }
      userId = user.id;
    }

    // For development, save skip to Supabase (localStorage handled by client)
    if (process.env.NODE_ENV === 'development') {
      const supabase = await createClient();
      const { error } = await supabase
        .from('user_feedback')
        .insert({
          user_id: userId,
          circle_id: eventId,
          attendance_count: 0,
          quality_rating: null,
          memorable_moment: null,
        });

      if (error) {
        return { error: 'Failed to save skip status to database' };
      }

      
      return { success: true };
    }

    // In production, this would save to the user_feedback table with skip status
    const supabase = await createClient();
    const { error } = await supabase
      .from('user_feedback')
      .insert({
        user_id: userId,
        circle_id: eventId,
        attendance_count: 0,
        quality_rating: null,
        memorable_moment: null,
      });

    if (error) {
      return { error: 'Failed to save skip status' };
    }

    return { success: true };
  } catch (error) {
    return { error: 'An unexpected error occurred' };
  }
}