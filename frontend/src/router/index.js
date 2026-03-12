import { createRouter, createWebHistory } from "vue-router";

import HomePage from "../pages/HomePage.vue";
import MoviesPage from "../pages/MoviesPage.vue";
import SeriesPage from "../pages/SeriesPage.vue";
import DiscoverPage from "../pages/DiscoverPage.vue";
import WatchlistPage from "../pages/WatchlistPage.vue";
import ProfilePage from "../pages/ProfilePage.vue";
import ProfileDetailPage from "../pages/ProfileDetailPage.vue";
import SettingsPage from "../pages/SettingsPage.vue";
import MovieDetailsPage from "../pages/MovieDetailsPage.vue";
import ActivityFeedPage from "../pages/ActivityFeedPage.vue";
import LoginPage from "../pages/LoginPage.vue";
import RegisterPage from "../pages/RegisterPage.vue";
import MovieNightPage from "../pages/MovieNightPage.vue";
import PlanningPage from "../pages/PlanningPage.vue";
import CollaborativeListsPage from "../pages/CollaborativeListsPage.vue";
import StatisticsPage from "../pages/StatisticsPage.vue";
import LeaderboardPage from "../pages/LeaderboardPage.vue";
import FriendsPage from "../pages/FriendsPage.vue";
import ClubsPage from "../pages/ClubsPage.vue";

const routes = [
  { path: "/login", name: "login", component: LoginPage, meta: { public: true, hideNavbar: true } },
  { path: "/register", name: "register", component: RegisterPage, meta: { public: true, hideNavbar: true } },
  { path: "/", name: "home", component: HomePage },
  { path: "/movies", name: "movies", component: MoviesPage },
  { path: "/series", name: "series", component: SeriesPage },
  { path: "/discover", name: "discover", component: DiscoverPage },
  { path: "/my-list", name: "my-list", component: WatchlistPage },
  { path: "/friends", name: "friends", component: FriendsPage },
  { path: "/clubs", name: "clubs", component: ClubsPage },
  { path: "/profile", name: "profile", component: ProfilePage },
  { path: "/profile/:id", name: "profile-detail", component: ProfileDetailPage },
  { path: "/settings", name: "settings", component: SettingsPage },
  { path: "/activity", name: "activity", component: ActivityFeedPage },
  { path: "/movie-night", name: "movie-night", component: MovieNightPage },
  { path: "/planning", name: "planning", component: PlanningPage },
  { path: "/collab-lists", name: "collab-lists", component: CollaborativeListsPage },
  { path: "/statistics", name: "statistics", component: StatisticsPage },
  { path: "/leaderboard", name: "leaderboard", component: LeaderboardPage },
  { path: "/movie/:id", name: "movie-details", component: MovieDetailsPage }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 };
  }
});

router.beforeEach((to) => {
  const token = localStorage.getItem("watchly_token");
  const isPublic = Boolean(to.meta.public);

  if (!token && !isPublic) {
    return { name: "register", query: { redirect: to.fullPath } };
  }

  if (token && isPublic) {
    const redirect = typeof to.query.redirect === "string" ? to.query.redirect : "/";
    return redirect;
  }

  return true;
});

export default router;
