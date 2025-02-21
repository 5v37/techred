import { TreeNode } from "primevue/treenode";

const genresTree: TreeNode[] = [
    {
        label: "Деловая литература",
        key: '00',
        selectable: false,
        children: [
            { label: "Деловая литература", key: "economics_ref" },
            { label: "Карьера, кадры", key: "popular_business" },
            { label: "Маркетинг, PR", key: "org_behavior" },
            { label: "Финансы", key: "banking" },
            { label: "Экономика", key: "economics" },
        ]
    },
    {
        label: "Детективы и Триллеры",
        key: '01',
        selectable: false,
        children: [
            { label: "Боевик", key: "det_action" },
            { label: "Детективы", key: "detective" },
            { label: "Иронический детектив, дамский детективный роман", key: "det_irony" },
            { label: "Исторический детектив", key: "det_history" },
            { label: "Классический детектив", key: "det_classic" },
            { label: "Криминальный детектив", key: "det_crime" },
            { label: "Крутой детектив", key: "det_hard" },
            { label: "Политический детектив", key: "det_political" },
            { label: "Полицейский детектив", key: "det_police" },
            { label: "Про маньяков", key: "det_maniac" },
            { label: "Советский детектив", key: "det_su" },
            { label: "Триллер", key: "thriller" },
            { label: "Шпионский детектив", key: "det_espionage" }
        ]
    },
    {
        label: "Документальная литература",
        key: '02',
        selectable: false,
        children: [
            { label: "Биографии и Мемуары", key: "nonf_biography" },
            { label: "Военная документалистика и аналитика", key: "nonf_military" },
            { label: "Военное дело", key: "military_special" },
            { label: "География, путевые заметки", key: "travel_notes" },
            { label: "Документальная литература", key: "nonfiction" },
            { label: "Публицистика", key: "nonf_publicism" }
        ]
    },
    {
        label: "Дом и семья",
        key: '03',
        selectable: false,
        children: [
            { label: "Автомобили и ПДД", key: "auto_regulations" },
            { label: "Боевые искусства, спорт", key: "home_sport" },
            { label: "Домашние животные", key: "home_pets" },
            { label: "Домоводство", key: "home" },
            { label: "Здоровье", key: "home_health" },
            { label: "Коллекционирование", key: "home_collecting" },
            { label: "Кулинария", key: "home_cooking" },
            { label: "Педагогика, воспитание детей, литература для родителей", key: "sci_pedagogy" },
            { label: "Развлечения", key: "home_entertain" },
            { label: "Сад и огород", key: "home_garden" },
            { label: "Сделай сам", key: "home_diy" },
            { label: "Семейные отношения", key: "family" },
            { label: "Семейные отношения, секс", key: "home_sex" },
            { label: "Хобби и ремесла", key: "home_crafts" }
        ]
    },
    {
        label: "Драматургия",
        key: '04',
        selectable: false,
        children: [
            { label: "Античная драма", key: "drama_antique" },
            { label: "Драма", key: "drama" },
            { label: "Драматургия", key: "dramaturgy" },
            { label: "Комедия", key: "comedy" },
            { label: "Мистерия, буффонада, водевиль", key: "vaudeville" },
            { label: "Сценарий", key: "screenplays" },
            { label: "Трагедия", key: "tragedy" }
        ]
    },
    {
        label: "Искусство, Искусствоведение, Дизайн",
        key: '05',
        selectable: false,
        children: [
            { label: "Живопись, альбомы, иллюстрированные каталоги", key: "painting" },
            { label: "Искусство и Дизайн", key: "design" },
            { label: "Искусствоведение", key: "art_criticism" },
            { label: "Кино", key: "cine" },
            { label: "Критика", key: "nonf_criticism" },
            { label: "Культурология", key: "sci_culture" },
            { label: "Мировая художественная культура", key: "art_world_culture" },
            { label: "Музыка", key: "music" },
            { label: "Партитуры", key: "notes" },
            { label: "Скульптура и архитектура", key: "architecture_book" },
            { label: "Театр", key: "theatre" }
        ]
    },
    {
        label: "Компьютеры и Интернет",
        key: '06',
        selectable: false,
        children: [
            { label: "Компьютерная литература", key: "computers" },
            { label: "Аппаратное обеспечение, цифровая обработка сигналов", key: "comp_hard" },
            { label: "ОС и Сети, интернет", key: "comp_www" },
            { label: "Программирование, программы, базы данных", key: "comp_db" },
            { label: "Учебные пособия, самоучители", key: "tbg_computers" }
        ]
    },
    {
        label: "Литература для детей",
        key: '07',
        selectable: false,
        children: [
            { label: "Детская литература", key: "children" },
            { label: "Детская образовательная литература", key: "child_education" },
            { label: "Детская остросюжетная литература", key: "child_det" },
            { label: "Зарубежная литература для детей", key: "foreign_children" },
            { label: "Игры, упражнения для детей", key: "prose_game" },
            { label: "Классическая детская литература", key: "child_classical" },
            { label: "Проза для детей", key: "child_prose" },
            { label: "Русские сказки", key: "child_tale_rus" },
            { label: "Сказки народов мира", key: "child_tale" },
            { label: "Стихи для детей", key: "child_verse" },
            { label: "Фантастика для детей", key: "child_sf" }
        ]
    },
    {
        label: "Любовные романы",
        key: '08',
        selectable: false,
        children: [
            { label: "Исторические любовные романы", key: "love_history" },
            { label: "Короткие любовные романы", key: "love_short" },
            { label: "Любовное фэнтези, любовно-фантастические романы", key: "love_sf" },
            { label: "Любовные романы", key: "love" },
            { label: "Остросюжетные любовные романы", key: "love_detective" },
            { label: "Порно", key: "love_hard" },
            { label: "Современные любовные романы", key: "love_contemporary" },
            { label: "Эротическая литература", key: "love_erotica" }
        ]
    },
    {
        label: "Наука, Образование",
        key: '09',
        selectable: false,
        children: [
            { label: "Альтернативная медицина", key: "sci_medicine_alternative" },
            { label: "Альтернативные науки и научные теории", key: "sci_theories" },
            { label: "Астрономия и Космос", key: "sci_cosmos" },
            { label: "Биология, биофизика, биохимия", key: "sci_biology" },
            { label: "Ботаника", key: "sci_botany" },
            { label: "Ветеринария", key: "sci_veterinary" },
            { label: "Военная история", key: "military_history" },
            { label: "Востоковедение", key: "sci_oriental" },
            { label: "Геология и география", key: "sci_geo" },
            { label: "Государство и право", key: "sci_state" },
            { label: "Образовательная, прикладная, научно-популярная литература", key: "sci_popular" },
            { label: "Зоология", key: "sci_zoo" },
            { label: "История", key: "sci_history" },
            { label: "Литературоведение", key: "sci_philology" },
            { label: "Математика", key: "sci_math" },
            { label: "Медицина", key: "sci_medicine" },
            { label: "Научная литература", key: "science" },
            { label: "Обществознание, социология", key: "sci_social_studies" },
            { label: "Политика", key: "sci_politics" },
            { label: "Психология и психотерапия", key: "sci_psychology" },
            { label: "Физика", key: "sci_phys" },
            { label: "Философия", key: "sci_philosophy" },
            { label: "Химия", key: "sci_chem" },
            { label: "Экология", key: "sci_ecology" },
            { label: "Экономика", key: "sci_economy" },
            { label: "Юриспруденция", key: "sci_juris" },
            { label: "Языкознание, иностранные языки", key: "sci_linguistic" }
        ]
    },
    {
        label: "Поэзия",
        key: '10',
        selectable: false,
        children: [
            { label: "Визуальная и экспериментальная поэзия, верлибры, палиндромы", key: "palindromes" },
            { label: "Классическая зарубежная поэзия", key: "poetry_for_classical" },
            { label: "Классическая поэзия", key: "poetry_classical" },
            { label: "Классическая русская поэзия", key: "poetry_rus_classical" },
            { label: "Лирика", key: "lyrics" },
            { label: "Песенная поэзия", key: "song_poetry" },
            { label: "Поэзия", key: "poetry" },
            { label: "Поэзия Востока", key: "poetry_east" },
            { label: "Поэма, эпическая поэзия", key: "poem" },
            { label: "Современная зарубежная поэзия", key: "poetry_for_modern" },
            { label: "Современная поэзия", key: "poetry_modern" },
            { label: "Современная русская поэзия", key: "poetry_rus_modern" },
            { label: "Юмористические стихи, басни", key: "humor_verse" }
        ]
    },
    {
        label: "Приключения",
        key: '11',
        selectable: false,
        children: [
            { label: "Авантюрный роман", key: "adv_story" },
            { label: "Вестерн, про индейцев", key: "adv_indian" },
            { label: "Исторические приключения", key: "adv_history" },
            { label: "Морские приключения", key: "adv_maritime" },
            { label: "Приключения", key: "adventure" },
            { label: "Приключения в современном мире", key: "adv_modern" },
            { label: "Приключения для детей и подростков", key: "child_adv" },
            { label: "Природа и животные", key: "adv_animal" },
            { label: "Путешествия и география", key: "adv_geo" },
            { label: "Рыцарский роман", key: "tale_chivalry" }
        ]
    },
    {
        label: "Проза",
        key: '12',
        selectable: false,
        children: [
            { label: "Афоризмы, цитаты", key: "aphorisms" },
            { label: "Готический роман", key: "gothic_novel" },
            { label: "Зарубежная классическая проза", key: "foreign_prose" },
            { label: "Историческая проза", key: "prose_history" },
            { label: "Классическая проза", key: "prose_classic" },
            { label: "Классическая проза XVII-XVIII веков", key: "literature_18" },
            { label: "Классическая проза ХIX века", key: "literature_19" },
            { label: "Классическая проза ХX века", key: "literature_20" },
            { label: "Контркультура", key: "prose_counter" },
            { label: "Магический реализм", key: "prose_magic" },
            { label: "Малые литературные формы прозы: рассказы, эссе, новеллы, феерия", key: "story" },
            { label: "Проза", key: "prose" },
            { label: "Проза о войне", key: "prose_military" },
            { label: "Роман, повесть", key: "great_story" },
            { label: "Русская классическая проза", key: "prose_rus_classic" },
            { label: "Советская классическая проза", key: "prose_su_classics" },
            { label: "Современная русская и зарубежная проза", key: "prose_contemporary" },
            { label: "Средневековая классическая проза", key: "foreign_antique" },
            { label: "Фантасмагория, абсурдистская проза", key: "prose_abs" },
            { label: "Экспериментальная, неформатная проза", key: "prose_neformatny" },
            { label: "Эпистолярная проза", key: "epistolary_fiction" }
        ]
    },
    {
        label: "Прочее",
        key: '13',
        selectable: false,
        children: [
            { label: "Журналы, газеты", key: "periodic" },
            { label: "Комиксы", key: "comics" },
            { label: "Незавершенное", key: "unfinished" },
            { label: "Неотсортированное", key: "other" },
            { label: "Самиздат, сетевая литература", key: "network_literature" },
            { label: "Фанфик", key: "fanfiction" }
        ]
    },
    {
        label: "Религия, духовность, эзотерика",
        key: '14',
        selectable: false,
        children: [
            { label: "Астрология и хиромантия", key: "astrology" },
            { label: "Буддизм", key: "religion_budda" },
            { label: "Индуизм", key: "religion_hinduism" },
            { label: "Ислам", key: "religion_islam" },
            { label: "Иудаизм", key: "religion_judaism" },
            { label: "Католицизм", key: "religion_catholicism" },
            { label: "Православие", key: "religion_orthodoxy" },
            { label: "Протестантизм", key: "religion_protestantism" },
            { label: "Религиоведение", key: "sci_religion" },
            { label: "Религия, религиозная литература", key: "religion" },
            { label: "Самосовершенствование", key: "religion_self" },
            { label: "Христианство", key: "religion_christianity" },
            { label: "Эзотерика, эзотерическая литература", key: "religion_esoterics" },
            { label: "Язычество", key: "religion_paganism" }
        ]
    },
    {
        label: "Справочная литература",
        key: '15',
        selectable: false,
        children: [
            { label: "Путеводители, карты, атласы", key: "geo_guides" },
            { label: "Руководства", key: "ref_guide" },
            { label: "Словари", key: "ref_dict" },
            { label: "Справочная литература", key: "reference" },
            { label: "Справочники", key: "ref_ref" },
            { label: "Энциклопедии", key: "ref_encyc" }
        ]
    },
    {
        label: "Старинное",
        key: '16',
        selectable: false,
        children: [
            { label: "Античная литература", key: "antique_ant" },
            { label: "Древневосточная литература", key: "antique_east" },
            { label: "Древнерусская литература", key: "antique_russian" },
            { label: "Европейская старинная литература", key: "antique_european" }
        ]
    },
    {
        label: "Техника",
        key: '17',
        selectable: false,
        children: [
            { label: "Автодело", key: "auto_business" },
            { label: "Военное дело, военная техника и вооружение", key: "military_weapon" },
            { label: "История техники", key: "equ_history" },
            { label: "Металлургия", key: "sci_metal" },
            { label: "Радиоэлектроника", key: "sci_radio" },
            { label: "Строительство и сопромат", key: "sci_build" },
            { label: "Технические науки", key: "sci_tech" },
            { label: "Транспорт и авиация", key: "sci_transport" }
        ]
    },
    {
        label: "Учебники и пособия",
        key: '18',
        selectable: false,
        children: [
            { label: "Учебники и пособия", key: "sci_textbook" },
            { label: "Учебники и пособия ВУЗов", key: "tbg_higher" },
            { label: "Учебники и пособия для среднего и специального образования", key: "tbg_secondary" },
            { label: "Школьные учебники и пособия, рефераты, шпаргалки", key: "tbg_school" }
        ]
    },
    {
        label: "Фантастика",
        key: '19',
        selectable: false,
        children: [
            { label: "Альтернативная история", key: "sf_history" },
            { label: "Боевая фантастика", key: "sf_action" },
            { label: "Героическая фантастика", key: "sf_heroic" },
            { label: "Городское фэнтези", key: "sf_fantasy_city" },
            { label: "Детективная фантастика", key: "sf_detective" },
            { label: "Киберпанк", key: "sf_cyberpunk" },
            { label: "Космическая фантастика", key: "sf_space" },
            { label: "ЛитРПГ", key: "sf_litrpg" },
            { label: "Мистика", key: "sf_mystic" },
            { label: "Мифологическое фэнтези", key: "fairy_fantasy" },
            { label: "Научная Фантастика", key: "sf" },
            { label: "Попаданцы", key: "popadancy" },
            { label: "Постапокалипсис", key: "sf_postapocalyptic" },
            { label: "Славянское фэнтези", key: "russian_fantasy" },
            { label: "Современная сказка", key: "modern_tale" },
            { label: "Социально-психологическая фантастика", key: "sf_social" },
            { label: "Стимпанк", key: "sf_stimpank" },
            { label: "Технофэнтези", key: "sf_technofantasy" },
            { label: "Ужасы", key: "sf_horror" },
            { label: "Фантастика", key: "sf_etc" },
            { label: "Фэнтези", key: "sf_fantasy" },
            { label: "Хроноопера", key: "hronoopera" },
            { label: "Эпическая фантастика", key: "sf_epic" },
            { label: "Юмористическая фантастика", key: "sf_humor" }
        ]
    },
    {
        label: "Фольклор",
        key: '20',
        selectable: false,
        children: [
            { label: "Былины, эпопея", key: "epic" },
            { label: "Детский фольклор", key: "child_folklore" },
            { label: "Мифы, Легенды, Эпос", key: "antique_myths" },
            { label: "Народные песни", key: "folk_songs" },
            { label: "Народные сказки", key: "folk_tale" },
            { label: "Пословицы, поговорки", key: "proverbs" },
            { label: "Фольклор, загадки", key: "folklore" },
            { label: "Частушки, прибаутки, потешки", key: "limerick" }
        ]
    },
    {
        label: "Юмор",
        key: '21',
        selectable: false,
        children: [
            { label: "Анекдоты", key: "humor_anecdote" },
            { label: "Сатира", key: "humor_satire" },
            { label: "Юмор", key: "humor" },
            { label: "Юмористическая проза", key: "humor_prose" }
        ]
    }
];

function findGenre(mark: string, missingHandler: (badMark: string) => void): Genre {
    for (const group of genresTree) {
        if (group.children) {
            for (const element of group.children) {
                if (element.key === mark) {
                    return { name: element.label ?? element.key, mark: element.key };
                };
            };
        };
    };
    missingHandler(mark);
    return { name: mark, mark: mark };
};

export { genresTree, findGenre };

export type Genre = {
    name: string,
    mark: string
};