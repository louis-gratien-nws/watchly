<template>
  <section class="relative min-h-screen overflow-hidden px-4 py-8 md:px-8">
    <div class="auth-aurora absolute inset-0 -z-10" />

    <div class="mx-auto grid min-h-[calc(100vh-4rem)] w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-black/30 shadow-2xl backdrop-blur-xl lg:grid-cols-2">
      <aside class="relative hidden overflow-hidden p-8 lg:block">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(0,168,255,0.25),transparent_45%)]" />
        <div class="absolute inset-0 bg-[linear-gradient(155deg,rgba(0,0,0,0.35),rgba(0,0,0,0.85))]" />

        <div class="relative z-10 flex h-full flex-col justify-between">
          <div class="space-y-4">
            <p class="text-xs uppercase tracking-[0.3em] text-watchly-accent">Premiere configuration</p>
            <h2 class="font-display text-4xl font-extrabold leading-tight text-white">
              Cree ton univers et personnalise ton experience.
            </h2>
            <p class="max-w-md text-sm text-watchly-text-secondary">
              Un compte Watchly te donne acces a ta liste de suivi cloud, a tes preferences et a des recommandations evolutives.
            </p>
          </div>

          <div class="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4">
            <p class="text-xs uppercase tracking-[0.2em] text-watchly-accent">En 30 secondes</p>
            <p class="text-sm text-watchly-text-secondary">1. Cree ton profil</p>
            <p class="text-sm text-watchly-text-secondary">2. Sauvegarde tes films favoris</p>
            <p class="text-sm text-watchly-text-secondary">3. Reco personnalisees des ta premiere note</p>
          </div>
        </div>
      </aside>

      <div class="flex items-center p-5 md:p-8">
        <div class="w-full">
          <p class="text-xs uppercase tracking-[0.25em] text-watchly-accent">Premiere configuration</p>
          <h1 class="mt-2 font-display text-3xl font-extrabold">Créer un compte</h1>
          <p class="mt-2 text-sm text-watchly-text-secondary">Ta première visite commence ici. Crée ton compte pour accéder à Watchly.</p>

          <form class="mt-6 space-y-4" @submit.prevent="submit">
            <label class="block space-y-1">
              <span class="text-sm text-watchly-text-secondary">Nom d'utilisateur</span>
              <input
                v-model.trim="form.username"
                type="text"
                required
                minlength="2"
                class="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2"
                placeholder="Loulou"
              />
            </label>

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
                placeholder="Min 6 caracteres"
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
              {{ auth.loading ? "Creation..." : "Creer mon compte" }}
            </button>
          </form>

          <div class="mt-4">
            <p class="mb-2 text-xs uppercase tracking-[0.2em] text-watchly-text-secondary">Inscription sociale (bientot)</p>
            <div class="grid grid-cols-3 gap-2">
              <button disabled class="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs text-white/70">Google</button>
              <button disabled class="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs text-white/70">Apple</button>
              <button disabled class="rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs text-white/70">Discord</button>
            </div>
          </div>

          <p class="mt-4 text-sm text-watchly-text-secondary">
            Déjà inscrit ?
            <RouterLink class="text-watchly-accent hover:underline" to="/login">Connexion</RouterLink>
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
  username: "",
  email: "",
  password: ""
});

const submit = async () => {
  error.value = "";
  try {
    await auth.register(form);
    const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "/";
    router.push(redirect);
  } catch (e) {
    error.value = e?.response?.data?.message || "Inscription impossible. Essaie avec un autre email.";
  }
};
</script>

<style scoped>
.auth-aurora {
  background:
    radial-gradient(circle at 14% 18%, rgba(0, 168, 255, 0.26), transparent 30%),
    radial-gradient(circle at 85% 0%, rgba(255, 255, 255, 0.12), transparent 42%),
    #05080d;
}
</style>
