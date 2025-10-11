import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "@/react-app/pages/Home";
import Register from "@/react-app/pages/auth/Register";
import Login from "@/react-app/pages/auth/Login";
import Funnel from "@/react-app/pages/Funnel";
import FunnelSummary from "@/react-app/pages/FunnelSummary";
import Dashboard from "@/react-app/pages/Dashboard";
import AdminDashboard from "@/react-app/pages/admin/AdminDashboard";
import AdminUsersPage from "@/react-app/pages/admin/AdminUsersPage"; // Importando as novas páginas
import AdminProjectsSubscriptionsPage from "@/react-app/pages/admin/AdminProjectsSubscriptionsPage";
import AdminReportsAnalyticsPage from "@/react-app/pages/admin/AdminReportsAnalyticsPage";
import AdminSettingsPage from "@/react-app/pages/admin/AdminSettingsPage";
import PrivacyPolicy from "@/react-app/pages/PrivacyPolicy"; // Importando a nova página de Políticas de Privacidade
import ProtectedRoute from "@/react-app/components/ProtectedRoute";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/funnel" element={<Funnel />} />
        <Route path="/funnel/summary" element={<FunnelSummary />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} /> {/* Nova rota */}
        
        {/* Rota Protegida para o Dashboard do Cliente */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['client', 'admin']} redirectPath="/login">
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas Protegidas para o Painel do Administrador */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectPath="/login">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/users" 
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectPath="/login">
              <AdminUsersPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/projects-subscriptions" 
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectPath="/login">
              <AdminProjectsSubscriptionsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/reports-analytics" 
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectPath="/login">
              <AdminReportsAnalyticsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/settings" 
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectPath="/login">
              <AdminSettingsPage />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}