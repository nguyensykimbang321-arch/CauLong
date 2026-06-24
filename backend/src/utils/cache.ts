import { redisClient, isCacheEnabled } from '../config/redis.js';

const isEnabled = (): boolean => {
    return isCacheEnabled && redisClient !== null && redisClient.isOpen;
};

export async function getCache<T>(key: string): Promise<T | null> {
    if (!isEnabled() || !redisClient) {
        return null;
    }
    try {
        const value = await redisClient.get(key);
        if (!value) {
            return null;
        }
        try {
            return JSON.parse(value) as T;
        } catch (parseError) {
            console.error(`[Cache Error] Lỗi parse JSON cho key ${key}:`, parseError);
            return null;
        }
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Cache Error] Lỗi đọc cache cho key ${key}:`, errMsg);
        return null;
    }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!isEnabled() || !redisClient) {
        return;
    }
    try {
        const stringified = JSON.stringify(value);
        await redisClient.set(key, stringified, {
            EX: ttlSeconds
        });
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Cache Error] Lỗi ghi cache cho key ${key}:`, errMsg);
    }
}

export async function deleteCache(key: string): Promise<void> {
    if (!isEnabled() || !redisClient) {
        return;
    }
    try {
        await redisClient.del(key);
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Cache Error] Lỗi xóa cache cho key ${key}:`, errMsg);
    }
}

export async function deleteCacheByPattern(pattern: string): Promise<void> {
    if (!isEnabled() || !redisClient) {
        return;
    }
    try {
        let cursor = '0';
        do {
            const reply = await redisClient.scan(cursor, {
                MATCH: pattern,
                COUNT: 100
            });
            cursor = reply.cursor;
            if (reply.keys.length > 0) {
                await redisClient.del(reply.keys);
            }
        } while (cursor !== '0');
    } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn(`[Cache Error] Lỗi xóa cache theo pattern ${pattern}:`, errMsg);
    }
}
