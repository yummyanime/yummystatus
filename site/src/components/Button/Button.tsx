import { forwardRef, type ButtonHTMLAttributes, type HTMLAttributes, type MouseEvent } from "react";
import styles from "./Button.module.scss";
import Ripple from "../../tools/Ripple/Ripple.tsx";
import { useDialogClose } from "../Dialog/Dialog.tsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    active?: boolean;
    close?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ active = false, close = false, className, children, type = "button", onClick, ...rest }, ref) => {
        const closeDialog = useDialogClose();
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
                onClick={(e) => {
                    onClick?.(e as unknown as MouseEvent<HTMLButtonElement>);
                    if (close) closeDialog();
                }}
                {...(rest as HTMLAttributes<HTMLDivElement>)}
            >
                {children}
            </Ripple>
        );
    }
);

Button.displayName = "Button";

export default Button;
