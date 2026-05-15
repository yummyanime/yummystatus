import styles from "./Menu.module.scss";
import ToggleSwitch from "../ToggleSwitch/ToggleSwitch.tsx";
import Button from "../Button/Button.tsx";
import {
    useDashboardSettings,
    timeRangeOptions,
} from "../../context/DashboardSettingsContext.tsx";

const Menu = () => {
    const {
        timeRange,
        setTimeRange,
        autoRefresh,
        setAutoRefresh,
        hideUnreliable,
        setHideUnreliable,
    } = useDashboardSettings();

    return (
        <div className={styles.menu}>
            <div className={styles.buttonGroup}>
                {timeRangeOptions.map((option) => (
                    <Button
                        key={option.value}
                        active={timeRange === option.value}
                        onClick={() => setTimeRange(option.value)}
                    >
                        {option.label}
                    </Button>
                ))}
            </div>
            <ToggleSwitch
                label="Автообновление"
                checked={autoRefresh}
                onChange={setAutoRefresh}
            />
            <ToggleSwitch
                label="Скрывать недостоверные данные"
                checked={hideUnreliable}
                onChange={setHideUnreliable}
            />
        </div>
    );
};

export default Menu;
