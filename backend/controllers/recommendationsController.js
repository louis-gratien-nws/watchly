const User = require("../models/User");
const { fetchTmdb } = require("../services/tmdbService");

const getRecommendations = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select(
      "preferredGenres watched favorites"
    );

    const likedSeed = user.favorites?.[0] || user.watched?.[user.watched.length - 1];
    if (likedSeed) {
      const similar = await fetchTmdb(`/movie/${likedSeed}/similar`, { page: 1 });
      if ((similar.results || []).length > 0) {
        return res.json({
          source: `because_you_liked:${likedSeed}`,
          results: similar.results || []
        });
      }
    }

    // Simple recommendation strategy:
    // prioritize first preferred genre, fallback to popular list.
    if (!user.preferredGenres || user.preferredGenres.length === 0) {
      const fallback = await fetchTmdb("/movie/popular", { page: 1 });
      return res.json({ source: "popular", results: fallback.results || [] });
    }

    const genreId = user.preferredGenres[0];
    const data = await fetchTmdb("/discover/movie", {
      with_genres: genreId,
      sort_by: "popularity.desc",
      page: 1
    });

    return res.json({ source: `genre:${genreId}`, results: data.results || [] });
  } catch (error) {
    return next(error);
  }
};

module.exports = { getRecommendations };
