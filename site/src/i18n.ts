import { useSyncExternalStore } from "react";
import { enUS, ru, uk, type Locale } from "date-fns/locale";

export type Language = "ru" | "en" | "uk";

export const LANGUAGES: { id: Language; title: string }[] = [
    { id: "ru", title: "Русский" },
    { id: "en", title: "English" },
    { id: "uk", title: "Українська" },
];

export type Dictionary = {
    navHome: string;
    navOutages: string;
    navDomains: string;
    navSettings: string;
    navLanguage: string;
    settingsAutoRefresh: string;
    settingsHideUnreliable: string;
    unitMs: string;
    unitSec: string;
    unitMinuteShort: string;
    unitScore: string;
    commonMore: string;
    healthStable: string;
    healthWarning: string;
    healthCritical: string;
    overviewStatusUp: string;
    overviewCitiesIssues: string;
    overviewCitiesIssuesMany: string;
    overviewStatusDown: string;
    overviewStatusCaptcha: string;
    overviewStatusProbeError: string;
    overviewSamples: string;
    overviewTabLoadTime: string;
    overviewAvgBackend: string;
    overviewAvgLoad: string;
    overviewAvgPing: string;
    countryCheckInterval: string;
    chartStatus: string;
    chartTotal: string;
    chartDownload: string;
    chartAverage: string;
    chartMin: string;
    chartMax: string;
    chartLoss: string;
    chartValue: string;
    chartGroupMetrics: string;
    chartGroupBackend: string;
    chartDateTime: string;
    chartUnreliable: string;
    chartTimingDb: string;
    chartTimingApp: string;
    chartTimingTemplate: string;
    chartTimingTemplates: string;
    chartTimingRender: string;
    chartTimingData: string;
    chartTimingCache: string;
    chartTimingAuth: string;
    chartTimingSession: string;
    chartTimingBootstrap: string;
    chartTimingRouting: string;
    chartTimingQueue: string;
    chartTimingTotal: string;
    lhDesktop: string;
    lhMobile: string;
    lhAllPages: string;
    lhPage: string;
    lhAverage: string;
    lhSeriesLab: string;
    lhMetricLoad: string;
    lhMetricScore: string;
    reasonNotLoading: string;
    reasonSlow: string;
    reasonNoMedia: string;
    reasonFreezing: string;
    reasonAuth: string;
    timeRange3Hour: string;
    timeRangeDay: string;
    timeRangeWeek: string;
    timeRangeMonth: string;
    dateRangePlaceholder: string;
    dateRangeWeekdays: string;
    dateRangeHours: string;
    dateRangeMinutes: string;
    dateRangeFrom: string;
    dateRangeTo: string;
    dateRangeClear: string;
    dateRangePrevMonth: string;
    dateRangeNextMonth: string;
    dateRangePickEnd: string;
    dateRangePickStart: string;
    dateRangeReset: string;
    domainGroupOld: string;
    domainGroupNew: string;
    domainGroupService: string;
    domainWaf: string;
    domainAvgTime: string;
    domainProblemCities: string;
    domainUnknownCity: string;
    domainStatusCode: string;
    domainUnknownStatus: string;
    domainTime: string;
    domainAllNormal: string;
    footerCodesTitle: string;
    footerCode901: string;
    footerCode902: string;
    footerCode903: string;
    footerCode904: string;
    footerCode905: string;
    footerCode906: string;
    footerCode907: string;
    footerCode908: string;
    footerCopyright: string;
    staleError: string;
    staleUpdating: string;
    statusScrollLeft: string;
    statusScrollRight: string;
    reportSubmitted: string;
    reportSubmitting: string;
    reportSubmit: string;
    reportChartComplaints: string;
    reportChartComplaintsCount: string;
    reportChartTitle: string;
    reportChartTotal: string;
    reportPopularReasons: string;
    reportNone: string;
    reportListTitle: string;
    metaHomeTitle: string;
    metaHomeDescription: string;
    metaDownDetectorTitle: string;
    metaDownDetectorDescription: string;
    metaDomainTitle: string;
    metaDomainDescription: string;
};

const dictionaries: Record<Language, Dictionary> = {
    ru: {
        navHome: "ГЛАВНАЯ",
        navOutages: "СБОИ",
        navDomains: "ДОМЕНЫ",
        navSettings: "Настройки",
        navLanguage: "Язык",
        settingsAutoRefresh: "Автообновление",
        settingsHideUnreliable: "Скрывать недостоверные данные",
        unitMs: "мс",
        unitSec: "с",
        unitMinuteShort: "м",
        unitScore: "баллов",
        commonMore: "Подробнее",
        healthStable: "Все работает стабильно",
        healthWarning: "Возможные неполадки",
        healthCritical: "Возникли неполадки",
        overviewStatusUp: "В норме",
        overviewCitiesIssues: "город с проблемой|города с проблемами|городов с проблемами",
        overviewCitiesIssuesMany: "3+ городов с проблемами",
        overviewStatusDown: "Полная недоступность",
        overviewStatusCaptcha: "Капча",
        overviewStatusProbeError: "Сбой измерителя",
        overviewSamples: "замеров",
        overviewTabLoadTime: "Время загрузки",
        overviewAvgBackend: "Среднее backend-время",
        overviewAvgLoad: "Среднее время загрузки",
        overviewAvgPing: "Средний Ping",
        countryCheckInterval: "Каждая проверка происходит раз в {n} минут",
        chartStatus: "Статус",
        chartTotal: "Общее",
        chartDownload: "Загрузка",
        chartAverage: "Среднее",
        chartMin: "Мин",
        chartMax: "Макс",
        chartLoss: "Потери",
        chartValue: "Значение",
        chartGroupMetrics: "Метрики в мс",
        chartGroupBackend: "Backend в мс",
        chartDateTime: "{date} в {time}",
        chartUnreliable: "Недостоверный замер",
        chartTimingDb: "БД",
        chartTimingApp: "Приложение",
        chartTimingTemplate: "Шаблон",
        chartTimingTemplates: "Шаблоны",
        chartTimingRender: "Рендер",
        chartTimingData: "Данные",
        chartTimingCache: "Кеш",
        chartTimingAuth: "Авторизация",
        chartTimingSession: "Сессия",
        chartTimingBootstrap: "Инициализация",
        chartTimingRouting: "Роутинг",
        chartTimingQueue: "Очередь",
        chartTimingTotal: "Общее2",
        lhDesktop: "ПК",
        lhMobile: "Телефон",
        lhAllPages: "Все страницы",
        lhPage: "Страница",
        lhAverage: "Среднее {metric}",
        lhSeriesLab: "Status сервис",
        lhMetricLoad: "Загрузка",
        lhMetricScore: "Оценка",
        reasonNotLoading: "Не загружается сайт",
        reasonSlow: "Долгая загрузка",
        reasonNoMedia: "Нет изображений и видео",
        reasonFreezing: "Зависает",
        reasonAuth: "Не работает регистрация/авторизация",
        timeRange3Hour: "3 часа",
        timeRangeDay: "День",
        timeRangeWeek: "Неделя",
        timeRangeMonth: "Месяц",
        dateRangePlaceholder: "Выбрать период",
        dateRangeWeekdays: "Пн|Вт|Ср|Чт|Пт|Сб|Вс",
        dateRangeHours: "часы",
        dateRangeMinutes: "минуты",
        dateRangeFrom: "с",
        dateRangeTo: "до",
        dateRangeClear: "Сбросить период",
        dateRangePrevMonth: "Предыдущий месяц",
        dateRangeNextMonth: "Следующий месяц",
        dateRangePickEnd: "Выберите конечную дату",
        dateRangePickStart: "Выберите начальную дату",
        dateRangeReset: "Сбросить",
        domainGroupOld: "Старый сайт",
        domainGroupNew: "Новый сайт",
        domainGroupService: "Служебные сервисы",
        domainWaf: "Защита",
        domainAvgTime: "Среднее время: {value}",
        domainProblemCities: "Проблемные города:",
        domainUnknownCity: "Неизвестный город",
        domainStatusCode: "Статус: {code}",
        domainUnknownStatus: "неизвестный статус",
        domainTime: "Время: {value}",
        domainAllNormal: "Все города в норме",
        footerCodesTitle: "Особые коды 9xx — сбои измерения сервиса",
        footerCode901: "Сбой пробы (неизвестная причина)",
        footerCode902: "Таймаут соединения",
        footerCode903: "Ошибка DNS (домен не разрешился)",
        footerCode904: "Превышен лимит запросов к сервису измерений",
        footerCode905: "Измеритель недоступен",
        footerCode906: "Соединение отклонено или сброшено",
        footerCode907: "Ошибка TLS / сертификата",
        footerCode908: "Измерение не завершилось за 3 минуты",
        footerCopyright: "Yummy Status {years}. Создано специально для проектов Yummy.",
        staleError: "Не удалось обновить данные",
        staleUpdating: "Данные могут быть устаревшими. Обновление...",
        statusScrollLeft: "Прокрутить влево",
        statusScrollRight: "Прокрутить вправо",
        reportSubmitted: "Сообщено о сбое",
        reportSubmitting: "Отправляем…",
        reportSubmit: "Сообщить о сбое",
        reportChartComplaints: "Жалобы",
        reportChartComplaintsCount: "Жалоб: {n}",
        reportChartTitle: "График жалоб за 24 часа",
        reportChartTotal: "Всего: {n}",
        reportPopularReasons: "Популярные причины",
        reportNone: "За последние 24 часа жалоб не поступало",
        reportListTitle: "Последние жалобы за 24 часа",
        metaHomeTitle: "YummyStatus — мониторинг доступности сайта Ями Аниме | YummyAnime",
        metaHomeDescription: "Мониторинг доступности сайта Ями Аниме | YummyAnime: аптайм, время отклика. Работает ли сайт в России, Беларуси, Украине, Казахстане и других странах?",
        metaDownDetectorTitle: "Работает ли сайт Ями Аниме | YummyAnime",
        metaDownDetectorDescription: "Работает ли сейчас в данный момент сайт Ями Аниме | YummyAnime? Узнать когда починят сайт, сбои, блокировки и другие проблемы с доступом",
        metaDomainTitle: "Статус {domain} — YummyStatus",
        metaDomainDescription: "Доступность и время отклика {domain}: аптайм, скорость загрузки и статус по странам в реальном времени.",
    },
    en: {
        navHome: "HOME",
        navOutages: "OUTAGES",
        navDomains: "DOMAINS",
        navSettings: "Settings",
        navLanguage: "Language",
        settingsAutoRefresh: "Auto-refresh",
        settingsHideUnreliable: "Hide unreliable data",
        unitMs: "ms",
        unitSec: "s",
        unitMinuteShort: "m",
        unitScore: "points",
        commonMore: "Details",
        healthStable: "Everything is running smoothly",
        healthWarning: "Possible issues",
        healthCritical: "Issues detected",
        overviewStatusUp: "Normal",
        overviewCitiesIssues: "city with an issue|cities with issues",
        overviewCitiesIssuesMany: "3+ cities with issues",
        overviewStatusDown: "Completely unavailable",
        overviewStatusCaptcha: "CAPTCHA",
        overviewStatusProbeError: "Probe failure",
        overviewSamples: "samples",
        overviewTabLoadTime: "Load time",
        overviewAvgBackend: "Average backend time",
        overviewAvgLoad: "Average load time",
        overviewAvgPing: "Average ping",
        countryCheckInterval: "Each check runs every {n} minutes",
        chartStatus: "Status",
        chartTotal: "Total",
        chartDownload: "Download",
        chartAverage: "Average",
        chartMin: "Min",
        chartMax: "Max",
        chartLoss: "Loss",
        chartValue: "Value",
        chartGroupMetrics: "Metrics in ms",
        chartGroupBackend: "Backend in ms",
        chartDateTime: "{date} at {time}",
        chartUnreliable: "Unreliable measurement",
        chartTimingDb: "DB",
        chartTimingApp: "Application",
        chartTimingTemplate: "Template",
        chartTimingTemplates: "Templates",
        chartTimingRender: "Render",
        chartTimingData: "Data",
        chartTimingCache: "Cache",
        chartTimingAuth: "Authorization",
        chartTimingSession: "Session",
        chartTimingBootstrap: "Initialization",
        chartTimingRouting: "Routing",
        chartTimingQueue: "Queue",
        chartTimingTotal: "Total 2",
        lhDesktop: "Desktop",
        lhMobile: "Phone",
        lhAllPages: "All pages",
        lhPage: "Page",
        lhAverage: "Average {metric}",
        lhSeriesLab: "Status service",
        lhMetricLoad: "Load",
        lhMetricScore: "Score",
        reasonNotLoading: "Site is not loading",
        reasonSlow: "Slow loading",
        reasonNoMedia: "No images or videos",
        reasonFreezing: "Freezing",
        reasonAuth: "Sign-up/login not working",
        timeRange3Hour: "3 hours",
        timeRangeDay: "Day",
        timeRangeWeek: "Week",
        timeRangeMonth: "Month",
        dateRangePlaceholder: "Select period",
        dateRangeWeekdays: "Mo|Tu|We|Th|Fr|Sa|Su",
        dateRangeHours: "hours",
        dateRangeMinutes: "minutes",
        dateRangeFrom: "from",
        dateRangeTo: "to",
        dateRangeClear: "Reset period",
        dateRangePrevMonth: "Previous month",
        dateRangeNextMonth: "Next month",
        dateRangePickEnd: "Select end date",
        dateRangePickStart: "Select start date",
        dateRangeReset: "Reset",
        domainGroupOld: "Old site",
        domainGroupNew: "New site",
        domainGroupService: "Services",
        domainWaf: "Protection",
        domainAvgTime: "Average time: {value}",
        domainProblemCities: "Problem cities:",
        domainUnknownCity: "Unknown city",
        domainStatusCode: "Status: {code}",
        domainUnknownStatus: "unknown status",
        domainTime: "Time: {value}",
        domainAllNormal: "All cities are normal",
        footerCodesTitle: "Special 9xx codes — service measurement failures",
        footerCode901: "Probe failure (unknown reason)",
        footerCode902: "Connection timeout",
        footerCode903: "DNS error (domain did not resolve)",
        footerCode904: "Measurement service request limit exceeded",
        footerCode905: "Probe is unavailable",
        footerCode906: "Connection refused or reset",
        footerCode907: "TLS / certificate error",
        footerCode908: "Measurement did not finish within 3 minutes",
        footerCopyright: "Yummy Status {years}. Made specially for Yummy projects.",
        staleError: "Failed to update data",
        staleUpdating: "Data may be outdated. Updating...",
        statusScrollLeft: "Scroll left",
        statusScrollRight: "Scroll right",
        reportSubmitted: "Outage reported",
        reportSubmitting: "Sending…",
        reportSubmit: "Report an outage",
        reportChartComplaints: "Reports",
        reportChartComplaintsCount: "Reports: {n}",
        reportChartTitle: "Reports over the last 24 hours",
        reportChartTotal: "Total: {n}",
        reportPopularReasons: "Popular reasons",
        reportNone: "No reports in the last 24 hours",
        reportListTitle: "Latest reports in the last 24 hours",
        metaHomeTitle: "YummyStatus — Yummy Anime website availability monitoring | YummyAnime",
        metaHomeDescription: "Yummy Anime | YummyAnime website availability monitoring: uptime and response time. Is the site working in Russia, Belarus, Ukraine, Kazakhstan and other countries?",
        metaDownDetectorTitle: "Is the Yummy Anime website working | YummyAnime",
        metaDownDetectorDescription: "Is the Yummy Anime | YummyAnime website working right now? Find out when it will be fixed: outages, blocks and other access problems",
        metaDomainTitle: "{domain} status — YummyStatus",
        metaDomainDescription: "Availability and response time of {domain}: uptime, load speed and status by country in real time.",
    },
    uk: {
        navHome: "ГОЛОВНА",
        navOutages: "ЗБОЇ",
        navDomains: "ДОМЕНИ",
        navSettings: "Налаштування",
        navLanguage: "Мова",
        settingsAutoRefresh: "Автооновлення",
        settingsHideUnreliable: "Приховувати недостовірні дані",
        unitMs: "мс",
        unitSec: "с",
        unitMinuteShort: "хв",
        unitScore: "балів",
        commonMore: "Докладніше",
        healthStable: "Усе працює стабільно",
        healthWarning: "Можливі неполадки",
        healthCritical: "Виникли неполадки",
        overviewStatusUp: "У нормі",
        overviewCitiesIssues: "місто з проблемою|міста з проблемами|міст із проблемами",
        overviewCitiesIssuesMany: "3+ міст із проблемами",
        overviewStatusDown: "Повна недоступність",
        overviewStatusCaptcha: "Капча",
        overviewStatusProbeError: "Збій вимірювача",
        overviewSamples: "вимірів",
        overviewTabLoadTime: "Час завантаження",
        overviewAvgBackend: "Середній backend-час",
        overviewAvgLoad: "Середній час завантаження",
        overviewAvgPing: "Середній Ping",
        countryCheckInterval: "Кожна перевірка відбувається раз на {n} хвилин",
        chartStatus: "Статус",
        chartTotal: "Загальне",
        chartDownload: "Завантаження",
        chartAverage: "Середнє",
        chartMin: "Мін",
        chartMax: "Макс",
        chartLoss: "Втрати",
        chartValue: "Значення",
        chartGroupMetrics: "Метрики в мс",
        chartGroupBackend: "Backend у мс",
        chartDateTime: "{date} о {time}",
        chartUnreliable: "Недостовірний вимір",
        chartTimingDb: "БД",
        chartTimingApp: "Застосунок",
        chartTimingTemplate: "Шаблон",
        chartTimingTemplates: "Шаблони",
        chartTimingRender: "Рендер",
        chartTimingData: "Дані",
        chartTimingCache: "Кеш",
        chartTimingAuth: "Авторизація",
        chartTimingSession: "Сесія",
        chartTimingBootstrap: "Ініціалізація",
        chartTimingRouting: "Роутинг",
        chartTimingQueue: "Черга",
        chartTimingTotal: "Загальне2",
        lhDesktop: "ПК",
        lhMobile: "Телефон",
        lhAllPages: "Усі сторінки",
        lhPage: "Сторінка",
        lhAverage: "Середнє {metric}",
        lhSeriesLab: "Status сервіс",
        lhMetricLoad: "Завантаження",
        lhMetricScore: "Оцінка",
        reasonNotLoading: "Сайт не завантажується",
        reasonSlow: "Повільне завантаження",
        reasonNoMedia: "Немає зображень і відео",
        reasonFreezing: "Зависає",
        reasonAuth: "Не працює реєстрація/авторизація",
        timeRange3Hour: "3 години",
        timeRangeDay: "День",
        timeRangeWeek: "Тиждень",
        timeRangeMonth: "Місяць",
        dateRangePlaceholder: "Обрати період",
        dateRangeWeekdays: "Пн|Вт|Ср|Чт|Пт|Сб|Нд",
        dateRangeHours: "години",
        dateRangeMinutes: "хвилини",
        dateRangeFrom: "з",
        dateRangeTo: "до",
        dateRangeClear: "Скинути період",
        dateRangePrevMonth: "Попередній місяць",
        dateRangeNextMonth: "Наступний місяць",
        dateRangePickEnd: "Оберіть кінцеву дату",
        dateRangePickStart: "Оберіть початкову дату",
        dateRangeReset: "Скинути",
        domainGroupOld: "Старий сайт",
        domainGroupNew: "Новий сайт",
        domainGroupService: "Службові сервіси",
        domainWaf: "Захист",
        domainAvgTime: "Середній час: {value}",
        domainProblemCities: "Проблемні міста:",
        domainUnknownCity: "Невідоме місто",
        domainStatusCode: "Статус: {code}",
        domainUnknownStatus: "невідомий статус",
        domainTime: "Час: {value}",
        domainAllNormal: "Усі міста в нормі",
        footerCodesTitle: "Особливі коди 9xx — збої вимірювання сервісу",
        footerCode901: "Збій проби (невідома причина)",
        footerCode902: "Тайм-аут з’єднання",
        footerCode903: "Помилка DNS (домен не розпізнано)",
        footerCode904: "Перевищено ліміт запитів до сервісу вимірювань",
        footerCode905: "Вимірювач недоступний",
        footerCode906: "З’єднання відхилено або скинуто",
        footerCode907: "Помилка TLS / сертифіката",
        footerCode908: "Вимірювання не завершилося за 3 хвилини",
        footerCopyright: "Yummy Status {years}. Створено спеціально для проєктів Yummy.",
        staleError: "Не вдалося оновити дані",
        staleUpdating: "Дані можуть бути застарілими. Оновлення...",
        statusScrollLeft: "Прокрутити вліво",
        statusScrollRight: "Прокрутити вправо",
        reportSubmitted: "Повідомлено про збій",
        reportSubmitting: "Надсилаємо…",
        reportSubmit: "Повідомити про збій",
        reportChartComplaints: "Скарги",
        reportChartComplaintsCount: "Скарг: {n}",
        reportChartTitle: "Графік скарг за 24 години",
        reportChartTotal: "Усього: {n}",
        reportPopularReasons: "Популярні причини",
        reportNone: "За останні 24 години скарг не надходило",
        reportListTitle: "Останні скарги за 24 години",
        metaHomeTitle: "YummyStatus — моніторинг доступності сайту Ямі Аніме | YummyAnime",
        metaHomeDescription: "Моніторинг доступності сайту Ямі Аніме | YummyAnime: аптайм, час відгуку. Чи працює сайт у Росії, Білорусі, Україні, Казахстані та інших країнах?",
        metaDownDetectorTitle: "Чи працює сайт Ямі Аніме | YummyAnime",
        metaDownDetectorDescription: "Чи працює зараз сайт Ямі Аніме | YummyAnime? Дізнатися, коли полагодять сайт: збої, блокування та інші проблеми з доступом",
        metaDomainTitle: "Статус {domain} — YummyStatus",
        metaDomainDescription: "Доступність і час відгуку {domain}: аптайм, швидкість завантаження та статус за країнами в реальному часі.",
    },
};

const STORAGE_KEY = "siteLanguage";
const DATE_LOCALES: Record<Language, Locale> = { ru, en: enUS, uk };
const listeners = new Set<() => void>();
let currentLanguage = detectLanguage();
document.documentElement.lang = currentLanguage;

export function getLanguage(): Language {
    return currentLanguage;
}

export function setLanguage(language: Language): void {
    if (language === currentLanguage) return;
    currentLanguage = language;
    try {
        localStorage.setItem(STORAGE_KEY, language);
    } catch {
        console.warn("localStorage unavailable");
    }
    document.documentElement.lang = language;
    listeners.forEach((listener) => listener());
}

export function t(key: keyof Dictionary): string {
    return dictionaries[currentLanguage][key];
}

export function tf(key: keyof Dictionary, vars: Record<string, string | number>): string {
    return t(key).replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? ""));
}

export function tn(key: keyof Dictionary, n: number): string {
    const forms = t(key).split("|");
    const i = ["one", "few", "many"].indexOf(new Intl.PluralRules(currentLanguage).select(n));
    return `${n} ${forms[i < 0 ? forms.length - 1 : Math.min(i, forms.length - 1)]}`;
}

export function dateLocale(language: Language): Locale {
    return DATE_LOCALES[language];
}

export function useLanguage(): { language: Language; t: typeof t; tf: typeof tf; tn: typeof tn } {
    const language = useSyncExternalStore(subscribe, getLanguage);
    return { language, t, tf, tn };
}

function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => void listeners.delete(listener);
}

function toLanguage(value: string | null | undefined): Language | null {
    const code = value?.trim().toLowerCase() ?? "";
    return LANGUAGES.find(({ id }) => code.startsWith(id))?.id ?? null;
}

function detectLanguage(): Language {
    let stored: string | null = null;
    try {
        stored = localStorage.getItem(STORAGE_KEY);
    } catch {
        console.warn("localStorage unavailable");
    }
    const saved = LANGUAGES.find(({ id }) => id === stored)?.id;
    if (saved) return saved;
    const preferred = navigator.languages?.length ? navigator.languages : [navigator.language];
    for (const code of preferred) {
        const language = toLanguage(code);
        if (language) return language;
    }
    return "en";
}
