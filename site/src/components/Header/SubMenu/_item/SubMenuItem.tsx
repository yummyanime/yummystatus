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
        <Link to={href} className={styles.container}>
            <Ripple className={styles.ripple}>
                <span>{title}</span>
            </Ripple>
        </Link>
    );
};

export default SubMenuItem;
