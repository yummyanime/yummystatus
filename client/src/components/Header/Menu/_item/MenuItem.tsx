import React, { type ReactNode, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "./MenuItem.module.scss";
import { FlatArrowIcon } from "../../../../icons.tsx";

interface MenuItemProps {
    href: string;
    title: ReactNode;
    icon?: ReactNode;
    subList?: ReactNode;
    variant: "top" | "bottom";
}

const MenuItem: React.FC<MenuItemProps> = ({
    href,
    title,
    icon,
    subList,
    variant,
}) => {
    const hover = variant === "top";
    const [opened, setOpened] = useState(false);

    useEffect(() => {
        if (!opened || hover) return;
        const close = () => setOpened(false);
        document.addEventListener("click", close);
        return () => document.removeEventListener("click", close);
    }, [opened, hover]);

    return (
        <div
            className={styles.container}
            data-variant={variant}
            data-opened={opened ? "true" : undefined}
            onMouseOver={() => hover && subList && setOpened(true)}
            onMouseLeave={() => hover && subList && setOpened(false)}
        >
            <Link
                to={href}
                className={styles.link}
                onClick={(e) => {
                    if (href === "#") e.preventDefault();
                    if (subList && !hover) {
                        e.preventDefault();
                        if (!opened) setTimeout(() => setOpened(true), 0);
                    }
                }}
            >
                {icon}
                <span className={styles.title}>{title}</span>
            </Link>
            {subList && (
                <span className={styles.arrow}>
                    <FlatArrowIcon size={8} />
                </span>
            )}
            {subList && (
                <div style={{ display: opened ? "" : "none" }}>{subList}</div>
            )}
        </div>
    );
};

export default MenuItem;
