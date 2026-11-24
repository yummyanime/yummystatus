import React from "react";
import styles from "./Menu.module.scss";
import MenuItem from "./_item/MenuItem.tsx";
import { type SubMenuEntry } from "../SubMenu/SubMenu.tsx";
import Toggle from "../../Toggle/Toggle.tsx";
import { useDashboardSettings } from "../../../context/DashboardSettingsContext.tsx";
import { useLanguage } from "../../../i18n.ts";
import {
    HomeIcon,
    ErrorIcon,
    GlobeIcon,
    ShieldIcon,
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
            content: <Toggle active={autoRefresh} onToggle={setAutoRefresh} ariaLabel={t("settingsAutoRefresh")} />,
            onClick: () => setAutoRefresh(!autoRefresh),
        },
        {
            title: t("settingsHideUnreliable"),
            href: "#",
            content: <Toggle active={hideUnreliable} onToggle={setHideUnreliable} ariaLabel={t("settingsHideUnreliable")} />,
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
                href="/sites"
                title={t("navSites")}
                icon={<GlobeIcon size={iconSize} color={iconColor} />}
            />
            <MenuItem
                variant={variant}
                isSticky={isSticky}
                href="/vpn"
                title={t("navVpn")}
                icon={<ShieldIcon size={iconSize} color={iconColor} />}
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
                title={t("navSettings")}
                icon={
                    <div className={styles.guestIcon}>
                        <SettingsIcon size={18} color={iconColor} />
                    </div>
                }
                iconOnly
                items={settingsItems}
                sheetKey="settings"
            />
        </nav>
    );
};

export default Menu;
