import { useEffect, useRef } from "react";

interface CloseWatcherLike {
    onclose: (() => void) | null;
    destroy(): void;
}

const stack: (() => void)[] = [];
const NativeWatcher =
    typeof window === "undefined"
        ? undefined
        : (window as Window & { CloseWatcher?: new () => CloseWatcherLike }).CloseWatcher;

export function useBackStack(onClose: () => void) {
    const closeRef = useRef(onClose);
    closeRef.current = onClose;

    useEffect(() => {
        const close = () => closeRef.current();
        if (NativeWatcher) {
            const watcher = new NativeWatcher();
            watcher.onclose = close;
            return () => watcher.destroy();
        }
        stack.push(close);
        return () => {
            stack.splice(stack.indexOf(close), 1);
        };
    }, []);
}

if (typeof window !== "undefined" && !NativeWatcher) {
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") stack[stack.length - 1]?.();
    });
}
