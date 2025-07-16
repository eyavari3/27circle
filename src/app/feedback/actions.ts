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

    // For development, we'll store feedback in localStorage since we don't have full database setup
    if (process.env.NODE_ENV === 'development') {
      const feedbackKey = `feedback-${userId}-${data.eventId}`;
      const feedbackRecord = {
        userId: userId,
        eventId: data.eventId,
        attendanceCount: data.attendanceCount,
        didNotAttend: data.didNotAttend,
        rating: data.rating,
        memorableMoment: data.memorableMoment,
        submittedAt: new Date().toISOString(),
        status: 'submitted' as const,
      };
      
      // Store in localStorage (this will work because it's called from client-side)
      try {
        localStorage.setItem(feedbackKey, JSON.stringify(feedbackRecord));
      } catch (e) {
        console.error('Error saving feedback to localStorage:', e);
        return { error: 'Failed to save feedback locally' };
      }
      
      return { success: true };
    }

    // In production, this would save to the feedback table
    const supabase = await createClient();
    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        event_id: data.eventId,
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

    // For development, store skip status in localStorage
    if (process.env.NODE_ENV === 'development') {
      const feedbackKey = `feedback-${userId}-${eventId}`;
      const skipRecord = {
        userId: userId,
        eventId: eventId,
        skippedAt: new Date().toISOString(),
        status: 'skipped' as const,
      };
      
      try {
        localStorage.setItem(feedbackKey, JSON.stringify(skipRecord));
      } catch (e) {
        console.error('Error saving skip status to localStorage:', e);
        return { error: 'Failed to save skip status locally' };
      }
      
      return { success: true };
    }

    // In production, this would save to the feedback table with skip status
    const supabase = await createClient();
    const { error } = await supabase
      .from('feedback')
      .insert({
        user_id: userId,
        event_id: eventId,
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

export async function checkFeedbackStatus(eventId: string) {
  try {
    let userId = 'dev-user-id'; // Default for development
    
    // In production, check authentication
    if (process.env.NODE_ENV !== 'development') {
      const supabase = await createClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { status: 'not-authenticated' as const };
      }
      userId = user.id;
    }

    // For development, check localStorage
    if (process.env.NODE_ENV === 'development') {
      const feedbackKey = `feedback-${userId}-${eventId}`;
      const existingFeedback = localStorage.getItem(feedbackKey);
      
      if (!existingFeedback) {
        return { status: 'not-submitted' as const };
      }

      try {
        const feedbackRecord = JSON.parse(existingFeedback);
        return { status: feedbackRecord.status || 'submitted' as const };
      } catch (e) {
        console.error('Error parsing feedback record:', e);
        return { status: 'not-submitted' as const };
      }
    }

    // In production, query the database
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) {
      console.error('Database error:', error);
      return { status: 'error' as const };
    }

    return { status: data ? 'submitted' as const : 'not-submitted' as const };
  } catch (error) {
    console.error('Unexpected error:', error);
    return { status: 'error' as const };
  }
}

export async function checkPendingFeedback() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { pendingFeedback: null };
    }

    // For development, check localStorage for events that need feedback
    if (process.env.NODE_ENV === 'development') {
      // This would typically check for events the user attended that ended 30 minutes ago
      // and don't have feedback yet. For now, we'll implement basic logic.
      
      // Check if there are any dev events that need feedback
      const devWaitlist = localStorage.getItem('dev-waitlist');
      if (devWaitlist) {
        try {
          // Check if any events need feedback (simplified logic)
          // In a real implementation, this would check against actual event times and feedback records
          
          return { pendingFeedback: null }; // For now
        } catch (e) {
          console.error('Error checking pending feedback:', e);
        }
      }
      
      return { pendingFeedback: null };
    }

    // In production, query the database for events needing feedback
    // This would join circles, events, and feedback tables to find events the user attended
    // that ended 30 minutes ago and don't have feedback yet
    
    return { pendingFeedback: null };
  } catch (error) {
    console.error('Error checking pending feedback:', error);
    return { pendingFeedback: null };
  }
}