import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@/lib/i18n";

import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import LiveMap from "./pages/LiveMap";
import Drivers from "./pages/Drivers";
import PersonnelPage from "./pages/PersonnelPage";
import Missions from "./pages/Missions";
import Fuel from "./pages/Fuel";
import Maintenance from "./pages/Maintenance";
import Stock from "./pages/Stock";
import TransportBTP from "./pages/TransportBTP";
import TransportTouristique from "./pages/TransportTouristique";
import TransportVoyageurs from "./pages/TransportVoyageurs";
import TransportTMS from "./pages/TransportTMS";
import Clients from "./pages/Clients";
import Revisions from "./pages/Revisions";
import FinancePage from "./pages/FinancePage";
import SettingsPage from "./pages/SettingsPage";
import {
  AchatsPage,
} from "./pages/ComingSoon";
import Alerts from "./pages/Alerts";
import Comptabilite from "./pages/Comptabilite";
import Citerne from "./pages/Citerne";
import Reports from "./pages/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="default" storageKey="vite-ui-theme">
      <TooltipProvider>
        <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
          <Route path="/personnel" element={<ProtectedRoute><PersonnelPage /></ProtectedRoute>} />
          <Route path="/live-map" element={<ProtectedRoute><LiveMap /></ProtectedRoute>} />
          <Route path="/missions" element={<ProtectedRoute><Missions /></ProtectedRoute>} />
          <Route path="/fuel" element={<ProtectedRoute><Fuel /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute><Stock /></ProtectedRoute>} />
          <Route path="/transport-btp" element={<ProtectedRoute><TransportBTP /></ProtectedRoute>} />
          <Route path="/transport-touristique" element={<ProtectedRoute><TransportTouristique /></ProtectedRoute>} />
          <Route path="/transport-voyageurs" element={<ProtectedRoute><TransportVoyageurs /></ProtectedRoute>} />
          <Route path="/transport-tms" element={<ProtectedRoute><TransportTMS /></ProtectedRoute>} />
          <Route path="/clients" element={<ProtectedRoute><Clients /></ProtectedRoute>} />
          <Route path="/revisions" element={<ProtectedRoute><Revisions /></ProtectedRoute>} />
          <Route path="/comptabilite" element={<ProtectedRoute><Comptabilite /></ProtectedRoute>} />
          <Route path="/citerne" element={<ProtectedRoute><Citerne /></ProtectedRoute>} />
          <Route path="/achats" element={<ProtectedRoute><AchatsPage /></ProtectedRoute>} />
          <Route path="/finance" element={<ProtectedRoute><FinancePage /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
