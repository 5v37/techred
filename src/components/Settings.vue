<template>
	<Drawer v-model:visible="visibleSettings" header="Настройки" position="right">
		<div class="t-settings-container">
			<div class="t-setting-element">
				<label>Цветовая схема</label>
				<Select v-model="selectedMode" :options="colorModes" optionLabel="name" option-value="key"
					@change="changeColorMode" />
			</div>
			<div class="t-setting-element">
				<label>Шрифт</label>
				<Select v-model="selectedFont" :options="fonts" checkmark @change="changeFont" />
			</div>
			<div class="t-setting-element">
				<label>Размер шрифта</label>
				<Select v-model="selectedSize" :options="fontSizes" checkmark @change="changeFontSize" />
			</div>
			<div class="t-setting-element">
				<label>Выделение границ курсива</label>
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

import { Drawer, Button, Select, ToggleSwitch } from 'primevue';

import editorState from '@/modules/editorState';
import { saveSettingsError } from '@/modules/notifications';
import { isMac } from '@/modules/utils';

const visibleSettings = ref(false);

const selectedMode = ref("Auto");
const colorModes = [
	{ name: "Системная", key: "Auto" },
	{ name: "Светлая", key: "Light" },
	{ name: "Тёмная", key: "Dark" },
];
const colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');

const selectedFont = ref("PT Serif");
let fonts = !isMac() ?
	["Arial", "Comic Sans MS", "Courier New", "Georgia", "Impact", "Lucida Console", "Lucida Sans Unicode",
		"Palatino Linotype", "MS Sans Serif", "MS Serif", "PT Serif", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana"] :
	["Arial", "Comic Sans MS", "Courier New", "Geneva", "Georgia", "Charcoal", "Monaco", "Lucida Grande",
		"Palatino", "PT Serif", "New York", "Times", "Trebuchet MS", "Verdana"];

const selectedSize = ref(12);
const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const hasLocalStorage = localStorage !== undefined;
getSettings();
addEventListener("storage", () => { getSettings() });

function getSettings() {
	if (hasLocalStorage) {
		let localValue = localStorage.getItem("color-mode");
		selectedMode.value = colorModes.find(mode => mode.key === localValue)?.key || "Auto";

		localValue = localStorage.getItem("font");
		selectedFont.value = fonts.find(font => font === localValue) || "PT Serif";

		localValue = localStorage.getItem("font-size");
		selectedSize.value = fontSizes.find(size => size === Number(localValue)) || 12;

		editorState.highlightEmphasisOn.value = !(localStorage.getItem("highlight-emphasis") === "false");
		editorState.spellCheckOn.value = localStorage.getItem("spell-check") === "true" || false;
	};
	setColorMode();
	setFont();
	setFontSize();
}

function changeColorMode() {
	saveToStorage("color-mode", selectedMode.value);
	setColorMode();
}

function changeFont() {
	saveToStorage("font", selectedFont.value);
	setFont();
}

function changeFontSize() {
	saveToStorage("font-size", selectedSize.value);
	setFontSize();
}

function changeHighlightEmphasis() {
	saveToStorage("highlight-emphasis", editorState.highlightEmphasisOn.value);
}

function changeSpellCheck() {
	saveToStorage("spell-check", editorState.spellCheckOn.value);
}

function saveToStorage(key: string, value: any) {
	if (!hasLocalStorage) {
		return;
	};
	try {
		localStorage.setItem(key, String(value));
	} catch (error) {
		saveSettingsError(error)
	};
}

function resetSettings() {
	["color-mode", "font", "font-size", "highlight-emphasis", "spell-check"].forEach(key => localStorage.removeItem(key));
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

function setFont() {
	document.documentElement.style.setProperty('--t-content-font', `${selectedFont.value}`);
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