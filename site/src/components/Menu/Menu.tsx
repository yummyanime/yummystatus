import styles from "./Menu.module.scss";
import { useLanguage } from "../../i18n.ts";
import Button from "../Button/Button.tsx";
import DateRangePicker from "../DateRangePicker/DateRangePicker.tsx";
import {
    useDashboardSettings,
    timeRangeOptions,
} from "../../context/DashboardSettingsContext.tsx";

const Menu = () => {
    const {
        timeRange,
        setTimeRange,
        dateRange,
    } = useDashboardSettings();
    const { t } = useLanguage();

    return (
        <div className={styles.menu}>
            <div className={styles.buttonGroup}>
                {timeRangeOptions.map((option) => (
                    <Button
                        key={option.value}
                        active={!dateRange && timeRange === option.value}
                        onClick={() => setTimeRange(option.value)}
                    >
                        {t(option.labelKey)}
                    </Button>
                ))}
            </div>
            <DateRangePicker />
        </div>
    );
};

export default Menu;
