<template>
  <section class="clubs-page w-full px-4 pb-10 md:px-8 xl:px-10">
    <header class="hero-panel mb-6 overflow-hidden rounded-3xl border border-white/10 p-6 md:p-8">
      <div class="hero-glow hero-glow-a" />
      <div class="hero-glow hero-glow-b" />
      <div class="relative z-10 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p class="text-xs uppercase tracking-[0.25em] text-watchly-text-secondary">Social hub</p>
          <h1 class="font-display text-3xl font-extrabold md:text-4xl">Clubs prives</h1>
          <p class="mt-2 max-w-2xl text-sm text-watchly-text-secondary">
            Cercle ferme, feed live filtre par club, gouvernance interne et historique admin.
          </p>
        </div>
        <div class="grid w-full gap-3 sm:grid-cols-4 lg:max-w-2xl">
          <article class="stat-card">
            <p class="text-xs text-watchly-text-secondary">Mes clubs</p>
            <p class="text-2xl font-bold">{{ clubs.length }}</p>
          </article>
          <article class="stat-card">
            <p class="text-xs text-watchly-text-secondary">Membres (actif)</p>
            <p class="text-2xl font-bold">{{ selectedClub?.memberCount || 0 }}</p>
          </article>
          <article class="stat-card">
            <p class="text-xs text-watchly-text-secondary">Participation moyenne</p>
            <p class="text-2xl font-bold">{{ clubStats?.summary?.averageParticipationRate || 0 }}%</p>
          </article>
          <article class="stat-card">
            <p class="text-xs text-watchly-text-secondary">Notif club non lues</p>
            <p class="text-2xl font-bold">{{ clubUnreadCount }}</p>
          </article>
        </div>
      </div>
    </header>

    <Transition name="live-pop">
      <div v-if="liveToast" class="live-toast">
        <p class="text-xs uppercase tracking-[0.14em] text-cyan-200">Live</p>
        <p class="text-sm">{{ liveToast }}</p>
      </div>
    </Transition>

    <div v-if="globalError" class="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      {{ globalError }}
    </div>

    <Transition name="modal-fade">
      <div v-if="ownershipModal.open" class="modal-overlay" @click="closeOwnershipModal">
        <div class="modal-card" @click.stop>
          <p class="text-xs uppercase tracking-[0.12em] text-watchly-text-secondary">Transfert de propriete</p>
          <h3 class="mt-1 font-display text-2xl font-extrabold">Confirmer le transfert</h3>
          <p class="mt-2 text-sm text-watchly-text-secondary">
            Vous allez transferer la propriete du club a <span class="font-semibold text-white">{{ ownershipModal.target?.username }}</span>.
          </p>

          <label class="mt-4 block text-xs uppercase tracking-[0.1em] text-watchly-text-secondary">Votre role apres transfert</label>
          <select v-model="ownershipModal.previousOwnerRole" class="input-base mt-1">
            <option value="admin">Admin</option>
            <option value="member">Member</option>
          </select>

          <div class="mt-5 flex justify-end gap-2">
            <button class="btn-ghost" @click="closeOwnershipModal">Annuler</button>
            <button class="btn-danger" :disabled="ownershipModal.submitting" @click="confirmOwnershipTransfer">
              {{ ownershipModal.submitting ? 'Transfert...' : 'Confirmer le transfert' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <section class="grid gap-6 xl:grid-cols-[330px_1fr]">
      <aside class="space-y-4">
        <article class="panel-card rounded-2xl p-4">
          <h2 class="font-display text-xl font-bold">Creer un club</h2>
          <p class="mb-3 text-xs text-watchly-text-secondary">Prive par defaut avec code d invitation.</p>

          <form class="space-y-2" @submit.prevent="handleCreateClub">
            <input v-model.trim="createForm.name" required maxlength="80" class="input-base" placeholder="Nom du club" />
            <textarea
              v-model.trim="createForm.description"
              maxlength="350"
              rows="3"
              class="input-base resize-none"
              placeholder="Description (optionnel)"
            />
            <button :disabled="savingCreate" class="btn-solid w-full">
              {{ savingCreate ? 'Creation...' : 'Creer mon club' }}
            </button>
          </form>
        </article>

        <article class="panel-card rounded-2xl p-4">
          <h2 class="font-display text-xl font-bold">Rejoindre avec code</h2>
          <p class="mb-3 text-xs text-watchly-text-secondary">Demandez un code a un admin du club.</p>

          <form class="space-y-2" @submit.prevent="handleJoinClub">
            <input v-model.trim="joinCode" maxlength="8" class="input-base uppercase" placeholder="Ex: AB12CD" />
            <button :disabled="savingJoin" class="btn-ghost w-full">
              {{ savingJoin ? 'Connexion...' : 'Rejoindre le club' }}
            </button>
          </form>
        </article>

        <article class="panel-card rounded-2xl p-4">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="font-display text-xl font-bold">Mes clubs</h2>
            <button class="text-xs text-watchly-accent" @click="loadClubs">Rafraichir</button>
          </div>

          <TransitionGroup name="club-stagger" tag="div" class="space-y-2">
            <button
              v-for="club in clubs"
              :key="club._id"
              class="club-chip"
              :class="selectedClubId === club._id ? 'club-chip-active' : ''"
              @click="selectClub(club._id)"
            >
              <div class="flex items-center justify-between gap-2">
                <p class="truncate text-sm font-semibold">{{ club.name }}</p>
                <span class="rounded-full border border-white/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.12em]">{{ club.role }}</span>
              </div>
              <p class="mt-1 text-xs text-watchly-text-secondary">{{ club.memberCount }} membres</p>
            </button>
          </TransitionGroup>

          <p v-if="!clubs.length && !loadingClubs" class="mt-2 text-xs text-watchly-text-secondary">Aucun club pour le moment.</p>
        </article>
      </aside>

      <div class="space-y-6">
        <article v-if="selectedClub" class="panel-card rounded-3xl p-5 md:p-6">
          <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <p class="text-xs uppercase tracking-[0.15em] text-watchly-text-secondary">Club actif</p>
              <h2 class="font-display text-2xl font-extrabold">{{ selectedClub.name }}</h2>
              <p class="mt-2 text-sm text-watchly-text-secondary">{{ selectedClub.description || 'Aucune description pour ce club.' }}</p>
            </div>

            <div class="flex flex-wrap gap-2">
              <span class="live-state" :class="liveConnected ? 'live-state-ok' : 'live-state-warn'">
                {{ liveConnected ? 'Live connecte' : 'Live reconnecte...' }}
              </span>
              <button class="btn-ghost" @click="copyInviteCode">Code: {{ selectedClub.inviteCode }}</button>
              <button
                v-if="selectedClub.role === 'owner' || selectedClub.role === 'admin'"
                class="btn-ghost"
                :disabled="savingInvite"
                @click="regenerateInvite"
              >
                {{ savingInvite ? 'Maj...' : 'Nouveau code' }}
              </button>
              <button v-if="selectedClub.role !== 'owner'" class="btn-danger" @click="leaveCurrentClub">Quitter</button>
            </div>
          </div>
        </article>

        <article v-if="selectedClub" class="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div class="space-y-6">
            <section class="panel-card rounded-3xl p-5">
              <div class="mb-4 flex items-end justify-between gap-2">
                <div>
                  <h3 class="font-display text-xl font-bold">Feed prive</h3>
                  <p class="text-xs text-watchly-text-secondary">Nouveau post et vote en temps reel sur club selectionne.</p>
                </div>
                <span class="text-[11px] uppercase tracking-[0.12em] text-watchly-text-secondary">{{ selectedClub.posts.length }} posts</span>
              </div>

              <form class="mb-4 space-y-2" @submit.prevent="handleCreatePost">
                <textarea
                  v-model.trim="newPost"
                  rows="3"
                  maxlength="700"
                  class="input-base resize-none"
                  placeholder="Ecris un message pour le club..."
                />
                <button :disabled="savingPost" class="btn-solid">
                  {{ savingPost ? 'Publication...' : 'Publier dans le feed' }}
                </button>
              </form>

              <TransitionGroup name="post-stagger" tag="div" class="space-y-3">
                <article v-for="post in selectedClub.posts" :key="post._id" class="post-card rounded-2xl p-4">
                  <div class="mb-2 flex items-center gap-3">
                    <img :src="post.author.avatar" :alt="post.author.username" class="h-9 w-9 rounded-full object-cover" />
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold">{{ post.author.username }}</p>
                      <p class="text-[11px] text-watchly-text-secondary">{{ formatDate(post.createdAt) }}</p>
                    </div>
                  </div>
                  <p class="whitespace-pre-wrap text-sm">{{ post.content }}</p>
                  <div class="mt-3 flex items-center justify-between gap-2">
                    <button class="btn-like" :class="post.hasLiked ? 'btn-like-active' : ''" @click="toggleLike(post)">
                      {{ post.hasLiked ? 'Like retire' : 'Liker' }}
                    </button>
                    <span class="text-xs text-watchly-text-secondary">{{ post.likeCount }} likes</span>
                  </div>
                </article>
              </TransitionGroup>
            </section>

            <section class="panel-card rounded-3xl p-5">
              <div class="mb-4 flex items-end justify-between gap-2">
                <div>
                  <h3 class="font-display text-xl font-bold">Votes du club</h3>
                  <p class="text-xs text-watchly-text-secondary">Sondages collaboratifs avec progression animée.</p>
                </div>
                <span class="text-[11px] uppercase tracking-[0.12em] text-watchly-text-secondary">{{ selectedClub.polls.length }} sondages</span>
              </div>

              <form class="grid gap-2 rounded-2xl border border-white/10 bg-black/20 p-3" @submit.prevent="handleCreatePoll">
                <input v-model.trim="newPoll.question" maxlength="180" class="input-base" placeholder="Question du sondage" />
                <div class="grid gap-2 sm:grid-cols-2">
                  <input
                    v-for="(option, index) in newPoll.options"
                    :key="`option-${index}`"
                    v-model.trim="newPoll.options[index]"
                    maxlength="120"
                    class="input-base"
                    :placeholder="`Option ${index + 1}`"
                  />
                </div>
                <button :disabled="savingPoll" class="btn-solid w-full sm:w-auto">
                  {{ savingPoll ? 'Creation...' : 'Creer un vote' }}
                </button>
              </form>

              <TransitionGroup name="poll-stagger" tag="div" class="mt-4 space-y-3">
                <article v-for="poll in selectedClub.polls" :key="poll._id" class="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div class="mb-3">
                    <p class="text-sm font-semibold">{{ poll.question }}</p>
                    <p class="text-[11px] text-watchly-text-secondary">{{ poll.totalVotes }} votes</p>
                  </div>

                  <div class="space-y-2">
                    <button
                      v-for="option in poll.options"
                      :key="`${poll._id}-${option.index}`"
                      class="vote-option"
                      :disabled="savingVote"
                      @click="voteOption(poll, option.index)"
                    >
                      <span class="vote-fill" :style="{ width: voteWidth(option.voteCount, poll.totalVotes) }" />
                      <span class="relative z-10 text-left text-xs font-medium">{{ option.label }}</span>
                      <span class="relative z-10 text-xs">{{ option.voteCount }}</span>
                    </button>
                  </div>
                </article>
              </TransitionGroup>
            </section>

            <section class="panel-card rounded-3xl p-5">
              <div class="mb-4 flex items-end justify-between gap-2">
                <div>
                  <h3 class="font-display text-xl font-bold">Statistiques (7 jours)</h3>
                  <p class="text-xs text-watchly-text-secondary">Activite recente, top contributeurs, participation sondages.</p>
                </div>
                <button class="text-xs text-watchly-accent" @click="loadStats">Rafraichir</button>
              </div>

              <div v-if="clubStats" class="space-y-4">
                <div class="grid gap-2 sm:grid-cols-4">
                  <article class="stats-mini"><p class="label">Posts</p><p class="value">{{ clubStats.summary.posts }}</p></article>
                  <article class="stats-mini"><p class="label">Sondages</p><p class="value">{{ clubStats.summary.polls }}</p></article>
                  <article class="stats-mini"><p class="label">Votes</p><p class="value">{{ clubStats.summary.votes }}</p></article>
                  <article class="stats-mini"><p class="label">Membres</p><p class="value">{{ clubStats.summary.memberCount }}</p></article>
                </div>

                <div class="space-y-2">
                  <p class="text-xs uppercase tracking-[0.12em] text-watchly-text-secondary">Activite journaliere</p>
                  <div class="grid grid-cols-7 gap-1">
                    <div v-for="day in clubStats.activityByDay" :key="day.date" class="activity-cell">
                      <p class="text-[10px] text-watchly-text-secondary">{{ day.label }}</p>
                      <p class="text-xs font-semibold">P {{ day.posts }}</p>
                      <p class="text-xs font-semibold">S {{ day.polls }}</p>
                    </div>
                  </div>
                </div>

                <div class="space-y-2">
                  <p class="text-xs uppercase tracking-[0.12em] text-watchly-text-secondary">Top contributeurs</p>
                  <article v-for="contributor in clubStats.topContributors" :key="contributor.userId" class="contrib-row">
                    <img :src="contributor.avatar" :alt="contributor.username" class="h-8 w-8 rounded-full object-cover" />
                    <p class="flex-1 truncate text-sm font-semibold">{{ contributor.username }}</p>
                    <p class="text-xs text-watchly-text-secondary">{{ contributor.posts }} posts</p>
                    <p class="text-xs text-watchly-text-secondary">{{ contributor.votes }} votes</p>
                    <p class="text-sm font-bold text-watchly-accent">{{ contributor.points }}</p>
                  </article>
                </div>
              </div>
            </section>
          </div>

          <aside class="space-y-6">
            <section class="panel-card rounded-3xl p-5">
              <div class="mb-3 flex items-center justify-between">
                <h3 class="font-display text-xl font-bold">Notifications live (club)</h3>
                <div class="flex items-center gap-2">
                  <span class="rounded-full bg-watchly-accent/20 px-2 py-0.5 text-xs font-semibold text-watchly-accent">{{ clubUnreadCount }}</span>
                  <button class="text-xs text-watchly-accent" @click="markClubNotificationsRead">Marquer lu</button>
                </div>
              </div>

              <div class="space-y-2">
                <article v-for="notification in clubNotifications" :key="notification._id" class="notif-row" :class="notification.read ? '' : 'notif-row-unread'">
                  <img :src="notification.senderId?.avatar" :alt="notification.senderId?.username" class="h-8 w-8 rounded-full object-cover" />
                  <div class="min-w-0 flex-1">
                    <p class="line-clamp-2 text-xs">{{ notification.message }}</p>
                    <p class="text-[11px] text-watchly-text-secondary">{{ formatDate(notification.createdAt) }}</p>
                  </div>
                </article>
                <p v-if="!clubNotifications.length" class="text-xs text-watchly-text-secondary">Aucune notification pour ce club.</p>
              </div>
            </section>

            <section class="panel-card rounded-3xl p-5">
              <div class="mb-3 flex items-center justify-between">
                <h3 class="font-display text-xl font-bold">Classement interne</h3>
                <button class="text-xs text-watchly-accent" @click="loadRanking">Maj</button>
              </div>

              <TransitionGroup name="rank-stagger" tag="div" class="space-y-2">
                <article
                  v-for="(member, index) in ranking"
                  :key="member.userId"
                  class="rank-row"
                  :class="index === 0 ? 'rank-row-top' : ''"
                >
                  <span class="text-sm font-bold">#{{ index + 1 }}</span>
                  <img :src="member.avatar" :alt="member.username" class="h-8 w-8 rounded-full object-cover" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold">{{ member.username }}</p>
                    <p class="text-[11px] text-watchly-text-secondary">{{ member.role }}</p>
                  </div>
                  <span class="text-sm font-bold text-watchly-accent">{{ member.points }}</span>
                </article>
              </TransitionGroup>
            </section>

            <section class="panel-card rounded-3xl p-5">
              <div class="mb-3 flex items-center justify-between">
                <h3 class="font-display text-xl font-bold">Gestion des roles</h3>
                <span class="text-xs text-watchly-text-secondary">{{ canManageRoles ? 'Owner/Admin' : 'Lecture seule' }}</span>
              </div>

              <div class="space-y-2">
                <article v-for="member in selectedClub.members" :key="member.userId" class="member-row">
                  <img :src="member.avatar" :alt="member.username" class="h-8 w-8 rounded-full object-cover" />
                  <div class="min-w-0 flex-1">
                    <p class="truncate text-sm font-semibold">{{ member.username }}</p>
                    <p class="text-[11px] text-watchly-text-secondary">{{ member.role }}</p>
                  </div>

                  <div v-if="canManageRoles && member.role !== 'owner' && member.userId !== myUserId" class="flex items-center gap-2">
                    <button
                      v-if="member.role === 'member' && selectedClub.role === 'owner'"
                      class="btn-ghost px-2 py-1 text-[11px]"
                      @click="changeRole(member, 'admin')"
                    >
                      Promouvoir admin
                    </button>
                    <button
                      v-if="member.role === 'admin' && selectedClub.role === 'owner'"
                      class="btn-ghost px-2 py-1 text-[11px]"
                      @click="changeRole(member, 'member')"
                    >
                      Retrograder
                    </button>
                    <button
                      v-if="selectedClub.role === 'owner'"
                      class="btn-ghost px-2 py-1 text-[11px]"
                      @click="transferOwnershipTo(member)"
                    >
                      Transferer propriete
                    </button>
                    <button class="btn-danger px-2 py-1 text-[11px]" @click="removeMemberFromClub(member)">Retirer</button>
                  </div>
                </article>
              </div>
            </section>

            <section class="panel-card rounded-3xl p-5">
              <div class="mb-3 flex items-center justify-between">
                <h3 class="font-display text-xl font-bold">Audit admin</h3>
                <button class="text-xs text-watchly-accent" @click="loadAuditLogs">Maj</button>
              </div>

              <div class="mb-2 grid gap-2 sm:grid-cols-3">
                <select v-model="auditFilters.action" class="input-base text-xs">
                  <option value="all">Toutes actions</option>
                  <option value="role_update">Changement role</option>
                  <option value="member_removed">Retrait membre</option>
                  <option value="ownership_transfer">Transfert propriete</option>
                </select>
                <select v-model="auditFilters.member" class="input-base text-xs">
                  <option value="all">Tous membres</option>
                  <option v-for="member in auditMemberOptions" :key="member.id" :value="member.id">{{ member.username }}</option>
                </select>
                <select v-model="auditFilters.period" class="input-base text-xs">
                  <option value="all">Toute periode</option>
                  <option value="7">7 jours</option>
                  <option value="30">30 jours</option>
                  <option value="90">90 jours</option>
                </select>
              </div>

              <div class="mb-3 grid gap-2 sm:grid-cols-[1fr_120px]">
                <input
                  v-model.trim="auditSearch"
                  class="input-base text-xs"
                  placeholder="Recherche texte (acteur, cible, action...)"
                />
                <select v-model.number="auditPagination.pageSize" class="input-base text-xs">
                  <option :value="5">5 / page</option>
                  <option :value="10">10 / page</option>
                  <option :value="20">20 / page</option>
                </select>
              </div>

              <div class="space-y-2">
                <article v-for="(log, index) in paginatedAuditLogs" :key="`${log.createdAt}-${index}`" class="audit-row">
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-semibold">{{ describeAudit(log) }}</p>
                    <p class="text-[11px] text-watchly-text-secondary">{{ formatDate(log.createdAt) }}</p>
                  </div>
                </article>
                <p v-if="!paginatedAuditLogs.length" class="text-xs text-watchly-text-secondary">Aucun resultat pour ce filtre.</p>
              </div>

              <div v-if="filteredAuditLogs.length" class="mt-3 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <p class="text-xs text-watchly-text-secondary">Page {{ auditPagination.page }} / {{ auditTotalPages }}</p>
                <div class="flex items-center gap-2">
                  <button class="btn-ghost px-2 py-1 text-[11px]" :disabled="auditPagination.page <= 1" @click="auditPagination.page -= 1">
                    Prec.
                  </button>
                  <button class="btn-ghost px-2 py-1 text-[11px]" :disabled="auditPagination.page >= auditTotalPages" @click="auditPagination.page += 1">
                    Suiv.
                  </button>
                </div>
              </div>
            </section>
          </aside>
        </article>

        <article v-else class="panel-card rounded-3xl p-8 text-center">
          <h2 class="font-display text-2xl font-bold">Selectionnez un club</h2>
          <p class="mt-2 text-sm text-watchly-text-secondary">
            Creez ou rejoignez un club prive pour voir votre feed, vos votes et votre classement.
          </p>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useAuthStore } from "../stores/authStore";
import { clubService } from "../services/clubService";

const auth = useAuthStore();
const myUserId = computed(() => auth.user?._id || auth.user?.id || "");

const clubs = ref([]);
const selectedClubId = ref("");
const selectedClub = ref(null);
const ranking = ref([]);
const clubStats = ref(null);
const clubNotifications = ref([]);
const clubUnreadCount = ref(0);
const clubAuditLogs = ref([]);

const loadingClubs = ref(false);
const savingCreate = ref(false);
const savingJoin = ref(false);
const savingPost = ref(false);
const savingPoll = ref(false);
const savingVote = ref(false);
const savingInvite = ref(false);

const liveConnected = ref(false);
const liveToast = ref("");
let clearLiveToastTimer = null;
let streamCleanup = null;
let reconnectTimer = null;
let refreshTimer = null;

const globalError = ref("");

const ownershipModal = reactive({
  open: false,
  target: null,
  previousOwnerRole: "admin",
  submitting: false
});

const auditFilters = reactive({
  action: "all",
  member: "all",
  period: "30"
});

const auditSearch = ref("");
const auditPagination = reactive({
  page: 1,
  pageSize: 10
});

const createForm = reactive({
  name: "",
  description: ""
});

const joinCode = ref("");
const newPost = ref("");
const newPoll = reactive({
  question: "",
  options: ["", "", "", ""]
});

const canManageRoles = computed(() => {
  if (!selectedClub.value) return false;
  return ["owner", "admin"].includes(selectedClub.value.role);
});

const auditMemberOptions = computed(() => {
  const members = selectedClub.value?.members || [];
  return members.map((member) => ({ id: String(member.userId), username: member.username }));
});

const filteredAuditLogs = computed(() => {
  const now = Date.now();
  const maxAgeDays = auditFilters.period === "all" ? null : Number(auditFilters.period);
  const searchTerm = auditSearch.value.trim().toLowerCase();

  return clubAuditLogs.value.filter((log) => {
    if (auditFilters.action !== "all" && log.action !== auditFilters.action) {
      return false;
    }

    if (auditFilters.member !== "all" && String(log.targetUserId) !== String(auditFilters.member)) {
      return false;
    }

    if (maxAgeDays) {
      const createdAtMs = new Date(log.createdAt).getTime();
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
      if (!Number.isFinite(createdAtMs) || now - createdAtMs > maxAgeMs) {
        return false;
      }
    }

    if (searchTerm) {
      const haystack = [
        log.action,
        log.actorUsername,
        log.targetUsername,
        log.metadata?.fromRole,
        log.metadata?.toRole,
        describeAudit(log)
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(searchTerm)) {
        return false;
      }
    }

    return true;
  });
});

const auditTotalPages = computed(() => {
  return Math.max(1, Math.ceil(filteredAuditLogs.value.length / auditPagination.pageSize));
});

const paginatedAuditLogs = computed(() => {
  const start = (auditPagination.page - 1) * auditPagination.pageSize;
  return filteredAuditLogs.value.slice(start, start + auditPagination.pageSize);
});

watch(
  [() => auditFilters.action, () => auditFilters.member, () => auditFilters.period, auditSearch, () => auditPagination.pageSize],
  () => {
    auditPagination.page = 1;
  }
);

watch(auditTotalPages, (pages) => {
  if (auditPagination.page > pages) {
    auditPagination.page = pages;
  }
});

const withErrorHandling = async (action, fallbackMessage) => {
  try {
    globalError.value = "";
    await action();
  } catch (error) {
    globalError.value = error?.response?.data?.message || fallbackMessage;
  }
};

const scheduleSelectedRefresh = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
  }

  refreshTimer = setTimeout(async () => {
    if (!selectedClubId.value) return;
    await Promise.all([
      loadSelectedClub(),
      loadRanking(),
      loadStats(),
      loadClubNotifications(),
      loadClubUnreadCount(),
      loadAuditLogs(),
      loadClubs()
    ]);
  }, 500);
};

const showLiveToast = (message) => {
  liveToast.value = message;
  if (clearLiveToastTimer) {
    clearTimeout(clearLiveToastTimer);
  }
  clearLiveToastTimer = setTimeout(() => {
    liveToast.value = "";
  }, 2600);
};

const connectLiveStream = async () => {
  if (streamCleanup) {
    streamCleanup();
    streamCleanup = null;
  }

  streamCleanup = await clubService.openEventStream(
    (eventName, payload) => {
      if (eventName === "ready") {
        liveConnected.value = true;
        return;
      }

      if (eventName !== "club-event") return;
      if (!payload?.clubId || !selectedClubId.value) return;
      if (payload.clubId !== selectedClubId.value) return;

      showLiveToast(payload.message || "Nouvel evenement du club");

      if (payload.actorId && String(payload.actorId) !== String(myUserId.value)) {
        clubUnreadCount.value += 1;
      }

      scheduleSelectedRefresh();
    },
    () => {
      liveConnected.value = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      reconnectTimer = setTimeout(connectLiveStream, 2500);
    }
  );
};

const loadClubs = async () => {
  loadingClubs.value = true;

  await withErrorHandling(async () => {
    const { data } = await clubService.getMyClubs();
    clubs.value = data || [];

    if (!clubs.value.length) {
      selectedClubId.value = "";
      selectedClub.value = null;
      ranking.value = [];
      clubStats.value = null;
      clubNotifications.value = [];
      clubUnreadCount.value = 0;
      clubAuditLogs.value = [];
      return;
    }

    if (!selectedClubId.value || !clubs.value.some((club) => club._id === selectedClubId.value)) {
      selectedClubId.value = clubs.value[0]._id;
    }

    await Promise.all([
      loadSelectedClub(),
      loadRanking(),
      loadStats(),
      loadClubNotifications(),
      loadClubUnreadCount(),
      loadAuditLogs()
    ]);
  }, "Impossible de charger les clubs.");

  loadingClubs.value = false;
};

const selectClub = async (clubId) => {
  selectedClubId.value = clubId;
  await Promise.all([
    loadSelectedClub(),
    loadRanking(),
    loadStats(),
    loadClubNotifications(),
    loadClubUnreadCount(),
    loadAuditLogs()
  ]);
};

const loadSelectedClub = async () => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    const { data } = await clubService.getClubDetails(selectedClubId.value);
    selectedClub.value = data;
    clubUnreadCount.value = Number(data?.clubUnreadCount || 0);
  }, "Impossible de charger le club actif.");
};

const loadRanking = async () => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    const { data } = await clubService.getRanking(selectedClubId.value);
    ranking.value = data || [];
  }, "Impossible de charger le classement.");
};

const loadStats = async () => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    const { data } = await clubService.getStats(selectedClubId.value, 7);
    clubStats.value = data;
  }, "Impossible de charger les statistiques du club.");
};

const loadClubNotifications = async () => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    const { data } = await clubService.getNotifications(selectedClubId.value, { limit: 25 });
    clubNotifications.value = data || [];
  }, "Impossible de charger les notifications du club.");
};

const loadClubUnreadCount = async () => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    const { data } = await clubService.getUnreadCount(selectedClubId.value);
    clubUnreadCount.value = Number(data?.unreadCount || 0);
  }, "Impossible de charger le compteur de notifications.");
};

const markClubNotificationsRead = async () => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    await clubService.markNotificationsAsRead(selectedClubId.value);
    clubUnreadCount.value = 0;
    clubNotifications.value = clubNotifications.value.map((item) => ({ ...item, read: true }));
  }, "Impossible de marquer les notifications comme lues.");
};

const loadAuditLogs = async () => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    const { data } = await clubService.getAuditLogs(selectedClubId.value, 40);
    clubAuditLogs.value = data || [];
  }, "Impossible de charger l audit admin.");
};

const handleCreateClub = async () => {
  if (!createForm.name) return;

  savingCreate.value = true;
  await withErrorHandling(async () => {
    await clubService.createClub({ ...createForm });
    createForm.name = "";
    createForm.description = "";
    await loadClubs();
  }, "Creation du club impossible.");
  savingCreate.value = false;
};

const handleJoinClub = async () => {
  if (!joinCode.value) return;

  savingJoin.value = true;
  await withErrorHandling(async () => {
    await clubService.joinClub(joinCode.value);
    joinCode.value = "";
    await loadClubs();
  }, "Impossible de rejoindre le club.");
  savingJoin.value = false;
};

const handleCreatePost = async () => {
  if (!selectedClubId.value || !newPost.value) return;

  savingPost.value = true;
  await withErrorHandling(async () => {
    await clubService.createPost(selectedClubId.value, newPost.value);
    newPost.value = "";
    await Promise.all([
      loadSelectedClub(),
      loadRanking(),
      loadStats(),
      loadClubNotifications(),
      loadClubUnreadCount(),
      loadAuditLogs(),
      loadClubs()
    ]);
  }, "Impossible de publier ce post.");
  savingPost.value = false;
};

const toggleLike = async (post) => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    await clubService.togglePostLike(selectedClubId.value, post._id);
    await Promise.all([loadSelectedClub(), loadRanking()]);
  }, "Impossible de liker ce post.");
};

const handleCreatePoll = async () => {
  if (!selectedClubId.value || !newPoll.question.trim()) return;

  const options = newPoll.options.map((value) => value.trim()).filter(Boolean);
  if (options.length < 2) {
    globalError.value = "Un sondage a besoin d au moins 2 options.";
    return;
  }

  savingPoll.value = true;
  await withErrorHandling(async () => {
    await clubService.createPoll(selectedClubId.value, {
      question: newPoll.question,
      options
    });

    newPoll.question = "";
    newPoll.options = ["", "", "", ""];
    await Promise.all([
      loadSelectedClub(),
      loadRanking(),
      loadStats(),
      loadClubNotifications(),
      loadClubUnreadCount(),
      loadAuditLogs(),
      loadClubs()
    ]);
  }, "Creation du sondage impossible.");
  savingPoll.value = false;
};

const voteOption = async (poll, optionIndex) => {
  if (!selectedClubId.value) return;

  savingVote.value = true;
  await withErrorHandling(async () => {
    await clubService.votePoll(selectedClubId.value, poll._id, optionIndex);
    await Promise.all([
      loadSelectedClub(),
      loadRanking(),
      loadStats(),
      loadClubNotifications(),
      loadClubUnreadCount(),
      loadAuditLogs(),
      loadClubs()
    ]);
  }, "Vote impossible.");
  savingVote.value = false;
};

const changeRole = async (member, role) => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    await clubService.updateMemberRole(selectedClubId.value, member.userId, role);
    await Promise.all([
      loadSelectedClub(),
      loadRanking(),
      loadClubNotifications(),
      loadClubUnreadCount(),
      loadAuditLogs(),
      loadClubs()
    ]);
  }, "Impossible de modifier ce role.");
};

const removeMemberFromClub = async (member) => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    await clubService.removeMember(selectedClubId.value, member.userId);
    await Promise.all([
      loadSelectedClub(),
      loadRanking(),
      loadStats(),
      loadClubNotifications(),
      loadClubUnreadCount(),
      loadAuditLogs(),
      loadClubs()
    ]);
  }, "Impossible de retirer ce membre.");
};

const openOwnershipModal = (member) => {
  ownershipModal.target = member;
  ownershipModal.previousOwnerRole = "admin";
  ownershipModal.open = true;
};

const closeOwnershipModal = () => {
  ownershipModal.open = false;
  ownershipModal.target = null;
  ownershipModal.submitting = false;
};

const transferOwnershipTo = async (member) => {
  openOwnershipModal(member);
};

const confirmOwnershipTransfer = async () => {
  if (!selectedClubId.value || !ownershipModal.target) return;
  ownershipModal.submitting = true;

  await withErrorHandling(async () => {
    await clubService.transferOwnership(
      selectedClubId.value,
      ownershipModal.target.userId,
      ownershipModal.previousOwnerRole
    );

    closeOwnershipModal();

    await Promise.all([
      loadSelectedClub(),
      loadRanking(),
      loadStats(),
      loadClubNotifications(),
      loadClubUnreadCount(),
      loadAuditLogs(),
      loadClubs()
    ]);
  }, "Impossible de transferer la propriete.");

  ownershipModal.submitting = false;
};

const regenerateInvite = async () => {
  if (!selectedClubId.value) return;

  savingInvite.value = true;
  await withErrorHandling(async () => {
    await clubService.regenerateInvite(selectedClubId.value);
    await Promise.all([loadSelectedClub(), loadClubs()]);
  }, "Impossible de regenerer le code d invitation.");
  savingInvite.value = false;
};

const leaveCurrentClub = async () => {
  if (!selectedClubId.value) return;

  await withErrorHandling(async () => {
    await clubService.leaveClub(selectedClubId.value);
    await loadClubs();
  }, "Impossible de quitter ce club.");
};

const copyInviteCode = async () => {
  if (!selectedClub.value?.inviteCode) return;

  await withErrorHandling(async () => {
    await navigator.clipboard.writeText(selectedClub.value.inviteCode);
  }, "Impossible de copier le code.");
};

const voteWidth = (votes, totalVotes) => {
  if (!totalVotes) return "0%";
  return `${Math.max(8, Math.round((votes / totalVotes) * 100))}%`;
};

const describeAudit = (log) => {
  if (log.action === "role_update") {
    return `${log.actorUsername} a change le role de ${log.targetUsername} (${log.metadata?.fromRole} -> ${log.metadata?.toRole})`;
  }
  if (log.action === "member_removed") {
    return `${log.actorUsername} a retire ${log.targetUsername} du club`;
  }
  if (log.action === "ownership_transfer") {
    return `${log.actorUsername} a transfere la propriete a ${log.targetUsername}`;
  }
  return `${log.actorUsername} a effectue une action admin`;
};

const formatDate = (dateValue) => {
  try {
    return new Date(dateValue).toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "-";
  }
};

onMounted(async () => {
  await auth.fetchMe();
  await loadClubs();
  await connectLiveStream();
});

onUnmounted(() => {
  if (streamCleanup) streamCleanup();
  if (reconnectTimer) clearTimeout(reconnectTimer);
  if (clearLiveToastTimer) clearTimeout(clearLiveToastTimer);
  if (refreshTimer) clearTimeout(refreshTimer);
});
</script>

<style scoped>
.clubs-page {
  animation: reveal 500ms ease both;
}

.hero-panel {
  position: relative;
  background:
    linear-gradient(120deg, rgba(0, 168, 255, 0.18), rgba(13, 26, 50, 0.75)),
    radial-gradient(circle at 12% 18%, rgba(255, 255, 255, 0.12), transparent 42%),
    #0b1220;
}

.hero-glow {
  position: absolute;
  border-radius: 999px;
  filter: blur(40px);
  opacity: 0.75;
}

.hero-glow-a {
  width: 180px;
  height: 180px;
  right: 6%;
  top: 4%;
  background: rgba(0, 168, 255, 0.45);
}

.hero-glow-b {
  width: 120px;
  height: 120px;
  right: 30%;
  bottom: -15%;
  background: rgba(56, 189, 248, 0.35);
}

.live-toast {
  position: fixed;
  right: 1rem;
  top: 6rem;
  z-index: 70;
  min-width: 220px;
  border: 1px solid rgba(34, 211, 238, 0.5);
  border-radius: 0.9rem;
  background: rgba(9, 21, 38, 0.92);
  padding: 0.75rem 0.9rem;
  box-shadow: 0 14px 30px rgba(34, 211, 238, 0.18);
}

.live-pop-enter-active,
.live-pop-leave-active {
  transition: all 220ms ease;
}

.live-pop-enter-from,
.live-pop-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.live-state {
  border-radius: 999px;
  border: 1px solid transparent;
  padding: 0.35rem 0.65rem;
  font-size: 0.72rem;
  font-weight: 700;
}

.live-state-ok {
  border-color: rgba(34, 197, 94, 0.35);
  background: rgba(34, 197, 94, 0.12);
  color: #86efac;
}

.live-state-warn {
  border-color: rgba(250, 204, 21, 0.35);
  background: rgba(250, 204, 21, 0.12);
  color: #fde68a;
}

.panel-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background:
    linear-gradient(160deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01)),
    rgba(6, 10, 18, 0.76);
  backdrop-filter: blur(10px);
}

.stat-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.9rem;
  padding: 0.8rem;
  background: rgba(0, 0, 0, 0.28);
}

.input-base {
  width: 100%;
  border-radius: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.28);
  padding: 0.65rem 0.85rem;
  font-size: 0.875rem;
  color: var(--watchly-text-primary);
  outline: none;
  transition: border-color 180ms ease, box-shadow 180ms ease;
}

.input-base:focus {
  border-color: rgba(0, 168, 255, 0.85);
  box-shadow: 0 0 0 3px rgba(0, 168, 255, 0.15);
}

.btn-solid,
.btn-ghost,
.btn-danger,
.btn-like {
  border-radius: 0.8rem;
  padding: 0.55rem 0.9rem;
  font-size: 0.82rem;
  font-weight: 700;
  transition: transform 180ms ease, filter 180ms ease, background-color 180ms ease;
}

.btn-solid {
  background: linear-gradient(120deg, #16a4ea, #55d3ff);
  color: #041320;
}

.btn-solid:hover,
.btn-ghost:hover,
.btn-danger:hover,
.btn-like:hover {
  transform: translateY(-1px);
  filter: brightness(1.07);
}

.btn-ghost {
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.05);
  color: var(--watchly-text-primary);
}

.btn-danger {
  border: 1px solid rgba(239, 68, 68, 0.4);
  background: rgba(239, 68, 68, 0.18);
  color: #fecaca;
}

.club-chip {
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 0.8rem;
  text-align: left;
  padding: 0.65rem 0.75rem;
  background: rgba(255, 255, 255, 0.03);
  transition: border-color 200ms ease, transform 200ms ease, background-color 200ms ease;
}

.club-chip:hover {
  transform: translateX(2px);
  border-color: rgba(0, 168, 255, 0.65);
}

.club-chip-active {
  border-color: rgba(0, 168, 255, 0.8);
  background: rgba(0, 168, 255, 0.15);
}

.post-card {
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.24);
}

.btn-like {
  border: 1px solid rgba(255, 255, 255, 0.17);
  background: rgba(255, 255, 255, 0.05);
}

.btn-like-active {
  border-color: rgba(0, 168, 255, 0.7);
  background: rgba(0, 168, 255, 0.2);
}

.vote-option {
  position: relative;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 0.75rem;
  background: rgba(255, 255, 255, 0.04);
  padding: 0.5rem 0.7rem;
}

.vote-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, rgba(22, 164, 234, 0.58), rgba(85, 211, 255, 0.22));
  transition: width 250ms ease;
}

.rank-row,
.member-row,
.contrib-row,
.audit-row,
.notif-row {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.22);
  padding: 0.5rem;
}

.notif-row-unread {
  border-color: rgba(0, 168, 255, 0.65);
  background: rgba(0, 168, 255, 0.14);
}

.rank-row-top {
  border-color: rgba(56, 189, 248, 0.7);
  box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.2);
}

.stats-mini {
  border-radius: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.2);
  padding: 0.5rem;
}

.stats-mini .label {
  font-size: 0.68rem;
  color: var(--watchly-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.stats-mini .value {
  margin-top: 0.2rem;
  font-size: 1.05rem;
  font-weight: 800;
}

.activity-cell {
  border-radius: 0.65rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.2);
  padding: 0.35rem;
  text-align: center;
}

.club-stagger-enter-active,
.post-stagger-enter-active,
.poll-stagger-enter-active,
.rank-stagger-enter-active {
  transition: all 260ms ease;
}

.club-stagger-enter-from,
.post-stagger-enter-from,
.poll-stagger-enter-from,
.rank-stagger-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 90;
  background: rgba(2, 6, 13, 0.72);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.modal-card {
  width: min(520px, 100%);
  border-radius: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: linear-gradient(155deg, rgba(16, 33, 53, 0.96), rgba(8, 16, 29, 0.94));
  padding: 1rem;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 180ms ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .hero-panel {
    border-radius: 1.2rem;
  }

  .live-toast {
    left: 1rem;
    right: 1rem;
    top: 5.4rem;
    min-width: 0;
  }
}
</style>
