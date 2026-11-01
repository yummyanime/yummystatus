import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { Link } from "react-router-dom";
import styles from "./Header.module.scss";
import Menu from "./Menu/Menu.tsx";
import Logo from "./Logo/Logo.tsx";
import LanguageDialog from "../LanguageDialog/LanguageDialog.tsx";

const Header: React.FC = () => {
    const [isSticky, setSticky] = useState<boolean>();
    const headerRef = useRef<HTMLDivElement>(null);

    useLayoutEffect(() => {
        let stuck = false;
        const update = (commit: (value: boolean) => void) => {
            const y = window.scrollY;
            const next = stuck ? y > 30 : y >= 46;
            if (next === stuck) return;
            stuck = next;
            headerRef.current?.style.setProperty(
                "--from",
                `${next ? Math.max(30 - y, -66) : y - 38}px`
            );
            commit(next);
        };
        const onScroll = () => update((value) => flushSync(() => setSticky(value)));
        update(setSticky);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <>
            <header className={styles.headerContainer}>
                <div className={styles.header} data-scrolling={isSticky} ref={headerRef}>
                    <div className={styles.bg}>
                        <div className={styles.wrapper}>
                            <Link to="/" className={styles.logo}>
                                <Logo />
                                <span className={styles.logoText}>YummyStatus</span>
                            </Link>
                            <Menu variant="top" isSticky={isSticky} />
                        </div>
                    </div>
                </div>
            </header>
            <HeaderBottom />
            <LanguageDialog />
        </>
    );
};

const HeaderBottom: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [transform, setTransform] = useState(0);
    const transformRef = useRef<number>(0);
    transformRef.current = transform;

    useEffect(() => {
        let touchStartPos = -1;
        let touchStartTransform = 0;
        const onTouchStart = () => {
            touchStartPos = window.scrollY;
            touchStartTransform = transformRef.current;
        };
        const onTouchEnd = () => {
            setTransform(
                touchStartPos >= window.scrollY ? 0 : ref.current!.clientHeight
            );
            const cacheScroll = window.scrollY;
            setTimeout(() => {
                if (window.scrollY - 20 > cacheScroll) {
                    setTransform(ref.current!.clientHeight);
                } else if (window.scrollY + 20 < cacheScroll) {
                    setTransform(0);
                }
            }, 30);
            touchStartPos = -1;
        };
        const onScroll = () => {
            if (window.scrollY <= 50) setTransform(0);
            else if (touchStartPos != -1) {
                const g = window.scrollY - touchStartPos + touchStartTransform;
                setTransform(Math.max(0, Math.min(ref.current!.clientHeight, g)));
            }
        };
        document.body.addEventListener("touchstart", onTouchStart, {
            passive: true,
        });
        document.body.addEventListener("touchcancel", onTouchEnd);
        document.body.addEventListener("touchend", onTouchEnd, {
            passive: true,
        });
        window.addEventListener("scroll", onScroll);
        return () => {
            window.removeEventListener("scroll", onScroll);
            document.body.removeEventListener("touchstart", onTouchStart);
            document.body.removeEventListener("touchend", onTouchEnd);
            document.body.removeEventListener("touchcancel", onTouchEnd);
            setTransform(0);
        };
    }, []);

    return (
        <div
            className={styles.bottomBar}
            ref={ref}
            style={{ transform: `translateY(${transform}px)` }}
        >
            <Menu variant="bottom" />
        </div>
    );
};

export default Header;
