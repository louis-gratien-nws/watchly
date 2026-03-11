<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <h1 class="font-display text-3xl font-extrabold">Listes collaboratives</h1>

    <form class="rounded-2xl border border-white/10 bg-watchly-secondary p-4 grid gap-3 md:grid-cols-4" @submit.prevent="createList">
      <input v-model="newList.name" placeholder="Nom de la liste" class="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm" required />
      <input v-model="newList.description" placeholder="Description" class="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm" />
      <label class="inline-flex items-center gap-2 text-sm text-watchly-text-secondary"><input type="checkbox" v-model="newList.isCollaborative" /> Collaborative</label>
      <button class="rounded-xl bg-watchly-accent px-4 py-2 text-sm font-semibold">Creer</button>
    </form>

    <div class="space-y-4">
      <article v-for="list in lists" :key="list._id" class="rounded-2xl border border-white/10 bg-watchly-secondary p-4 space-y-3">
        <p class="font-semibold">{{ list.name }}</p>
        <p class="text-sm text-watchly-text-secondary">{{ list.description }}</p>

        <div class="flex flex-wrap gap-2">
          <input v-model.number="movieInputs[list._id]" type="number" placeholder="ID film" class="rounded-lg border border-white/10 bg-black/20 px-2 py-1 text-xs" />
          <button class="rounded-lg bg-white/10 px-3 py-1 text-xs" @click="addMovie(list)">Ajouter film</button>
        </div>

        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="movieId in list.movies" :key="`${list._id}-${movieId}`" class="rounded-lg border border-white/10 bg-black/20 p-2 text-xs">
            <p>Film #{{ movieId }}</p>
            <div class="mt-1 flex gap-1">
              <button class="rounded bg-emerald-500/20 px-2 py-1" @click="vote(list, movieId, 1)">+1</button>
              <button class="rounded bg-red-500/20 px-2 py-1" @click="vote(list, movieId, -1)">-1</button>
              <span class="ml-auto text-watchly-text-secondary">{{ scoreFor(list, movieId) }}</span>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from "vue";
import api from "../services/api";

const lists = ref([]);
const movieInputs = reactive({});
const newList = reactive({
  name: "",
  description: "",
  isCollaborative: true
});

const loadLists = async () => {
  const { data } = await api.get("/lists");
  lists.value = data || [];
};

onMounted(loadLists);

const createList = async () => {
  await api.post("/lists", newList);
  newList.name = "";
  newList.description = "";
  newList.isCollaborative = true;
  await loadLists();
};

const addMovie = async (list) => {
  const movieId = Number(movieInputs[list._id]);
  if (!movieId) return;
  await api.post(`/lists/${list._id}/movies`, { movieId });
  movieInputs[list._id] = "";
  await loadLists();
};

const vote = async (list, movieId, value) => {
  await api.post(`/lists/${list._id}/vote`, { movieId, value });
  await loadLists();
};

const scoreFor = (list, movieId) => {
  return (list.votes || []).filter((v) => v.movieId === movieId).reduce((acc, v) => acc + v.value, 0);
};
</script>
