<template>
    <div class="t-ui-chipcontainer">
        <Chip v-for="(person, index) in model" :key="person.id" removable @remove="del(index)">
            <div class="t-persons-chip">
                <div class="t-persons-group">
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person['last-name']" />
                        <label>Фамилия</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person['first-name']" />
                        <label>Имя</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person['middle-name']" />
                        <label>Отчество</label>
                    </FloatLabel>
                </div>
                <div class="t-persons-group">
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person.nickname" />
                        <label>Псевдоним</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person.email" />
                        <label>email</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person['home-page']" />
                        <label>Сайт</label>
                    </FloatLabel>
                </div>
            </div>
        </Chip>
        <Button type="button" icon="pi pi-plus" @click="add" v-tooltip="'Добавить'" />
    </div>
</template>

<script setup lang="ts">
import { Chip, FloatLabel, InputText, Button } from 'primevue';
import PersonInfo from '../types/personInfo';

const model = defineModel<PersonInfo[]>({ required: true });

function add() {
    model.value.push(new PersonInfo);
};
function del(index: number) {
    model.value.splice(index, 1);
};
</script>

<style>
.t-persons-chip {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-block: 0.25rem;
}

.t-persons-group {
    display: flex;
    gap: 0.75rem;
}
</style>