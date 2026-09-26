<template>
	<div ref="containerRef" class="t-splitter" :class="{ 't-splitter-vertical': isVertical }">
		<div class="t-splitter-pane"
			:style="{ [isVertical ? 'width' : 'height']: showExtra ? `${mainPercent}%` : '100%' }">
			<slot name="main" />
		</div>
		<div ref="splitterRef" class="t-splitter-bar" v-show="showExtra"
			:class="{ 't-splitter-bar-vertical': isVertical, 't-splitter-bar-horizontal': !isVertical }"
			@pointerdown.prevent="onPointerDown" @pointermove="onPointerMove" @pointerup="onPointerUp"
			@pointercancel="onPointerUp" @dblclick="onDbClick" />
		<div class="t-splitter-pane" v-show="showExtra"
			:style="{ [isVertical ? 'width' : 'height']: `calc(${100 - mainPercent}% - var(--t-splitter-bar-size))` }">
			<slot name="extra" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(defineProps<{
	direction?: "horizontal" | "vertical"
	initialRatio?: number,
	minRatio?: number,
	showExtra?: boolean
}>(), {
	direction: "horizontal",
	initialRatio: 50,
	minRatio: 10,
	showExtra: true
});

const isVertical = computed(() => props.direction === "vertical");
const containerRef = ref<HTMLDivElement>();
const splitterRef = ref<HTMLDivElement>();
const mainPercent = ref(props.initialRatio);

let isDragging = false;
let startClient = 0;
let startPercent = 0;
let newPercent = 0;
let rafId: number | null = null;

function onPointerDown(e: PointerEvent) {
	if (!splitterRef.value) return;

	isDragging = true;
	startClient = isVertical.value ? e.clientX : e.clientY;
	startPercent = mainPercent.value;

	splitterRef.value.setPointerCapture(e.pointerId);
}

function onPointerMove(e: PointerEvent) {
	if (!isDragging || !containerRef.value) return;

	const containerSize = isVertical.value ? containerRef.value.clientWidth : containerRef.value.clientHeight;
	if (containerSize <= 0) return;

	const delta = (isVertical.value ? e.clientX : e.clientY) - startClient;
	const deltaPercent = (delta / containerSize) * 100;

	newPercent = startPercent + Math.round(deltaPercent * 10000) / 10000;
	newPercent = Math.max(props.minRatio, Math.min(100 - props.minRatio, newPercent));

	if (rafId === null) {
		rafId = requestAnimationFrame(() => {
			mainPercent.value = newPercent;
			rafId = null;
		});
	};
}

function onPointerUp() {
	if (isDragging) {
		isDragging = false;
	};
}

function onDbClick() {
	mainPercent.value = props.initialRatio;
}
</script>

<style>
.t-splitter {
	display: flex;
	flex-direction: column;
	height: 100%;
	width: 100%;
	overflow: hidden;
}

.t-splitter.t-splitter-vertical {
	flex-direction: row;
}

.t-splitter-pane {
	overflow: hidden;
	flex: none;
}

.t-splitter-bar {
	background-color: var(--p-content-border-color);
	flex: none;
	user-select: none;
	touch-action: none;
	transition: background-color 0.15s ease-out 0.2s;
}

.t-splitter-bar:hover {
	background-color: var(--p-primary-hover-color);
}

.t-splitter-bar-horizontal {
	height: var(--t-splitter-bar-size);
	cursor: ns-resize;
}

.t-splitter-bar-vertical {
	width: var(--t-splitter-bar-size);
	cursor: ew-resize;
}
</style>