import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router from "./router";
import "./styles/main.css";

const savedTheme = localStorage.getItem("watchly_theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.mount("#app");
