import classnames from "classnames";
import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type MouseEvent,
    type ReactElement,
    type ReactNode,
    type RefObject,
} from "react";
import { Link } from "react-router-dom";
import { useWindowSize } from "../../hooks/useWindowSize.ts";
import Ripple from "../../tools/Ripple/Ripple.tsx";
import styles from "./Tabs.module.scss";

type TabData = {
    title: ReactNode;
    count?: ReactNode;
    icon?: ReactElement;
    href?: string;
    interactive?: boolean;
};

type TabItem = ReactNode | TabData;

interface TabsProps {
    titles: TabItem[];
    onTabSelect: (index: number) => unknown;
    selectedIndex: number;
    className?: string;
    containerRef?: RefObject<HTMLDivElement | null>;
}

export default function Tabs({
    titles,
    onTabSelect,
    selectedIndex,
    className,
    containerRef,
}: TabsProps) {
    const refs = useRef<(HTMLDivElement | null)[]>([]);
    const [isMultipleRows, setIsMultipleRows] = useState(false);
    const { width, height } = useWindowSize();
    const enteredAtWidthRef = useRef<number | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);
    const isMountedRef = useRef(false);

    useEffect(() => {
        refs.current = refs.current.slice(0, titles.length);
    }, [titles]);

    const checkSizes = useCallback(() => {
        const firstElement = refs.current[0];
        if (!firstElement) return;

        const firstIdOffset = firstElement.offsetTop;
        for (let i = 1; i < refs.current.length; i++) {
            if (refs.current[i]?.offsetTop !== firstIdOffset) {
                if (enteredAtWidthRef.current === null) {
                    enteredAtWidthRef.current = containerRef?.current?.offsetWidth ?? null;
                }
                setIsMultipleRows(true);
                return;
            }
        }

        const enteredAt = enteredAtWidthRef.current;
        if (enteredAt !== null) {
            const currentWidth = containerRef?.current?.offsetWidth ?? null;
            if (currentWidth !== null && currentWidth <= enteredAt) return;
        }

        enteredAtWidthRef.current = null;
        setIsMultipleRows(false);
    }, [containerRef]);

    useLayoutEffect(() => {
        const observer = new ResizeObserver(checkSizes);
        refs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => observer.disconnect();
    }, [titles, checkSizes]);

    useLayoutEffect(checkSizes, [width, height, checkSizes]);

    useEffect(() => {
        const container = parentRef.current;
        const tab = refs.current[selectedIndex];
        if (!container || !tab) return;
        scrollToTab(container, tab, isMountedRef.current);
        isMountedRef.current = true;
    }, [selectedIndex]);

    const isSingleTab = titles.length === 1;

    return (
        <div
            ref={parentRef}
            className={classnames(
                styles.parent,
                isMultipleRows && styles.multipleRows,
                className,
                isSingleTab && styles.singleTabParent,
            )}
        >
            {titles.map((el, id) => {
                const onClick = (e: MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTabSelect(id);
                };

                const tabData = isTabData(el) ? el : null;
                const isSelected = id === selectedIndex;
                const href = tabData?.href;
                const isInteractive = tabData && "interactive" in tabData ? tabData.interactive : Boolean(href);

                const materiableProps = {
                    ref: (ref: HTMLDivElement | null) => {
                        refs.current[id] = ref;
                    },
                    tabIndex: 0,
                    className: classnames(
                        styles.oneTab,
                        isSelected && styles.selected,
                        isSingleTab && styles.singleTab,
                        href && styles.hasHref,
                        isInteractive && styles.interactive,
                    ),
                    ...(!href && { onClick }),
                };

                if (href) {
                    return (
                        <Link to={href} key={id} className={styles.link}>
                            <Ripple {...materiableProps}>
                                <Title el={el} />
                            </Ripple>
                        </Link>
                    );
                }
                if (isSingleTab) {
                    return (
                        <div key={id} {...materiableProps}>
                            <Title el={el} />
                        </div>
                    );
                }
                return (
                    <Ripple key={id} role="button" {...materiableProps}>
                        <Title el={el} />
                    </Ripple>
                );
            })}
        </div>
    );
}

function isTabData(el: TabItem): el is TabData {
    return typeof el === "object" && el !== null && "title" in el;
}

function scrollToTab(container: HTMLElement, tab: HTMLElement, smooth: boolean) {
    if (container.scrollWidth <= container.clientWidth) return;

    const containerRect = container.getBoundingClientRect();
    const tabRect = tab.getBoundingClientRect();
    const tabLeft = tabRect.left - containerRect.left + container.scrollLeft;
    const tabRight = tabLeft + tabRect.width;

    let left = container.scrollLeft;
    if (tabLeft < left) left = tabLeft;
    else if (tabRight > left + container.clientWidth) left = tabRight - container.clientWidth;
    if (left === container.scrollLeft) return;

    container.scrollTo({ left, behavior: smooth ? "smooth" : "auto" });
}

function Title({ el }: { el: TabItem }) {
    if (!isTabData(el)) return <>{el}</>;

    return (
        <>
            {el.icon && <span className={styles.tabIcon}>{el.icon}</span>}
            <h2>{el.title}</h2> {!!el.count && <span className={styles.count}>{el.count}</span>}
        </>
    );
}
