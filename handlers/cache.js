const messageCache = new Map();
const MAX_CACHE_SIZE = 1000;

export function addToCache(id, msg) {
    if (messageCache.size >= MAX_CACHE_SIZE) {
        // Remove the oldest message to save memory
        const firstKey = messageCache.keys().next().value;
        messageCache.delete(firstKey);
    }
    messageCache.set(id, msg);
}

export function getFromCache(id) {
    return messageCache.get(id) || null;
}

export function removeFromCache(id) {
    messageCache.delete(id);
}