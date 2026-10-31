import { type CSSProperties, memo, type ReactNode, type MouseEvent } from "react";

type SvgProps = {
    d?: string;
    size?: number;
    fill?: string;
    viewBoxSize?: [number, number];
    style?: CSSProperties;
    className?: string;
    onClick?: (e: MouseEvent) => void;
    fillRule?: "evenodd";
    clipRule?: "evenodd";
    children?: ReactNode;
    rotate?: number;
};

const Svg = memo(
    ({
        d,
        size = 16,
        fill,
        viewBoxSize = [20, 20],
        style,
        rotate = 0,
        children,
        onClick,
        ...props
    }: SvgProps) => {
        const [viewBoxWidth, viewBoxHeight] = viewBoxSize;
        const viewBox = `0 0 ${viewBoxWidth} ${viewBoxHeight}`;
        const dx = (viewBoxWidth - 20) / 2;
        const dy = (viewBoxHeight - 20) / 2;
        const pathTransform =
            viewBoxWidth === viewBoxHeight ? `translate(${dx}, ${dy})` : undefined;

        const transformStyle = rotate
            ? {
                  transform: `rotate(${rotate}deg)`,
                  transformOrigin: "center",
                  transition: "transform 0.2s ease-in-out",
                  ...style,
              }
            : style;

        return (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                fill={fill}
                viewBox={viewBox}
                style={transformStyle}
                onClick={(e) => onClick?.(e)}
                {...props}
            >
                {d && <path d={d} transform={pathTransform} />}
                {children}
            </svg>
        );
    }
);

export { Svg };

export type IconProps = {
    size?: number;
    color?: string;
    rotate?: number;
    onClick?: (e: MouseEvent) => void;
    className?: string;
};

export function HomeIcon({ size, color }: IconProps) {
    return (
        <Svg
            size={size}
            fill={color}
            d="M19.64 9.12 10.88.37a1.25 1.25 0 00-1.77 0L.35 9.12c-.48.5-.46 1.25.03 1.74.49.5 1.2.56 1.7.07l.42-.42v8.24c0 .7.56 1.25 1.25 1.25h5v-5h2.5v5h5c.7 0 1.27-.56 1.27-1.25v-8.22l.37.37c.5.5 1.24.45 1.73-.04a1.2 1.2 0 00.02-1.74Z"
        />
    );
}

export function ListIcon({ size, color }: IconProps) {
    return (
        <Svg
            size={size}
            fill={color}
            d="M7.64 18c-.55 0-1.02-.2-1.4-.6-.38-.4-.57-.88-.57-1.47 0-.58.2-1.07.57-1.46.38-.4.85-.6 1.4-.6h10.39c.55 0 1.02.2 1.4.6s.57.89.57 1.47c0 .59-.19 1.07-.57 1.47-.38.4-.85.59-1.4.59H7.64Zm0-5.94c-.55 0-1.02-.2-1.4-.6-.38-.4-.57-.88-.57-1.47 0-.58.2-1.07.57-1.46.38-.4.85-.6 1.4-.6h10.39c.55 0 1.02.2 1.4.6s.57.9.57 1.48-.19 1.07-.57 1.46c-.38.4-.85.6-1.4.6H7.64Zm0-5.93c-.55 0-1.02-.2-1.4-.6-.38-.4-.57-.89-.57-1.47 0-.59.2-1.07.57-1.47.38-.4.85-.59 1.4-.59h10.39c.55 0 1.02.2 1.4.6s.57.88.57 1.47c0 .58-.19 1.07-.57 1.46-.38.4-.85.6-1.4.6H7.64Zm-5.67 0c-.56 0-1.03-.2-1.4-.6C.18 5.13 0 4.64 0 4.06c0-.59.19-1.07.57-1.47.38-.4.85-.59 1.4-.59.56 0 1.03.2 1.4.6.38.4.57.88.57 1.47 0 .58-.19 1.07-.57 1.46-.38.4-.85.6-1.4.6Zm0 5.93c-.56 0-1.03-.2-1.4-.6C.18 11.07 0 10.59 0 10c0-.58.19-1.07.57-1.46.38-.4.85-.6 1.4-.6.56 0 1.03.2 1.4.6.38.4.57.9.57 1.48s-.19 1.07-.57 1.46c-.38.4-.85.6-1.4.6Zm0 5.94c-.56 0-1.03-.2-1.4-.6C.18 17 0 16.52 0 15.93c0-.58.19-1.07.57-1.46.38-.4.85-.6 1.4-.6.56 0 1.03.2 1.4.6.38.4.57.89.57 1.47 0 .59-.19 1.07-.57 1.47-.38.4-.85.59-1.4.59Z"
        />
    );
}

export function ErrorIcon({ size, color }: IconProps) {
    return (
        <Svg
            size={size}
            fill={color}
            d="M17.06 2.93A9.99 9.99 0 000 9.99a9.99 9.99 0 002.93 7.07A9.99 9.99 0 0010 20a9.99 9.99 0 007.08-2.93 9.99 9.99 0 00-.01-14.14ZM4.69 4.7a7.5 7.5 0 019.64-.81L3.88 14.34a7.5 7.5 0 01.81-9.64Zm10.6 10.6a7.5 7.5 0 01-9.64.81L16.1 5.65a7.51 7.51 0 01-.81 9.64Z"
        />
    );
}

export function FlatArrowIcon({ size, color }: IconProps) {
    return (
        <Svg
            size={size}
            fill={color}
            d="M19.6287 4.74605C19.3815 4.49861 19.0885 4.375 18.7498 4.375H1.25009C0.911336 4.375 0.61848 4.49861 0.371047 4.74605C0.123614 4.99375 0 5.28661 0 5.62516C0 5.96365 0.123614 6.2565 0.371047 6.504L9.12095 15.2539C9.36866 15.5013 9.66152 15.6252 10 15.6252C10.3385 15.6252 10.6316 15.5013 10.8788 15.2539L19.6287 6.50394C19.8759 6.2565 20 5.96365 20 5.62509C20 5.28661 19.8759 4.99375 19.6287 4.74605Z"
        />
    );
}
