// Secure Local Character Data Cache
// This prevents connection issues when switching windows and provides offline persistence
// Security: All data is read-only locally - updates only come from server responses

import { CharacterStats, UserSkill } from './database';

interface CachedCharacterData {
  stats: CharacterStats | null;
  skills: UserSkill[];
  lastUpdated: number;
  userId: string;
  version: string; // Prevents tampering
}

const CACHE_KEY = 'cia_character_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Generate a simple hash for data integrity (prevents basic tampering)
function generateDataHash(data: Record<string, unknown>): string {
  const jsonString = JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Verify data integrity
function verifyDataIntegrity(cachedData: CachedCharacterData): boolean {
  const { version, userId, stats, skills, lastUpdated } = cachedData;
  const dataToHash = { userId, stats, skills, lastUpdated };
  const expectedHash = generateDataHash(dataToHash);
  return version === expectedHash;
}

export class CharacterCache {
  private static instance: CharacterCache;
  private cache: CachedCharacterData | null = null;

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): CharacterCache {
    if (!CharacterCache.instance) {
      CharacterCache.instance = new CharacterCache();
    }
    return CharacterCache.instance;
  }

  private loadFromStorage(): void {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsedCache: CachedCharacterData = JSON.parse(cached);
        
        // Verify data integrity and expiration
        if (this.isCacheValid(parsedCache) && verifyDataIntegrity(parsedCache)) {
          this.cache = parsedCache;
          console.log('📦 Character cache loaded from storage');
        } else {
          console.log('🗑️ Invalid or expired cache, clearing...');
          this.clearCache();
        }
      }
    } catch (error) {
      console.error('❌ Error loading character cache:', error);
      this.clearCache();
    }
  }

  private saveToStorage(): void {
    try {
      if (this.cache) {
        localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
        console.log('💾 Character cache saved to storage');
      }
    } catch (error) {
      console.error('❌ Error saving character cache:', error);
    }
  }

  private isCacheValid(cachedData: CachedCharacterData): boolean {
    const now = Date.now();
    const isExpired = (now - cachedData.lastUpdated) > CACHE_DURATION;
    return !isExpired;
  }

  public getCachedData(userId: string): { stats: CharacterStats | null; skills: UserSkill[] } | null {
    if (!this.cache || this.cache.userId !== userId) {
      return null;
    }

    if (!this.isCacheValid(this.cache)) {
      console.log('⏰ Cache expired, clearing...');
      this.clearCache();
      return null;
    }

    console.log('🎯 Using cached character data');
    return {
      stats: this.cache.stats,
      skills: this.cache.skills
    };
  }

  public updateCache(
    userId: string, 
    stats: CharacterStats | null, 
    skills: UserSkill[]
  ): void {
    const now = Date.now();
    const dataToHash = { userId, stats, skills, lastUpdated: now };
    const version = generateDataHash(dataToHash);

    this.cache = {
      stats,
      skills,
      lastUpdated: now,
      userId,
      version
    };

    this.saveToStorage();
    console.log('🔄 Character cache updated for user:', userId);
  }

  public clearCache(): void {
    this.cache = null;
    try {
      localStorage.removeItem(CACHE_KEY);
      console.log('🗑️ Character cache cleared');
    } catch (error) {
      console.error('❌ Error clearing cache:', error);
    }
  }

  public invalidateCache(userId: string): void {
    if (this.cache && this.cache.userId === userId) {
      console.log('🔄 Invalidating cache for user:', userId);
      this.clearCache();
    }
  }

  // Check if we should fetch fresh data
  public shouldRefresh(userId: string): boolean {
    if (!this.cache || this.cache.userId !== userId) {
      return true;
    }

    const now = Date.now();
    const timeSinceUpdate = now - this.cache.lastUpdated;
    const shouldRefresh = timeSinceUpdate > (CACHE_DURATION / 2); // Refresh at 50% of cache duration
    
    if (shouldRefresh) {
      console.log('🔄 Cache refresh recommended');
    }
    
    return shouldRefresh;
  }
} 