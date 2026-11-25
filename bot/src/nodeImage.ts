import { Resvg } from "@resvg/resvg-js";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import satori from "satori";
import { formatDuration } from "./diagnose.ts";

type Bucket = "up" | "down" | "empty";
type NodeImageInput = {
    countryCode: string;
    countryName: string;
    order: number | null;
    cause: "ru" | "local";
    resolved: boolean;
    kind?: "group_down" | "down";
    startedAt: Date;
    endedAt?: Date;
    buckets: Bucket[];
};

const WIDTH = 1200;
const HEIGHT = 675;
const DOWN = "#dc3545";
const UP = "#28a745";
const MUTED = "#8a8a8a";
const BUCKET_COLORS: Record<Bucket, string> = {
    up: UP,
    down: DOWN,
    empty: "#414141",
};
const FONTS = await Promise.all(
    (
        [
            [400, "Inter_400Regular"],
            [600, "Inter_600SemiBold"],
            [700, "Inter_700Bold"],
        ] as const
    ).map(async ([weight, file]) => ({
        name: "Inter",
        weight,
        style: "normal" as const,
        data: Buffer.from(
            await Bun.file(
                new URL(`../assets/fonts/${file}.ttf`, import.meta.url)
            ).arrayBuffer()
        ),
    }))
);

export async function renderNodeImage(
    input: NodeImageInput
): Promise<Uint8Array<ArrayBuffer>> {
    const svg = await satori(await buildTree(input), {
        width: WIDTH,
        height: HEIGHT,
        fonts: FONTS,
    });
    return new Uint8Array(new Resvg(svg).render().asPng());
}

async function buildTree(input: NodeImageInput): Promise<ReactElement> {
    const { resolved, cause, kind, startedAt, endedAt, buckets } = input;
    const word = resolved
        ? "восстановлен"
        : cause === "ru"
          ? "заблокирован"
          : "недоступен";
    const sub = resolved
        ? "Сервер снова доступен"
        : kind === "down"
          ? "Одиночный сервер, замены нет"
          : "Последний сервер в группе, замены нет";
    const duration = formatDuration(
        (endedAt ?? new Date()).getTime() - startedAt.getTime()
    );
    const facts =
        resolved && endedAt
            ? [
                  fact("Начало", `${time(startedAt)} МСК`),
                  fact("Конец", `${time(endedAt)} МСК`),
                  fact("Простой", duration),
              ]
            : [
                  fact("Начало", `${day(startedAt)}, ${time(startedAt)} МСК`),
                  fact("Длится", duration),
              ];

    return h(
        "div",
        {
            style: {
                width: WIDTH,
                height: HEIGHT,
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                backgroundColor: "#222",
                color: "#fff",
                fontFamily: "Inter",
                padding: "64px 72px 60px",
                boxSizing: "border-box",
            },
        },
        h(
            "div",
            { style: { display: "flex", alignItems: "center", gap: 24 } },
            h("img", {
                src: await flagSrc(input.countryCode),
                width: 96,
                height: 72,
                style: { borderRadius: 10 },
            }),
            h(
                "div",
                { style: { fontSize: 40, fontWeight: 600 } },
                `${input.countryName}${input.order ? ` #${input.order}` : ""}`
            )
        ),
        h(
            "div",
            { style: { display: "flex", flexDirection: "column" } },
            h(
                "div",
                {
                    style: {
                        display: "flex",
                        fontSize: 80,
                        fontWeight: 700,
                        lineHeight: 1.05,
                        letterSpacing: "-0.02em",
                        whiteSpace: "nowrap",
                    },
                },
                "Сервер VPN ",
                h("span", { style: { color: resolved ? UP : DOWN } }, word)
            ),
            h(
                "div",
                {
                    style: {
                        fontSize: 32,
                        color: "#bdbdbd",
                        marginTop: 18,
                        whiteSpace: "nowrap",
                    },
                },
                sub
            )
        ),
        h(
            "div",
            {
                style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: 28,
                },
            },
            h("div", { style: { display: "flex", gap: 56 } }, ...facts),
            h(
                "div",
                { style: { display: "flex", flexDirection: "column" } },
                h(
                    "div",
                    { style: { display: "flex", gap: 5, height: 48 } },
                    ...buckets.map((bucket) =>
                        h("div", {
                            style: {
                                flex: 1,
                                borderRadius: 4,
                                backgroundColor: BUCKET_COLORS[bucket],
                            },
                        })
                    )
                ),
                h(
                    "div",
                    {
                        style: {
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: 20,
                            color: MUTED,
                            marginTop: 12,
                        },
                    },
                    h("div", {}, "3 ч назад"),
                    h("div", {}, "сейчас")
                )
            )
        )
    );
}

function fact(label: string, value: string): ReactElement {
    return h(
        "div",
        {
            style: {
                display: "flex",
                flexDirection: "column",
                gap: 4,
                whiteSpace: "nowrap",
            },
        },
        h("div", { style: { fontSize: 22, color: MUTED } }, label),
        h("div", { style: { fontSize: 34, fontWeight: 600 } }, value)
    );
}

async function flagSrc(countryCode: string): Promise<string> {
    const svg = await Bun.file(
        new URL(
            import.meta.resolve(
                `flag-icons/flags/4x3/${countryCode.toLowerCase()}.svg`
            )
        )
    ).text();
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function time(date: Date): string {
    return date.toLocaleTimeString("ru-RU", {
        timeZone: "Europe/Moscow",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function day(date: Date): string {
    return date.toLocaleDateString("ru-RU", {
        timeZone: "Europe/Moscow",
        day: "numeric",
        month: "long",
    });
}

function h(
    type: string,
    props: {
        style?: CSSProperties;
        src?: string;
        width?: number;
        height?: number;
    },
    ...children: ReactNode[]
): ReactElement {
    return { type, key: null, props: { ...props, children } };
}
