import React, { type ReactNode } from "react";
import styles from "./SubMenu.module.scss";
import SubMenuItem from "./_item/SubMenuItem.tsx";

export interface SubMenuEntry {
    title: ReactNode;
    href: string;
}

interface SubMenuProps {
    items: SubMenuEntry[];
    variant: "top" | "bottom";
    first?: boolean;
}

const SubMenu: React.FC<SubMenuProps> = ({ items, variant, first }) => {
    return (
        <div
            className={styles.container}
            data-variant={variant}
            data-first={first ? "true" : undefined}
        >
            {items.map((item) => (
                <SubMenuItem key={item.href} title={item.title} href={item.href} />
            ))}
        </div>
    );
};

export default SubMenu;
