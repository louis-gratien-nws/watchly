import { defineStore } from "pinia";
import {
  getTrending,
  getPopular,
  getTopRated,
  getUpcoming,
  getMovieById
} from "../services/movieService";
import api from "../services/api";

export const useMovieStore = defineStore("movies", {
  state: () => ({
    trending: [],
    popular: [],
    topRated: [],
    upcoming: [],
    recommended: [],
    selectedMovie: null,
    loading: false,
    error: null,
    cache: {}
  }),
  actions: {
    async bootstrapHome() {
      this.loading = true;
      this.error = null;
      try {
        const [trendingRes, popularRes, topRatedRes, upcomingRes] = await Promise.allSettled([
          getTrending(),
          getPopular(),
          getTopRated(),
          getUpcoming()
        ]);

        this.trending =
          trendingRes.status === "fulfilled" ? trendingRes.value.data.results || [] : [];
        this.popular =
          popularRes.status === "fulfilled" ? popularRes.value.data.results || [] : [];
        this.topRated =
          topRatedRes.status === "fulfilled" ? topRatedRes.value.data.results || [] : [];
        this.upcoming =
          upcomingRes.status === "fulfilled" ? upcomingRes.value.data.results || [] : [];

        const hasAnyMovie =
          this.trending.length || this.popular.length || this.topRated.length || this.upcoming.length;
        if (!hasAnyMovie) {
          this.error = "Impossible de charger les films. Vérifie que le backend est lancé sur le port 5000.";
        }
      } catch (error) {
        this.error = "Impossible de charger les films. Vérifie la connexion API.";
      } finally {
        this.loading = false;
      }
    },
    async fetchRecommendations() {
      try {
        const { data } = await api.get("/recommendations");
        this.recommended = data.results || [];
      } catch {
        this.recommended = [];
      }
    },
    async loadMovie(id) {
      if (this.cache[id]) {
        this.selectedMovie = this.cache[id];
        return;
      }

      this.loading = true;
      try {
        const { data } = await getMovieById(id);
        this.selectedMovie = data;
        this.cache[id] = data;
      } finally {
        this.loading = false;
      }
    }
  }
});
