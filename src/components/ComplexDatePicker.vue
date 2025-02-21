<template>
    <div>
        <InputGroup>
            <InputText id="date" v-model.lazy="dateString" />
            <InputGroupAddon>
                <Button :label="dateMode.shortLabel" severity="secondary" variant="text" @click="showModesSelector"
                    style="line-height: 1;"></Button>
            </InputGroupAddon>
            <DatePicker v-model="date" showIcon iconDisplay="input" :view="dateMode.view" date-format="yy-mm-dd" />
        </InputGroup>

        <Popover ref="selectDateMode">
            <SelectButton v-model="dateMode" :options="dateModes" optionLabel="label" severity="secondary"
                @value-change="pop!.hide" />
        </Popover>
    </div>
</template>

<script setup lang="ts">
import { ref, useTemplateRef, watch } from 'vue';
import { InputText, InputGroup, InputGroupAddon, DatePicker, Popover, Button, SelectButton } from 'primevue';

const timezoneOffset = new Date().getTimezoneOffset() * 60000;
const dateString = defineModel<string>("date");
const dateISO = defineModel<string>("dateValue");
const date = ref<Date | undefined>(!dateISO.value ? undefined : stringToDate(dateISO.value));

interface DateMode {
    label: string,
    shortLabel: string,
    view: "year" | "month" | "date",
    dateFormat: Intl.DateTimeFormatOptions
};
const dateModes = ref<DateMode[]>([
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
]);
const dateMode = ref<DateMode>(dateModes.value[dateString.value && dateString.value.length > 4 ? 2 : 0]);
const pop = useTemplateRef('selectDateMode');

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
        const newDateISO = new Date(newDate.getTime() - timezoneOffset).toISOString().slice(0, 10);
        if (newDateISO !== dateISO.value) {
            dateISO.value = newDateISO;
            dateString.value = newDate.toLocaleDateString("ru", dateMode.value.dateFormat);
        };
    };
});

function stringToDate(datebyString: string) {
    return new Date(new Date(datebyString).getTime() + timezoneOffset);
};

function showModesSelector(event: Event) {
    if (pop.value) {
        pop.value.toggle(event);
    };
};
</script>