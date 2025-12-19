import { reactive, watch } from "vue";
import { isMac } from "@/modules/utils";
import { saveSettingsError } from "@/modules/notifications";

type ColorMode = "Auto" | "Light" | "Dark";

interface SelectOption<T> {
	key: T,
	name: string
}

type Setting<T extends string | number | boolean> = {
	default: T,
	options?: T[] | SelectOption<T>[],
	reaction?: (newValue: T) => void
}

type UserSettingsSchema = {
	colorMode: Setting<ColorMode>,
	font: Setting<string>,
	fontSize: Setting<number>,
	highlightEmphasis: Setting<boolean>,
	spellCheck: Setting<boolean>
}

type Settings = { [K in keyof UserSettingsSchema]: UserSettingsSchema[K] extends Setting<infer T> ? T : never };

const STORAGE_KEY = "t-user-settings" as const;
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
	font: {
		default: "PT Serif",
		options: !isMac() ?
			["Arial", "Comic Sans MS", "Courier New", "Georgia", "Impact", "Lucida Console", "Lucida Sans Unicode",
				"Palatino Linotype", "MS Sans Serif", "MS Serif", "PT Serif", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana"] :
			["Arial", "Comic Sans MS", "Courier New", "Geneva", "Georgia", "Charcoal", "Monaco", "Lucida Grande",
				"Palatino", "PT Serif", "New York", "Times", "Trebuchet MS", "Verdana"],
		reaction: (newValue) => document.documentElement.style.setProperty("--t-content-font", `${newValue}`)
	},
	fontSize: {
		default: 12,
		options: [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 72],
		reaction: (newValue) => document.documentElement.style.setProperty("--t-content-font-size", `${newValue}pt`)
	},
	highlightEmphasis: {
		default: true
	},
	spellCheck: {
		default: false
	}
} as const;

const hasLocalStorage = typeof localStorage !== "undefined";
const darkModeMediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
const userSettings = reactive(createSettings(userSettingsSchema));

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
if (hasLocalStorage) {
	watch(userSettings, () => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(userSettings));
		} catch (error) {
			saveSettingsError(error)
		};
	});
};
addEventListener("storage", () => Object.assign(userSettings, createSettings(userSettingsSchema)));

function createSettings(schema: UserSettingsSchema, reset = false): Settings {
	const stored = !reset && hasLocalStorage && localStorage.getItem(STORAGE_KEY);
	let parsed = undefined;
	if (stored) {
		try { parsed = JSON.parse(stored) } catch { /* empty */ }
	};

	const settings = Object.create(null);
	for (const key in schema) {
		const defaultValue = schema[key as keyof UserSettingsSchema].default;
		settings[key] = defaultValue;

		if (typeof parsed === "object" && typeof parsed[key] === typeof defaultValue) {
			const storedValue = parsed[key] as typeof defaultValue;
			const options = schema[key as keyof UserSettingsSchema].options;
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

function resetUserSettings() {
	Object.assign(userSettings, createSettings(userSettingsSchema, true))
}

function setColorMode(newValue: ColorMode) {
	if (newValue === "Auto") {
		applyColorMode(darkModeMediaQuery.matches);
		darkModeMediaQuery.onchange = (mql: MediaQueryList | MediaQueryListEvent) => applyColorMode(mql.matches)
	} else {
		darkModeMediaQuery.onchange = null;
		applyColorMode(newValue === "Dark");
	};
}

function applyColorMode(dark: boolean) {
	const element = document.querySelector("html") as HTMLElement;
	if (dark) {
		element.classList.add("my-app-dark")
	} else {
		element.classList.remove("my-app-dark");
	};
}

export { userSettings, userSettingsSchema, resetUserSettings }