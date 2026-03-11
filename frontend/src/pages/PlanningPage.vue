<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <h1 class="font-display text-3xl font-extrabold">Planning visionnage</h1>

    <section class="space-y-4 rounded-2xl border border-white/10 bg-watchly-secondary p-4">
      <label class="block space-y-2">
        <span class="text-sm text-watchly-text-secondary">Rechercher un film par nom</span>
        <input
          v-model.trim="searchQuery"
          type="text"
          placeholder="Ex: Inception, Dune, Interstellar..."
          class="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm"
        />
      </label>

      <p v-if="searching" class="text-sm text-watchly-text-secondary">Recherche en cours...</p>

      <div v-if="searchResults.length" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <button
          v-for="movie in searchResults"
          :key="movie.id"
          type="button"
          draggable="true"
          class="group overflow-hidden rounded-xl border border-white/10 bg-black/20 text-left transition hover:border-watchly-accent"
          @click="selectMovie(movie)"
          @dragstart="onSearchResultDragStart($event, movie)"
        >
          <img :src="posterFor(movie)" :alt="movie.title" class="h-56 w-full object-cover" />
          <div class="p-2">
            <p class="line-clamp-1 text-sm font-semibold">{{ movie.title }}</p>
            <p class="text-xs text-watchly-text-secondary">{{ (movie.release_date || "").slice(0, 4) || "n/d" }}</p>
          </div>
        </button>
      </div>
    </section>

    <section class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
      <h2 class="mb-3 font-display text-xl font-bold">Film selectionne</h2>
      <div v-if="selectedMovie" class="flex flex-wrap items-center gap-4">
        <img
          :src="posterFor(selectedMovie)"
          :alt="selectedMovie.title"
          draggable="true"
          class="h-32 w-24 cursor-grab rounded-lg border border-white/10 object-cover active:cursor-grabbing"
          @dragstart="onPosterDragStart"
        />
        <div>
          <p class="font-semibold">{{ selectedMovie.title }}</p>
          <p class="text-sm text-watchly-text-secondary">Glisse la pochette sur un jour du calendrier.</p>
        </div>
      </div>
      <p v-else class="text-sm text-watchly-text-secondary">
        Choisis un film dans les resultats pour l'ajouter au planning.
      </p>
    </section>

    <section class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex rounded-lg border border-white/10 bg-black/20 p-1 text-sm">
          <button
            type="button"
            class="rounded-md px-3 py-1"
            :class="calendarMode === 'month' ? 'bg-watchly-accent font-semibold' : 'text-watchly-text-secondary'"
            @click="calendarMode = 'month'"
          >
            Mois
          </button>
          <button
            type="button"
            class="rounded-md px-3 py-1"
            :class="calendarMode === 'week' ? 'bg-watchly-accent font-semibold' : 'text-watchly-text-secondary'"
            @click="calendarMode = 'week'"
          >
            Semaine
          </button>
        </div>

        <div class="flex items-center gap-2">
          <button type="button" class="rounded-lg bg-white/10 px-3 py-1 text-sm" @click="changePeriod(-1)">Precedent</button>
          <h2 class="min-w-[190px] text-center font-display text-xl font-bold">{{ periodLabel }}</h2>
          <button type="button" class="rounded-lg bg-white/10 px-3 py-1 text-sm" @click="changePeriod(1)">Suivant</button>
        </div>

        <label class="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-1 text-sm text-watchly-text-secondary">
          <input v-model="hideWatched" type="checkbox" class="h-4 w-4" />
          Masquer les films deja vus
        </label>
      </div>

      <p v-if="planningMessage" class="mb-3 rounded-lg border border-amber-300/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
        {{ planningMessage }}
      </p>

      <div class="grid grid-cols-7 gap-2 text-center text-xs text-watchly-text-secondary">
        <span v-for="d in dayHeaders" :key="d">{{ d }}</span>
      </div>

      <div class="mt-2 grid grid-cols-7 gap-2">
        <article
          v-for="cell in calendarCells"
          :key="cell.key"
          class="min-h-[120px] rounded-lg border border-white/10 bg-black/20 p-2"
          :class="calendarMode === 'month' && !cell.inMonth ? 'opacity-40' : 'opacity-100'"
          @click="onCellClick(cell)"
          @dragover.prevent
          @drop="onDropMovie(cell, $event)"
        >
          <div class="mb-2 flex items-center justify-between">
            <p class="text-xs font-semibold">{{ cell.day }}</p>
            <span
              v-if="dayCount(cell.dateKey)"
              class="rounded-full border px-2 py-0.5 text-[10px] font-semibold"
              :class="counterBadgeClass(dayCount(cell.dateKey))"
            >
              {{ dayCount(cell.dateKey) }}
            </span>
          </div>

          <div class="space-y-2">
            <div
              v-for="plan in plansByDay[cell.dateKey] || []"
              :key="plan._id"
              class="relative w-full cursor-pointer overflow-hidden rounded border border-white/10 bg-black/30 text-left"
              @click.stop="openMovie(plan.movieId)"
              :title="plan.movieTitle || `Film #${plan.movieId}`"
            >
              <button
                type="button"
                class="absolute right-1 top-1 z-10 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-white hover:bg-red-500/80"
                title="Supprimer du planning"
                @click.stop="removePlan(plan)"
              >
                X
              </button>
              <img :src="plan.posterPath || fallbackPoster" :alt="plan.movieTitle" class="h-12 w-full object-cover" />
              <p class="line-clamp-1 px-1 py-1 text-[11px]">{{ plan.movieTitle || `Film #${plan.movieId}` }}</p>
            </div>
          </div>
        </article>
      </div>
    </section>

    <div class="grid gap-3">
      <article v-for="plan in plans" :key="plan._id" class="rounded-xl border border-white/10 bg-watchly-secondary p-4">
        <p class="font-semibold">{{ plan.movieTitle || `Film #${plan.movieId}` }}</p>
        <p class="text-sm text-watchly-text-secondary">{{ new Date(plan.plannedFor).toLocaleString() }}</p>
        <div class="mt-2 flex flex-wrap gap-2">
          <button class="rounded-lg bg-watchly-accent/25 px-3 py-1 text-xs" @click="openMovie(plan.movieId)">Ouvrir</button>
          <button class="rounded-lg bg-emerald-500/20 px-3 py-1 text-xs" @click="setStatus(plan, 'done')">Vu</button>
          <button class="rounded-lg bg-amber-500/20 px-3 py-1 text-xs" @click="setStatus(plan, 'skipped')">Passe</button>
          <button class="rounded-lg bg-white/10 px-3 py-1 text-xs" @click="removePlan(plan)">Supprimer</button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";
import { searchMovies } from "../services/movieService";

const router = useRouter();
const authStore = useAuthStore();
const plans = ref([]);
const searchQuery = ref("");
const searchResults = ref([]);
const searching = ref(false);
const selectedMovie = ref(null);
const calendarMode = ref("month");
const visibleDate = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
const planningMessage = ref("");
const hideWatched = ref(false);

const fallbackPoster = "https://placehold.co/300x450/111111/ffffff?text=Film";
const dayHeaders = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
let debounceTimer = null;
const dragScrollConfig = {
  edgePx: 90,
  speedPx: 16
};

const loadPlans = async () => {
  const { data } = await api.get("/plans");
  plans.value = data || [];
};

onMounted(async () => {
  await Promise.all([loadPlans(), authStore.fetchMe()]);
  window.addEventListener("dragover", handleWindowDragOver);
});

onBeforeUnmount(() => {
  window.removeEventListener("dragover", handleWindowDragOver);
});

const createPlan = async ({ movieId, movieTitle, posterPath, plannedFor }) => {
  const plannedDateKey = formatDateKey(new Date(plannedFor));
  const duplicate = (plansByDay.value[plannedDateKey] || []).some(
    (plan) => Number(plan.movieId) === Number(movieId)
  );
  if (duplicate) {
    planningMessage.value = "Ce film est deja planifie ce jour-la.";
    return;
  }

  planningMessage.value = "";
  try {
    await api.post("/plans", {
      movieId: Number(movieId),
      movieTitle,
      posterPath,
      plannedFor,
      remindByEmail: true,
      remindByPush: false
    });
    await loadPlans();
  } catch (error) {
    planningMessage.value = error?.response?.data?.message || "Impossible d'ajouter ce film au planning.";
  }
};

watch(
  () => searchQuery.value,
  (value) => {
    clearTimeout(debounceTimer);

    if (!value || value.length < 2) {
      searchResults.value = [];
      return;
    }

    debounceTimer = setTimeout(async () => {
      searching.value = true;
      try {
        const { data } = await searchMovies(value, 1);
        searchResults.value = (data.results || []).slice(0, 18);
      } finally {
        searching.value = false;
      }
    }, 250);
  }
);

const selectMovie = (movie) => {
  selectedMovie.value = movie;
};

const posterFor = (movie) => {
  if (movie?.poster_path) {
    return `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  }
  return fallbackPoster;
};

const onPosterDragStart = (event) => {
  if (!selectedMovie.value) return;
  event.dataTransfer.setData("application/json", JSON.stringify(selectedMovie.value));
  event.dataTransfer.effectAllowed = "copy";
};

const onSearchResultDragStart = (event, movie) => {
  event.dataTransfer.setData("application/json", JSON.stringify(movie));
  event.dataTransfer.effectAllowed = "copy";
};

const handleWindowDragOver = (event) => {
  const viewportHeight = window.innerHeight;
  if (event.clientY < dragScrollConfig.edgePx) {
    window.scrollBy({ top: -dragScrollConfig.speedPx, behavior: "auto" });
  } else if (event.clientY > viewportHeight - dragScrollConfig.edgePx) {
    window.scrollBy({ top: dragScrollConfig.speedPx, behavior: "auto" });
  }
};

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const watchedMovieIds = computed(() =>
  new Set((authStore.user?.watched || []).map((id) => Number(id)))
);

const filteredPlans = computed(() => {
  if (!hideWatched.value) return plans.value;
  return plans.value.filter((plan) => !watchedMovieIds.value.has(Number(plan.movieId)));
});

const plansByDay = computed(() => {
  const grouped = {};
  filteredPlans.value.forEach((plan) => {
    const key = formatDateKey(new Date(plan.plannedFor));
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(plan);
  });
  return grouped;
});

const dayCount = (dateKey) => (plansByDay.value[dateKey] || []).length;

const counterBadgeClass = (count) => {
  if (count >= 5) {
    return "border-red-400/50 bg-red-500/15 text-red-200";
  }
  if (count >= 3) {
    return "border-amber-400/50 bg-amber-500/15 text-amber-200";
  }
  return "border-emerald-400/50 bg-emerald-500/15 text-emerald-200";
};

const startOfWeek = (date) => {
  const d = new Date(date);
  const weekday = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - weekday);
  d.setHours(0, 0, 0, 0);
  return d;
};

const calendarCells = computed(() => {
  if (calendarMode.value === "week") {
    const weekStart = startOfWeek(visibleDate.value);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return {
        key: `${formatDateKey(date)}-w-${i}`,
        day: date.getDate(),
        date,
        dateKey: formatDateKey(date),
        inMonth: true
      };
    });
  }

  const first = new Date(visibleDate.value.getFullYear(), visibleDate.value.getMonth(), 1);
  const firstWeekday = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return {
      key: `${formatDateKey(date)}-${i}`,
      day: date.getDate(),
      date,
      dateKey: formatDateKey(date),
      inMonth: date.getMonth() === visibleDate.value.getMonth()
    };
  });
});

const periodLabel = computed(() => {
  if (calendarMode.value === "week") {
    const start = startOfWeek(visibleDate.value);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startLabel = start.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    const endLabel = end.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
    return `${startLabel} - ${endLabel}`;
  }

  return visibleDate.value.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
});

const changePeriod = (delta) => {
  const next = new Date(visibleDate.value);
  if (calendarMode.value === "week") {
    next.setDate(next.getDate() + 7 * delta);
    visibleDate.value = next;
    return;
  }

  next.setMonth(next.getMonth() + delta);
  visibleDate.value = new Date(next.getFullYear(), next.getMonth(), 1);
};

const onDropMovie = async (cell, event = null) => {
  let movie = selectedMovie.value;
  if (event?.dataTransfer) {
    const payload = event.dataTransfer.getData("application/json");
    if (payload) {
      try {
        movie = JSON.parse(payload);
      } catch {
        movie = selectedMovie.value;
      }
    }
  }

  if (!movie) return;
  if (calendarMode.value === "month" && !cell.inMonth) return;

  const plannedAt = new Date(cell.date);
  plannedAt.setHours(20, 0, 0, 0);

  await createPlan({
    movieId: movie.id,
    movieTitle: movie.title,
    posterPath: movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "",
    plannedFor: plannedAt.toISOString()
  });
};

const onCellClick = async (cell) => {
  if (!selectedMovie.value) return;
  if (calendarMode.value === "month" && !cell.inMonth) return;
  await onDropMovie(cell);
};

const openMovie = (movieId) => {
  router.push(`/movie/${movieId}`);
};

const setStatus = async (plan, status) => {
  await api.put(`/plans/${plan._id}`, { status });
  await loadPlans();
};

const removePlan = async (plan) => {
  await api.delete(`/plans/${plan._id}`);
  await loadPlans();
};
</script>
