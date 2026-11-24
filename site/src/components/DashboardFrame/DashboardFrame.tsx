import type { ReactNode } from "react";
import { isBareView } from "../../data/constants.ts";
import styles from "../Dashboard/Dashboard.module.scss";
import Menu from "../Menu/Menu.tsx";

const DashboardFrame = ({ children }: { children: ReactNode }) => (
    <div className={styles.dashboard} style={{ marginBottom: "140px" }}>
        {!isBareView() && (
            <div className={styles.controls}>
                <Menu />
            </div>
        )}
        {children}
    </div>
);

export default DashboardFrame;
