"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { submitFeedback, skipFeedback } from './actions';
import { typography } from '@/lib/typography';
import { generateFeedbackKey, saveFeedbackRecord } from '@/lib/feedback-keys';

interface FeedbackClientProps {
  timeSlot: string;
  eventId: string;
}

export default function FeedbackClient({ timeSlot, eventId }: FeedbackClientProps) {
  const router = useRouter();
  const [attendanceCount, setAttendanceCount] = useState<number | null>(null);
  const [didNotAttend, setDidNotAttend] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [memorableMoment, setMemorableMoment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const attendanceOptions = [1, 2, 3];

  const handleAttendanceChange = (value: string) => {
    if (value === 'no-show') {
      setDidNotAttend(true);
      setAttendanceCount(0);
    } else {
      setDidNotAttend(false);
      setAttendanceCount(parseInt(value));
    }
  };

  const handleSubmit = async () => {
    if (!didNotAttend && (attendanceCount === null || rating === null)) {
      setError('Please complete all required fields');
      return;
    }

    if (didNotAttend && attendanceCount !== 0) {
      setError('Invalid attendance selection');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const feedbackData = {
      eventId,
      attendanceCount: attendanceCount || 0,
      didNotAttend,
      rating: rating || undefined,
      memorableMoment: memorableMoment.trim() || undefined,
    };

    // Save to Supabase using centralized Storage system
    const savedToStorage = await saveFeedbackRecord('dev-user-id', eventId, {
      ...feedbackData,
      status: 'submitted'
    });
    
    if (!savedToStorage) {
      setError('Failed to save feedback');
      setIsSubmitting(false);
      return;
    }

    // Redirect after successful save
    router.push('/circles');

    // Background server logging for database backup
    try {
      await submitFeedback(feedbackData);
    } catch (err) {
      // Don't show error to user since main storage succeeded
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    setError('');

    // Save skip status to Supabase using centralized Storage system
    const savedToStorage = await saveFeedbackRecord('dev-user-id', eventId, {
      status: 'skipped'
    });
    
    if (!savedToStorage) {
      setError('Failed to save skip status');
      setIsSubmitting(false);
      return;
    }

    // Redirect after successful save
    router.push('/circles');

    // Background server logging for database backup
    try {
      await skipFeedback(eventId);
    } catch (err) {
      // Don't show error to user since main storage succeeded
    }
  };

  // Note: All feedback data is stored in Supabase via centralized Storage utility

  const isFormValid = didNotAttend || (attendanceCount !== null && rating !== null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#152B5C' }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-white/10 transition-colors"
          aria-label="Go back"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>

      {/* Title */}
      <div className="text-center text-white px-6 mb-8">
        <h1 className={`${typography.page.header}`}>
          How did the {timeSlot}
          <br />
          Circle Go?
        </h1>
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-t-3xl min-h-[75vh] p-6">
        <div className="max-w-md mx-auto space-y-6">
          {/* Attendance Count */}
          <div>
            <label className={`block text-gray-700 ${typography.section.label} mb-3`}>
              How many people were in your Circle?*
            </label>
            <div className="relative">
              <select
                value={didNotAttend ? 'no-show' : attendanceCount?.toString() || ''}
                onChange={(e) => handleAttendanceChange(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 appearance-none cursor-pointer"
              >
                <option value="">Select...</option>
                {attendanceOptions.map(num => (
                  <option key={num} value={num.toString()}>
                    {num}
                  </option>
                ))}
                <option value="no-show">I couldn&apos;t make it</option>
              </select>
              <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Rating - only show if they attended */}
          {!didNotAttend && (
            <div>
              <label className={`block text-gray-700 ${typography.section.label} mb-3`}>
                How would you rate your experience?*
              </label>
              <div className="flex justify-between items-center">
                <span className={`${typography.component.small} text-gray-500`}>Not good</span>
                <div className="flex space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className={`w-12 h-12 rounded-lg border transition-colors ${
                        rating === star
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      {star}
                    </button>
                  ))}
                </div>
                <span className={`${typography.component.small} text-gray-500`}>Excellent</span>
              </div>
            </div>
          )}

          {/* Memorable Moment - only show if they attended */}
          {!didNotAttend && (
            <div>
              <label className={`block text-gray-700 ${typography.section.label} mb-3`}>
                What&apos;s one thing you&apos;ll remember?
              </label>
              <textarea
                value={memorableMoment}
                onChange={(e) => setMemorableMoment(e.target.value)}
                placeholder="e.g., A great conversation, an issue, a new idea, or an inspiration"
                className="w-full p-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 resize-none"
                rows={4}
                maxLength={500}
              />
              <div className="text-xs text-gray-400 mt-1 text-right">
                {memorableMoment.length}/500
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className={`w-full py-4 rounded-full ${typography.component.button} text-white transition-all ${
              isFormValid && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Sharing...' : 'Share Experience'}
          </button>

          {/* Skip Button */}
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className={`w-full py-3 rounded-full ${typography.component.button} transition-all ${
              !isSubmitting
                ? 'text-gray-600 hover:text-gray-800'
                : 'text-gray-400 cursor-not-allowed'
            }`}
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}