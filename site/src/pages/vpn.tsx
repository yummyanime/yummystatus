import type React from "react";
import VpnDashboard from "../components/VpnDashboard/VpnDashboard.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { useLanguage } from "../i18n.ts";

const Vpn: React.FC = () => {
    const { t } = useLanguage();

    usePageMeta(t("metaVpnTitle"), t("metaVpnDescription"));

    return <VpnDashboard />;
};

export default Vpn;
