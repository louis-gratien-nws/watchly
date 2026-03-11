<template>
  <section class="relative min-h-screen overflow-hidden px-4 py-8 md:px-8">
    <div class="auth-aurora absolute inset-0 -z-10" />

    <div class="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
      <aside class="relative hidden overflow-hidden p-8 lg:block">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(0,168,255,0.25),transparent_45%)]" />
        <div class="absolute inset-0 bg-[linear-gradient(155deg,rgba(0,0,0,0.4),rgba(0,0,0,0.85))]" />

        <div class="relative z-10 flex h-full flex-col justify-between">
          <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.3em] text-watchly-accent">Watchly Premium</p>
            <h2 class="font-display text-4xl font-extrabold leading-tight text-white">
              Retrouve ton univers cinema en quelques secondes.
            </h2>
            <p class="max-w-md text-sm text-watchly-text-secondary">
              Continue tes films, suis tes critiques et garde ton historique synchronise sur toutes tes sessions.
            </p>
          </div>

          <div class="grid grid-cols-3 gap-3">
            <div v-for="item in showcase" :key="item.title" class="group overflow-hidden rounded-xl border border-white/10 bg-black/30">
              <img :src="item.image" :alt="item.title" class="h-32 w-full object-cover transition duration-500 group-hover:scale-110" />
              <p class="truncate px-2 py-1 text-xs text-white/85">{{ item.title }}</p>
            </div>
          </div>
        </div>
      </aside>

      <div class="flex items-center p-5 md:p-8">
        <div class="w-full">
          <p class="text-xs uppercase tracking-[0.25em] text-watchly-accent">Acces Watchly</p>
          <h1 class="mt-2 font-display text-3xl font-extrabold">Connexion</h1>
          <p class="mt-2 text-sm text-watchly-text-secondary">Connecte-toi pour retrouver ta liste, tes avis et tes recommandations.</p>

          <div class="mt-5 grid gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-sm">
            <p class="font-semibold">Onboarding rapide</p>
            <ul class="space-y-1 text-watchly-text-secondary">
              <li>1. Reprends ta lecture et ta liste de suivi instantanement</li>
              <li>2. Reco personnalisees selon tes notes</li>
              <li>3. Profil synchronise sur tous tes appareils</li>
            </ul>
          </div>

          <form class="mt-5 space-y-4" @submit.prevent="submit">
            <label class="block space-y-1">
              <span class="text-sm text-watchly-text-secondary">Email</span>
              <input
                v-model.trim="form.email"
                type="email"
                required
                class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                placeholder="you@email.com"
              />
            </label>

            <label class="block space-y-1">
              <span class="text-sm text-watchly-text-secondary">Mot de passe</span>
              <input
                v-model="form.password"
                type="password"
                required
                minlength="6"
                class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                placeholder="••••••••"
              />
            </label>

            <p v-if="error" class="rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {{ error }}
            </p>

            <button
              type="submit"
              class="w-full rounded-xl bg-watchly-accent px-4 py-2 font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
              :disabled="auth.loading"
            >
              {{ auth.loading ? "Connexion..." : "Se connecter" }}
            </button>
          </form>

          <div class="mt-4">
            <p class="mb-2 text-xs uppercase tracking-[0.2em] text-watchly-text-secondary">Connexion sociale (bientot)</p>
            <div class="grid grid-cols-3 gap-2">
              <button disabled class="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs text-white/70">Google</button>
              <button disabled class="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs text-white/70">Apple</button>
              <button disabled class="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs text-white/70">Discord</button>
            </div>
          </div>

          <p class="mt-4 text-sm text-watchly-text-secondary">
            Pas encore de compte ?
            <RouterLink class="text-watchly-accent hover:underline" to="/register">Inscription</RouterLink>
          </p>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useAuthStore } from "../stores/authStore";

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();
const error = ref("");

const form = reactive({
  email: "",
  password: ""
});

const showcase = [
  {
    title: "Selection SF",
    image: "https://image.tmdb.org/t/p/w500/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg"
  },
  {
    title: "Meilleurs avis",
    image: "https://image.tmdb.org/t/p/w500/9Gtg2DzBhmYamXBS1hKAhiwbBKS.jpg"
  },
  {
    title: "Ce soir",
    image: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg"
  }
];

const submit = async () => {
  error.value = "";
  try {
    await auth.login(form);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    router.push(redirect);
  } catch (e) {
    error.value = e?.response?.data?.message || "Connexion impossible. Verifie tes identifiants.";
  }
};
</script>

<style scoped>
.auth-aurora {
  background:
    radial-gradient(circle at 18% 22%, rgba(0, 168, 255, 0.26), transparent 32%),
    radial-gradient(circle at 82% 0%, rgba(255, 255, 255, 0.13), transparent 42%),
    #05080d;
}
</style>
