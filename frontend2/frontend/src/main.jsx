import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { PatientProvider } from "./context/PatientContext";
import { ToastProvider } from "./components/common/Toast";
import "./index.css"; // Assuming you have Tailwind directives here

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PatientProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </PatientProvider>
  </React.StrictMode>
);
