import classnames from "classnames";
import { cloneElement, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import Block, { type BlockProps } from "../Block/Block.tsx";
import Tabs from "../Tabs/Tabs.tsx";
import styles from "./TabbedBlock.module.scss";

interface TabElement {
    title: ReactNode;
    seoTitle?: string;
    href?: string;
    content?: ReactNode;
    onSelect?: () => unknown;
    count?: number;
    icon?: ReactElement<{ size?: number }> | null;
}

type TabbedBlockProps = {
    items: TabElement[];
    defaultSelected?: number;
    selected?: number;
    onTabSelect?: (id: number) => void;
    noPadding?: boolean;
    contentClassName?: string;
    className?: string;
} & BlockProps;

export default function TabbedBlock({
    items,
    defaultSelected = 0,
    selected,
    onTabSelect,
    noPadding,
    contentClassName,
    ...props
}: TabbedBlockProps) {
    const [internalSelected, setInternalSelected] = useState(defaultSelected);
    const headerRef = useRef<HTMLDivElement>(null);

    const selectedTabId = selected ?? internalSelected;
    const isSingleTab = items.length === 1;
    const selectedItem = items[selectedTabId];

    useEffect(() => {
        items[selectedTabId]?.onSelect?.();
    }, []);

    const handleTabSelect = (id: number) => {
        if (onTabSelect) {
            onTabSelect(id);
        } else {
            setInternalSelected(id);
        }
        items[id]?.onSelect?.();
    };

    return (
        <Block {...props} data-tabs={items.length}>
            <div
                className={classnames(styles.header, isSingleTab && styles.singleTabHeader)}
                ref={headerRef}
            >
                <Tabs
                    titles={items.map(({ title, count, icon, href, onSelect }) => ({
                        title,
                        count,
                        icon: icon ? cloneElement(icon, { size: icon.props.size ?? 16 }) : undefined,
                        href,
                        interactive: Boolean(href || onSelect),
                    }))}
                    onTabSelect={handleTabSelect}
                    selectedIndex={selectedTabId}
                    containerRef={headerRef}
                    className={isSingleTab ? styles.singleTabTabs : undefined}
                />
            </div>
            <div className={classnames(styles.contents, noPadding && styles.noPadding, contentClassName)}>
                {selectedItem && (
                    <section className={classnames(styles.oneContent, styles.active)}>
                        <h2 className={selectedItem.seoTitle ? styles.seoHeading : undefined}>
                            {selectedItem.seoTitle ?? selectedItem.title}
                        </h2>
                        {selectedItem.content}
                    </section>
                )}
            </div>
        </Block>
    );
}
