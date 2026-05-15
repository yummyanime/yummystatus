import { forwardRef, type ButtonHTMLAttributes } from "react";
import styles from "./Button.module.scss";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ active = false, className, children, type = "button", ...rest }, ref) => {
        const classNames = [
            styles.button,
            active ? styles.active : "",
            className ?? "",
        ]
            .filter(Boolean)
            .join(" ");

        return (
            <button ref={ref} type={type} className={classNames} {...rest}>
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
