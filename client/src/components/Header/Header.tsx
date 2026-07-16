import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./Header.module.scss";
import Menu from "./Menu/Menu.tsx";
import logo from "../../images/Status-logo.svg";

const Header: React.FC = () => {
    return (
        <>
            <div className={styles.headerContainer}>
                <div className={styles.header}>
                    <Link to="/" className={styles.logoLink}>
                        <div className={styles.logoContainer}>
                            <img
                                src={logo}
                                alt="YummyStatus Logo"
                                className={styles.logoImg}
                            />
                            <span className={styles.logo}>YummyStatus</span>
                        </div>
                    </Link>
                    <nav className={styles.nav}>
                        <Menu variant="top" />
                    </nav>
                </div>
            </div>
            <HeaderBottom />
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
            passive: false,
        });
        document.body.addEventListener("touchcancel", onTouchEnd);
        document.body.addEventListener("touchend", onTouchEnd, {
            passive: false,
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
