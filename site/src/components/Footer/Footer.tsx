import React from "react";
import { useLanguage, type Dictionary } from "../../i18n.ts";
import styles from "./Footer.module.scss";

const errorCodes: { code: number; labelKey: keyof Dictionary }[] = [
    { code: 901, labelKey: "footerCode901" },
    { code: 902, labelKey: "footerCode902" },
    { code: 903, labelKey: "footerCode903" },
    { code: 904, labelKey: "footerCode904" },
    { code: 905, labelKey: "footerCode905" },
    { code: 906, labelKey: "footerCode906" },
    { code: 907, labelKey: "footerCode907" },
    { code: 908, labelKey: "footerCode908" },
];

const Footer: React.FC = () => {
    const { t, tf } = useLanguage();
    const currentYear = new Date().getFullYear();
    const yearText = currentYear === 2025 ? "2025" : `2025-${currentYear}`;

    return (
        <footer className={styles.footer}>
            <div className={styles.inner}>
                <div className={styles.codes}>
                    <span className={styles.codesTitle}>
                        {t("footerCodesTitle")}
                    </span>
                    <ul className={styles.codesList}>
                        {errorCodes.map(({ code, labelKey }) => (
                            <li key={code} className={styles.codeItem}>
                                <span className={styles.codeBadge}>{code}</span>
                                <span className={styles.codeLabel}>{t(labelKey)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className={styles.copyright}>
                <p className={styles.text}>
                    {tf("footerCopyright", { years: yearText })}
                </p>
            </div>
        </footer>
    );
};

export default Footer;
