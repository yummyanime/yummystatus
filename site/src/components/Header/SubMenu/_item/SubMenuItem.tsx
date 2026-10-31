import React, { type MouseEvent, type ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./SubMenuItem.module.scss";
import Ripple from "../../../../tools/Ripple/Ripple.tsx";

interface SubMenuItemProps {
    title: ReactNode;
    href: string;
    onClick?: (e: MouseEvent) => void;
}

const SubMenuItem: React.FC<SubMenuItemProps> = ({ title, href, onClick }) => {
    return (
        <Ripple
            className={styles.container}
            tag={Link}
            to={href}
            onClick={onClick}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <span>{title}</span>
        </Ripple>
    );
};

export default SubMenuItem;
