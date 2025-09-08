<template>
    <Toast />

    <MainToolbar @loaded="loaded = true" />
    <ProsemirrorAdapterProvider>
        <Splitter v-if="loaded" layout="horizontal" class="t-app-main">
            <SplitterPanel :size="15" :minSize="10" class="t-ui-container">
                <Sidebar @switch="current = $event" />
            </SplitterPanel>
            <SplitterPanel :size="85" style="display: flex;">
                <Description v-show="current === 'description'" />
                <Content v-show="current === 'content'" />
                <Images v-show="current === 'images'" />
            </SplitterPanel>
        </Splitter>
    </ProsemirrorAdapterProvider>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { SplitterPanel, Splitter, Toast } from 'primevue';
import { ProsemirrorAdapterProvider } from '@prosemirror-adapter/vue';

import MainToolbar from './components/MainToolbar.vue';
import Sidebar from './components/Sidebar.vue';
import Description from "./components/Description.vue";
import Content from './components/Content.vue';
import Images from './components/Images.vue';
import { initNotification } from './notification';

const loaded = ref(false);
const current = ref("");
initNotification();
</script>

<style>
.t-app-main {
    flex: 1 1 0;
    overflow: hidden;
    border-radius: 0px;
}
</style>