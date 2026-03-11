<template>
  <section v-if="movie" class="space-y-8 px-4 pb-10 pt-4 md:px-8 xl:px-10">
    <div class="relative overflow-hidden rounded-3xl border border-white/10" :style="heroStyle">
      <div class="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/40" />
      <div class="relative grid gap-6 p-4 md:p-6 lg:grid-cols-[340px,1fr] lg:items-end lg:p-8 xl:grid-cols-[380px,1fr]">
        <div class="mx-auto w-full max-w-[340px] lg:mx-0 lg:max-w-none">
          <img
            :src="posterUrl"
            :alt="movie.title"
            class="h-[470px] w-full rounded-2xl border border-white/10 object-cover shadow-2xl md:h-[520px]"
          />
        </div>

        <div class="space-y-4 pb-1">
          <p class="text-xs uppercase tracking-[0.25em] text-watchly-accent">Fiche film</p>
          <h1 class="font-display text-3xl font-extrabold leading-tight md:text-5xl xl:text-6xl">{{ movie.title }}</h1>
          <p class="text-sm text-watchly-text-secondary md:text-base">
            {{ releaseYear }} | {{ movie.runtime }} min | {{ genreLine }} | {{ movie.vote_average?.toFixed(1) }}/10
          </p>
          <p class="max-w-3xl text-sm text-watchly-text-secondary md:text-base">
            {{ movie.overview }}
          </p>

          <div class="flex flex-wrap gap-2">
            <span v-for="genre in movie.genres || []" :key="genre.id" class="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-xs">
              {{ genre.name }}
            </span>
          </div>

          <div class="flex flex-wrap gap-3">
            <button class="rounded-xl bg-watchly-accent px-5 py-2 text-sm font-semibold" @click="addToWatchlist">
              Ajouter a la liste
            </button>
            <button class="rounded-xl bg-white/10 px-5 py-2 text-sm font-semibold hover:bg-white/20" @click="markWatched">
              Marquer comme vu
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,2fr),minmax(280px,1fr)]">
      <div class="space-y-8">
        <section class="rounded-2xl border border-white/10 bg-watchly-secondary p-5">
          <h2 class="mb-3 font-display text-2xl font-bold">Cast principal</h2>
          <p class="text-watchly-text-secondary">{{ castLine }}</p>
        </section>

        <section class="rounded-2xl border border-white/10 bg-watchly-secondary p-5">
          <h2 class="mb-3 font-display text-2xl font-bold">Laisser un avis</h2>
          <form class="space-y-3" @submit.prevent="submitReview">
            <div class="grid gap-3 sm:grid-cols-[180px,1fr]">
              <label class="space-y-1">
                <span class="text-sm text-watchly-text-secondary">Ta note</span>
                <select v-model.number="reviewForm.rating" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <option :value="5">5/5 - Chef d'oeuvre</option>
                  <option :value="4">4/5 - Excellent</option>
                  <option :value="3">3/5 - Correct</option>
                  <option :value="2">2/5 - Moyen</option>
                  <option :value="1">1/5 - A eviter</option>
                </select>
              </label>
              <label class="space-y-1">
                <span class="text-sm text-watchly-text-secondary">Ton avis</span>
                <textarea
                  v-model.trim="reviewForm.reviewText"
                  rows="4"
                  required
                  class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  placeholder="Partage ton ressenti sur ce film..."
                />
              </label>
            </div>

            <div class="grid gap-3 sm:grid-cols-4">
              <label class="space-y-1 text-sm">
                <span class="text-watchly-text-secondary">Scenario</span>
                <input v-model.number="reviewForm.detailedRatings.scenario" type="number" min="1" max="5" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" />
              </label>
              <label class="space-y-1 text-sm">
                <span class="text-watchly-text-secondary">Acting</span>
                <input v-model.number="reviewForm.detailedRatings.acting" type="number" min="1" max="5" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" />
              </label>
              <label class="space-y-1 text-sm">
                <span class="text-watchly-text-secondary">Visuel</span>
                <input v-model.number="reviewForm.detailedRatings.visuals" type="number" min="1" max="5" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" />
              </label>
              <label class="space-y-1 text-sm">
                <span class="text-watchly-text-secondary">Rythme</span>
                <input v-model.number="reviewForm.detailedRatings.rhythm" type="number" min="1" max="5" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" />
              </label>
            </div>

            <label class="inline-flex items-center gap-2 text-sm text-watchly-text-secondary">
              <input v-model="reviewForm.spoiler" type="checkbox" class="h-4 w-4" />
              Contient un spoiler
            </label>

            <p v-if="reviewError" class="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {{ reviewError }}
            </p>

            <button
              type="submit"
              class="rounded-xl bg-watchly-accent px-5 py-2 text-sm font-semibold text-white hover:brightness-110 disabled:opacity-60"
              :disabled="reviewSubmitting"
            >
              {{ reviewSubmitting ? "Publication..." : "Publier l'avis" }}
            </button>
          </form>
        </section>

        <section>
          <h2 class="mb-4 font-display text-2xl font-bold">Avis</h2>
          <div v-if="reviews.length === 0" class="rounded-xl border border-white/10 bg-watchly-secondary p-4 text-sm text-watchly-text-secondary">
            Aucun avis pour le moment. Sois le premier a publier.
          </div>
          <div v-else class="space-y-3">
            <div v-for="review in reviews" :key="review._id" class="space-y-2">
              <ReviewCard
                :review="review"
                @like="likeReview"
                @reply="startReply"
              />

              <div v-if="activeReplyReviewId === review._id" class="rounded-xl border border-white/10 bg-watchly-secondary p-3">
                <p class="mb-2 text-xs uppercase tracking-[0.12em] text-watchly-text-secondary">
                  Repondre a {{ review.userId?.username || "cet avis" }}
                </p>
                <textarea
                  v-model.trim="replyText"
                  rows="3"
                  class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                  placeholder="Ecris ta reponse..."
                />
                <p v-if="replyError" class="mt-2 text-xs text-red-300">{{ replyError }}</p>
                <div class="mt-3 flex gap-2">
                  <button
                    class="rounded-lg bg-watchly-accent px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    :disabled="replySubmitting"
                    @click="submitReply(review)"
                  >
                    {{ replySubmitting ? "Publication..." : "Publier la reponse" }}
                  </button>
                  <button class="rounded-lg bg-white/10 px-3 py-2 text-sm" @click="cancelReply">
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside>
        <h2 class="mb-4 font-display text-2xl font-bold">Films similaires</h2>
        <div class="space-y-4">
          <RouterLink
            v-for="item in similarMovies"
            :key="item.id"
            :to="`/movie/${item.id}`"
            class="block rounded-xl border border-white/10 bg-watchly-secondary p-3 transition hover:border-watchly-accent"
          >
            <p class="font-semibold">{{ item.title }}</p>
            <p class="text-xs text-watchly-text-secondary">{{ (item.release_date || "").slice(0, 4) }}</p>
          </RouterLink>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, RouterLink } from "vue-router";
import ReviewCard from "../components/ReviewCard.vue";
import { useMovieStore } from "../stores/movieStore";
import { useUserStore } from "../stores/userStore";
import api from "../services/api";

const route = useRoute();
const movieStore = useMovieStore();
const userStore = useUserStore();
const reviews = ref([]);
const reviewSubmitting = ref(false);
const reviewError = ref("");
const activeReplyReviewId = ref(null);
const replyText = ref("");
const replyError = ref("");
const replySubmitting = ref(false);
const reviewForm = ref({
  rating: 4,
  reviewText: "",
  spoiler: false,
  detailedRatings: {
    scenario: 3,
    acting: 3,
    visuals: 3,
    rhythm: 3
  }
});

const loadMoviePage = async () => {
  await movieStore.loadMovie(route.params.id);
  const { data } = await api.get(`/reviews/movie/${route.params.id}`);
  reviews.value = data;
};

onMounted(async () => {
  await loadMoviePage();
});

watch(
  () => route.params.id,
  async () => {
    await loadMoviePage();
  }
);

const movie = computed(() => movieStore.selectedMovie);
const releaseYear = computed(() => (movie.value?.release_date || "").slice(0, 4));
const genreLine = computed(() => (movie.value?.genres || []).map((g) => g.name).join(", "));
const castLine = computed(() => (movie.value?.credits?.cast || []).slice(0, 7).map((c) => c.name).join(", "));
const similarMovies = computed(() => (movie.value?.similar?.results || []).slice(0, 6));

const base = import.meta.env.VITE_TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p";

const posterUrl = computed(() => {
  if (movie.value?.poster_path) {
    return `${base}/w780${movie.value.poster_path}`;
  }
  return "https://placehold.co/700x1050/1a1a1a/ffffff?text=Aucune+Affiche";
});

const heroStyle = computed(() => ({
  backgroundImage: movie.value?.backdrop_path
    ? `url(${base}/w1280${movie.value.backdrop_path})`
    : "none",
  backgroundSize: "cover",
  backgroundPosition: "center"
}));

const addToWatchlist = async () => {
  if (!movie.value?.id) {
    return;
  }
  await userStore.addToWatchlist(movie.value.id);
};

const markWatched = async () => {
  if (!movie.value?.id) {
    return;
  }
  await userStore.markWatched(movie.value.id);
};

const likeReview = async (review) => {
  await api.post(`/reviews/${review._id}/like`);
  const { data } = await api.get(`/reviews/movie/${route.params.id}`);
  reviews.value = data;
};

const submitReview = async () => {
  if (!reviewForm.value.reviewText.trim()) {
    reviewError.value = "Ton avis ne peut pas etre vide.";
    return;
  }

  reviewError.value = "";
  reviewSubmitting.value = true;
  try {
    await api.post("/reviews", {
      movieId: Number(route.params.id),
      rating: Number(reviewForm.value.rating),
      reviewText: reviewForm.value.reviewText.trim(),
      spoiler: Boolean(reviewForm.value.spoiler),
      detailedRatings: reviewForm.value.detailedRatings
    });

    reviewForm.value.reviewText = "";
    reviewForm.value.spoiler = false;
    await loadMoviePage();
    await userStore.fetchMyReviews();
  } catch (error) {
    reviewError.value = error?.response?.data?.message || "Impossible de publier ton avis.";
  } finally {
    reviewSubmitting.value = false;
  }
};

const startReply = (review) => {
  activeReplyReviewId.value = review._id;
  replyText.value = "";
  replyError.value = "";
};

const cancelReply = () => {
  activeReplyReviewId.value = null;
  replyText.value = "";
  replyError.value = "";
};

const submitReply = async (review) => {
  if (!replyText.value.trim()) {
    replyError.value = "Ta reponse ne peut pas etre vide.";
    return;
  }

  replySubmitting.value = true;
  replyError.value = "";
  try {
    await api.post("/reviews", {
      movieId: Number(route.params.id),
      parentId: review._id,
      rating: 5,
      reviewText: replyText.value.trim(),
      spoiler: false,
      detailedRatings: {
        scenario: 3,
        acting: 3,
        visuals: 3,
        rhythm: 3
      }
    });

    cancelReply();
    await loadMoviePage();
  } catch {
    replyError.value = "Impossible de publier la reponse.";
  } finally {
    replySubmitting.value = false;
  }
};
</script>
