<template>
	<Drawer v-model:visible="visibleSettings" header="Настройки" position="right">
		<div class="t-settings-container">
			<div class="t-setting-element">
				<label>Цветовая схема</label>
				<Select v-model="selectedMode" :options="colorModes" optionLabel="name" option-value="key"
					@change="changeColorMode" />
			</div>
			<div class="t-setting-element">
				<label>Размер шрифта</label>
				<Select v-model="selectedSize" :options="fontSizes" checkmark @change="changeFontSize" />
			</div>
			<div class="t-setting-element">
				<label>Выделять курсив</label>
				<ToggleSwitch v-model="editorState.highlightEmphasisOn.value" @change="changeHighlightEmphasis" />
			</div>
			<div class="t-setting-element">
				<label>Проверка орфографии</label>
				<ToggleSwitch v-model="editorState.spellCheckOn.value" @change="changeSpellCheck" />
			</div>
		</div>
		<template #footer>
			<div v-if="hasLocalStorage" style="display: flex; justify-content: center;">
				<Button type="button" @click="resetSettings">Сбросить настройки</Button>
			</div>
		</template>
	</Drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue';

import { Drawer, Button, Select, ToggleSwitch, useToast } from 'primevue';

import editorState from '../editorState';

const visibleSettings = ref(false);
const toast = useToast();

const colorModes = [
	{ name: "Системная", key: "Auto" },
	{ name: "Светлая", key: "Light" },
	{ name: "Тёмная", key: "Dark" },
];
const selectedMode = ref(colorModes[0].key);
const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

const selectedSize = ref(12);
const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const hasLocalStorage = localStorage != undefined;
getSettings();
addEventListener("storage", () => { getSettings() });

function getSettings() {
	if (hasLocalStorage) {
		let localValue = localStorage.getItem("color-mode");
		selectedMode.value = colorModes.find(mode => mode.key === localValue)?.key || "Auto";

		localValue = localStorage.getItem("font-size");
		selectedSize.value = fontSizes.find(size => size === Number(localValue)) || 12;

		editorState.highlightEmphasisOn.value = !(localStorage.getItem("highlight-emphasis") === "false");
		editorState.spellCheckOn.value = localStorage.getItem("spell-check") === "true" || false;
	};
	setColorMode();
	setFontSize();
}

function changeColorMode() {
	saveToStorage("color-mode", selectedMode.value);
	setColorMode();
}

function changeHighlightEmphasis() {
	saveToStorage("highlight-emphasis", editorState.highlightEmphasisOn.value);
}

function changeSpellCheck() {
	saveToStorage("spell-check", editorState.spellCheckOn.value);
}

function changeFontSize() {
	saveToStorage("font-size", selectedSize.value);
	setFontSize();
}

function saveToStorage(key: string, value: any) {
	if (!hasLocalStorage) {
		return;
	};
	try {
		localStorage.setItem(key, String(value));
	} catch (error) {
		toast.add({ severity: 'error', summary: 'Ошибка сохранения настроек', detail: error });
	};
}

function resetSettings() {
	["color-mode", "highlight-emphasis", "spell-check"].forEach(key => localStorage.removeItem(key));
	getSettings();
}

function setColorMode() {
	if (selectedMode.value === "Auto") {
		handleColorSchemeChange(colorSchemeQuery);
		colorSchemeQuery.addEventListener("change", handleColorSchemeChange);
	} else {
		colorSchemeQuery.removeEventListener("change", handleColorSchemeChange);
		toggleColorMode(selectedMode.value === "Dark");
	};
}

function setFontSize() {
	document.documentElement.style.setProperty('--t-content-font-size', `${selectedSize.value}pt`);
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