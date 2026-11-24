import type { ReactNode } from "react";
import chart from "../CountryChart/CountryChart.module.scss";
import styles from "./Group.module.scss";

const Group = ({
    title,
    grid,
    divider,
    children,
}: {
    title?: string;
    grid: "charts" | "tiles";
    divider: boolean;
    children: ReactNode;
}) => (
    <div className={chart.chartGroup}>
        {title && <h3 className={chart.groupTitle}>{title}</h3>}
        <div className={grid === "charts" ? chart.chartsGrid : styles.tiles}>
            {children}
        </div>
        {divider && <hr className={chart.chartDivider} />}
    </div>
);

export default Group;
