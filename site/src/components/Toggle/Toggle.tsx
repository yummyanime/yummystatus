import cn from "classnames";
import styles from "./Toggle.module.scss";

interface ToggleProps {
    active: boolean;
}

const Toggle = ({ active }: ToggleProps) => (
    <span className={cn(styles.toggle, active && styles.active)} aria-hidden="true">
        <span className={styles.bg} />
        <span className={styles.slider} />
    </span>
);

export default Toggle;
