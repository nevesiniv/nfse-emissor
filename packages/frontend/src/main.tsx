import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#111827",
            color: "#F1F5F9",
            border: "1px solid #1E293B",
            borderRadius: "0.75rem",
            padding: "12px 16px",
            fontSize: "14px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.4)",
            animation: "toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          },
          success: {
            iconTheme: {
              primary: "#10B981",
              secondary: "#111827",
            },
          },
          error: {
            iconTheme: {
              primary: "#EF4444",
              secondary: "#111827",
            },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
