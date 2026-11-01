import React, { type ReactNode, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./MenuItem.module.scss";
import Ripple from "../../../../tools/Ripple/Ripple.tsx";
import { FlatArrowIcon } from "../../../../icons.tsx";
import Dialog from "../../../Dialog/Dialog.tsx";
import TabbedBlock from "../../../TabbedBlock/TabbedBlock.tsx";
import { useHashDialog } from "../../../../hooks/useHashDialog.ts";
import SubMenu, { type SubMenuEntry } from "../../SubMenu/SubMenu.tsx";
import SubMenuItem from "../../SubMenu/_item/SubMenuItem.tsx";

interface MenuItemProps {
    href: string;
    title: string;
    icon?: ReactNode;
    iconOnly?: boolean;
    items?: SubMenuEntry[];
    sheetKey?: string;
    variant: "top" | "bottom";
    isSticky?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
    href,
    title,
    icon,
    iconOnly,
    items,
    sheetKey,
    variant,
    isSticky,
}) => {
    const hover = variant === "top";
    const [opened, setOpened] = useState(false);
    const { shown, closing, open, close } = useHashDialog("menu-" + sheetKey);

    return (
        <Ripple
            className={styles.container}
            data-variant={variant}
            data-scrolling={isSticky}
            data-icon-only={iconOnly || undefined}
            onMouseOver={() => hover && items && setOpened(true)}
            onMouseLeave={() => hover && items && setOpened(false)}
        >
            <Link
                to={href}
                className={styles.link}
                aria-label={iconOnly ? title : undefined}
                onClick={(e) => {
                    if (href === "#") e.preventDefault();
                    if (items && !hover) open();
                }}
            >
                {icon}
                {!iconOnly && <span className={styles.title}>{title}</span>}
            </Link>
            {items && (
                <span className={styles.arrow}>
                    <FlatArrowIcon size={8} />
                </span>
            )}
            {items && hover && (
                <div style={{ display: opened ? "" : "none" }}>
                    <SubMenu items={items} />
                </div>
            )}
            {items && !hover && shown && (
                <SheetDialog title={title} items={items} closing={closing} onClose={close} />
            )}
        </Ripple>
    );
};

export default MenuItem;

interface SheetDialogProps {
    title: string;
    items: SubMenuEntry[];
    closing: boolean;
    onClose: () => Promise<void>;
}

function SheetDialog({ title, items, closing, onClose }: SheetDialogProps) {
    const navigate = useNavigate();

    return (
        <Dialog onClose={onClose} closing={closing}>
            <TabbedBlock
                items={[
                    {
                        title,
                        content: items.map((item, index) => {
                            if ("type" in item) return <hr key={index} className={styles.separator} />;
                            return (
                                <SubMenuItem
                                    key={index}
                                    {...item}
                                    onClick={async (e) => {
                                        item.onClick?.(e);
                                        if (item.href.startsWith("#")) return;
                                        e.preventDefault();
                                        await onClose();
                                        navigate(item.href);
                                    }}
                                />
                            );
                        }),
                    },
                ]}
            />
        </Dialog>
    );
}
