<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <header class="rounded-3xl border border-white/10 bg-watchly-secondary p-6">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <UserAvatar :src="auth.user?.avatar" />
          <div>
            <h1 class="font-display text-3xl font-extrabold">{{ auth.user?.username || "Invite" }}</h1>
            <p class="text-watchly-text-secondary">{{ auth.user?.bio || "Pas encore de bio" }}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-start gap-3">
          <button
            class="rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm font-semibold transition hover:border-watchly-accent"
            @click="openEditProfile"
          >
            Modifier le profil
          </button>

          <div class="min-w-[250px] rounded-2xl border border-white/10 bg-black/20 p-4">
            <div class="flex items-center justify-between gap-3">
              <div>
                <p class="text-xs uppercase tracking-[0.14em] text-watchly-text-secondary">Cercle d'amis</p>
                <p class="mt-1 text-sm font-semibold">{{ friendsCount }} ami{{ friendsCount > 1 ? "s" : "" }}</p>
              </div>
              <RouterLink to="/friends" class="text-xs text-watchly-accent transition hover:text-white">
                Gerer
              </RouterLink>
            </div>

            <div v-if="friendAvatarPreview.length" class="mt-4 flex items-center">
              <RouterLink
                v-for="(friend, index) in friendAvatarPreview"
                :key="friend._id"
                :to="`/profile/${friend._id}`"
                class="transition hover:-translate-y-0.5"
                :style="{ marginLeft: index === 0 ? '0' : '-10px', zIndex: friendAvatarPreview.length - index }"
              >
                <img
                  :src="friend.avatar"
                  :alt="friend.username"
                  :title="friend.username"
                  class="h-10 w-10 rounded-full border-2 border-watchly-secondary object-cover"
                />
              </RouterLink>
              <div v-if="friendsCount > friendAvatarPreview.length" class="ml-2 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-watchly-text-secondary">
                +{{ friendsCount - friendAvatarPreview.length }}
              </div>
            </div>

            <p v-else class="mt-4 text-sm text-watchly-text-secondary">Ajoute tes premiers amis pour les voir ici.</p>
          </div>
        </div>
      </div>

      <div class="mt-5 grid gap-3 sm:grid-cols-4">
        <div class="rounded-xl bg-black/20 p-3">
          <p class="text-xs text-watchly-text-secondary">Films vus</p>
          <p class="text-xl font-bold">{{ watchedCount }}</p>
        </div>
        <div class="rounded-xl bg-black/20 p-3">
          <p class="text-xs text-watchly-text-secondary">Avis</p>
          <p class="text-xl font-bold">{{ reviewsCount }}</p>
        </div>
        <div class="rounded-xl bg-black/20 p-3">
          <p class="text-xs text-watchly-text-secondary">Abonnes</p>
          <p class="text-xl font-bold">{{ followersCount }}</p>
        </div>
        <div class="rounded-xl bg-black/20 p-3">
          <p class="text-xs text-watchly-text-secondary">Abonnements</p>
          <p class="text-xl font-bold">{{ followingCount }}</p>
        </div>
      </div>

      <div class="mt-3 grid gap-3 sm:grid-cols-2">
        <RouterLink to="/friends" class="rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-watchly-accent">
          <p class="text-xs text-watchly-text-secondary">Amis</p>
          <p class="text-xl font-bold">{{ friendsCount }}</p>
        </RouterLink>
        <RouterLink to="/friends" class="rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-watchly-accent">
          <p class="text-xs text-watchly-text-secondary">Demandes d'amis</p>
          <p class="text-xl font-bold">{{ pendingRequestsCount }}</p>
        </RouterLink>
      </div>

      <div class="mt-3 grid gap-3 sm:grid-cols-3">
        <div class="rounded-xl border border-white/10 bg-black/20 p-3">
          <p class="text-xs text-watchly-text-secondary">Niveau</p>
          <p class="text-xl font-bold">{{ level }}</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-black/20 p-3">
          <p class="text-xs text-watchly-text-secondary">XP</p>
          <p class="text-xl font-bold">{{ xp }}</p>
        </div>
        <div class="rounded-xl border border-white/10 bg-black/20 p-3">
          <p class="text-xs text-watchly-text-secondary">Serie de visionnage</p>
          <p class="text-xl font-bold">{{ watchStreak }} jours</p>
        </div>
      </div>
    </header>

    <section class="grid gap-6 lg:grid-cols-2">
      <article class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
        <h2 class="font-display text-xl font-bold">Succes</h2>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="badge in achievements"
            :key="badge"
            class="rounded-full border border-watchly-accent/50 bg-watchly-accent/10 px-3 py-1 text-xs"
          >
            {{ badge }}
          </span>
        </div>
      </article>

      <article class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
        <h2 class="font-display text-xl font-bold">Listes personnalisees</h2>
        <p class="mt-2 text-sm text-watchly-text-secondary">Creation de collections thematiques bientot.</p>
      </article>
    </section>

    <section class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-xl font-bold">Amis recemment ajoutes</h2>
          <p class="text-sm text-watchly-text-secondary">Affiches selon l'ordre d'ajout le plus recent.</p>
        </div>
        <RouterLink to="/friends" class="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm transition hover:border-watchly-accent">
          Voir mes amis
        </RouterLink>
      </div>

      <div v-if="recentFriends.length === 0" class="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-watchly-text-secondary">
        Aucun ami recent a afficher.
      </div>

      <div v-else class="flex gap-3 overflow-x-auto pb-2">
        <RouterLink
          v-for="(friend, index) in recentFriends"
          :key="friend._id"
          :to="`/profile/${friend._id}`"
          class="min-w-[220px] rounded-2xl border border-white/10 bg-black/20 p-4 transition hover:border-watchly-accent"
        >
          <div class="flex items-center gap-3">
            <img :src="friend.avatar" :alt="friend.username" class="h-12 w-12 rounded-full object-cover" />
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold">{{ friend.username }}</p>
              <p class="truncate text-xs text-watchly-text-secondary">{{ friend.bio || "Aucune bio" }}</p>
            </div>
          </div>
          <p class="mt-3 text-xs uppercase tracking-[0.12em] text-watchly-accent">Ajout recent #{{ index + 1 }}</p>
        </RouterLink>
      </div>
    </section>

    <section class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
      <div class="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 class="font-display text-xl font-bold">Apercu des amis</h2>
          <p class="text-sm text-watchly-text-secondary">Retrouve rapidement tes amis et les demandes recentes.</p>
        </div>
        <RouterLink to="/friends" class="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm transition hover:border-watchly-accent">
          Voir tout
        </RouterLink>
      </div>

      <div class="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div v-if="friendPreview.length === 0" class="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-watchly-text-secondary">
            Aucun ami pour le moment. Ajoute-en depuis la page amis.
          </div>

          <div v-else class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <RouterLink
              v-for="friend in friendPreview"
              :key="friend._id"
              :to="`/profile/${friend._id}`"
              class="rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-watchly-accent"
            >
              <div class="flex items-center gap-3">
                <img :src="friend.avatar" :alt="friend.username" class="h-11 w-11 rounded-full object-cover" />
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold">{{ friend.username }}</p>
                  <p class="truncate text-xs text-watchly-text-secondary">{{ friend.bio || "Aucune bio" }}</p>
                </div>
              </div>
            </RouterLink>
          </div>
        </div>

        <div class="rounded-xl border border-white/10 bg-black/20 p-4">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-semibold">Demandes recues</h3>
            <span v-if="pendingRequestsPreview.length" class="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
              {{ pendingRequestsPreview.length }}
            </span>
          </div>

          <div v-if="pendingRequestsPreview.length === 0" class="text-sm text-watchly-text-secondary">
            Aucune demande en attente.
          </div>

          <div v-else class="space-y-3">
            <div v-for="person in pendingRequestsPreview" :key="person._id" class="rounded-xl border border-white/10 bg-black/10 p-3">
              <div class="flex items-center gap-3">
                <img :src="person.avatar" :alt="person.username" class="h-10 w-10 rounded-full object-cover" />
                <div class="min-w-0 flex-1">
                  <p class="truncate text-sm font-semibold">{{ person.username }}</p>
                  <p class="truncate text-xs text-watchly-text-secondary">{{ person.bio || "Aucune bio" }}</p>
                </div>
              </div>

              <div class="mt-3 flex flex-wrap gap-2">
                <button
                  class="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300 transition hover:bg-emerald-500/30"
                  @click="acceptFriendRequest(person._id)"
                >
                  Accepter
                </button>
                <button
                  class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/20"
                  @click="rejectFriendRequest(person._id)"
                >
                  Refuser
                </button>
                <RouterLink :to="`/profile/${person._id}`" class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:border-watchly-accent">
                  Profil
                </RouterLink>
              </div>
            </div>
          </div>

          <RouterLink to="/friends" class="mt-4 inline-flex rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm transition hover:border-watchly-accent">
            Gerer mes amis
          </RouterLink>
        </div>
      </div>
    </section>

    <section class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-display text-xl font-bold">Mes derniers avis</h2>
        <span class="text-xs text-watchly-text-secondary">{{ userStore.myReviews.length }} avis</span>
      </div>

      <div v-if="userStore.myReviews.length === 0" class="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-watchly-text-secondary">
        Tu n'as pas encore publie d'avis.
      </div>

      <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <RouterLink
          v-for="review in userStore.myReviews"
          :key="review._id"
          :to="`/movie/${review.movieId}`"
          class="rounded-xl border border-white/10 bg-black/20 p-3 transition hover:border-watchly-accent"
        >
          <p class="text-xs uppercase tracking-[0.14em] text-watchly-text-secondary">Film #{{ review.movieId }}</p>
          <p class="mt-1 text-sm font-semibold">{{ review.rating }}/5</p>
          <p class="mt-2 line-clamp-3 text-sm text-watchly-text-secondary">{{ review.reviewText }}</p>
        </RouterLink>
      </div>
    </section>

    <Transition name="profile-modal">
      <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm" @click.self="closeEditProfile">
        <div class="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#101624] shadow-2xl">
          <div class="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div>
              <h2 class="font-display text-2xl font-bold">Modifier le profil</h2>
              <p class="text-sm text-watchly-text-secondary">Change ton avatar, ta bio et tes informations sans afficher les options en permanence.</p>
            </div>
            <button class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm transition hover:bg-white/10" @click="closeEditProfile">
              Fermer
            </button>
          </div>

          <div class="grid max-h-[calc(90vh-74px)] overflow-y-auto lg:grid-cols-[320px_1fr]">
            <aside class="border-r border-white/10 bg-black/10 p-6">
              <div class="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                <img :src="profileForm.avatar || activeAvatarOptions[0]?.url" alt="Avatar selectionne" class="h-16 w-16 rounded-full object-cover" />
                <div>
                  <p class="font-semibold">{{ profileForm.username || auth.user?.username }}</p>
                  <p class="text-xs text-watchly-text-secondary">Avatar selectionne</p>
                </div>
              </div>

              <div class="mt-5 space-y-4">
                <label class="block space-y-1">
                  <span class="text-sm text-watchly-text-secondary">Nom d'utilisateur</span>
                  <input v-model="profileForm.username" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" />
                </label>

                <label class="block space-y-1">
                  <span class="text-sm text-watchly-text-secondary">Bio</span>
                  <textarea v-model="profileForm.bio" rows="4" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" />
                </label>

                <label class="block space-y-1">
                  <span class="text-sm text-watchly-text-secondary">Email</span>
                  <input v-model="profileForm.email" type="email" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" />
                </label>
              </div>
            </aside>

            <div class="p-6">
              <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 class="font-display text-xl font-bold">Choisir une photo de profil</h3>
                  <p class="text-sm text-watchly-text-secondary">Les avatars sont tries par categories.</p>
                </div>
                <button class="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm transition hover:border-watchly-accent" @click="regenerateAvatars">
                  Regenerer les avatars
                </button>
              </div>

              <div class="flex gap-2 overflow-x-auto pb-2">
                <button
                  v-for="category in avatarCategories"
                  :key="category.key"
                  class="whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition"
                  :class="activeAvatarCategory === category.key ? 'bg-watchly-accent text-black' : 'border border-white/10 bg-black/20 text-watchly-text-secondary hover:border-watchly-accent hover:text-white'"
                  @click="activeAvatarCategory = category.key"
                >
                  {{ category.label }}
                </button>
              </div>

              <div class="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                <button
                  v-for="avatar in activeAvatarOptions"
                  :key="avatar.url"
                  type="button"
                  class="rounded-2xl border p-2 text-left transition"
                  :class="profileForm.avatar === avatar.url ? 'border-watchly-accent bg-watchly-accent/10' : 'border-white/10 bg-black/20 hover:border-white/25'"
                  @click="profileForm.avatar = avatar.url"
                >
                  <img :src="avatar.url" :alt="avatar.label" class="h-20 w-full rounded-xl object-cover" />
                  <p class="mt-2 text-xs text-watchly-text-secondary">{{ avatar.label }}</p>
                </button>
              </div>

              <div class="mt-6 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-4">
                <button class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm transition hover:bg-white/10" @click="closeEditProfile">
                  Annuler
                </button>
                <button class="rounded-xl bg-watchly-accent px-4 py-2 text-sm font-semibold text-black transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60" :disabled="isSavingProfile" @click="saveProfile">
                  {{ isSavingProfile ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { useAuthStore } from "../stores/authStore";
import { useUserStore } from "../stores/userStore";
import UserAvatar from "../components/UserAvatar.vue";
import api from "../services/api";

const auth = useAuthStore();
const userStore = useUserStore();
const isEditModalOpen = ref(false);
const isSavingProfile = ref(false);
const avatarSeed = ref(Date.now());
const activeAvatarCategory = ref("fantasy");

const avatarCategories = [
  { key: "fantasy", label: "Fantasy", styles: ["adventurer", "adventurer-neutral", "lorelei"] },
  { key: "fun", label: "Fun", styles: ["fun-emoji", "micah"] },
  { key: "tech", label: "Tech", styles: ["bottts", "pixel-art"] },
  { key: "modern", label: "Modern", styles: ["notionists"] }
];

const profileForm = reactive({
  avatar: "",
  username: "",
  bio: "",
  email: ""
});

const buildAvatarOptions = (styles) => {
  const base = (profileForm.username || auth.user?.username || "watchly").trim() || "watchly";
  return styles.flatMap((style) => {
    return Array.from({ length: 4 }, (_, index) => {
      const seed = encodeURIComponent(`${base}-${avatarSeed.value}-${style}-${index}`);
      return {
        url: `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`,
        label: `${style} ${index + 1}`
      };
    });
  });
};

const activeAvatarOptions = computed(() => {
  const category = avatarCategories.find((item) => item.key === activeAvatarCategory.value) || avatarCategories[0];
  return buildAvatarOptions(category.styles);
});

onMounted(() => {
  if (auth.isAuthenticated) {
    userStore.fetchMyReviews();
    userStore.fetchFriendsOverview();
  }
});

const watchedCount = computed(() => auth.user?.watched?.length || 0);
const reviewsCount = computed(() => auth.user?.reviews?.length || 0);
const followersCount = computed(() => auth.user?.followers?.length || 0);
const followingCount = computed(() => auth.user?.following?.length || 0);
const friendsCount = computed(() => auth.user?.friends?.length || auth.user?.stats?.friendsCount || 0);
const pendingRequestsCount = computed(() => auth.user?.friendRequestsReceived?.length || 0);
const friendAvatarPreview = computed(() => userStore.friends.slice(0, 5));
const friendPreview = computed(() => userStore.friends.slice(0, 6));
const recentFriends = computed(() => [...userStore.friends].reverse().slice(0, 6));
const pendingRequestsPreview = computed(() => userStore.receivedRequests.slice(0, 3));
const achievements = computed(() => auth.user?.achievements || []);
const level = computed(() => auth.user?.level || 1);
const xp = computed(() => auth.user?.xp || 0);
const watchStreak = computed(() => auth.user?.watchStreak || 0);

const hydrateProfileForm = () => {
  profileForm.avatar = auth.user?.avatar || "";
  profileForm.username = auth.user?.username || "";
  profileForm.bio = auth.user?.bio || "";
  profileForm.email = auth.user?.email || "";
};

const openEditProfile = () => {
  hydrateProfileForm();
  isEditModalOpen.value = true;
};

const closeEditProfile = () => {
  isEditModalOpen.value = false;
};

const regenerateAvatars = () => {
  avatarSeed.value = Date.now();
};

const saveProfile = async () => {
  if (!auth.user?._id) {
    return;
  }

  isSavingProfile.value = true;
  try {
    const { data } = await api.put(`/users/${auth.user._id}`, {
      avatar: profileForm.avatar,
      username: profileForm.username,
      bio: profileForm.bio,
      email: profileForm.email
    });

    auth.user = data;
    closeEditProfile();
  } catch (error) {
    console.error("Error saving profile:", error);
  } finally {
    isSavingProfile.value = false;
  }
};

const acceptFriendRequest = async (userId) => {
  await userStore.acceptFriendRequest(userId);
};

const rejectFriendRequest = async (userId) => {
  await userStore.rejectFriendRequest(userId);
  await auth.fetchMe();
};

watch(
  () => profileForm.username,
  () => {
    if (!profileForm.avatar || profileForm.avatar.includes("api.dicebear.com")) {
      profileForm.avatar = activeAvatarOptions.value[0]?.url || profileForm.avatar;
    }
  }
);
</script>

<style scoped>
.profile-modal-enter-active,
.profile-modal-leave-active {
  transition: opacity 180ms ease;
}

.profile-modal-enter-from,
.profile-modal-leave-to {
  opacity: 0;
}
</style>