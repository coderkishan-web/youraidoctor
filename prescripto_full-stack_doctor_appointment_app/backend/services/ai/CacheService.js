/**
 * Cache Service for AI Medical Companion (Phase 4)
 * In-memory TTL cache with Redis-ready interface for zero-latency retrieval.
 */

import { observability } from './Observability.js';

class CacheService {
    constructor() {
        this.cache = new Map();
    }

    get(key) {
        if (!this.cache.has(key)) {
            observability.recordCache(false);
            return null;
        }

        const entry = this.cache.get(key);
        if (Date.now() > entry.expiry) {
            this.cache.delete(key);
            observability.recordCache(false);
            return null;
        }

        observability.recordCache(true);
        return entry.value;
    }

    set(key, value, ttlSeconds = 300) {
        const expiry = Date.now() + (ttlSeconds * 1000);
        this.cache.set(key, { value, expiry });
    }

    clear() {
        this.cache.clear();
    }
}

export const cacheService = new CacheService();
