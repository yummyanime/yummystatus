import React from "react";
import { useParams } from "react-router-dom";
import Dashboard from "../components/Dashboard/Dashboard.tsx";
import { usePageMeta } from "../hooks/usePageMeta.ts";
import { getDomainLabel } from "../data/constants.ts";
import { useLanguage } from "../i18n.ts";

const Domain: React.FC = () => {
    const { domain } = useParams<{ domain: string }>();
    const { tf } = useLanguage();
    const domainLabel = domain ? getDomainLabel(domain) : domain;

    usePageMeta(
        tf("metaDomainTitle", { domain: domainLabel ?? "" }),
        tf("metaDomainDescription", { domain: domainLabel ?? "" })
    );

    return <Dashboard />;
};

export default Domain;
