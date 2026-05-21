import {
    createContext,
    useState,
    useContext,
    useEffect,
    useMemo,
    type ReactNode,
} from "react";

export const timeRangeOptions = [
    { value: "3hour", label: "3 часа" },
    { value: "day", label: "День" },
    { value: "week", label: "Неделя" },
    { value: "month", label: "Месяц" },
];

export interface DateRange {
    from: string; // ISO
    to: string;   // ISO
}

interface DashboardSettingsContextType {
    timeRange: string;
    setTimeRange: (value: string) => void;
    autoRefresh: boolean;
    setAutoRefresh: (value: boolean) => void;
    hideUnreliable: boolean;
    setHideUnreliable: (value: boolean) => void;
    dateRange: DateRange | null;
    setDateRange: (value: DateRange | null) => void;
    effectiveSpanMs: number;
    effectiveTimeRange: string;
}

const DashboardSettingsContext = createContext<
    DashboardSettingsContextType | undefined
>(undefined);

const TIME_RANGE_MS: Record<string, number> = {
    "3hour": 3 * 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
};

const spanToTimeRange = (spanMs: number): string => {
    const hour = 60 * 60 * 1000;
    if (spanMs <= 6 * hour) return "hour";
    if (spanMs <= 48 * hour) return "day";
    if (spanMs <= 10 * 24 * hour) return "week";
    return "month";
};

export const DashboardSettingsProvider = ({
    children,
}: {
    children: ReactNode;
}) => {
    const [timeRange, setTimeRange] = useState(
        () => localStorage.getItem("timeRange") || "3hour"
    );
    const [autoRefresh, setAutoRefresh] = useState(
        () => localStorage.getItem("autoRefresh") === "true"
    );
    const [hideUnreliable, setHideUnreliable] = useState(
        () => localStorage.getItem("hideUnreliable") === "true"
    );
    const [dateRange, setDateRange] = useState<DateRange | null>(() => {
        const raw = localStorage.getItem("dateRange");
        if (!raw) return null;
        try {
            const parsed = JSON.parse(raw);
            if (
                parsed &&
                typeof parsed.from === "string" &&
                typeof parsed.to === "string"
            ) {
                return parsed as DateRange;
            }
        } catch {
            // ignore
        }
        return null;
    });

    useEffect(() => {
        localStorage.setItem("timeRange", timeRange);
    }, [timeRange]);

    useEffect(() => {
        localStorage.setItem("autoRefresh", autoRefresh.toString());
    }, [autoRefresh]);

    useEffect(() => {
        localStorage.setItem("hideUnreliable", hideUnreliable.toString());
    }, [hideUnreliable]);

    useEffect(() => {
        if (dateRange) {
            localStorage.setItem("dateRange", JSON.stringify(dateRange));
        } else {
            localStorage.removeItem("dateRange");
        }
    }, [dateRange]);

    const { effectiveSpanMs, effectiveTimeRange } = useMemo(() => {
        if (dateRange) {
            const span = Math.max(
                0,
                new Date(dateRange.to).getTime() -
                    new Date(dateRange.from).getTime()
            );
            return {
                effectiveSpanMs: span,
                effectiveTimeRange: spanToTimeRange(span),
            };
        }
        const span = TIME_RANGE_MS[timeRange] ?? TIME_RANGE_MS["3hour"];
        return {
            effectiveSpanMs: span,
            effectiveTimeRange: timeRange === "3hour" ? "hour" : timeRange,
        };
    }, [dateRange, timeRange]);

    return (
        <DashboardSettingsContext.Provider
            value={{
                timeRange,
                setTimeRange,
                autoRefresh,
                setAutoRefresh,
                hideUnreliable,
                setHideUnreliable,
                dateRange,
                setDateRange,
                effectiveSpanMs,
                effectiveTimeRange,
            }}
        >
            {children}
        </DashboardSettingsContext.Provider>
    );
};

export const useDashboardSettings = () => {
    const ctx = useContext(DashboardSettingsContext);
    if (!ctx) {
        throw new Error(
            "useDashboardSettings must be used within a DashboardSettingsProvider"
        );
    }
    return ctx;
};
