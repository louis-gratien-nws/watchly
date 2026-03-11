<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <h1 class="font-display text-3xl font-extrabold">Films</h1>

    <!-- Filtres avancés -->
    <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
      <h2 class="font-display text-lg font-bold mb-4">Filtres Avancés</h2>
      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <!-- Genre -->
        <div>
          <label class="block text-sm text-watchly-text-secondary mb-1">Genre</label>
          <select
            v-model="filters.genre"
            @change="applyFilters"
            class="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
          >
            <option value="">Tous les genres</option>
            <option v-for="genre in genres" :key="genre.id" :value="genre.id">
              {{ genre.name }}
            </option>
          </select>
        </div>

        <!-- Années -->
        <div>
          <label class="block text-sm text-watchly-text-secondary mb-1">Année</label>
          <select
            v-model="filters.year"
            @change="applyFilters"
            class="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
          >
            <option value="">Toutes les années</option>
            <option v-for="year in years" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </div>

        <!-- Note IMDB -->
        <div>
          <label class="block text-sm text-watchly-text-secondary mb-1">Note minimale</label>
          <div class="flex items-center gap-2">
            <input
              v-model="filters.rating"
              @change="applyFilters"
              type="range"
              min="0"
              max="10"
              step="0.5"
              class="flex-1"
            />
            <span class="font-semibold">{{ filters.rating }}</span>
          </div>
        </div>

        <!-- Durée -->
        <div>
          <label class="block text-sm text-watchly-text-secondary mb-1">Durée max (min)</label>
          <input
            v-model="filters.duration"
            @change="applyFilters"
            type="number"
            placeholder="120"
            class="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
          />
        </div>

        <!-- Statut de visionnage -->
        <div class="md:col-span-2 lg:col-span-4">
          <label class="block text-sm text-watchly-text-secondary mb-2">Statut</label>
          <div class="flex flex-wrap gap-2">
            <button
              @click="toggleWatchStatus('all')"
              :class="[
                'rounded-lg px-4 py-2 text-sm font-semibold transition',
                filters.watchStatus === 'all'
                  ? 'bg-watchly-accent text-black'
                  : 'border border-white/10 bg-black/20 hover:border-watchly-accent'
              ]"
            >
              Tous
            </button>
            <button
              @click="toggleWatchStatus('watched')"
              :class="[
                'rounded-lg px-4 py-2 text-sm font-semibold transition',
                filters.watchStatus === 'watched'
                  ? 'bg-watchly-accent text-black'
                  : 'border border-white/10 bg-black/20 hover:border-watchly-accent'
              ]"
            >
              ✓ Vus
            </button>
            <button
              @click="toggleWatchStatus('unwatched')"
              :class="[
                'rounded-lg px-4 py-2 text-sm font-semibold transition',
                filters.watchStatus === 'unwatched'
                  ? 'bg-watchly-accent text-black'
                  : 'border border-white/10 bg-black/20 hover:border-watchly-accent'
              ]"
            >
              À voir
            </button>
            <button
              @click="clearFilters"
              class="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-500/20 transition"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Résultats -->
    <div v-if="filteredMovies.length > 0" class="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      <MovieCard
        v-for="movie in filteredMovies"
        :key="movie.id"
        :movie="movie"
        @click="goToMovie(movie)"
      />
    </div>
    <div v-else class="rounded-2xl border border-white/10 bg-watchly-secondary p-12 text-center">
      <p class="text-watchly-text-secondary">Aucun film ne correspond à ces critères</p>
    </div>

    <!-- Carousels par défaut si pas de filtres appliqués -->
    <div v-if="!hasFilter" class="space-y-6">
      <MovieCarousel title="Populaires" :movies="store.popular" @details="goToMovie" />
      <MovieCarousel title="Mieux notes" :movies="store.topRated" @details="goToMovie" />
      <MovieCarousel title="A venir" :movies="store.upcoming" @details="goToMovie" />
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref, computed } from "vue";
import { useRouter } from "vue-router";
import MovieCarousel from "../components/MovieCarousel.vue";
import MovieCard from "../components/MovieCard.vue";
import { useMovieStore } from "../stores/movieStore";
import { useAuthStore } from "../stores/authStore";

const store = useMovieStore();
const auth = useAuthStore();
const router = useRouter();

const filters = ref({
  genre: "",
  year: "",
  rating: "0",
  duration: "",
  watchStatus: "all"
});

const genres = [
  { id: 28, name: "Action" },
  { id: 12, name: "Aventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comédie" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentaire" },
  { id: 18, name: "Drame" },
  { id: 10751, name: "Famille" },
  { id: 14, name: "Fantastique" },
  { id: 27, name: "Horreur" },
  { id: 10402, name: "Musique" },
  { id: 9648, name: "Mystère" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science-Fiction" },
  { id: 10770, name: "Téléfilm" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "Guerre" },
  { id: 37, name: "Western" }
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 30 }, (_, i) => currentYear - i);

const hasFilter = computed(() => {
  return (
    filters.value.genre !== "" ||
    filters.value.year !== "" ||
    filters.value.rating !== "0" ||
    filters.value.duration !== "" ||
    filters.value.watchStatus !== "all"
  );
});

const filteredMovies = computed(() => {
  let movies = [...store.topRated, ...store.popular, ...store.upcoming];
  movies = [...new Set(movies.map(m => JSON.stringify(m)))].map(m => JSON.parse(m));

  return movies.filter(movie => {
    // Genre filter
    if (filters.value.genre && !movie.genre_ids?.includes(parseInt(filters.value.genre))) {
      return false;
    }

    // Year filter
    if (filters.value.year && !movie.release_date?.startsWith(filters.value.year)) {
      return false;
    }

    // Rating filter
    if (parseFloat(filters.value.rating) > 0 && movie.vote_average < parseFloat(filters.value.rating)) {
      return false;
    }

    // Duration filter - would need runtime data from movie details API
    // For now, this is a placeholder
    if (filters.value.duration && movie.runtime > parseInt(filters.value.duration)) {
      return false;
    }

    // Watch status filter
    if (filters.value.watchStatus === "watched" && !auth.user?.watched?.includes(movie.id)) {
      return false;
    }
    if (filters.value.watchStatus === "unwatched" && auth.user?.watched?.includes(movie.id)) {
      return false;
    }

    return true;
  });
});

const applyFilters = () => {
  // Filters are applied via computed property
};

const toggleWatchStatus = (status) => {
  filters.value.watchStatus = filters.value.watchStatus === status ? "all" : status;
  applyFilters();
};

const clearFilters = () => {
  filters.value = {
    genre: "",
    year: "",
    rating: "0",
    duration: "",
    watchStatus: "all"
  };
};

const goToMovie = (movie) => router.push(`/movie/${movie.id}`);

onMounted(() => {
  if (store.popular.length === 0) {
    store.bootstrapHome();
  }
});
</script>

