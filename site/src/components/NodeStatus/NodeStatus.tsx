import Tippy from "@tippyjs/react";
import "tippy.js/dist/tippy.css";
import { BUCKET_CLASS } from "../../data/constants.ts";
import { getProbeLabel, type NodeView, nodeBuckets } from "../../data/nodes.ts";
import { useLanguage } from "../../i18n.ts";
import Flag from "../Flag/Flag.tsx";
import styles from "../Status/Status.module.scss";
import StatusTooltip from "../StatusTooltip/StatusTooltip.tsx";

const BLOCKS = 60;

const NodeStatus = ({ nodes }: { nodes: NodeView[] }) => {
    const { t, tf } = useLanguage();

    return (
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
                    <div className={styles.requests}>
                        {nodeBuckets(logs, BLOCKS).map((bucket) => (
                            <Tippy
                                key={bucket.time}
                                content={
                                    <StatusTooltip
                                        time={bucket.time}
                                        summary={
                                            bucket.rtt !== null
                                                ? tf("nodeAvgPing", {
                                                      value: `${bucket.rtt.toFixed(2)} ${t("unitMs")}`,
                                                  })
                                                : null
                                        }
                                        lines={bucket.problems.map(
                                            (problem) => ({
                                                key: `${problem.country}-${problem.city}-${problem.network}`,
                                                country: problem.country,
                                                label: `${problem.city ? getProbeLabel(problem.city) : t("domainUnknownCity")}${problem.network ? ` · ${problem.network}` : ""}`,
                                                result:
                                                    problem.loss >= 100
                                                        ? t("nodeNoReply")
                                                        : tf("nodeProbeLoss", {
                                                              n: problem.loss.toFixed(
                                                                  0
                                                              ),
                                                          }),
                                                value:
                                                    problem.rtt !== null
                                                        ? `${problem.rtt.toFixed(2)} ${t("unitMs")}`
                                                        : null,
                                            })
                                        )}
                                    />
                                }
                            >
                                <div
                                    className={`${styles.requestBlock} ${styles[BUCKET_CLASS[bucket.status]]}`}
                                />
                            </Tippy>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default NodeStatus;
