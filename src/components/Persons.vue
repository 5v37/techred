<template>
    <div class="t-ui-chipcontainer">
        <Chip v-for="(person, index) in model" :key="person.id" removable @remove="del(index)" class="t-ui-chipinput"
            :pt="{ removeIcon: { style: 'flex-shrink: 0' } }">
            <div class="t-persons-chip">
                <div class="t-ui-rowgroup">
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person['last-name']" fluid />
                        <label>Фамилия</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person['first-name']" fluid />
                        <label>Имя</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person['middle-name']" fluid />
                        <label>Отчество</label>
                    </FloatLabel>
                </div>
                <div class="t-ui-rowgroup">
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person.nickname" fluid />
                        <label>Псевдоним</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person.email" fluid />
                        <label>email</label>
                    </FloatLabel>
                    <FloatLabel variant="on">
                        <InputText v-model.lazy="person['home-page']" fluid />
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
}
</style>