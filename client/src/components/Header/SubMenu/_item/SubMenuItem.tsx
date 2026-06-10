import React, { type ReactNode } from "react";
import { Link } from "react-router-dom";
import styles from "./SubMenuItem.module.scss";

interface SubMenuItemProps {
    title: ReactNode;
    href: string;
}

const SubMenuItem: React.FC<SubMenuItemProps> = ({ title, href }) => {
    return (
        <Link to={href} className={styles.container}>
            <span>{title}</span>
        </Link>
    );
};

export default SubMenuItem;
