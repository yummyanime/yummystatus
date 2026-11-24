import type { BucketStatus } from "../../api.ts";
import { BUCKET_CLASS } from "../../data/constants.ts";
import styles from "../Status/Status.module.scss";

const StatusBlocks = ({ buckets }: { buckets: BucketStatus[] }) => (
    <div className={`${styles.requests} ${styles.static}`}>
        {buckets.map((status, index) => (
            <div
                // biome-ignore lint/suspicious/noArrayIndexKey: blocks are positional and have no identity
                key={index}
                className={`${styles.requestBlock} ${styles[BUCKET_CLASS[status]]}`}
            />
        ))}
    </div>
);

export default StatusBlocks;
