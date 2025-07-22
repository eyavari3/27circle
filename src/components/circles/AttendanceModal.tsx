'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveFeedbackRecord } from '@/lib/feedback-keys';
import { generateEventId } from '@/lib/feedback-keys';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  timeSlot: string;
  date: Date;
  onAttendanceMarked: () => void;
}

export function AttendanceModal({ 
  isOpen, 
  onClose, 
  timeSlot, 
  date,
  onAttendanceMarked 
}: AttendanceModalProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const eventId = generateEventId(timeSlot, date);

  const handleGiveFeedback = () => {
    // Navigate to feedback form
    router.push(`/feedback?eventId=${eventId}&timeSlot=${timeSlot}`);
  };

  const handleDidNotAttend = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      // Save non-attendance record
      const success = await saveFeedbackRecord('dev-user-id', eventId, {
        didNotAttend: true,
        status: 'submitted',
        attendanceCount: 0,
        submittedAt: new Date().toISOString()
      });

      if (success) {
        // Notify parent to update button state
        onAttendanceMarked();
        onClose();
      } else {
        setError('Failed to save attendance status');
      }
    } catch (err) {
      console.error('Error marking non-attendance:', err);
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Did you attend the {timeSlot} circle?
        </h2>
        
        <p className="text-gray-600 mb-6">
          Let us know if you made it to help improve future matching.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button
            onClick={handleGiveFeedback}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-[#152B5C] text-white rounded-lg hover:bg-[#1e3a70] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Yes, Give Feedback →
          </button>
          
          <button
            onClick={handleDidNotAttend}
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : "No, I Couldn't Make It"}
          </button>
          
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="w-full py-2 text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            Ask Me Later
          </button>
        </div>
      </div>
    </div>
  );
}