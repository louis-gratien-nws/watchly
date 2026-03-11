const { fetchTmdb } = require("../services/tmdbService");

const withPage = (req) => ({ page: Number(req.query.page || 1) });

const trending = async (req, res, next) => {
  try {
    const data = await fetchTmdb("/trending/movie/week", withPage(req));
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const popular = async (req, res, next) => {
  try {
    const data = await fetchTmdb("/movie/popular", withPage(req));
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const topRated = async (req, res, next) => {
  try {
    const data = await fetchTmdb("/movie/top_rated", withPage(req));
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const upcoming = async (req, res, next) => {
  try {
    const data = await fetchTmdb("/movie/upcoming", withPage(req));
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await fetchTmdb(`/movie/${req.params.id}`, {
      append_to_response: "credits,similar"
    });
    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const { q = "", page = 1, year, language = "fr-FR" } = req.query;

    if (!q.trim()) {
      return res.json({ page: 1, results: [], total_pages: 0, total_results: 0 });
    }

    const data = await fetchTmdb("/search/movie", {
      query: q,
      page,
      year,
      language,
      include_adult: false
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

const discover = async (req, res, next) => {
  try {
    const {
      page = 1,
      with_genres,
      primary_release_year,
      "vote_average.gte": voteAverageGte,
      "vote_count.gte": voteCountGte,
      with_original_language,
      sort_by = "popularity.desc"
    } = req.query;

    const data = await fetchTmdb("/discover/movie", {
      page,
      with_genres,
      primary_release_year,
      "vote_average.gte": voteAverageGte,
      "vote_count.gte": voteCountGte,
      with_original_language,
      sort_by,
      include_adult: false
    });

    return res.json(data);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  trending,
  popular,
  topRated,
  upcoming,
  getById,
  search,
  discover
};
