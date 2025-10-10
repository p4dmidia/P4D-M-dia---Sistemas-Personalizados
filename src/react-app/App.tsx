import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Changed to react-router-dom
import HomePage from "@/react-app/pages/Home";
import Register from "@/react-app/pages/auth/Register";
import Login from "@/react-app/pages/auth/Login";
import Funnel from "@/react-app/pages/Funnel";
import FunnelSummary from "@/react-app/pages/FunnelSummary";
import Dashboard from "@/react-app/pages/Dashboard";
import AdminDashboard from "@/react-app/pages/admin/AdminDashboard"; // Import the new AdminDashboard component
import ProtectedRoute from "@/react-app/components/ProtectedRoute"; // Import ProtectedRoute

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/funnel" element={<Funnel />} />
        <Route path="/funnel/summary" element={<FunnelSummary />} />
        
        {/* Rota Protegida para o Dashboard do Cliente */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['client', 'admin']} redirectPath="/login">
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota Protegida para o Dashboard do Administrador */}
        <Route 
          path="/admin/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['admin']} redirectPath="/login">
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}