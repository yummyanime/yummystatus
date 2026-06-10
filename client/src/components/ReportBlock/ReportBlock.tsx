import React, { useState } from "react";
import Button from "../Button/Button.tsx";
import { REASONS, type ReasonCode } from "../../data/outage.ts";
import styles from "./ReportBlock.module.scss";

interface ReportBlockProps {
    onReported?: () => void;
}

const ReportBlock: React.FC<ReportBlockProps> = ({ onReported }) => {
    const [selected, setSelected] = useState<ReasonCode | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [justReported, setJustReported] = useState(false);

    const handleSubmit = async () => {
        if (!selected || submitting) return;
        setSubmitting(true);
        try {
            const res = await fetch("/outage-reports", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: selected }),
            });
            if (res.ok) {
                setSelected(null);
                setJustReported(true);
                onReported?.();
            }
        } catch (e) {
            console.error("Error sending outage report:", e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className={styles.block}>
            <h2 className={styles.title}>Сообщить о сбое</h2>
            <div className={styles.reasonButtons}>
                {REASONS.map((r) => (
                    <Button
                        key={r.code}
                        active={selected === r.code}
                        onClick={() => {
                            setSelected(r.code);
                            setJustReported(false);
                        }}
                    >
                        {r.label}
                    </Button>
                ))}
            </div>

            <button
                type="button"
                className={styles.submitButton}
                disabled={!selected || submitting}
                onClick={handleSubmit}
            >
                {submitting ? "Отправляем…" : "Сообщить о сбое"}
            </button>

            {justReported && (
                <div className={styles.thanks}>
                    Спасибо! Ваше сообщение учтено.
                </div>
            )}
        </div>
    );
};

export default ReportBlock;
