<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <h1 class="font-display text-3xl font-extrabold">Mes Statistiques</h1>

    <!-- Cards principales -->
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-watchly-text-secondary text-sm">Films Vus</p>
            <p class="font-display text-4xl font-bold">{{ stats?.moviesWatched || 0 }}</p>
          </div>
          <div class="text-4xl">🎬</div>
        </div>
      </div>

      <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-watchly-text-secondary text-sm">Temps Total</p>
            <p class="font-display text-2xl font-bold">{{ formatTime(stats?.totalWatchTime || 0) }}</p>
          </div>
          <div class="text-4xl">⏱️</div>
        </div>
      </div>

      <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-watchly-text-secondary text-sm">Critiques</p>
            <p class="font-display text-4xl font-bold">{{ stats?.reviewsCount || 0 }}</p>
          </div>
          <div class="text-4xl">✍️</div>
        </div>
      </div>

      <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-watchly-text-secondary text-sm">J'aimes</p>
            <p class="font-display text-4xl font-bold">{{ stats?.likesCount || 0 }}</p>
          </div>
          <div class="text-4xl">❤️</div>
        </div>
      </div>
    </div>

    <!-- Followers -->
    <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
      <h2 class="font-display text-xl font-bold mb-4">Communauté</h2>
      <div class="grid gap-4 md:grid-cols-3">
        <div>
          <p class="text-watchly-text-secondary text-sm">Abonnés</p>
          <p class="font-display text-3xl font-bold">{{ stats?.followersCount || 0 }}</p>
        </div>
        <div>
          <p class="text-watchly-text-secondary text-sm">En Suivi</p>
          <p class="font-display text-3xl font-bold">{{ stats?.followingCount || 0 }}</p>
        </div>
        <div>
          <p class="text-watchly-text-secondary text-sm">Niveau</p>
          <p class="font-display text-3xl font-bold">{{ level }}</p>
        </div>
      </div>
    </div>

    <!-- Genres favoris -->
    <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
      <h2 class="font-display text-xl font-bold mb-4">Genres Préférés</h2>
      <div v-if="stats?.genreStats?.length" class="space-y-3">
        <div v-for="genre in stats.genreStats.slice(0, 5)" :key="genre.genreId" class="flex items-center justify-between">
          <div class="flex-1">
            <p class="text-sm font-medium">{{ genre.genreName }}</p>
            <div class="mt-1 h-2 w-full rounded-full bg-black/30">
              <div
                class="h-full rounded-full bg-watchly-accent"
                :style="{ width: getGenrePercentage(genre.count) + '%' }"
              />
            </div>
          </div>
          <p class="ml-3 text-sm font-semibold">{{ genre.count }} (⭐ {{ genre.avgRating.toFixed(1) }})</p>
        </div>
      </div>
      <p v-else class="text-watchly-text-secondary text-sm">Pas encore de films visionnés</p>
    </div>

    <!-- Récompenses/Achievements -->
    <div class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
      <h2 class="font-display text-xl font-bold mb-4">Récompenses 🏆</h2>
      <div v-if="achievements?.length" class="grid gap-3 md:grid-cols-3 lg:grid-cols-4">
        <div v-for="achievement in achievements" :key="achievement" class="rounded-xl border border-watchly-accent/30 bg-watchly-accent/10 p-3 text-center">
          <p class="text-sm font-semibold">{{ achievement }}</p>
        </div>
      </div>
      <p v-else class="text-watchly-text-secondary text-sm">Débloquez des récompenses en explorant le site !</p>
    </div>

    <!-- Fournisseurs -->
    <div v-if="stats?.providerStats?.length" class="rounded-2xl border border-white/10 bg-watchly-secondary p-6">
      <h2 class="font-display text-xl font-bold mb-4">Plateformes de Streaming</h2>
      <div class="flex flex-wrap gap-2">
        <div v-for="provider in stats.providerStats.slice(0, 8)" :key="provider.providerId" class="rounded-lg border border-white/10 bg-black/20 px-3 py-2">
          <p class="text-xs font-medium">{{ provider.providerName }}</p>
          <p class="text-sm font-bold">{{ provider.count }}</p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";

const auth = useAuthStore();
const stats = ref(null);
const achievements = ref([]);
const level = ref(1);

const formatTime = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
};

const getGenrePercentage = (count) => {
  if (!stats.value?.genreStats?.length) return 0;
  const maxCount = Math.max(...stats.value.genreStats.map(g => g.count));
  return (count / maxCount) * 100;
};

onMounted(async () => {
  try {
    if (auth.user?._id) {
      const { data } = await api.get(`/social/stats/${auth.user._id}`);
      stats.value = data.stats;
      achievements.value = data.achievements;
      level.value = data.level;
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }
});
</script>
