import { t, type Dictionary } from "../i18n.ts";

export const REASONS = [
    { code: "not_loading", labelKey: "reasonNotLoading" },
    { code: "slow", labelKey: "reasonSlow" },
    { code: "no_media", labelKey: "reasonNoMedia" },
    { code: "freezing", labelKey: "reasonFreezing" },
    { code: "auth", labelKey: "reasonAuth" },
] as const satisfies readonly { code: string; labelKey: keyof Dictionary }[];

export type ReasonCode = (typeof REASONS)[number]["code"];

export const getReasonLabel = (code: string): string => {
    const reason = REASONS.find((r) => r.code === code);
    return reason ? t(reason.labelKey) : code;
};
