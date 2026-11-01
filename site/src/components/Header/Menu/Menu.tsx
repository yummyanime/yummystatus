import React from "react";
import styles from "./Menu.module.scss";
import MenuItem from "./_item/MenuItem.tsx";
import { type SubMenuEntry } from "../SubMenu/SubMenu.tsx";
import Toggle from "../../Toggle/Toggle.tsx";
import { getDomainGroups, getDomainLabel } from "../../../data/constants.ts";
import { useDashboardSettings } from "../../../context/DashboardSettingsContext.tsx";
import { useLanguage } from "../../../i18n.ts";
import {
    HomeIcon,
    ListIcon,
    ErrorIcon,
    SettingsIcon,
    LanguageIcon,
    FlagIcon,
} from "../../../icons.tsx";

interface MenuProps {
    variant: "top" | "bottom";
    isSticky?: boolean;
}

const Menu: React.FC<MenuProps> = ({ variant, isSticky }) => {
    const iconSize = variant === "top" ? 12 : 15;
    const iconColor = "currentColor";
    const { language, t } = useLanguage();
    const { autoRefresh, setAutoRefresh, hideUnreliable, setHideUnreliable } =
        useDashboardSettings();

    const domainItems: SubMenuEntry[] = getDomainGroups().flatMap(({ domains }, index) => [
        ...(index ? [{ type: "hr" as const }] : []),
        ...domains.map(({ value }) => ({ title: getDomainLabel(value), href: `/${value}` })),
    ]);

    const settingsItems: SubMenuEntry[] = [
        {
            icon: <LanguageIcon size={14} color={iconColor} />,
            title: t("navLanguage"),
            href: "#language",
            content: <FlagIcon language={language} size={20} />,
        },
        { type: "hr" },
        {
            title: t("settingsAutoRefresh"),
            href: "#",
            content: <Toggle active={autoRefresh} />,
            onClick: () => setAutoRefresh(!autoRefresh),
        },
        {
            title: t("settingsHideUnreliable"),
            href: "#",
            content: <Toggle active={hideUnreliable} />,
            onClick: () => setHideUnreliable(!hideUnreliable),
        },
    ];

    return (
        <nav className={styles.container} data-variant={variant}>
            <MenuItem
                variant={variant}
                isSticky={isSticky}
                href="/"
                title={t("navHome")}
                icon={<HomeIcon size={iconSize} color={iconColor} />}
            />
            <MenuItem
                variant={variant}
                isSticky={isSticky}
                href="/downdetector"
                title={t("navOutages")}
                icon={<ErrorIcon size={iconSize} color={iconColor} />}
            />
            <MenuItem
                variant={variant}
                isSticky={isSticky}
                href="#"
                title={t("navDomains")}
                icon={<ListIcon size={iconSize} color={iconColor} />}
                items={domainItems}
                sheetKey="domains"
            />
            <MenuItem
                variant={variant}
                isSticky={isSticky}
                href="#"
                title={t("navSettings")}
                icon={<SettingsIcon size={iconSize} color={iconColor} />}
                iconOnly
                items={settingsItems}
                sheetKey="settings"
            />
        </nav>
    );
};

export default Menu;
