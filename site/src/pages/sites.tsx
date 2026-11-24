import type React from "react";
import Dashboard from "../components/Dashboard/Dashboard.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { useLanguage } from "../i18n.ts";

const Sites: React.FC = () => {
    const { t } = useLanguage();

    usePageMeta(t("metaHomeTitle"), t("metaHomeDescription"));

    return <Dashboard />;
};

export default Sites;
