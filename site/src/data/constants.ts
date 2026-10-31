import { DOMAIN_GROUP_TITLES, DOMAINS } from "../../../domains.ts";
import type { BucketStatus, HealthLevel } from "../api.ts";

export const SITE_URL = "https://yummystatus.me";

export const countries = [
    { code: "RU", name: "Россия" },
    { code: "UA", name: "Украина" },
    { code: "KZ", name: "Казахстан" },
    { code: "BY", name: "Беларусь" },
    { code: "DE", name: "Германия" },
    { code: "KG", name: "Кыргызстан" },
    { code: "PL", name: "Польша" },
    { code: "LV", name: "Латвия" },
    { code: "LT", name: "Литва" },
    { code: "EE", name: "Эстония" },
    { code: "US", name: "США" },
    { code: "NL", name: "Нидерланды" },
    { code: "GB", name: "Великобритания" },
    { code: "MD", name: "Молдова" },
    { code: "CZ", name: "Чехия" },
    { code: "GE", name: "Грузия" },
    { code: "AM", name: "Армения" },
];

export const domainGroups = Object.entries(DOMAIN_GROUP_TITLES).map(
    ([group, title]) => ({
        title,
        domains: DOMAINS.filter((domain) => domain.group === group).map(
            ({ name, label }) => ({ value: name, label })
        ),
    })
);

export const domains = DOMAINS.map(({ name }) => name);

const domainLabelMap: { [value: string]: string } = Object.fromEntries(
    DOMAINS.map(({ name, label }) => [name, label])
);

export const getDomainLabel = (value: string): string =>
    domainLabelMap[value] ?? value;

export const cityTranslations: { [key: string]: string } = {
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
};

export const CHART_SPIKE_MS = 2500;

export const isBareView = (): boolean =>
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("bare");

export const HEALTH_LABEL: Record<HealthLevel, string> = {
    stable: "Все работает стабильно",
    warning: "Возможные неполадки",
    critical: "Возникли неполадки",
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
