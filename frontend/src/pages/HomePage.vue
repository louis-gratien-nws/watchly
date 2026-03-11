<template>
  <section class="w-full space-y-10 px-4 pb-10 md:px-8 xl:px-10">
    <HeroBanner :movie="heroMovie" @add="onAddWatchlist" @watch="onMarkWatched" />

    <div v-if="movieStore.loading" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div v-for="n in 4" :key="n" class="h-64 animate-pulse rounded-2xl bg-watchly-secondary" />
    </div>

    <div
      v-else-if="showEmptyState"
      class="rounded-2xl border border-white/10 bg-watchly-secondary/40 p-6 text-center"
    >
      <p class="font-display text-xl font-bold">Aucun film charge</p>
      <p class="mt-2 text-sm text-watchly-text-secondary">
        {{ movieStore.error || "Verifie que l'API backend tourne puis recharge les donnees." }}
      </p>
      <button
        class="mt-4 rounded-xl bg-watchly-accent px-4 py-2 font-semibold text-white hover:brightness-110"
        @click="movieStore.bootstrapHome"
      >
        Reessayer
      </button>
    </div>

    <template v-else>
      <MovieCarousel
        title="Tendances du moment"
        :movies="movieStore.trending"
        @add="onAddWatchlist"
        @watch="onMarkWatched"
        @details="goToMovie"
      />
      <MovieCarousel
        title="Films populaires"
        :movies="movieStore.popular"
        @add="onAddWatchlist"
        @watch="onMarkWatched"
        @details="goToMovie"
      />
      <MovieCarousel
        title="Mieux notes"
        :movies="movieStore.topRated"
        @add="onAddWatchlist"
        @watch="onMarkWatched"
        @details="goToMovie"
      />
      <MovieCarousel
        title="Parce que vous avez regarde"
        :movies="movieStore.upcoming"
        @add="onAddWatchlist"
        @watch="onMarkWatched"
        @details="goToMovie"
      />
      <MovieCarousel
        title="Votre liste de suivi"
        :movies="watchlistMovies"
        @add="onAddWatchlist"
        @watch="onMarkWatched"
        @details="goToMovie"
      />
      <MovieCarousel
        title="Parce que vous avez aime"
        :movies="movieStore.recommended"
        @add="onAddWatchlist"
        @watch="onMarkWatched"
        @details="goToMovie"
      />
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useRouter } from "vue-router";
import HeroBanner from "../components/HeroBanner.vue";
import MovieCarousel from "../components/MovieCarousel.vue";
import { useMovieStore } from "../stores/movieStore";
import { useUserStore } from "../stores/userStore";
import { useAuthStore } from "../stores/authStore";

const router = useRouter();
const movieStore = useMovieStore();
const userStore = useUserStore();
const authStore = useAuthStore();
const heroIndex = ref(0);
let interval = null;

onMounted(async () => {
  await movieStore.bootstrapHome();
  await movieStore.fetchRecommendations();
  if (authStore.user?._id) {
    userStore.fetchWatchlist(authStore.user._id);
  }

  interval = setInterval(() => {
    if (movieStore.trending.length > 0) {
      heroIndex.value = (heroIndex.value + 1) % movieStore.trending.length;
    }
  }, 7000);
});

onUnmounted(() => {
  clearInterval(interval);
});

const heroMovie = computed(() => movieStore.trending[heroIndex.value] || null);
const showEmptyState = computed(
  () =>
    !movieStore.loading &&
    !movieStore.trending.length &&
    !movieStore.popular.length &&
    !movieStore.topRated.length &&
    !movieStore.upcoming.length
);

const watchlistMovies = computed(() => {
  const ids = new Set(userStore.watchlist);
  return movieStore.trending.filter((movie) => ids.has(movie.id));
});

const onAddWatchlist = async (movie) => {
  if (!movie?.id) {
    return;
  }
  await userStore.addToWatchlist(movie.id);
};

const onMarkWatched = async (movie) => {
  if (!movie?.id) {
    return;
  }
  await userStore.markWatched(movie.id);
};

const goToMovie = (movie) => {
  router.push(`/movie/${movie.id}`);
};
</script>
