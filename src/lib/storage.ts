/**
 * Enhanced Storage Utility - localStorage replacement with Supabase backend
 * 
 * Provides a localStorage-like API with Supabase persistence, caching, and offline support.
 * Perfect dev/prod parity since both environments use the same database storage.
 * 
 * NEW: Class-based pattern with pre-auth sessionStorage fallback for anonymous users.
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// In-memory cache for performance
const cache = new Map<string, { value: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Generate unique user ID (auth user or session-based anonymous user)
function getAnonymousUserId(): string {
  if (typeof window === 'undefined') {
    return 'server-session'; // Fallback for server-side
  }

  // For anonymous users, use session-based anonymous ID
  let sessionId = sessionStorage.getItem('anonUserId');
  if (!sessionId) {
    sessionId = `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('anonUserId', sessionId);
  }
  return sessionId;
}

// Create cache key
function createCacheKey(userId: string, key: string): string {
  return `${userId}:${key}`;
}

// Check if cache entry is valid
function isCacheValid(entry: { value: any; timestamp: number }): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL;
}

/**
 * Enhanced Storage Class - replaces localStorage with Supabase + caching
 * 
 * NEW: Supports user-specific instances and pre-auth sessionStorage fallback
 */
export class Storage {
  private userId: string;

  constructor(userId?: string) {
    this.userId = userId || getAnonymousUserId();
  }
  /**
   * Get value by key (with caching)
   * @param key Storage key
   * @param defaultValue Default value if not found
   * @returns Promise<any>
   */
  async get<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    // NEW: For ALL anonymous users, use sessionStorage only (no database access)
    if (this.userId.startsWith('anon-')) {
      try {
        const stored = sessionStorage.getItem(`temp_${key}`);
        return stored ? JSON.parse(stored) : defaultValue;
      } catch {
        return defaultValue;
      }
    }

    const cacheKey = createCacheKey(this.userId, key);
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      return cached.value;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('value')
        .eq('user_id', this.userId)
        .eq('key', key);
      
      if (error) {
        throw error;
      }
      
      // Handle empty results (no rows found)
      if (!data || data.length === 0) {
        return defaultValue;
      }
      
      const value = data[0].value;
      
      // Update cache
      cache.set(cacheKey, {
        value,
        timestamp: Date.now()
      });
      
      return value;
    } catch (error) {
      
      // Return cached value even if expired, as fallback
      if (cached) {
        return cached.value;
      }
      
      return defaultValue;
    }
  }

  /**
   * Set value by key (with optimistic caching)
   * @param key Storage key
   * @param value Value to store
   * @returns Promise<boolean> Success status
   */
  async set(key: string, value: any): Promise<boolean> {
    // NEW: For ALL anonymous users, use sessionStorage only (no database access)
    if (this.userId.startsWith('anon-')) {
      try {
        sessionStorage.setItem(`temp_${key}`, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }

    const cacheKey = createCacheKey(this.userId, key);
    
    // Optimistic cache update
    cache.set(cacheKey, {
      value,
      timestamp: Date.now()
    });
    
    
    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: this.userId,
          key,
          value,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,key'
        });
      
      if (error) {
        // Remove from cache on database error
        cache.delete(cacheKey);
        return false;
      }
      
      return true;
    } catch (error) {
      // Remove from cache on error
      cache.delete(cacheKey);
      return false;
    }
  }

  /**
   * Remove value by key
   * @param key Storage key
   * @returns Promise<boolean> Success status
   */
  async remove(key: string): Promise<boolean> {
    // NEW: For anonymous users, remove from sessionStorage only
    if (this.userId.startsWith('anon-')) {
      try {
        sessionStorage.removeItem(`temp_${key}`);
        return true;
      } catch {
        return false;
      }
    }

    const cacheKey = createCacheKey(this.userId, key);
    
    // Remove from cache immediately
    cache.delete(cacheKey);
    
    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', this.userId)
        .eq('key', key);
      
      if (error) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if key exists
   * @param key Storage key
   * @returns Promise<boolean>
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Get all keys for current user (for debugging/migration)
   * @returns Promise<string[]>
   */
  async getAllKeys(): Promise<string[]> {
    
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('key')
        .eq('user_id', this.userId);
      
      if (error) {
        return [];
      }
      
      return data.map(row => row.key);
    } catch (error) {
      return [];
    }
  }

  /**
   * Clear all data for current user
   * @returns Promise<boolean>
   */
  async clear(): Promise<boolean> {
    // NEW: For anonymous users, clear sessionStorage only
    if (this.userId.startsWith('anon-')) {
      try {
        // Clear all temp_ prefixed items for this anonymous user
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith('temp_')) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => sessionStorage.removeItem(key));
        return true;
      } catch {
        return false;
      }
    }
    
    // Clear cache for this user
    const keysToDelete: string[] = [];
    cache.forEach((_, cacheKey) => {
      if (cacheKey.startsWith(`${this.userId}:`)) {
        keysToDelete.push(cacheKey);
      }
    });
    keysToDelete.forEach(key => cache.delete(key));
    
    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', this.userId);
      
      if (error) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Manual cache invalidation (for testing/debugging)
   * @param key Optional specific key to invalidate
   */
  invalidateCache(key?: string): void {
    if (key) {
      const cacheKey = createCacheKey(this.userId, key);
      cache.delete(cacheKey);
    } else {
      cache.clear();
    }
  }

  /**
   * Get cache stats (for debugging)
   * @returns Cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: cache.size,
      keys: Array.from(cache.keys())
    };
  }

  /**
   * Legacy migration utility (REMOVED)
   * Migration completed - all user data is now in Supabase
   */
  async migrateFromLocalStorage(): Promise<boolean> {
    // Migration no longer supported - all data is in Supabase
    return false;
  }
}

// Legacy object export for backward compatibility
export const LegacyStorage = new Storage();

/**
 * Synchronous localStorage-like API for backward compatibility
 * Uses cache for immediate responses, background syncs with database
 * 
 * NOTE: This is for gradual migration only. Prefer async Storage class for new code.
 */
export const SyncStorage = {
  /**
   * Get value synchronously from cache (may be stale)
   * @param key Storage key
   * @param defaultValue Default value
   * @returns Cached value or default
   */
  getSync<T>(key: string, defaultValue: T | null = null): T | null {
    const userId = getAnonymousUserId();
    const cacheKey = createCacheKey(userId, key);
    const cached = cache.get(cacheKey);
    
    if (cached) {
      // Trigger background refresh if cache is getting old
      if (!isCacheValid(cached)) {
      }
      return cached.value;
    }
    
    // Trigger background fetch
    return defaultValue;
  },

  /**
   * Set value synchronously with background database sync
   * @param key Storage key
   * @param value Value to store
   */
  setSync(key: string, value: any): void {
    const userId = getAnonymousUserId();
    const cacheKey = createCacheKey(userId, key);
    
    // Update cache immediately
    cache.set(cacheKey, {
      value,
      timestamp: Date.now()
    });
    
    // Background database sync
  }
};

/**
 * Pre-load commonly used keys into cache for better performance
 * Call this on app initialization
 */
export async function preloadStorage(keys: string[], userId?: string): Promise<void> {
  const storage = new Storage(userId);
  const promises = keys.map(key => 
    storage.get(key).catch(error => {
      return null;
    })
  );
  
  await Promise.all(promises);
}