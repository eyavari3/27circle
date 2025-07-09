export interface TimeSlot {
  time: Date;
  deadline: Date;
}

export interface CircleData {
  circleId: string;
  locationName: string;
  sparkText: string;
}

export interface TimeSlotWithUserStatus {
  timeSlot: TimeSlot;
  isOnWaitlist: boolean;
  assignedCircleId: string | null;
  circleData: CircleData | null;
  buttonState: 'join' | 'leave' | 'closed' | 'confirmed' | 'past';
  buttonText: string;
  isDisabled: boolean;
}