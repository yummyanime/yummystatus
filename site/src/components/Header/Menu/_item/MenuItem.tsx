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
    title: ReactNode;
    icon?: ReactNode;
    items?: SubMenuEntry[];
    sheetKey?: string;
    variant: "top" | "bottom";
    isSticky?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
    href,
    title,
    icon,
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
            onMouseOver={() => hover && items && setOpened(true)}
            onMouseLeave={() => hover && items && setOpened(false)}
        >
            <Link
                to={href}
                className={styles.link}
                onClick={(e) => {
                    if (href === "#") e.preventDefault();
                    if (items && !hover) open();
                }}
            >
                {icon}
                <span className={styles.title}>{title}</span>
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
    title: ReactNode;
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
                        content: items.map((item) => (
                            <SubMenuItem
                                key={item.href}
                                {...item}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    await onClose();
                                    navigate(item.href);
                                }}
                            />
                        )),
                    },
                ]}
            />
        </Dialog>
    );
}
