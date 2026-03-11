<template>
  <header class="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#070b14]/75 backdrop-blur-xl">
    <div class="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-watchly-accent/40 to-transparent" />

    <nav class="relative flex w-full items-center justify-between px-4 py-3 md:px-8 xl:px-10">
      <div class="flex items-center gap-4">
        <button
          class="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-lg md:hidden"
          aria-label="Ouvrir le menu de navigation"
          @click="mobileNavOpen = !mobileNavOpen"
        >
          ☰
        </button>

        <RouterLink to="/" class="flex items-center gap-2 font-display text-2xl font-extrabold tracking-wide text-white">
          <span class="h-2.5 w-2.5 rounded-full bg-watchly-accent shadow-[0_0_16px_2px_rgba(0,168,255,0.65)]" />
          Watchly
        </RouterLink>
      </div>

      <div class="hidden items-center gap-6 md:flex">
        <ul class="flex items-center gap-5 text-sm">
          <li v-for="item in primaryMenu" :key="item.to">
            <RouterLink :to="item.to" class="text-watchly-text-secondary transition hover:text-white">
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>

        <div class="relative">
          <button
            ref="exploreButtonRef"
            class="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-watchly-text-secondary transition hover:border-watchly-accent/60 hover:text-white"
            :aria-expanded="exploreOpen"
            aria-haspopup="menu"
            @click="toggleExplore"
          >
            Explorer
            <span class="text-xs" :class="exploreOpen ? 'rotate-180' : ''">⌄</span>
          </button>

          <Transition name="menu-pop">
            <div
              v-if="exploreOpen"
              ref="exploreRef"
              class="absolute left-0 top-11 z-50 w-56 rounded-2xl border border-white/10 bg-[#0f1522] p-2 shadow-2xl"
              role="menu"
            >
              <RouterLink
                v-for="item in exploreMenu"
                :key="item.to"
                :to="item.to"
                class="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-watchly-text-secondary transition hover:bg-white/5 hover:text-white"
                @click="closeExplore"
              >
                <span>{{ item.label }}</span>
                <span class="text-[10px] uppercase tracking-[0.1em] text-watchly-accent">{{ item.tag }}</span>
              </RouterLink>
            </div>
          </Transition>
        </div>
      </div>

      <div class="relative flex items-center gap-3">
        <NotificationBell v-if="isAuthenticated" />
        
        <button
          ref="menuButtonRef"
          class="relative flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-1 py-1 hover:bg-white/10"
          aria-label="Ouvrir le menu profil"
          aria-haspopup="menu"
          :aria-expanded="menuOpen"
          @click="toggleMenu"
        >
          <UserAvatar :src="auth.user?.avatar" alt="Profil" />
          <span
            v-if="pendingFriendRequestsCount > 0"
            class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white"
          >
            {{ pendingFriendRequestsCount > 9 ? '9+' : pendingFriendRequestsCount }}
          </span>
          <span class="hidden max-w-[120px] truncate pr-2 text-xs md:inline" :class="isAuthenticated ? 'text-white' : 'text-watchly-text-secondary'">
            {{ isAuthenticated ? auth.user?.username : "Invite" }}
          </span>
        </button>

        <Transition name="menu-pop">
          <div
            v-if="menuOpen"
            ref="menuRef"
            class="absolute right-0 top-14 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#101624] p-2 shadow-2xl"
            role="menu"
          >
            <div class="border-b border-white/10 px-3 py-3">
              <div class="flex items-center justify-between">
                <p class="truncate text-sm font-semibold">{{ auth.user?.username || "Invite" }}</p>
                <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.1em]" :class="isAuthenticated ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'">
                  <span class="h-1.5 w-1.5 rounded-full" :class="isAuthenticated ? 'bg-emerald-300' : 'bg-amber-300'" />
                  {{ isAuthenticated ? "Connecte" : "Invite" }}
                </span>
              </div>
              <p class="truncate text-xs text-watchly-text-secondary">{{ auth.user?.email || "Connecte-toi pour synchroniser ton profil" }}</p>
            </div>

            <div class="space-y-1 p-1">
              <RouterLink
                v-for="item in accountMenu"
                :key="item.to"
                :to="item.to"
                class="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-watchly-text-secondary transition hover:bg-white/5 hover:text-white"
                role="menuitem"
                @click="closeMenu"
              >
                <span>{{ item.label }}</span>
                <span v-if="item.to === '/friends' && pendingFriendRequestsCount > 0" class="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                  {{ pendingFriendRequestsCount > 9 ? '9+' : pendingFriendRequestsCount }}
                </span>
                <span v-else class="text-[10px] uppercase tracking-[0.1em] text-watchly-accent">{{ item.tag }}</span>
              </RouterLink>
            </div>

            <div v-if="!isAuthenticated" class="border-t border-white/10 p-2">
              <RouterLink
                to="/login"
                class="mb-2 block w-full rounded-xl bg-watchly-accent px-3 py-2 text-center text-sm font-semibold text-white hover:brightness-110"
                @click="closeMenu"
              >
                Se connecter
              </RouterLink>
              <RouterLink
                to="/register"
                class="block w-full rounded-xl bg-white/10 px-3 py-2 text-center text-sm text-white hover:bg-white/20"
                @click="closeMenu"
              >
                Creer un compte
              </RouterLink>
            </div>

            <button
              v-else
              class="mt-1 w-full rounded-xl bg-white/10 px-3 py-2 text-left text-sm text-white transition hover:bg-red-500/30"
              @click="logout"
            >
              Deconnexion
            </button>
          </div>
        </Transition>
      </div>
    </nav>
  </header>

  <Transition name="menu-pop">
    <div
      v-if="mobileNavOpen"
      class="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
      @click="mobileNavOpen = false"
    >
      <div class="absolute left-3 right-3 top-16 rounded-2xl border border-white/10 bg-[#101624] p-3" @click.stop>
        <p class="mb-2 px-2 text-[11px] uppercase tracking-[0.12em] text-watchly-text-secondary">Navigation</p>
        <RouterLink
          v-for="item in primaryMenu"
          :key="`mobile-primary-${item.to}`"
          :to="item.to"
          class="block rounded-xl px-3 py-3 text-sm text-watchly-text-secondary hover:bg-white/5 hover:text-white"
          @click="mobileNavOpen = false"
        >
          {{ item.label }}
        </RouterLink>

        <div class="mt-2 rounded-xl border border-white/10 bg-black/20">
          <button
            class="flex w-full items-center justify-between px-3 py-3 text-left text-sm text-watchly-text-secondary"
            @click="mobileExploreOpen = !mobileExploreOpen"
          >
            <span>Explorer</span>
            <span class="text-xs" :class="mobileExploreOpen ? 'rotate-180' : ''">⌄</span>
          </button>

          <Transition name="submenu-reveal">
            <div v-if="mobileExploreOpen" class="space-y-1 border-t border-white/10 px-2 py-2">
              <RouterLink
                v-for="item in exploreMenu"
                :key="`mobile-explore-${item.to}`"
                :to="item.to"
                class="block rounded-lg px-2 py-2 text-sm text-watchly-text-secondary hover:bg-white/5 hover:text-white"
                @click="mobileNavOpen = false"
              >
                {{ item.label }}
              </RouterLink>
            </div>
          </Transition>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import UserAvatar from "./UserAvatar.vue";
import NotificationBell from "./NotificationBell.vue";
import { useAuthStore } from "../stores/authStore";

const auth = useAuthStore();
const router = useRouter();

const primaryMenu = [
  { label: "Accueil", to: "/" },
  { label: "Films", to: "/movies" },
  { label: "Series", to: "/series" }
];

const exploreMenu = [
  { label: "Decouvrir", to: "/discover", tag: "Search" },
  { label: "Soiree film", to: "/movie-night", tag: "Social" },
  { label: "Planning", to: "/planning", tag: "Plan" },
  { label: "Listes collab", to: "/collab-lists", tag: "Team" },
  { label: "Activite", to: "/activity", tag: "Feed" },
  { label: "Statistiques", to: "/statistics", tag: "Stats" },
  { label: "Classement", to: "/leaderboard", tag: "Top" }
];

const accountMenu = [
  { label: "Mon profil", to: "/profile", tag: "Moi" },
  { label: "Mes amis", to: "/friends", tag: "Social" },
  { label: "Ma liste", to: "/my-list", tag: "Liste" },
  { label: "Parametres", to: "/settings", tag: "Compte" }
];

const menuOpen = ref(false);
const mobileNavOpen = ref(false);
const mobileExploreOpen = ref(false);
const exploreOpen = ref(false);
const menuRef = ref(null);
const menuButtonRef = ref(null);
const exploreRef = ref(null);
const exploreButtonRef = ref(null);
const isAuthenticated = computed(() => auth.isAuthenticated && Boolean(auth.user));
const pendingFriendRequestsCount = computed(() => auth.user?.friendRequestsReceived?.length || 0);

const closeMenu = () => {
  menuOpen.value = false;
};

const closeExplore = () => {
  exploreOpen.value = false;
};

const toggleMenu = () => {
  closeExplore();
  menuOpen.value = !menuOpen.value;
};

const toggleExplore = () => {
  closeMenu();
  exploreOpen.value = !exploreOpen.value;
};

const onDocumentClick = (event) => {
  const insideMenu = menuRef.value?.contains(event.target);
  const insideButton = menuButtonRef.value?.contains(event.target);
  const insideExplore = exploreRef.value?.contains(event.target);
  const insideExploreButton = exploreButtonRef.value?.contains(event.target);

  if (!insideMenu && !insideButton) {
    closeMenu();
  }

  if (!insideExplore && !insideExploreButton) {
    closeExplore();
  }
};

const onEscape = (event) => {
  if (event.key === "Escape") {
    closeMenu();
    closeExplore();
  }
};

const logout = () => {
  auth.logout();
  closeMenu();
  closeExplore();
  router.push("/login");
};

onMounted(() => {
  auth.fetchMe();
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onEscape);
});

onUnmounted(() => {
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onEscape);
});
</script>

<style scoped>
.menu-pop-enter-active,
.menu-pop-leave-active {
  transition: opacity 220ms ease, transform 220ms ease;
  transform-origin: top right;
}

.menu-pop-enter-from,
.menu-pop-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.97);
}

.submenu-reveal-enter-active,
.submenu-reveal-leave-active {
  transition: grid-template-rows 220ms ease, opacity 220ms ease;
}

.submenu-reveal-enter-from,
.submenu-reveal-leave-to {
  opacity: 0;
}
</style>
