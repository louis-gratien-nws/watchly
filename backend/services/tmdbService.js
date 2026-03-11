const axios = require("axios");

const tmdbClient = axios.create({
  baseURL: process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3",
  timeout: 10000
});

const cache = new Map();
const CACHE_TTL = 1000 * 60 * 5;

const getCached = (key) => {
  const value = cache.get(key);
  if (!value) {
    return null;
  }
  if (Date.now() > value.expiresAt) {
    cache.delete(key);
    return null;
  }
  return value.payload;
};

const setCached = (key, payload) => {
  cache.set(key, { payload, expiresAt: Date.now() + CACHE_TTL });
};

const fetchTmdb = async (path, query = {}) => {
  const key = `${path}|${JSON.stringify(query)}`;
  const cached = getCached(key);
  if (cached) {
    return cached;
  }

  const response = await tmdbClient.get(path, {
    params: {
      api_key: process.env.TMDB_API_KEY,
      language: query.language || "fr-FR",
      ...query
    }
  });

  setCached(key, response.data);
  return response.data;
};

module.exports = {
  fetchTmdb
};
