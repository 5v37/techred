import { reactive, watch } from "vue";
import { isMac } from "@/modules/utils";
import { saveSettingsError } from "@/modules/notifications";

type SelectOption<T> = {
	key: T,
	name: string
};

type Setting<T extends string | number | boolean> = {
	default: T,
	options?: T[] | SelectOption<T>[],
	reaction?: (newValue: T) => void
};

type Settings = { [K in keyof UserSettingsSchema]: UserSettingsSchema[K] extends Setting<infer T> ? T : never };

type ColorMode = "Auto" | "Light" | "Dark";

type UserSettingsSchema = {
	colorMode: Setting<ColorMode>,
	uiFontSize: Setting<number>,
	textFont: Setting<string>,
	textFontSize: Setting<number>,
	highlightEmphasis: Setting<boolean>,
	spellCheck: Setting<boolean>
};

const hasLocalStorage = typeof localStorage !== "undefined";
const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

const basePx = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
const ptScale = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72];

const userSettingsKey = "t-user-settings";
const userSettingsSchema: UserSettingsSchema = {
	colorMode: {
		default: "Auto",
		options: [
			{ name: "Системная", key: "Auto" },
			{ name: "Светлая", key: "Light" },
			{ name: "Тёмная", key: "Dark" }
		],
		reaction: setColorMode
	},
	uiFontSize: {
		default: closestValue(basePx * 0.875, [12, 14, 16, 18]),
		options: [
			{ name: "Компактный", key: 12 },
			{ name: "Умеренный", key: 14 },
			{ name: "Просторный", key: 16 },
			{ name: "Крупный", key: 18 }
		],
		reaction: (newValue) => document.documentElement.style.setProperty("--t-ui-font-size", `${newValue}px`)
	},
	textFont: {
		default: "PT Serif",
		options: !isMac() ?
			["Arial", "Comic Sans MS", "Courier New", "Georgia", "Impact", "Lucida Console", "Lucida Sans Unicode",
				"Palatino Linotype", "MS Sans Serif", "MS Serif", "PT Serif", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana"] :
			["Arial", "Comic Sans MS", "Courier New", "Geneva", "Georgia", "Charcoal", "Monaco", "Lucida Grande",
				"Palatino", "PT Serif", "New York", "Times", "Trebuchet MS", "Verdana"],
		reaction: (newValue) => document.documentElement.style.setProperty("--t-text-font", `${newValue}`)
	},
	textFontSize: {
		default: closestValue(basePx / 1.333, ptScale),
		options: ptScale,
		reaction: (newValue) => document.documentElement.style.setProperty("--t-text-font-size", `${newValue}pt`)
	},
	highlightEmphasis: {
		default: true
	},
	spellCheck: {
		default: false
	}
} as const;

const userSettings = reactive(createUserSettings());
for (const key in userSettingsSchema) {
	const reaction = userSettingsSchema[key as keyof UserSettingsSchema].reaction;
	if (reaction) {
		watch(
			() => userSettings[key as keyof UserSettingsSchema],
			(value) => (reaction as (newValue: typeof value) => void)(value),
			{ immediate: true }
		);
	};
};

let isUpdateUserSettings = false;
if (hasLocalStorage) {
	watch(userSettings, () => {
		if (isUpdateUserSettings) {
			isUpdateUserSettings = false;
			return;
		};
		saveUserSettings();
	});
	addEventListener("storage", updateUserSettings);
};

function createUserSettings(): Settings {
	const stored = hasLocalStorage && localStorage.getItem(userSettingsKey);
	let parsed = undefined;
	if (stored) {
		try { parsed = JSON.parse(stored) } catch { /* empty */ }
	};

	const settings = Object.create(null);
	for (const key in userSettingsSchema) {
		const defaultValue = userSettingsSchema[key as keyof UserSettingsSchema].default;
		settings[key] = defaultValue;

		if (typeof parsed === "object" && typeof parsed[key] === typeof defaultValue) {
			const storedValue = parsed[key] as typeof defaultValue;
			const options = userSettingsSchema[key as keyof UserSettingsSchema].options;
			if (options) {
				if (options.some(option =>
					typeof option === "object" && "key" in option
						? option.key === storedValue
						: option === storedValue)) {
					settings[key] = storedValue;
				};
			} else {
				settings[key] = storedValue;
			};
		};
	};
	return settings;
}

function saveUserSettings() {
	try {
		localStorage.setItem(userSettingsKey, JSON.stringify(userSettings));
	} catch (error) {
		saveSettingsError(error);
	};
}

function updateUserSettings() {
	isUpdateUserSettings = true;
	Object.assign(userSettings, createUserSettings());
}

function resetUserSettings() {
	if (hasLocalStorage) {
		localStorage.removeItem(userSettingsKey);
	};
	updateUserSettings();
}

function closestValue(value: number, options: Array<number>) {
	return options.reduce((prev, curr) =>
		Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
	);
}

function setColorMode(newValue: ColorMode) {
	if (newValue === "Auto") {
		applyColorMode(darkModeMediaQuery.matches);
		darkModeMediaQuery.onchange = (mql: MediaQueryList | MediaQueryListEvent) => applyColorMode(mql.matches);
	} else {
		darkModeMediaQuery.onchange = null;
		applyColorMode(newValue === "Dark");
	};
}

function applyColorMode(dark: boolean) {
	const element = document.querySelector("html") as HTMLElement;
	if (dark) {
		element.classList.add("my-app-dark");
	} else {
		element.classList.remove("my-app-dark");
	};
}

// удаление старых настроек
if (hasLocalStorage) {
	["color-mode", "font", "font-size", "highlight-emphasis", "spell-check"].forEach(key => localStorage.removeItem(key));
};

export { userSettings, userSettingsSchema, resetUserSettings };