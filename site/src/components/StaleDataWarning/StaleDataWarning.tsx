import styles from "./StaleDataWarning.module.scss";
import cn from "classnames";
import { useLanguage } from "../../i18n.ts";

interface StaleDataWarningProps {
    isError: boolean;
}

const StaleDataWarning = ({ isError }: StaleDataWarningProps) => {
    const { t } = useLanguage();

    return (
        <div
            className={cn(styles.staleDataWarning, {
                [styles.staleDataWarningError]: isError,
            })}
        >
            {isError ? t("staleError") : t("staleUpdating")}
        </div>
    );
};

export default StaleDataWarning;