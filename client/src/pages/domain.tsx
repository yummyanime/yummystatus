import React from "react";
import { useParams } from "react-router-dom";
import Dashboard from "../components/Dashboard/Dashboard.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";

const Domain: React.FC = () => {
    const { domain } = useParams<{ domain: string }>();

    usePageMeta(
        `Статус ${domain} — YummyUptime`,
        `Доступность и время отклика ${domain}: аптайм, скорость загрузки и статус по странам в реальном времени.`
    );

    return <Dashboard />;
};

export default Domain;
