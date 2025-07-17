/**
 * PRODUCTION MONITORING LOGGER
 * 
 * Comprehensive logging system for production monitoring and debugging
 */

import { getCurrentPSTTime } from '@/lib/time';

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  error?: Error;
  userId?: string;
  circleId?: string;
  timeSlot?: string;
}

class Logger {
  private context: string;
  
  constructor(context: string) {
    this.context = context;
  }
  
  private log(level: LogLevel, message: string, metadata?: Record<string, any>, error?: Error) {
    const entry: LogEntry = {
      timestamp: getCurrentPSTTime().toISOString(),
      level,
      message,
      context: this.context,
      metadata,
      error
    };
    
    // In production, you'd send this to a logging service
    // For now, we'll use console with structured logging
    const logMessage = this.formatLogEntry(entry);
    
    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
      case LogLevel.CRITICAL:
        console.error(logMessage);
        break;
    }
    
    // In production, also send to monitoring service
    if (level === LogLevel.ERROR || level === LogLevel.CRITICAL) {
      this.sendToMonitoringService(entry);
    }
  }
  
  private formatLogEntry(entry: LogEntry): string {
    const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.context}] ${entry.message}`;
    
    const metadata = entry.metadata ? ` | Metadata: ${JSON.stringify(entry.metadata)}` : '';
    const error = entry.error ? ` | Error: ${entry.error.message}` : '';
    
    return `${base}${metadata}${error}`;
  }
  
  private async sendToMonitoringService(entry: LogEntry) {
    // In production, integrate with services like:
    // - Sentry for error tracking
    // - DataDog for metrics
    // - LogRocket for session replay
    // - New Relic for APM
    
    // For now, just acknowledge the critical log
    if (entry.level === LogLevel.CRITICAL) {
      console.error('🚨 CRITICAL ERROR - Would send to monitoring service:', entry);
    }
  }
  
  debug(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, metadata);
  }
  
  info(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, metadata);
  }
  
  warn(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, metadata);
  }
  
  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, metadata, error);
  }
  
  critical(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log(LogLevel.CRITICAL, message, metadata, error);
  }
  
  // Specialized logging methods for 27 Circle events
  userJoinedWaitlist(userId: string, timeSlot: string) {
    this.info('User joined waitlist', { userId, timeSlot });
  }
  
  userLeftWaitlist(userId: string, timeSlot: string) {
    this.info('User left waitlist', { userId, timeSlot });
  }
  
  circleCreated(circleId: string, timeSlot: string, memberCount: number, locationId: string) {
    this.info('Circle created', { circleId, timeSlot, memberCount, locationId });
  }
  
  matchingAlgorithmStarted(timeSlot: string, userCount: number) {
    this.info('Matching algorithm started', { timeSlot, userCount });
  }
  
  matchingAlgorithmCompleted(timeSlot: string, circlesCreated: number, usersMatched: number) {
    this.info('Matching algorithm completed', { timeSlot, circlesCreated, usersMatched });
  }
  
  matchingAlgorithmFailed(timeSlot: string, error: Error) {
    this.error('Matching algorithm failed', error, { timeSlot });
  }
  
  databaseError(operation: string, error: Error, metadata?: Record<string, any>) {
    this.error(`Database error during ${operation}`, error, metadata);
  }
  
  performanceMetric(operation: string, durationMs: number, metadata?: Record<string, any>) {
    this.info(`Performance metric: ${operation}`, { durationMs, ...metadata });
  }
}

// Create logger instances for different contexts
export const logger = {
  matching: new Logger('matching'),
  database: new Logger('database'),
  api: new Logger('api'),
  auth: new Logger('auth'),
  time: new Logger('time'),
  system: new Logger('system')
};

// Performance monitoring utility
export class PerformanceMonitor {
  private startTime: number;
  private context: string;
  
  constructor(context: string) {
    this.context = context;
    this.startTime = Date.now();
  }
  
  end(metadata?: Record<string, any>) {
    const duration = Date.now() - this.startTime;
    logger.system.performanceMetric(this.context, duration, metadata);
    return duration;
  }
}

// Error boundary for async operations
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string,
  metadata?: Record<string, any>
): Promise<T | null> {
  const monitor = new PerformanceMonitor(context);
  
  try {
    const result = await operation();
    monitor.end(metadata);
    return result;
  } catch (error) {
    monitor.end({ ...metadata, error: true });
    logger.system.error(`Operation failed: ${context}`, error as Error, metadata);
    return null;
  }
}

// Health check logger
export function logHealthCheck(status: 'healthy' | 'warning' | 'error', checks: Record<string, string>) {
  const message = `Health check: ${status}`;
  
  if (status === 'healthy') {
    logger.system.info(message, { checks });
  } else if (status === 'warning') {
    logger.system.warn(message, { checks });
  } else {
    logger.system.error(message, undefined, { checks });
  }
}

// Startup/shutdown logger
export function logSystemEvent(event: 'startup' | 'shutdown', metadata?: Record<string, any>) {
  logger.system.info(`System ${event}`, metadata);
}

// Rate limiting logger
export function logRateLimit(endpoint: string, ip: string, limit: number) {
  logger.api.warn('Rate limit exceeded', { endpoint, ip, limit });
}

// Authentication logger
export function logAuthEvent(event: 'login' | 'logout' | 'signup' | 'failure', userId?: string, metadata?: Record<string, any>) {
  logger.auth.info(`Auth event: ${event}`, { userId, ...metadata });
}

// Database operation logger
export function logDatabaseOperation(operation: string, table: string, duration: number, recordCount?: number) {
  logger.database.debug(`Database operation: ${operation}`, { table, duration, recordCount });
}

// Circle lifecycle logger
export function logCircleLifecycle(event: 'created' | 'started' | 'completed' | 'cancelled', circleId: string, metadata?: Record<string, any>) {
  logger.matching.info(`Circle ${event}`, { circleId, ...metadata });
}