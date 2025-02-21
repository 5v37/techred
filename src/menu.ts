import { wrapItem, blockTypeItem, Dropdown, undoItem, redoItem, icons, MenuItem, MenuItemSpec } from "prosemirror-menu"
import { EditorState, Command } from "prosemirror-state"
import { Schema, MarkType, Attrs } from "prosemirror-model"
import { toggleMark } from "prosemirror-commands"
import { addTextautor, addTitle, changeToSection, wrapPoem } from "./commands"

function cmdItem(cmd: Command, options: Partial<MenuItemSpec>) {
    let passedOptions: MenuItemSpec = {
        label: options.title as string | undefined,
        run: cmd
    }
    for (let prop in options) (passedOptions as any)[prop] = (options as any)[prop]
    if (!options.enable && !options.select)
        passedOptions[options.enable ? "enable" : "select"] = state => cmd(state)

    return new MenuItem(passedOptions)
}

function markActive(state: EditorState, type: MarkType) {
    let { from, $from, to, empty } = state.selection
    if (empty) return !!type.isInSet(state.storedMarks || $from.marks())
    else return state.doc.rangeHasMark(from, to, type)
}

function markItem(markType: MarkType, options: Partial<MenuItemSpec>) {
    let passedOptions: Partial<MenuItemSpec> = {
        active(state) { return markActive(state, markType) }
    }
    for (let prop in options) (passedOptions as any)[prop] = (options as any)[prop]
    return cmdItem(toggleMark(markType), passedOptions)
}

function linkItem(markType: MarkType, editLink: any) {
    return new MenuItem({
        title: "Установить ссылку",
        icon: icons.link,
        active(state) { return markActive(state, markType) },
        enable(state) { return !state.selection.empty },
        run(state, dispatch, view) {
            let markAttrs: Attrs = {};
            let callback = function (attrs: Attrs) {
                // при обновлении формируется 2 транзакции, надо будет их объединить
                if (markActive(state, markType)) {
                    toggleMark(markType)(state, dispatch);
                };
                if (attrs.href) {
                    toggleMark(markType, attrs)(view.state, view.dispatch)
                }
                view.focus();
            };

            // при обновлении, если выбрать часть ссылки, только она и обновится, надо расширять выделение на всю ссылку
            const marks = state.selection.$head.marks();
            const [aMark] = marks.filter(mark => mark.type === markType);
            if (aMark) {
                markAttrs = aMark.attrs;
            };

            editLink(markAttrs, callback);
        }
    })
}

export function buildMenuItems(schema: Schema, dial: any) {

    const toggleStrong = markItem(schema.marks.strong, { title: "Включить полужирный", icon: { text: "Ж", css: "font-weight: bold;" } });
    const toggleEmphasis = markItem(schema.marks.emphasis, { title: "Включить курсив", icon: { text: "К", css: "font-style: italic;" } });
    const toggleStrike = markItem(schema.marks.strikethrough, { title: "Включить зачеркнутый", icon: { text: "З", css: "text-decoration: line-through;" } });
    const toggleSup = markItem(schema.marks.sup, { title: "Включить надстрочный", icon: { text: "Нⁱ" } });
    const toggleSub = markItem(schema.marks.sub, { title: "Включить подстрочный", icon: { text: "Пᵢ" } });
    const toggleCode = markItem(schema.marks.code, { title: "Включить моноширинный", icon: { text: "М", css: "font-family: monospace;" } });
    const toggleLink = linkItem(schema.marks.a, dial);

    const insertTitle = new MenuItem({
        title: "Вставить заголовок",
        label: "Заголовок",
        enable(state) { return addTitle()(state) },
        run(state, dispatch) { addTitle()(state, dispatch) }
    })
    const makeTextauthor = new MenuItem({
        title: "Вставить автора",
        label: "Автор",
        enable(state) { return addTextautor()(state) },
        run(state, dispatch) { addTextautor()(state, dispatch) }
    });

    const makeSubtitle = blockTypeItem(schema.nodes.subtitle, {
        title: "Обернуть в подзаголовок",
        label: "Подзаголовок",
    });
    const makeCite = wrapItem(schema.nodes.cite, {
        title: "Обернуть в цитату",
        label: "Цитата",
    });
    const makeStanza = wrapItem(schema.nodes.stanza, {
        title: "Обернуть в стих",
        label: "Стих",
        enable(state) { return wrapPoem()(state) },
        run(state, dispatch) { wrapPoem()(state, dispatch) }
    });
    const makeParagraph = blockTypeItem(schema.nodes.p, {
        title: "Заменить на абзац",
        label: "Абзац",
    });
    const makeSection = blockTypeItem(schema.nodes.section, {
        title: "Заменить на секцию",
        label: "Секция",
        enable(state) { return changeToSection()(state) },
        run(state, dispatch) { changeToSection()(state, dispatch) }
    });

    let cut = <T>(arr: T[]) => arr.filter(x => x) as NonNullable<T>[]
    const insertMenu = new Dropdown(cut([insertTitle, makeTextauthor]), { label: "Вставить" })
    const typeMenu = new Dropdown(cut([makeSubtitle, makeCite, makeStanza, makeParagraph, makeSection]), { label: "Превратить" })

    const inlineMenu = [toggleStrong, toggleEmphasis, toggleStrike, toggleSup, toggleSub, toggleCode, toggleLink];

    return [inlineMenu, [insertMenu, typeMenu], [undoItem, redoItem]]
}
