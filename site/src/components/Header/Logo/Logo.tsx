import React, { useEffect, useState } from "react";
import styles from "./Logo.module.scss";

interface Segment {
    id: number;
    ok: boolean;
}

const Logo: React.FC = () => {
    const [segments, setSegments] = useState<Segment[]>(createSegments);
    const [rotating, setRotating] = useState<boolean>(false);

    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            return;
        }
        let timeout: number | undefined;
        const interval = window.setInterval(() => {
            const ok = Math.random() >= FAIL_CHANCE;
            setRotating(true);
            timeout = window.setTimeout(() => {
                setSegments((prev) => [
                    ...prev.slice(1),
                    { id: prev[prev.length - 1].id + 1, ok },
                ]);
                setRotating(false);
            }, ADVANCE_MS);
        }, ADVANCE_INTERVAL_MS);
        return () => {
            window.clearInterval(interval);
            window.clearTimeout(timeout);
        };
    }, []);

    return (
        <svg
            className={styles.logo}
            viewBox="0 0 400 400"
            width={44}
            height={44}
            role="img"
            aria-label="YummyStatus Logo"
        >
            <g className={rotating ? styles.ringRotating : styles.ring}>
                {segments.map((segment, index) => (
                    <path
                        key={segment.id}
                        className={
                            segment.id >= SEGMENT_COUNT && index === SEGMENT_COUNT - 1
                                ? styles.fresh
                                : undefined
                        }
                        d={SEGMENT_PATHS[index]}
                        fill="none"
                        stroke={segment.ok ? COLOR_OK : COLOR_FAIL}
                        strokeWidth={RING_WIDTH}
                    />
                ))}
            </g>
            <g fill={COLOR_OK} transform={PLUG_TRANSFORM}>
                <g className={styles.halfA}>
                    {PLUG_PATHS.slice(6, 10).map((d) => (
                        <path key={d} d={d} />
                    ))}
                </g>
                <g className={styles.halfB}>
                    {PLUG_PATHS.slice(10, 12).map((d) => (
                        <path key={d} d={d} />
                    ))}
                </g>
                <g className={styles.sparks}>
                    {PLUG_PATHS.slice(0, 6).map((d) => (
                        <path key={d} d={d} />
                    ))}
                </g>
            </g>
        </svg>
    );
};

const COLOR_OK = "#FF6666";
const COLOR_FAIL = "#575757";
const SEGMENT_COUNT = 36;
const BAD_INDICES: number[] = [7, 19, 20];
const RING_WIDTH = 30;
const RING_GAP = 3.2;
const FAIL_CHANCE = 0.12;
const ADVANCE_MS = 850;
const ADVANCE_INTERVAL_MS = 60000;
const PLUG_TRANSFORM = "translate(200 200) scale(0.9) translate(-200 -200)";

const PLUG_PATHS: string[] = [
    "M118.411 174.479H124.687C132.45 174.193 132.451 163.047 124.687 162.761H118.411C110.649 163.047 110.648 174.193 118.411 174.479Z",
    "M281.589 225.521H275.312C267.55 225.807 267.549 236.953 275.312 237.24H281.589C289.351 236.953 289.352 225.807 281.589 225.521Z",
    "M168.62 130.547C171.856 130.547 174.479 127.923 174.479 124.687V118.411C174.193 110.649 163.047 110.648 162.761 118.411V124.687C162.761 127.923 165.384 130.547 168.62 130.547Z",
    "M231.38 269.453C228.144 269.453 225.521 272.077 225.521 275.312V281.589C225.807 289.351 236.953 289.352 237.239 281.589V275.312C237.239 272.077 234.616 269.453 231.38 269.453Z",
    "M133.404 141.692C139.088 146.987 146.981 139.117 141.703 133.418L137.278 128.98C131.594 123.685 123.701 131.553 128.979 137.254L133.404 141.692Z",
    "M266.596 258.308C260.912 253.014 253.019 260.882 258.297 266.582L262.722 271.02C268.406 276.315 276.299 268.446 271.021 262.746L266.596 258.308Z",
    "M121.01 261.242C119.623 259.857 118.319 258.391 117.105 256.852L101.716 272.241C99.4277 274.53 99.4277 278.239 101.716 280.528L119.472 298.284C121.76 300.572 125.47 300.572 127.759 298.284L143.143 282.9C139.965 280.663 124.139 264.218 121.01 261.242Z",
    "M163.617 183.134L181.369 200.885L190.845 191.411C195.719 186.535 195.774 178.589 190.845 173.658C185.954 168.767 177.985 168.758 173.081 173.663L163.617 183.134Z",
    "M226.343 209.156C221.452 204.265 213.483 204.256 208.579 209.161L199.116 218.63L216.868 236.382L226.343 226.909C231.218 222.033 231.272 214.087 226.343 209.156Z",
    "M150.891 186.981C148.604 184.694 144.896 184.692 142.608 186.977L129.302 200.292C114.72 214.856 114.738 238.416 129.301 252.961L147.032 270.713C161.564 285.228 185.199 285.213 199.724 270.705L213.02 257.4C215.31 255.114 215.313 251.4 213.024 249.11L150.891 186.981Z",
    "M298.284 119.472L280.528 101.716C278.239 99.4277 274.53 99.4277 272.241 101.716L256.857 117.1C258.397 118.311 259.864 119.611 261.25 120.995C264.298 124.203 280.573 139.907 282.895 143.148L298.284 127.759C300.572 125.47 300.572 121.76 298.284 119.472Z",
    "M270.698 199.708C285.282 185.142 285.26 161.583 270.698 147.039L252.968 129.287C238.443 114.779 214.809 114.779 200.276 129.295L186.98 142.599C184.69 144.885 184.686 148.6 186.976 150.889L249.109 213.019C251.396 215.306 255.103 215.307 257.391 213.023L270.698 199.708Z",
];

function createSegments(): Segment[] {
    return Array.from({ length: SEGMENT_COUNT }, (_, id) => ({
        id,
        ok: !BAD_INDICES.includes(id),
    }));
}

function point(angle: number, radius: number): string {
    const rad = (angle * Math.PI) / 180;
    return `${(200 + radius * Math.cos(rad)).toFixed(2)} ${(200 + radius * Math.sin(rad)).toFixed(2)}`;
}

function createSegmentPath(index: number): string {
    const step = 360 / SEGMENT_COUNT;
    const radius = 200 - RING_WIDTH / 2 - 1;
    const start = -90 + index * step + RING_GAP / 2;
    return `M${point(start, radius)}A${radius} ${radius} 0 0 1 ${point(start + step - RING_GAP, radius)}`;
}

const SEGMENT_PATHS: string[] = Array.from({ length: SEGMENT_COUNT }, (_, index) =>
    createSegmentPath(index)
);

export default Logo;
