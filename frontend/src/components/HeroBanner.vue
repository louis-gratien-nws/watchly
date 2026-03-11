<template>
  <section
    class="relative overflow-hidden rounded-3xl border border-white/10 bg-watchly-secondary"
    :style="heroBackground"
  >
    <div class="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/20" />
    <div class="relative grid min-h-[500px] items-end p-6 md:min-h-[620px] md:p-12 xl:min-h-[680px] xl:p-14">
      <div class="max-w-3xl space-y-5">
        <p class="text-xs uppercase tracking-[0.25em] text-watchly-accent">Choix tendance</p>
        <h1 class="font-display text-4xl font-extrabold leading-tight md:text-6xl xl:text-7xl">
          {{ movie?.title || "Chargement..." }}
        </h1>
        <p class="line-clamp-2 max-w-2xl text-base text-watchly-text-secondary md:text-lg">
          {{ movie?.overview || "Une experience cinema immersive" }}
        </p>
        <div class="flex flex-wrap gap-3">
          <RouterLink
            v-if="movie"
            :to="`/movie/${movie.id}`"
            class="rounded-xl bg-watchly-accent px-5 py-2 font-semibold text-white transition hover:brightness-110"
          >
            Voir la fiche
          </RouterLink>
          <button class="rounded-xl bg-white/10 px-5 py-2 font-semibold text-white hover:bg-white/20" @click="$emit('add', movie)">
            Ajouter a la liste
          </button>
          <button class="rounded-xl bg-white/10 px-5 py-2 font-semibold text-white hover:bg-white/20" @click="$emit('watch', movie)">
            Marquer comme vu
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, watch } from "vue";
import { RouterLink } from "vue-router";
import gsap from "gsap";

const props = defineProps({
  movie: { type: Object, default: null }
});

defineEmits(["watch", "add"]);

const base = import.meta.env.VITE_TMDB_IMAGE_BASE || "https://image.tmdb.org/t/p";

const heroBackground = computed(() => {
  const fallback = "https://placehold.co/1920x1080/0f0f0f/ffffff?text=Watchly";
  const backdrop = props.movie?.backdrop_path
    ? `${base}/w1280${props.movie.backdrop_path}`
    : fallback;

  return {
    backgroundImage: `url(${backdrop})`,
    backgroundSize: "cover",
    backgroundPosition: "center"
  };
});

const animate = () => {
  gsap.fromTo(
    ".hero-reveal",
    { opacity: 0, y: 20 },
    { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" }
  );
};

onMounted(animate);
watch(
  () => props.movie?.id,
  () => animate()
);
</script>
