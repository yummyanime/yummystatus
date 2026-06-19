import React from "react";
import { useParams } from "react-router-dom";
import Dashboard from "../components/Dashboard/Dashboard.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { getDomainLabel } from "../data/constants.ts";

const Domain: React.FC = () => {
    const { domain } = useParams<{ domain: string }>();
    const domainLabel = domain ? getDomainLabel(domain) : domain;

    usePageMeta(
        `Статус ${domainLabel} — YummyUptime`,
        `Доступность и время отклика ${domainLabel}: аптайм, скорость загрузки и статус по странам в реальном времени.`
    );

    return <Dashboard />;
};

export default Domain;
