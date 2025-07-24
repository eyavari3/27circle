import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAuthInProduction } from '@/lib/auth/production-guards';
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
  
  // Enforce authentication in production while preserving dev utilities
  await requireAuthInProduction();
  
  // Redirect if feedback is disabled
  if (!FEEDBACK_ENABLED) {
    redirect('/circles');
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
  
  // Generate circle ID if not provided using existing currentTime
  const date = new Date(currentTime);
  const dateStr = date.toISOString().split('T')[0];
  const defaultCircleId = `${dateStr}_${targetTimeSlot}_Circle_1`;
  
  return (
    <FeedbackClient 
      timeSlot={targetTimeSlot}
      eventId={awaitedSearchParams.eventId || defaultCircleId}
    />
  );
}