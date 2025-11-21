<template>
    <div>
        <InputGroup>
            <InputText v-model.trim="dateString" />
            <InputGroupAddon>
                <Button severity="secondary" text @click="toggleModePicker"
                    style="padding-block: calc(var(--p-button-padding-y) - 1px);">
                    <span style="min-width: 1rem;">{{ dateMode.shortLabel }}</span>
                </Button>
            </InputGroupAddon>
            <DatePicker v-model="date" showIcon iconDisplay="input" :view="dateMode.view" date-format="yy-mm-dd" />
        </InputGroup>

        <Popover ref="modePicker">
            <SelectButton v-model="dateMode" :options="dateModes" optionLabel="label" severity="secondary"
                :allow-empty="false" @value-change="toggleModePicker" />
        </Popover>
    </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from "vue";
import { InputText, InputGroup, InputGroupAddon, DatePicker, Popover, Button, SelectButton } from "primevue";

const dateString = defineModel<string>("date");
const dateISO = defineModel<string>("dateValue");
const date = ref<Date | undefined>(!dateISO.value ? undefined : stringToDate(dateISO.value));

interface DateMode {
    label: string,
    shortLabel: string,
    view: "year" | "month" | "date",
    dateFormat: Intl.DateTimeFormatOptions
};
const dateModes: DateMode[] = [
    {
        label: "Год",
        shortLabel: "Г",
        view: "year",
        dateFormat: {
            year: "numeric"
        }
    },
    {
        label: "Месяц",
        shortLabel: "М",
        view: "month",
        dateFormat: {
            year: "numeric",
            month: "long"
        }
    },
    {
        label: "Число",
        shortLabel: "Ч",
        view: "date",
        dateFormat: {
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    }
];
const dateMode = ref<DateMode>(dateModes[dateString.value && dateString.value.length > 4 ? 2 : 0]);
const modePicker = useTemplateRef<InstanceType<typeof Popover>>("modePicker");

watch(dateISO, (newDateISO, oldDateISO) => {
    if (!newDateISO) {
        date.value = undefined;
    } else if (newDateISO !== oldDateISO) {
        const newDate = stringToDate(newDateISO);
        if (newDate.getTime() !== date.value?.getTime()) {
            date.value = newDate;
        }
    }
});
watch(date, (newDate) => {
    if (newDate) {
        const newDateISO = new Date(newDate.getTime() - timezoneOffset(newDate)).toISOString().slice(0, 10);
        if (newDateISO !== dateISO.value) {
            dateISO.value = newDateISO;
            const str = newDate.toLocaleDateString("ru", dateMode.value.dateFormat);
            dateString.value = str.charAt(0).toUpperCase() + str.slice(1, str.endsWith(" г.") ? -3 : undefined);
        };
    } else {
        dateISO.value = "";
    };
});

function stringToDate(dateByString: string) {
    const newDate = new Date(dateByString);
    return new Date(newDate.getTime() + timezoneOffset(newDate));
}

function timezoneOffset(date: Date) {
    return date.getTimezoneOffset() * 60000;
}

function toggleModePicker(event: Event) {
    modePicker.value?.toggle(event);
}
</script>