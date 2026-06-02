import React from "react";
import styles from "./Footer.module.scss";

const errorCodes = [
    { code: 901, label: "Сбой пробы (неизвестная причина)" },
    { code: 902, label: "Таймаут соединения" },
    { code: 903, label: "Ошибка DNS (домен не разрешился)" },
    { code: 904, label: "Превышен лимит запросов к сервису измерений" },
    { code: 905, label: "Измеритель недоступен" },
    { code: 906, label: "Соединение отклонено или сброшено" },
    { code: 907, label: "Ошибка TLS / сертификата" },
];

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const yearText = currentYear === 2025 ? "2025" : `2025-${currentYear}`;

    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.codes}>
                    <span className={styles.codesTitle}>
                        Особые коды 9xx — сбои измерения сервиса
                    </span>
                    <ul className={styles.codesList}>
                        {errorCodes.map(({ code, label }) => (
                            <li key={code} className={styles.codeItem}>
                                <span className={styles.codeBadge}>{code}</span>
                                <span className={styles.codeLabel}>{label}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className={styles.copyright}>
                <p className={styles.text}>
                    Yummy Uptime {yearText}. Создано специально для проектов Yummy.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
