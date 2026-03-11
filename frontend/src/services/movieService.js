import api from "./api";

export const getTrending = (page = 1) => api.get(`/movies/trending?page=${page}`);
export const getPopular = (page = 1) => api.get(`/movies/popular?page=${page}`);
export const getTopRated = (page = 1) => api.get(`/movies/top-rated?page=${page}`);
export const getUpcoming = (page = 1) => api.get(`/movies/upcoming?page=${page}`);
export const getMovieById = (id) => api.get(`/movies/${id}`);
export const searchMovies = (q, page = 1, extra = "") =>
  api.get(`/movies/search?q=${encodeURIComponent(q)}&page=${page}${extra}`);
