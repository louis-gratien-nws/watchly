<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <header class="space-y-4">
      <h1 class="font-display text-3xl font-extrabold">Decouvrir</h1>
      <SearchBar v-model="query" placeholder="Rechercher par titre..." :debounce-ms="450" />
      <div class="grid gap-3 md:grid-cols-4">
        <input v-model="genre" type="number" placeholder="ID du genre" class="rounded-xl border border-white/10 bg-watchly-secondary px-3 py-2 text-sm" />
        <input v-model="year" type="number" placeholder="Annee" class="rounded-xl border border-white/10 bg-watchly-secondary px-3 py-2 text-sm" />
        <select v-model="sortBy" class="rounded-xl border border-white/10 bg-watchly-secondary px-3 py-2 text-sm">
          <option value="popularity.desc">Popularite</option>
          <option value="vote_average.desc">Note</option>
          <option value="primary_release_date.desc">Plus recents</option>
        </select>
        <input v-model="language" type="text" placeholder="Langue (fr-FR)" class="rounded-xl border border-white/10 bg-watchly-secondary px-3 py-2 text-sm" />
      </div>
      <div class="grid gap-3 md:grid-cols-4">
        <input v-model="minRating" type="number" min="0" max="10" placeholder="Note min" class="rounded-xl border border-white/10 bg-watchly-secondary px-3 py-2 text-sm" />
        <input v-model="minPopularity" type="number" min="0" placeholder="Votes de popularite min" class="rounded-xl border border-white/10 bg-watchly-secondary px-3 py-2 text-sm" />
        <button class="rounded-xl bg-watchly-accent px-4 py-2 text-sm font-semibold" @click="search">
          Appliquer les filtres
        </button>
      </div>
    </header>

    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      <MovieCard
        v-for="movie in filtered"
        :key="movie.id"
        :movie="movie"
        size="grid"
        @details="goToMovie"
        @add="addToWatchlist"
        @watch="markWatched"
      />
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import SearchBar from "../components/SearchBar.vue";
import MovieCard from "../components/MovieCard.vue";
import { searchMovies } from "../services/movieService";
import { useUserStore } from "../stores/userStore";
import api from "../services/api";

const router = useRouter();
const userStore = useUserStore();

const query = ref("interstellar");
const genre = ref("");
const year = ref("");
const language = ref("fr-FR");
const minRating = ref(0);
const minPopularity = ref(100);
const sortBy = ref("popularity.desc");
const results = ref([]);

const search = async () => {
  if (query.value.trim().length >= 2) {
    const extra = `${year.value ? `&year=${year.value}` : ""}&language=${language.value || "fr-FR"}`;
    const { data } = await searchMovies(query.value, 1, extra);
    results.value = data.results || [];
    return;
  }

  const params = new URLSearchParams();
  params.set("page", "1");
  params.set("sort_by", sortBy.value);
  if (genre.value) params.set("with_genres", genre.value);
  if (year.value) params.set("primary_release_year", year.value);
  if (minRating.value) params.set("vote_average.gte", String(minRating.value));
  if (minPopularity.value) params.set("vote_count.gte", String(minPopularity.value));
  if (language.value) params.set("with_original_language", language.value.split("-")[0]);

  const { data } = await api.get(`/movies/discover?${params.toString()}`);
  results.value = data.results || [];
};

watch(query, () => {
  if (query.value.trim().length >= 2) {
    search();
  }
});

search();

const filtered = computed(() =>
  results.value.filter((movie) => (movie.vote_average || 0) >= Number(minRating.value || 0))
);

const goToMovie = (movie) => router.push(`/movie/${movie.id}`);
const addToWatchlist = (movie) => userStore.addToWatchlist(movie.id);
const markWatched = (movie) => userStore.markWatched(movie.id);
</script>
