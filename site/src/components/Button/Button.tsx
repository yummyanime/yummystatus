import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes } from "react";
import styles from "./Button.module.scss";
import Ripple from "../../tools/Ripple/Ripple.tsx";

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
            <Ripple
                tag="button"
                ref={ref as unknown as React.Ref<HTMLDivElement>}
                type={type as "submit"}
                className={classNames}
                {...(rest as HTMLAttributes<HTMLDivElement>)}
            >
                {children}
            </Ripple>
        );
    }
);

Button.displayName = "Button";

export default Button;
