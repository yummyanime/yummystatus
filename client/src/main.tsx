import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./main.scss";
import App from "./App.tsx";
import { DataStatusProvider } from "./context/DataStatusContext.tsx";
import { DashboardSettingsProvider } from "./context/DashboardSettingsContext.tsx";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <BrowserRouter>
            <DataStatusProvider>
                <DashboardSettingsProvider>
                    <App />
                </DashboardSettingsProvider>
            </DataStatusProvider>
        </BrowserRouter>
    </StrictMode>
);