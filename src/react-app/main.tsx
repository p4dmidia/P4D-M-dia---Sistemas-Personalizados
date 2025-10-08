import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@/react-app/index.css";
import App from "@/react-app/App.tsx";
import ToastProvider from "@/react-app/components/ToastProvider"; // Import ToastProvider

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ToastProvider /> {/* Wrap App with ToastProvider */}
    <App />
  </StrictMode>
);