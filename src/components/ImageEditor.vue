<!-- <template>
    <Dialog v-model:visible="visible" modal header="Редактирование изображения" :closable="false">
        <div class="t-imageeditor-dialog">
            <Image class="img" :src=dataURL preview width="200" />
            <div class="t-ui-container">
                <div class="t-ui-field">
                    <label >Путь</label>
                    <InputText v-model.lazy="href" class="t-ui-grow" />
                </div>
                <div class="t-ui-field">
                    <label >Подпись</label>
                    <InputText v-model.lazy="title" class="t-ui-grow" />
                </div>
                <div class="t-ui-field">
                    <label>Описание</label>
                    <InputText v-model.lazy.trim=alt />
                </div>
                <div class="t-ui-field">
                    <label>Идентификатор</label>
                    <InputText v-model.lazy.trim=id />
                </div>
            </div>




        </div>
        <div class="t-imageeditor-dialog">
            <div class="t-imageeditor-selector">
                <Listbox v-model="selectedImage" :options="images" optionLabel="name" class="w-full md:w-56"
                    listStyle="max-height:250px" @update:modelValue="console.log(selectedImage[1])">
                    <template #option="slotProps">
                        <div class="flex items-center">
                            <img width="50" :src=slotProps.option[1].dataURL />
                            <div>{{ slotProps.option[0] }}</div>
                        </div>
                    </template>
</Listbox>
<Button type="button" icon="pi pi-plus" />
</div>
<div>
    <div class="t-ui-chipcontainer">
        <Image class="img" :src=selectedImage[1].dataURL preview width="200" />
        <div class="t-ui-container">

            <div class="t-ui-field">
                <label>Описание</label>
                <InputText v-model.lazy.trim=alt />
            </div>

            <div class="t-ui-field">
                <label>Идентификатор</label>
                <InputText v-model.lazy.trim=id />
            </div>

        </div>
    </div>
    <div class="t-ui-chipcontainer">
        <label style="width: 5rem;">Подпись</label>
        <InputText v-model.lazy="title" class="t-ui-grow" />
    </div>


</div>
</div>
        <template #footer>
            <Button type="button" label="Отмена" severity="secondary" @click="visible = false"></Button>
            <Button type="button" label="Сохранить" @click="save"></Button>
        </template>
    </Dialog>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import { Attrs } from "prosemirror-model";

import { Dialog, InputText, Button, Image } from "primevue";
import editorState from "../editorState";

const visible = ref(false);

const href = ref("");
const title = ref("");
const alt = ref("");
const id = ref("");
const dataURL = ref("");


let callback: (attrs: Attrs) => void;



// function show(attrs: Attrs, command: (attrs: Attrs) => void) {
function show() {
    visible.value = true;

    console.log(Object.entries(editorState.images.value.items))

};

function save() {
    visible.value = false;


};

defineExpose({
    show,
});
</script>

<style>
.t-imageeditor-dialog {
    display: flex;

}

.t-imageeditor-selector {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;

}
</style> -->