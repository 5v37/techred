import { ToastServiceMethods, useToast } from "primevue";

const infoLife = 3000;
const warnLife = 7000;

let toast: ToastServiceMethods;

export const initNotification = () => {
	toast = useToast();
};

export function openFileError(error: unknown) {
	toast.add({ severity: "error", summary: "Ошибка открытия файла", detail: error });
}

export function saveFileError(error: unknown) {
	toast.add({ severity: "error", summary: "Ошибка сохранения файла", detail: error });
}

export function saveSettingsError(error: unknown) {
	toast.add({ severity: "error", summary: "Ошибка сохранения настроек", detail: error });
}

export function UnexpectedError(event: ErrorEvent) {
	toast.add({ severity: "error", summary: "Непредвиденная ошибка", detail: event.message });
}

export function saveFileInfo() {
	toast.add({ severity: "info", summary: "Файл успешно сохранён", life: infoLife });
}

export function missingGenre(badMark: string) {
	toast.add({ severity: "warn", summary: "Неизвестный жанр", detail: badMark, life: warnLife });
}

export function missingLang(badCode: string) {
	toast.add({ severity: "warn", summary: "Неизвестный язык", detail: badCode, life: warnLife });
}

export function invalidId(originalId: string, newId: string) {
	toast.add({ severity: "warn", summary: "Недопустимый идентификатор", detail: `"${originalId}" заменён на "${newId}"`, life: warnLife });
}