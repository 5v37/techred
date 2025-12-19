<template>
	<Drawer v-model:visible="visibleSettings" header="Настройки" position="right">
		<div class="t-settings-container">
			<div class="t-setting-element">
				<label>Цветовая схема</label>
				<Select v-model="userSettings.colorMode" :options="userSettingsSchema.colorMode.options"
					optionLabel="name" option-value="key" />
			</div>
			<div class="t-setting-element">
				<label>Масштаб интерфейса</label>
				<Select v-model="userSettings.uiFontSize" :options="userSettingsSchema.uiFontSize.options"
					optionLabel="name" option-value="key" />
			</div>
			<div class="t-setting-element">
				<label>Шрифт текста</label>
				<Select v-model="userSettings.textFont" :options="userSettingsSchema.textFont.options" checkmark />
			</div>
			<div class="t-setting-element">
				<label>Размер шрифта текста</label>
				<Select v-model="userSettings.textFontSize" :options="userSettingsSchema.textFontSize.options"
					checkmark />
			</div>
			<div class="t-setting-element">
				<label>Выделение границ курсива</label>
				<ToggleSwitch v-model="userSettings.highlightEmphasis" />
			</div>
			<div class="t-setting-element">
				<label>Проверка орфографии</label>
				<ToggleSwitch v-model="userSettings.spellCheck" />
			</div>
		</div>
		<template #footer>
			<div class="t-setting-reset">
				<Button type="button" @click="resetUserSettings">Сбросить настройки</Button>
			</div>
		</template>
	</Drawer>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Drawer, Button, Select, ToggleSwitch } from "primevue";
import { userSettings, userSettingsSchema, resetUserSettings } from "@/modules/settingsManager";

const visibleSettings = ref(false);

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

.t-setting-reset {
	display: flex;
	justify-content: center;
}
</style>