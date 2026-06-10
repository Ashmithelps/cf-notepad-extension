import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Popup } from "./Popup";

const el = document.getElementById("root");
if (el) {
  createRoot(el).render(
    <StrictMode>
      <Popup />
    </StrictMode>,
  );
}
