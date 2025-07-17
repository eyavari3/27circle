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
        .from('feedback')
        .insert({
          user_id: userId,
          circle_id: data.eventId,
          attendance_count: data.attendanceCount,
          did_not_attend: data.didNotAttend,
          rating: data.rating,
          memorable_moment: data.memorableMoment,
        });

      if (error) {
        console.error('Database error:', error);
        return { error: 'Failed to save feedback to database' };
      }

      console.log('📝 Feedback saved to Supabase:', {
        userId,
        eventId: data.eventId,
        attendanceCount: data.attendanceCount,
        didNotAttend: data.didNotAttend,
        rating: data.rating,
      });
      
      return { success: true };
    }

    // In production, this would save to the feedback table
    const supabase = await createClient();
    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        circle_id: data.eventId,
        attendance_count: data.attendanceCount,
        did_not_attend: data.didNotAttend,
        rating: data.rating,
        memorable_moment: data.memorableMoment,
      });

    if (error) {
      console.error('Database error:', error);
      return { error: 'Failed to save feedback' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
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
        .from('feedback')
        .insert({
          user_id: userId,
          circle_id: eventId,
          attendance_count: 0,
          did_not_attend: true,
          rating: null,
          memorable_moment: null,
        });

      if (error) {
        console.error('Database error:', error);
        return { error: 'Failed to save skip status to database' };
      }

      console.log('⏭️ Feedback skip saved to Supabase:', {
        userId,
        eventId,
        skippedAt: new Date().toISOString(),
      });
      
      return { success: true };
    }

    // In production, this would save to the feedback table with skip status
    const supabase = await createClient();
    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        circle_id: eventId,
        attendance_count: 0,
        did_not_attend: true,
        rating: null,
        memorable_moment: null,
      });

    if (error) {
      console.error('Database error:', error);
      return { error: 'Failed to save skip status' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { error: 'An unexpected error occurred' };
  }
}