import React from "react";
import type { BucketStatus, HealthReport } from "../../../../api.ts";
import { HEALTH_LABEL } from "../../../../data/constants.ts";
import { useLanguage } from "../../../../i18n.ts";
import OverviewDonut from "../../../OverviewDonut/OverviewDonut.tsx";

interface OverviewStatusProps {
    health: HealthReport;
}

const COLOR_VALUE: Record<BucketStatus, string> = {
    UP: "var(--color-green)",
    DEGRADED_LOW: "var(--color-dark-green)",
    DEGRADED_MEDIUM: "var(--color-yellow)",
    DEGRADED_HIGH: "#fd7e14",
    DOWN: "var(--color-red)",
    PROBE_ERROR: "#adb5bd",
    CAPTCHA: "var(--color-blue)",
};

const COLOR_ORDER: BucketStatus[] = [
    "UP",
    "DEGRADED_LOW",
    "DEGRADED_MEDIUM",
    "DEGRADED_HIGH",
    "DOWN",
    "CAPTCHA",
    "PROBE_ERROR",
];

const OverviewStatus: React.FC<OverviewStatusProps> = ({ health }) => {
    const { t, tn } = useLanguage();
    const colorLabel: Record<BucketStatus, string> = {
        UP: t("overviewStatusUp"),
        DEGRADED_LOW: tn("overviewCitiesIssues", 1),
        DEGRADED_MEDIUM: tn("overviewCitiesIssues", 2),
        DEGRADED_HIGH: t("overviewCitiesIssuesMany"),
        DOWN: t("overviewStatusDown"),
        CAPTCHA: t("overviewStatusCaptcha"),
        PROBE_ERROR: t("overviewStatusProbeError"),
    };

    return (
        <OverviewDonut
            level={health.health}
            badge={t(HEALTH_LABEL[health.health])}
            caption={t("overviewSamples")}
            segments={COLOR_ORDER.map((c) => ({
                key: c,
                color: COLOR_VALUE[c],
                label: colorLabel[c],
                count: health.statusCounts[c],
            }))}
        />
    );
};

export default OverviewStatus;
