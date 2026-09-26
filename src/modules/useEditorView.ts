import { type Ref, onMounted, onUnmounted, unref } from "vue";
import { TextSelection } from "prosemirror-state";
import { EditorView, type NodeViewConstructor } from "prosemirror-view";

import { ViewManager } from "@/modules/viewManager";
import { wordBoundaries } from "@/modules/transform";
import editorState from "@/modules/editorState";
import BlockView from "@/extensions/blockView";
import ImageView from "@/extensions/imageView";
import InlineImageView from "@/extensions/inlineImageView";

const defaultNodeViews: Record<string, NodeViewConstructor> = {
	image: (node, view, getPos) => new ImageView(node, view, getPos),
	inlineimage: (node) => new InlineImageView(node),
	annotation: (node, view, getPos) => new BlockView(node, view, getPos),
	epigraph: (node, view, getPos) => new BlockView(node, view, getPos),
	section: (node, view, getPos) => new BlockView(node, view, getPos),
	poem: (node, view, getPos) => new BlockView(node, view, getPos),
	cite: (node, view, getPos) => new BlockView(node, view, getPos),
	title: (node, view, getPos) => new BlockView(node, view, getPos),
	subtitle: (node, view, getPos) => new BlockView(node, view, getPos),
	stanza: (node, view, getPos) => new BlockView(node, view, getPos),
	textauthor: (node, view, getPos) => new BlockView(node, view, getPos),
	date: (node, view, getPos) => new BlockView(node, view, getPos)
};

export default function useEditorView(target: Ref<HTMLElement | null> | HTMLElement, manager: ViewManager, editorId: string) {
	let view: EditorView | null = null;

	const createView = (el: HTMLElement) => {
		view = new EditorView(el, {
			state: manager.state,
			handleScrollToSelection: () => {
				if (editorState.cancelEditorScroll) {
					editorState.cancelEditorScroll = false;
					return true;
				};
				return false;
			},
			handleDoubleClick: (view, pos, event) => {
				if (event.button === 0) {
					const doc = view.state.doc;
					const range = wordBoundaries(doc.resolve(pos));
					if (range.from === range.to) return false;

					// В Chromium рассинхрон с DOMObserver при замене выделения
					setTimeout(() => {
						view.focus();
						const selection = TextSelection.create(doc, range.from, range.to);
						if (!view.state.selection.eq(selection)) {
							const tr = view.state.tr.setSelection(selection);
							view.dispatch(tr);
						};
					});
					return true;
				};
				return false;
			},
			transformPastedHTML: (html: string) => {
				const parser = new DOMParser();
				const doc = parser.parseFromString(html, "text/html");
				if (doc.body) {
					doc.body.querySelectorAll("[id]").forEach(el => el.removeAttribute("id"));
					return doc.body.innerHTML;
				}
				return html;
			},
			nodeViews: defaultNodeViews,
			dispatchTransaction: (tr) => manager.dispatch(tr)
		});

		editorState.views[editorId] = view;
		manager.registerView(editorId, view);
	};

	const destroyView = () => {
		if (view) {
			delete editorState.views[editorId];
			view.destroy();
			view = null;
		};
	};

	onMounted(() => {
		const el = unref(target);
		if (el) {
			createView(el);
		}
	});

	onUnmounted(() => {
		destroyView();
	});

	return {
		get view() { return view }
	};
}