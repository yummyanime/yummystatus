import assert from "node:assert/strict";
import {
    API_DOMAIN,
    DOMAINS,
    INTERNAL_STATUS,
    WAF_DOMAIN,
    ZONES,
} from "../../domains.ts";
import type { HealthReport } from "./api.ts";

type DomainReport = HealthReport["domains"][number];
type CauseKey = keyof typeof CAUSES;

interface CauseInfo {
    key: CauseKey;
    emoji: string;
    title: string;
    detail: string;
}

export interface Diagnosis {
    affected: {
        domain: string;
        label: string;
        failRate: number;
        reason: string;
    }[];
    cause: CauseInfo;
    localizedTo: string | null;
}

const SITE_DOMAINS: string[] = DOMAINS.filter(
    (entry) => entry.group !== "service"
).map((entry) => entry.name);
const OK_CODES = [200, 202];
const MAX_LISTED_DOMAINS = 6;
const CAPTION_LIMIT = 1024;

const ERROR_CLASSES: { label: string; match: (code: number) => boolean }[] = [
    {
        label: "таймауты",
        match: (code) =>
            code === INTERNAL_STATUS.TIMEOUT ||
            code === INTERNAL_STATUS.MEASUREMENT_TIMEOUT,
    },
    {
        label: "DNS не резолвится",
        match: (code) => code === INTERNAL_STATUS.DNS_ERROR,
    },
    {
        label: "соединение отклоняется",
        match: (code) => code === INTERNAL_STATUS.CONN_REFUSED,
    },
    {
        label: "ошибка TLS",
        match: (code) => code === INTERNAL_STATUS.TLS_ERROR,
    },
    {
        label: "проба не прошла",
        match: (code) => code === INTERNAL_STATUS.PROBE_FAIL,
    },
    {
        label: "ошибки сервера (5xx)",
        match: (code) => code >= 500 && code < 600,
    },
    {
        label: "блокировка (403/429)",
        match: (code) => code === 403 || code === 429,
    },
    { label: "ответы 4xx", match: (code) => code >= 400 && code < 500 },
    { label: "редиректы (3xx)", match: (code) => code >= 300 && code < 400 },
];

const CAUSES = {
    ddos: {
        emoji: "⚡",
        title: "Серьёзная DDoS-атака",
        detail: "Недоступны все домены вместе с узлом защиты — трафик не доходит",
    },
    origin: {
        emoji: "🧨",
        title: "Отказ origin-инфраструктуры",
        detail: "Защита отвечает, источник — нет: бэкенд, БД или сеть ЦОД.",
    },
    waf: {
        emoji: "🛡",
        title: "Сбой узла защиты",
        detail: "Проблема на waf.valtrix.org — фильтрация или маршрутизация трафика.",
    },
    api: {
        emoji: "🔌",
        title: "Сбой API-бэкенда",
        detail: "Страницы открываются, данные не приходят: api.yani.tv не отвечает.",
    },
    zone: {
        emoji: "🌐",
        title: "Проблема доменной зоны",
        detail: "Упала целиком одна зона — DNS/NS, сертификат или блокировка зеркала.",
    },
    frontend: {
        emoji: "🖥",
        title: "Сбой фронтенда",
        detail: "Затронута одна версия сайта",
    },
    partial: {
        emoji: "📉",
        title: "Точечная деградация",
        detail: "Отвечает часть доменов и локаций — сбой не охватывает всю инфраструктуру.",
    },
};

export const diagnose = (report: HealthReport): Diagnosis => {
    const affected = report.domains
        .filter((entry) => entry.health === "critical")
        .map((entry) => ({
            domain: entry.domain,
            label: entry.label,
            failRate: entry.measurements
                ? entry.failures / entry.measurements
                : 0,
            reason: dominantReason(entry),
        }))
        .sort((a, b) => b.failRate - a.failRate);

    const failuresByCountry = dominant(
        Object.entries(report.failuresByCountry)
    );
    const localizedTo =
        report.countries.length > 1 &&
        report.failures > 0 &&
        failuresByCountry.count / report.failures >= 0.85
            ? failuresByCountry.value
            : null;

    return {
        affected,
        cause: pickCause(new Set(affected.map((entry) => entry.domain))),
        localizedTo,
    };
};

export const formatDuration = (ms: number): string => {
    const minutes = Math.max(1, Math.round(ms / 60000));
    if (minutes < 60) return `${minutes} мин`;
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return rest ? `${hours} ч ${rest} мин` : `${hours} ч`;
};

export const buildBody = (diagnosis: Diagnosis): string => {
    const { affected, cause, localizedTo } = diagnosis;

    const listed = affected.slice(0, MAX_LISTED_DOMAINS);
    const hidden = affected.length - listed.length;
    const lines = listed.map(
        (entry) =>
            `• <code>${entry.label}</code> — ${percent(entry.failRate)} сбоев · ${entry.reason}`
    );
    if (hidden > 0) lines.push(`• и ещё ${hidden}`);

    const geo = localizedTo
        ? `\n<i>Сбои сосредоточены в ${localizedTo} — вероятна блокировка или маршрутизация у операторов.</i>`
        : "";

    return [
        `<b>Затронуто</b>`,
        lines.join("\n") || "• нет данных",
        ``,
        `${cause.emoji} <b>${cause.title}</b>`,
        `<i>${cause.detail}</i>${geo}`,
    ].join("\n");
};

export const buildAlert = (
    body: string,
    startedAt: Date,
    { at, resolved = false }: { at: Date; resolved?: boolean }
): string => {
    const duration = formatDuration(at.getTime() - startedAt.getTime());
    const header = resolved
        ? [
              `✅ <b>Восстановлено</b>`,
              `Начало: ${moscow(startedAt)} МСК`,
              `Конец: ${moscow(at)} МСК`,
              `Инцидент длился ${duration}`,
          ]
        : [
              `🔴 <b>Неполадки</b>`,
              `Начало: ${moscow(startedAt)} МСК`,
              `Инцидент длится ${duration}`,
          ];

    return `${header.join("\n")}\n\n${body}`.slice(0, CAPTION_LIMIT);
};

function classifyFailure(code: number): string {
    if (OK_CODES.includes(code)) return "медленные ответы";
    const found = ERROR_CLASSES.find((entry) => entry.match(code));
    return found ? found.label : `код ${code}`;
}

function dominantReason(entry: DomainReport): string {
    const classes = new Map<string, number>();
    for (const [code, count] of Object.entries(entry.failureCodes)) {
        const label = classifyFailure(Number(code));
        classes.set(label, (classes.get(label) ?? 0) + count);
    }
    return dominant([...classes]).value ?? "сбой";
}

function dominant(entries: [string, number][]): {
    value: string | null;
    count: number;
} {
    let best: string | null = null;
    let bestCount = 0;
    for (const [value, count] of entries) {
        if (count > bestCount) {
            best = value;
            bestCount = count;
        }
    }
    return { value: best, count: bestCount };
}

function zoneOf(domain: string): string | null {
    return ZONES.find((zone) => domain.endsWith(zone)) ?? null;
}

function pickCause(names: Set<string>): CauseInfo {
    const has = (domain: string) => names.has(domain);
    const allSites = SITE_DOMAINS.every(has);

    if (allSites && has(WAF_DOMAIN)) return { key: "ddos", ...CAUSES.ddos };
    if (allSites) return { key: "origin", ...CAUSES.origin };
    if (names.size === 1 && has(WAF_DOMAIN))
        return { key: "waf", ...CAUSES.waf };
    if (names.size === 1 && has(API_DOMAIN))
        return { key: "api", ...CAUSES.api };

    const siteNames = [...names].filter((name) => SITE_DOMAINS.includes(name));
    if (siteNames.length === names.size && siteNames.length > 1) {
        for (const zone of ZONES) {
            const zoneDomains = SITE_DOMAINS.filter((d) => zoneOf(d) === zone);
            if (
                siteNames.length === zoneDomains.length &&
                zoneDomains.every(has)
            ) {
                return { key: "zone", ...CAUSES.zone };
            }
        }
        for (const prefix of ["old.", "ru."]) {
            const versionDomains = SITE_DOMAINS.filter((d) =>
                d.startsWith(prefix)
            );
            if (
                siteNames.length === versionDomains.length &&
                versionDomains.every(has)
            ) {
                return { key: "frontend", ...CAUSES.frontend };
            }
        }
    }

    return { key: "partial", ...CAUSES.partial };
}

export function moscow(date: Date): string {
    return date
        .toLocaleString("ru-RU", {
            timeZone: "Europe/Moscow",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
        .replace(", ", " ");
}

function percent(value: number): string {
    return `${Math.round(value * 100)}%`;
}

if (import.meta.main) {
    const start = new Date("2026-08-16T10:00:00Z");
    const allDomains = [...SITE_DOMAINS, API_DOMAIN, WAF_DOMAIN];

    const build = (
        downDomains: string[],
        {
            code = 502,
            slow = [],
            extraCountries = [],
        }: { code?: number; slow?: string[]; extraCountries?: string[] } = {}
    ): HealthReport => {
        const domains: DomainReport[] = allDomains.map((domain) => {
            const failureCodes: Record<string, number> = downDomains.includes(
                domain
            )
                ? { [code]: 10 }
                : slow.includes(domain)
                  ? { "200": 10 }
                  : {};
            const failures = Object.values(failureCodes).reduce(
                (sum, count) => sum + count,
                0
            );
            return {
                domain,
                label: domain,
                health: failures ? "critical" : "stable",
                measurements: 10,
                failures,
                failureCodes,
                buckets: [],
            };
        });
        const failures = domains.reduce((sum, d) => sum + d.failures, 0);
        return {
            updatedAt: start.toISOString(),
            health: failures ? "critical" : "stable",
            statusCounts: {
                UP: 0,
                DEGRADED_LOW: 0,
                DEGRADED_MEDIUM: 0,
                DEGRADED_HIGH: 0,
                DOWN: 0,
                CAPTCHA: 0,
                PROBE_ERROR: 0,
            },
            measurements: domains.length * 10,
            failures,
            countries: ["RU", ...extraCountries],
            failuresByCountry: failures ? { RU: failures } : {},
            domains,
        };
    };

    const causeOf = (downDomains: string[]) =>
        diagnose(build(downDomains)).cause.key;

    assert.equal(causeOf([...SITE_DOMAINS, API_DOMAIN, WAF_DOMAIN]), "ddos");
    assert.equal(causeOf([...SITE_DOMAINS, API_DOMAIN]), "origin");
    assert.equal(causeOf([WAF_DOMAIN]), "waf");
    assert.equal(causeOf([API_DOMAIN]), "api");
    assert.equal(causeOf(["old.yummy-ani.me", "ru.yummy-ani.me"]), "zone");
    assert.equal(causeOf(["old.yummyani.me", "old.yummy-ani.me"]), "frontend");
    assert.equal(causeOf(["ru.yummyani.me"]), "partial");
    assert.equal(causeOf([]), "partial");

    const timeouts = diagnose(
        build([API_DOMAIN], { code: INTERNAL_STATUS.TIMEOUT })
    );
    assert.equal(timeouts.affected[0]?.reason, "таймауты");
    assert.equal(timeouts.affected[0]?.failRate, 1);

    const slow = diagnose(build([], { slow: [WAF_DOMAIN] }));
    assert.equal(slow.cause.key, "waf");
    assert.equal(slow.affected[0]?.reason, "медленные ответы");

    const mixedGeo = build([API_DOMAIN], { extraCountries: ["UA"] });
    assert.equal(diagnose(mixedGeo).localizedTo, "RU");

    const body = buildBody(diagnose(build([...SITE_DOMAINS, WAF_DOMAIN])));
    assert.ok(body.includes("Серьёзная DDoS-атака"));
    assert.ok(!body.includes("замеров"));

    const ongoing = buildAlert(body, start, {
        at: new Date(start.getTime() + 25 * 60000),
    });
    assert.ok(
        ongoing.startsWith(
            "🔴 <b>Неполадки</b>\nНачало: 16.08.2026 13:00 МСК\nИнцидент длится 25 мин\n\n<b>Затронуто</b>"
        )
    );
    assert.ok(ongoing.endsWith("</i>"));

    const resolved = buildAlert(body, start, {
        at: new Date(start.getTime() + 90 * 60000),
        resolved: true,
    });
    assert.ok(
        resolved.startsWith(
            "✅ <b>Восстановлено</b>\nНачало: 16.08.2026 13:00 МСК\nКонец: 16.08.2026 14:30 МСК\nИнцидент длился 1 ч 30 мин\n\n<b>Затронуто</b>"
        )
    );

    const long = buildAlert("x".repeat(CAPTION_LIMIT), start, { at: start });
    assert.equal(long.length, CAPTION_LIMIT);

    console.log("diagnose: все проверки пройдены");
}
