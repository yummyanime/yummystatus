import React from "react";
import styles from "./OverviewStatus.module.scss";

interface Log {
    created_at: string;
    domain?: string;
    status_code?: number;
    total_time?: number;
}

interface OverviewStatusProps {
    allLogs: Log[];
}

const OverviewStatus: React.FC<OverviewStatusProps> = ({ allLogs }) => {
    const analyzeStatus = () => {
        if (allLogs.length === 0) return "Все работает стабильно";

        const ignoredCodes = [202, 599, 429];

        // Фильтруем логи, исключая игнорируемые коды и пустые данные
        const relevantLogs = allLogs.filter(
            (log) => log.status_code !== undefined && !ignoredCodes.includes(log.status_code)
        );

        if (relevantLogs.length === 0) return "Все работает стабильно";

        const errorLogs = relevantLogs.filter(
            (log) => log.status_code !== 200 || (log.total_time && log.total_time > 1500)
        );

        const errorRate = (errorLogs.length / relevantLogs.length) * 100;

        // Последние запросы (для проверки 2 или 4 ошибок подряд)
        // Сортируем по времени (новые в конце)
        const sortedLogs = [...relevantLogs].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
        
        const lastLogs = sortedLogs.slice(-4);
        const last4Errors = lastLogs.length >= 4 && lastLogs.every(log => log.status_code !== 200 || (log.total_time && log.total_time > 1500));
        const last2Errors = lastLogs.length >= 2 && lastLogs.slice(-2).every(log => log.status_code !== 200 || (log.total_time && log.total_time > 1500));

        if (errorRate >= 20 || last4Errors) {
            return "Возникли неполадки";
        }

        if (errorRate >= 5 || last2Errors) {
            return "Возможные неполадки";
        }

        return "Все работает стабильно";
    };

    const statusText = analyzeStatus();
    
    let statusClass = styles.stable;
    if (statusText === "Возникли неполадки") statusClass = styles.critical;
    if (statusText === "Возможные неполадки") statusClass = styles.warning;

    return (
        <div className={styles.container}>
            <div className={`${styles.statusBadge} ${statusClass}`}>
                {statusText}
            </div>
        </div>
    );
};

export default OverviewStatus;
