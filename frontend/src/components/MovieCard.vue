<template>
  <article
    :class="cardClass"
    role="button"
    tabindex="0"
    @click="$emit('details', movie)"
    @keydown.enter="$emit('details', movie)"
    @keydown.space.prevent="$emit('details', movie)"
  >
    <img
      :src="posterUrl"
      :alt="movie.title"
      loading="lazy"
      :class="imageClass"
    />

    <div
      class="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
    >
      <div class="absolute bottom-0 w-full p-3">
        <h3 class="font-display text-sm font-bold text-white">{{ movie.title }}</h3>
        <p class="text-xs text-watchly-text-secondary">
          {{ year }} | {{ rating }}
        </p>
        <div class="mt-2 flex gap-2 text-[11px]">
          <button class="rounded-md bg-white/10 px-2 py-1 hover:bg-watchly-accent/60" @click.stop="$emit('watch', movie)">
            marquer vu
          </button>
          <button class="rounded-md bg-white/10 px-2 py-1 hover:bg-watchly-accent/60" @click.stop="$emit('add', movie)">
            ajouter
          </button>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  movie: { type: Object, required: true },
  size: { type: String, default: "carousel" }
});

const cardClass = computed(() => {
  if (props.size === "grid") {
    return "group relative w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-watchly-secondary transition duration-300 hover:z-20 hover:scale-[1.03] hover:shadow-glow";
  }
  return "group relative min-w-[220px] cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-watchly-secondary transition duration-300 hover:z-20 hover:scale-[1.06] hover:shadow-glow md:min-w-[280px]";
});

const imageClass = computed(() => {
  if (props.size === "grid") {
    return "h-[260px] w-full object-cover md:h-[320px]";
  }
  return "h-[320px] w-full object-cover md:h-[400px]";
});

const base = import.meta.env.VITE_TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p";

const posterUrl = computed(() =>
  props.movie.poster_path
    ? `${base}/w500${props.movie.poster_path}`
    : "https://placehold.co/500x750/1a1a1a/ffffff?text=Aucune+Affiche"
);

const year = computed(() => (props.movie.release_date || "").slice(0, 4) || "n/d");
const rating = computed(() => `${(props.movie.vote_average || 0).toFixed(1)} / 10`);
</script>
