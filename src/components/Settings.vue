<template>
	<Drawer v-model:visible="visibleSettings" header="Настройки" position="right">
		<div class="t-settings-container">
			<div class="t-setting-element">
				<label>Цветовая схема</label>
				<Select v-model="selectedMode" :options="colorModes" optionLabel="name" option-value="key"
					@change="changeMode" />
			</div>
			<div class="t-setting-element">
				<label>Выделять курсив</label>
				<ToggleSwitch v-model="editorState.highlightEmphasisOn.value" />
			</div>
			<div class="t-setting-element">
				<label>Проверка орфографии</label>
				<ToggleSwitch v-model="editorState.spellCheckOn.value" />
			</div>
		</div>
	</Drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { Drawer, Select, ToggleSwitch } from 'primevue';

import editorState from '../editorState';

const visibleSettings = ref(false);

const colorModes = ref([
	{ name: "Системная", key: "Auto" },
	{ name: "Светлая", key: "Light" },
	{ name: "Тёмная", key: "Dark" },
]);
const selectedMode = ref(colorModes.value[0].key);
const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
changeMode();

function changeMode() {
	if (selectedMode.value === "Auto") {
		handleColorSchemeChange(colorSchemeQuery);
		colorSchemeQuery.addEventListener("change", handleColorSchemeChange);
	} else {
		colorSchemeQuery.removeEventListener("change", handleColorSchemeChange);
		toggleColorMode(selectedMode.value === "Dark");
	};
}

function handleColorSchemeChange(mql: MediaQueryList | MediaQueryListEvent) {
	toggleColorMode(mql.matches);
}

function toggleColorMode(dark: boolean) {
	const element = document.querySelector('html') as HTMLElement;
	if (dark) {
		element.classList.add("my-app-dark")
	} else {
		element.classList.remove("my-app-dark");
	};
}

function show() {
	visibleSettings.value = true;
}

defineExpose({ show });
</script>

<style>
.t-settings-container {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.t-setting-element {
	display: flex;
	align-items: center;
	justify-content: space-between;
	min-height: 2.5rem;
}
</style>