import { DOMAIN_GROUP_TITLES, DOMAINS, WAF_DOMAIN, type DomainGroup } from "../../../domains.ts";
import type { BucketStatus, HealthLevel } from "../api.ts";
import { getLanguage, t, type Dictionary, type Language } from "../i18n.ts";

export const SITE_URL = "https://yummystatus.me";

export const countryCodes = [
    "RU",
    "UA",
    "KZ",
    "BY",
    "DE",
    "KG",
    "PL",
    "LV",
    "LT",
    "EE",
    "US",
    "NL",
    "GB",
    "MD",
    "CZ",
    "GE",
    "AM",
];

export const getCountryName = (code: string): string =>
    new Intl.DisplayNames([getLanguage()], { type: "region" }).of(code) ?? code;

const GROUP_TITLE_KEYS: Record<DomainGroup, keyof Dictionary> = {
    old: "domainGroupOld",
    new: "domainGroupNew",
    service: "domainGroupService",
};

export const domains = DOMAINS.map(({ name }) => name);

const domainLabelMap: { [value: string]: string } = Object.fromEntries(
    DOMAINS.map(({ name, label }) => [name, label])
);

export const getDomainLabel = (value: string): string =>
    value === WAF_DOMAIN ? t("domainWaf") : (domainLabelMap[value] ?? value);

export const getDomainGroups = () =>
    (Object.keys(DOMAIN_GROUP_TITLES) as DomainGroup[]).map((group) => ({
        id: group,
        title: t(GROUP_TITLE_KEYS[group]),
        domains: DOMAINS.filter((domain) => domain.group === group).map(
            ({ name }) => ({ value: name })
        ),
    }));

const CITY_NAMES: Record<Language, Record<string, string>> = {
    ru: {
        average: "Средняя",
        Moscow: "Москва",
        "Saint Petersburg": "Санкт-Петербург",
        Kyiv: "Киев",
        Dnipro: "Днепр",
        Odesa: "Одесса",
        Almaty: "Алматы",
        Minsk: "Минск",
        Berlin: "Берлин",
        Dusseldorf: "Дюссельдорф",
        Bishkek: "Бишкек",
        Warsaw: "Варшава",
        Krakow: "Краков",
        Riga: "Рига",
        Vilnius: "Вильнюс",
        Siauliai: "Шяуляй",
        Tallinn: "Таллин",
        "New York": "Нью-Йорк",
        "Los Angeles": "Лос-Анджелес",
        Amsterdam: "Амстердам",
        Utrecht: "Утрехт",
        London: "Лондон",
        Chisinau: "Кишинёв",
        Prague: "Прага",
        Brno: "Брно",
        Tbilisi: "Тбилиси",
        Yerevan: "Ереван",
        Novosibirsk: "Новосибирск",
        Aktau: "Актау",
    },
    uk: {
        average: "Середня",
        Moscow: "Москва",
        "Saint Petersburg": "Санкт-Петербург",
        Kyiv: "Київ",
        Dnipro: "Дніпро",
        Odesa: "Одеса",
        Almaty: "Алмати",
        Minsk: "Мінськ",
        Berlin: "Берлін",
        Dusseldorf: "Дюссельдорф",
        Bishkek: "Бішкек",
        Warsaw: "Варшава",
        Krakow: "Краків",
        Riga: "Рига",
        Vilnius: "Вільнюс",
        Siauliai: "Шяуляй",
        Tallinn: "Таллінн",
        "New York": "Нью-Йорк",
        "Los Angeles": "Лос-Анджелес",
        Amsterdam: "Амстердам",
        Utrecht: "Утрехт",
        London: "Лондон",
        Chisinau: "Кишинів",
        Prague: "Прага",
        Brno: "Брно",
        Tbilisi: "Тбілісі",
        Yerevan: "Єреван",
        Novosibirsk: "Новосибірськ",
        Aktau: "Актау",
    },
    en: { average: "Average" },
};

export const getCityLabel = (city: string): string =>
    CITY_NAMES[getLanguage()][city] ?? city;

export const CHART_SPIKE_MS = 2500;

export const isBareView = (): boolean =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("bare");

export const HEALTH_LABEL: Record<HealthLevel, keyof Dictionary> = {
    stable: "healthStable",
    warning: "healthWarning",
    critical: "healthCritical",
};

export const BUCKET_CLASS: Record<BucketStatus, string> = {
    UP: "green",
    DEGRADED_LOW: "darkGreen",
    DEGRADED_MEDIUM: "yellow",
    DEGRADED_HIGH: "orange",
    DOWN: "red",
    CAPTCHA: "blue",
    PROBE_ERROR: "grey",
};

export const CHART_COLORS = [
    "#ff6666",
    "#36a2eb",
    "#ffce56",
    "#4bc0c0",
    "#9966ff",
    "#ff9f40",
    "#E7E9ED",
    "#A8D08D", 
    "#C08497", 
    "#9D7CA0", 
    "#7EC0EE", 
]
