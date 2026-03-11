<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <header class="flex items-center justify-between">
      <h1 class="font-display text-3xl font-extrabold">Ma liste</h1>
      <p class="text-sm text-watchly-text-secondary">{{ rows.length }} films sauvegardes</p>
    </header>

    <div v-if="rows.length === 0" class="rounded-2xl border border-white/10 bg-watchly-secondary p-8 text-center text-watchly-text-secondary">
      Votre watchlist est vide.
    </div>

    <div v-else class="space-y-4">
      <article
        v-for="item in rows"
        :key="item.id"
        class="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-watchly-secondary transition hover:border-watchly-accent/70"
        @click="openMovie(item.id)"
      >
        <div class="absolute inset-0 bg-cover bg-center" :style="{ backgroundImage: `url(${item.backdrop})` }" />
        <div class="absolute inset-0 bg-gradient-to-r from-black/85 via-black/75 to-black/55" />

        <div class="relative flex min-h-[156px] flex-col justify-between gap-4 p-4 md:min-h-[180px] md:flex-row md:items-end md:p-5">
          <div class="max-w-3xl space-y-2">
            <p class="text-[11px] uppercase tracking-[0.18em] text-watchly-text-secondary">Film #{{ item.id }}</p>
            <h2 class="font-display text-2xl font-extrabold leading-tight md:text-3xl">{{ item.title }}</h2>
            <p class="text-sm text-watchly-text-secondary">{{ item.yearLabel }}</p>
            <p class="line-clamp-2 text-sm text-watchly-text-secondary">{{ item.reviewSnippet }}</p>
          </div>

          <div class="flex flex-wrap items-center gap-2 text-xs md:justify-end">
            <span class="rounded-full border border-watchly-accent/40 bg-watchly-accent/15 px-3 py-1 font-semibold text-watchly-accent">
              Ma note: {{ item.myRatingLabel }}
            </span>
            <button class="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20" @click.stop="markWatched(item.id)">vu</button>
            <button class="rounded-lg bg-white/10 px-3 py-1 hover:bg-white/20" @click.stop="remove(item.id)">retirer</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";
import { getMovieById } from "../services/movieService";

const router = useRouter();
const authStore = useAuthStore();
const userStore = useUserStore();
const movieDetails = ref({});
const fallbackBackdrop = "https://placehold.co/1600x900/111111/ffffff?text=Watchly";

const loadMovieDetails = async () => {
  const ids = [...new Set(userStore.watchlist)].filter(Boolean);
  const missing = ids.filter((id) => !movieDetails.value[id]);

  if (missing.length === 0) return;

  const results = await Promise.allSettled(missing.map((id) => getMovieById(id)));
  const next = { ...movieDetails.value };

  results.forEach((result, index) => {
    const id = missing[index];
    if (result.status === "fulfilled") {
      next[id] = result.value.data;
    } else {
      next[id] = { id, title: `Film #${id}` };
    }
  });

  movieDetails.value = next;
};

onMounted(async () => {
  if (authStore.user?._id) {
    await Promise.all([
      userStore.fetchWatchlist(authStore.user._id),
      userStore.fetchMyReviews()
    ]);
    await loadMovieDetails();
  }
});

watch(
  () => [...userStore.watchlist],
  async () => {
    await loadMovieDetails();
  }
);

const reviewByMovie = computed(() => {
  const map = new Map();
  userStore.myReviews.forEach((review) => {
    if (!map.has(review.movieId)) {
      map.set(review.movieId, review);
    }
  });
  return map;
});

const rows = computed(() =>
  userStore.watchlist.map((id) => {
    const details = movieDetails.value[id] || {};
    const myReview = reviewByMovie.value.get(id);
    const backdropPath = details.backdrop_path || details.poster_path || "";

    return {
      id,
      title: details.title || details.name || `Film #${id}`,
      yearLabel: details.release_date ? details.release_date.slice(0, 4) : "Date inconnue",
      backdrop: backdropPath
        ? `https://image.tmdb.org/t/p/w1280${backdropPath}`
        : fallbackBackdrop,
      myRatingLabel: myReview?.rating ? `${myReview.rating}/5` : "pas encore notee",
      reviewSnippet: myReview?.reviewText || "Clique pour voir la fiche complete et tes avis."
    };
  })
);

const openMovie = (id) => router.push(`/movie/${id}`);
const remove = (id) => userStore.removeFromWatchlist(id);
const markWatched = (id) => userStore.markWatched(id);
</script>
