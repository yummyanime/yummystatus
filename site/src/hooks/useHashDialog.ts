import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export const DIALOG_DISMISS_MS = 400;

export const TOUCH_QUERY = "(max-width: 1024px) and (hover: none), (max-width: 1024px) and (pointer: coarse)";

export function useHashDialog(name: string) {
    const { hash, pathname, search } = useLocation();
    const navigate = useNavigate();
    const target = "#" + name;
    const [local, setLocal] = useState(false);
    const matched = local || hash === target || hash.startsWith(target + "?");
    const [prevMatched, setPrevMatched] = useState(matched);
    const [closing, setClosing] = useState(false);
    if (matched !== prevMatched) {
        setPrevMatched(matched);
        setClosing(!matched);
    }
    useEffect(() => {
        if (!closing) return;
        const timer = setTimeout(() => setClosing(false), DIALOG_DISMISS_MS);
        return () => clearTimeout(timer);
    }, [closing]);
    const close = useCallback(
        (toHash = ""): Promise<void> => {
            if (!matched) return Promise.resolve();
            if (local) {
                setLocal(false);
                return Promise.resolve();
            }
            if (hasInAppEntry()) {
                return new Promise<void>((resolve) => {
                    window.addEventListener("popstate", () => resolve(), { once: true });
                    navigate(-1);
                });
            }
            return Promise.resolve(navigate(pathname + search + toHash, { replace: true }));
        },
        [navigate, pathname, search, matched, local],
    );
    const open = useCallback(
        () => (matchMedia(TOUCH_QUERY).matches ? navigate(pathname + search + target) : setLocal(true)),
        [navigate, pathname, search, target],
    );
    return { shown: matched || closing, opened: matched, closing, open, close };
}

export function hasInAppEntry() {
    return ((history.state as { idx?: number } | null)?.idx ?? 0) > 0;
}
