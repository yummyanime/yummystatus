import React from "react";
import styles from "./Menu.module.scss";
import MenuItem from "./_item/MenuItem.tsx";
import SubMenu, { type SubMenuEntry } from "../SubMenu/SubMenu.tsx";
import { domains, getDomainLabel } from "../../../data/constants.ts";
import { HomeIcon, ListIcon, ErrorIcon } from "../../../icons.tsx";

interface MenuProps {
    variant: "top" | "bottom";
}

const Menu: React.FC<MenuProps> = ({ variant }) => {
    const iconSize = variant === "top" ? 16 : 22;
    const iconColor = "currentColor";

    const domainItems: SubMenuEntry[] = domains.map((domain) => ({
        title: getDomainLabel(domain),
        href: `/${domain}`,
    }));

    return (
        <nav className={styles.container} data-variant={variant}>
            <MenuItem
                variant={variant}
                href="/"
                title="Главная"
                icon={<HomeIcon size={iconSize} color={iconColor} />}
            />
            <MenuItem
                variant={variant}
                href="/downdetector"
                title="Сбои"
                icon={<ErrorIcon size={iconSize} color={iconColor} />}
            />
            <MenuItem
                variant={variant}
                href="#"
                title="Домены"
                icon={<ListIcon size={iconSize} color={iconColor} />}
                subList={
                    <SubMenu variant={variant} items={domainItems} first={true} />
                }
            />
        </nav>
    );
};

export default Menu;
