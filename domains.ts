export const DOMAINS = [
    {
        name: "old.yummyani.me",
        label: "old.yummyani.me",
        group: "old",
        apiKeyEnv: "GLOBALPING_API_KEY",
    },
    {
        name: "old.yummy-ani.me",
        label: "old.yummy-ani.me",
        group: "old",
        apiKeyEnv: "GLOBALPING_API_KEY4",
    },
    {
        name: "ru.yummyani.me",
        label: "new.yummyani.me",
        group: "new",
        apiKeyEnv: "GLOBALPING_API_KEY2",
    },
    {
        name: "ru.yummy-ani.me",
        label: "new.yummy-ani.me",
        group: "new",
        apiKeyEnv: "GLOBALPING_API_KEY3",
    },
    {
        name: "api.yani.tv",
        label: "API",
        group: "service",
        apiKeyEnv: "GLOBALPING_API_KEY6",
        path: "/feed",
    },
    {
        name: "waf.valtrix.org",
        label: "Защита",
        group: "service",
        apiKeyEnv: "GLOBALPING_API_KEY5",
        protocol: "HTTP",
    },
] as const satisfies readonly DomainConfig[];

export const DOMAIN_GROUP_TITLES = {
    old: "Старый сайт",
    new: "Новый сайт",
    service: "Служебные сервисы",
} as const;

export const API_DOMAIN = "api.yani.tv";
export const WAF_DOMAIN = "waf.valtrix.org";
export const ZONES = ["yummy-ani.me", "yummyani.me"] as const;

export const INTERNAL_STATUS = {
    PROBE_FAIL: 901,
    TIMEOUT: 902,
    DNS_ERROR: 903,
    API_LIMIT: 904,
    PROBE_OFFLINE: 905,
    CONN_REFUSED: 906,
    TLS_ERROR: 907,
    MEASUREMENT_TIMEOUT: 908,
} as const;

export const IGNORED_ERROR_CODES: ReadonlySet<number> = new Set([
    INTERNAL_STATUS.API_LIMIT,
    INTERNAL_STATUS.PROBE_OFFLINE,
]);

export type DomainGroup = keyof typeof DOMAIN_GROUP_TITLES;

export interface DomainConfig {
    name: string;
    label: string;
    group: DomainGroup;
    apiKeyEnv: string;
    path?: string;
    protocol?: "HTTP" | "HTTPS";
}

export const locationGroups = {
    "2min": [
        { country: "RU", city: "Moscow" },
        { country: "RU", city: "Saint Petersburg" },
        { country: "RU", city: "Novosibirsk" },
        { country: "UA", city: "Kyiv" },
        { country: "UA", city: "Lviv" },
        { country: "UA", city: "Odesa" },
        { country: "KZ", city: "Almaty" },
        { country: "KZ", city: "Aktau" },
        { country: "BY", city: "Minsk" },
    ],
    "6min": [
        { country: "DE", city: "Berlin" },
        { country: "DE", city: "Dusseldorf" },
        { country: "KG", city: "Bishkek" },
        { country: "PL", city: "Warsaw" },
        { country: "PL", city: "Krakow" },
        { country: "LV", city: "Riga" },
        { country: "LT", city: "Vilnius" },
        { country: "LT", city: "Siauliai" },
        { country: "EE", city: "Tallinn" },
        { country: "US", city: "New York" },
        { country: "US", city: "Los Angeles" },
        { country: "NL", city: "Amsterdam" },
        { country: "NL", city: "Utrecht" },
        { country: "GB", city: "London" },
        { country: "MD", city: "Chisinau" },
        { country: "CZ", city: "Prague" },
        { country: "CZ", city: "Brno" },
        { country: "GE", city: "Tbilisi" },
        { country: "AM", city: "Yerevan" },
    ],
} as const;
