import React, { type MouseEvent, type ReactNode } from "react";
import styles from "./SubMenu.module.scss";
import SubMenuItem from "./_item/SubMenuItem.tsx";

export interface SubMenuLink {
    icon?: ReactNode;
    title: ReactNode;
    href: string;
    onClick?: (e: MouseEvent) => void;
    content?: ReactNode;
}

export type SubMenuEntry = SubMenuLink | { type: "hr" };

interface SubMenuProps {
    items: SubMenuEntry[];
}

const SubMenu: React.FC<SubMenuProps> = ({ items }) => {
    return (
        <div className={styles.container}>
            {items.map((item, index) =>
                "type" in item ? <hr key={index} /> : <SubMenuItem key={index} {...item} />
            )}
        </div>
    );
};

export default SubMenu;
