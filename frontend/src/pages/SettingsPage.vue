<template>
  <section class="w-full space-y-6 px-4 pb-10 md:px-8 xl:px-10">
    <h1 class="font-display text-3xl font-extrabold">Parametres</h1>

    <form class="space-y-4 rounded-2xl border border-white/10 bg-watchly-secondary p-5" @submit.prevent="save">
      <div class="space-y-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <span class="text-sm text-watchly-text-secondary">Choisir un avatar</span>
          <button
            type="button"
            class="rounded-lg border border-white/10 bg-black/20 px-3 py-1 text-xs hover:border-watchly-accent"
            @click="regenerateAvatars"
          >
            Regenerer
          </button>
        </div>

        <div class="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
          <img :src="form.avatar || avatarOptions[0]" alt="Avatar selectionne" class="h-14 w-14 rounded-full border border-white/15 object-cover" />
          <p class="text-sm text-watchly-text-secondary">Avatar selectionne</p>
        </div>

        <div class="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          <button
            v-for="url in avatarOptions"
            :key="url"
            type="button"
            class="rounded-xl border p-1 transition"
            :class="form.avatar === url ? 'border-watchly-accent bg-watchly-accent/10' : 'border-white/10 bg-black/20 hover:border-white/25'"
            @click="form.avatar = url"
          >
            <img :src="url" alt="Avatar" class="h-14 w-full rounded-lg object-cover" />
          </button>
        </div>
      </div>

      <label class="block space-y-1">
        <span class="text-sm text-watchly-text-secondary">Nom d'utilisateur</span>
        <input v-model="form.username" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" />
      </label>

      <label class="block space-y-1">
        <span class="text-sm text-watchly-text-secondary">Bio</span>
        <textarea v-model="form.bio" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" rows="4" />
      </label>

      <label class="block space-y-1">
        <span class="text-sm text-watchly-text-secondary">Email</span>
        <input v-model="form.email" type="email" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2" />
      </label>

      <div class="grid gap-3 sm:grid-cols-2">
        <label class="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <span class="text-sm">Mode sombre</span>
          <input v-model="darkMode" type="checkbox" class="h-4 w-4" />
        </label>

        <label class="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <span class="text-sm">Notifications</span>
          <input v-model="form.notificationsEnabled" type="checkbox" class="h-4 w-4" />
        </label>
      </div>

      <label class="block space-y-1">
        <span class="text-sm text-watchly-text-secondary">Langue</span>
        <select v-model="form.language" class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2">
          <option value="fr">Francais</option>
          <option value="en">Anglais</option>
        </select>
      </label>

      <button class="rounded-xl bg-watchly-accent px-5 py-2 font-semibold" type="submit">
        Enregistrer
      </button>
    </form>
  </section>
</template>

<script setup>
import { computed, reactive, ref, watch } from "vue";
import { useAuthStore } from "../stores/authStore";
import api from "../services/api";

const auth = useAuthStore();
const darkMode = ref((localStorage.getItem("watchly_theme") || "dark") === "dark");
const avatarSeed = ref(Date.now());

const avatarStyles = [
  "adventurer",
  "adventurer-neutral",
  "fun-emoji",
  "bottts",
  "pixel-art",
  "micah",
  "lorelei",
  "notionists"
];

const form = reactive({
  avatar: auth.user?.avatar || "",
  username: auth.user?.username || "",
  bio: auth.user?.bio || "",
  email: auth.user?.email || "",
  language: auth.user?.language || "fr",
  notificationsEnabled: auth.user?.notificationsEnabled ?? true
});

const avatarOptions = computed(() => {
  const base = (form.username || auth.user?.username || "watchly").trim() || "watchly";
  return avatarStyles.map((style, index) => {
    const seed = encodeURIComponent(`${base}-${avatarSeed.value}-${index}`);
    return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}`;
  });
});

const regenerateAvatars = () => {
  avatarSeed.value = Date.now();
};

watch(darkMode, (enabled) => {
  const nextTheme = enabled ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", nextTheme);
  document.documentElement.classList.remove("light", "dark");
  document.documentElement.classList.add(nextTheme);
  localStorage.setItem("watchly_theme", nextTheme);
}, { immediate: true });

watch(
  () => auth.user,
  (user) => {
    if (!user) {
      return;
    }

    form.avatar = user.avatar || "";
    form.username = user.username || "";
    form.bio = user.bio || "";
    form.email = user.email || "";
    form.language = user.language || "fr";
    form.notificationsEnabled = user.notificationsEnabled ?? true;

    if (!form.avatar && avatarOptions.value.length) {
      form.avatar = avatarOptions.value[0];
    }
  },
  { immediate: true }
);

watch(
  () => form.username,
  () => {
    if (!form.avatar || form.avatar.includes("api.dicebear.com")) {
      form.avatar = avatarOptions.value[0] || form.avatar;
    }
  }
);

const save = async () => {
  if (!auth.user?._id) {
    return;
  }

  const payload = {
    ...form,
    theme: darkMode.value ? "dark" : "light"
  };

  const { data } = await api.put(`/users/${auth.user._id}`, payload);
  auth.user = data;
};
</script>
