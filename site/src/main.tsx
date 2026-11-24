import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./main.scss";
import Footer from "./components/Footer/Footer.tsx";
import Home from "./pages/home.tsx";
import Sites from "./pages/sites.tsx";
import Vpn from "./pages/vpn.tsx";
import VpnNode from "./pages/node.tsx";
import Domain from "./pages/domain.tsx";
import DownDetector from "./pages/downDetector.tsx";
import Header from "./components/Header/Header.tsx";
import StaleDataWarning from "./components/StaleDataWarning/StaleDataWarning.tsx";
import {
    DataStatusProvider,
    useDataStatus,
} from "./context/DataStatusContext.tsx";
import { DashboardSettingsProvider } from "./context/DashboardSettingsContext.tsx";
import { isBareView } from "./data/constants.ts";

function App() {
    const { isAnyError, isAnyStale } = useDataStatus();
    const bare = isBareView();

    return (
        <>
            {!bare && <Header />}
            <div className="app-container">
                {(isAnyStale || isAnyError) && (
                    <StaleDataWarning isError={isAnyError} />
                )}
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/sites" element={<Sites />} />
                    <Route path="/vpn" element={<Vpn />} />
                    <Route path="/vpn/:key" element={<VpnNode />} />
                    <Route path="/downdetector" element={<DownDetector />} />
                    <Route path="/:domain" element={<Domain />} />
                </Routes>
            </div>
            {!bare && <Footer />}
        </>
    );
}

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
