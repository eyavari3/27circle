/**
 * COMPREHENSIVE DEBUG LOGGER
 * 
 * Provides detailed logging for tracking the complete user journey
 * from button clicks through database operations to final button states.
 */

export class DebugLogger {
  private static instance: DebugLogger;
  private sessionId: string;

  constructor() {
    this.sessionId = `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static getInstance(): DebugLogger {
    if (!DebugLogger.instance) {
      DebugLogger.instance = new DebugLogger();
    }
    return DebugLogger.instance;
  }

  logSection(title: string, data?: any) {
    console.log(`\n🔵 ============ ${title} ============`);
    if (data) {
      console.log(data);
    }
  }

  logButtonClick(action: 'join' | 'leave' | 'navigate-to-circle' | 'navigate-to-feedback', timeSlot: string, userId: string) {
    console.log(`\n🖱️ BUTTON CLICK [${this.sessionId}]:`, {
      action,
      timeSlot,
      userId,
      isAnonymous: userId.startsWith('anon-'),
      timestamp: new Date().toLocaleTimeString()
    });
  }

  logOptimisticUpdate(timeSlot: string, newState: boolean) {
    console.log(`⚡ OPTIMISTIC UPDATE [${this.sessionId}]:`, {
      timeSlot,
      newIsOnWaitlist: newState,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  logServerAction(action: string, input: any) {
    console.log(`🔄 SERVER ACTION START [${this.sessionId}]:`, {
      action,
      input,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  logDatabaseOperation(operation: string, params: any, result: any) {
    console.log(`🗄️ DATABASE OPERATION [${this.sessionId}]:`, {
      operation,
      params,
      result: {
        success: !result.error,
        error: result.error?.message,
        data: result.data,
        recordCount: result.data?.length || 0
      },
      timestamp: new Date().toLocaleTimeString()
    });
  }

  logStateRefresh(reason: string, timeSlots: any[]) {
    console.log(`🔄 STATE REFRESH [${this.sessionId}]:`, {
      reason,
      totalSlots: timeSlots.length,
      waitlistStates: timeSlots.map(slot => ({
        time: slot.timeSlot.time.toLocaleTimeString(),
        isOnWaitlist: slot.isOnWaitlist,
        assignedCircleId: slot.assignedCircleId
      })),
      timestamp: new Date().toLocaleTimeString()
    });
  }

  logMethod7Analysis(timeSlot: string, input: any, phases: any, output: any) {
    console.log(`⚙️ METHOD 7 COMPLETE ANALYSIS [${this.sessionId}]:`, {
      timeSlot,
      input: {
        isOnWaitlist: input.isOnWaitlist,
        assignedCircleId: input.assignedCircleId,
        feedbackSubmitted: input.feedbackSubmitted,
        currentTime: input.currentTime?.toLocaleTimeString()
      },
      phases: {
        beforeDeadline: phases.beforeDeadline,
        duringEvent: phases.duringEvent,
        afterEvent: phases.afterEvent,
        deadlineTime: phases.deadlineTime,
        eventTime: phases.eventTime
      },
      output: {
        buttonState: output.buttonState,
        buttonText: output.buttonText,
        middleText: output.middleText,
        isDisabled: output.isDisabled
      },
      timestamp: new Date().toLocaleTimeString()
    });
  }

  logTimeChange(oldTime: number | null, newTime: number | null) {
    console.log(`⏰ TIME CHANGE DETECTED [${this.sessionId}]:`, {
      oldOffset: oldTime,
      newOffset: newTime,
      oldTimeString: oldTime ? `${Math.floor(oldTime)}:${((oldTime % 1) * 60).toString().padStart(2, '0')}` : 'real time',
      newTimeString: newTime ? `${Math.floor(newTime)}:${((newTime % 1) * 60).toString().padStart(2, '0')}` : 'real time',
      timestamp: new Date().toLocaleTimeString()
    });
  }

  logError(context: string, error: any) {
    console.error(`❌ ERROR [${this.sessionId}]:`, {
      context,
      error: error?.message || error,
      stack: error?.stack,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  logAnonymousUserInfo(userId: string, sessionStorageValue?: string | null) {
    console.log(`👤 ANONYMOUS USER INFO [${this.sessionId}]:`, {
      userId,
      isAnonymous: userId.startsWith('anon-'),
      sessionStorageValue,
      timestamp: new Date().toLocaleTimeString()
    });
  }

  summarizeFlow(step: string) {
    console.log(`\n📋 FLOW SUMMARY - ${step} [${this.sessionId}]:`, {
      step,
      timestamp: new Date().toLocaleTimeString(),
      sessionId: this.sessionId
    });
  }
}

export const debugLogger = DebugLogger.getInstance();