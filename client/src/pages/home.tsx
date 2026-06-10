import React from "react";
import Dashboard from "../components/Dashboard/Dashboard.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";

const Home: React.FC = () => {
    usePageMeta(
        "YummyUptime — мониторинг доступности сайтов",
        "Мониторинг доступности сайтов YummyUptime: аптайм, время отклика, статус по странам и отчёты о сбоях в реальном времени."
    );

    return <Dashboard />;
};

export default Home;
