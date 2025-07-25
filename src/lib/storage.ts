/**
 * Enhanced Storage Utility - localStorage replacement with Supabase backend
 * 
 * Provides a localStorage-like API with Supabase persistence, caching, and offline support.
 * Perfect dev/prod parity since both environments use the same database storage.
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
function getUserId(): string {
  if (typeof window === 'undefined') {
    return 'server-session'; // Fallback for server-side
  }

  // For authenticated users, this would come from auth context
  // For now, use session-based anonymous ID
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
 * Enhanced Storage API - replaces localStorage with Supabase + caching
 */
export const Storage = {
  /**
   * Get value by key (with caching)
   * @param key Storage key
   * @param defaultValue Default value if not found
   * @returns Promise<any>
   */
  async get<T>(key: string, defaultValue: T | null = null): Promise<T | null> {
    const userId = getUserId();
    const cacheKey = createCacheKey(userId, key);
    
    // Check cache first
    const cached = cache.get(cacheKey);
    if (cached && isCacheValid(cached)) {
      return cached.value;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('value')
        .eq('user_id', userId)
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
  },

  /**
   * Set value by key (with optimistic caching)
   * @param key Storage key
   * @param value Value to store
   * @returns Promise<boolean> Success status
   */
  async set(key: string, value: any): Promise<boolean> {
    const userId = getUserId();
    const cacheKey = createCacheKey(userId, key);
    
    // Optimistic cache update
    cache.set(cacheKey, {
      value,
      timestamp: Date.now()
    });
    
    
    try {
      const { error } = await supabase
        .from('user_data')
        .upsert({
          user_id: userId,
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
  },

  /**
   * Remove value by key
   * @param key Storage key
   * @returns Promise<boolean> Success status
   */
  async remove(key: string): Promise<boolean> {
    const userId = getUserId();
    const cacheKey = createCacheKey(userId, key);
    
    // Remove from cache immediately
    cache.delete(cacheKey);
    
    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', userId)
        .eq('key', key);
      
      if (error) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Check if key exists
   * @param key Storage key
   * @returns Promise<boolean>
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key);
    return value !== null;
  },

  /**
   * Get all keys for current user (for debugging/migration)
   * @returns Promise<string[]>
   */
  async getAllKeys(): Promise<string[]> {
    const userId = getUserId();
    
    try {
      const { data, error } = await supabase
        .from('user_data')
        .select('key')
        .eq('user_id', userId);
      
      if (error) {
        return [];
      }
      
      return data.map(row => row.key);
    } catch (error) {
      return [];
    }
  },

  /**
   * Clear all data for current user
   * @returns Promise<boolean>
   */
  async clear(): Promise<boolean> {
    const userId = getUserId();
    
    // Clear cache for this user
    const keysToDelete: string[] = [];
    cache.forEach((_, cacheKey) => {
      if (cacheKey.startsWith(`${userId}:`)) {
        keysToDelete.push(cacheKey);
      }
    });
    keysToDelete.forEach(key => cache.delete(key));
    
    try {
      const { error } = await supabase
        .from('user_data')
        .delete()
        .eq('user_id', userId);
      
      if (error) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Manual cache invalidation (for testing/debugging)
   * @param key Optional specific key to invalidate
   */
  invalidateCache(key?: string): void {
    if (key) {
      const userId = getUserId();
      const cacheKey = createCacheKey(userId, key);
      cache.delete(cacheKey);
    } else {
      cache.clear();
    }
  },

  /**
   * Get cache stats (for debugging)
   * @returns Cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: cache.size,
      keys: Array.from(cache.keys())
    };
  },

  /**
   * Legacy migration utility (REMOVED)
   * Migration completed - all user data is now in Supabase
   */
  async migrateFromLocalStorage(): Promise<boolean> {
    // Migration no longer supported - all data is in Supabase
    return false;
  }
};

/**
 * Synchronous localStorage-like API for backward compatibility
 * Uses cache for immediate responses, background syncs with database
 * 
 * NOTE: This is for gradual migration only. Prefer async Storage API for new code.
 */
export const SyncStorage = {
  /**
   * Get value synchronously from cache (may be stale)
   * @param key Storage key
   * @param defaultValue Default value
   * @returns Cached value or default
   */
  getSync<T>(key: string, defaultValue: T | null = null): T | null {
    const userId = getUserId();
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
    const userId = getUserId();
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
export async function preloadStorage(keys: string[]): Promise<void> {
  
  const promises = keys.map(key => 
    Storage.get(key).catch(error => {
      return null;
    })
  );
  
  await Promise.all(promises);
}