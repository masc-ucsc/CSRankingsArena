const NodeCache = require('node-cache');

// Create cache with default TTL of 1 hour
const cache = new NodeCache({
  stdTTL: 3600, // 1 hour in seconds
  checkperiod: 600 // Check for expired keys every 10 minutes
});

// Wrapper function to cache API responses
const cacheWrapper = async (key, ttl, fetchFunction) => {
  // Check if data exists in cache
  const cachedData = cache.get(key);
  if (cachedData) {
    return cachedData;
  }
  
  // If not in cache, fetch fresh data
  const data = await fetchFunction();
  
  // Store in cache with TTL
  cache.set(key, data, ttl);
  
  return data;
};

// Clear all cache or by key pattern
const clearCache = (pattern) => {
  if (!pattern) {
    // Clear all cache
    cache.flushAll();
    return;
  }
  
  // Clear by pattern
  const keys = cache.keys();
  const matchingKeys = keys.filter(key => key.includes(pattern));
  matchingKeys.forEach(key => cache.del(key));
};

module.exports = {
  cacheWrapper,
  clearCache
};