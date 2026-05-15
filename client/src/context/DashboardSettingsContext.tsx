import {
    createContext,
    useState,
    useContext,
    useEffect,
    type ReactNode,
} from "react";

export const timeRangeOptions = [
    { value: "3hour", label: "3 часа" },
    { value: "day", label: "День" },
    { value: "week", label: "Неделя" },
    { value: "month", label: "Месяц" },
];

interface DashboardSettingsContextType {
    timeRange: string;
    setTimeRange: (value: string) => void;
    autoRefresh: boolean;
    setAutoRefresh: (value: boolean) => void;
    hideUnreliable: boolean;
    setHideUnreliable: (value: boolean) => void;
}

const DashboardSettingsContext = createContext<
    DashboardSettingsContextType | undefined
>(undefined);

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

    useEffect(() => {
        localStorage.setItem("timeRange", timeRange);
    }, [timeRange]);

    useEffect(() => {
        localStorage.setItem("autoRefresh", autoRefresh.toString());
    }, [autoRefresh]);

    useEffect(() => {
        localStorage.setItem("hideUnreliable", hideUnreliable.toString());
    }, [hideUnreliable]);

    return (
        <DashboardSettingsContext.Provider
            value={{
                timeRange,
                setTimeRange,
                autoRefresh,
                setAutoRefresh,
                hideUnreliable,
                setHideUnreliable,
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
