import classnames from "classnames";
import { forwardRef, type HTMLAttributes } from "react";
import styles from "./Block.module.scss";

export interface BlockProps {
    isFlat?: boolean;
}

const Block = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & BlockProps>(function Block(
    { isFlat, className, style, ...rest },
    ref,
) {
    return (
        <div
            {...rest}
            ref={ref}
            className={classnames(styles.block, className, isFlat && styles.flat)}
            style={{
                background: isFlat ? "var(--block-inner)" : "var(--color-dark-bg-1)",
                ...style,
            }}
        />
    );
});

export default Block;
