import { createApp } from "vue";
import App from "./App.vue";

import PrimeVue from 'primevue/config';
import Tooltip from 'primevue/tooltip';
import { ToastService } from "primevue";

import './assets/main.css'
import { Noir } from "./assets/preset";
import { ruLocale } from "./assets/locale";

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Noir,
        options: {
            darkModeSelector: '.my-app-dark',
        }
    },
    locale: ruLocale
});
app.use(ToastService);
app.directive('tooltip', Tooltip);
app.mount("#app");