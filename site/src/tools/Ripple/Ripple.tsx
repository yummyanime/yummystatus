import {
    useCallback,
    useEffect,
    useRef,
    useState,
    forwardRef,
    type RefObject,
    type ForwardedRef,
    type ReactNode,
    type DetailedHTMLProps,
    type HTMLAttributes,
    type TouchEvent,
    type MouseEvent,
    type DragEvent,
} from "react";
import styles from "./Ripple.module.scss";

const { end, ripple, rippleable, rippleWrapper } = styles;
type TouchData = { x: number; y: number };
type TagName = "div" | "li" | "a" | "button";
type Props<T> = {
    children: ReactNode;
    onRipple?: (e: HTMLDivElement) => boolean;
    tag?: TagName | unknown;
    href?: string;
    target?: string;
    type?: "submit";
} & DetailedHTMLProps<HTMLAttributes<T>, T>;

const Ripple = forwardRef(function Materiable(
    {
        children,
        onRipple,
        tag,
        className,
        onTouchStart: propOnTouchStart,
        onTouchEnd: propOnTouchEnd,
        onMouseDown: propOnMouseDown,
        onMouseUp: propOnMouseUp,
        onDragStart: propOnDragStart,
        onContextMenu,
        ...restProps
    }: Props<HTMLDivElement>,
    forwardedRef: ForwardedRef<HTMLDivElement>,
) {
    const [touchData, setTouchData] = useState<TouchData | null>(null);
    const [start, setStart] = useState<HTMLDivElement | null>(null);
    const [ignoreRipple, setIgnoreRipple] = useState(false);
    const internalRef = useRef<HTMLDivElement>(null);
    const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const MOVE_THRESHOLD = 10;
    const computedClassName = [className, rippleable].filter(Boolean).join(" ");
    const CustomTag = (tag ?? "div") as "div";

    const handleDocumentEvents = useCallback(
        (e: Event) => {
            const currentRef = internalRef.current;
            if (currentRef?.contains(e.target as Node) || currentRef === e.target) return;
            setTouchData(null);
        },
        [internalRef],
    );

    useEffect(() => {
        if (start) {
            document.addEventListener("mouseup", handleDocumentEvents);
            document.addEventListener("drag", handleDocumentEvents);
            document.addEventListener("touchend", handleDocumentEvents);
            document.addEventListener("scroll", handleDocumentEvents);

            const ev =
                onRipple &&
                setInterval(() => {
                    if (!onRipple!(start!)) {
                        setStart(null);
                        setTouchData(null);
                    }
                }, 50);
            return () => {
                ev && clearTimeout(ev);
                document.removeEventListener("mouseup", handleDocumentEvents);
                document.removeEventListener("drag", handleDocumentEvents);
                document.removeEventListener("touchend", handleDocumentEvents);
                document.removeEventListener("scroll", handleDocumentEvents);
            };
        }
    }, [start, handleDocumentEvents, onRipple]);

    return (
        <CustomTag
            {...restProps}
            ref={useCallback(
                (r: HTMLDivElement) => {
                    (internalRef as { current: unknown }).current = r;
                    if (forwardedRef instanceof Function) forwardedRef(r);
                    else if (forwardedRef) forwardedRef.current = r;
                },
                [forwardedRef],
            )}
            onTouchStart={useCallback(
                (e: TouchEvent<unknown>) => {
                    if (onRipple && !onRipple(e.target as HTMLDivElement)) return;
                    if ((e.target as HTMLDivElement).closest("." + rippleable) !== internalRef.current) return;
                    propOnTouchStart?.(e as unknown as TouchEvent<HTMLDivElement>);
                    const x = e.touches[0].clientX;
                    const y = e.touches[0].clientY;
                    const target = e.target as HTMLDivElement;
                    touchStartPos.current = { x, y };
                    if (touchTimerRef.current) clearTimeout(touchTimerRef.current);
                    touchTimerRef.current = setTimeout(() => {
                        touchTimerRef.current = null;
                        setTouchData((prev) => {
                            if (prev != null) {
                                setTimeout(() => setTouchData({ x, y }), 0);
                                return null;
                            }
                            return { x, y };
                        });
                        setStart(target);
                    }, 80);
                },
                [onRipple, propOnTouchStart],
            )}
            onTouchMove={useCallback((e: TouchEvent<unknown>) => {
                if (!touchStartPos.current || !touchTimerRef.current) return;
                const dx = e.touches[0].clientX - touchStartPos.current.x;
                const dy = e.touches[0].clientY - touchStartPos.current.y;
                if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
                    clearTimeout(touchTimerRef.current);
                    touchTimerRef.current = null;
                    touchStartPos.current = null;
                }
            }, [])}
            onContextMenu={useCallback(
                (ev: MouseEvent<HTMLDivElement>) => {
                    onContextMenu?.(ev);
                    setTouchData(null);
                },
                [onContextMenu],
            )}
            onTouchEnd={useCallback(
                (e: TouchEvent) => {
                    propOnTouchEnd?.(e as unknown as TouchEvent<HTMLDivElement>);
                    if (touchTimerRef.current) {
                        clearTimeout(touchTimerRef.current);
                        touchTimerRef.current = null;
                        if (touchStartPos.current) {
                            const { x, y } = touchStartPos.current;
                            setTouchData({ x, y });
                        }
                    }
                    touchStartPos.current = null;
                    setStart(null);
                    setIgnoreRipple(true);
                    setTimeout(() => setIgnoreRipple(false), 400);
                },
                [propOnTouchEnd],
            )}
            onMouseDown={useCallback(
                (e: MouseEvent) => {
                    propOnMouseDown?.(e as unknown as MouseEvent<HTMLDivElement>);
                    if (ignoreRipple) {
                        e.preventDefault();
                        return;
                    }
                    if (onRipple && !onRipple(e.target as HTMLDivElement)) return;
                    if ((e.target as HTMLDivElement).closest("." + rippleable) !== internalRef.current) return;
                    if (e.button == 0) {
                        if (touchData != null) {
                            setTouchData(null);
                            setTimeout(
                                () =>
                                    setTouchData({
                                        x: e.clientX,
                                        y: e.clientY,
                                    }),
                                0,
                            );
                        } else setTouchData({ x: e.clientX, y: e.clientY });
                        setStart(e.target as HTMLDivElement);
                    }
                },
                [ignoreRipple, onRipple, propOnMouseDown, touchData],
            )}
            onMouseUp={useCallback(
                (e: MouseEvent) => {
                    propOnMouseUp?.(e as unknown as MouseEvent<HTMLDivElement>);
                    setStart(null);
                },
                [propOnMouseUp],
            )}
            onDragStart={useCallback(
                (e: DragEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    propOnDragStart?.(e);
                },
                [propOnDragStart],
            )}
            className={computedClassName}
        >
            {children}
            {touchData !== null && (
                <RippleEffect
                    data={touchData!}
                    onRemove={() => setTouchData(null)}
                    parent={internalRef as RefObject<HTMLElement>}
                    start={!!start}
                />
            )}
        </CustomTag>
    );
});

function RippleEffect({
    data,
    parent,
    onRemove,
    start,
}: {
    data: TouchData;
    parent: RefObject<HTMLElement>;
    onRemove: () => unknown;
    start: boolean;
}) {
    const { x: touchX, y: touchY } = data;
    const [ending, setEnding] = useState(false);
    const thisWidth = parent.current?.clientWidth ?? 0,
        thisHeight = parent.current?.clientHeight ?? 0;

    const borderRadius = parent.current ? window.getComputedStyle(parent.current!).borderRadius : 0;
    const diameter = Math.min(Math.max(thisWidth, thisHeight), 100);
    const radius = diameter / 2;
    const bounds = parent.current?.getBoundingClientRect() ?? {
        left: 0,
        top: 0,
    };
    const left = touchX - bounds.left - radius;
    const top = touchY - bounds.top! - radius;

    useEffect(() => {
        if (!start && !ending) {
            const delay = setTimeout(() => setEnding(true), 0);
            return () => clearTimeout(delay);
        }
    }, [start, ending]);

    useEffect(() => {
        const removeTimeout = ending ? setTimeout(onRemove, 600) : 0;
        const secondTimeout = setTimeout(() => {
            document.addEventListener("mousedown", onRemove);
            document.addEventListener("touchstart", onRemove);
        }, 10);
        return () => {
            document.removeEventListener("mousedown", onRemove);
            document.removeEventListener("touchstart", onRemove);
            clearTimeout(removeTimeout);
            clearTimeout(secondTimeout);
        };
    }, [onRemove, ending]);
    return (
        <span
            className={rippleWrapper}
            style={{
                width: thisWidth + "px",
                height: thisHeight + "px",
                borderRadius: borderRadius,
            }}
        >
            <span
                className={[ripple, ending && end].filter(Boolean).join(" ")}
                style={{
                    width: diameter + "px",
                    height: diameter + "px",
                    left: left + "px",
                    top: top + "px",
                    cursor: parent.current?.style.cursor ?? "default",
                }}
            />
        </span>
    );
}

export default Ripple;
