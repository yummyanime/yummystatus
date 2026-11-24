import type React from "react";
import { useParams } from "react-router-dom";
import NodeDashboard from "../components/NodeDashboard/NodeDashboard.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { useLanguage } from "../i18n.ts";

const VpnNode: React.FC = () => {
    const { key = "" } = useParams<{ key: string }>();
    const { t } = useLanguage();

    usePageMeta(t("metaNodeTitle"), t("metaNodeDescription"));

    return <NodeDashboard key={key} nodeKey={key} />;
};

export default VpnNode;
