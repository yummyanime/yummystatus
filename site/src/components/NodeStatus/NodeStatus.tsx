import { type NodeView, nodeBuckets } from "../../data/nodes.ts";
import Flag from "../Flag/Flag.tsx";
import styles from "../Status/Status.module.scss";
import StatusBlocks from "../StatusBlocks/StatusBlocks.tsx";

const BLOCKS = 60;

const NodeStatus = ({ nodes }: { nodes: NodeView[] }) => (
    <div className={`${styles.statusContainer} ${styles.nodes}`}>
        {nodes.map(({ key, country, name, level, logs }) => (
            <div key={key} className={styles.domainSection}>
                <div className={styles.domainTitle}>
                    <span
                        className={`${styles.statusCircle} ${styles[level]}`}
                    />
                    <Flag country={country} />
                    <h4>{name}</h4>
                </div>
                <StatusBlocks buckets={nodeBuckets(logs, BLOCKS)} />
            </div>
        ))}
    </div>
);

export default NodeStatus;
