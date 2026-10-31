import React, { type ReactNode } from "react";
import styles from "./SubMenu.module.scss";
import SubMenuItem from "./_item/SubMenuItem.tsx";

export interface SubMenuEntry {
    title: ReactNode;
    href: string;
}

interface SubMenuProps {
    items: SubMenuEntry[];
}

const SubMenu: React.FC<SubMenuProps> = ({ items }) => {
    return (
        <div className={styles.container}>
            {items.map((item) => (
                <SubMenuItem key={item.href} title={item.title} href={item.href} />
            ))}
        </div>
    );
};

export default SubMenu;
