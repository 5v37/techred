<template>
    <Toast />

    <MainToolbar v-show="loaded" @loaded="loaded = true" />
    <Splitter v-show="loaded" :initialRatio="15" direction="vertical" class="t-app-main">
        <template #main>
            <div class="t-app-pane">
                <Sidebar @switch="current = $event" />
            </div>
        </template>
        <template #extra>
            <div class="t-app-pane">
                <Description v-show="current === 'description'" />
                <Content v-show="current === 'content'" />
                <Images v-show="current === 'images'" />
            </div>
        </template>
    </Splitter>

    <IdInputDialog />
    <ImageEditDialog />
    <LinkEditorDialog />
</template>

<script setup lang="ts">
import { ref } from 'vue'

import { Toast } from 'primevue';

import MainToolbar from '@/components/MainToolbar.vue';
import Splitter from '@/components/Splitter.vue';
import Sidebar from '@/components/Sidebar.vue';
import Description from "@/components/Description.vue";
import Content from '@/components/Content.vue';
import Images from '@/components/Images.vue';
import IdInputDialog from '@/components/IdInputDialog.vue';
import ImageEditDialog from './components/ImageEditDialog.vue';
import LinkEditorDialog from '@/components/LinkEditorDialog.vue';
import { initNotification } from '@/modules/notifications';

const loaded = ref(false);
const current = ref("");
initNotification();
</script>

<style>
.t-app-main {
    border: 1px solid var(--p-content-border-color);
    border-top-width: 3px;
}

.t-app-pane {
    height: 100%;
    display: flex;
}
</style>