import classNames from "classnames";
import {
    createContext,
    type HTMLAttributes,
    type MouseEvent,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import { createPortal, flushSync } from "react-dom";
import { useBackStack } from "../../hooks/useBackStack.ts";
import { hasInAppEntry, TOUCH_QUERY } from "../../hooks/useHashDialog.ts";
import styles from "./Dialog.module.scss";

type Kind = "sheet" | "dialog" | "popover";
type Snap = "half" | "full";

type DialogProps = Omit<HTMLAttributes<HTMLDivElement>, "children" | "popover"> & {
    children: ReactNode;
    onClose: () => void;
    closing?: boolean;
    anchor?: HTMLElement | null;
    popover?: boolean;
    beside?: boolean;
    expandable?: boolean;
};

type OverlayProps = Omit<DialogProps, "popover"> & { kind: Kind };

const CloseContext = createContext<() => void>(() => {});

let closedAt = 0;

function Dialog({ popover, ...props }: DialogProps) {
    const touch = useSyncExternalStore(subscribeTouch, getTouch, () => null);
    const kind: Kind | null =
        touch === null ? null : popover || (props.anchor && !touch) ? "popover" : touch ? "sheet" : "dialog";
    const [prevClosing, setPrevClosing] = useState(props.closing);
    const [generation, setGeneration] = useState(0);
    if (props.closing !== prevClosing) {
        setPrevClosing(props.closing);
        if (prevClosing && !props.closing) setGeneration(generation + 1);
    }
    return kind && createPortal(<Overlay key={generation} kind={kind} {...props} />, document.body);
}

function Overlay({ kind, children, onClose, closing, anchor, beside, expandable, className, ...rest }: OverlayProps) {
    const rootRef = useRef<HTMLDivElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const insideRef = useRef(false);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;
    const [shut, setShut] = useState(false);
    const [snap, setSnap] = useState<Snap>("half");
    const close = useCallback(() => setShut(true), []);
    const leaving = shut || !!closing;

    useBackStack(() => (kind === "sheet" && closing !== undefined && hasInAppEntry() ? history.back() : close()));

    useLayoutEffect(() => {
        const rootEl = rootRef.current;
        if (kind === "popover" || !rootEl) return;
        if (
            performance.now() - closedAt < 100 ||
            document.querySelector("body > [data-state=closing]:not([data-kind=popover])")
        )
            rootEl.dataset.instant = "";
        return () => {
            closedAt = performance.now();
        };
    }, [kind]);

    useLayoutEffect(() => {
        const rootEl = rootRef.current;
        const panelEl = panelRef.current;
        if (kind !== "sheet" || !leaving || !rootEl || !panelEl || rootEl.dataset.motion === "dismiss") return;
        rootEl.style.setProperty("--y", `${currentY(panelEl)}px`);
        rootEl.dataset.motion = "exit";
    }, [kind, leaving]);

    useEffect(() => {
        const panelEl = panelRef.current;
        if (!shut || !panelEl) return;
        if (kind === "popover") {
            onCloseRef.current();
            return;
        }
        const controller = new AbortController();
        const { signal } = controller;
        let timer = 0;
        const finish = () => {
            clearTimeout(timer);
            controller.abort();
            onCloseRef.current();
        };
        const onEnd = (e: Event) => e.target === panelEl && finish();
        panelEl.addEventListener("animationend", onEnd, { signal });
        panelEl.addEventListener("transitionend", onEnd, { signal });
        timer = window.setTimeout(finish, 400);
        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [shut, kind]);

    useEffect(() => {
        const rootEl = rootRef.current;
        const panelEl = panelRef.current;
        if (kind !== "sheet" || !rootEl || !panelEl) return;
        return bindSheetGesture(rootEl, panelEl, !!expandable, setSnap, close);
    }, [kind, expandable, close]);

    useEffect(() => {
        if (kind !== "popover") return;
        const onPointerDown = (e: PointerEvent) => {
            insideRef.current = false;
            setTimeout(() => {
                const onAnchor = e.target instanceof Node && !!anchor?.contains(e.target);
                if (!insideRef.current && !onAnchor) close();
            });
        };
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [kind, anchor, close]);

    useLayoutEffect(() => {
        const panelEl = panelRef.current;
        if (kind !== "popover" || !anchor || !panelEl) return;
        let frame = 0;
        const place = () => {
            const rect = anchor.getBoundingClientRect();
            const { offsetWidth: w, offsetHeight: h } = panelEl;
            const { innerWidth, innerHeight } = window;
            const x = beside
                ? rect.right + w + 16 <= innerWidth
                    ? rect.right + 8
                    : rect.left - w - 8
                : rect.right - w;
            const y = beside
                ? rect.top
                : computePlacement(anchor, h)?.placement === "top"
                  ? rect.top - h - 8
                  : rect.bottom + 8;
            panelEl.style.translate = `${clampToViewport(x, innerWidth - w)}px ${beside ? clampToViewport(y, innerHeight - h) : y}px`;
        };
        const schedule = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(place);
        };
        const onScroll = (e: Event) => e.target instanceof Node && !panelEl.contains(e.target) && schedule();
        const observer = new ResizeObserver(schedule);
        place();
        observer.observe(panelEl);
        window.addEventListener("scroll", onScroll, { capture: true, passive: true });
        window.addEventListener("resize", schedule);
        return () => {
            cancelAnimationFrame(frame);
            observer.disconnect();
            window.removeEventListener("scroll", onScroll, true);
            window.removeEventListener("resize", schedule);
        };
    }, [kind, anchor, beside]);

    return (
        <CloseContext.Provider value={close}>
            <div
                ref={rootRef}
                className={styles.root}
                data-kind={kind}
                data-state={leaving ? "closing" : undefined}
                onClick={(e) => e.stopPropagation()}
                onPointerDownCapture={() => {
                    insideRef.current = true;
                }}
                onMouseDown={kind === "popover" ? keepFocus : undefined}
            >
                {kind !== "popover" && <div className={styles.backdrop} onClick={close} />}
                <div
                    {...rest}
                    ref={panelRef}
                    className={classNames(styles.panel, className)}
                    role="dialog"
                    aria-modal={kind === "popover" ? undefined : true}
                    data-snap={kind === "sheet" && expandable ? snap : undefined}
                >
                    {children}
                </div>
            </div>
        </CloseContext.Provider>
    );
}

export function useDialogClose() {
    return useContext(CloseContext);
}

export default Dialog;

function subscribeTouch(callback: () => void) {
    const query = matchMedia(TOUCH_QUERY);
    query.addEventListener("change", callback);
    return () => query.removeEventListener("change", callback);
}

function getTouch(): boolean | null {
    return matchMedia(TOUCH_QUERY).matches;
}

function keepFocus(e: MouseEvent<HTMLDivElement>) {
    const editable = e.nativeEvent
        .composedPath()
        .some((el) => el instanceof Element && el.matches("input, textarea, select, [contenteditable]"));
    if (!editable) e.preventDefault();
}

function currentY(el: HTMLElement) {
    return new DOMMatrix(getComputedStyle(el).transform).m42;
}

function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
}

function pickTarget(y: number, velocity: number, height: number, half: number, expandable: boolean): Snap | "hidden" {
    const fling = 0.5;
    const projected = y + velocity * 100;
    if (projected > (expandable ? half + 0.5 * (height - half) : 0.5 * height)) return "hidden";
    if (!expandable) return velocity > fling ? "hidden" : "full";
    if (velocity < -fling) return "full";
    if (velocity > fling) return y >= half ? "hidden" : "half";
    return projected < half / 2 ? "full" : "half";
}

function readHalf(panelEl: HTMLElement) {
    const { transform } = panelEl.style;
    panelEl.style.transform = "translateY(var(--half))";
    const half = currentY(panelEl);
    panelEl.style.transform = transform;
    return half;
}

function bindSheetGesture(
    rootEl: HTMLElement,
    panelEl: HTMLElement,
    expandable: boolean,
    setSnap: (snap: Snap) => void,
    dismiss: () => void,
) {
    let mode: "idle" | "drag" | "scroll" = "idle";
    let startX = 0;
    let startY = 0;
    let anchorY = 0;
    let fromHeader = false;
    let base = 0;
    let y = 0;
    let frame = 0;
    let height = 0;
    let half = 0;
    let samples: { t: number; y: number }[] = [];

    const onStart = (e: TouchEvent) => {
        if (mode === "drag") settle(e.timeStamp);
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        fromHeader = startY - panelEl.getBoundingClientRect().top < 44;
        const ignored = e.target instanceof Element && e.target.closest("[data-sheet-ignore]");
        mode = e.touches.length > 1 || ignored ? "scroll" : "idle";
        samples = [];
    };

    const onMove = (e: TouchEvent) => {
        if (mode === "scroll") return;
        const { clientX, clientY } = e.touches[0];
        const dx = clientX - startX;
        const dy = clientY - startY;
        if (mode === "idle") {
            if (Math.max(Math.abs(dx), Math.abs(dy)) < 4) return;
            const canDrag =
                Math.abs(dy) > Math.abs(dx) &&
                (fromHeader ||
                    (dy > 0 && isAtTop(e.target, panelEl)) ||
                    (expandable && panelEl.dataset.snap === "half"));
            if (!canDrag) {
                mode = "scroll";
                return;
            }
            mode = "drag";
            base = currentY(panelEl);
            anchorY = clientY;
            height = panelEl.offsetHeight;
            rootEl.dataset.motion = "drag";
            half = expandable ? readHalf(panelEl) : 0;
            panelEl.style.transform = `translateY(${base}px)`;
        }
        e.preventDefault();
        y = Math.max(0, base + clientY - anchorY);
        samples = [...samples.filter((s) => e.timeStamp - s.t < 100), { t: e.timeStamp, y }];
        frame ||= requestAnimationFrame(() => {
            frame = 0;
            panelEl.style.transform = `translateY(${y}px)`;
        });
    };

    const settle = (timeStamp: number) => {
        mode = "idle";
        cancelAnimationFrame(frame);
        frame = 0;
        const recent = samples.filter((s) => timeStamp - s.t < 100);
        const first = recent[0];
        const last = recent[recent.length - 1];
        const velocity = recent.length > 1 && last.t > first.t ? (last.y - first.y) / (last.t - first.t) : 0;
        const next = pickTarget(y, velocity, height, half, expandable);
        panelEl.style.transform = "";
        rootEl.style.setProperty("--y", `${y}px`);
        if (next === "hidden") {
            const duration = clamp(Math.max(1, height - y) / Math.max(velocity, 0.01), 150, 350);
            rootEl.style.setProperty("--duration", `${duration}ms`);
            rootEl.dataset.motion = "dismiss";
            dismiss();
            return;
        }
        const duration = clamp(Math.abs(y - (next === "full" ? 0 : half)) * 0.8, 200, 400);
        rootEl.style.setProperty("--duration", `${duration}ms`);
        rootEl.dataset.motion = "settle";
        if (expandable && next !== panelEl.dataset.snap) flushSync(() => setSnap(next));
    };

    const onEnd = (e: TouchEvent) => {
        if (mode === "drag") settle(e.timeStamp);
    };

    panelEl.addEventListener("touchstart", onStart, { passive: true });
    panelEl.addEventListener("touchmove", onMove, { passive: false });
    panelEl.addEventListener("touchend", onEnd, { passive: true });
    panelEl.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
        cancelAnimationFrame(frame);
        panelEl.removeEventListener("touchstart", onStart);
        panelEl.removeEventListener("touchmove", onMove);
        panelEl.removeEventListener("touchend", onEnd);
        panelEl.removeEventListener("touchcancel", onEnd);
    };
}

function isAtTop(target: EventTarget | null, panelEl: HTMLElement) {
    for (let el = target instanceof Element ? target : null; el; el = el.parentElement) {
        if (el.scrollTop > 0) return false;
        if (el === panelEl) break;
    }
    return true;
}

function clampToViewport(value: number, max: number) {
    return Math.max(8, Math.min(value, max - 8));
}

function computePlacement(el: HTMLElement | null, minBelow = 160) {
    if (!el) return null;
    let boundary: HTMLElement | null = el.parentElement;
    while (boundary) {
        const overflowY = getComputedStyle(boundary).overflowY;
        if (overflowY === "auto" || overflowY === "scroll") break;
        boundary = boundary.parentElement;
    }
    const rect = el.getBoundingClientRect();
    const rawBounds = boundary ? boundary.getBoundingClientRect() : { top: 0, bottom: window.innerHeight };
    const bounds = { top: Math.max(rawBounds.top, 0), bottom: Math.min(rawBounds.bottom, window.innerHeight) };
    const gap = 8;
    const spaceBelow = bounds.bottom - rect.bottom - gap;
    const spaceAbove = rect.top - bounds.top - gap;
    const placement: "top" | "bottom" = spaceBelow >= minBelow || spaceBelow >= spaceAbove ? "bottom" : "top";
    const maxHeight = Math.max(120, Math.floor(placement === "bottom" ? spaceBelow : spaceAbove));
    return { placement, maxHeight };
}
