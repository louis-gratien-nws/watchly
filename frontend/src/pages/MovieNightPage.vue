<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <h1 class="font-display text-3xl font-extrabold">Soiree film</h1>

    <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-4 space-y-3">
      <div class="flex flex-wrap gap-2">
        <button class="rounded-xl bg-watchly-accent px-4 py-2 text-sm font-semibold" @click="createSession">Creer une session</button>
        <input v-model="joinCode" placeholder="Code session" class="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm" />
        <button class="rounded-xl bg-white/10 px-4 py-2 text-sm" @click="joinSession">Rejoindre</button>
      </div>
      <p v-if="session" class="text-sm text-watchly-text-secondary">Session active: <b>{{ session.code }}</b></p>
    </div>

    <div v-if="session && candidates.length" class="rounded-2xl border border-white/10 bg-watchly-secondary p-4 space-y-4">
      <h2 class="font-display text-xl font-bold">Swipe oui/non</h2>
      <article class="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
        <h3 class="font-semibold">{{ currentMovie.title }}</h3>
        <p class="text-sm text-watchly-text-secondary">{{ currentMovie.overview }}</p>
        <div class="flex gap-2">
          <button class="rounded-xl bg-red-500/20 px-4 py-2" @click="swipe('no')">Non</button>
          <button class="rounded-xl bg-emerald-500/20 px-4 py-2" @click="swipe('yes')">Oui</button>
        </div>
      </article>
      <button class="rounded-xl bg-white/10 px-4 py-2 text-sm" @click="loadMatch">Voir le match final</button>
      <div v-if="matches.length" class="space-y-2">
        <p class="text-sm font-semibold">Films choisis en commun:</p>
        <p class="text-sm text-watchly-text-secondary">{{ matches.join(', ') }}</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import api from "../services/api";
import { useMovieStore } from "../stores/movieStore";

const movieStore = useMovieStore();
const session = ref(null);
const joinCode = ref("");
const index = ref(0);
const matches = ref([]);

onMounted(async () => {
  if (movieStore.trending.length === 0) {
    await movieStore.bootstrapHome();
  }
});

const candidates = computed(() => movieStore.trending.slice(0, 20));
const currentMovie = computed(() => candidates.value[index.value] || candidates.value[0] || {});

const createSession = async () => {
  const { data } = await api.post("/movie-night", {
    candidateMovieIds: candidates.value.map((m) => m.id)
  });
  session.value = data;
  matches.value = [];
  index.value = 0;
};

const joinSession = async () => {
  if (!joinCode.value) return;
  const { data } = await api.post("/movie-night/join", { code: joinCode.value.trim().toUpperCase() });
  session.value = data;
  matches.value = [];
  index.value = 0;
};

const swipe = async (choice) => {
  if (!session.value || !currentMovie.value?.id) return;
  await api.post(`/movie-night/${session.value._id}/swipe`, {
    movieId: currentMovie.value.id,
    choice
  });
  index.value = (index.value + 1) % Math.max(candidates.value.length, 1);
};

const loadMatch = async () => {
  if (!session.value) return;
  const { data } = await api.get(`/movie-night/${session.value._id}/match`);
  matches.value = data.matches || [];
};
</script>
