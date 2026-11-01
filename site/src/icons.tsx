import type { Language } from "./i18n.ts";
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

export function SettingsIcon({ size, color }: IconProps) {
    return (
        <Svg
            size={size}
            fill={color}
            d="m19.41 12.19-1.84-1.44c.02-.22.04-.48.04-.76 0-.27-.02-.53-.04-.76l1.84-1.44a.9.9 0 00.22-1.15L17.72 3.35a.89.89 0 00-1.11-.4l-2.17.87a7.45 7.45 0 00-1.3-.76l-.33-2.3A.89.89 0 0011.92 0H8.08c-.45 0-.83.33-.88.76l-.33 2.31a7.68 7.68 0 00-1.3.75l-2.18-.87c-.41-.16-.9.02-1.1.39L.37 6.65A.9.9 0 00.59 7.81l1.84 1.44c-.03.28-.04.53-.04.75 0 .23.01.47.04.76L.59 12.19a.9.9 0 00-.22 1.15l1.91 3.31a.89.89 0 001.11.4l2.17-.87c.42.3.85.55 1.3.76l.33 2.3a.89.89 0 00.88.77h3.84c.45 0 .83-.33.88-.76l.33-2.31a7.72 7.72 0 001.3-.76l2.18.87a.88.88 0 001.1-.39l1.92-3.32a.9.9 0 00-.22-1.14ZM10 13.33A3.34 3.34 0 016.66 10 3.34 3.34 0 0110 6.67 3.34 3.34 0 0113.34 10 3.34 3.34 0 0110 13.33Z"
        />
    );
}

export function LanguageIcon({ size, color }: IconProps) {
    return (
        <Svg
            size={size}
            fill={color}
            d="m8.78 0-.1.02h-.02.04-.06.02l-.08.01-.2.03-.35.07A9.7 9.7 0 006.2.67L6.09.72c-.75.32-1.47.73-2.12 1.22L3.89 2v.03H3.86v.01c-.57.46-1.1.97-1.57 1.54l-.15.17c-.01.02-.04.09-.08.1l-.2.29c-.4.55-.73 1.14-1 1.74L.78 6.05.76 6.09V6.1H.78L.76 6.14.7 6.3H5.89A16.48 16.48 0 018.79 0ZM5.69 12.68c-.29-1.76-.29-3.56-.02-5.32H.35l-.09.35c-.06.28-.12.57-.16.86l-.02.1v.06l-.03.2c-.08.78-.07 1.56.02 2.33l.02.1.01.07.03.2c.06.35.13.7.23 1.05H5.7Zm7.75-2.97c.02.72-.01 1.43-.11 2.14l-.02.15v.12l-.1.56H6.75v-.04l-.1-.53v-.1l-.02-.16C6.5 10.73 6.5 9.59 6.6 8.47l.02-.26.03-.3.08-.54h6.5l.09.53V8l.02.15.04.36c.03.4.06.8.06 1.2ZM13 6.3l.02-.01c-.16-.68-.38-1.35-.63-2.01l-.13-.3V3.97l-.01-.01V3.95A15.95 15.95 0 0010.31.57L10.27.53V.52L10.25.51V.5L10.18.41 10 .18l-.07.1L9.75.5H9.72V.53l-.03.05-.1.1c-.7.98-1.32 2.02-1.8 3.14-.02.04-.02.08-.06.12l.01.01v.01l-.03.07c-.29.73-.53 1.49-.73 2.27H13Zm6.29 0-.07-.2-.05-.11c-.24-.54-.52-1.06-.84-1.56l-.23-.34-.13-.16-.07-.1V3.82c-.5-.62-1.07-1.2-1.67-1.72l-.1-.07L16.08 2h-.01c-.65-.5-1.36-.92-2.12-1.26L13.89.72V.73l-.01.02V.71L13.73.65c-.77-.3-1.57-.52-2.38-.64h-.03V0H11.2a16.6 16.6 0 012.9 6.3h5.17Zm.68 3.4h.02c.02.51-.01 1.02-.08 1.52l-.02.1v.06c-.07.44-.15.89-.27 1.29H14.3a17 17 0 000-5.3h5.33c.1.36.18.73.24 1.1l.03.15v.06c.04.34.07.68.07 1.02Zm-.7 4.05H14.11a16.5 16.5 0 01-2.9 6.24h.04l.06-.01c.87-.12 1.74-.36 2.57-.7l.07-.03a10.58 10.58 0 002.19-1.31l.07-.06.14-.11.3-.27c.4-.37.78-.76 1.12-1.18l.12-.15a9.77 9.77 0 001.32-2.28l.06-.12v-.02Zm-6.29 0H6.96c.19.79.44 1.55.76 2.29v.02a16 16 0 001.95 3.37l.03.04h.02v.02h.01v.01h.01l.08.12.15.18.02.02.04-.06.18-.22.03-.04.01-.01v-.03l.1-.1a16.1 16.1 0 001.9-3.32v-.02l.1-.25c.27-.66.48-1.33.64-2.02ZM8.79 20C7.4 18.14 6.42 16.02 5.9 13.76H.71c.01.07.03.08.04.12l.02.02v.02l.02.05.15.33c.29.61.64 1.18 1.04 1.71l.1.14.08.1A10.5 10.5 0 003.9 17.98l.07.06.16.11a9.76 9.76 0 001.65.98l.17.08.1.05.02.01h.02l.05.02.08.04c.75.3 1.55.52 2.35.64l.1.01.02.01.1.01Z"
        />
    );
}

export function FlagIcon({ language, size = 16 }: { language: Language; size?: number }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={(size * 2) / 3}
            viewBox="0 0 3 2"
            style={{ borderRadius: 2, flexShrink: 0 }}
        >
            {FLAGS[language]}
        </svg>
    );
}

const FLAGS: Record<Language, ReactNode> = {
    ru: (
        <>
            <rect fill="#fff" height="2" width="3" />
            <rect fill="#0039a6" height="0.667" width="3" y="0.667" />
            <rect fill="#d52b1e" height="0.667" width="3" y="1.333" />
        </>
    ),
    uk: (
        <>
            <rect fill="#0057b7" height="1" width="3" />
            <rect fill="#ffd700" height="1" width="3" y="1" />
        </>
    ),
    en: (
        <svg width="3" height="2" viewBox="0 0 60 30" preserveAspectRatio="xMidYMid slice">
            <rect fill="#012169" height="30" width="60" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
            <path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" strokeWidth="2.5" />
            <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
            <path d="M30,0 v30 M0,15 h60" stroke="#c8102e" strokeWidth="6" />
        </svg>
    ),
};
