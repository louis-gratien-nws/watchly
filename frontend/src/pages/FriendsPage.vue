<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <header class="rounded-3xl border border-white/10 bg-watchly-secondary p-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="font-display text-3xl font-extrabold">Mes amis</h1>
          <p class="text-sm text-watchly-text-secondary">
            Gerez vos amis, vos demandes en attente et trouvez de nouvelles personnes a ajouter.
          </p>
        </div>
        <div class="grid gap-3 sm:grid-cols-3">
          <div class="rounded-xl bg-black/20 p-3">
            <p class="text-xs text-watchly-text-secondary">Amis</p>
            <p class="text-xl font-bold">{{ userStore.friends.length }}</p>
          </div>
          <div class="rounded-xl bg-black/20 p-3">
            <p class="text-xs text-watchly-text-secondary">Demandes recues</p>
            <p class="text-xl font-bold">{{ userStore.receivedRequests.length }}</p>
          </div>
          <div class="rounded-xl bg-black/20 p-3">
            <p class="text-xs text-watchly-text-secondary">Demandes envoyees</p>
            <p class="text-xl font-bold">{{ userStore.sentRequests.length }}</p>
          </div>
        </div>
      </div>
    </header>

    <section class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
      <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 class="font-display text-xl font-bold">Ajouter des amis</h2>
          <p class="text-sm text-watchly-text-secondary">Cherchez un pseudo puis envoyez une demande.</p>
        </div>
        <input
          v-model="search"
          type="search"
          placeholder="Rechercher un utilisateur"
          class="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm outline-none placeholder:text-watchly-text-secondary md:max-w-sm"
        />
      </div>

      <div v-if="userStore.userSearchResults.length" class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="person in userStore.userSearchResults"
          :key="person._id"
          class="rounded-2xl border border-white/10 bg-black/20 p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <RouterLink :to="`/profile/${person._id}`" class="flex items-center gap-3">
              <img :src="person.avatar" :alt="person.username" class="h-12 w-12 rounded-full object-cover" />
              <div>
                <p class="font-semibold">{{ person.username }}</p>
                <p class="text-xs text-watchly-text-secondary">{{ person.bio || "Aucune bio" }}</p>
              </div>
            </RouterLink>
            <span class="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-watchly-text-secondary">
              {{ statusLabel(person.relationshipStatus) }}
            </span>
          </div>

          <div class="mt-4 flex gap-2">
            <button
              v-if="person.relationshipStatus === 'none'"
              class="rounded-xl bg-watchly-accent px-3 py-2 text-sm font-semibold text-black"
              @click="sendRequest(person._id)"
            >
              Ajouter
            </button>
            <button
              v-else-if="person.relationshipStatus === 'incoming'"
              class="rounded-xl bg-emerald-500/20 px-3 py-2 text-sm font-semibold text-emerald-300"
              @click="acceptRequest(person._id)"
            >
              Accepter
            </button>
            <button
              v-else-if="person.relationshipStatus === 'outgoing'"
              class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
              @click="cancelRequest(person._id)"
            >
              Annuler
            </button>
            <button
              v-else-if="person.relationshipStatus === 'friend'"
              class="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300"
              @click="removeFriend(person._id)"
            >
              Retirer
            </button>
            <RouterLink
              :to="`/profile/${person._id}`"
              class="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              Voir profil
            </RouterLink>
          </div>
        </article>
      </div>

      <p v-else-if="search.trim().length >= 2" class="mt-4 text-sm text-watchly-text-secondary">
        Aucun utilisateur trouve.
      </p>
    </section>

    <section class="grid gap-6 xl:grid-cols-2">
      <article class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-xl font-bold">Demandes recues</h2>
          <span class="text-xs text-watchly-text-secondary">{{ userStore.receivedRequests.length }}</span>
        </div>

        <div v-if="!userStore.receivedRequests.length" class="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-watchly-text-secondary">
          Aucune demande recue pour le moment.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="person in userStore.receivedRequests"
            :key="person._id"
            class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
          >
            <RouterLink :to="`/profile/${person._id}`" class="flex items-center gap-3">
              <img :src="person.avatar" :alt="person.username" class="h-11 w-11 rounded-full object-cover" />
              <div>
                <p class="font-semibold">{{ person.username }}</p>
                <p class="text-xs text-watchly-text-secondary">{{ person.bio || "Aucune bio" }}</p>
              </div>
            </RouterLink>

            <div class="flex gap-2">
              <button class="rounded-lg bg-emerald-500/20 px-3 py-2 text-sm text-emerald-300" @click="acceptRequest(person._id)">
                Accepter
              </button>
              <button class="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300" @click="rejectRequest(person._id)">
                Refuser
              </button>
            </div>
          </div>
        </div>
      </article>

      <article class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="font-display text-xl font-bold">Demandes envoyees</h2>
          <span class="text-xs text-watchly-text-secondary">{{ userStore.sentRequests.length }}</span>
        </div>

        <div v-if="!userStore.sentRequests.length" class="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-watchly-text-secondary">
          Aucune demande envoyee en attente.
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="person in userStore.sentRequests"
            :key="person._id"
            class="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 p-3"
          >
            <RouterLink :to="`/profile/${person._id}`" class="flex items-center gap-3">
              <img :src="person.avatar" :alt="person.username" class="h-11 w-11 rounded-full object-cover" />
              <div>
                <p class="font-semibold">{{ person.username }}</p>
                <p class="text-xs text-watchly-text-secondary">En attente</p>
              </div>
            </RouterLink>

            <button class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm" @click="cancelRequest(person._id)">
              Annuler
            </button>
          </div>
        </div>
      </article>
    </section>

    <section class="rounded-2xl border border-white/10 bg-watchly-secondary p-4">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="font-display text-xl font-bold">Ma liste d'amis</h2>
        <span class="text-xs text-watchly-text-secondary">{{ userStore.friends.length }}</span>
      </div>

      <div v-if="!userStore.friends.length" class="rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-watchly-text-secondary">
        Vous n'avez pas encore d'amis sur Watchly.
      </div>

      <div v-else class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <article
          v-for="person in userStore.friends"
          :key="person._id"
          class="rounded-2xl border border-white/10 bg-black/20 p-4"
        >
          <RouterLink :to="`/profile/${person._id}`" class="flex items-center gap-3">
            <img :src="person.avatar" :alt="person.username" class="h-12 w-12 rounded-full object-cover" />
            <div>
              <p class="font-semibold">{{ person.username }}</p>
              <p class="text-xs text-watchly-text-secondary">{{ person.bio || "Aucune bio" }}</p>
            </div>
          </RouterLink>

          <div class="mt-4 flex gap-2">
            <RouterLink :to="`/profile/${person._id}`" class="rounded-xl bg-white/10 px-3 py-2 text-sm">
              Voir profil
            </RouterLink>
            <button class="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300" @click="removeFriend(person._id)">
              Retirer
            </button>
          </div>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { RouterLink } from "vue-router";
import { useUserStore } from "../stores/userStore";

const userStore = useUserStore();
const search = ref("");

const normalizedSearch = computed(() => search.value.trim());

const statusLabel = (status) => {
  if (status === "friend") return "ami";
  if (status === "incoming") return "recu";
  if (status === "outgoing") return "envoye";
  if (status === "self") return "vous";
  return "nouveau";
};

const refreshSearch = async () => {
  if (normalizedSearch.value.length < 2) {
    userStore.userSearchResults = [];
    return;
  }

  await userStore.searchUsers(normalizedSearch.value);
};

const sendRequest = async (userId) => {
  await userStore.sendFriendRequest(userId);
  await refreshSearch();
};

const acceptRequest = async (userId) => {
  await userStore.acceptFriendRequest(userId);
  await refreshSearch();
};

const rejectRequest = async (userId) => {
  await userStore.rejectFriendRequest(userId);
  await refreshSearch();
};

const cancelRequest = async (userId) => {
  await userStore.cancelFriendRequest(userId);
  await refreshSearch();
};

const removeFriend = async (userId) => {
  await userStore.removeFriend(userId);
  await refreshSearch();
};

watch(search, refreshSearch);

onMounted(async () => {
  await userStore.fetchFriendsOverview();
});
</script>