<template>
	<ElementIdDialog />
	<ImageCaptionDialog />
	<LinkEditDialog />
	<SaveChangesDialog />
	<FileChangedDialog />

	<InsertContextMenu />
</template>

<script setup lang="ts">
import ElementIdDialog from "@/components/ElementIdDialog.vue";
import ImageCaptionDialog from "@/components/ImageCaptionDialog.vue";
import LinkEditDialog from "@/components/LinkEditDialog.vue";
import SaveChangesDialog from "@/components/SaveChangesDialog.vue";
import FileChangedDialog from "./FileChangedDialog.vue";

import InsertContextMenu from "@/components/InsertContextMenu.vue";
</script>