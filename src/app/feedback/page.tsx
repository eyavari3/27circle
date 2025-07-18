import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import FeedbackClient from './FeedbackClient';
import { getCurrentPSTTime } from '@/lib/time';
import { FEEDBACK_ENABLED } from '@/lib/constants';

interface SearchParams {
  eventId?: string;
  timeSlot?: string;
}

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const awaitedSearchParams = await searchParams;
  
  // Redirect if feedback is disabled
  if (!FEEDBACK_ENABLED) {
    redirect('/circles');
  }
  
  // In development mode, skip auth check for easier testing
  if (process.env.NODE_ENV === 'development') {
    // Skip auth check in dev mode
  } else {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      redirect('/auth');
    }
  }

  // Get event details - for now, well simulate based on time slot
  const currentTime = getCurrentPSTTime();
  
  // If no specific eventId provided, determine from current time which event just ended
  let targetTimeSlot = awaitedSearchParams.timeSlot || 'Unknown';
  if (!awaitedSearchParams.timeSlot) {
    // Find which event just ended (within 30 minutes after)
    const currentHour = currentTime.getHours();
    if (currentHour >= 11 && currentHour < 14) {
      targetTimeSlot = '11AM';
    } else if (currentHour >= 14 && currentHour < 17) {
      targetTimeSlot = '2PM';
    } else if (currentHour >= 17 && currentHour < 20) {
      targetTimeSlot = '5PM';
    }
  }

  // Check if user already submitted feedback for this event
  // For now, we'll implement basic logic - this could be enhanced with actual database checks
  
  return (
    <FeedbackClient 
      timeSlot={targetTimeSlot}
      eventId={awaitedSearchParams.eventId || `dev-event-${targetTimeSlot}`}
    />
  );
}