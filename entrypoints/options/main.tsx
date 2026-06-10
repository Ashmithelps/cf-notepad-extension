import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Dashboard } from "./Dashboard";

const el = document.getElementById("root");
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Dashboard />
    </StrictMode>,
  );
}
