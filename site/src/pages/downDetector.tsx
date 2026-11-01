import React, { useCallback, useEffect, useState } from "react";
import ReportBlock from "../components/ReportBlock/ReportBlock.tsx";
import ReportChart from "../components/ReportChart/ReportChart.tsx";
import ReportList from "../components/ReportList/ReportList.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { api, type OutageData } from "../api.ts";
import { useLanguage } from "../i18n.ts";

const DownDetector: React.FC = () => {
    const { t } = useLanguage();

    usePageMeta(t("metaDownDetectorTitle"), t("metaDownDetectorDescription"));

    const [data, setData] = useState<OutageData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await api["outage-reports"].$get();
            if (res.ok) {
                setData(await res.json());
            }
        } catch (e) {
            console.error("Error fetching outage reports:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    return (
        <>
            <ReportBlock onReported={fetchData} />
            <ReportChart data={data} loading={loading} />
            <ReportList data={data} loading={loading} />
        </>
    );
};

export default DownDetector;
