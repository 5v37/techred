<template>
    <div class="t-ui-chipcontainer">
        <Chip v-for="(series, index) in model" :key="series.id" removable @remove="del(index)">
            <div class="t-ui-chipgroup">
                <FloatLabel variant="on" style="width:32rem">
                    <InputText v-model.lazy=series.name fluid />
                    <label>Название</label>
                </FloatLabel>
                <FloatLabel variant="on" style="width:10.1rem">
                    <InputNumber v-model.lazy=series.number :useGrouping="false" fluid />
                    <label>Номер</label>
                </FloatLabel>
            </div>
        </Chip>
        <Button type="button" icon="pi pi-plus" @click="add()" v-tooltip="'Добавить'" />
    </div>
</template>

<script setup lang="ts">
import { Chip, FloatLabel, InputText, InputNumber, Button } from 'primevue';
import Series from '../types/series';

const model = defineModel<Series[]>({ required: true });

function add() {
    model.value.push(new Series);
};
function del(index: number) {
    model.value.splice(index, 1);
};
</script>