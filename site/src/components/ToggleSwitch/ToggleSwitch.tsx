import cn from "classnames";
import styles from "./ToggleSwitch.module.scss";

interface ToggleSwitchProps {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    labelLeft?: boolean;
}

const ToggleSwitch = ({ label, checked, onChange, labelLeft }: ToggleSwitchProps) => {
    return (
        <div className={cn(styles.toggleSwitchContainer, labelLeft && styles.labelLeft)}>
            <label className={styles.toggleSwitch}>
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                />
                <span className={styles.slider}></span>
            </label>
            <span className={styles.label}>{label}</span>
        </div>
    );
};

export default ToggleSwitch;