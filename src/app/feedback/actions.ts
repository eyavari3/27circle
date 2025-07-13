'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

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
      };
      
      // Store in localStorage (this will work because it's called from client-side)
      try {
        localStorage.setItem(feedbackKey, JSON.stringify(feedbackRecord));
        console.log('✅ Feedback submitted (dev mode):', feedbackRecord);
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
          const waitlistEvents = JSON.parse(devWaitlist);
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