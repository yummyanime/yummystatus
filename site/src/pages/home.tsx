import type React from "react";
import HomeDashboard from "../components/HomeDashboard/HomeDashboard.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { useLanguage } from "../i18n.ts";

const Home: React.FC = () => {
    const { t } = useLanguage();

    usePageMeta(t("metaOverviewTitle"), t("metaOverviewDescription"));

    return <HomeDashboard />;
};

export default Home;
