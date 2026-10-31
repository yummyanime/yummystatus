import React from "react";
import styles from "./Menu.module.scss";
import MenuItem from "./_item/MenuItem.tsx";
import { type SubMenuEntry } from "../SubMenu/SubMenu.tsx";
import { domains, getDomainLabel } from "../../../data/constants.ts";
import { HomeIcon, ListIcon, ErrorIcon } from "../../../icons.tsx";

interface MenuProps {
    variant: "top" | "bottom";
    isSticky?: boolean;
}

const Menu: React.FC<MenuProps> = ({ variant, isSticky }) => {
    const iconSize = variant === "top" ? 12 : 15;
    const iconColor = "currentColor";

    const domainItems: SubMenuEntry[] = domains.map((domain) => ({
        title: getDomainLabel(domain),
        href: `/${domain}`,
    }));

    return (
        <nav className={styles.container} data-variant={variant}>
            <MenuItem
                variant={variant}
                isSticky={isSticky}
                href="/"
                title="ГЛАВНАЯ"
                icon={<HomeIcon size={iconSize} color={iconColor} />}
            />
            <MenuItem
                variant={variant}
                isSticky={isSticky}
                href="/downdetector"
                title="СБОИ"
                icon={<ErrorIcon size={iconSize} color={iconColor} />}
            />
            <MenuItem
                variant={variant}
                isSticky={isSticky}
                href="#"
                title="ДОМЕНЫ"
                icon={<ListIcon size={iconSize} color={iconColor} />}
                items={domainItems}
                sheetKey="domains"
            />
        </nav>
    );
};

export default Menu;
