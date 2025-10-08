import { BrowserRouter as Router, Routes, Route } from "react-router-dom"; // Changed to react-router-dom
import HomePage from "@/react-app/pages/Home";
import Register from "@/react-app/pages/auth/Register";
import Login from "@/react-app/pages/auth/Login";
import Funnel from "@/react-app/pages/Funnel";
import FunnelSummary from "@/react-app/pages/FunnelSummary";
import Dashboard from "@/react-app/pages/Dashboard"; // Import the new Dashboard component

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/funnel" element={<Funnel />} />
        <Route path="/funnel/summary" element={<FunnelSummary />} />
        {/* Add protected routes for client dashboard and admin panel later */}
        <Route path="/dashboard" element={<Dashboard />} /> {/* Use the new Dashboard component */}
        <Route path="/admin" element={<div>Admin Panel (Coming Soon)</div>} />
      </Routes>
    </Router>
  );
}