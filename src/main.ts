import { createApp } from "vue";
import App from "@/App.vue";

import PrimeVue from 'primevue/config';
import { ToastService, Tooltip, KeyFilter } from "primevue";
import { ru } from "primelocale/js/ru.js";

import '@/assets/main.css'
import { Noir } from "@/assets/preset";

const app = createApp(App);
app.use(PrimeVue, {
    theme: {
        preset: Noir,
        options: {
            darkModeSelector: '.my-app-dark',
        }
    },
    locale: ru
});
app.use(ToastService);
app.directive('tooltip', Tooltip);
app.directive('keyfilter', KeyFilter);
app.mount("#app");