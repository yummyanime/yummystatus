import cn from "classnames";
import { memo, type ReactNode } from "react";
import styles from "./Toggle.module.scss";

type ToggleProps =
    | {
          active: boolean;
          onToggle: (active: boolean) => void;
          id?: string;
          ariaLabel?: string;
          allowMiddleClick?: false;
          disabled?: boolean;
      }
    | {
          active: boolean | 0.5;
          onToggle: (active: boolean | 0.5) => void;
          id?: string;
          ariaLabel?: string;
          allowMiddleClick: true;
          disabled?: boolean;
      };

function Toggle(props: ToggleProps): ReactNode {
    const { active, id, ariaLabel, disabled } = props;
    return (
        <button
            id={id}
            type="button"
            disabled={disabled}
            className={cn(styles.toggle, active === true && styles.active, active === 0.5 && styles.inputmiddle)}
            role={props.allowMiddleClick ? "checkbox" : "switch"}
            aria-label={ariaLabel}
            aria-checked={active === 0.5 ? "mixed" : active}
            onClick={() =>
                props.allowMiddleClick
                    ? props.onToggle(active === 0.5 ? true : active ? false : 0.5)
                    : props.onToggle(!active)
            }
        >
            <span className={styles.bg} aria-hidden={true} />
            <span className={styles.slider} aria-hidden={true} />
        </button>
    );
}

export default memo(Toggle);
