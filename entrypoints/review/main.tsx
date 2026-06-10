import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReviewQueue } from "./ReviewQueue";

const el = document.getElementById("root");
if (el) {
  createRoot(el).render(
    <StrictMode>
      <ReviewQueue />
    </StrictMode>,
  );
}
