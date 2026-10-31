import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./SubMenuItem.module.scss";
import Ripple from "../../../../tools/Ripple/Ripple.tsx";

interface SubMenuItemProps {
    title: ReactNode;
    href: string;
}

const SubMenuItem: React.FC<SubMenuItemProps> = ({ title, href }) => {
    return (
        <Ripple
            className={styles.container}
            tag={Link}
            to={href}
            onMouseDown={(e) => e.stopPropagation()}
        >
            <span>{title}</span>
        </Ripple>
    );
};

export default SubMenuItem;
