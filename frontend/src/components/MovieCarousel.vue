<template>
  <section class="space-y-3">
    <div class="flex items-center justify-between">
      <h2 class="font-display text-xl font-bold md:text-2xl">{{ title }}</h2>
      <div class="flex gap-2">
        <button class="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20" @click="scrollBy(-520)">
          Prec
        </button>
        <button class="rounded-lg bg-white/10 px-3 py-1 text-sm hover:bg-white/20" @click="scrollBy(520)">
          Suiv
        </button>
      </div>
    </div>

    <div ref="trackRef" class="flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none]">
      <MovieCard
        v-for="movie in movies"
        :key="movie.id"
        :movie="movie"
        @watch="$emit('watch', $event)"
        @add="$emit('add', $event)"
        @details="$emit('details', $event)"
      />
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";
import MovieCard from "./MovieCard.vue";

defineProps({
  title: { type: String, required: true },
  movies: { type: Array, default: () => [] }
});

defineEmits(["watch", "add", "details"]);

const trackRef = ref(null);

const scrollBy = (pixels) => {
  if (trackRef.value) {
    trackRef.value.scrollBy({ left: pixels, behavior: "smooth" });
  }
};
</script>
