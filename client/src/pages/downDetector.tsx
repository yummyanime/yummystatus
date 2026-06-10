import React, { useCallback, useEffect, useState } from "react";
import ReportBlock from "../components/ReportBlock/ReportBlock.tsx";
import ReportChart from "../components/ReportChart/ReportChart.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import type { OutageData } from "../data/outage.ts";

const DownDetector: React.FC = () => {
    usePageMeta(
        "Сбои и жалобы — YummyUptime DownDetector",
        "Сообщения о сбоях YummyUptime за последние 24 часа: график жалоб пользователей, популярные причины и форма для сообщения о проблеме."
    );

    const [data, setData] = useState<OutageData | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch("/outage-reports");
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
        </>
    );
};

export default DownDetector;
