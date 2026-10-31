import {
    type KeyboardEvent as ReactKeyboardEvent,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { ru } from "date-fns/locale";
import {
    addMonths,
    endOfDay,
    endOfMonth,
    format,
    isAfter,
    isSameDay,
    isSameMonth,
    isWithinInterval,
    startOfDay,
    startOfMonth,
    startOfWeek,
    endOfWeek,
    addDays,
} from "date-fns";
import { useDashboardSettings } from "../../context/DashboardSettingsContext.tsx";
import styles from "./DateRangePicker.module.scss";

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

const buildMonthDays = (month: Date): Date[] => {
    const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const days: Date[] = [];
    let cursor = gridStart;
    while (!isAfter(cursor, gridEnd)) {
        days.push(cursor);
        cursor = addDays(cursor, 1);
    }
    return days;
};

const padTwo = (n: number) => n.toString().padStart(2, "0");
const formatHm = (d: Date) => `${padTwo(d.getHours())}:${padTwo(d.getMinutes())}`;
const isFullDayWindow = (from: Date, to: Date) =>
    from.getHours() === 0 &&
    from.getMinutes() === 0 &&
    to.getHours() === 23 &&
    to.getMinutes() === 59;

const formatRangeLabel = (from: Date | null, to: Date | null): string => {
    if (!from || !to) return "Выбрать период";
    const sameYear = from.getFullYear() === to.getFullYear();
    if (isSameDay(from, to)) {
        const base = format(from, "d MMMM yyyy", { locale: ru });
        return isFullDayWindow(from, to)
            ? base
            : `${base}, ${formatHm(from)}–${formatHm(to)}`;
    }
    if (sameYear) {
        return `${format(from, "d MMM", { locale: ru })} — ${format(to, "d MMM yyyy", { locale: ru })}`;
    }
    return `${format(from, "d MMM yyyy", { locale: ru })} — ${format(to, "d MMM yyyy", { locale: ru })}`;
};

interface TimeFieldProps {
    value: string;
    onChange: (value: string) => void;
}

const TimeField = ({ value, onChange }: TimeFieldProps) => {
    const [hRaw, mRaw] = value.split(":");
    const [localH, setLocalH] = useState(hRaw ?? "00");
    const [localM, setLocalM] = useState(mRaw ?? "00");
    const minuteRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setLocalH(hRaw ?? "00");
    }, [hRaw]);
    useEffect(() => {
        setLocalM(mRaw ?? "00");
    }, [mRaw]);

    const commitHours = (raw: string) => {
        const num = parseInt(raw || "0", 10);
        const clamped = Math.max(0, Math.min(23, Number.isNaN(num) ? 0 : num));
        const v = padTwo(clamped);
        setLocalH(v);
        onChange(`${v}:${localM || "00"}`);
    };

    const commitMinutes = (raw: string) => {
        const num = parseInt(raw || "0", 10);
        const clamped = Math.max(0, Math.min(59, Number.isNaN(num) ? 0 : num));
        const v = padTwo(clamped);
        setLocalM(v);
        onChange(`${localH || "00"}:${v}`);
    };

    const handleHourKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        } else if (e.key === ":" || e.key === " " || e.key === "Tab") {
            if (e.key !== "Tab") {
                e.preventDefault();
                minuteRef.current?.focus();
                minuteRef.current?.select();
            }
        }
    };

    const handleMinuteKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            (e.target as HTMLInputElement).blur();
        }
    };

    return (
        <div className={styles.timeBox}>
            <input
                type="text"
                inputMode="numeric"
                maxLength={2}
                className={styles.timePart}
                value={localH}
                onChange={(e) =>
                    setLocalH(e.target.value.replace(/\D/g, "").slice(0, 2))
                }
                onBlur={(e) => commitHours(e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={handleHourKeyDown}
                aria-label="часы"
            />
            <span className={styles.timeColon}>:</span>
            <input
                ref={minuteRef}
                type="text"
                inputMode="numeric"
                maxLength={2}
                className={styles.timePart}
                value={localM}
                onChange={(e) =>
                    setLocalM(e.target.value.replace(/\D/g, "").slice(0, 2))
                }
                onBlur={(e) => commitMinutes(e.target.value)}
                onFocus={(e) => e.target.select()}
                onKeyDown={handleMinuteKeyDown}
                aria-label="минуты"
            />
        </div>
    );
};

const CalendarIcon = () => (
    <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
    >
        <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
        />
        <path
            d="M3 9H21"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M8 3V7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
        <path
            d="M16 3V7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        />
    </svg>
);

const DateRangePicker = () => {
    const { dateRange, setDateRange } = useDashboardSettings();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const initialFrom = dateRange ? new Date(dateRange.from) : null;
    const initialTo = dateRange ? new Date(dateRange.to) : null;

    const [pendingFrom, setPendingFrom] = useState<Date | null>(initialFrom);
    const [pendingTo, setPendingTo] = useState<Date | null>(initialTo);
    const [hoverDay, setHoverDay] = useState<Date | null>(null);
    const [viewMonth, setViewMonth] = useState<Date>(() =>
        startOfMonth(initialFrom ?? new Date())
    );

    useEffect(() => {
        if (dateRange) {
            const f = new Date(dateRange.from);
            const t = new Date(dateRange.to);
            setPendingFrom(f);
            setPendingTo(t);
            setViewMonth(startOfMonth(f));
        } else {
            setPendingFrom(null);
            setPendingTo(null);
        }
    }, [dateRange]);

    useEffect(() => {
        if (!isOpen) return;
        const onClick = (e: MouseEvent) => {
            if (!containerRef.current) return;
            if (!containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        const onEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        document.addEventListener("keydown", onEsc);
        return () => {
            document.removeEventListener("mousedown", onClick);
            document.removeEventListener("keydown", onEsc);
        };
    }, [isOpen]);

    const monthDays = useMemo(() => buildMonthDays(viewMonth), [viewMonth]);

    const today = useMemo(() => new Date(), []);

    const handleDayClick = (day: Date) => {
        const dayStart = startOfDay(day);
        if (pendingFrom && pendingTo) {
            setPendingFrom(dayStart);
            setPendingTo(null);
            setHoverDay(null);
            return;
        }
        if (!pendingFrom) {
            setPendingFrom(dayStart);
            return;
        }
        const fromStart = startOfDay(pendingFrom);
        if (isAfter(fromStart, dayStart)) {
            setPendingFrom(dayStart);
            setPendingTo(endOfDay(pendingFrom));
        } else {
            setPendingTo(endOfDay(day));
        }
    };

    useEffect(() => {
        if (!pendingFrom || !pendingTo) return;
        const aTs = pendingFrom.getTime();
        const bTs = pendingTo.getTime();
        const fromIso = new Date(Math.min(aTs, bTs)).toISOString();
        const toIso = new Date(Math.max(aTs, bTs)).toISOString();
        if (
            !dateRange ||
            dateRange.from !== fromIso ||
            dateRange.to !== toIso
        ) {
            setDateRange({ from: fromIso, to: toIso });
        }
    }, [pendingFrom, pendingTo, dateRange, setDateRange]);

    const setTimeOn = (date: Date, hhmm: string): Date | null => {
        const [hStr, mStr] = hhmm.split(":");
        const h = parseInt(hStr, 10);
        const m = parseInt(mStr, 10);
        if (Number.isNaN(h) || Number.isNaN(m)) return null;
        const out = new Date(date);
        out.setHours(h, m, 0, 0);
        return out;
    };

    const handleFromTimeChange = (hhmm: string) => {
        if (!pendingFrom) return;
        const next = setTimeOn(pendingFrom, hhmm);
        if (next) setPendingFrom(next);
    };

    const handleToTimeChange = (hhmm: string) => {
        if (!pendingTo) return;
        const next = setTimeOn(pendingTo, hhmm);
        if (next) setPendingTo(next);
    };

    const isSingleDay =
        pendingFrom !== null &&
        pendingTo !== null &&
        isSameDay(pendingFrom, pendingTo);

    const handleReset = () => {
        setPendingFrom(null);
        setPendingTo(null);
        setHoverDay(null);
        setDateRange(null);
    };

    const handlePrevMonth = () => setViewMonth(addMonths(viewMonth, -1));
    const handleNextMonth = () => setViewMonth(addMonths(viewMonth, 1));

    const rangeEnd =
        pendingTo ?? (pendingFrom && hoverDay ? hoverDay : null);

    const isInRange = (day: Date): boolean => {
        if (!pendingFrom || !rangeEnd) return false;
        const start = startOfDay(pendingFrom);
        const end = startOfDay(rangeEnd);
        if (isAfter(start, end)) {
            return isWithinInterval(day, { start: end, end: start });
        }
        return isWithinInterval(day, { start, end });
    };

    const buttonLabel = formatRangeLabel(
        dateRange ? new Date(dateRange.from) : null,
        dateRange ? new Date(dateRange.to) : null
    );

    const isActive = Boolean(dateRange);

    return (
        <div className={styles.container} ref={containerRef}>
            <button
                type="button"
                className={`${styles.trigger} ${isActive ? styles.triggerActive : ""}`}
                onClick={() => setIsOpen((v) => !v)}
                aria-expanded={isOpen}
            >
                <CalendarIcon />
                <span className={styles.triggerLabel}>{buttonLabel}</span>
                {isActive && (
                    <span
                        className={styles.clearIcon}
                        role="button"
                        aria-label="Сбросить период"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleReset();
                        }}
                    >
                        <svg
                            width="10"
                            height="10"
                            viewBox="0 0 10 10"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden
                        >
                            <path
                                d="M1.5 1.5L8.5 8.5M8.5 1.5L1.5 8.5"
                                stroke="currentColor"
                                strokeWidth="1.8"
                                strokeLinecap="round"
                            />
                        </svg>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className={styles.popover} role="dialog">
                    <div className={styles.header}>
                        <button
                            type="button"
                            className={styles.navButton}
                            onClick={handlePrevMonth}
                            aria-label="Предыдущий месяц"
                        >
                            ‹
                        </button>
                        <span className={styles.monthLabel}>
                            {format(viewMonth, "LLLL yyyy", { locale: ru })}
                        </span>
                        <button
                            type="button"
                            className={styles.navButton}
                            onClick={handleNextMonth}
                            aria-label="Следующий месяц"
                        >
                            ›
                        </button>
                    </div>

                    <div className={styles.weekdays}>
                        {WEEKDAYS.map((d) => (
                            <span key={d} className={styles.weekday}>
                                {d}
                            </span>
                        ))}
                    </div>

                    <div
                        className={styles.daysGrid}
                        onMouseLeave={() => setHoverDay(null)}
                    >
                        {monthDays.map((day) => {
                            const inMonth = isSameMonth(day, viewMonth);
                            const isToday = isSameDay(day, today);
                            const isFrom =
                                pendingFrom && isSameDay(day, pendingFrom);
                            const isTo = pendingTo && isSameDay(day, pendingTo);
                            const inRange = isInRange(day);
                            const isEdge = isFrom || isTo;
                            const isFuture = isAfter(
                                startOfDay(day),
                                startOfDay(today)
                            );

                            const classes = [
                                styles.day,
                                !inMonth ? styles.dayOutside : "",
                                isToday ? styles.dayToday : "",
                                inRange && !isEdge ? styles.dayInRange : "",
                                isEdge ? styles.daySelected : "",
                                isFrom ? styles.dayRangeStart : "",
                                isTo ? styles.dayRangeEnd : "",
                                isFuture ? styles.dayDisabled : "",
                            ]
                                .filter(Boolean)
                                .join(" ");

                            return (
                                <button
                                    type="button"
                                    key={day.toISOString()}
                                    className={classes}
                                    disabled={isFuture}
                                    onMouseEnter={() => setHoverDay(day)}
                                    onClick={() => handleDayClick(day)}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    {isSingleDay && pendingFrom && pendingTo && (
                        <div className={styles.timeRow}>
                            <div className={styles.timeField}>
                                <span className={styles.timeLabel}>с</span>
                                <TimeField
                                    value={formatHm(pendingFrom)}
                                    onChange={handleFromTimeChange}
                                />
                            </div>
                            <div className={styles.timeField}>
                                <span className={styles.timeLabel}>до</span>
                                <TimeField
                                    value={formatHm(pendingTo)}
                                    onChange={handleToTimeChange}
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.footer}>
                        <span className={styles.footerHint}>
                            {pendingFrom && !pendingTo
                                ? "Выберите конечную дату"
                                : pendingFrom && pendingTo
                                  ? isSingleDay
                                      ? `${format(pendingFrom, "d MMM yyyy", { locale: ru })}, ${formatHm(pendingFrom)}–${formatHm(pendingTo)}`
                                      : `${format(pendingFrom, "d MMM yyyy", { locale: ru })} — ${format(pendingTo, "d MMM yyyy", { locale: ru })}`
                                  : "Выберите начальную дату"}
                        </span>
                        <button
                            type="button"
                            className={styles.resetButton}
                            onClick={handleReset}
                        >
                            Сбросить
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;
